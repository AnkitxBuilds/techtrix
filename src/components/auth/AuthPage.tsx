import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { AuthCard } from './AuthCard';

export const AuthPage: React.FC = () => {
  const { setRole } = useApp();

  return (
    <div className="py-8 px-4 flex flex-col items-center justify-center min-h-[calc(100vh-14rem)]">
      <div className="w-full max-w-md mb-4 flex items-center justify-between">
        <button
          onClick={() => setRole('landing')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-stone-600 hover:text-emerald-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to FoodBridge Home</span>
        </button>
      </div>

      <div className="w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
        <AuthCard isModal={false} />
      </div>
    </div>
  );
};
