import React, { useState, useMemo } from 'react';
import {
  Truck,
  CheckCircle2,
  Clock,
  MapPin,
  Building2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Thermometer,
  Package,
  RotateCcw,
  Check,
  XCircle,
  Navigation,
  FileText
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FoodDonation, DonationStatus } from '../../types';

export const TrackingView: React.FC = () => {
  const {
    donations,
    selectedDonationId,
    setSelectedDonationId,
    advanceStage,
    cancelDonation,
    setActiveDetailDonation,
    role,
  } = useApp();

  // Find donation being tracked
  const trackableDonations = useMemo(
    () => donations.filter((d) => d.status !== 'cancelled'),
    [donations]
  );

  const [activeId, setActiveId] = useState<string>(
    selectedDonationId || trackableDonations.find((d) => d.status !== 'available')?.id || trackableDonations[0]?.id || ''
  );

  const donation = useMemo(() => {
    return donations.find((d) => d.id === activeId) || trackableDonations[0];
  }, [donations, activeId, trackableDonations]);

  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('Recipient vehicle breakdown on transit route');

  if (!donation) {
    return (
      <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8">
        <Truck className="w-8 h-8 text-stone-400 mx-auto mb-3" />
        <h3 className="font-bold text-stone-800 text-lg">No Active Batches to Track</h3>
        <p className="text-xs text-stone-500 mt-1">
          Explore or create a donation to view its lifecycle tracking timeline.
        </p>
      </div>
    );
  }

  const STAGES: { key: DonationStatus; label: string; desc: string }[] = [
    { key: 'available', label: '1. Available', desc: 'Surplus logged with safety specs' },
    { key: 'accepted', label: '2. Accepted', desc: 'Verified NGO claimed batch' },
    { key: 'pickup_scheduled', label: '3. In Transit', desc: 'Driver dispatched with transport' },
    { key: 'picked_up', label: '4. Picked Up', desc: 'Inspected, sealed & loaded' },
    { key: 'delivered', label: '5. Delivered', desc: 'Received at community kitchen' },
  ];

  const currentStageIdx = STAGES.findIndex((s) => s.key === donation.status);
  const isFinal = donation.status === 'delivered';
  const isCancelled = donation.status === 'cancelled';
  const isExpired = donation.status === 'expired';

  const handleAdvance = () => {
    advanceStage(donation.id);
  };

  const handleConfirmCancel = () => {
    cancelDonation(donation.id, cancelReason);
    setCancelModalOpen(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header & Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
              Chain of Custody
            </span>
            <span className="text-xs text-stone-400">Live 5-Stage Lifecycle</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Donation Tracking & Verification
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Real-time status synchronizing donor and recipient records.
          </p>
        </div>

        {/* Batch selector */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-stone-500 hidden sm:inline">Track Batch:</label>
          <select
            value={donation.id}
            onChange={(e) => {
              setActiveId(e.target.value);
              setSelectedDonationId(e.target.value);
            }}
            className="text-xs font-semibold bg-white border border-stone-300 rounded-lg p-2 text-stone-800 shadow-2xs max-w-[280px] truncate"
          >
            {trackableDonations.map((d) => (
              <option key={d.id} value={d.id}>
                {d.id} - {d.title.substring(0, 30)}... ({d.status})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Donation Tracking Summary Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-stone-100">
          <div className="flex items-start gap-4">
            <img
              src={donation.imageUrl}
              alt={donation.title}
              className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                  {donation.category}
                </span>
                <span className="text-xs text-stone-500">ID: {donation.id}</span>
                <span className={`text-xs font-bold px-2.5 py-0.5 rounded uppercase tracking-wider ${
                  isFinal
                    ? 'bg-emerald-100 text-emerald-800'
                    : isCancelled
                    ? 'bg-rose-100 text-rose-800'
                    : isExpired
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-amber-100 text-amber-900'
                }`}>
                  {donation.status.replace('_', ' ')}
                </span>
              </div>

              <h2 className="text-lg font-bold text-stone-900 mt-1">{donation.title}</h2>

              <div className="flex items-center gap-4 text-xs text-stone-500 mt-1 flex-wrap">
                <span>Quantity: <strong className="text-stone-800">{donation.quantity} {donation.unit}</strong> (~{donation.servingsCount} portions)</span>
                <span>•</span>
                <span>Storage: <strong>{donation.storageCondition}</strong></span>
                <span>•</span>
                <span>Packaging: <strong>{donation.packagingType}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveDetailDonation(donation)}
              className="px-3.5 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition-colors"
            >
              Inspect Batch
            </button>
          </div>
        </div>

        {/* 5-Step Visual Stepper */}
        <div className="py-2">
          <div className="hidden sm:grid sm:grid-cols-5 gap-2 relative">
            {STAGES.map((stage, idx) => {
              const isPast = currentStageIdx > idx || isFinal;
              const isCurrent = currentStageIdx === idx && !isFinal && !isCancelled;

              return (
                <div key={stage.key} className="flex flex-col items-center text-center relative group">
                  {/* Step Circle */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      isPast
                        ? 'bg-[#1b4332] text-white shadow-2xs'
                        : isCurrent
                        ? 'bg-amber-500 text-stone-950 ring-4 ring-amber-200 font-extrabold animate-pulse'
                        : 'bg-stone-100 text-stone-400 border border-stone-300'
                    }`}
                  >
                    {isPast ? <Check className="w-5 h-5 stroke-[3]" /> : idx + 1}
                  </div>

                  <span className={`text-xs font-bold mt-2 ${
                    isCurrent ? 'text-amber-900' : isPast ? 'text-stone-900' : 'text-stone-400'
                  }`}>
                    {stage.label}
                  </span>
                  <span className="text-[11px] text-stone-500 mt-0.5 line-clamp-1 max-w-[130px]">
                    {stage.desc}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Mobile view of stepper */}
          <div className="sm:hidden bg-stone-50 p-4 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
            <div>
              <span className="text-stone-500 block">Current Stage ({currentStageIdx + 1} of 5):</span>
              <strong className="text-stone-900 text-sm capitalize">
                {donation.status.replace('_', ' ')}
              </strong>
            </div>
            <div className="text-emerald-800 font-bold bg-white px-2.5 py-1 rounded border border-stone-200">
              Stage {Math.max(1, currentStageIdx + 1)}/5
            </div>
          </div>
        </div>

        {/* Transit & Parties Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Donor Origin */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
            <div className="flex items-center justify-between text-stone-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Origin: Donor Loading Bay</span>
              <Building2 className="w-3.5 h-3.5" />
            </div>
            <div className="font-bold text-stone-900 text-sm">{donation.donorName}</div>
            <div className="text-stone-600 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0 mt-0.5" />
              <span>{donation.pickupAddress}</span>
            </div>
            <div className="text-stone-500">Phone: {donation.contactPhone}</div>
          </div>

          {/* Recipient Destination */}
          <div className="p-4 rounded-xl bg-stone-50 border border-stone-200 space-y-2 text-xs">
            <div className="flex items-center justify-between text-stone-500">
              <span className="font-semibold uppercase tracking-wider text-[10px]">Destination: Recipient Kitchen</span>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            </div>
            <div className="font-bold text-stone-900 text-sm">
              {donation.acceptedByOrgName || 'Pending Recipient Acceptance'}
            </div>
            <div className="text-stone-600">
              Target Arrival: {donation.scheduledPickupTime || 'Coordinating'}
            </div>
            <div className="text-stone-500">
              Assigned: {donation.assignedDriverName || 'Field Team'} ({donation.assignedVehicle || 'Standard Transport'})
            </div>
          </div>
        </div>

        {/* Route visualization mockup */}
        <div className="bg-stone-100/70 rounded-xl p-4 border border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-600">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-emerald-800 shrink-0" />
            <div>
              <strong className="text-stone-800">Sample Transit Corridor:</strong> ~{donation.sampleDistanceKm || 3.8} km distance (~18 min average turnaround).
            </div>
          </div>
          <span className="text-[11px] text-stone-400 bg-white px-2 py-0.5 rounded border border-stone-200 shrink-0">
            Sample Route Simulation
          </span>
        </div>

        {/* Transition Control Action Bar */}
        {!isFinal && !isCancelled && !isExpired && (
          <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-xs text-emerald-950">
              <span className="font-bold block">Advance Lifecycle Stage:</span>
              <span className="text-emerald-900/80">
                Move status forward to update both donor and recipient dashboards simultaneously.
              </span>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setCancelModalOpen(true)}
                className="px-3 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition-colors"
              >
                Report Issue / Cancel
              </button>

              <button
                onClick={handleAdvance}
                className="flex-1 sm:flex-none px-5 py-2.5 text-xs font-bold bg-[#1b4332] hover:bg-emerald-900 text-white rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>
                  {donation.status === 'available' && 'Simulate Recipient Acceptance →'}
                  {donation.status === 'accepted' && 'Dispatch Driver (In Transit) →'}
                  {donation.status === 'pickup_scheduled' && 'Confirm Food Loaded (Picked Up) →'}
                  {donation.status === 'picked_up' && 'Confirm Safe Delivery at Kitchen ✓'}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Status History & Audit Log */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-800" />
            <h3 className="font-bold text-stone-900 text-sm uppercase tracking-wider">
              Verification & Custody Audit Log ({donation.statusHistory.length} Events)
            </h3>
          </div>
          <span className="text-xs text-stone-500">Immutable Log Chain</span>
        </div>

        <div className="space-y-4">
          {donation.statusHistory.map((item, idx) => (
            <div key={item.id || idx} className="flex items-start gap-3.5 relative">
              {idx !== donation.statusHistory.length - 1 && (
                <div className="absolute top-7 left-3 w-0.5 h-[calc(100%-4px)] bg-stone-200 -z-0" />
              )}
              <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-900 flex items-center justify-center shrink-0 z-10 text-xs font-bold border border-emerald-300">
                ✓
              </div>
              <div className="space-y-1 flex-1 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 capitalize text-sm">
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-[11px] text-stone-500 bg-stone-100 px-2 py-0.2 rounded font-medium">
                      {item.actor}
                    </span>
                  </div>
                  <span className="text-[11px] text-stone-400">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })},{' '}
                    {new Date(item.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <p className="text-stone-600 leading-relaxed bg-stone-50/70 p-2.5 rounded-lg border border-stone-200/60">
                  {item.note}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="font-bold text-stone-900 text-base">Cancel Redistribution Pickup</h3>
            </div>
            <p className="text-xs text-stone-600 leading-relaxed">
              Cancelling will release or invalidate this batch and record a permanent reason in the audit log.
            </p>

            <div className="space-y-1.5 text-xs">
              <label className="block font-semibold text-stone-700">Cancellation Reason:</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full p-2 border border-stone-300 rounded-lg text-stone-800"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setCancelModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Never mind
              </button>
              <button
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
