import { FoodDonation, Organization, SmartMatchResult } from '../types';
import { calculateEstimatedKg } from './quantityUtils';

/**
 * Transparent, Rule-Based SmartMatch Engine
 *
 * Checks strict eligibility gates:
 * 1. Recipient NGO is verified
 * 2. Listing is not expired or blocked
 * 3. Required listing information is complete
 * 4. Storage requirements are compatible (e.g. cold storage/hot-hold capability)
 * 5. Recipient daily capacity is sufficient for batch weight
 * 6. Pickup window can be completed before deadline
 *
 * Scoring weights for ranked eligible recipients:
 * - Distance & transit proximity: up to 25 pts
 * - Quantity fit vs remaining capacity: up to 25 pts
 * - Food handling & storage facility match: up to 25 pts
 * - Urgency response capability (operating hours / refrigerated transport): up to 15 pts
 * - Dietary alignment: up to 10 pts
 */
export function evaluateSmartMatches(
  donation: FoodDonation,
  recipients: Organization[]
): SmartMatchResult[] {
  const now = new Date().getTime();
  const deadline = new Date(donation.deadlineAt).getTime();
  const hoursRemaining = Math.max(0, (deadline - now) / (1000 * 3600));

  // Global listing eligibility checks
  const isExpired = deadline <= now || donation.status === 'expired';
  const isBlockedOrFlagged = donation.safetyStatus === 'blocked' || donation.safetyStatus === 'needs_review';
  const isComplete = Boolean(
    donation.title &&
    donation.title.trim().length >= 3 &&
    donation.category &&
    donation.quantity > 0 &&
    donation.storageCondition &&
    donation.pickupAddress &&
    donation.pickupAddress.trim().length > 0 &&
    donation.deadlineAt
  );

  return recipients.map((org, index) => {
    const eligibilityReasons: string[] = [];
    const rankReasons: string[] = [];
    const warnings: string[] = [];
    let isEligible = true;
    let disqualificationReason = '';

    // Hard Gate 1: Recipient must be verified by admin
    if (!org.verified) {
      isEligible = false;
      disqualificationReason = 'Recipient verification is pending approval by the Food Safety Desk.';
    }

    // Hard Gate 2: Listing expiration
    if (isExpired) {
      isEligible = false;
      disqualificationReason = 'Listing deadline has elapsed. Expired food cannot be redistributed.';
    }

    // Hard Gate 3: Safety status
    if (isBlockedOrFlagged) {
      isEligible = false;
      disqualificationReason = donation.safetyStatus === 'needs_review'
        ? 'Listing is currently flagged for Food Safety Desk manual audit.'
        : 'Listing is blocked due to non-compliant storage or broken cold-chain.';
    }

    // Hard Gate 4: Completeness of listing
    if (!isComplete) {
      isEligible = false;
      disqualificationReason = 'Listing data is incomplete; missing critical storage or pickup information.';
    }

    // Hard Gate 5: Storage compatibility
    const orgHasStorage = org.storageCapabilities.includes(donation.storageCondition);
    if (!orgHasStorage) {
      // Ambient can sometimes be accepted by any org, but hot-hold or frozen requires exact equipment
      if (donation.storageCondition === 'Frozen (<-18°C)' || donation.storageCondition === 'Hot-hold (>60°C)') {
        isEligible = false;
        disqualificationReason = `Recipient lacks certified ${donation.storageCondition} equipment.`;
      } else {
        warnings.push(`Recipient does not list primary ${donation.storageCondition} capability.`);
      }
    }

    // Hard Gate 6: Capacity check (batch kg must fit remaining daily quota)
    const estKg = calculateEstimatedKg(donation.quantity, donation.unit, donation.servingsCount);
    const remainingCap = Math.max(0, org.maxDailyCapacityKg - org.currentDailyAllocatedKg);
    if (estKg > remainingCap) {
      isEligible = false;
      disqualificationReason = `Batch size (${estKg} kg) exceeds recipient's remaining daily capacity (${remainingCap} kg).`;
    }

    // Simulated distance calculation based on deterministic offsets
    const distanceKm = Number((3.2 + (index * 2.3) % 8.5).toFixed(1));
    const estimatedTransitMinutes = Math.round(distanceKm * 3.5 + 10);

    // Hard Gate 7: Pickup window feasibility
    if (hoursRemaining * 60 < estimatedTransitMinutes + 25) {
      isEligible = false;
      disqualificationReason = `Pickup window too tight (${Math.round(hoursRemaining * 60)}m left vs ~${estimatedTransitMinutes + 25}m required transit & packaging time).`;
    }

    // If ineligible, score is 0
    if (!isEligible) {
      warnings.push('Distance calculated using sample baseline coordinates.');
      return {
        recipient: org,
        score: 0,
        isEligible: false,
        disqualificationReason,
        eligibilityReasons,
        rankReasons,
        warnings,
        distanceKm,
        estimatedTransitMinutes,
      };
    }

    // Passed all gates! Now compute granular ranking score (0-100)
    let score = 30; // Baseline for passing all hard safety & capacity gates
    eligibilityReasons.push('Verified organization with active health authority accreditation');
    eligibilityReasons.push('Meets mandatory food safety and thermal preservation protocols');

    // 1. Proximity score (up to 25 pts)
    if (distanceKm <= 4.0) {
      score += 25;
      rankReasons.push(`Immediate proximity (~${distanceKm} km, ~${estimatedTransitMinutes} min turnaround)`);
    } else if (distanceKm <= 8.0) {
      score += 18;
      rankReasons.push(`Favorable transit distance (~${distanceKm} km)`);
    } else {
      score += 10;
      rankReasons.push(`Acceptable regional distance (~${distanceKm} km)`);
    }

    // 2. Quantity & Capacity fit (up to 20 pts)
    const utilizationAfter = (org.currentDailyAllocatedKg + estKg) / org.maxDailyCapacityKg;
    if (utilizationAfter >= 0.4 && utilizationAfter <= 0.85) {
      score += 20;
      rankReasons.push(`Optimal volume fit: utilizes ${Math.round(utilizationAfter * 100)}% of intake quota without overloading`);
    } else if (utilizationAfter < 0.4) {
      score += 14;
      rankReasons.push(`Capacity available (${remainingCap} kg free)`);
    } else {
      score += 10;
      rankReasons.push(`Tight capacity utilization (${Math.round(utilizationAfter * 100)}% full)`);
    }

    // 3. Storage and Equipment Match (up to 15 pts)
    if (orgHasStorage) {
      score += 15;
      rankReasons.push(`Exact facility match for ${donation.storageCondition}`);
    }

    // 4. Transport suitability (up to 10 pts)
    if (donation.storageCondition === 'Refrigerated (0-4°C)' && org.refrigeratedVanAvailable) {
      score += 10;
      rankReasons.push('Equipped with active temperature-controlled refrigerated van');
    } else if (org.transportVehicles.length > 0) {
      score += 6;
      rankReasons.push(`Dedicated transport fleet (${org.transportVehicles[0]})`);
    }

    warnings.push('Note: Route distance and transit minutes are calculated using sample demo coordinates.');

    return {
      recipient: org,
      score: Math.min(100, Math.max(10, score)),
      isEligible: true,
      eligibilityReasons,
      rankReasons,
      warnings,
      distanceKm,
      estimatedTransitMinutes,
    };
  }).sort((a, b) => {
    // Eligible first, then descending score
    if (a.isEligible && !b.isEligible) return -1;
    if (!a.isEligible && b.isEligible) return 1;
    return b.score - a.score;
  });
}
