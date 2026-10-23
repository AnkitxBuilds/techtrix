export type UserRole = 'landing' | 'donor' | 'recipient' | 'admin' | 'auth';

export type DonorView = 'overview' | 'my_donations' | 'create_donation' | 'smartmatch' | 'tracking' | 'profile';
export type RecipientView = 'overview' | 'explore' | 'accepted' | 'tracking' | 'profile_requirements';
export type AdminView = 'safety_review' | 'org_verification' | 'audit_log';

export type FoodCategory =
  | 'Cooked Meals'
  | 'Bakery & Pastry'
  | 'Fresh Produce & Fruits'
  | 'Packaged & Dry Goods'
  | 'Dairy & Desserts'
  | 'Chilled & Frozen';

export type StorageCondition =
  | 'Hot-hold (>60°C)'
  | 'Refrigerated (0-4°C)'
  | 'Ambient / Room Temp'
  | 'Frozen (<-18°C)';

export type PackagingType =
  | 'Sealed Catering Trays'
  | 'Insulated Thermal Carriers'
  | 'Individually Boxed'
  | 'Clean Stackable Crates'
  | 'Bulk Stainless Containers';

export type DonationStatus =
  | 'available'
  | 'accepted'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'
  | 'expired';

export type SafetyStatus = 'eligible' | 'needs_review' | 'blocked';

export interface StatusHistoryItem {
  id: string;
  status: DonationStatus;
  timestamp: string;
  actor: string;
  note: string;
}

export interface FoodDonation {
  id: string;
  title: string;
  category: FoodCategory;
  quantity: number;
  unit: 'kg' | 'portions' | 'boxes' | 'trays';
  servingsCount: number;
  preparedAt: string;
  deadlineAt: string;
  storageCondition: StorageCondition;
  packagingType: PackagingType;
  pickupAddress: string;
  pickupArea: string;
  donorId: string;
  donorName: string;
  donorType: 'Restaurant' | 'Hotel' | 'Canteen' | 'Hostel' | 'Event Organizer';
  contactPhone: string;
  handlingNotes: string;
  allergens: string[];
  dietaryTags: ('Pure Veg' | 'Vegan' | 'Non-Veg' | 'Halal' | 'Gluten-Free')[];
  imageUrl: string;
  status: DonationStatus;
  safetyStatus: SafetyStatus;
  safetyReviewNotes?: string;
  acceptedByOrgId?: string;
  acceptedByOrgName?: string;
  acceptedAt?: string;
  scheduledPickupTime?: string;
  assignedDriverName?: string;
  assignedVehicle?: string;
  currentStageIndex: number; // 0: Available, 1: Accepted, 2: Scheduled, 3: Picked Up, 4: Delivered
  statusHistory: StatusHistoryItem[];
  sampleDistanceKm?: number;
}

export interface Organization {
  id: string;
  name: string;
  type: 'NGO' | 'Shelter' | 'Charity' | 'Community Kitchen';
  isIllustrative?: boolean;
  verified: boolean;
  verificationNumber: string;
  address: string;
  serviceArea: string;
  maxDailyCapacityKg: number;
  currentDailyAllocatedKg: number;
  storageCapabilities: StorageCondition[];
  transportVehicles: string[];
  dietaryPreferences: string[];
  contactPerson: string;
  contactPhone: string;
  operatingHours: string;
  refrigeratedVanAvailable: boolean;
}

export interface DonorProfile {
  id: string;
  name: string;
  type: 'Restaurant' | 'Hotel' | 'Canteen' | 'Hostel' | 'Event Organizer';
  address: string;
  area: string;
  contactPerson: string;
  contactPhone: string;
  verified: boolean;
}

export interface SmartMatchResult {
  recipient: Organization;
  score: number;
  isEligible: boolean;
  disqualificationReason?: string;
  eligibilityReasons: string[];
  rankReasons: string[];
  warnings: string[];
  distanceKm: number;
  estimatedTransitMinutes: number;
}

export interface ImpactStats {
  availableCount: number;
  pendingCount: number;
  deliveredCount: number;
  totalKgSaved: number;
  estimatedMeals: number;
  co2eDivertedKg: number;
  activeDonorsCount: number;
  verifiedRecipientsCount: number;
}
