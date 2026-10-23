import React, { useState } from 'react';
import {
  UtensilsCrossed,
  Mail,
  Lock,
  User as UserIcon,
  Building2,
  HeartHandshake,
  ArrowRight,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  LogOut,
  ShieldCheck,
  Building,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

interface AuthCardProps {
  initialTab?: 'signin' | 'create_account';
  onSuccess?: () => void;
  onClose?: () => void;
  isModal?: boolean;
}

export const AuthCard: React.FC<AuthCardProps> = ({
  initialTab = 'signin',
  onSuccess,
  onClose,
  isModal = false,
}) => {
  const {
    firebaseUser,
    userProfile,
    loginEmail,
    registerEmail,
    loginGoogle,
    logout,
    setRole,
    setDonorView,
    setRecipientView,
    setAdminView,
    addToast,
    setIsAuthModalOpen,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'signin' | 'create_account'>(initialTab);

  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Create Account state
  const [fullName, setFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState<'donor' | 'recipient'>('donor');
  const [orgName, setOrgName] = useState('');

  // UI status
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Switch tabs cleanly
  const handleTabSwitch = (tab: 'signin' | 'create_account') => {
    setActiveTab(tab);
    setErrorMessage('');
  };

  // Direct user to appropriate dashboard based on their server role
  const navigateToDashboard = (targetRole: string) => {
    if (targetRole === 'donor') {
      setRole('donor');
      setDonorView('overview');
    } else if (targetRole === 'recipient') {
      setRole('recipient');
      setRecipientView('overview');
    } else if (targetRole === 'admin') {
      setRole('admin');
      setAdminView('safety_review');
    } else {
      setRole('landing');
    }
  };

  // Sign In with Email & Password
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanEmail = signInEmail.trim();
    if (!cleanEmail || !signInPassword) {
      setErrorMessage('Please provide both your email address and password.');
      return;
    }

    setIsLoading(true);
    try {
      const profile = await loginEmail(cleanEmail, signInPassword);
      if (profile) {
        navigateToDashboard(profile.role);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to sign in. Please verify your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  // Create Account with Email & Password
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const cleanName = fullName.trim();
    const cleanEmail = signUpEmail.trim();
    const cleanOrg = orgName.trim();

    if (!cleanName) {
      setErrorMessage('Please enter your full name.');
      return;
    }

    if (!cleanEmail) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (!cleanOrg) {
      setErrorMessage(
        selectedRole === 'donor'
          ? 'Please enter your establishment or donor business name.'
          : 'Please enter your NGO or charity organization name.'
      );
      return;
    }

    if (signUpPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (signUpPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and re-enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      const profile = await registerEmail(
        cleanEmail,
        signUpPassword,
        selectedRole,
        undefined,
        cleanName,
        cleanOrg
      );
      if (profile) {
        navigateToDashboard(profile.role);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Continue with Google
  const handleGoogleSignIn = async () => {
    setErrorMessage('');
    setIsLoading(true);
    try {
      const profile = await loginGoogle();
      if (profile) {
        navigateToDashboard(profile.role);
      }
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200/90 shadow-xl overflow-hidden flex flex-col max-w-md w-full mx-auto transition-all">
      {/* Top Header with FoodBridge branding */}
      <div className="bg-[#1b4332] text-white px-6 pt-5 pb-5 relative">
        {isModal && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-emerald-100/70 hover:text-white p-1.5 rounded-lg hover:bg-emerald-800/60 transition-colors"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-700 to-emerald-900 border border-emerald-600/40 text-emerald-100 flex items-center justify-center shadow-xs shrink-0">
            <UtensilsCrossed className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight text-white font-sans">
                FoodBridge
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-950/90 text-emerald-200 border border-emerald-700/60 px-2 py-0.5 rounded">
                Portal
              </span>
            </div>
            <p className="text-emerald-100/80 text-xs mt-0.5 leading-snug">
              Good food deserves another destination.
            </p>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="p-6 overflow-y-auto space-y-4 text-stone-700 bg-white">
        {/* If user is already authenticated */}
        {firebaseUser ? (
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50/80 rounded-xl border border-emerald-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-emerald-950 text-sm flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Currently Signed In
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider bg-emerald-700 text-white px-2.5 py-0.5 rounded-md shadow-2xs">
                  {userProfile?.role || 'User'}
                </span>
              </div>
              <div className="text-xs text-stone-600 space-y-1">
                <div>
                  <span className="text-stone-400">Email:</span>{' '}
                  <strong className="text-stone-800">{firebaseUser.email}</strong>
                </div>
                {userProfile?.displayName && (
                  <div>
                    <span className="text-stone-400">Name:</span>{' '}
                    <strong className="text-stone-800">{userProfile.displayName}</strong>
                  </div>
                )}
                {userProfile?.orgName && (
                  <div>
                    <span className="text-stone-400">Organization:</span>{' '}
                    <strong className="text-stone-800">{userProfile.orgName}</strong>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  navigateToDashboard(userProfile?.role || 'donor');
                  if (onSuccess) onSuccess();
                }}
                className="w-full py-2.5 bg-[#1b4332] hover:bg-emerald-900 text-white font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <span>Go to My Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    if (onClose) onClose();
                  }}
                  className="w-full px-3 py-2 text-xs font-medium text-rose-700 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-colors flex items-center justify-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="bg-emerald-50/90 border border-emerald-200/80 rounded-xl p-2.5 flex items-center gap-2 text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="leading-tight">
                <span className="font-semibold text-emerald-950">Protected account access:</span> Sign-in uses Firebase Authentication and Firestore authorization rules.
              </div>
            </div>

            {/* Tab Selector */}
            <div className="flex items-center bg-stone-100 p-1 rounded-xl gap-1">
              <button
                type="button"
                onClick={() => handleTabSwitch('signin')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'signin'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleTabSwitch('create_account')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeTab === 'create_account'
                    ? 'bg-white text-emerald-950 shadow-xs'
                    : 'text-stone-500 hover:text-stone-900'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Banner if any */}
            {errorMessage && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-start gap-2.5 text-xs animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">{errorMessage}</div>
              </div>
            )}

            {/* TAB 1: SIGN IN */}
            {activeTab === 'signin' && (
              <form onSubmit={handleSignIn} className="space-y-3.5">
                {/* Email address */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      placeholder="name@organization.com"
                      autoComplete="email"
                      className="w-full pl-9 pr-3 py-2 text-xs bg-stone-50/50 hover:bg-white border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-stone-700">
                      Password
                    </label>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type={showSignInPassword ? 'text' : 'password'}
                      required
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="current-password"
                      className="w-full pl-9 pr-10 py-2 text-xs bg-stone-50/50 hover:bg-white border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 focus:outline-hidden transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowSignInPassword(!showSignInPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-hidden"
                      aria-label={showSignInPassword ? 'Hide password' : 'Show password'}
                    >
                      {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#1b4332] hover:bg-emerald-900 active:bg-emerald-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Divider */}
                <div className="relative py-0.5 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-stone-200" />
                  </div>
                  <span className="relative bg-white px-2.5 text-[10px] text-stone-400 uppercase tracking-wider font-medium">
                    or
                  </span>
                </div>

                {/* Continue with Google */}
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={isLoading}
                  className="w-full py-2 bg-white hover:bg-stone-50 border border-stone-300 text-stone-700 font-semibold text-xs rounded-xl shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </button>
              </form>
            )}

            {/* TAB 2: CREATE ACCOUNT */}
            {activeTab === 'create_account' && (
              <form onSubmit={handleCreateAccount} className="space-y-3">
                {/* Full name */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Full name
                  </label>
                  <div className="relative">
                    <UserIcon className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Maya Lin"
                      autoComplete="name"
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50/50 hover:bg-white border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Email address */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Email address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="maya@organization.com"
                      autoComplete="email"
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50/50 hover:bg-white border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Role selection: Food Donor or Recipient NGO */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    Role selection
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedRole('donor')}
                      className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        selectedRole === 'donor'
                          ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-700'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300 bg-stone-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs">
                        <Building2 className="w-3.5 h-3.5 text-emerald-800" />
                        <span>Food Donor</span>
                      </div>
                      <span className="text-[10px] text-stone-500 leading-tight">
                        Restaurant, hotel, canteen
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedRole('recipient')}
                      className={`p-2 rounded-xl border text-left flex flex-col gap-0.5 transition-all cursor-pointer ${
                        selectedRole === 'recipient'
                          ? 'border-emerald-700 bg-emerald-50/70 text-emerald-950 ring-1 ring-emerald-700'
                          : 'border-stone-200 text-stone-600 hover:border-stone-300 bg-stone-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold text-xs">
                        <HeartHandshake className="w-3.5 h-3.5 text-emerald-700" />
                        <span>Recipient NGO</span>
                      </div>
                      <span className="text-[10px] text-stone-500 leading-tight">
                        Shelter, charity kitchen
                      </span>
                    </button>
                  </div>
                </div>

                {/* Organization name */}
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-stone-700">
                    {selectedRole === 'donor'
                      ? 'Establishment / Business name'
                      : 'NGO / Charity organization name'}
                  </label>
                  <div className="relative">
                    <Building className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder={
                        selectedRole === 'donor'
                          ? 'e.g. Grand Bistro or Hilltop Hotel'
                          : 'e.g. Hope Community Kitchen'
                      }
                      className="w-full pl-9 pr-3 py-1.5 text-xs bg-stone-50/50 hover:bg-white border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 focus:outline-hidden transition-all"
                    />
                  </div>
                </div>

                {/* Password fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Password
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        required
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Min. 6 chars"
                        autoComplete="new-password"
                        className="w-full pl-8 pr-8 py-1.5 text-xs bg-stone-50/50 hover:bg-white border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 focus:outline-hidden transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-hidden"
                      >
                        {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-semibold text-stone-700">
                      Confirm
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter"
                        autoComplete="new-password"
                        className="w-full pl-8 pr-8 py-1.5 text-xs bg-stone-50/50 hover:bg-white border border-stone-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-700 focus:border-emerald-700 focus:outline-hidden transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 focus:outline-hidden"
                      >
                        {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Create Account Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#1b4332] hover:bg-emerald-900 active:bg-emerald-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 mt-1"
                >
                  <span>{isLoading ? 'Creating Account...' : 'Create Account & Enter'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}

            {/* Footer switcher */}
            <div className="pt-2 border-t border-stone-100 text-center flex items-center justify-between text-xs text-stone-500">
              {activeTab === 'signin' ? (
                <div>
                  No account?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('create_account')}
                    className="font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                  >
                    Create Account
                  </button>
                </div>
              ) : (
                <div>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => handleTabSwitch('signin')}
                    className="font-semibold text-emerald-800 hover:text-emerald-950 underline underline-offset-2"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {isModal && (
                <button
                  type="button"
                  onClick={() => {
                    setIsAuthModalOpen(false);
                    setRole('auth');
                  }}
                  className="text-stone-400 hover:text-emerald-800 flex items-center gap-1 transition-colors text-[11px]"
                >
                  <span>Full Screen Page</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
