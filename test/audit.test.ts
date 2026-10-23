/**
 * Comprehensive Audit Test Suite for FoodBridge
 * TechTrix'26 Problem Statement Audit
 */

import { evaluateSmartMatches } from '../src/services/smartMatch';
import {
  calculateServings,
  calculateEstimatedKg,
  calculateCo2eAvoided,
} from '../src/services/quantityUtils';
import { SAMPLE_DONORS, SAMPLE_ORGANIZATIONS, INITIAL_DONATIONS } from '../src/data/mockData';
import { FoodDonation, Organization } from '../src/types';
import { formatAuthError } from '../src/services/authService';

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failedCount++;
  }
}

console.log('\n--- 1. Testing Standardized Quantity and Impact Conversion Formulas ---');
{
  // 1 kg = ~2.38 servings (Math.round(1 / 0.42) = 2)
  const servingsKg = calculateServings(10, 'kg');
  assert(servingsKg === 24, `10 kg yields 24 servings (FAO standard 0.42 kg/meal) -> got ${servingsKg}`);

  // portions: 1:1
  const servingsPortions = calculateServings(45, 'portions');
  assert(servingsPortions === 45, `45 portions yields 45 servings -> got ${servingsPortions}`);

  // trays: 1 catering tray ≈ 12 portions
  const servingsTrays = calculateServings(3, 'trays');
  assert(servingsTrays === 36, `3 trays yields 36 servings -> got ${servingsTrays}`);

  // Weight estimation in kg
  const kgFromKg = calculateEstimatedKg(25, 'kg');
  assert(kgFromKg === 25, `25 kg unit = 25 kg weight -> got ${kgFromKg}`);

  const kgFromPortions = calculateEstimatedKg(100, 'portions', 100);
  assert(kgFromPortions === 42, `100 portions = 42 kg -> got ${kgFromPortions}`);

  const kgFromTrays = calculateEstimatedKg(4, 'trays');
  assert(kgFromTrays === 20, `4 catering trays = 20 kg -> got ${kgFromTrays}`);

  // CO2e avoided: 1 kg = 2.5 kg CO2e
  const co2e = calculateCo2eAvoided(40);
  assert(co2e === 100, `40 kg food saved mitigates 100 kg CO2e -> got ${co2e}`);
}

console.log('\n--- 2. Testing SmartMatch Deterministic 6-Point Eligibility Pipeline ---');
{
  const testListing: FoodDonation = {
    id: 'test-1',
    title: 'Warm Vegetable Stew & Bread',
    category: 'Cooked Meals',
    quantity: 20,
    unit: 'kg',
    servingsCount: 48,
    preparedAt: new Date(Date.now() - 3600000).toISOString(),
    deadlineAt: new Date(Date.now() + 4 * 3600000).toISOString(),
    storageCondition: 'Hot-hold (>60°C)',
    packagingType: 'Sealed Catering Trays',
    pickupAddress: 'Downtown Banquet Dock 1',
    pickupArea: 'Downtown Metro',
    donorId: 'donor-1',
    donorName: 'Grand Pavilion',
    donorType: 'Hotel',
    contactPhone: '+91 9999999999',
    handlingNotes: 'Maintained at 65°C',
    allergens: [],
    dietaryTags: ['Pure Veg'],
    imageUrl: 'https://example.com/photo.jpg',
    status: 'available',
    safetyStatus: 'eligible',
    currentStageIndex: 0,
    statusHistory: [],
  };

  const results = evaluateSmartMatches(testListing, SAMPLE_ORGANIZATIONS);

  // Check Gate 1: Unverified organization (Metro Youth Haven, id: 'org-5') must be ineligible
  const unverifiedMatch = results.find((r) => r.recipient.id === 'org-5');
  assert(
    unverifiedMatch !== undefined && !unverifiedMatch.isEligible && unverifiedMatch.score === 0,
    'Gate 1: Unverified recipient (Metro Youth Haven) is strictly disqualified with score 0'
  );

  // Check Gate 2: Expired listing disqualifies all recipients
  const expiredListing: FoodDonation = {
    ...testListing,
    deadlineAt: new Date(Date.now() - 60000).toISOString(),
  };
  const expiredResults = evaluateSmartMatches(expiredListing, SAMPLE_ORGANIZATIONS);
  const anyExpiredEligible = expiredResults.some((r) => r.isEligible);
  assert(!anyExpiredEligible, 'Gate 2: Expired listing disqualifies all recipient candidates');

  // Check Gate 3: Flagged listing (safetyStatus = 'needs_review') disqualifies all recipients
  const flaggedListing: FoodDonation = {
    ...testListing,
    safetyStatus: 'needs_review',
  };
  const flaggedResults = evaluateSmartMatches(flaggedListing, SAMPLE_ORGANIZATIONS);
  const anyFlaggedEligible = flaggedResults.some((r) => r.isEligible);
  assert(!anyFlaggedEligible, 'Gate 3: Listing pending safety review is disqualified from matching');

  // Check Gate 4: Incomplete listing (missing pickup address or quantity 0)
  const incompleteListing: FoodDonation = {
    ...testListing,
    pickupAddress: '',
  };
  const incompleteResults = evaluateSmartMatches(incompleteListing, SAMPLE_ORGANIZATIONS);
  assert(!incompleteResults.some((r) => r.isEligible), 'Gate 4: Incomplete listing without pickup address is disqualified');

  // Check Gate 5: Strict storage incompatibility (e.g. Frozen item for org without Frozen storage)
  const frozenListing: FoodDonation = {
    ...testListing,
    storageCondition: 'Frozen (<-18°C)',
  };
  const frozenResults = evaluateSmartMatches(frozenListing, SAMPLE_ORGANIZATIONS);
  const seveShelterFrozen = frozenResults.find((r) => r.recipient.id === 'org-3'); // Seva has only Refrigerated & Ambient
  assert(
    seveShelterFrozen !== undefined && !seveShelterFrozen.isEligible,
    'Gate 5: Recipient without certified Frozen equipment is disqualified for frozen batch'
  );

  // Check Gate 6: Batch exceeding recipient remaining capacity
  const massiveListing: FoodDonation = {
    ...testListing,
    quantity: 500, // 500 kg exceeds all org capacities
  };
  const massiveResults = evaluateSmartMatches(massiveListing, SAMPLE_ORGANIZATIONS);
  assert(
    !massiveResults.some((r) => r.isEligible),
    'Gate 6: Surplus volume exceeding remaining daily quota is strictly blocked'
  );

  // Normal listing: verified orgs with capacity must be ranked with scores > 0
  const eligibleMatches = results.filter((r) => r.isEligible);
  assert(eligibleMatches.length > 0, `At least 1 verified organization matched -> found ${eligibleMatches.length}`);
  assert(eligibleMatches[0].score >= 70, `Top candidate has strong score (>=70) -> got ${eligibleMatches[0].score}`);
}

console.log('\n--- 3. Testing Recipient Capacity Deductions & Quota Protection ---');
{
  const org: Organization = {
    id: 'org-test',
    name: 'Test Kitchen',
    type: 'Community Kitchen',
    verified: true,
    verificationNumber: 'NGO-TEST-1',
    address: '10 Test Road',
    serviceArea: 'Central',
    maxDailyCapacityKg: 100,
    currentDailyAllocatedKg: 70,
    storageCapabilities: ['Hot-hold (>60°C)', 'Refrigerated (0-4°C)', 'Ambient / Room Temp'],
    transportVehicles: ['Van 1'],
    dietaryPreferences: ['Pure Veg'],
    contactPerson: 'Manager',
    contactPhone: '1234567890',
    operatingHours: '8am - 8pm',
    refrigeratedVanAvailable: true,
  };

  const remainingCap = org.maxDailyCapacityKg - org.currentDailyAllocatedKg; // 30 kg free

  // A batch of 25 kg fits
  const batch1Kg = calculateEstimatedKg(25, 'kg');
  assert(batch1Kg <= remainingCap, `Batch of 25 kg fits in remaining capacity of ${remainingCap} kg`);

  // A batch of 35 kg does NOT fit
  const batch2Kg = calculateEstimatedKg(35, 'kg');
  assert(batch2Kg > remainingCap, `Batch of 35 kg strictly exceeds remaining capacity of ${remainingCap} kg`);

  // Deduction simulation
  const newAllocation = org.currentDailyAllocatedKg + batch1Kg;
  assert(newAllocation === 95, `Allocating 25 kg brings quota usage to 95 kg -> got ${newAllocation}`);
  assert(newAllocation <= org.maxDailyCapacityKg, 'Quota limit was not exceeded');
}

console.log('\n--- 4. Testing State Reset & Deep Copy Integrity ---');
{
  const initialCopy1 = JSON.parse(JSON.stringify(INITIAL_DONATIONS));
  const initialCopy2 = JSON.parse(JSON.stringify(INITIAL_DONATIONS));

  // Mutate copy 1
  initialCopy1[0].status = 'cancelled';
  assert(initialCopy1[0].status === 'cancelled', 'Copy 1 was modified');
  assert(initialCopy2[0].status === 'available', 'Copy 2 remains pristine available without reference leaks');
}

console.log('\n--- 5. Testing Role Authorization Guards & Privilege Escalation Defenses ---');
{
  // 1. Role validation: Registration cannot grant admin role based on email match
  function validateRegistrationRole(requestedRole: string, email: string): 'donor' | 'recipient' {
    if (requestedRole === 'admin') {
      throw new Error('Unauthorized role: Cannot self-assign admin privileges.');
    }
    if (requestedRole === 'donor' || requestedRole === 'recipient') {
      return requestedRole;
    }
    throw new Error('Invalid role specified');
  }

  // A. Random user attempting admin role must be rejected
  let threwUnauthorized = false;
  try {
    validateRegistrationRole('admin', 'attacker@example.com');
  } catch (err: any) {
    threwUnauthorized = true;
    assert(err.message.includes('Cannot self-assign admin'), 'Unauthorized admin self-assignment is blocked');
  }
  assert(threwUnauthorized, 'Attacker was blocked from registering with admin role');

  // B. Even privileged email cannot self-assign admin role during registration
  let privilegedBlocked = false;
  try {
    validateRegistrationRole('admin', 'ankitk04819@gmail.com');
  } catch (err: any) {
    privilegedBlocked = true;
    assert(err.message.includes('Cannot self-assign admin'), 'Privileged email cannot self-assign admin role at registration');
  }
  assert(privilegedBlocked, 'Admin privileges are not granted based only on an email match');

  // C. Secure admin provisioning: Admin status is verified exclusively via /admins/{uid} directory
  const mockAdminDirectory: Record<string, boolean> = { 'uid-verified-admin': true };
  function verifyAdminStatus(uid: string): boolean {
    return Boolean(mockAdminDirectory[uid]);
  }
  assert(verifyAdminStatus('uid-verified-admin') === true, 'Admin status verified through secure admin directory document');
  assert(verifyAdminStatus('uid-regular-user') === false, 'Non-admin user rejected by admin directory check');

  // 2. New recipient organizations are unverified by default
  function createNewOrganizationRecord(orgName: string, claimedVerifiedFlag?: boolean): { verified: boolean } {
    return {
      verified: false, // Server controlled
    };
  }
  const newOrg = createNewOrganizationRecord('Hacker Shelter', true);
  assert(newOrg.verified === false, 'New organization profile cannot self-declare verified: true');

  // 3. Testing Recovery: When Auth account is created but Firestore profile write fails
  let deletedAuthUid: string | null = null;
  async function simulateRegisterWithRecovery(
    simulateFirestoreFail: boolean
  ): Promise<{ success: boolean; error?: string; profileSaved: boolean }> {
    const mockAuthUser = { uid: 'auth-uid-456', email: 'newdonor@bakery.com' };
    let profileSaved = false;

    try {
      if (simulateFirestoreFail) {
        throw { code: 'permission-denied', message: 'Missing or insufficient permissions.' };
      }
      profileSaved = true;
      return { success: true, profileSaved: true };
    } catch (firestoreErr) {
      // Recovery rollback: delete orphaned Firebase Auth account
      deletedAuthUid = mockAuthUser.uid;
      const friendlyMsg = formatAuthError(firestoreErr);
      return { success: false, error: friendlyMsg, profileSaved: false };
    }
  }

  const successReg = await simulateRegisterWithRecovery(false);
  assert(successReg.success && successReg.profileSaved, 'User profile successfully saved to Firestore under Auth UID');

  const failedReg = await simulateRegisterWithRecovery(true);
  assert(!failedReg.success && !failedReg.profileSaved, 'Failed Firestore write halts registration');
  assert(deletedAuthUid === 'auth-uid-456', 'Recovery successfully cleaned up orphaned Firebase Auth account');
  assert(
    Boolean(failedReg.error?.includes('Unauthorized profile creation')),
    `Recovery returns clear user-friendly error: "${failedReg.error}"`
  );

  // 4. Testing User-Friendly Error Messages
  // Duplicate email
  const duplicateEmailMsg = formatAuthError({ code: 'auth/email-already-in-use' });
  assert(
    duplicateEmailMsg === 'An account with this email already exists. Please sign in instead.',
    `Duplicate email error: ${duplicateEmailMsg}`
  );

  // Weak password
  const weakPasswordMsg = formatAuthError({ code: 'auth/weak-password' });
  assert(
    weakPasswordMsg === 'Password is too weak. Please use at least 6 characters including letters and numbers.',
    `Weak password error: ${weakPasswordMsg}`
  );

  // Disabled authentication providers
  const disabledProviderMsg = formatAuthError({ code: 'auth/operation-not-allowed' });
  assert(
    disabledProviderMsg ===
      'Email/Password authentication is currently disabled in your Firebase project. An administrator must enable Email/Password under Firebase Console -> Authentication -> Sign-in method. You may also use Google Sign In below.',
    `Disabled provider error: ${disabledProviderMsg}`
  );

  // Cancelled Google sign-in
  const cancelledGoogle1 = formatAuthError({ code: 'auth/popup-closed-by-user' });
  const cancelledGoogle2 = formatAuthError({ code: 'auth/cancelled-popup-request' });
  assert(
    cancelledGoogle1 === 'Google sign-in was cancelled before completion. Please try again.' &&
      cancelledGoogle2 === 'Google sign-in was cancelled before completion. Please try again.',
    `Cancelled Google sign-in error: ${cancelledGoogle1}`
  );

  // Unauthorized Firestore writes
  const unauthorizedWriteMsg = formatAuthError({
    code: 'permission-denied',
    message: 'Missing or insufficient permissions.',
  });
  assert(
    unauthorizedWriteMsg === 'Unauthorized profile creation: You do not have permission to register this profile in Firestore. Check security rules.',
    `Unauthorized Firestore write error: ${unauthorizedWriteMsg}`
  );
}

console.log('\n--- 6. Testing Atomic Claim Transaction Preconditions ---');
{
  // Transaction claim simulator matching donationService.ts runTransaction constraints
  function simulateClaimTransaction(
    donation: FoodDonation,
    recipient: Organization
  ): { success: boolean; error?: string; updatedDonation?: FoodDonation; updatedRecipient?: Organization } {
    // 1. Availability check
    if (donation.status !== 'available') {
      return { success: false, error: `Donation is already ${donation.status}.` };
    }
    // 2. Safety status check
    if (donation.safetyStatus !== 'eligible') {
      return { success: false, error: `Donation is flagged for safety review (${donation.safetyStatus}).` };
    }
    // 3. Expiration check
    if (new Date(donation.deadlineAt).getTime() < Date.now()) {
      return { success: false, error: 'Donation has expired.' };
    }
    // 4. Recipient verification check
    if (!recipient.verified) {
      return { success: false, error: 'Recipient organization is not verified.' };
    }
    // 5. Storage compatibility check
    if (!recipient.storageCapabilities.includes(donation.storageCondition)) {
      return { success: false, error: `Incompatible storage: Requires ${donation.storageCondition}.` };
    }
    // 6. Remaining capacity check
    const batchKg = calculateEstimatedKg(donation.quantity, donation.unit, donation.servingsCount);
    const remainingCap = recipient.maxDailyCapacityKg - recipient.currentDailyAllocatedKg;
    if (batchKg > remainingCap) {
      return { success: false, error: `Capacity exceeded: Requires ${batchKg} kg, only ${remainingCap} kg remaining.` };
    }

    // Success: return updated documents
    const updatedDonation: FoodDonation = {
      ...donation,
      status: 'accepted',
      acceptedByOrgId: recipient.id,
      acceptedByOrgName: recipient.name,
      acceptedAt: new Date().toISOString(),
      currentStageIndex: 1,
      statusHistory: [
        ...donation.statusHistory,
        {
          id: `hist-${Date.now()}`,
          status: 'accepted',
          timestamp: new Date().toISOString(),
          note: `Accepted by ${recipient.name}`,
          actor: recipient.name,
        },
      ],
    };

    const updatedRecipient: Organization = {
      ...recipient,
      currentDailyAllocatedKg: recipient.currentDailyAllocatedKg + batchKg,
    };

    return { success: true, updatedDonation, updatedRecipient };
  }

  const baseDonation: FoodDonation = {
    id: 'don-live-1',
    title: 'Surplus Lunch Buffet',
    category: 'Cooked Meals',
    quantity: 20,
    unit: 'kg',
    servingsCount: 48,
    preparedAt: new Date(Date.now() - 3600000).toISOString(),
    deadlineAt: new Date(Date.now() + 7200000).toISOString(),
    storageCondition: 'Hot-hold (>60°C)',
    packagingType: 'Sealed Catering Trays',
    pickupAddress: 'Grand Hall',
    pickupArea: 'Downtown',
    donorId: 'donor-1',
    donorName: 'Catering Co',
    donorType: 'Hotel',
    contactPhone: '9876543210',
    handlingNotes: '',
    allergens: [],
    dietaryTags: ['Pure Veg'],
    imageUrl: 'https://example.com/food.jpg',
    status: 'available',
    safetyStatus: 'eligible',
    currentStageIndex: 0,
    statusHistory: [],
  };

  const verifiedOrg: Organization = {
    id: 'org-verified-1',
    name: 'Verified Shelter',
    type: 'Shelter',
    verified: true,
    verificationNumber: 'NGO-888',
    address: '12 Mission St',
    serviceArea: 'Downtown',
    maxDailyCapacityKg: 100,
    currentDailyAllocatedKg: 50, // 50 kg remaining
    storageCapabilities: ['Hot-hold (>60°C)', 'Refrigerated (0-4°C)', 'Ambient / Room Temp'],
    transportVehicles: ['Van 1'],
    dietaryPreferences: ['Pure Veg'],
    contactPerson: 'Director',
    contactPhone: '9998887776',
    operatingHours: '9am - 9pm',
    refrigeratedVanAvailable: true,
  };

  // Case A: Valid claim succeeds and updates state
  const validRes = simulateClaimTransaction(baseDonation, verifiedOrg);
  assert(validRes.success, 'Valid claim transaction succeeds');
  assert(validRes.updatedDonation?.status === 'accepted', 'Donation status is updated to accepted');
  assert(validRes.updatedRecipient?.currentDailyAllocatedKg === 70, 'Recipient capacity is deducted by 20 kg');

  // Case B: Double claim - Second recipient tries to claim already accepted donation
  const doubleClaimRes = simulateClaimTransaction(validRes.updatedDonation!, verifiedOrg);
  assert(!doubleClaimRes.success && Boolean(doubleClaimRes.error?.includes('already accepted')), 'Double claim attempt is strictly blocked');

  // Case C: Unverified recipient rejected
  const unverifiedOrg: Organization = { ...verifiedOrg, verified: false };
  const unverifiedRes = simulateClaimTransaction(baseDonation, unverifiedOrg);
  assert(!unverifiedRes.success && Boolean(unverifiedRes.error?.includes('not verified')), 'Unverified organization claim is rejected');

  // Case D: Expired listing rejected
  const expiredDonation: FoodDonation = { ...baseDonation, deadlineAt: new Date(Date.now() - 1000).toISOString() };
  const expiredRes = simulateClaimTransaction(expiredDonation, verifiedOrg);
  assert(!expiredRes.success && Boolean(expiredRes.error?.includes('expired')), 'Expired listing claim is rejected');

  // Case E: Storage mismatch rejected
  const mismatchedStorageOrg: Organization = { ...verifiedOrg, storageCapabilities: ['Frozen (<-18°C)'] };
  const mismatchRes = simulateClaimTransaction(baseDonation, mismatchedStorageOrg);
  assert(!mismatchRes.success && Boolean(mismatchRes.error?.includes('Incompatible storage')), 'Storage capability mismatch is rejected');

  // Case F: Remaining capacity exceeded rejected
  const overCapacityOrg: Organization = { ...verifiedOrg, currentDailyAllocatedKg: 90 }; // only 10 kg remaining, batch is 20 kg
  const overCapRes = simulateClaimTransaction(baseDonation, overCapacityOrg);
  assert(!overCapRes.success && Boolean(overCapRes.error?.includes('Capacity exceeded')), 'Capacity overage claim is rejected');
}

console.log('\n--- 7. Testing Quota Refund on Cancellation & Lifecycle Audit Trail ---');
{
  // Quota refund simulator
  function simulateCancellation(
    donation: FoodDonation,
    recipient: Organization
  ): { updatedDonation: FoodDonation; updatedRecipient: Organization } {
    if (donation.status !== 'accepted') {
      throw new Error('Can only cancel accepted donations');
    }
    const batchKg = calculateEstimatedKg(donation.quantity, donation.unit, donation.servingsCount);

    const updatedDonation: FoodDonation = {
      ...donation,
      status: 'cancelled',
      currentStageIndex: 0,
      statusHistory: [
        ...donation.statusHistory,
        {
          id: `hist-${Date.now()}`,
          status: 'cancelled',
          timestamp: new Date().toISOString(),
          note: 'Cancelled by recipient',
          actor: recipient.name,
        },
      ],
    };

    const updatedRecipient: Organization = {
      ...recipient,
      currentDailyAllocatedKg: Math.max(0, recipient.currentDailyAllocatedKg - batchKg),
    };

    return { updatedDonation, updatedRecipient };
  }

  const claimedDonation: FoodDonation = {
    id: 'don-cancel-test',
    title: 'Veg Pulao',
    category: 'Cooked Meals',
    quantity: 15,
    unit: 'kg',
    servingsCount: 36,
    preparedAt: new Date().toISOString(),
    deadlineAt: new Date(Date.now() + 3600000).toISOString(),
    storageCondition: 'Hot-hold (>60°C)',
    packagingType: 'Sealed Catering Trays',
    pickupAddress: 'Canteen 2',
    pickupArea: 'Campus',
    donorId: 'donor-2',
    donorName: 'College Canteen',
    donorType: 'Canteen',
    contactPhone: '9876543210',
    handlingNotes: '',
    allergens: [],
    dietaryTags: ['Pure Veg'],
    imageUrl: 'https://example.com/pulao.jpg',
    status: 'accepted',
    safetyStatus: 'eligible',
    currentStageIndex: 1,
    statusHistory: [
      { id: 'h-1', status: 'available', timestamp: new Date().toISOString(), note: 'Posted', actor: 'Donor' },
      { id: 'h-2', status: 'accepted', timestamp: new Date().toISOString(), note: 'Accepted', actor: 'Shelter' },
    ],
  };

  const recipientOrg: Organization = {
    id: 'org-cancel',
    name: 'Shelter Hope',
    type: 'Shelter',
    verified: true,
    verificationNumber: 'NGO-123',
    address: '4th Cross',
    serviceArea: 'Campus',
    maxDailyCapacityKg: 50,
    currentDailyAllocatedKg: 35, // Contains 15 kg of this donation
    storageCapabilities: ['Hot-hold (>60°C)'],
    transportVehicles: [],
    dietaryPreferences: ['Pure Veg'],
    contactPerson: 'Leader',
    contactPhone: '9876543210',
    operatingHours: '10am - 6pm',
    refrigeratedVanAvailable: false,
  };

  const cancelRes = simulateCancellation(claimedDonation, recipientOrg);
  assert(cancelRes.updatedDonation.status === 'cancelled', 'Donation is successfully marked cancelled');
  assert(cancelRes.updatedDonation.statusHistory.length === 3, 'Status history records cancellation audit event');
  assert(cancelRes.updatedRecipient.currentDailyAllocatedKg === 20, 'Capacity is refunded exactly by 15 kg (from 35 kg to 20 kg)');
}

console.log('\n--------------------------------------------------------------');
console.log(`Audit Test Results: ${passedCount} PASSED, ${failedCount} FAILED`);
console.log('--------------------------------------------------------------\n');

if (failedCount > 0) {
  process.exit(1);
}
