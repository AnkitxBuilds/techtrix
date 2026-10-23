import React from 'react';
import {
  UtensilsCrossed,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Clock,
  MapPin,
  Leaf,
  Users,
  Building2,
  CheckCircle2,
  Thermometer,
  ChevronRight,
  Info,
  ArrowUpRight,
  PackageCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { evaluateSmartMatches } from '../../services/smartMatch';
import heroImage from '../../assets/images/hero_food_redistribution_1792735004588.jpg';

const BotanicalFlourish: React.FC<{ className?: string }> = ({ className = '' }) => (
  <svg
    viewBox="0 0 120 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    aria-hidden="true"
  >
    <path
      d="M15 105 C 38 85, 72 60, 105 15"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M32 90 C 20 78, 26 66, 42 72 C 42 72, 45 84, 32 90 Z"
      fill="currentColor"
      opacity="0.45"
    />
    <path
      d="M50 75 C 54 60, 68 62, 65 78 C 65 78, 55 81, 50 75 Z"
      fill="currentColor"
      opacity="0.45"
    />
    <path
      d="M68 58 C 56 46, 62 34, 78 40 C 78 40, 81 52, 68 58 Z"
      fill="currentColor"
      opacity="0.45"
    />
    <path
      d="M86 40 C 90 26, 102 28, 100 44 C 100 44, 90 47, 86 40 Z"
      fill="currentColor"
      opacity="0.45"
    />
  </svg>
);

export const LandingPage: React.FC = () => {
  const {
    setRole,
    setDonorView,
    setRecipientView,
    donations,
    organizations,
    impactStats,
    setIsImpactModalOpen,
    setIsRoleModalOpen,
    setActiveDetailDonation,
    setSmartMatchTargetDonation,
    setIsAuthModalOpen,
    firebaseUser,
  } = useApp();

  // Active eligible donations for preview
  const activeDonations = donations
    .filter((d) =>
      d.status === 'available' &&
      d.safetyStatus === 'eligible' &&
      new Date(d.deadlineAt).getTime() > Date.now()
    )
    .slice(0, 3);

  const heroListing = activeDonations[0];
  const heroHoursLeft = heroListing
    ? Math.max(0, (new Date(heroListing.deadlineAt).getTime() - Date.now()) / (1000 * 3600))
    : 0;
  const heroMatch = heroListing
    ? evaluateSmartMatches(heroListing, organizations).find((match) => match.isEligible)
    : undefined;

  // Actual bounded metrics for the compact impact strip (no invented numbers)
  const mealsRedistributed = impactStats?.estimatedMeals !== undefined
    ? Number(impactStats.estimatedMeals).toLocaleString()
    : '—';

  const partnerCount = organizations
    ? organizations.length.toString()
    : '—';

  const successfulCollectionsCount = impactStats?.deliveredCount !== undefined
    ? impactStats.deliveredCount.toString()
    : '—';

  return (
    <div className="space-y-12 sm:space-y-16 pb-16">
      {/* 1. Split-Screen Hero Section */}
      <section className="relative overflow-hidden pt-4 pb-8 md:pt-8 md:pb-12 bg-[#fcfbf9]">
        {/* Subtle decorative background organic glow */}
        <div className="absolute top-12 left-1/4 w-[500px] h-[350px] bg-emerald-100/35 blur-3xl -z-10 rounded-full pointer-events-none" />
        <div className="absolute top-36 right-10 w-[400px] h-[300px] bg-amber-50/40 blur-3xl -z-10 rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* Left Column: Headline, Description, Actions */}
            <div className="lg:col-span-6 space-y-5 lg:pr-4">
              {/* Kicker badge with subtle botanical icon */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50/90 border border-emerald-200/70 text-emerald-900 text-xs font-semibold tracking-wide shadow-2xs">
                <Leaf className="w-3.5 h-3.5 text-emerald-700" />
                <span>Intelligent Food Waste Reduction & Safe Redistribution</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-[3.25rem] font-extrabold text-stone-900 tracking-tight leading-[1.14]">
                Good food deserves{' '}
                <span className="text-[#1b4332] relative inline-block">
                  another destination.
                  <span className="absolute bottom-1 left-0 w-full h-2 bg-emerald-400/20 -z-10 rounded-sm" />
                </span>
              </h1>

              {/* Tagline / Subtitle */}
              <p className="text-base sm:text-lg text-stone-600 leading-relaxed max-w-xl">
                FoodBridge connects restaurants, hotels, college canteens, hostels, and event organizers with verified NGOs, shelters, and community kitchens to redistribute surplus food safely, transparently, and on time.
              </p>

              {/* Two Primary Actions */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setRole('donor');
                    setDonorView('create_donation');
                  }}
                  className="px-6 py-3.5 rounded-xl font-bold text-sm text-white bg-[#1b4332] hover:bg-[#143326] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 group cursor-pointer"
                >
                  <UtensilsCrossed className="w-4 h-4 text-emerald-300" />
                  <span>Donate Surplus Food</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </button>

                <button
                  onClick={() => {
                    setRole('recipient');
                    setRecipientView('explore');
                  }}
                  className="px-6 py-3.5 rounded-xl font-bold text-sm text-stone-800 bg-white hover:bg-stone-50 border border-stone-300 shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <HeartHandshake className="w-4 h-4 text-emerald-700" />
                  <span>Find Food Donations</span>
                </button>
              </div>

              {/* Trust badges and workspace access */}
              <div className="pt-2 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-stone-500">
                <div className="flex items-center gap-1.5 font-medium text-stone-700">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Recipient accreditation workflow</span>
                </div>
                <div className="flex items-center gap-1.5 font-medium text-stone-700">
                  <Thermometer className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span>Cold-Chain Protocol</span>
                </div>
                <button
                  onClick={() => setIsRoleModalOpen(true)}
                  className="text-emerald-800 hover:text-emerald-950 font-semibold underline underline-offset-2 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Switch Workspace</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-stone-300 hidden sm:inline">&bull;</span>
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="text-stone-700 hover:text-emerald-950 font-semibold underline underline-offset-2 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>{firebaseUser ? 'My Account' : 'Sign In / Log In'}</span>
                </button>
              </div>
            </div>

            {/* Right Column: Large Realistic Visual & Floating SmartMatch Preview Card */}
            <div className="lg:col-span-6 relative mt-4 lg:mt-0">
              {/* Botanical watermark flourish in corner */}
              <BotanicalFlourish className="absolute -top-6 -right-6 w-28 h-28 text-emerald-800/15 pointer-events-none -z-10 hidden sm:block" />

              {/* Main Visual Frame */}
              <div className="relative rounded-3xl overflow-hidden border border-stone-200/90 shadow-xl bg-stone-100 group">
                <img
                  src={heroImage}
                  alt="Community kitchen team safely packaging and redistributing wholesome surplus food into thermal containers"
                  className="w-full h-[380px] sm:h-[440px] lg:h-[470px] object-cover object-center transition-transform duration-700 group-hover:scale-102"
                  referrerPolicy="no-referrer"
                />
                
                {/* Soft gradient scrim to ensure text legibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950/75 via-stone-950/20 to-transparent pointer-events-none" />

                {/* Top-right SmartMatch accreditation tag */}
                <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md border border-white/60 text-[#1b4332] px-3 py-1 rounded-full text-xs font-semibold shadow-xs flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>SmartMatch Engine Active</span>
                </div>

                {/* Floating SmartMatch preview card over the visual */}
                <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 bg-white/95 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/80 shadow-2xl transition-all">
                  {/* Top row: Status & Deadline */}
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span>{heroListing ? `Available &bull; Safety: ${heroListing.safetyStatus.replace('_', ' ')}` : 'No eligible listings right now'}</span>
                      </div>
                      <h3 className="font-bold text-stone-900 text-sm sm:text-base leading-snug line-clamp-1">
                        {heroListing?.title || 'Explore available donations'}
                      </h3>
                    </div>

                    <div className="shrink-0 bg-amber-50 border border-amber-200/80 text-amber-900 text-xs font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>{heroListing ? `${heroHoursLeft.toFixed(1)}h left` : 'No deadline'}</span>
                    </div>
                  </div>

                  {/* Middle row: Quantity, Thermal condition, Verified Recipient Match */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2.5 border-y border-stone-100 text-xs">
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                        Quantity
                      </span>
                      <span className="font-semibold text-stone-800 tabular-nums">
                        {heroListing ? `${heroListing.quantity} ${heroListing.unit} (~${heroListing.servingsCount} servings)` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                        Thermal Protocol
                      </span>
                      <span className="font-semibold text-stone-800 truncate block">
                        {heroListing?.storageCondition || '—'}
                      </span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-stone-400 block text-[10px] uppercase font-bold tracking-wider">
                        SmartMatch Gate
                      </span>
                      <span className="font-semibold text-emerald-800 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{heroMatch ? `${heroMatch.recipient.name} (${heroMatch.score}% fit)` : 'No eligible recipient match'}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Action footer */}
                  <div className="mt-3 flex items-center justify-between gap-2 pt-0.5">
                    <span className="text-[11px] text-stone-500 truncate">
                      {heroListing ? <>Donor: <strong className="text-stone-800">{heroListing.donorName}</strong></> : 'Browse available donations'}
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      {heroListing ? (
                        <>
                          <button
                            onClick={() => setActiveDetailDonation(heroListing)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer"
                          >
                            Inspect
                          </button>
                          <button
                            onClick={() => {
                              setSmartMatchTargetDonation(heroListing);
                              setRole('donor');
                              setDonorView('smartmatch');
                            }}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1b4332] hover:bg-[#143326] text-white flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-emerald-300" />
                            <span>Match Preview</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setRole('recipient'); setRecipientView('explore'); }}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#1b4332] text-white"
                        >
                          Explore
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Compact Impact Strip (Below Hero) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl border border-stone-200/90 shadow-sm p-4 sm:p-6 bg-gradient-to-r from-white via-[#fcfbf9] to-white">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-stone-200/80 gap-4 md:gap-0">
            
            {/* Metric 1: Estimated meals from completed records */}
            <div className="md:px-6 first:pl-0 flex items-center gap-4 py-2 md:py-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
                <UtensilsCrossed className="w-6 h-6 text-emerald-800" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight tabular-nums font-sans">
                  {mealsRedistributed}
                </div>
                <div className="text-xs font-semibold text-stone-600 mt-0.5">
                  Estimated meals from delivered records
                  <span className="text-[11px] font-normal text-stone-400 ml-1">(FAO 0.42 kg/meal)</span>
                </div>
              </div>
            </div>

            {/* Metric 2: Recipient organizations */}
            <div className="md:px-6 flex items-center gap-4 py-2 md:py-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
                <ShieldCheck className="w-6 h-6 text-emerald-800" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight tabular-nums font-sans">
                  {partnerCount}
                </div>
                <div className="text-xs font-semibold text-stone-600 mt-0.5">
                  Recipient Organizations
                  <span className="text-[11px] font-normal text-stone-400 ml-1">(Shelters, NGOs, Kitchens)</span>
                </div>
              </div>
            </div>

            {/* Metric 3: Successful Collections */}
            <div className="md:px-6 last:pr-0 flex items-center gap-4 py-2 md:py-1">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200/70 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
                <PackageCheck className="w-6 h-6 text-emerald-800" />
              </div>
              <div className="flex-1">
                <div className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight tabular-nums font-sans">
                  {successfulCollectionsCount}
                </div>
                <div className="text-xs font-semibold text-stone-600 mt-0.5 flex items-center justify-between">
                  <span>Successful Collections</span>
                  <button
                    onClick={() => setIsImpactModalOpen(true)}
                    className="text-[11px] text-emerald-800 hover:text-emerald-950 font-semibold underline underline-offset-2 flex items-center gap-0.5 cursor-pointer"
                  >
                    <span>Methodology</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 3. How FoodBridge Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2.5">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs font-semibold">
            <Leaf className="w-3 h-3 text-emerald-700" />
            <span>Safe & Structured Lifecycle</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            How Surplus Food Finds Another Destination
          </h2>
          <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
            A transparent 4-stage pipeline that eliminates food waste while strictly enforcing food-handling, allergen disclosure, and thermal safety protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          {/* Step 1 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100/80 text-emerald-950 font-bold flex items-center justify-center text-xs mb-3 font-mono">
                01
              </div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-1.5">
                Log Surplus with Thermal Specs
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Donors specify cooked quantity, container packaging, preparation timestamp, allergen tags, and thermal requirements (&gt;60°C hot-hold or 0-4°C chilled).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
              <Thermometer className="w-3.5 h-3.5 text-emerald-700" />
              <span>Thermal Logging</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100/80 text-emerald-950 font-bold flex items-center justify-center text-xs mb-3 font-mono">
                02
              </div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-1.5">
                Rule-Based SmartMatch
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Deterministic matching gates verify recipient accreditation, cold storage readiness, daily quota limits, transit feasibility, and remaining shelf life.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
              <span>6 Deterministic Gates</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100/80 text-emerald-950 font-bold flex items-center justify-center text-xs mb-3 font-mono">
                03
              </div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-1.5">
                Atomic Claim & Dispatch
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Verified NGOs accept listings, allocate volunteers or temperature-controlled vans, and schedule prompt pickup windows before the deadline.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-700" />
              <span>Timely Pickup Window</span>
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between">
            <div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100/80 text-emerald-950 font-bold flex items-center justify-center text-xs mb-3 font-mono">
                04
              </div>
              <h3 className="font-bold text-stone-900 text-sm sm:text-base mb-1.5">
                5-Stage Tracking & Verification
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                Both parties track the donation from Accepted &rarr; Scheduled &rarr; Picked Up &rarr; Delivered with immutable status notes and audit timestamps.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-stone-100 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>Audit Traceability</span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured available donation listings */}
      <section id="smartmatch-preview" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold uppercase tracking-wider">
              <span>Available Donations</span>
            </div>
            <h2 className="text-2xl font-bold text-stone-900 tracking-tight mt-1">
              Surplus Ready for Immediate Collection
            </h2>
            <p className="text-xs text-stone-500">
              Eligible listings available for collection in the current workspace.
            </p>
          </div>

          <button
            onClick={() => {
              setRole('recipient');
              setRecipientView('explore');
            }}
            className="text-xs font-semibold text-emerald-900 hover:text-emerald-950 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>Explore all listings</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activeDonations.map((d) => {
            const nowTime = Date.now();
            const deadlineTime = new Date(d.deadlineAt).getTime();
            const hoursRemaining = Math.max(0, (deadlineTime - nowTime) / (1000 * 3600));
            const urgent = hoursRemaining <= 3.0;

            return (
              <div
                key={d.id}
                className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col group"
              >
                <div className="relative h-44 overflow-hidden bg-stone-100">
                  <img
                    src={d.imageUrl || heroImage}
                    alt={d.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
                    <span className="text-[11px] font-bold uppercase bg-stone-950/80 backdrop-blur-xs text-white px-2 py-0.5 rounded">
                      {d.category}
                    </span>
                  </div>

                  {urgent && (
                    <div className="absolute top-3 right-3 bg-amber-500 text-stone-950 text-xs font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{hoursRemaining.toFixed(1)}h left</span>
                    </div>
                  )}
                </div>

                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h3 className="font-bold text-stone-900 text-sm line-clamp-2 leading-snug">
                      {d.title}
                    </h3>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-2">
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{d.donorName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-stone-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                      <span>{d.pickupArea}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-stone-100 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        <span className="text-xs text-stone-500">Quantity: </span>
                        <strong className="text-stone-900 font-bold">{d.quantity} {d.unit}</strong>
                      </div>
                      <div className="text-emerald-800 font-semibold tabular-nums">
                        ~{d.servingsCount} portions
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setActiveDetailDonation(d)}
                        className="flex-1 py-2 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-800 transition-colors cursor-pointer"
                      >
                        Inspect Details
                      </button>
                      <button
                        onClick={() => {
                          setSmartMatchTargetDonation(d);
                          setRole('donor');
                          setDonorView('smartmatch');
                        }}
                        className="py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors flex items-center gap-1 cursor-pointer"
                        title="View SmartMatch compatibility"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Match</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 5. Why FoodBridge / Safety-First Architecture Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
        <div className="bg-[#1b4332] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-lg">
          {/* Botanical decorative watermark */}
          <BotanicalFlourish className="absolute -bottom-8 -right-8 w-48 h-48 text-emerald-800/30 pointer-events-none -z-0" />

          <div className="relative z-10 max-w-3xl space-y-6">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300 bg-emerald-800/80 px-3 py-1 rounded-full">
              Social Impact Architecture
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Safety-First Redistribution. Zero Compromise.
            </h2>
            <p className="text-emerald-100/90 text-sm sm:text-base leading-relaxed">
              Surplus food logistics fail when quality cannot be proven or when transit times outpace perishability. FoodBridge establishes an unbreakable digital chain of custody with verified organizations, explicit thermal logs, and transparent algorithmic matching.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3 bg-emerald-900/60 p-4 rounded-xl border border-emerald-700/50">
                <ShieldCheck className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm text-white">Verified Recipients Only</h3>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Every community shelter undergoes accreditation review with food license and cold-storage inspections.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-emerald-900/60 p-4 rounded-xl border border-emerald-700/50">
                <Thermometer className="w-5 h-5 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-sm text-white">Thermal Condition Integrity</h3>
                  <p className="text-xs text-emerald-200/80 mt-1">
                    Mandatory temperature checkpoints: hot food maintained &gt;60°C and perishables chilled 0-4°C with certified carriers.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setRole('donor');
                  setDonorView('create_donation');
                }}
                className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-white text-emerald-950 hover:bg-emerald-50 transition-colors shadow-sm cursor-pointer"
              >
                Post Surplus Food as Donor
              </button>
              <button
                onClick={() => {
                  setRole('recipient');
                  setRecipientView('explore');
                }}
                className="px-6 py-3 rounded-xl font-bold text-xs sm:text-sm bg-emerald-800/80 text-white hover:bg-emerald-800 border border-emerald-600 transition-colors cursor-pointer"
              >
                Claim Donations as Recipient
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
