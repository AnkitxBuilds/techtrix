import React, { useState, useMemo } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Truck,
  MapPin,
  Thermometer,
  Layers,
  Search,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle,
  Building2,
  Calendar,
  Save,
  Check,
  UtensilsCrossed
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { StorageCondition } from '../../types';

export const RecipientDashboard: React.FC = () => {
  const {
    currentRecipient,
    updateOrgProfile,
    donations,
    recipientView,
    setRecipientView,
    setActiveDetailDonation,
    setSelectedDonationId,
    advanceStage,
  } = useApp();

  // Pickups accepted by this recipient — match by ID (primary) or exact org name (fallback)
  const myAcceptedDonations = useMemo(() => {
    return donations.filter((d) => {
      if (!d.acceptedByOrgId && !d.acceptedByOrgName) return false;
      return (
        ['accepted', 'pickup_scheduled', 'picked_up', 'delivered'].includes(d.status) &&
        (
        d.acceptedByOrgId === currentRecipient.id ||
        d.acceptedByOrgName === currentRecipient.name ||
        (d.acceptedByOrgName && currentRecipient.name &&
          d.acceptedByOrgName.toLowerCase() === currentRecipient.name.toLowerCase())
        )
      );
    });
  }, [donations, currentRecipient]);

  const activePickups = myAcceptedDonations.filter((donation) => donation.status !== 'delivered');
  const completedPickups = myAcceptedDonations.filter((donation) => donation.status === 'delivered');

  // Urgent available donations (< 3 hours)
  const urgentAvailable = useMemo(() => {
    const now = new Date().getTime();
    return donations.filter((d) => {
      if (d.status !== 'available' || d.safetyStatus !== 'eligible') return false;
      const deadline = new Date(d.deadlineAt).getTime();
      const hoursLeft = (deadline - now) / (1000 * 3600);
      return hoursLeft > 0 && hoursLeft <= 3.0;
    });
  }, [donations]);

  // Capacity calculation
  const capacityUsedPercent = Math.min(
    100,
    Math.round((currentRecipient.currentDailyAllocatedKg / currentRecipient.maxDailyCapacityKg) * 100)
  );

  // Edit Profile / Capacity form state
  const [editMaxCapacity, setEditMaxCapacity] = useState(currentRecipient.maxDailyCapacityKg);
  const [editServiceArea, setEditServiceArea] = useState(currentRecipient.serviceArea);
  const [editStorageCaps, setEditStorageCaps] = useState<StorageCondition[]>(currentRecipient.storageCapabilities);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  const STORAGE_ALL_OPTIONS: StorageCondition[] = [
    'Hot-hold (>60°C)',
    'Refrigerated (0-4°C)',
    'Ambient / Room Temp',
    'Frozen (<-18°C)',
  ];

  const handleToggleStorage = (sc: StorageCondition) => {
    setEditStorageCaps((prev) =>
      prev.includes(sc) ? prev.filter((s) => s !== sc) : [...prev, sc]
    );
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateOrgProfile({
      maxDailyCapacityKg: Number(editMaxCapacity),
      serviceArea: editServiceArea,
      storageCapabilities: editStorageCaps,
    });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 3000);
  };

  // Render Org Profile Requirements subview
  if (recipientView === 'profile_requirements') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
              Organization Settings
            </span>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-1">
              Food Requirements & Capacity Profile
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              Configure daily intake quotas and verified handling equipment for SmartMatch compatibility.
            </p>
          </div>
          <button
            onClick={() => setRecipientView('overview')}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 px-3 py-1.5 rounded-lg"
          >
            &larr; Back to Dashboard
          </button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
            <div className="flex items-start gap-4 pb-4 border-b border-stone-100">
              <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                <HeartHandshake className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-stone-900">{currentRecipient.name}</h2>
                  {currentRecipient.isIllustrative ? (
                    <span className="text-xs font-semibold bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                      Illustrative eligibility state
                    </span>
                  ) : currentRecipient.verified ? (
                    <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified NGO ({currentRecipient.verificationNumber})
                    </span>
                  ) : (
                    <span className="text-xs font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      Pending Verification
                    </span>
                  )}
                </div>
                <p className="text-xs text-stone-500 mt-1">
                  Type: <strong>{currentRecipient.type}</strong> • Operating Hours: {currentRecipient.operatingHours}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
              <div className="space-y-1.5">
                <label className="block font-semibold text-stone-700">
                  Maximum Daily Intake Capacity (kg):
                </label>
                <input
                  type="number"
                  min="20"
                  max="2000"
                  value={editMaxCapacity}
                  onChange={(e) => setEditMaxCapacity(Number(e.target.value))}
                  className="w-full p-2.5 text-sm rounded-lg border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-700"
                />
                <p className="text-[11px] text-stone-500">
                  Current intake today: {currentRecipient.currentDailyAllocatedKg} kg (~{capacityUsedPercent}% quota used).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-stone-700">
                  Service Area / Transit Radius:
                </label>
                <input
                  type="text"
                  value={editServiceArea}
                  onChange={(e) => setEditServiceArea(e.target.value)}
                  className="w-full p-2.5 text-sm rounded-lg border border-stone-300 bg-stone-50/50 focus:bg-white focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="sm:col-span-2 space-y-2">
                <label className="block font-semibold text-stone-700">
                  Certified Storage Facilities Available on Site:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {STORAGE_ALL_OPTIONS.map((sc) => (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => handleToggleStorage(sc)}
                      className={`p-3 rounded-xl border text-left text-xs font-medium transition-all ${
                        editStorageCaps.includes(sc)
                          ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-semibold ring-1 ring-emerald-600/30'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Thermometer className="w-3.5 h-3.5 text-emerald-700" />
                        {editStorageCaps.includes(sc) && <Check className="w-3.5 h-3.5 text-emerald-700" />}
                      </div>
                      <span>{sc}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100 flex items-center justify-between">
              {isSavedNotice ? (
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  Capacity and storage criteria saved to shared local state!
                </span>
              ) : (
                <span className="text-xs text-stone-400">
                  Changes immediately adjust SmartMatch ranking weights.
                </span>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-[#1b4332] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <Save className="w-4 h-4 text-emerald-300" />
                <span>Save Profile Updates</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // Render My Accepted Pickups tab
  if (recipientView === 'accepted') {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
              Collection History
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
              My Collections
            </h1>
            <p className="text-xs sm:text-sm text-stone-500">
              Coordinated collections for <strong>{currentRecipient.name}</strong>.
            </p>
          </div>

          <button
            onClick={() => setRecipientView('explore')}
            className="px-4 py-2 text-xs font-bold bg-[#1b4332] text-white rounded-xl hover:bg-emerald-900 transition-colors self-start sm:self-auto"
          >
            + Claim More Food
          </button>
        </div>

        {myAcceptedDonations.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <Clock className="w-8 h-8 text-stone-400 mx-auto" />
            <h3 className="font-bold text-stone-800 text-lg">No Active Pickups Yet</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Your organization has not claimed any surplus food batches today. Explore the available listings to claim surplus food for your community.
            </p>
            <button
              onClick={() => setRecipientView('explore')}
              className="px-5 py-2.5 bg-emerald-800 text-white rounded-xl text-xs font-semibold"
            >
              Explore Available Donations
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {myAcceptedDonations.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-stone-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {d.imageUrl ? (
                      <img
                        src={d.imageUrl}
                        alt={d.title}
                        className="w-20 h-20 rounded-xl object-cover shrink-0 border border-stone-200"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-xl shrink-0 border border-stone-200 bg-stone-100 flex items-center justify-center">
                        <UtensilsCrossed className="w-8 h-8 text-stone-300" />
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                          {d.category}
                        </span>
                        <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded capitalize">
                          Status: {d.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-stone-500">ID: {d.id}</span>
                      </div>

                      <h3 className="font-bold text-stone-900 text-base">{d.title}</h3>

                      <div className="flex items-center gap-4 text-xs text-stone-500 flex-wrap">
                        <span>Quantity: <strong className="text-stone-800">{d.quantity} {d.unit}</strong> (~{d.servingsCount} servings)</span>
                        <span>•</span>
                        <span>Donor: <strong>{d.donorName}</strong></span>
                        <span>•</span>
                        <span>Location: {d.pickupAddress}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                    <button
                      onClick={() => setActiveDetailDonation(d)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800"
                    >
                      Inspect Specs
                    </button>
                    <button
                      onClick={() => {
                        setSelectedDonationId(d.id);
                        setRecipientView('tracking');
                      }}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-[#1b4332] text-white hover:bg-emerald-900 shadow-xs flex items-center gap-1.5"
                    >
                      <Truck className="w-3.5 h-3.5" />
                      <span>Track & Update</span>
                    </button>
                  </div>
                </div>

                {/* Dispatch specs & Next Action */}
                <div className="bg-stone-50 rounded-xl p-3 border border-stone-200 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3 text-stone-600 flex-wrap">
                    <span>Target Time: <strong className="text-stone-900">{d.scheduledPickupTime || 'Asap'}</strong></span>
                    <span>•</span>
                    <span>Assigned: <strong className="text-stone-900">{d.assignedDriverName || 'Field Volunteer'}</strong></span>
                    <span>•</span>
                    <span>Transport: {d.assignedVehicle || 'Standard Van'}</span>
                  </div>

                  {d.status !== 'delivered' && (
                    <button
                      onClick={() => advanceStage(d.id)}
                      className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-800 hover:bg-emerald-900 text-white shadow-2xs transition-colors shrink-0"
                    >
                      {d.status === 'accepted' && 'Dispatch Driver (Scheduled) →'}
                      {d.status === 'pickup_scheduled' && 'Confirm Loaded (Picked Up) →'}
                      {d.status === 'picked_up' && 'Confirm Delivery Received ✓'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default: Overview
  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
              Recipient Workspace
            </span>
            <span className="text-xs text-stone-400">
              {currentRecipient.name} ({currentRecipient.type})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Redistribution Command Hub
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Monitor intake capacity, claim surplus batches, and manage pickup dispatch timelines.
          </p>
        </div>

        <button
          onClick={() => setRecipientView('explore')}
          className="px-6 py-3 bg-[#1b4332] hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <Search className="w-4 h-4 text-emerald-300" />
          <span>Explore Available Food</span>
        </button>
      </div>

      {/* Capacity & Quota Gauge Card */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-stone-900 text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-800" />
              Daily Intake Quota & Capacity Utilization
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Limits automatic SmartMatch recommendations from exceeding your kitchen storage capabilities.
            </p>
          </div>

          <button
            onClick={() => setRecipientView('profile_requirements')}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 self-start sm:self-auto"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Adjust Quota & Storage
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-stone-600">
              Allocated: <strong className="text-stone-900">{currentRecipient.currentDailyAllocatedKg} kg</strong> of{' '}
              {currentRecipient.maxDailyCapacityKg} kg max daily capacity
            </span>
            <span className="font-bold text-emerald-800">{capacityUsedPercent}% capacity</span>
          </div>
          <div className="w-full h-3 bg-stone-100 rounded-full overflow-hidden border border-stone-200/80">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                capacityUsedPercent > 85 ? 'bg-amber-500' : 'bg-emerald-700'
              }`}
              style={{ width: `${capacityUsedPercent}%` }}
            />
          </div>
        </div>

        {/* Facilities badge row */}
        <div className="pt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-stone-500">Listed handling capabilities:</span>
          {currentRecipient.storageCapabilities.map((sc) => (
            <span key={sc} className="bg-stone-100 text-stone-800 px-2 py-0.5 rounded font-medium">
              ✓ {sc}
            </span>
          ))}
          <span className="bg-emerald-50 text-emerald-900 px-2 py-0.5 rounded font-medium border border-emerald-200">
            {currentRecipient.refrigeratedVanAvailable ? '✓ Cold-chain Van Active' : 'Utility Van Active'}
          </span>
        </div>
      </div>

      {/* Urgent Opportunities Banner (< 3 hours) */}
      {urgentAvailable.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200/90 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-950">
              <Clock className="w-5 h-5 text-amber-700 shrink-0" />
              <h3 className="font-bold text-sm sm:text-base">
                Urgent Pickups Expiring Soon ({urgentAvailable.length} Batches)
              </h3>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900 bg-amber-200/60 px-2 py-0.5 rounded">
              High Priority
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {urgentAvailable.slice(0, 2).map((d) => {
              const nowTime = new Date().getTime();
              const deadlineTime = new Date(d.deadlineAt).getTime();
              const hoursLeft = Math.max(0, (deadlineTime - nowTime) / (1000 * 3600));

              return (
                <div
                  key={d.id}
                  className="bg-white rounded-xl border border-amber-200 p-4 shadow-2xs flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded">
                      {hoursLeft.toFixed(1)}h remaining
                    </span>
                    <h4 className="font-bold text-stone-900 text-xs sm:text-sm line-clamp-1">
                      {d.title}
                    </h4>
                    <p className="text-xs text-stone-500">
                      {d.quantity} {d.unit} • {d.donorName} ({d.pickupArea})
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveDetailDonation(d)}
                    className="px-3 py-1.5 bg-[#1b4332] text-white rounded-lg text-xs font-bold hover:bg-emerald-900 shrink-0 shadow-2xs"
                  >
                    Claim Batch
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Pickups in Progress Overview */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
            <h3 className="font-bold text-stone-900 text-base">
            Active Coordinated Pickups ({activePickups.length})
          </h3>
          <button
            onClick={() => setRecipientView('accepted')}
            className="text-xs font-semibold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {activePickups.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-6 text-center text-xs text-stone-500">
            No accepted pickups in progress. Head over to <strong>Explore Donations</strong> to claim surplus batches.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activePickups.map((d) => (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-stone-200 p-4 shadow-xs flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                      {d.category}
                    </span>
                    <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded capitalize">
                      {d.status.replace('_', ' ')}
                    </span>
                  </div>

                  <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{d.title}</h4>

                  <div className="text-xs text-stone-500 space-y-0.5">
                    <div>Pickup: <strong>{d.donorName}</strong> ({d.pickupArea})</div>
                    <div>Target Time: {d.scheduledPickupTime || 'Asap'} • Driver: {d.assignedDriverName || 'Field Team'}</div>
                  </div>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setActiveDetailDonation(d)}
                    className="text-xs font-medium text-stone-600 hover:text-stone-900"
                  >
                    View Details
                  </button>

                  <button
                    onClick={() => {
                      setSelectedDonationId(d.id);
                      setRecipientView('tracking');
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-[#1b4332] text-white rounded-lg hover:bg-emerald-900 transition-colors flex items-center gap-1"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Track</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {completedPickups.length > 0 && (
        <section className="space-y-3">
          <h3 className="font-bold text-stone-900 text-base">Recent Completed Collections</h3>
          <div className="divide-y divide-stone-200 border-y border-stone-200">
            {completedPickups.slice(0, 3).map((donation) => (
              <button
                key={donation.id}
                onClick={() => setActiveDetailDonation(donation)}
                className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-stone-50"
              >
                <span className="min-w-0">
                  <strong className="block text-sm text-stone-900 truncate">{donation.title}</strong>
                  <span className="text-xs text-stone-500">{donation.quantity} {donation.unit} from {donation.donorName}</span>
                </span>
                <span className="text-xs font-semibold text-emerald-800 shrink-0">Delivered</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
