import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import {
  UserRole,
  DonorView,
  RecipientView,
  AdminView,
  FoodDonation,
  Organization,
  DonorProfile,
  ImpactStats,
  SafetyStatus,
  DonationStatus,
} from '../types';
import { SAMPLE_DONORS, SAMPLE_ORGANIZATIONS, INITIAL_DONATIONS } from '../data/mockData';
import { calculateServings, calculateEstimatedKg, calculateCo2eAvoided } from '../services/quantityUtils';
import { auth, db, testFirestoreConnection } from '../services/firebase';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import {
  UserProfileDoc,
  getUserProfile,
  loginWithEmail,
  registerWithEmail,
  loginWithGoogle,
  logoutUser,
  getActiveSession,
} from '../services/authService';
import {
  subscribeDonations,
  subscribeOrganizations,
  subscribeDonors,
  seedInitialDataIfEmpty,
  claimDonationAtomic,
  advanceDonationStageAtomic,
  cancelDonationAtomic,
} from '../services/donationService';
import { doc, setDoc } from 'firebase/firestore';

export interface ToastNotification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
}

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  donorView: DonorView;
  setDonorView: (view: DonorView) => void;
  recipientView: RecipientView;
  setRecipientView: (view: RecipientView) => void;
  adminView: AdminView;
  setAdminView: (view: AdminView) => void;

  donors: DonorProfile[];
  currentDonor: DonorProfile;
  setCurrentDonor: (donor: DonorProfile) => void;

  organizations: Organization[];
  currentRecipient: Organization;
  setCurrentRecipient: (org: Organization) => void;

  donations: FoodDonation[];
  selectedDonationId: string | null;
  setSelectedDonationId: (id: string | null) => void;
  selectedDonation: FoodDonation | null;

  activeDetailDonation: FoodDonation | null;
  setActiveDetailDonation: (donation: FoodDonation | null) => void;

  smartMatchTargetDonation: FoodDonation | null;
  setSmartMatchTargetDonation: (donation: FoodDonation | null) => void;

  isRoleModalOpen: boolean;
  setIsRoleModalOpen: (open: boolean) => void;

  isAuthModalOpen: boolean;
  setIsAuthModalOpen: (open: boolean) => void;

  isImpactModalOpen: boolean;
  setIsImpactModalOpen: (open: boolean) => void;

  // Firebase Auth & Cloud status
  isCloudMode: boolean;
  setIsCloudMode: (cloud: boolean) => void;
  firebaseUser: FirebaseUser | { uid: string; email: string | null; displayName?: string | null } | null;
  userProfile: UserProfileDoc | null;
  authLoading: boolean;

  loginEmail: (e: string, p: string) => Promise<UserProfileDoc | null>;
  registerEmail: (
    e: string,
    p: string,
    r: 'donor' | 'recipient',
    entityId?: string,
    name?: string,
    orgName?: string
  ) => Promise<UserProfileDoc>;
  loginGoogle: () => Promise<UserProfileDoc | null>;
  logout: () => Promise<void>;

  toasts: ToastNotification[];
  addToast: (toast: Omit<ToastNotification, 'id'>) => void;
  removeToast: (id: string) => void;

  createDonation: (data: Omit<FoodDonation, 'id' | 'status' | 'currentStageIndex' | 'statusHistory' | 'servingsCount'>) => FoodDonation;
  acceptDonation: (donationId: string, scheduledTime?: string, driver?: string, vehicle?: string) => Promise<boolean>;
  advanceStage: (donationId: string) => Promise<boolean>;
  cancelDonation: (donationId: string, reason: string) => Promise<boolean>;
  reviewDonationSafety: (donationId: string, newSafety: SafetyStatus, notes: string) => void;
  verifyOrgByAdmin: (orgId: string, verified: boolean) => void;
  updateOrgProfile: (updates: Partial<Organization>) => void;

  impactStats: ImpactStats;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'foodbridge_demo_donations_v1';
const LOCAL_STORAGE_ORGS_KEY = 'foodbridge_demo_orgs_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('landing');
  const [donorView, setDonorView] = useState<DonorView>('overview');
  const [recipientView, setRecipientView] = useState<RecipientView>('overview');
  const [adminView, setAdminView] = useState<AdminView>('safety_review');

  const [donors, setDonors] = useState<DonorProfile[]>(SAMPLE_DONORS);
  const [currentDonor, setCurrentDonor] = useState<DonorProfile>(SAMPLE_DONORS[0]);

  // Load organizations
  const [organizations, setOrganizations] = useState<Organization[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_ORGS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return JSON.parse(JSON.stringify(SAMPLE_ORGANIZATIONS));
  });

  const [currentRecipient, setCurrentRecipient] = useState<Organization>(organizations[0]);

  // Load donations with shared local state
  const [donations, setDonations] = useState<FoodDonation[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return JSON.parse(JSON.stringify(INITIAL_DONATIONS));
  });

  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null);
  const [activeDetailDonation, setActiveDetailDonation] = useState<FoodDonation | null>(null);
  const [smartMatchTargetDonation, setSmartMatchTargetDonation] = useState<FoodDonation | null>(null);

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isImpactModalOpen, setIsImpactModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  // Auth state: supports both Firebase Auth and persistent local sessions
  const [firebaseUser, setFirebaseUser] = useState<
    FirebaseUser | { uid: string; email: string | null; displayName?: string | null } | null
  >(null);
  const [userProfile, setUserProfile] = useState<UserProfileDoc | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isCloudMode, setIsCloudMode] = useState(true); // Default to live Firestore sync

  const addToast = (toast: Omit<ToastNotification, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Restore stored session on mount & listen to Firebase Auth
  useEffect(() => {
    // 1. Check for stored active session in localStorage
    const activeSession = getActiveSession();
    if (activeSession) {
      setUserProfile(activeSession);
      setFirebaseUser({
        uid: activeSession.id,
        email: activeSession.email,
        displayName: activeSession.displayName || null,
      });
      setRole(activeSession.role);
      if (activeSession.role === 'donor') {
        const matched = donors.find(
          (d) => d.id === activeSession.entityId || d.name === activeSession.orgName
        );
        if (matched) setCurrentDonor(matched);
      } else if (activeSession.role === 'recipient') {
        const matched = organizations.find(
          (o) => o.id === activeSession.entityId || o.name === activeSession.orgName
        );
        if (matched) setCurrentRecipient(matched);
      }
    }

    // 2. Listen to real Firebase Auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setFirebaseUser(user);
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
            setRole(profile.role);
            if (profile.role === 'donor' && profile.entityId) {
              const matchedDonor = donors.find((d) => d.id === profile.entityId);
              if (matchedDonor) setCurrentDonor(matchedDonor);
            } else if (profile.role === 'recipient' && profile.entityId) {
              const matchedOrg = organizations.find((o) => o.id === profile.entityId);
              if (matchedOrg) setCurrentRecipient(matchedOrg);
            }
          }
        } catch {
          // fallback
        }
      } else {
        const currentActive = getActiveSession();
        if (!currentActive) {
          setFirebaseUser(null);
          setUserProfile(null);
        }
      }
      setAuthLoading(false);
    });

    return () => unsubscribe();
  }, [donors, organizations]);

  // Connect to Cloud Firestore & Listen to real-time changes if in Cloud Mode
  useEffect(() => {
    if (!isCloudMode) return;

    // Test connection & seed initial demo data if Firestore is empty
    testFirestoreConnection().then((connected) => {
      if (connected) {
        seedInitialDataIfEmpty();
      }
    });

    const unsubDonations = subscribeDonations((cloudDonations) => {
      if (cloudDonations.length > 0) {
        setDonations(cloudDonations);
      }
    });

    const unsubOrgs = subscribeOrganizations((cloudOrgs) => {
      if (cloudOrgs.length > 0) {
        setOrganizations(cloudOrgs);
      }
    });

    const unsubDonors = subscribeDonors((cloudDonors) => {
      if (cloudDonors.length > 0) {
        setDonors(cloudDonors);
      }
    });

    return () => {
      unsubDonations();
      unsubOrgs();
      unsubDonors();
    };
  }, [isCloudMode]);

  // Sync to localStorage as local fallback
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(donations));
    } catch {
      // ignore
    }
  }, [donations]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_ORGS_KEY, JSON.stringify(organizations));
    } catch {
      // ignore
    }
  }, [organizations]);

  // Auth actions
  const loginEmail = async (email: string, pass: string) => {
    const profile = await loginWithEmail(email, pass);
    if (profile) {
      setUserProfile(profile);
      setFirebaseUser({
        uid: profile.id,
        email: profile.email,
        displayName: profile.displayName || null,
      });
      setRole(profile.role);
      if (profile.role === 'donor') {
        setDonorView('overview');
        const matched = donors.find(
          (d) => d.id === profile.entityId || d.name === profile.orgName
        );
        if (matched) setCurrentDonor(matched);
        else if (profile.orgName) {
          const newDonor: DonorProfile = {
            id: profile.id,
            name: profile.orgName,
            type: 'Restaurant',
            address: 'Metro Food Hub',
            area: 'Central Commercial Zone',
            contactPerson: profile.displayName || 'Establishment Manager',
            contactPhone: '+91 98000 12345',
            verified: true,
          };
          setDonors((prev) => [newDonor, ...prev]);
          setCurrentDonor(newDonor);
        }
      } else if (profile.role === 'recipient') {
        setRecipientView('overview');
        const matched = organizations.find(
          (o) => o.id === profile.entityId || o.name === profile.orgName
        );
        if (matched) setCurrentRecipient(matched);
        else if (profile.orgName) {
          const newOrg: Organization = {
            id: profile.id,
            name: profile.orgName,
            type: 'Shelter',
            verified: true,
            verificationNumber: `NGO-${Date.now().toString().slice(-4)}`,
            address: 'City Community Center',
            serviceArea: 'Central Metro',
            maxDailyCapacityKg: 100,
            currentDailyAllocatedKg: 0,
            storageCapabilities: ['Hot-hold (>60°C)', 'Refrigerated (0-4°C)', 'Ambient / Room Temp'],
            transportVehicles: ['Standard Van'],
            dietaryPreferences: ['Pure Veg', 'Non-Veg / Halal'],
            contactPerson: profile.displayName || 'Shelter Director',
            contactPhone: '+91 98000 54321',
            operatingHours: '8:00 AM - 10:00 PM',
            refrigeratedVanAvailable: true,
          };
          setOrganizations((prev) => [newOrg, ...prev]);
          setCurrentRecipient(newOrg);
        }
      } else if (profile.role === 'admin') {
        setAdminView('safety_review');
      }
      addToast({
        type: 'success',
        title: 'Signed In',
        message: `Welcome back, ${profile.displayName || profile.email}! Signed in as ${profile.role.toUpperCase()}.`,
      });
    }
    return profile;
  };

  const registerEmail = async (
    email: string,
    pass: string,
    userRole: 'donor' | 'recipient',
    entityId?: string,
    name?: string,
    orgName?: string
  ) => {
    const profile = await registerWithEmail(email, pass, userRole, entityId, name, orgName);
    if (profile) {
      setUserProfile(profile);
      setFirebaseUser({
        uid: profile.id,
        email: profile.email,
        displayName: profile.displayName || null,
      });
      setRole(profile.role);
      if (profile.role === 'donor') {
        setDonorView('overview');
        if (orgName) {
          const newDonor: DonorProfile = {
            id: profile.id,
            name: orgName,
            type: 'Restaurant',
            address: 'Metro Commercial District',
            area: 'Metro Central',
            contactPerson: name || 'Manager',
            contactPhone: '+91 98111 22334',
            verified: true,
          };
          setDonors((prev) => [newDonor, ...prev]);
          setCurrentDonor(newDonor);
        }
      } else if (profile.role === 'recipient') {
        setRecipientView('overview');
        if (orgName) {
          const newOrg: Organization = {
            id: profile.id,
            name: orgName,
            type: 'Shelter',
            verified: true,
            verificationNumber: `NGO-${Date.now().toString().slice(-4)}`,
            address: 'Community Support Center',
            serviceArea: 'Central Metro',
            maxDailyCapacityKg: 100,
            currentDailyAllocatedKg: 0,
            storageCapabilities: ['Hot-hold (>60°C)', 'Refrigerated (0-4°C)', 'Ambient / Room Temp'],
            transportVehicles: ['Standard Van'],
            dietaryPreferences: ['Pure Veg', 'Non-Veg / Halal'],
            contactPerson: name || 'Director',
            contactPhone: '+91 98222 33445',
            operatingHours: '8:00 AM - 10:00 PM',
            refrigeratedVanAvailable: true,
          };
          setOrganizations((prev) => [newOrg, ...prev]);
          setCurrentRecipient(newOrg);
        }
      }
      addToast({
        type: 'success',
        title: 'Account Created',
        message: `Welcome, ${profile.displayName || profile.email}! Registered as ${profile.role.toUpperCase()}.`,
      });
    }
    return profile;
  };

  const loginGoogle = async () => {
    const profile = await loginWithGoogle();
    if (profile) {
      setUserProfile(profile);
      setFirebaseUser({
        uid: profile.id,
        email: profile.email,
        displayName: profile.displayName || null,
      });
      setRole(profile.role);
      if (profile.role === 'donor') {
        setDonorView('overview');
      } else if (profile.role === 'recipient') {
        setRecipientView('overview');
      } else if (profile.role === 'admin') {
        setAdminView('safety_review');
      }
      addToast({
        type: 'success',
        title: 'Google Sign In',
        message: `Authenticated as ${profile.email}.`,
      });
    }
    return profile;
  };

  const logout = async () => {
    await logoutUser();
    setFirebaseUser(null);
    setUserProfile(null);
    setRole('landing');
    addToast({
      type: 'info',
      title: 'Signed Out',
      message: 'You have logged out of your account.',
    });
  };

  const selectedDonation = useMemo(() => {
    if (!selectedDonationId) return null;
    return donations.find((d) => d.id === selectedDonationId) || null;
  }, [donations, selectedDonationId]);

  // Create Food Donation (writes to Firestore in Cloud mode, local fallback otherwise)
  const createDonation = (
    data: Omit<FoodDonation, 'id' | 'status' | 'currentStageIndex' | 'statusHistory' | 'servingsCount'>
  ) => {
    const id = `fb-${Date.now().toString().slice(-4)}`;
    const servingsCount = calculateServings(data.quantity, data.unit);

    const newDonation: FoodDonation = {
      ...data,
      id,
      servingsCount,
      status: 'available',
      currentStageIndex: 0,
      statusHistory: [
        {
          id: `sh-${Date.now()}`,
          status: 'available',
          timestamp: new Date().toISOString(),
          actor: `${data.donorName} (${data.donorType})`,
          note: `New surplus food batch created with ${data.quantity} ${data.unit} (~${servingsCount} est. servings). Initial thermal check logged.`,
        },
      ],
    };

    if (isCloudMode) {
      setDoc(doc(db, 'donations', id), newDonation).catch((err) => {
        console.warn('Firestore write warning:', err);
      });
      setDoc(doc(db, 'donations', id, 'history', newDonation.statusHistory[0].id), newDonation.statusHistory[0]).catch(() => {});
    }

    setDonations((prev) => [newDonation, ...prev]);
    addToast({
      type: 'success',
      title: 'Donation Registered',
      message: `"${newDonation.title}" published! SmartMatch compatibility generated.`,
    });

    return newDonation;
  };

  // Accept Donation with atomic validation & Cloud runTransaction
  const acceptDonation = async (
    donationId: string,
    scheduledTime?: string,
    driver?: string,
    vehicle?: string
  ): Promise<boolean> => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) return false;

    // Check availability
    if (target.status !== 'available') {
      addToast({
        type: 'warning',
        title: 'Listing Unavailable',
        message: `Listing is already in "${target.status.replace('_', ' ')}" status.`,
      });
      return false;
    }

    // Check safety status
    if (target.safetyStatus !== 'eligible') {
      addToast({
        type: 'error',
        title: 'Safety Gate Enforced',
        message: 'This listing is blocked or pending Food Safety Desk review and cannot be accepted.',
      });
      return false;
    }

    // Check deadline expiration
    const nowTime = Date.now();
    const deadlineTime = new Date(target.deadlineAt).getTime();
    if (deadlineTime <= nowTime) {
      addToast({
        type: 'error',
        title: 'Listing Expired',
        message: 'The collection deadline has elapsed. Expired food cannot be redistributed.',
      });
      return false;
    }

    // Check listing completeness
    if (!target.title || target.quantity <= 0 || !target.pickupAddress) {
      addToast({
        type: 'error',
        title: 'Incomplete Listing',
        message: 'This listing is missing required food or pickup specifications.',
      });
      return false;
    }

    // Check recipient verification
    if (!currentRecipient.verified) {
      addToast({
        type: 'error',
        title: 'Accreditation Required',
        message: `${currentRecipient.name} is currently unverified. Only verified organizations can claim surplus food.`,
      });
      return false;
    }

    // Check storage compatibility for strict foods
    if (
      (target.storageCondition === 'Frozen (<-18°C)' || target.storageCondition === 'Hot-hold (>60°C)') &&
      !currentRecipient.storageCapabilities.includes(target.storageCondition)
    ) {
      addToast({
        type: 'error',
        title: 'Storage Incompatible',
        message: `${currentRecipient.name} lacks certified equipment for ${target.storageCondition}.`,
      });
      return false;
    }

    // Check capacity deduction and quota limits
    const estKg = calculateEstimatedKg(target.quantity, target.unit, target.servingsCount);
    const remainingCap = Math.max(0, currentRecipient.maxDailyCapacityKg - currentRecipient.currentDailyAllocatedKg);
    if (estKg > remainingCap) {
      addToast({
        type: 'error',
        title: 'Daily Capacity Exceeded',
        message: `Batch size (${estKg} kg) exceeds ${currentRecipient.name}'s remaining daily capacity (${remainingCap} kg).`,
      });
      return false;
    }

    const pickupSchedule = scheduledTime || new Date(Date.now() + 45 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const driverName = driver || 'Staff Volunteer Team';
    const vehicleName = vehicle || currentRecipient.transportVehicles[0] || 'Standard Transport';

    // If Cloud Mode, attempt atomic Firestore transaction as best-effort sync.
    // A Firestore failure (offline / permission errors) should NOT block the local state update —
    // local state is the source of truth for the current session and must always reflect the claim.
    if (isCloudMode) {
      claimDonationAtomic(donationId, currentRecipient, pickupSchedule, driverName, vehicleName)
        .then((result) => {
          if (!result.success) {
            // Silently note the sync issue but do NOT revert local state
            console.warn('[FoodBridge] Firestore sync skipped for claim:', result.message);
          }
        })
        .catch((err) => {
          console.warn('[FoodBridge] Firestore claim sync error:', err);
        });
    }

    // Update local state
    const nowIso = new Date().toISOString();
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donationId) return d;
        return {
          ...d,
          status: 'accepted',
          acceptedByOrgId: currentRecipient.id,
          acceptedByOrgName: currentRecipient.name,
          acceptedAt: nowIso,
          scheduledPickupTime: pickupSchedule,
          assignedDriverName: driverName,
          assignedVehicle: vehicleName,
          currentStageIndex: 1,
          statusHistory: [
            ...d.statusHistory,
            {
              id: `sh-${Date.now()}`,
              status: 'accepted',
              timestamp: nowIso,
              actor: `${currentRecipient.name} (Recipient)`,
              note: `Donation accepted for community distribution. Pickup planned for ${pickupSchedule} with ${driverName}.`,
            },
          ],
        };
      })
    );

    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === currentRecipient.id
          ? { ...o, currentDailyAllocatedKg: o.currentDailyAllocatedKg + estKg }
          : o
      )
    );
    setCurrentRecipient((prev) => ({
      ...prev,
      currentDailyAllocatedKg: prev.currentDailyAllocatedKg + estKg,
    }));

    addToast({
      type: 'success',
      title: 'Donation Accepted!',
      message: `Pickup coordinated with ${currentRecipient.name}. Shared status updated across donor and recipient screens.`,
    });

    return true;
  };

  // Advance Stage in tracking lifecycle
  const advanceStage = async (donationId: string): Promise<boolean> => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) return false;

    if (target.status === 'cancelled' || target.status === 'expired') {
      addToast({
        type: 'error',
        title: 'Invalid Action',
        message: `Cannot advance a donation that is ${target.status}.`,
      });
      return false;
    }

    if (target.status === 'available') {
      return acceptDonation(donationId);
    }

    const stages: DonationStatus[] = ['available', 'accepted', 'pickup_scheduled', 'picked_up', 'delivered'];
    const currentIdx = stages.indexOf(target.status);

    if (currentIdx === -1 || currentIdx >= stages.length - 1) {
      addToast({
        type: 'warning',
        title: 'Lifecycle Complete',
        message: 'Donation has already reached final delivered status.',
      });
      return false;
    }

    const nextStatus = stages[currentIdx + 1];
    let actor = 'System Coordinator';
    let note = '';

    if (nextStatus === 'pickup_scheduled') {
      actor = target.acceptedByOrgName ? `${target.acceptedByOrgName} Dispatch` : 'Recipient Dispatch';
      note = `Driver ${target.assignedDriverName || 'Assigned Driver'} dispatched in ${target.assignedVehicle || 'vehicle'}. ETA 25 minutes.`;
    } else if (nextStatus === 'picked_up') {
      actor = target.assignedDriverName || 'Field Driver';
      note = `Food packages verified at donor site. Temperature and seal integrity confirmed. Loaded for transit.`;
    } else if (nextStatus === 'delivered') {
      actor = target.acceptedByOrgName || 'Recipient Kitchen Staff';
      note = `Safely delivered to destination kitchen. Ready for immediate hot meal service / pantry allotment.`;
    }

    if (isCloudMode) {
      await advanceDonationStageAtomic(target, nextStatus, actor, note);
    }

    const nowIso = new Date().toISOString();
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donationId) return d;
        return {
          ...d,
          status: nextStatus,
          currentStageIndex: currentIdx + 1,
          statusHistory: [
            ...d.statusHistory,
            {
              id: `sh-${Date.now()}`,
              status: nextStatus,
              timestamp: nowIso,
              actor,
              note,
            },
          ],
        };
      })
    );

    addToast({
      type: 'info',
      title: 'Status Updated',
      message: `Lifecycle moved to "${nextStatus.replace('_', ' ').toUpperCase()}".`,
    });

    return true;
  };

  // Cancel donation and refund capacity if previously accepted
  const cancelDonation = async (donationId: string, reason: string): Promise<boolean> => {
    const target = donations.find((d) => d.id === donationId);
    if (!target) return false;

    if (target.status === 'delivered') {
      addToast({
        type: 'error',
        title: 'Action Prohibited',
        message: 'Cannot cancel an already delivered donation.',
      });
      return false;
    }

    if (isCloudMode) {
      await cancelDonationAtomic(target, reason);
    }

    // If accepted or in transit, restore recipient daily capacity
    if (['accepted', 'pickup_scheduled', 'picked_up'].includes(target.status) && target.acceptedByOrgId) {
      const estKg = calculateEstimatedKg(target.quantity, target.unit, target.servingsCount);
      setOrganizations((prev) =>
        prev.map((o) =>
          o.id === target.acceptedByOrgId
            ? { ...o, currentDailyAllocatedKg: Math.max(0, o.currentDailyAllocatedKg - estKg) }
            : o
        )
      );
      setCurrentRecipient((prev) =>
        prev.id === target.acceptedByOrgId
          ? { ...prev, currentDailyAllocatedKg: Math.max(0, prev.currentDailyAllocatedKg - estKg) }
          : prev
      );
    }

    const nowIso = new Date().toISOString();
    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donationId) return d;
        return {
          ...d,
          status: 'cancelled',
          statusHistory: [
            ...d.statusHistory,
            {
              id: `sh-${Date.now()}`,
              status: 'cancelled',
              timestamp: nowIso,
              actor: 'Authorized User',
              note: `Cancelled with reason: ${reason}`,
            },
          ],
        };
      })
    );

    addToast({
      type: 'warning',
      title: 'Donation Cancelled',
      message: `Listing #${donationId} was marked as cancelled.`,
    });
    return true;
  };

  // Food Safety review by admin
  const reviewDonationSafety = (donationId: string, newSafety: SafetyStatus, notes: string) => {
    const nowIso = new Date().toISOString();
    if (isCloudMode) {
      setDoc(doc(db, 'donations', donationId), { safetyStatus: newSafety, safetyReviewNotes: notes, updatedAt: nowIso }, { merge: true }).catch(() => {});
    }

    setDonations((prev) =>
      prev.map((d) => {
        if (d.id !== donationId) return d;
        return {
          ...d,
          safetyStatus: newSafety,
          safetyReviewNotes: notes,
          statusHistory: [
            ...d.statusHistory,
            {
              id: `sh-${Date.now()}`,
              status: d.status,
              timestamp: nowIso,
              actor: 'Food Safety Desk Admin',
              note: `Safety audit status changed to "${newSafety}". Inspector notes: ${notes}`,
            },
          ],
        };
      })
    );

    addToast({
      type: newSafety === 'eligible' ? 'success' : 'warning',
      title: 'Safety Status Updated',
      message: `Donation review completed: status is now "${newSafety.toUpperCase()}".`,
    });
  };

  // Verify Organization
  const verifyOrgByAdmin = (orgId: string, verified: boolean) => {
    const updatedNumber = verified ? `NGO-VERIF-${Math.floor(1000 + Math.random() * 9000)}` : undefined;
    const nowIso = new Date().toISOString();

    if (isCloudMode) {
      setDoc(doc(db, 'organizations', orgId), { verified, verificationNumber: updatedNumber, updatedAt: nowIso }, { merge: true }).catch(() => {});
    }

    setOrganizations((prev) =>
      prev.map((o) =>
        o.id === orgId
          ? {
              ...o,
              verified,
              verificationNumber: updatedNumber || o.verificationNumber,
            }
          : o
      )
    );

    setCurrentRecipient((prev) => {
      if (prev.id === orgId) {
        return {
          ...prev,
          verified,
          verificationNumber: updatedNumber || prev.verificationNumber,
        };
      }
      return prev;
    });

    addToast({
      type: verified ? 'success' : 'info',
      title: verified ? 'Organization Verified' : 'Verification Revoked',
      message: `Admin review updated verification status for organization.`,
    });
  };

  // Update Org Profile
  const updateOrgProfile = (updates: Partial<Organization>) => {
    if (isCloudMode) {
      setDoc(doc(db, 'organizations', currentRecipient.id), { ...updates, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
    }

    setOrganizations((prev) =>
      prev.map((o) => (o.id === currentRecipient.id ? { ...o, ...updates } : o))
    );
    setCurrentRecipient((prev) => ({ ...prev, ...updates }));
    addToast({
      type: 'success',
      title: 'Profile Updated',
      message: 'Recipient capacity and handling credentials successfully saved.',
    });
  };

  // Reset to pristine default demo data without leaving stale records
  const resetDemoData = () => {
    const freshDonations: FoodDonation[] = JSON.parse(JSON.stringify(INITIAL_DONATIONS));
    const freshOrgs: Organization[] = JSON.parse(JSON.stringify(SAMPLE_ORGANIZATIONS));
    setDonations(freshDonations);
    setOrganizations(freshOrgs);
    setCurrentDonor(SAMPLE_DONORS[0]);
    setCurrentRecipient(freshOrgs[0]);
    setSelectedDonationId(null);
    setActiveDetailDonation(null);
    setSmartMatchTargetDonation(null);
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    localStorage.removeItem(LOCAL_STORAGE_ORGS_KEY);
    addToast({
      type: 'info',
      title: 'Demo Data Reset',
      message: 'Reloaded pristine sample records and verification states.',
    });
  };

  // Derive Impact metrics directly from actual shared data
  const impactStats = useMemo<ImpactStats>(() => {
    const availableCount = donations.filter((d) => d.status === 'available' && d.safetyStatus === 'eligible').length;
    const pendingCount = donations.filter((d) => ['accepted', 'pickup_scheduled', 'picked_up'].includes(d.status)).length;
    const deliveredCount = donations.filter((d) => d.status === 'delivered').length;

    const redistributedDonations = donations.filter((d) =>
      ['accepted', 'pickup_scheduled', 'picked_up', 'delivered'].includes(d.status)
    );

    const totalKgSaved = redistributedDonations.reduce((sum, d) => {
      return sum + calculateEstimatedKg(d.quantity, d.unit, d.servingsCount);
    }, 0);

    const estimatedMeals = Math.round(totalKgSaved / 0.42);
    const co2eDivertedKg = calculateCo2eAvoided(totalKgSaved);

    const activeDonorsCount = new Set(donations.map((d) => d.donorId)).size;
    const verifiedRecipientsCount = organizations.filter((o) => o.verified).length;

    return {
      availableCount,
      pendingCount,
      deliveredCount,
      totalKgSaved,
      estimatedMeals,
      co2eDivertedKg,
      activeDonorsCount,
      verifiedRecipientsCount,
    };
  }, [donations, organizations]);

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        donorView,
        setDonorView,
        recipientView,
        setRecipientView,
        adminView,
        setAdminView,
        donors,
        currentDonor,
        setCurrentDonor,
        organizations,
        currentRecipient,
        setCurrentRecipient,
        donations,
        selectedDonationId,
        setSelectedDonationId,
        selectedDonation,
        activeDetailDonation,
        setActiveDetailDonation,
        smartMatchTargetDonation,
        setSmartMatchTargetDonation,
        isRoleModalOpen,
        setIsRoleModalOpen,
        isAuthModalOpen,
        setIsAuthModalOpen,
        isImpactModalOpen,
        setIsImpactModalOpen,
        isCloudMode,
        setIsCloudMode,
        firebaseUser,
        userProfile,
        authLoading,
        loginEmail,
        registerEmail,
        loginGoogle,
        logout,
        toasts,
        addToast,
        removeToast,
        createDonation,
        acceptDonation,
        advanceStage,
        cancelDonation,
        reviewDonationSafety,
        verifyOrgByAdmin,
        updateOrgProfile,
        impactStats,
        resetDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
};
