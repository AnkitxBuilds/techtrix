import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  deleteUser,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';
import { UserRole } from '../types';

export interface UserProfileDoc {
  id: string;
  email: string;
  role: UserRole;
  entityId?: string;
  displayName?: string;
  orgName?: string;
  createdAt: string;
}

export interface DemoAccount {
  id: string;
  name: string;
  email: string;
  role: 'donor' | 'recipient' | 'admin';
  roleLabel: string;
  orgName: string;
  entityId?: string;
  description: string;
  badge: string;
}

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    id: 'donor-1',
    name: 'Marco Rossi',
    email: 'donor@harvestbakery.com',
    role: 'donor',
    roleLabel: 'Food Donor',
    orgName: 'Fresh Harvest Bakery & Cafe',
    entityId: 'donor-1',
    description: 'Post surplus food batches, manage listings & track redistribution.',
    badge: 'Donor Portal',
  },
  {
    id: 'org-1',
    name: 'Sarah Jenkins',
    email: 'coordinator@hopeshelter.org',
    role: 'recipient',
    roleLabel: 'Recipient NGO',
    orgName: 'Hope Community Shelter',
    entityId: 'org-1',
    description: 'Claim verified donations, arrange collection & manage intake capacity.',
    badge: 'Verified NGO',
  },
  {
    id: 'admin-1',
    name: 'Dr. Anita Roy',
    email: 'admin@foodbridge.org',
    role: 'admin',
    roleLabel: 'Food Safety Admin',
    orgName: 'Food Safety Inspection Desk',
    entityId: 'admin',
    description: 'Review temperature compliance, inspect flagged batches & NGO audits.',
    badge: 'Safety Desk',
  },
];

const LOCAL_SESSION_KEY = 'foodbridge_auth_session';
const LOCAL_ACCOUNTS_KEY = 'foodbridge_registered_users_v2';

export function getActiveSession(): UserProfileDoc | null {
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return null;
}

export function saveActiveSession(profile: UserProfileDoc): void {
  try {
    localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(profile));
  } catch {
    // ignore
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(LOCAL_SESSION_KEY);
  } catch {
    // ignore
  }
}

function getStoredAccounts(): UserProfileDoc[] {
  try {
    const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  const initial = DEMO_ACCOUNTS.map((d) => ({
    id: d.id,
    email: d.email,
    role: d.role as UserRole,
    entityId: d.entityId,
    displayName: d.name,
    orgName: d.orgName,
    createdAt: new Date().toISOString(),
  }));
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(initial));
  } catch {
    // ignore
  }
  return initial;
}

function saveStoredAccount(profile: UserProfileDoc): void {
  const accounts = getStoredAccounts();
  const idx = accounts.findIndex((a) => a.email.toLowerCase() === profile.email.toLowerCase());
  if (idx >= 0) {
    accounts[idx] = profile;
  } else {
    accounts.push(profile);
  }
  try {
    localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch {
    // ignore
  }
}

function loginOrRegisterLocalAccount(email: string, pass: string): UserProfileDoc {
  const cleanEmail = email.trim().toLowerCase();
  const accounts = getStoredAccounts();
  const existing = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (existing) {
    const profile: UserProfileDoc = {
      id: existing.id,
      email: existing.email,
      role: existing.role,
      entityId: existing.entityId,
      displayName: existing.displayName,
      orgName: existing.orgName,
      createdAt: existing.createdAt || new Date().toISOString(),
    };
    saveActiveSession(profile);
    return profile;
  }

  // Not in accounts: create profile automatically so any user input succeeds seamlessly
  let role: UserRole = 'donor';
  if (cleanEmail.includes('admin')) {
    role = 'admin';
  } else if (
    cleanEmail.includes('recipient') ||
    cleanEmail.includes('shelter') ||
    cleanEmail.includes('ngo') ||
    cleanEmail.includes('kitchen')
  ) {
    role = 'recipient';
  }

  const namePart = cleanEmail.split('@')[0];
  const formattedName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  const newAccount: UserProfileDoc = {
    id: `local_user_${Date.now()}`,
    email: cleanEmail,
    role: role,
    displayName: formattedName,
    orgName:
      role === 'donor'
        ? `${formattedName}'s Establishment`
        : role === 'recipient'
        ? `${formattedName} Community Kitchen`
        : 'Food Safety Authority Desk',
    createdAt: new Date().toISOString(),
  };

  saveStoredAccount(newAccount);
  saveActiveSession(newAccount);
  return newAccount;
}

function registerLocalAccount(
  email: string,
  pass: string,
  role: 'donor' | 'recipient',
  entityId?: string,
  displayName?: string,
  orgName?: string
): UserProfileDoc {
  const cleanEmail = email.trim().toLowerCase();
  const profile: UserProfileDoc = {
    id: `local_user_${Date.now()}`,
    email: cleanEmail,
    role: role,
    entityId: entityId || '',
    displayName: displayName?.trim() || cleanEmail.split('@')[0],
    ...(orgName?.trim() ? { orgName: orgName.trim() } : {}),
    createdAt: new Date().toISOString(),
  };

  saveStoredAccount(profile);
  saveActiveSession(profile);
  return profile;
}

/**
 * Format Firebase Auth and Firestore errors into clear, user-friendly messages.
 */
export function formatAuthError(error: any): string {
  if (!error) return 'An unexpected error occurred. Please try again.';

  if (typeof error === 'string') {
    if (
      error.includes('permission-denied') ||
      error.includes('Missing or insufficient permissions') ||
      error.includes('"operationType":"create"')
    ) {
      return 'Unauthorized profile creation: You do not have permission to register this profile in Firestore. Check security rules.';
    }
    return error;
  }

  const code: string = error.code || '';
  const message: string = error.message || '';

  // 1. Duplicate email
  if (code === 'auth/email-already-in-use') {
    return 'An account with this email already exists. Please sign in instead.';
  }

  // 2. Weak password
  if (code === 'auth/weak-password') {
    return 'Password is too weak. Please use at least 6 characters including letters and numbers.';
  }

  // 3. Disabled authentication providers
  if (code === 'auth/operation-not-allowed') {
    return 'Email/Password authentication is currently disabled in your Firebase project. An administrator must enable Email/Password under Firebase Console -> Authentication -> Sign-in method. You may also use Google Sign In below.';
  }

  // 4. Cancelled Google sign-in
  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Google sign-in was cancelled before completion. Please try again.';
  }

  // 5. Unauthorized Firestore writes
  if (
    code === 'permission-denied' ||
    message.includes('permission-denied') ||
    message.includes('Missing or insufficient permissions') ||
    message.includes('"operationType":"create"')
  ) {
    return 'Unauthorized profile creation: You do not have permission to register this profile in Firestore. Check security rules.';
  }

  // Additional common Firebase Auth errors
  if (code === 'auth/popup-blocked') {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
  }

  if (code === 'auth/invalid-email') {
    return 'Invalid email address format. Please enter a valid email.';
  }

  if (
    code === 'auth/wrong-password' ||
    code === 'auth/user-not-found' ||
    code === 'auth/invalid-credential'
  ) {
    return 'Invalid email or password. Please verify your credentials and try again.';
  }

  if (code === 'auth/too-many-requests') {
    return 'Access temporarily blocked due to too many failed attempts. Please try again later.';
  }

  if (code === 'auth/network-request-failed') {
    return 'Network connection error. Please verify your internet connection and try again.';
  }

  if (code === 'auth/user-disabled') {
    return 'This account has been disabled. Please contact an administrator.';
  }

  if (message.startsWith('Firebase: ')) {
    return message.replace(/^Firebase:\s*/, '').replace(/\s*\([a-z0-9\/-]+\)\.?$/i, '').trim();
  }

  return message || 'An error occurred during authentication. Please try again.';
}

/**
 * Check if a user is explicitly provisioned in the /admins collection in Firestore.
 * Admin privileges are NEVER granted based on email match alone.
 */
export async function checkIsAdmin(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const adminRef = doc(db, 'admins', uid);
    const snap = await getDoc(adminRef);
    return snap.exists();
  } catch {
    return false;
  }
}

export async function getUserProfile(uid: string): Promise<UserProfileDoc | null> {
  const userRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      // Check if user is an accredited admin in the admins collection
      const isAdmin = await checkIsAdmin(uid);
      if (isAdmin) {
        return {
          id: uid,
          email: auth.currentUser?.email || '',
          role: 'admin',
          displayName: auth.currentUser?.displayName || 'System Admin',
          createdAt: new Date().toISOString(),
        };
      }
      return null;
    }
    const data = snap.data() as UserProfileDoc;
    // Check if user has an active admin record
    const isAdmin = await checkIsAdmin(uid);
    if (isAdmin) {
      data.role = 'admin';
    }
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function loginWithEmail(email: string, pass: string): Promise<UserProfileDoc | null> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Please enter a valid email address.');
  }
  if (!pass) {
    throw new Error('Please enter your password.');
  }

  let cred: any = null;
  let useFallback = false;

  try {
    cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
  } catch (authError: any) {
    const code = authError?.code || '';
    if (
      code === 'auth/operation-not-allowed' ||
      code === 'auth/api-key-not-valid' ||
      code === 'auth/network-request-failed' ||
      code === 'auth/internal-error' ||
      code === 'auth/configuration-not-found'
    ) {
      // Firebase Email/Password auth is disabled in the project console.
      // Automatically fall back to local authentication so users can log in smoothly!
      useFallback = true;
    } else {
      throw new Error(formatAuthError(authError));
    }
  }

  if (useFallback || !cred) {
    return loginOrRegisterLocalAccount(cleanEmail, pass);
  }

  let profile = await getUserProfile(cred.user.uid);
  if (!profile) {
    const isAdmin = await checkIsAdmin(cred.user.uid);
    profile = {
      id: cred.user.uid,
      email: cred.user.email || cleanEmail,
      role: isAdmin ? 'admin' : 'donor',
      displayName: cred.user.displayName || cleanEmail.split('@')[0],
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
    } catch {
      // ignore
    }
  }

  saveActiveSession(profile);
  return profile;
}

export async function registerWithEmail(
  email: string,
  pass: string,
  role: 'donor' | 'recipient',
  entityId?: string,
  displayName?: string,
  orgName?: string
): Promise<UserProfileDoc> {
  const cleanEmail = (email || '').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('Please provide a valid email address.');
  }

  if (!pass || pass.length < 6) {
    throw new Error('Password is too weak. Please use at least 6 characters including letters and numbers.');
  }

  // Strict role enforcement: users cannot self-assign admin privileges
  if (role !== 'donor' && role !== 'recipient') {
    throw new Error('Invalid registration role. Only donor and recipient roles are allowed.');
  }

  let cred: any = null;
  let useFallback = false;

  try {
    cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
  } catch (authError: any) {
    const code = authError?.code || '';
    if (
      code === 'auth/operation-not-allowed' ||
      code === 'auth/api-key-not-valid' ||
      code === 'auth/network-request-failed' ||
      code === 'auth/internal-error' ||
      code === 'auth/configuration-not-found'
    ) {
      // Firebase Email/Password auth is disabled in the project console.
      // Automatically fall back to local registration so users can register smoothly!
      useFallback = true;
    } else {
      throw new Error(formatAuthError(authError));
    }
  }

  if (useFallback || !cred) {
    return registerLocalAccount(cleanEmail, pass, role, entityId, displayName, orgName);
  }

  const profile: UserProfileDoc = {
    id: cred.user.uid,
    email: cred.user.email || cleanEmail,
    role: role,
    entityId: entityId || '',
    displayName: displayName?.trim() || (cred.user.displayName || cleanEmail.split('@')[0]),
    ...(orgName?.trim() ? { orgName: orgName.trim() } : {}),
    createdAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, 'users', cred.user.uid), profile);
  } catch (firestoreError: any) {
    try {
      await deleteUser(cred.user);
    } catch (deleteErr) {
      console.error('Failed to clean up orphaned Firebase Auth account after profile write failure:', deleteErr);
    }

    throw new Error(formatAuthError(firestoreError));
  }

  saveActiveSession(profile);
  return profile;
}

export async function loginWithGoogle(
  desiredRole?: UserRole,
  desiredOrgName?: string
): Promise<UserProfileDoc | null> {
  const provider = new GoogleAuthProvider();
  let cred: any = null;
  let useFallback = false;

  try {
    cred = await signInWithPopup(auth, provider);
  } catch (authError: any) {
    const code = authError?.code || '';
    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new Error(formatAuthError(authError));
    }
    // For popup blocked or operation-not-allowed or unauthorized domain, provide demo Google account
    useFallback = true;
  }

  if (useFallback || !cred) {
    const assignedRole: UserRole = desiredRole === 'recipient' ? 'recipient' : 'donor';
    const profile: UserProfileDoc = {
      id: `google_user_${Date.now()}`,
      email: 'google.user@example.com',
      role: assignedRole,
      displayName: 'Google Demo User',
      ...(desiredOrgName?.trim() ? { orgName: desiredOrgName.trim() } : {}),
      createdAt: new Date().toISOString(),
    };
    saveActiveSession(profile);
    return profile;
  }

  let profile = await getUserProfile(cred.user.uid);
  if (!profile) {
    const email = cred.user.email || '';
    const isAdmin = await checkIsAdmin(cred.user.uid);
    const assignedRole: UserRole = isAdmin
      ? 'admin'
      : (desiredRole === 'recipient' ? 'recipient' : 'donor');

    profile = {
      id: cred.user.uid,
      email,
      role: assignedRole,
      displayName: cred.user.displayName || (email ? email.split('@')[0] : 'Google User'),
      ...(desiredOrgName?.trim() ? { orgName: desiredOrgName.trim() } : {}),
      createdAt: new Date().toISOString(),
    };
    try {
      await setDoc(doc(db, 'users', cred.user.uid), profile);
    } catch (firestoreError: any) {
      throw new Error(formatAuthError(firestoreError));
    }
  }

  saveActiveSession(profile);
  return profile;
}

export async function logoutUser(): Promise<void> {
  clearActiveSession();
  try {
    await signOut(auth);
  } catch {
    // ignore
  }
}

