/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { LandingPage } from './components/landing/LandingPage';
import { DonorDashboard } from './components/donor/DonorDashboard';
import { CreateDonationForm } from './components/donor/CreateDonationForm';
import { SmartMatchView } from './components/smartmatch/SmartMatchView';
import { RecipientDashboard } from './components/recipient/RecipientDashboard';
import { ExploreDonations } from './components/recipient/ExploreDonations';
import { TrackingView } from './components/tracking/TrackingView';
import { AdminReviewView } from './components/admin/AdminReviewView';
import { RoleSelectModal } from './components/auth/RoleSelectModal';
import { AuthModal } from './components/auth/AuthModal';
import { AuthPage } from './components/auth/AuthPage';
import { ImpactModal } from './components/impact/ImpactModal';
import { DonationDetailModal } from './components/donation/DonationDetailModal';
import { ToastContainer } from './components/common/ToastContainer';

const MainContent: React.FC = () => {
  const { role, donorView, recipientView } = useApp();

  return (
    <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-in fade-in duration-150">
      {/* Landing Page */}
      {role === 'landing' && <LandingPage />}

      {/* Auth Page */}
      {role === 'auth' && <AuthPage />}

      {/* Donor Role Views */}
      {role === 'donor' && (
        <>
          {donorView === 'create_donation' && <CreateDonationForm />}
          {donorView === 'smartmatch' && <SmartMatchView />}
          {donorView === 'tracking' && <TrackingView />}
          {['overview', 'my_donations', 'profile'].includes(donorView) && <DonorDashboard />}
        </>
      )}

      {/* Recipient Role Views */}
      {role === 'recipient' && (
        <>
          {recipientView === 'explore' && <ExploreDonations />}
          {recipientView === 'tracking' && <TrackingView />}
          {['overview', 'accepted', 'profile_requirements'].includes(recipientView) && (
            <RecipientDashboard />
          )}
        </>
      )}

      {/* Admin Role View */}
      {role === 'admin' && <AdminReviewView />}
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen flex flex-col bg-[#fcfbf9] text-stone-800 antialiased font-sans">
        <Navbar />
        <MainContent />
        <Footer />

        {/* Global Modals & Notifications */}
        <RoleSelectModal />
        <AuthModal />
        <ImpactModal />
        <DonationDetailModal />
        <ToastContainer />
      </div>
    </AppProvider>
  );
}
