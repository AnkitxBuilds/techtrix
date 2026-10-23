import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  PlusCircle,
  Sparkles,
  Truck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  MapPin,
  Thermometer,
  ShieldCheck,
  Ban,
  Phone,
  BarChart2,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FoodDonation, DonationStatus } from '../../types';

export const DonorDashboard: React.FC = () => {
  const {
    currentDonor,
    donations,
    donorView,
    setDonorView,
    setActiveDetailDonation,
    setSmartMatchTargetDonation,
    setSelectedDonationId,
    cancelDonation,
  } = useApp();

  const [filterTab, setFilterTab] = useState<'all' | 'available' | 'scheduled' | 'completed' | 'flagged'>('all');

  // Filter donations belonging to this donor.
  const myDonations = useMemo(() => {
    return donations.filter((d) => d.donorId === currentDonor.id);
  }, [donations, currentDonor]);

  const filteredListings = useMemo(() => {
    if (filterTab === 'available') {
      return myDonations.filter((d) =>
        d.status === 'available' &&
        d.safetyStatus === 'eligible' &&
        new Date(d.deadlineAt).getTime() > Date.now()
      );
    }
    if (filterTab === 'scheduled') {
      return myDonations.filter((d) => ['accepted', 'pickup_scheduled', 'picked_up'].includes(d.status));
    }
    if (filterTab === 'completed') {
      return myDonations.filter((d) => d.status === 'delivered');
    }
    if (filterTab === 'flagged') {
      return myDonations.filter((d) => d.safetyStatus === 'needs_review' || d.safetyStatus === 'blocked' || d.status === 'expired');
    }
    return myDonations;
  }, [myDonations, filterTab]);

  const activeCount = myDonations.filter((d) =>
    d.status === 'available' &&
    d.safetyStatus === 'eligible' &&
    new Date(d.deadlineAt).getTime() > Date.now()
  ).length;
  const inProgressCount = myDonations.filter((d) => ['accepted', 'pickup_scheduled', 'picked_up'].includes(d.status)).length;
  const completedCount = myDonations.filter((d) => d.status === 'delivered').length;

  const totalKg = myDonations.reduce((sum, d) => sum + (d.unit === 'kg' ? d.quantity : Math.round(d.servingsCount * 0.42)), 0);

  // If view is 'profile', render Donor Profile subview
  if (donorView === 'profile') {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
              Donor Profile
            </span>
            <h1 className="text-2xl font-bold text-stone-900 tracking-tight mt-1">
              Establishment Credentials & Address
            </h1>
          </div>
          <button
            onClick={() => setDonorView('overview')}
            className="text-xs font-semibold text-stone-600 hover:text-stone-900 border border-stone-200 px-3 py-1.5 rounded-lg"
          >
            &larr; Back to Dashboard
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-800 text-white flex items-center justify-center font-bold text-xl shadow-xs">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-stone-900">{currentDonor.name}</h2>
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Food provider profile
                </span>
              </div>
              <p className="text-xs text-stone-500 mt-1">
                Category: <strong>{currentDonor.type}</strong> • Service Region: {currentDonor.area}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-4 border-t border-stone-100">
            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-500 block mb-1">Primary Pickup Address & Dock:</span>
              <strong className="text-stone-900 text-sm font-semibold">{currentDonor.address}</strong>
            </div>

            <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200">
              <span className="text-stone-500 block mb-1">Authorized Contact Lead:</span>
              <strong className="text-stone-900 text-sm font-semibold">{currentDonor.contactPerson}</strong>
              <div className="text-stone-600 mt-0.5">{currentDonor.contactPhone}</div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 text-xs text-emerald-950 space-y-1">
            <h4 className="font-bold flex items-center gap-1.5 text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Donor Safety Protocol Commitment
            </h4>
            <p className="text-emerald-900/90 leading-relaxed">
              This establishment maintains compliant temperature monitoring logs, food-grade thermal containers, and transparent allergen disclosures for all surplus donations.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Title & Quick Post Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
              Donor Workspace
            </span>
            <span className="text-xs text-stone-400">
              {currentDonor.name} ({currentDonor.type})
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Surplus Food Management
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Post surplus meals, monitor real-time recipient matches, and track active pickups.
          </p>
        </div>

        <button
          onClick={() => setDonorView('create_donation')}
          className="px-6 py-3 bg-[#1b4332] hover:bg-emerald-900 text-white font-bold text-sm rounded-xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer"
        >
          <PlusCircle className="w-4 h-4 text-emerald-300" />
          <span>Post New Donation</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span>Available for Claim</span>
            <UtensilsCrossed className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-extrabold text-stone-900">{activeCount}</div>
          <p className="text-[11px] text-stone-500 mt-1">Active on public match feed</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span>Scheduled & In-Transit</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-700">{inProgressCount}</div>
          <p className="text-[11px] text-stone-500 mt-1">Driver assigned by recipient</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span>Completed Deliveries</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-900">{completedCount}</div>
          <p className="text-[11px] text-stone-500 mt-1">Safely delivered to shelters</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
            <span>Food Volume Listed</span>
            <BarChart2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-3xl font-extrabold text-stone-900">{totalKg} kg</div>
          <p className="text-[11px] text-stone-500 mt-1">Across all listing statuses</p>
        </div>
      </div>

      {/* Quick Action Banner if no active donations */}
      {activeCount === 0 && (
        <div className="bg-gradient-to-r from-emerald-900 to-[#1b4332] text-white rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <h3 className="font-bold text-lg">Have prepared food surplus from today&apos;s shift?</h3>
            <p className="text-emerald-100/80 text-xs sm:text-sm">
              Don&apos;t let nutritious meals go to waste. It takes less than 60 seconds to connect with verified local kitchens.
            </p>
          </div>
          <button
            onClick={() => setDonorView('create_donation')}
            className="px-5 py-2.5 bg-white text-emerald-950 font-bold text-xs rounded-xl shadow-xs hover:bg-emerald-50 transition-colors shrink-0"
          >
            Post Surplus Now
          </button>
        </div>
      )}

      {/* Filter Tabs and Listings */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-stone-200">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterTab === 'all'
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              All Listings ({myDonations.length})
            </button>
            <button
              onClick={() => setFilterTab('available')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterTab === 'available'
                  ? 'bg-emerald-900 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Available ({activeCount})
            </button>
            <button
              onClick={() => setFilterTab('scheduled')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterTab === 'scheduled'
                  ? 'bg-amber-600 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              In Transit ({inProgressCount})
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterTab === 'completed'
                  ? 'bg-emerald-800 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Delivered ({completedCount})
            </button>
            <button
              onClick={() => setFilterTab('flagged')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterTab === 'flagged'
                  ? 'bg-rose-700 text-white'
                  : 'text-stone-600 hover:bg-stone-100'
              }`}
            >
              Flagged / Expired
            </button>
          </div>

          <div className="text-xs text-stone-500">
            Showing {filteredListings.length} records
          </div>
        </div>

        {/* Listings Cards Grid */}
        {filteredListings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
            <UtensilsCrossed className="w-8 h-8 text-stone-400 mx-auto" />
            <h4 className="font-bold text-stone-800 text-base">No listings in this view</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              You haven&apos;t posted any donations matching this filter tab yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredListings.map((donation) => {
              const now = new Date().getTime();
              const deadline = new Date(donation.deadlineAt).getTime();
              const hoursRemaining = (deadline - now) / (1000 * 3600);
              const isUrgent = hoursRemaining > 0 && hoursRemaining <= 3.0;
              const isExpired = hoursRemaining <= 0 || donation.status === 'expired';

              return (
                <div
                  key={donation.id}
                  className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Image & Status Badges */}
                    <div className="relative h-40 overflow-hidden bg-stone-100 flex items-center justify-center">
                      {donation.imageUrl ? (
                        <img
                          src={donation.imageUrl}
                          alt={donation.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-stone-100 text-stone-400 gap-1">
                          <UtensilsCrossed className="w-8 h-8 text-stone-300" />
                          <span className="text-[11px] font-medium text-stone-400">{donation.category}</span>
                        </div>
                      )}
                      <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold uppercase bg-stone-950/80 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                          {donation.category}
                        </span>
                      </div>

                      {/* Status chip */}
                      <div className="absolute top-2.5 right-2.5">
                        {donation.status === 'delivered' ? (
                          <span className="text-[10px] font-bold uppercase bg-emerald-700 text-white px-2 py-0.5 rounded shadow-xs">
                            Delivered
                          </span>
                        ) : donation.status === 'cancelled' ? (
                          <span className="text-[10px] font-bold uppercase bg-stone-700 text-white px-2 py-0.5 rounded shadow-xs">
                            Cancelled
                          </span>
                        ) : isExpired ? (
                          <span className="text-[10px] font-bold uppercase bg-rose-600 text-white px-2 py-0.5 rounded shadow-xs">
                            Expired
                          </span>
                        ) : isUrgent ? (
                          <span className="text-[10px] font-bold uppercase bg-amber-500 text-stone-950 px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {hoursRemaining.toFixed(1)}h left
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase bg-stone-900/80 text-white px-2 py-0.5 rounded">
                            {donation.status.replace('_', ' ')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      <div>
                        <h3 className="font-bold text-stone-900 text-sm line-clamp-2 leading-snug">
                          {donation.title}
                        </h3>
                        <div className="flex items-center gap-3 text-xs text-stone-500 mt-2">
                          <span className="flex items-center gap-1">
                            <Thermometer className="w-3.5 h-3.5 text-stone-400" />
                            {donation.storageCondition}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-stone-100">
                        <div>
                          <span className="text-stone-500">Volume: </span>
                          <strong className="text-stone-900 font-bold">
                            {donation.quantity} {donation.unit}
                          </strong>
                        </div>
                        <div className="text-emerald-800 font-semibold">
                          ~{donation.servingsCount} portions
                        </div>
                      </div>

                      {/* Recipient info if claimed */}
                      {donation.acceptedByOrgName && (
                        <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200/80 text-[11px] text-emerald-950">
                          <span className="font-semibold block">Claimed by {donation.acceptedByOrgName}</span>
                          <span className="text-emerald-800">
                            Driver: {donation.assignedDriverName || 'Field Volunteer'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-4 pt-0 space-y-2">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveDetailDonation(donation)}
                        className="flex-1 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
                      >
                        Details
                      </button>

                      {donation.status === 'available' ? (
                        <button
                          onClick={() => {
                            setSmartMatchTargetDonation(donation);
                            setDonorView('smartmatch');
                          }}
                          className="flex-1 py-2 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors flex items-center justify-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                          Matches
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedDonationId(donation.id);
                            setDonorView('tracking');
                          }}
                          className="flex-1 py-2 text-xs font-semibold rounded-lg bg-stone-900 hover:bg-stone-800 text-white transition-colors flex items-center justify-center gap-1"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Track
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
