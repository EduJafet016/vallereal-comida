'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Download, Store } from 'lucide-react';
import { AuthModal } from '@/app/components/AuthModal';
import { ServiceAuthModal } from '@/components/home/ServiceAuthModal';

interface HomeHeaderProps {
  activeTab: 'comidas' | 'servicios';
  isInstalled: boolean;
  onInstallClick: () => void;
}

export function HomeHeader({ activeTab, isInstalled, onInstallClick }: HomeHeaderProps) {
  const router = useRouter();
  const isServicios = activeTab === 'servicios';

  const [isComidaAuthOpen, setIsComidaAuthOpen] = useState(false);
  const [isServiceAuthOpen, setIsServiceAuthOpen] = useState(false);

  // Se recalcula automáticamente cada vez que cambia 'isServicios' o la pestaña
  const activeDashboardUrl = useMemo(() => {
    if (typeof window === 'undefined') return null;
    if (isServicios) {
      const currentServiceToken = localStorage.getItem('current_service_token') || sessionStorage.getItem('current_service_token');
      return currentServiceToken ? `/services/dashboard/${currentServiceToken}` : null;
    } else {
      const currentTenantToken = localStorage.getItem('current_tenant_token') || sessionStorage.getItem('current_tenant_token');
      return currentTenantToken ? `/dashboard/${currentTenantToken}` : null;
    }
  }, [isServicios]);

  const handleOpenAuthModal = () => {
    if (isServicios) {
      setIsServiceAuthOpen(true);
    } else {
      setIsComidaAuthOpen(true);
    }
  };

  return (
    <header 
      className={`pt-6 pb-8 px-4 rounded-b-[2.5rem] shadow-xl relative overflow-hidden transition-all duration-500 bg-gradient-to-b text-white ${
        isServicios 
          ? 'from-blue-900 via-blue-800 to-indigo-800' 
          : 'from-emerald-800 via-emerald-700 to-teal-700'
      }`}
    >
      <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${
        isServicios ? 'bg-blue-500/30' : 'bg-emerald-600/30'
      }`} />
      <div className={`absolute -left-10 -bottom-10 w-40 h-40 rounded-full blur-2xl pointer-events-none transition-colors duration-500 ${
        isServicios ? 'bg-indigo-500/30' : 'bg-teal-600/20'
      }`} />

      <div className="max-w-md mx-auto space-y-4 relative z-10">
        <div className="flex justify-between items-center">
          <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 bg-black/10 backdrop-blur-md rounded-full text-xs font-semibold border border-white/10 shadow-xs transition-colors duration-500 ${
            isServicios ? 'text-blue-100' : 'text-emerald-100'
          }`}>
            <MapPin className={`w-3.5 h-3.5 transition-colors duration-500 ${
              isServicios ? 'text-blue-300' : 'text-emerald-300'
            }`} /> Valle Real
          </span>

          <div className="flex items-center gap-2">
            {!isInstalled && (
              <button
                onClick={onInstallClick}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer animate-pulse ${
                  isServicios 
                    ? 'text-blue-950 bg-blue-300 hover:bg-blue-200' 
                    : 'text-emerald-950 bg-emerald-300 hover:bg-emerald-200'
                }`}
              >
                <Download className="w-3.5 h-3.5" /> Instalar App
              </button>
            )}

            {activeDashboardUrl ? (
              <button
                onClick={() => router.push(activeDashboardUrl)}
                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer ${
                  isServicios 
                    ? 'text-blue-950 bg-blue-300 hover:bg-blue-200' 
                    : 'text-emerald-950 bg-emerald-300 hover:bg-emerald-200'
                }`}
              >
                <Store className="w-3.5 h-3.5" /> Mi Panel
              </button>
            ) : (
              <button
                onClick={handleOpenAuthModal}
                className={`text-xs font-semibold hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl transition-all border border-white/10 backdrop-blur-md cursor-pointer ${
                  isServicios ? 'text-blue-100' : 'text-emerald-100'
                }`}
              >
                {isServicios ? 'Profesionales' : 'Comerciantes'}
              </button>
            )}
          </div>
        </div>

        <div className="pt-2 animate-in fade-in duration-500">
          <h1 className="text-3xl font-black tracking-tight leading-none">
            {isServicios ? 'Servicios Valle Real' : 'Comida Valle Real'}
          </h1>
          <p className={`text-xs font-medium mt-1.5 transition-colors duration-500 ${
            isServicios ? 'text-blue-100/90' : 'text-emerald-100/80'
          }`}>
            {isServicios 
              ? 'Encuentra y contacta profesionales de confianza en tu comunidad' 
              : 'Pide directamente a tus locales favoritos sin comisiones'}
          </p>
        </div>
      </div>

      <AuthModal isOpen={isComidaAuthOpen} onClose={() => setIsComidaAuthOpen(false)} />
      <ServiceAuthModal isOpen={isServiceAuthOpen} onClose={() => setIsServiceAuthOpen(false)} />
    </header>
  );
}