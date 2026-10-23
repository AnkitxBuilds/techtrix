import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Clock,
  Thermometer,
  Building2,
  Check,
  RotateCcw,
  Info
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SafetyStatus } from '../../types';

export const AdminReviewView: React.FC = () => {
  const {
    organizations,
    verifyOrgByAdmin,
    donations,
    reviewDonationSafety,
    adminView,
    setAdminView,
    setActiveDetailDonation,
    firebaseUser,
    userProfile,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'listings' | 'ngos' | 'audit'>('listings');

  // Flagged or questionable donations
  const flaggedDonations = donations.filter((d) => d.safetyStatus !== 'eligible');
  const allEligibleCount = donations.filter((d) => d.safetyStatus === 'eligible').length;
  const traceabilityPercent = donations.length
    ? Math.round((donations.filter((d) => d.statusHistory.length > 0).length / donations.length) * 100)
    : 0;
  const isAuthorizedReviewer = Boolean(firebaseUser && userProfile?.role === 'admin');

  // Unverified & verified NGOs
  const unverifiedOrgs = organizations.filter((o) => !o.verified);
  const verifiedOrgs = organizations.filter((o) => o.verified);

  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  const handleApproveListing = (id: string) => {
    const note = reviewNotes[id] || 'Inspected by Food Safety Officer: Thermal parameters verified via temperature log.';
    reviewDonationSafety(id, 'eligible', note);
  };

  const handleBlockListing = (id: string) => {
    const note = reviewNotes[id] || 'Blocked by Safety Officer: Non-compliant food safety risk or expired consumption window.';
    reviewDonationSafety(id, 'blocked', note);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-1 rounded">
              Food Safety Desk
            </span>
            <span className="text-xs text-stone-400">Compliance & Accreditation</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight mt-1">
            Safety Review & NGO Verification
          </h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Audit flagged surplus food listings and review recipient organization food safety accreditation.
          </p>
        </div>

        <div className={`border text-xs px-3 py-1.5 rounded-lg ${
          isAuthorizedReviewer
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
            : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          {isAuthorizedReviewer ? 'Firebase-authorized reviewer' : 'Local reviewer preview'}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
        <button
          onClick={() => setActiveTab('listings')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'listings'
              ? 'bg-[#1b4332] text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Flagged Food Listings ({flaggedDonations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ngos')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'ngos'
              ? 'bg-[#1b4332] text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>NGO Verification Queue ({unverifiedOrgs.length} Pending)</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
            activeTab === 'audit'
              ? 'bg-[#1b4332] text-white shadow-xs'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>System Safety Metrics</span>
        </button>
      </div>

      {/* Tab 1: Flagged Food Listings */}
      {activeTab === 'listings' && (
        <div className="space-y-4">
          {flaggedDonations.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
              <h3 className="font-bold text-stone-800 text-base">All Active Listings Are Compliant</h3>
              <p className="text-xs text-stone-500">
                There are no food listings currently flagged for thermal or turnaround discrepancies.
              </p>
            </div>
          ) : (
            flaggedDonations.map((d) => (
              <div
                key={d.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs space-y-4 ${
                  d.safetyStatus === 'blocked' ? 'border-rose-300 bg-rose-50/20' : 'border-amber-300 bg-amber-50/20'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
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
                        <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                          d.safetyStatus === 'blocked' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-900'
                        }`}>
                          {d.safetyStatus.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-stone-500">ID: {d.id}</span>
                      </div>

                      <h3 className="font-bold text-stone-900 text-sm sm:text-base">{d.title}</h3>

                      <div className="flex items-center gap-4 text-xs text-stone-500 flex-wrap">
                        <span>Donor: <strong>{d.donorName}</strong></span>
                        <span>Quantity: <strong>{d.quantity} {d.unit}</strong></span>
                        <span>Storage: <strong>{d.storageCondition}</strong></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setActiveDetailDonation(d)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-stone-100 hover:bg-stone-200 text-stone-700 shrink-0"
                  >
                    Inspect Form
                  </button>
                </div>

                {/* Flag reason */}
                <div className="p-3 bg-white rounded-xl border border-stone-200 text-xs text-stone-700 space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-amber-900">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Flagged Audit Reason:
                  </div>
                  <p className="text-stone-600 leading-relaxed">
                    {d.safetyReviewNotes || 'Storage condition does not match food risk profile or collection window has elapsed.'}
                  </p>
                </div>

                {/* Officer Action Bar */}
                <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
                  <label className="block text-[11px] font-semibold text-stone-700">
                    Inspector Note / Reason for Decision:
                  </label>
                  <input
                    type="text"
                    placeholder="Enter audit rationale (e.g. Physical temp check verified at 68°C)..."
                    value={reviewNotes[d.id] || ''}
                    onChange={(e) =>
                      setReviewNotes({ ...reviewNotes, [d.id]: e.target.value })
                    }
                    className="w-full text-xs p-2 rounded-lg border border-stone-300 bg-white"
                  />

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleBlockListing(d.id)}
                      className="px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100 border border-rose-300 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Block / Invalidate Listing</span>
                    </button>

                    <button
                      onClick={() => handleApproveListing(d.id)}
                      className="px-4 py-1.5 text-xs font-bold text-white bg-[#1b4332] hover:bg-emerald-900 rounded-lg shadow-xs transition-colors flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Clear & Mark Eligible for SmartMatch</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Tab 2: NGO Verification Queue */}
      {activeTab === 'ngos' && (
        <div className="space-y-4">
          {/* Pending queue */}
          <div className="space-y-3">
            <h3 className="font-bold text-stone-800 text-xs uppercase tracking-wider">
              Pending Accreditation Applications ({unverifiedOrgs.length})
            </h3>

            {unverifiedOrgs.length === 0 ? (
              <div className="p-4 bg-white rounded-xl border border-stone-200 text-xs text-stone-500">
                No organizations awaiting verification.
              </div>
            ) : (
              unverifiedOrgs.map((org) => (
                <div
                  key={org.id}
                  className="bg-white rounded-2xl border border-amber-300 p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-stone-900 text-sm">{org.name}</h4>
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        Pending Desk Review
                      </span>
                    </div>
                    <p className="text-stone-500">
                      Application ID: {org.verificationNumber} • Location: {org.address}
                    </p>
                    <div className="flex items-center gap-3 text-stone-600 pt-1">
                      <span>Daily Capacity: <strong>{org.maxDailyCapacityKg} kg</strong></span>
                      <span>•</span>
                      <span>Service Radius: {org.serviceArea}</span>
                      <span>•</span>
                      <span>Vehicles: {org.transportVehicles.join(', ')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => verifyOrgByAdmin(org.id, true)}
                      className="px-4 py-2 text-xs font-bold text-white bg-[#1b4332] hover:bg-emerald-900 rounded-lg shadow-xs flex items-center gap-1"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Approve Accreditation</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Active Verified NGOs */}
          <div className="space-y-3 pt-4 border-t border-stone-200">
            <h3 className="font-bold text-stone-800 text-xs uppercase tracking-wider">
              Organizations Marked Eligible ({verifiedOrgs.length})
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {verifiedOrgs.map((org) => (
                <div
                  key={org.id}
                  className="bg-white rounded-xl border border-stone-200 p-4 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-stone-900">{org.name}</div>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-700" />
                      {org.isIllustrative ? 'Illustrative eligibility state' : org.verificationNumber}
                    </span>
                  </div>
                  <div className="text-stone-500">{org.type} • {org.serviceArea}</div>
                  <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px]">
                    <span className="text-stone-500">Intake: {org.currentDailyAllocatedKg} / {org.maxDailyCapacityKg} kg</span>
                    <button
                      onClick={() => verifyOrgByAdmin(org.id, false)}
                      className="text-stone-400 hover:text-rose-600 underline"
                    >
                      Revoke
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: System Safety Metrics */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-xs space-y-5">
          <h3 className="font-bold text-stone-900 text-base">Platform Health & Safety Standards</h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
              <div className="text-2xl font-bold text-emerald-950">{allEligibleCount}</div>
              <div className="text-xs text-emerald-800 mt-1">Safety Compliant Listings</div>
            </div>

            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="text-2xl font-bold text-amber-900">{flaggedDonations.length}</div>
              <div className="text-xs text-amber-800 mt-1">Discrepancies Flagged / Blocked</div>
            </div>

            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200">
              <div className="text-2xl font-bold text-stone-900">{traceabilityPercent}%</div>
              <div className="text-xs text-stone-600 mt-1">Traceability Adherence</div>
            </div>
          </div>

          <div className="text-xs text-stone-600 space-y-2 bg-stone-50 p-4 rounded-xl border border-stone-200">
            <h4 className="font-bold text-stone-800 flex items-center gap-1.5">
              <Info className="w-4 h-4 text-emerald-800" />
              Platform Legal & Safety Boundaries
            </h4>
            <p className="leading-relaxed">
              FoodBridge enforces strict algorithmic gating before matches are presented. However, web forms cannot physically replace sensory and thermal verification at the loading bay. Recipient drivers must conduct visual and thermal probe checks prior to signing off on collection.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
