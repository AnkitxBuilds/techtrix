import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  runTransaction,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import { handleFirestoreError, OperationType } from './firestoreErrorHandler';
import { FoodDonation, Organization, DonorProfile, DonationStatus, SafetyStatus } from '../types';
import { calculateEstimatedKg } from './quantityUtils';

export function subscribeDonations(
  onData: (donations: FoodDonation[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'donations');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: FoodDonation[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as FoodDonation);
      });
      // Sort newest first
      list.sort((a, b) => new Date(b.preparedAt).getTime() - new Date(a.preparedAt).getTime());
      onData(list);
    },
    (error) => {
      console.warn('Realtime donations listener notice:', error.message);
      if (onError) onError(error);
    }
  );
}

export function subscribeOrganizations(
  onData: (orgs: Organization[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'organizations');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Organization[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as Organization);
      });
      onData(list);
    },
    (error) => {
      console.warn('Realtime orgs listener notice:', error.message);
      if (onError) onError(error);
    }
  );
}

export function subscribeDonors(
  onData: (donors: DonorProfile[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const colRef = collection(db, 'donors');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: DonorProfile[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as DonorProfile);
      });
      onData(list);
    },
    (error) => {
      console.warn('Realtime donors listener notice:', error.message);
      if (onError) onError(error);
    }
  );
}

/**
 * Atomic Donation Acceptance Transaction:
 * Enforces availability, verification, storage compatibility, and capacity constraints atomically.
 */
export async function claimDonationAtomic(
  donationId: string,
  recipient: Organization,
  scheduledTime: string,
  driverName: string,
  vehicleName: string
): Promise<{ success: boolean; message: string }> {
  const donationRef = doc(db, 'donations', donationId);
  const orgRef = doc(db, 'organizations', recipient.id);

  try {
    await runTransaction(db, async (transaction) => {
      const donationDoc = await transaction.get(donationRef);
      if (!donationDoc.exists()) {
        throw new Error('Donation listing not found.');
      }

      const donationData = donationDoc.data() as FoodDonation;

      // 1. Availability check
      if (donationData.status !== 'available') {
        throw new Error(`This listing has already been claimed (status: ${donationData.status}).`);
      }

      // 2. Safety check
      if (donationData.safetyStatus !== 'eligible') {
        throw new Error('Listing is blocked or pending Food Safety Desk review.');
      }

      // 3. Expiry check
      if (new Date(donationData.deadlineAt).getTime() <= Date.now()) {
        throw new Error('Listing deadline has expired.');
      }

      // 4. Recipient verification check
      const orgDoc = await transaction.get(orgRef);
      const orgData = orgDoc.exists() ? (orgDoc.data() as Organization) : recipient;

      if (!orgData.verified) {
        throw new Error('Recipient organization is not verified by the Food Safety Desk.');
      }

      // 5. Thermal compatibility check
      if (
        (donationData.storageCondition === 'Frozen (<-18°C)' || donationData.storageCondition === 'Hot-hold (>60°C)') &&
        !orgData.storageCapabilities.includes(donationData.storageCondition)
      ) {
        throw new Error(`Recipient lacks certified equipment for ${donationData.storageCondition}.`);
      }

      // 6. Capacity check
      const estKg = calculateEstimatedKg(donationData.quantity, donationData.unit, donationData.servingsCount);
      const remaining = orgData.maxDailyCapacityKg - orgData.currentDailyAllocatedKg;
      if (estKg > remaining) {
        throw new Error(`Batch size (${estKg} kg) exceeds remaining daily capacity (${remaining} kg).`);
      }

      const nowIso = new Date().toISOString();
      const historyItem = {
        id: `sh-${Date.now()}`,
        status: 'accepted' as DonationStatus,
        timestamp: nowIso,
        actor: `${orgData.name} (Recipient)`,
        note: `Donation accepted for community distribution. Pickup planned for ${scheduledTime} with ${driverName}.`,
      };

      // Atomic Update 1: Update donation status
      transaction.update(donationRef, {
        status: 'accepted',
        acceptedByOrgId: orgData.id,
        acceptedByOrgName: orgData.name,
        acceptedAt: nowIso,
        scheduledPickupTime: scheduledTime,
        assignedDriverName: driverName,
        assignedVehicle: vehicleName,
        currentStageIndex: 1,
        statusHistory: [...(donationData.statusHistory || []), historyItem],
        updatedAt: nowIso,
      });

      // Atomic Update 2: Deduct recipient daily capacity
      transaction.update(orgRef, {
        currentDailyAllocatedKg: orgData.currentDailyAllocatedKg + estKg,
        updatedAt: nowIso,
      });

      // Atomic Update 3: Append to history subcollection
      const historySubRef = doc(db, 'donations', donationId, 'history', historyItem.id);
      transaction.set(historySubRef, historyItem);
    });

    return { success: true, message: 'Donation successfully claimed in real-time cloud database!' };
  } catch (error: any) {
    const msg = error instanceof Error ? error.message : String(error);
    return { success: false, message: msg };
  }
}

/**
 * Advance donation stage atomically
 */
export async function advanceDonationStageAtomic(
  donation: FoodDonation,
  nextStatus: DonationStatus,
  actor: string,
  note: string
): Promise<{ success: boolean; message: string }> {
  const donationRef = doc(db, 'donations', donation.id);
  const nowIso = new Date().toISOString();
  const historyItem = {
    id: `sh-${Date.now()}`,
    status: nextStatus,
    timestamp: nowIso,
    actor,
    note,
  };

  const stages: DonationStatus[] = ['available', 'accepted', 'pickup_scheduled', 'picked_up', 'delivered'];
  const nextStageIndex = stages.indexOf(nextStatus);

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(donationRef);
      if (!snap.exists()) throw new Error('Donation not found');

      transaction.update(donationRef, {
        status: nextStatus,
        currentStageIndex: nextStageIndex >= 0 ? nextStageIndex : 0,
        statusHistory: [...(donation.statusHistory || []), historyItem],
        updatedAt: nowIso,
      });

      const historySubRef = doc(db, 'donations', donation.id, 'history', historyItem.id);
      transaction.set(historySubRef, historyItem);
    });

    return { success: true, message: `Status advanced to ${nextStatus}.` };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to update stage.' };
  }
}

/**
 * Cancel donation atomically and restore quota
 */
export async function cancelDonationAtomic(
  donation: FoodDonation,
  reason: string
): Promise<{ success: boolean; message: string }> {
  const donationRef = doc(db, 'donations', donation.id);
  const nowIso = new Date().toISOString();

  try {
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(donationRef);
      if (!snap.exists()) throw new Error('Donation not found');
      const d = snap.data() as FoodDonation;

      if (d.status === 'delivered') {
        throw new Error('Cannot cancel a delivered donation.');
      }

      // If accepted, restore recipient daily capacity
      if (['accepted', 'pickup_scheduled', 'picked_up'].includes(d.status) && d.acceptedByOrgId) {
        const orgRef = doc(db, 'organizations', d.acceptedByOrgId);
        const orgSnap = await transaction.get(orgRef);
        if (orgSnap.exists()) {
          const orgData = orgSnap.data() as Organization;
          const estKg = calculateEstimatedKg(d.quantity, d.unit, d.servingsCount);
          transaction.update(orgRef, {
            currentDailyAllocatedKg: Math.max(0, orgData.currentDailyAllocatedKg - estKg),
            updatedAt: nowIso,
          });
        }
      }

      const historyItem = {
        id: `sh-${Date.now()}`,
        status: 'cancelled' as DonationStatus,
        timestamp: nowIso,
        actor: 'Authorized User',
        note: `Cancelled with reason: ${reason}`,
      };

      transaction.update(donationRef, {
        status: 'cancelled',
        statusHistory: [...(d.statusHistory || []), historyItem],
        updatedAt: nowIso,
      });

      const historySubRef = doc(db, 'donations', donation.id, 'history', historyItem.id);
      transaction.set(historySubRef, historyItem);
    });

    return { success: true, message: 'Donation cancelled and quota restored.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to cancel.' };
  }
}
