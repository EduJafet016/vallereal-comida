'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BeforeInstallPromptEvent, NavigatorStandalone, TenantWithMenu } from '@/types';
import { Search, Heart, } from 'lucide-react';
import { AuthModal } from '@/app/components/AuthModal';
import { HomeHeader } from '@/components/home/HomeHeader';
import { TenantList } from '@/components/home/TenantList';
import { FloatingToggle } from '@/components/ui/FloatingToggle';
import { ServiceList } from '@/components/home/ServiceList';


export default function RootHomePage() {
  const [tenants, setTenants] = useState<TenantWithMenu[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  
  // Nuevo estado para el Floating Toggle
  const [activeTab, setActiveTab] = useState<'comidas' | 'servicios'>('comidas');

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as NavigatorStandalone).standalone === true
    );
  });

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      alert(
        "Para instalar la app:\n\n• En Android/Chrome: Abre el menú de los 3 puntos y selecciona 'Instalar aplicación' o 'Agregar a la pantalla principal'.\n• En iPhone/Safari: Toca el botón de Compartir y selecciona 'Agregar a inicio'."
      );
    }
  };

  useEffect(() => {
    let cancelled = false;

    async function fetchTenants() {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select(`
            *,
            products(name, description),
            categories(name)
          `)
          .order('name');

        if (cancelled) return;
        if (error) throw error;
        
        setTenants(data || []);
      } catch (err) {
        console.error('Error cargando locales con menús:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void fetchTenants();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const channel = supabase
      .channel('realtime-directory')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tenants',
        },
        (payload) => {
          if (payload.eventType === 'UPDATE') {
            setTenants((prev) =>
              prev.map((t) =>
                t.id === payload.new.id ? { ...t, ...payload.new } : t
              )
            );
          } else if (payload.eventType === 'INSERT') {
            setTenants((prev) => [...prev, payload.new as TenantWithMenu]);
          } else if (payload.eventType === 'DELETE') {
            setTenants((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-50/60 flex flex-col justify-between pb-24 relative">
      <div>
        <HomeHeader
          activeTab={activeTab}
          isInstalled={isInstalled}
          onInstallClick={handleInstallClick}
        />

        {activeTab === 'comidas' ? (
          <>
            {/* BARRA DE BÚSQUEDA STICKY */}
            <div className="sticky top-0 z-40 bg-slate-50/90 backdrop-blur-md py-3 px-4 shadow-xs">
              <div className="max-w-md mx-auto relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 z-10 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Buscar negocio, categoría o platillo..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 placeholder:text-slate-400 rounded-2xl text-xs font-medium shadow-md shadow-black/5 focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all border border-slate-200/80"
                />
              </div>
            </div>

            <TenantList tenants={tenants} loading={loading} searchQuery={search} />
          </>
        ) : (
          <ServiceList />
        )}

        <div className="pt-8 pb-4 text-center space-y-1 max-w-md mx-auto px-4">
          <p className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1">
            Hecho con <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> para Valle Real by EduJafet016
          </p>
          <p className="text-[10px] text-slate-400">
            Apoya el comercio local.
          </p>
        </div>
      </div>

      {/* INYECCIÓN DEL FLOATING TOGGLE */}
      <FloatingToggle activeTab={activeTab} onChange={setActiveTab} />
      
      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}