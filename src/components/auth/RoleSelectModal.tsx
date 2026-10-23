import React, { useEffect, useState } from 'react';
import {
  Building2,
  HeartHandshake,
  ShieldCheck,
  X,
  Check,
  Info,
  ChevronRight
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';

export const RoleSelectModal: React.FC = () => {
  const {
    isRoleModalOpen,
    setIsRoleModalOpen,
    role,
    setRole,
    setDonorView,
    setRecipientView,
    setAdminView,
    donors,
    currentDonor,
    setCurrentDonor,
    organizations,
    currentRecipient,
    setCurrentRecipient,
    addToast,
    firebaseUser,
    userProfile,
  } = useApp();

  const [selectedRole, setSelectedRole] = useState<UserRole>(role === 'landing' ? 'donor' : role);
  const [selectedDonorId, setSelectedDonorId] = useState<string>(currentDonor.id);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(currentRecipient.id);

  useEffect(() => {
    if (isRoleModalOpen && firebaseUser && userProfile) {
      setSelectedRole(userProfile.role);
    }
  }, [isRoleModalOpen, firebaseUser, userProfile]);

  if (!isRoleModalOpen) return null;

  const handleConfirm = () => {
    if (firebaseUser && selectedRole !== userProfile?.role) {
      addToast({
        type: 'error',
        title: 'Workspace Not Authorized',
        message: 'Sign in with an account assigned to this role to access its protected workspace.',
      });
      return;
    }

    if (selectedRole === 'donor') {
      const d = donors.find((item) => item.id === selectedDonorId) || donors[0];
      setCurrentDonor(d);
      setRole('donor');
      setDonorView('overview');
      addToast({
        type: 'info',
        title: 'Donor Workspace',
        message: `Workspace opened for ${d.name} (${d.type}).`,
      });
    } else if (selectedRole === 'recipient') {
      const o = organizations.find((item) => item.id === selectedRecipientId) || organizations[0];
      setCurrentRecipient(o);
      setRole('recipient');
      setRecipientView('overview');
      addToast({
        type: 'info',
        title: 'Recipient Workspace',
        message: `Workspace opened for ${o.name} (${o.type}).`,
      });
    } else if (selectedRole === 'admin') {
      setRole('admin');
      setAdminView('safety_review');
      addToast({
        type: 'info',
        title: firebaseUser ? 'Reviewer Workspace' : 'Reviewer Preview',
        message: firebaseUser
          ? 'Opening your authorized reviewer workspace.'
          : 'Previewing review workflows with local illustrative records.',
      });
    } else {
      setRole('landing');
    }
    setIsRoleModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="bg-[#1b4332] text-white px-6 py-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-emerald-700/70 text-emerald-100 text-[11px] font-semibold uppercase px-2 py-0.5 rounded">
                Workspace Selection
              </span>
              <h2 className="text-xl font-bold tracking-tight">Choose a Workspace</h2>
            </div>
            <p className="text-emerald-100/80 text-xs sm:text-sm mt-1">
              Open a donor, recipient, or reviewer workspace.
            </p>
          </div>
          <button
            onClick={() => setIsRoleModalOpen(false)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Access boundary notice */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-start gap-2.5 text-xs text-amber-900">
          <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            {firebaseUser
              ? `This account is assigned the ${userProfile?.role || 'current'} role. Workspace navigation does not change account permissions.`
              : 'Workspace selection changes this browser view only. Signing in and server-side authorization are required for protected account operations.'}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Role Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Donor Option */}
            <button
              type="button"
              onClick={() => !firebaseUser || userProfile?.role === 'donor' ? setSelectedRole('donor') : undefined}
              disabled={Boolean(firebaseUser && userProfile?.role !== 'donor')}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                selectedRole === 'donor'
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-600/20'
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                  selectedRole === 'donor' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-700'
                }`}>
                  <Building2 className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-900 text-sm">Food Donor</h3>
                <p className="text-stone-500 text-xs mt-1 leading-snug">
                  Hotels, restaurants, canteens & event organizers posting surplus food.
                </p>
              </div>
              {selectedRole === 'donor' && (
                <div className="absolute top-3 right-3 text-emerald-700">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>

            {/* Recipient Option */}
            <button
              type="button"
              onClick={() => !firebaseUser || userProfile?.role === 'recipient' ? setSelectedRole('recipient') : undefined}
              disabled={Boolean(firebaseUser && userProfile?.role !== 'recipient')}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                selectedRole === 'recipient'
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-600/20'
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                  selectedRole === 'recipient' ? 'bg-emerald-800 text-white' : 'bg-stone-100 text-stone-700'
                }`}>
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-900 text-sm">Recipient NGO</h3>
                <p className="text-stone-500 text-xs mt-1 leading-snug">
                  NGOs, shelters, charities & community kitchens claiming donations.
                </p>
              </div>
              {selectedRole === 'recipient' && (
                <div className="absolute top-3 right-3 text-emerald-700">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>

            {/* Admin Desk Option */}
            <button
              type="button"
              onClick={() => !firebaseUser || userProfile?.role === 'admin' ? setSelectedRole('admin') : undefined}
              disabled={Boolean(firebaseUser && userProfile?.role !== 'admin')}
              className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                selectedRole === 'admin'
                  ? 'border-emerald-600 bg-emerald-50/70 shadow-xs ring-2 ring-emerald-600/20'
                  : 'border-stone-200 hover:border-stone-300 hover:bg-stone-50'
              }`}
            >
              <div>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${
                  selectedRole === 'admin' ? 'bg-amber-600 text-white' : 'bg-stone-100 text-stone-700'
                }`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-stone-900 text-sm">{firebaseUser ? 'Reviewer Workspace' : 'Reviewer Preview'}</h3>
                <p className="text-stone-500 text-xs mt-1 leading-snug">
                  Audit flagged food items & approve pending NGO credentials.
                </p>
              </div>
              {selectedRole === 'admin' && (
                <div className="absolute top-3 right-3 text-emerald-700">
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
              )}
            </button>
          </div>

          {/* Donor workspace selection */}
          {selectedRole === 'donor' && (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-3">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Select donor organization:
              </label>
              <div className="space-y-2">
                {donors.map((d) => (
                  <label
                    key={d.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedDonorId === d.id
                        ? 'bg-white border-emerald-600 shadow-xs'
                        : 'bg-white/60 border-stone-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="donorRadio"
                        checked={selectedDonorId === d.id}
                        onChange={() => setSelectedDonorId(d.id)}
                        className="text-emerald-700 focus:ring-emerald-600"
                      />
                      <div>
                        <div className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                          <span>{d.name}</span>
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                            {d.type}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">{d.address}</p>
                      </div>
                    </div>
                    <span className="text-xs text-stone-600 font-medium">Organization profile</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Recipient workspace selection */}
          {selectedRole === 'recipient' && (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 space-y-3">
              <label className="block text-xs font-semibold text-stone-700 uppercase tracking-wider">
                Select recipient organization:
              </label>
              <div className="space-y-2">
                {organizations.map((org) => (
                  <label
                    key={org.id}
                    className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedRecipientId === org.id
                        ? 'bg-white border-emerald-600 shadow-xs'
                        : 'bg-white/60 border-stone-200 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="recipientRadio"
                        checked={selectedRecipientId === org.id}
                        onChange={() => setSelectedRecipientId(org.id)}
                        className="text-emerald-700 focus:ring-emerald-600"
                      />
                      <div>
                        <div className="text-sm font-semibold text-stone-900 flex items-center gap-2">
                          <span>{org.name}</span>
                          <span className="text-[10px] bg-stone-100 text-stone-600 px-1.5 py-0.5 rounded border border-stone-200">
                            {org.type}
                          </span>
                        </div>
                        <p className="text-xs text-stone-500">
                          Capacity: {org.maxDailyCapacityKg} kg/day | {org.serviceArea}
                        </p>
                      </div>
                    </div>
                    {org.isIllustrative ? (
                      <span className="text-xs text-stone-500 font-medium">Illustrative record</span>
                    ) : org.verified ? (
                      <span className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Accredited
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium flex items-center gap-1">
                        Pending Verification
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Reviewer workspace */}
          {selectedRole === 'admin' && (
            <div className="bg-stone-50 rounded-xl p-4 border border-stone-200/80 text-xs text-stone-600 space-y-2">
              <p className="font-semibold text-stone-800">
                {firebaseUser ? 'Food Safety Reviewer' : 'Reviewer workflow preview'}
              </p>
              <p>
                {firebaseUser
                  ? 'Review access is determined by the authenticated Firebase account and Firestore rules.'
                  : 'Review actions here update local illustrative records only. They do not grant administrator permissions or change production records.'}
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-stone-50 px-6 py-4 border-t border-stone-200 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              setRole('landing');
              setIsRoleModalOpen(false);
            }}
            className="text-xs text-stone-500 hover:text-stone-800 transition-colors"
          >
            Return to Public Landing Page
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRoleModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200/70 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#1b4332] hover:bg-emerald-900 rounded-lg shadow-sm transition-all flex items-center gap-1.5"
            >
              <span>Continue Session</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
