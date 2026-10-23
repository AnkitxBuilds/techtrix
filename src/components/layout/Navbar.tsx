import React, { useState } from 'react';
import {
  UtensilsCrossed,
  ShieldCheck,
  Sparkles,
  ArrowRightLeft,
  Truck,
  PlusCircle,
  Search,
  CheckCircle2,
  Building2,
  SlidersHorizontal,
  Menu,
  X,
  AlertTriangle,
  RotateCcw,
  BarChart3,
  HeartHandshake,
  User
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { DonorView, RecipientView, AdminView } from '../../types';

export const Navbar: React.FC = () => {
  const {
    role,
    setRole,
    donorView,
    setDonorView,
    recipientView,
    setRecipientView,
    adminView,
    setAdminView,
    currentDonor,
    currentRecipient,
    setIsRoleModalOpen,
    setIsImpactModalOpen,
    resetDemoData,
    isAuthModalOpen,
    setIsAuthModalOpen,
    isCloudMode,
    firebaseUser,
    userProfile,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#fcfbf9]/95 backdrop-blur-md border-b border-stone-200/80 transition-all">
      {/* Top Banner: Hackathon & Cloud / Demo Status */}
      <div className="bg-[#1b4332] text-white text-xs px-4 py-1.5 flex items-center justify-between">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-emerald-700/60 text-emerald-100 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide uppercase">
              TechTrix &apos;26 Phase 2
            </span>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold tracking-wide bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700 text-emerald-200 transition-colors cursor-pointer"
              title="Click to view Cloud Firestore status or switch authentication"
            >
              <span className={`w-2 h-2 rounded-full ${isCloudMode ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              <span>{isCloudMode ? 'Cloud Firestore: Realtime' : 'Local Demo Mode'}</span>
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hover:text-emerald-200 text-emerald-200/90 text-xs flex items-center gap-1 font-medium transition-colors cursor-pointer"
            >
              {firebaseUser ? (
                <span>Account: {firebaseUser.email?.split('@')[0]} ({userProfile?.role || 'user'})</span>
              ) : (
                <span>Sign In / Log In</span>
              )}
            </button>
            <span className="text-emerald-600 hidden md:inline">|</span>
            <button
              onClick={() => setIsImpactModalOpen(true)}
              className="hover:text-emerald-200 underline decoration-emerald-400/60 underline-offset-2 flex items-center gap-1 transition-colors"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Impact Methodology
            </button>
            <span className="text-emerald-600 hidden md:inline">|</span>
            <button
              onClick={resetDemoData}
              title="Reset sample listings to default state"
              className="text-emerald-200/80 hover:text-white flex items-center gap-1 transition-colors text-[11px]"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Demo Data
            </button>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setRole('landing');
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-2.5 group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-800 to-[#1b4332] text-emerald-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <UtensilsCrossed className="w-5 h-5 text-emerald-200" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold tracking-tight text-emerald-950 font-sans">
                    FoodBridge
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-stone-100 text-stone-600 border border-stone-300 px-1.5 py-0.2 rounded">
                    Demo
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 hidden sm:block -mt-0.5">
                  Good food deserves another destination.
                </p>
              </div>
            </button>
          </div>

          {/* Navigation Links based on Current Role */}
          <nav className="hidden lg:flex items-center gap-1">
            {role === 'landing' && (
              <>
                <button
                  onClick={() => {
                    const el = document.getElementById('how-it-works');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  How It Works
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('smartmatch-preview');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  SmartMatch Engine
                </button>
                <button
                  onClick={() => {
                    const el = document.getElementById('impact-preview');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
                >
                  Live Impact
                </button>
              </>
            )}

            {role === 'donor' && (
              <>
                <button
                  onClick={() => setDonorView('overview')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    donorView === 'overview'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setDonorView('my_donations')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    donorView === 'my_donations'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  My Listings
                </button>
                <button
                  onClick={() => setDonorView('create_donation')}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
                    donorView === 'create_donation'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Post Donation
                </button>
                <button
                  onClick={() => setDonorView('smartmatch')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    donorView === 'smartmatch'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  SmartMatch
                </button>
                <button
                  onClick={() => setDonorView('tracking')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    donorView === 'tracking'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Tracking
                </button>
              </>
            )}

            {role === 'recipient' && (
              <>
                <button
                  onClick={() => setRecipientView('overview')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    recipientView === 'overview'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Overview
                </button>
                <button
                  onClick={() => setRecipientView('explore')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    recipientView === 'explore'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Explore Donations
                </button>
                <button
                  onClick={() => setRecipientView('accepted')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    recipientView === 'accepted'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  My Pickups
                </button>
                <button
                  onClick={() => setRecipientView('tracking')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    recipientView === 'tracking'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <Truck className="w-4 h-4" />
                  Tracking
                </button>
                <button
                  onClick={() => setRecipientView('profile_requirements')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    recipientView === 'profile_requirements'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <SlidersHorizontal className="w-4 h-4" />
                  Org Quota & Specs
                </button>
              </>
            )}

            {role === 'admin' && (
              <>
                <button
                  onClick={() => setAdminView('safety_review')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    adminView === 'safety_review'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Food Safety Review
                </button>
                <button
                  onClick={() => setAdminView('org_verification')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    adminView === 'org_verification'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  NGO Verification Desk
                </button>
                <button
                  onClick={() => setAdminView('audit_log')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    adminView === 'audit_log'
                      ? 'bg-emerald-900 text-white shadow-xs'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
                  }`}
                >
                  Audit Logs
                </button>
              </>
            )}
          </nav>

          {/* Role Indicator & Switcher */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="hidden sm:inline-flex items-center gap-1.5 text-stone-700 hover:text-emerald-950 hover:bg-stone-100/90 text-xs font-semibold px-3 py-2 rounded-lg transition-colors border border-stone-200 cursor-pointer"
              title="Sign in or view account"
            >
              <User className="w-3.5 h-3.5 text-emerald-800" />
              <span>{firebaseUser ? `My Account (${userProfile?.role || 'user'})` : 'Sign In / Log In'}</span>
            </button>

            {role === 'landing' ? (
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="bg-[#1b4332] text-white hover:bg-emerald-900 text-sm font-semibold px-4 py-2 rounded-lg transition-all shadow-xs flex items-center gap-2"
              >
                <span>Enter Demo Workspace</span>
                <ArrowRightLeft className="w-4 h-4 text-emerald-300" />
              </button>
            ) : (
              <button
                onClick={() => setIsRoleModalOpen(true)}
                className="group flex items-center gap-2 bg-stone-100 hover:bg-stone-200/80 border border-stone-200 rounded-lg px-3 py-1.5 transition-all text-left"
                title="Switch demo persona (Donor, Recipient, Admin)"
              >
                <div className="w-7 h-7 rounded-md bg-white border border-stone-200 flex items-center justify-center text-emerald-800 shadow-2xs">
                  {role === 'donor' && <Building2 className="w-4 h-4" />}
                  {role === 'recipient' && <HeartHandshake className="w-4 h-4 text-emerald-700" />}
                  {role === 'admin' && <ShieldCheck className="w-4 h-4 text-amber-600" />}
                </div>
                <div className="hidden sm:block text-xs">
                  <div className="text-[10px] uppercase font-bold tracking-wider text-stone-500">
                    Role: {role}
                  </div>
                  <div className="font-semibold text-stone-800 truncate max-w-[130px]">
                    {role === 'donor' && currentDonor.name}
                    {role === 'recipient' && currentRecipient.name}
                    {role === 'admin' && 'Food Safety Desk'}
                  </div>
                </div>
                <ArrowRightLeft className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 ml-1 transition-colors" />
              </button>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile navigation dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {role === 'landing' && (
            <>
              <button
                onClick={() => {
                  setRole('donor');
                  setDonorView('create_donation');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-emerald-900 bg-emerald-50 rounded-lg"
              >
                Donate Surplus Food
              </button>
              <button
                onClick={() => {
                  setRole('recipient');
                  setRecipientView('explore');
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 rounded-lg"
              >
                Find Food Donations
              </button>
            </>
          )}

          {role === 'donor' && (
            <>
              {(['overview', 'my_donations', 'create_donation', 'smartmatch', 'tracking', 'profile'] as DonorView[]).map(
                (v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setDonorView(v);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg capitalize ${
                      donorView === v ? 'bg-emerald-900 text-white' : 'text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    {v.replace('_', ' ')}
                  </button>
                )
              )}
            </>
          )}

          {role === 'recipient' && (
            <>
              {(['overview', 'explore', 'accepted', 'tracking', 'profile_requirements'] as RecipientView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setRecipientView(v);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg capitalize ${
                    recipientView === v ? 'bg-emerald-900 text-white' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {v.replace('_', ' ')}
                </button>
              ))}
            </>
          )}

          {role === 'admin' && (
            <>
              {(['safety_review', 'org_verification', 'audit_log'] as AdminView[]).map((v) => (
                <button
                  key={v}
                  onClick={() => {
                    setAdminView(v);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm font-medium rounded-lg capitalize ${
                    adminView === v ? 'bg-emerald-900 text-white' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  {v.replace('_', ' ')}
                </button>
              ))}
            </>
          )}

          <div className="pt-2 border-t border-stone-200 space-y-1">
            <button
              onClick={() => {
                setIsAuthModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-emerald-900 bg-emerald-50 rounded-lg flex items-center justify-between"
            >
              <span>{firebaseUser ? `Account: ${firebaseUser.email}` : 'Sign In / Log In'}</span>
              <span className={`w-2.5 h-2.5 rounded-full ${isCloudMode ? 'bg-emerald-500' : 'bg-amber-400'}`} />
            </button>
            <button
              onClick={() => {
                setIsRoleModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-sm font-semibold text-stone-700 hover:bg-stone-50 rounded-lg flex items-center justify-between"
            >
              <span>Switch Demo Persona / Role</span>
              <ArrowRightLeft className="w-4 h-4 text-stone-500" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
