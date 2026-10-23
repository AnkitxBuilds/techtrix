import React, { useState } from 'react';
import {
  X,
  Clock,
  MapPin,
  Thermometer,
  Package,
  ShieldCheck,
  AlertTriangle,
  Building2,
  Phone,
  Sparkles,
  Truck,
  CheckCircle2,
  Check,
  Navigation,
  Ban
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FoodDonation } from '../../types';
import { calculateEstimatedKg } from '../../services/quantityUtils';

export const DonationDetailModal: React.FC = () => {
  const {
    activeDetailDonation,
    setActiveDetailDonation,
    donations,
    role,
    setRole,
    setDonorView,
    setRecipientView,
    currentRecipient,
    acceptDonation,
    cancelDonation,
    setSmartMatchTargetDonation,
    setSelectedDonationId,
  } = useApp();

  const [isAccepting, setIsAccepting] = useState(false);
  const [pickupTime, setPickupTime] = useState('Within 45 mins');
  const [assignedDriver, setAssignedDriver] = useState('Van Driver Rajesh (Volunteer)');
  const [assignedVehicle, setAssignedVehicle] = useState('Insulated Van #01');
  const [safetyCheckConfirmed, setSafetyCheckConfirmed] = useState(false);

  if (!activeDetailDonation) return null;

  // Always bind to latest reactive state in donations array
  const donation = (donations.find((d) => d.id === activeDetailDonation.id)) || activeDetailDonation;

  const now = new Date().getTime();
  const deadline = new Date(donation.deadlineAt).getTime();
  const hoursLeft = (deadline - now) / (1000 * 3600);
  const isUrgent = hoursLeft > 0 && hoursLeft <= 3.0;
  const isExpired = hoursLeft <= 0 || donation.status === 'expired';

  const batchKg = calculateEstimatedKg(donation.quantity, donation.unit, donation.servingsCount);
  const remainingRecipientCapacity = Math.max(0, currentRecipient.maxDailyCapacityKg - currentRecipient.currentDailyAllocatedKg);
  const hasCapacity = batchKg <= remainingRecipientCapacity;

  const handleConfirmAccept = async () => {
    if (!safetyCheckConfirmed) return;
    const ok = await acceptDonation(donation.id, pickupTime, assignedDriver, assignedVehicle);
    if (ok) {
      setIsAccepting(false);
      setActiveDetailDonation(null);
      setRole('recipient');
      setRecipientView('accepted');
    }
  };

  const handleViewSmartMatch = () => {
    setSmartMatchTargetDonation(donation);
    setActiveDetailDonation(null);
    setRole('donor');
    setDonorView('smartmatch');
  };

  const handleTrackDonation = () => {
    setSelectedDonationId(donation.id);
    setActiveDetailDonation(null);
    if (role === 'donor') {
      setDonorView('tracking');
    } else {
      setRole('recipient');
      setRecipientView('tracking');
    }
  };

  const handleCancel = () => {
    if (confirm(`Are you sure you want to cancel the listing "${donation.title}"?`)) {
      cancelDonation(donation.id, 'Cancelled by donor from detail view');
      setActiveDetailDonation(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-3xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#1b4332] text-white px-6 py-4 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-800 text-emerald-200 px-2 py-0.5 rounded border border-emerald-700/60">
                {donation.category}
              </span>
              <span className="text-xs text-emerald-200">ID: {donation.id}</span>
              {/* Urgency Badge */}
              {isExpired ? (
                <span className="text-xs font-semibold bg-rose-600 text-white px-2 py-0.5 rounded">
                  Expired
                </span>
              ) : isUrgent ? (
                <span className="text-xs font-semibold bg-amber-500 text-stone-950 px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                  <Clock className="w-3 h-3" />
                  Urgent ({hoursLeft.toFixed(1)}h left)
                </span>
              ) : (
                <span className="text-xs font-medium bg-emerald-700/60 text-emerald-100 px-2 py-0.5 rounded">
                  {hoursLeft.toFixed(1)}h pickup window
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white line-clamp-2">
              {donation.title}
            </h2>
          </div>
          <button
            onClick={() => {
              setActiveDetailDonation(null);
              setIsAccepting(false);
            }}
            className="text-white/80 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Safety Gate Alert if flagged or blocked */}
        {donation.safetyStatus !== 'eligible' && (
          <div className={`px-6 py-3 flex items-start gap-2.5 text-xs ${
            donation.safetyStatus === 'blocked'
              ? 'bg-rose-50 border-b border-rose-200 text-rose-950'
              : 'bg-amber-50 border-b border-amber-200 text-amber-950'
          }`}>
            <AlertTriangle className={`w-4 h-4 shrink-0 mt-0.5 ${
              donation.safetyStatus === 'blocked' ? 'text-rose-600' : 'text-amber-600'
            }`} />
            <div>
              <strong className="font-semibold capitalize">Safety Notice ({donation.safetyStatus.replace('_', ' ')}):</strong>{' '}
              {donation.safetyReviewNotes || 'This item requires verification by the Food Safety Desk.'}
            </div>
          </div>
        )}

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-stone-700 text-sm">
          {/* Top Banner: Image & Key Specs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="md:col-span-1 rounded-xl overflow-hidden border border-stone-200 bg-stone-100 relative h-48 md:h-full min-h-[170px]">
              <img
                src={donation.imageUrl}
                alt={donation.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 right-2 bg-stone-900/80 backdrop-blur-xs text-white text-[11px] p-1.5 rounded text-center">
                Sample photo preview
              </div>
            </div>

            <div className="md:col-span-2 space-y-4">
              {/* Metric Highlights */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                  <div className="text-xl font-bold text-stone-900">
                    {donation.quantity} <span className="text-xs font-normal text-stone-600">{donation.unit}</span>
                  </div>
                  <div className="text-[11px] text-stone-600 mt-0.5">Surplus Quantity</div>
                </div>

                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 text-center">
                  <div className="text-xl font-bold text-emerald-900">
                    ~{donation.servingsCount}
                  </div>
                  <div className="text-[11px] text-emerald-700 mt-0.5">Est. Individuals Fed</div>
                </div>

                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-center">
                  <div className="text-xs font-bold text-stone-800 capitalize mt-1">
                    {donation.status.replace('_', ' ')}
                  </div>
                  <div className="text-[11px] text-stone-600 mt-1">Redistribution Stage</div>
                </div>
              </div>

              {/* Technical Food Specs */}
              <div className="space-y-2 text-xs border border-stone-200 rounded-xl p-3.5 bg-stone-50/50">
                <div className="flex items-center justify-between py-1 border-b border-stone-200/60">
                  <span className="text-stone-600 flex items-center gap-1.5">
                    <Thermometer className="w-3.5 h-3.5 text-stone-400" />
                    Storage Requirement
                  </span>
                  <span className="font-semibold text-stone-900">{donation.storageCondition}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-200/60">
                  <span className="text-stone-600 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-stone-400" />
                    Packaging Type
                  </span>
                  <span className="font-semibold text-stone-900">{donation.packagingType}</span>
                </div>
                <div className="flex items-center justify-between py-1 border-b border-stone-200/60">
                  <span className="text-stone-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    Prepared Timestamp
                  </span>
                  <span className="font-medium text-stone-800">
                    {new Date(donation.preparedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                    {new Date(donation.preparedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-stone-600 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Collection Deadline
                  </span>
                  <span className="font-bold text-amber-900">
                    {new Date(donation.deadlineAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                    {new Date(donation.deadlineAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>

              {/* Dietary Tags & Allergens */}
              <div className="flex flex-wrap items-center gap-1.5">
                {donation.dietaryTags.map((tag) => (
                  <span
                    key={tag}
                    className="text-[11px] font-semibold bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded-full"
                  >
                    ✓ {tag}
                  </span>
                ))}
                {donation.allergens.length > 0 ? (
                  donation.allergens.map((alg) => (
                    <span
                      key={alg}
                      className="text-[11px] font-medium bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full"
                    >
                      Contains {alg}
                    </span>
                  ))
                ) : (
                  <span className="text-[11px] font-medium bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                    No major allergens noted
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Handling & Safety Notes */}
          <div className="bg-stone-50 rounded-xl p-4 border border-stone-200 space-y-1.5">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-800" />
              Food Handling & Preparation Notes
            </h4>
            <p className="text-xs text-stone-600 leading-relaxed">
              {donation.handlingNotes || 'Standard safe catering protocol adhered to by donor establishment.'}
            </p>
          </div>

          {/* Donor Information & Location */}
          <div className="border border-stone-200 rounded-xl p-4 bg-white space-y-3">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-emerald-800" />
              Pickup Establishment & Location
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-stone-900">{donation.donorName}</div>
                <div className="text-stone-500">{donation.donorType} • Verified Establishment</div>
                <div className="flex items-center gap-1 text-stone-600 pt-1">
                  <Phone className="w-3.5 h-3.5 text-stone-400" />
                  <span>{donation.contactPhone}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-start gap-1.5 text-stone-600">
                  <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <span>{donation.pickupAddress}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-stone-500 pt-1">
                  <Navigation className="w-3.5 h-3.5 text-stone-400" />
                  <span>Sample proximity: ~{donation.sampleDistanceKm || 4.2} km from central hub</span>
                </div>
              </div>
            </div>
          </div>

          {/* If already accepted: show recipient details */}
          {donation.acceptedByOrgName && (
            <div className="bg-emerald-50/80 rounded-xl p-4 border border-emerald-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Accepted By Recipient
                </span>
                <span className="text-emerald-800 font-medium">
                  {donation.scheduledPickupTime ? `Target: ${donation.scheduledPickupTime}` : ''}
                </span>
              </div>
              <p className="text-emerald-900">
                Coordinated with <strong>{donation.acceptedByOrgName}</strong>. Driver:{' '}
                {donation.assignedDriverName || 'Field Team'} ({donation.assignedVehicle || 'Standard Van'}).
              </p>
            </div>
          )}

          {/* Inline Acceptance Form for Recipients */}
          {isAccepting && (
            <div className="bg-emerald-50/90 rounded-xl p-5 border-2 border-emerald-700 space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  Claim Food Donation for {currentRecipient.name}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsAccepting(false)}
                  className="text-xs text-stone-500 hover:text-stone-800"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-emerald-950 mb-1">
                    Estimated Pickup Time:
                  </label>
                  <select
                    value={pickupTime}
                    onChange={(e) => setPickupTime(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-800"
                  >
                    <option value="Within 30 mins">Immediately (within 30 mins)</option>
                    <option value="Within 45 mins">Within 45 mins</option>
                    <option value="Within 1.5 hours">Within 1.5 hours</option>
                    <option value="By 5:00 PM">By 5:00 PM today</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-emerald-950 mb-1">
                    Assigned Dispatch / Driver:
                  </label>
                  <input
                    type="text"
                    value={assignedDriver}
                    onChange={(e) => setAssignedDriver(e.target.value)}
                    className="w-full bg-white border border-stone-300 rounded-lg p-2 text-stone-800"
                    placeholder="Volunteer / Driver Name"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-emerald-950 bg-white/80 p-3 rounded-lg border border-emerald-200">
                <input
                  type="checkbox"
                  checked={safetyCheckConfirmed}
                  onChange={(e) => setSafetyCheckConfirmed(e.target.checked)}
                  className="rounded text-emerald-800 focus:ring-emerald-700 mt-0.5"
                />
                <span>
                  I confirm that <strong>{currentRecipient.name}</strong> will transport and maintain this donation in accordance with required storage conditions (<strong>{donation.storageCondition}</strong>) and distribute it promptly before consumption expiry.
                </span>
              </label>

              <button
                type="button"
                disabled={!safetyCheckConfirmed}
                onClick={handleConfirmAccept}
                className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  safetyCheckConfirmed
                    ? 'bg-[#1b4332] text-white hover:bg-emerald-900 shadow-sm'
                    : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Confirm Pickup Commitment & Update Shared Status
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              onClick={handleViewSmartMatch}
              className="px-3.5 py-2 text-xs font-semibold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              View SmartMatch Engine
            </button>

            {donation.status !== 'available' && (
              <button
                onClick={handleTrackDonation}
                className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-100 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" />
                Live Tracking Timeline
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {role === 'donor' && donation.status === 'available' && (
              <button
                onClick={handleCancel}
                className="px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors flex items-center gap-1"
              >
                <Ban className="w-3.5 h-3.5" />
                Cancel Listing
              </button>
            )}

            {/* Recipient-only Accept Controls (strictly hidden from donors) */}
            {role === 'recipient' && donation.status === 'available' && donation.safetyStatus === 'eligible' && !isExpired && (
              !currentRecipient.verified ? (
                <div
                  title="Accreditation pending at Food Safety Desk"
                  className="px-4 py-2 text-xs font-semibold text-amber-900 bg-amber-100 border border-amber-300 rounded-lg cursor-not-allowed flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Accreditation Pending</span>
                </div>
              ) : !hasCapacity ? (
                <div
                  title={`Batch weight (${batchKg} kg) exceeds remaining intake capacity (${remainingRecipientCapacity} kg)`}
                  className="px-4 py-2 text-xs font-semibold text-rose-800 bg-rose-100 border border-rose-300 rounded-lg cursor-not-allowed flex items-center gap-1.5"
                >
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-700" />
                  <span>Capacity Exceeded ({batchKg}kg)</span>
                </div>
              ) : (
                <button
                  onClick={() => setIsAccepting(true)}
                  className="px-5 py-2 text-xs font-bold text-white bg-[#1b4332] hover:bg-emerald-900 rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  Accept Food Donation
                </button>
              )
            )}

            <button
              onClick={() => {
                setActiveDetailDonation(null);
                setIsAccepting(false);
              }}
              className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-200/70 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
