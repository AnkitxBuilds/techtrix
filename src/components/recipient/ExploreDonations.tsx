import React, { useState, useMemo } from 'react';
import {
  Search,
  SlidersHorizontal,
  Clock,
  MapPin,
  Building2,
  Thermometer,
  Sparkles,
  CheckCircle2,
  LayoutGrid,
  List,
  AlertTriangle,
  ArrowUpDown,
  Check
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { FoodCategory, FoodDonation } from '../../types';

export const ExploreDonations: React.FC = () => {
  const {
    donations,
    currentRecipient,
    setActiveDetailDonation,
    acceptDonation,
    setRole,
    setRecipientView,
  } = useApp();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [urgencyFilter, setUrgencyFilter] = useState<'all' | 'urgent'>('all');
  const [dietaryFilter, setDietaryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'urgency' | 'quantity' | 'distance'>('urgency');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const CATEGORIES = [
    'All Categories',
    'Cooked Meals',
    'Bakery & Pastry',
    'Fresh Produce & Fruits',
    'Dairy & Desserts',
    'Packaged & Dry Goods',
  ];

  const DIETARY_OPTIONS = ['All Diets', 'Pure Veg', 'Vegan', 'Non-Veg', 'Halal', 'Gluten-Free'];

  // Filter logic
  const filteredDonations = useMemo(() => {
    const now = new Date().getTime();

    return donations
      .filter((d) => {
        // Exclude cancelled
        if (d.status === 'cancelled') return false;

        // Search text
        if (
          searchTerm &&
          !d.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !d.donorName.toLowerCase().includes(searchTerm.toLowerCase()) &&
          !d.pickupArea.toLowerCase().includes(searchTerm.toLowerCase())
        ) {
          return false;
        }

        // Category
        if (selectedCategory !== 'all' && selectedCategory !== 'All Categories' && d.category !== selectedCategory) {
          return false;
        }

        // Dietary
        if (dietaryFilter !== 'all' && dietaryFilter !== 'All Diets') {
          if (!d.dietaryTags.includes(dietaryFilter as any)) return false;
        }

        // Urgency filter (< 3 hours)
        const deadline = new Date(d.deadlineAt).getTime();
        const hoursLeft = (deadline - now) / (1000 * 3600);
        if (urgencyFilter === 'urgent' && (hoursLeft > 3 || hoursLeft <= 0)) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        const nowTime = new Date().getTime();
        const aDeadline = new Date(a.deadlineAt).getTime();
        const bDeadline = new Date(b.deadlineAt).getTime();

        if (sortBy === 'urgency') {
          // earliest deadline first
          return aDeadline - bDeadline;
        }
        if (sortBy === 'quantity') {
          return b.quantity - a.quantity;
        }
        if (sortBy === 'distance') {
          return (a.sampleDistanceKm || 5) - (b.sampleDistanceKm || 5);
        }
        return 0;
      });
  }, [donations, searchTerm, selectedCategory, dietaryFilter, urgencyFilter, sortBy]);

  const availableCount = filteredDonations.filter(
    (d) => d.status === 'available' && d.safetyStatus === 'eligible'
  ).length;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded">
            Recipient Hub
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Explore Surplus Food Donations
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Browsing available batches for <strong>{currentRecipient.name}</strong> ({currentRecipient.type}).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="text-xs bg-white border border-stone-200 px-3 py-1.5 rounded-lg shadow-2xs font-semibold text-emerald-950">
            <span className="text-emerald-700 font-bold">{availableCount}</span> Available Now
          </div>

          <div className="flex bg-stone-100 p-1 rounded-lg border border-stone-200">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-2xs text-stone-900' : 'text-stone-500'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Unverified Organization Notice */}
      {!currentRecipient.verified && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-950">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-sm">Accreditation Pending</h4>
            <p className="text-amber-900/90 leading-relaxed">
              <strong>{currentRecipient.name}</strong> is currently pending Food Safety Desk review. You can explore available surplus listings, but cannot claim batches until food safety certification is approved in the Admin Desk.
            </p>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-stone-200 p-4 sm:p-5 shadow-xs space-y-4">
        {/* Top search & sorting */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search dishes, donors, or pickup areas (e.g., Rice, Grand Pavilion, Campus)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-700 bg-stone-50/50"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 text-xs text-stone-600 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2">
              <ArrowUpDown className="w-3.5 h-3.5 text-stone-400" />
              <span className="hidden sm:inline">Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent font-semibold text-stone-800 focus:outline-hidden cursor-pointer"
              >
                <option value="urgency">Earliest Deadline (Urgent First)</option>
                <option value="quantity">Largest Quantity</option>
                <option value="distance">Nearest Distance (~km)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          {CATEGORIES.map((cat) => {
            const val = cat === 'All Categories' ? 'all' : cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(val)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === val
                    ? 'bg-[#1b4332] text-white shadow-2xs font-semibold'
                    : 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Sub-filters (Dietary & Urgency Toggle) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-stone-500 font-medium">Dietary:</span>
            {DIETARY_OPTIONS.map((opt) => {
              const val = opt === 'All Diets' ? 'all' : opt;
              return (
                <button
                  key={opt}
                  onClick={() => setDietaryFilter(val)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors ${
                    dietaryFilter === val
                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setUrgencyFilter(urgencyFilter === 'all' ? 'urgent' : 'all')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                urgencyFilter === 'urgent'
                  ? 'bg-amber-500 text-stone-950 shadow-2xs'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Urgent Only (&lt;3h)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Donations Content: Grid or List */}
      {filteredDonations.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 p-8 space-y-3">
          <Search className="w-8 h-8 text-stone-400 mx-auto" />
          <h3 className="font-bold text-stone-800 text-lg">No matching surplus listings found</h3>
          <p className="text-xs text-stone-500 max-w-md mx-auto">
            Try adjusting your search query, dietary preference, or category filters.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
              setDietaryFilter('all');
              setUrgencyFilter('all');
            }}
            className="px-4 py-2 text-xs font-semibold text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100"
          >
            Clear All Filters
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDonations.map((d) => {
            const now = new Date().getTime();
            const deadline = new Date(d.deadlineAt).getTime();
            const hoursLeft = (deadline - now) / (1000 * 3600);
            const isUrgent = hoursLeft > 0 && hoursLeft <= 3.0;
            const isExpired = hoursLeft <= 0 || d.status === 'expired';
            const isAvailable = d.status === 'available' && d.safetyStatus === 'eligible' && !isExpired;

            return (
              <div
                key={d.id}
                className={`bg-white rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between ${
                  d.status === 'accepted'
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : isExpired
                    ? 'border-rose-200 opacity-70'
                    : 'border-stone-200'
                }`}
              >
                <div>
                  {/* Photo & Badges */}
                  <div className="relative h-44 overflow-hidden bg-stone-100">
                    <img
                      src={d.imageUrl}
                      alt={d.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase bg-stone-950/80 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                        {d.category}
                      </span>
                    </div>

                    <div className="absolute top-2.5 right-2.5">
                      {isExpired ? (
                        <span className="text-[10px] font-bold uppercase bg-rose-600 text-white px-2 py-0.5 rounded shadow-xs">
                          Expired
                        </span>
                      ) : isUrgent ? (
                        <span className="text-[10px] font-bold uppercase bg-amber-500 text-stone-950 px-2 py-0.5 rounded shadow-xs flex items-center gap-1 animate-pulse">
                          <Clock className="w-3 h-3" />
                          {hoursLeft.toFixed(1)}h left
                        </span>
                      ) : d.status !== 'available' ? (
                        <span className="text-[10px] font-bold uppercase bg-stone-900/80 text-white px-2 py-0.5 rounded">
                          {d.status.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase bg-emerald-700 text-white px-2 py-0.5 rounded">
                          Available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="font-bold text-stone-900 text-sm line-clamp-2 leading-snug">
                        {d.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-1.5">
                        <Building2 className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{d.donorName}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                        <span>{d.pickupArea} (~{d.sampleDistanceKm || 3.5} km away)</span>
                      </div>
                    </div>

                    {/* Specs chips */}
                    <div className="flex flex-wrap gap-1.5 text-[11px]">
                      <span className="bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                        {d.storageCondition}
                      </span>
                      {d.dietaryTags.map((t) => (
                        <span key={t} className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-medium">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-stone-100">
                      <div>
                        <span className="text-stone-500">Volume: </span>
                        <strong className="text-stone-900 font-bold">{d.quantity} {d.unit}</strong>
                      </div>
                      <div className="text-emerald-800 font-semibold">
                        ~{d.servingsCount} portions
                      </div>
                    </div>

                    {d.acceptedByOrgName && (
                      <div className="p-2 bg-emerald-50 rounded-lg text-[11px] text-emerald-900 border border-emerald-200">
                        Claimed by: <strong>{d.acceptedByOrgName}</strong>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Card Actions */}
                <div className="p-4 pt-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setActiveDetailDonation(d)}
                      className="flex-1 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
                    >
                      Inspect Details
                    </button>

                    {isAvailable && (
                      <button
                        onClick={() => setActiveDetailDonation(d)}
                        className="flex-1 py-2 text-xs font-bold rounded-lg bg-[#1b4332] hover:bg-emerald-900 text-white transition-all shadow-xs flex items-center justify-center gap-1"
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        Claim Food
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden divide-y divide-stone-200 shadow-xs">
          {filteredDonations.map((d) => {
            const now = new Date().getTime();
            const deadline = new Date(d.deadlineAt).getTime();
            const hoursLeft = (deadline - now) / (1000 * 3600);
            const isUrgent = hoursLeft > 0 && hoursLeft <= 3.0;
            const isExpired = hoursLeft <= 0 || d.status === 'expired';
            const isAvailable = d.status === 'available' && d.safetyStatus === 'eligible' && !isExpired;

            return (
              <div
                key={d.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-stone-50/60 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <img
                    src={d.imageUrl}
                    alt={d.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-stone-200"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold uppercase bg-stone-100 text-stone-700 px-2 py-0.5 rounded">
                        {d.category}
                      </span>
                      {isUrgent && (
                        <span className="text-[10px] font-bold uppercase bg-amber-500 text-stone-950 px-2 py-0.5 rounded flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {hoursLeft.toFixed(1)}h left
                        </span>
                      )}
                      <span className="text-xs text-stone-500">{d.donorName}</span>
                    </div>

                    <h3 className="font-bold text-stone-900 text-sm">{d.title}</h3>

                    <div className="flex items-center gap-3 text-xs text-stone-500 flex-wrap">
                      <span>Volume: <strong className="text-stone-800">{d.quantity} {d.unit}</strong> (~{d.servingsCount} servings)</span>
                      <span>•</span>
                      <span>Storage: {d.storageCondition}</span>
                      <span>•</span>
                      <span>{d.pickupArea} (~{d.sampleDistanceKm || 3.5} km)</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    onClick={() => setActiveDetailDonation(d)}
                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors"
                  >
                    View Details
                  </button>

                  {isAvailable && (
                    <button
                      onClick={() => setActiveDetailDonation(d)}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-[#1b4332] hover:bg-emerald-900 text-white shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      Claim Food
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
