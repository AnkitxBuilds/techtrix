import React from 'react';
import { UtensilsCrossed, Heart, Sparkles, Scale, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Footer: React.FC = () => {
  const { setRole, setDonorView, setRecipientView, setIsImpactModalOpen, setIsRoleModalOpen } = useApp();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 text-sm mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                FoodBridge
              </span>
            </div>
            <p className="text-stone-400 text-xs sm:text-sm leading-relaxed max-w-md">
              &ldquo;Good food deserves another destination.&rdquo; Intelligent surplus food waste reduction and safe redistribution platform connecting commercial kitchens, hotels, canteens, and hostels with verified community shelters and hunger-relief organizations.
            </p>
            <button
              onClick={() => setIsImpactModalOpen(true)}
              className="text-emerald-300 hover:text-white text-xs underline underline-offset-2 flex items-center gap-1.5"
            >
              <Info className="w-3.5 h-3.5" />
              Data sources, estimates &amp; access information
            </button>
          </div>

          {/* Role Navigation */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Role Portals
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => {
                    setRole('donor');
                    setDonorView('create_donation');
                  }}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span>Food Donor Portal (Post Surplus)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setRole('recipient');
                    setRecipientView('explore');
                  }}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span>Recipient NGO Portal (Claim Food)</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsRoleModalOpen(true)}
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <span>Reviewer Workspace</span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => setIsRoleModalOpen(true)}
                  className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors flex items-center gap-1"
                >
                  <span>Switch Workspace &rarr;</span>
                </button>
              </li>
            </ul>
          </div>

          {/* System & Standards */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">
              Safety & Standards
            </h4>
            <ul className="space-y-2 text-xs text-stone-400">
              <li className="flex items-center gap-1.5">
                <Scale className="w-3.5 h-3.5 text-emerald-500" />
                <span>Strict 6-Point Safety Gating</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                <span>Deterministic Compatibility Engine</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-500" />
                <button
                  onClick={() => setIsImpactModalOpen(true)}
                  className="hover:text-white underline decoration-dotted underline-offset-2"
                >
                  Data &amp; Impact Information
                </button>
              </li>
              <li className="text-[11px] text-stone-400 pt-2 border-t border-stone-800">
                Thermal threshold monitoring: Hot-hold &gt;60°C | Cold-chain 0-4°C
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between text-xs text-stone-400 gap-3">
          <p>© 2026 FoodBridge. TechTrix&apos;26 Hackathon Submission.</p>
          <div className="flex items-center gap-1 text-stone-400">
            <span>Built with social impact in mind</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 inline fill-rose-500" />
            <span>for zero edible food waste.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
