'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Download, Store } from 'lucide-react';

interface HomeHeaderProps {
  isInstalled: boolean;
  onInstallClick: () => void;
  onOpenAuth: () => void;
}

export function HomeHeader({ isInstalled, onInstallClick, onOpenAuth }: HomeHeaderProps) {
  const router = useRouter();

  const [activeDashboardUrl] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;

    // Lee de forma precisa el token del comercio actual guardado
    const currentToken = localStorage.getItem('current_tenant_token') || sessionStorage.getItem('current_tenant_token');
    if (currentToken) {
      return `/dashboard/${currentToken}`;
    }
    return null;
  });

  return (
    <header className="bg-gradient-to-b from-emerald-800 via-emerald-700 to-teal-700 text-white pt-6 pb-8 px-4 rounded-b-[2.5rem] shadow-xl relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-600/30 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-teal-600/20 rounded-full blur-2xl pointer-events-none" />

      <div className="max-w-md mx-auto space-y-4 relative z-10">
        <div className="flex justify-between items-center">
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 bg-black/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-100 border border-white/10 shadow-xs">
            <MapPin className="w-3.5 h-3.5 text-emerald-300" /> Valle Real
          </span>

          <div className="flex items-center gap-2">
            {!isInstalled && (
              <button
                onClick={onInstallClick}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950 bg-emerald-300 hover:bg-emerald-200 px-3.5 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer animate-pulse"
              >
                <Download className="w-3.5 h-3.5" /> Instalar App
              </button>
            )}

            {activeDashboardUrl ? (
              <button
                onClick={() => router.push(activeDashboardUrl)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950 bg-emerald-300 hover:bg-emerald-200 px-3.5 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer"
              >
                <Store className="w-3.5 h-3.5" /> Mi Panel
              </button>
            ) : (
              <button
                onClick={onOpenAuth}
                className="text-xs font-semibold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl transition-all border border-white/10 backdrop-blur-md cursor-pointer"
              >
                Comerciantes
              </button>
            )}
          </div>
        </div>

        <div className="pt-2">
          <h1 className="text-3xl font-black tracking-tight leading-none">
            Comida Valle Real
          </h1>
          <p className="text-xs text-emerald-100/80 font-medium mt-1.5">
            Pide directamente a tus locales favoritos sin comisiones
          </p>
        </div>
      </div>
    </header>
  );
}