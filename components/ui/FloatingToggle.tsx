'use client';

import { UtensilsCrossed, Wrench } from 'lucide-react';

interface FloatingToggleProps {
  activeTab: 'comidas' | 'servicios';
  onChange: (tab: 'comidas' | 'servicios') => void;
}

export function FloatingToggle({ activeTab, onChange }: FloatingToggleProps) {
  const handleTabChange = (tab: 'comidas' | 'servicios') => {
    localStorage.setItem('valle_real_active_tab', tab);
    onChange(tab);
  };

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
      <div className="bg-slate-900/85 backdrop-blur-md p-1.5 rounded-full shadow-2xl border border-slate-700/50 flex items-center gap-1">
        
        <button
          onClick={() => handleTabChange('comidas')}
          className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
            activeTab === 'comidas'
              ? 'bg-emerald-500 text-white shadow-lg scale-100'
              : 'text-slate-400 hover:text-slate-200 scale-95'
          }`}
        >
          <UtensilsCrossed className="w-5 h-5" />
          <span>Comidas</span>
        </button>

        <button
          onClick={() => handleTabChange('servicios')}
          className={`relative flex items-center gap-2 px-6 py-3 rounded-full text-sm font-bold transition-all duration-300 cursor-pointer ${
            activeTab === 'servicios'
              ? 'bg-blue-600 text-white shadow-lg scale-100'
              : 'text-slate-400 hover:text-slate-200 scale-95'
          }`}
        >
          <Wrench className="w-5 h-5" />
          <span>Servicios</span>
        </button>
      </div>
    </div>
  );
}