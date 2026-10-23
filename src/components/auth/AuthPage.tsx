import React from 'react';
import {
  ArrowLeft,
  UtensilsCrossed,
  ShieldCheck,
  Sparkles,
  HeartHandshake,
  Clock,
  Leaf,
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthCard } from './AuthCard';

export const AuthPage: React.FC = () => {
  const { setRole } = useApp();

  return (
    <div className="py-6 px-4 max-w-6xl mx-auto min-h-[calc(100vh-12rem)] flex flex-col justify-center">
      {/* Back button */}
      <div className="mb-6">
        <button
          onClick={() => setRole('landing')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-emerald-950 transition-colors bg-white px-3.5 py-2 rounded-xl border border-stone-200 shadow-2xs hover:shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-800" />
          <span>Back to FoodBridge Home</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Left column: Value Proposition & Mission */}
        <div className="lg:col-span-6 space-y-6 lg:pr-6">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full text-xs font-semibold text-emerald-900">
            <Sparkles className="w-3.5 h-3.5 text-emerald-700" />
            <span>Redistribution Platform &bull; Safe & Fast</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight leading-tight">
              Sign in to manage surplus food redistribution.
            </h1>
            <p className="text-stone-600 text-sm sm:text-base leading-relaxed">
              Whether you are a restaurant donating excess banquet meals or an NGO feeding communities in need, FoodBridge makes logistics instant, compliant, and verified.
            </p>
          </div>

          {/* Key Value Cards */}
          <div className="space-y-3 pt-2">
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <UtensilsCrossed className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <strong className="block text-stone-900 font-semibold mb-0.5">
                  Real-time Surplus Dispatch
                </strong>
                <span className="text-stone-500 leading-relaxed">
                  Post available batches with instant thermal handling tags and remaining time windows.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
              </div>
              <div className="text-xs">
                <strong className="block text-stone-900 font-semibold mb-0.5">
                  Verified Safety Standards
                </strong>
                <span className="text-stone-500 leading-relaxed">
                  Cold-chain adherence and accredited NGO verification to ensure safe consumption.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-white border border-stone-200/80 shadow-2xs">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
                <Leaf className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-xs">
                <strong className="block text-stone-900 font-semibold mb-0.5">
                  Live Environmental Impact
                </strong>
                <span className="text-stone-500 leading-relaxed">
                  Automatically compute meals served and CO2 emissions averted with every saved pickup.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Auth Card */}
        <div className="lg:col-span-6 flex justify-center">
          <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <AuthCard isModal={false} />
          </div>
        </div>
      </div>
    </div>
  );
};
