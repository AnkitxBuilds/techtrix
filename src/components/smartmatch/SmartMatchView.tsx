import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Thermometer,
  Truck,
  ArrowRight,
  Info,
  Check,
  XCircle,
  Building2,
  Send,
  UtensilsCrossed
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { evaluateSmartMatches } from '../../services/smartMatch';
import { FoodDonation, SmartMatchResult } from '../../types';

export const SmartMatchView: React.FC = () => {
  const {
    donations,
    organizations,
    smartMatchTargetDonation,
    setSmartMatchTargetDonation,
    setActiveDetailDonation,
    setSelectedDonationId,
    setRole,
    setDonorView,
    setRecipientView,
    addToast,
  } = useApp();

  // Selected donation to analyze
  const activeDonations = useMemo(
    () => donations.filter((d) => d.status !== 'cancelled'),
    [donations]
  );

  const [selectedDonationId, setSelectedDonationIdLocal] = useState<string>(
    smartMatchTargetDonation?.id || activeDonations[0]?.id || ''
  );

  const targetDonation: FoodDonation | undefined = useMemo(() => {
    return donations.find((d) => d.id === selectedDonationId) || activeDonations[0];
  }, [donations, selectedDonationId, activeDonations]);

  const matchResults: SmartMatchResult[] = useMemo(() => {
    if (!targetDonation) return [];
    return evaluateSmartMatches(targetDonation, organizations);
  }, [targetDonation, organizations]);

  const [alertSentOrgIds, setAlertSentOrgIds] = useState<string[]>([]);

  const handleSendPriorityAlert = (orgId: string, orgName: string) => {
    setAlertSentOrgIds((prev) => [...prev, orgId]);
    addToast({
      type: 'success',
      title: 'Priority Match Request Sent',
      message: `Dispatched direct pickup notification to ${orgName}.`,
    });
  };

  if (!targetDonation) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8">
        <Sparkles className="w-8 h-8 text-stone-400 mx-auto mb-3" />
        <h3 className="font-bold text-stone-800 text-lg">No Active Listings to Match</h3>
        <p className="text-xs text-stone-500 mt-1 mb-4">
          Create a food donation first to run the rule-based SmartMatch engine.
        </p>
        <button
          onClick={() => setDonorView('create_donation')}
          className="px-5 py-2.5 bg-[#1b4332] text-white rounded-xl text-xs font-semibold"
        >
          Create Food Donation
        </button>
      </div>
    );
  }

  const eligibleCount = matchResults.filter((m) => m.isEligible).length;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
              Rule-Based Match Engine
            </span>
            <span className="text-xs text-stone-400">Deterministic Compatibility</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            SmartMatch Recommendation Engine
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Automated 6-gate safety verification and proximity-capacity ranking for surplus redistribution.
          </p>
        </div>

        {/* Listing Selector Switcher */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-stone-500 hidden sm:inline">Select Batch:</label>
          <select
            value={targetDonation.id}
            onChange={(e) => {
              setSelectedDonationIdLocal(e.target.value);
              const found = donations.find((d) => d.id === e.target.value);
              if (found) setSmartMatchTargetDonation(found);
            }}
            className="text-xs font-semibold bg-white border border-stone-300 rounded-lg p-2 text-stone-800 shadow-2xs max-w-[280px] truncate"
          >
            {activeDonations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id} - {d.title.substring(0, 32)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Target Donation Summary Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            {targetDonation.imageUrl ? (
              <img
                src={targetDonation.imageUrl}
                alt={targetDonation.title}
                className="w-16 h-16 rounded-xl object-cover border border-stone-200 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-400 shrink-0">
                <UtensilsCrossed className="w-6 h-6 text-stone-300" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                  {targetDonation.category}
                </span>
                <span className="text-xs font-medium text-stone-500">
                  Donor: {targetDonation.donorName}
                </span>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded capitalize ${
                  targetDonation.safetyStatus === 'eligible'
                    ? 'bg-emerald-100 text-emerald-800'
                    : targetDonation.safetyStatus === 'needs_review'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-rose-100 text-rose-900'
                }`}>
                  Safety: {targetDonation.safetyStatus.replace('_', ' ')}
                </span>
              </div>
              <h2 className="text-base font-bold text-stone-900 mt-1">
                {targetDonation.title}
              </h2>
              <div className="flex items-center gap-4 text-xs text-stone-500 mt-1 flex-wrap">
                <span>Quantity: <strong className="text-stone-800">{targetDonation.quantity} {targetDonation.unit}</strong> (~{targetDonation.servingsCount} portions)</span>
                <span>Storage: <strong className="text-stone-800">{targetDonation.storageCondition}</strong></span>
                <span>Location: <strong className="text-stone-800">{targetDonation.pickupArea}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveDetailDonation(targetDonation)}
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Inspect Batch
            </button>
          </div>
        </div>
      </div>

      {/* 6-Gate Rule Checklist Preview */}
      <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-800" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-stone-800">
              Deterministic 6-Point Eligibility Pipeline
            </h3>
          </div>
          <span className="text-xs font-semibold text-emerald-800">
            {eligibleCount} of {organizations.length} Recipients Qualified
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
          <div className="p-2.5 bg-white rounded-lg border border-stone-200">
            <div className="font-semibold text-stone-800 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-700" />
              1. Verified NGO
            </div>
            <p className="text-stone-500 mt-0.5">Admin accreditation</p>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-stone-200">
            <div className="font-semibold text-stone-800 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-700" />
              2. Shelf-Life Gate
            </div>
            <p className="text-stone-500 mt-0.5">Non-expired deadline</p>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-stone-200">
            <div className="font-semibold text-stone-800 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-700" />
              3. Info Completeness
            </div>
            <p className="text-stone-500 mt-0.5">Allergens & temps</p>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-stone-200">
            <div className="font-semibold text-stone-800 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-700" />
              4. Thermal Equip.
            </div>
            <p className="text-stone-500 mt-0.5">Hot-hold/Cold chains</p>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-stone-200">
            <div className="font-semibold text-stone-800 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-700" />
              5. Quota Capacity
            </div>
            <p className="text-stone-500 mt-0.5">Weight fits quota</p>
          </div>

          <div className="p-2.5 bg-white rounded-lg border border-stone-200">
            <div className="font-semibold text-stone-800 flex items-center gap-1">
              <Check className="w-3 h-3 text-emerald-700" />
              6. Transit Feasibility
            </div>
            <p className="text-stone-500 mt-0.5">ETA &lt; deadline</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-stone-500 pt-1">
          <Info className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <span>
            Strict compliance note: High compatibility scores never override failed safety, verification, or temperature checks.
          </span>
        </div>
      </div>

      {/* Ranked Candidate Results */}
      <div className="space-y-4">
        <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider">
          Ranked Candidate Matches ({matchResults.length} Evaluated)
        </h3>

        <div className="space-y-3">
          {matchResults.map((result, idx) => {
            const org = result.recipient;
            const isAlertSent = alertSentOrgIds.includes(org.id);

            return (
              <div
                key={org.id}
                className={`bg-white rounded-2xl border p-5 transition-all shadow-xs ${
                  result.isEligible
                    ? 'border-stone-200 hover:border-emerald-600/50 hover:shadow-md'
                    : 'border-stone-200/60 bg-stone-50/50 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  {/* Left Column: Organization & Score */}
                  <div className="flex items-start gap-4">
                    {/* Score Ring / Badge */}
                    <div className="text-center shrink-0">
                      <div className={`w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-extrabold ${
                        result.isEligible
                          ? result.score >= 85
                            ? 'bg-emerald-900 text-white shadow-xs'
                            : 'bg-emerald-100 text-emerald-900'
                          : 'bg-stone-200 text-stone-500'
                      }`}>
                        <span className="text-lg leading-none">{result.isEligible ? result.score : '0'}</span>
                        <span className="text-[10px] font-semibold">
                          {result.isEligible ? 'Score' : 'Blocked'}
                        </span>
                      </div>
                      <span className="text-[10px] font-medium text-stone-400 mt-1 block">
                        Rank #{idx + 1}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-stone-900 text-base">
                          {org.name}
                        </h4>
                        <span className="text-[10px] font-semibold bg-stone-100 text-stone-600 px-2 py-0.5 rounded">
                          {org.type}
                        </span>
                        {org.verified ? (
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-200/60">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            {org.verificationNumber}
                          </span>
                        ) : (
                          <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 border border-amber-200">
                            Verification Pending
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-stone-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-stone-400" />
                          ~{result.distanceKm} km ({result.estimatedTransitMinutes}m turnaround)
                        </span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-stone-400" />
                          Capacity: {org.currentDailyAllocatedKg} / {org.maxDailyCapacityKg} kg used
                        </span>
                        <span className="flex items-center gap-1">
                          <Truck className="w-3.5 h-3.5 text-stone-400" />
                          {org.transportVehicles[0] || 'Standard Vehicle'}
                        </span>
                      </div>

                      {/* Plain-language ranking explanations */}
                      {result.isEligible ? (
                        <div className="pt-2 flex flex-wrap gap-1.5">
                          {result.rankReasons.map((reason, i) => (
                            <span
                              key={i}
                              className="text-[11px] bg-emerald-50 text-emerald-850 px-2.5 py-1 rounded-md border border-emerald-200/60 flex items-center gap-1 font-medium"
                            >
                              <CheckCircle2 className="w-3 h-3 text-emerald-700 shrink-0" />
                              {reason}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <div className="pt-2">
                          <span className="text-xs font-semibold bg-rose-50 text-rose-800 px-2.5 py-1 rounded-md border border-rose-200 flex items-center gap-1.5">
                            <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            Disqualified: {result.disqualificationReason}
                          </span>
                        </div>
                      )}

                      {/* Warnings if distance is estimated */}
                      {result.warnings.length > 0 && (
                        <p className="text-[11px] text-stone-400 italic pt-1">
                          {result.warnings[0]}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    {result.isEligible && (
                      <button
                        onClick={() => handleSendPriorityAlert(org.id, org.name)}
                        disabled={isAlertSent}
                        className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isAlertSent
                            ? 'bg-stone-100 text-stone-500 cursor-default'
                            : 'bg-[#1b4332] text-white hover:bg-emerald-900 shadow-xs'
                        }`}
                      >
                        {isAlertSent ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Alert Dispatched</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5 text-emerald-300" />
                            <span>Alert Recipient</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setActiveDetailDonation(targetDonation);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
