import React from 'react';
import { X, Scale, Leaf, HeartHandshake, Info, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ImpactModal: React.FC = () => {
  const { isImpactModalOpen, setIsImpactModalOpen, impactStats } = useApp();

  if (!isImpactModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1b4332] text-white px-6 py-5 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-emerald-300" />
              <h2 className="text-lg font-bold tracking-tight">Impact Estimation Methodology</h2>
            </div>
            <p className="text-emerald-100/80 text-xs mt-1">
              Derived mathematically from local prototype data records.
            </p>
          </div>
          <button
            onClick={() => setIsImpactModalOpen(false)}
            className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-emerald-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Prototype context banner */}
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-start gap-2.5 text-xs text-amber-950">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <strong className="font-semibold">Sample Data Disclaimer:</strong> All metrics shown in this prototype reflect the current in-memory listings and demo actions. They demonstrate calculation logic and are not claims of real-world historical deliveries.
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-stone-600">
          {/* Dynamic Summary from Current State */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-stone-50 rounded-xl border border-stone-200 text-center">
            <div>
              <div className="text-2xl font-bold text-stone-900">{impactStats.totalKgSaved} kg</div>
              <div className="text-[11px] text-stone-500 font-medium mt-0.5">Surplus Food Tracked</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-800">~{impactStats.estimatedMeals}</div>
              <div className="text-[11px] text-stone-500 font-medium mt-0.5">Est. Meals Equivalent</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-700">~{impactStats.co2eDivertedKg} kg</div>
              <div className="text-[11px] text-stone-500 font-medium mt-0.5">CO₂e Avoided</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                1. Meal Calculation Formula (FAO & WRAP Standards)
              </h4>
              <p className="leading-relaxed">
                The UN Food and Agriculture Organization (FAO) and WRAP UK benchmark standard defines an average edible meal portion as <strong>0.42 kg (420 grams)</strong> of prepared nutritious food.
              </p>
              <div className="p-2.5 bg-stone-100 rounded-lg font-mono text-[11px] text-stone-800">
                Estimated Meals = (Total Surpluses in kg) / 0.42 kg
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5 text-sm">
                <Leaf className="w-4 h-4 text-emerald-700" />
                2. Greenhouse Gas (CO₂e) Avoidance Factor
              </h4>
              <p className="leading-relaxed">
                Decomposing food in municipal landfills generates methane, a greenhouse gas with 28x greater warming potential than CO₂. Drawing on Life Cycle Assessment (LCA) data for mixed commercial surplus food, diverting 1 kg of food from landfill mitigates approximately <strong>2.5 kg of CO₂ equivalent emissions</strong>.
              </p>
              <div className="p-2.5 bg-stone-100 rounded-lg font-mono text-[11px] text-stone-800">
                CO₂e Diverted = (Total Surpluses in kg) × 2.5 kg CO₂e
              </div>
            </div>

            <div className="space-y-1.5">
              <h4 className="font-bold text-stone-900 flex items-center gap-1.5 text-sm">
                <HeartHandshake className="w-4 h-4 text-emerald-700" />
                3. Qualification Criteria
              </h4>
              <p className="leading-relaxed">
                Only donations that have been accepted, scheduled, picked up, or confirmed delivered are counted towards diverted impact. Listings that expire without collection or are blocked due to safety violations are excluded.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-stone-50 px-6 py-3.5 border-t border-stone-200 flex justify-end">
          <button
            onClick={() => setIsImpactModalOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#1b4332] hover:bg-emerald-900 rounded-lg transition-colors"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
