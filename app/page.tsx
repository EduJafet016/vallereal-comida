'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BeforeInstallPromptEvent, NavigatorStandalone, Tenant } from '@/types';
import Link from 'next/link';
import {
  Store,
  ChevronRight,
  Search,
  Clock,
  MapPin,
  UtensilsCrossed,
  ShieldCheck,
  Sparkles,
  Download,
  Heart,
} from 'lucide-react';
import { isStoreOpen } from '@/lib/utils';
import { AuthModal } from '@/app/components/AuthModal';

export default function RootHomePage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Estados para la instalación PWA
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
          .select('*')
          .order('name');

        if (cancelled) return;
        if (error) throw error;
        setTenants(data || []);
      } catch (err) {
        console.error('Error cargando locales:', err);
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
            setTenants((prev) => [...prev, payload.new as Tenant]);
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

  const filteredTenants = tenants
    .filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aOpen = a.is_active ?? false;
      const bOpen = b.is_active ?? false;

      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;

      return a.name.localeCompare(b.name);
    });

  return (
    <main className="min-h-screen bg-white flex flex-col justify-between pb-6">
      <div>
        <header className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-800 text-white pt-8 pb-10 px-4 rounded-b-[2.5rem] shadow-md">
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex justify-between items-center">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-medium text-emerald-100 border border-white/10">
                <MapPin className="w-3 h-3 text-emerald-300" /> Valle Real
              </span>

              <div className="flex items-center gap-2">
                {!isInstalled && (
                  <button
                    onClick={handleInstallClick}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-950 bg-emerald-300 hover:bg-emerald-200 px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer animate-pulse"
                  >
                    <Download className="w-3.5 h-3.5" /> Instalar App
                  </button>
                )}

                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="text-xs font-semibold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all border border-white/10 cursor-pointer"
                >
                  Comerciantes
                </button>
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight">
                Valle Real Comida
              </h1>
              <p className="text-xs text-emerald-100/90 font-medium mt-1">
                Pide directamente a tus locales favoritos sin comisiones
              </p>
            </div>

            <div className="relative pt-2">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-5 z-10" />
              <input
                type="text"
                placeholder="Buscar negocio, postre o platillo..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-white text-gray-900 placeholder:text-gray-400 rounded-2xl text-xs font-medium shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 transition-all"
              />
            </div>
          </div>
        </header>

        <section className="max-w-md mx-auto px-4 mt-6 space-y-4">
          {/* Tarjeta de Pedidos Directos arriba */}
          <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-emerald-950">Pedidos Directos</p>
              <p className="text-emerald-800/80 leading-relaxed">
                Tratas directamente con los vecinos de Valle Real. Tu pedido llega a su WhatsApp sin recargos.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center px-1 pt-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" /> Locales Disponibles
            </h2>
            <span className="text-[11px] font-semibold text-gray-400">
              {filteredTenants.length} registrados
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-white rounded-2xl border border-gray-100 animate-pulse" />
              ))}
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-2">
              <p className="text-sm font-semibold text-gray-700">No se encontraron locales</p>
              <p className="text-xs text-gray-400">Intenta buscar con otra palabra clave.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredTenants.map((tenant) => {
                const isWithinSchedule = isStoreOpen(tenant.opening_time, tenant.closing_time);
                const isManualActive = tenant.is_active ?? false;
                const isOpen = isManualActive;
                const isExtraHours = isOpen && !isWithinSchedule;

                return (
                  <Link
                    key={tenant.id}
                    href={`/${tenant.slug}`}
                    prefetch={false}
                    className="group block bg-white border border-gray-100 hover:border-emerald-300 p-4 rounded-2xl shadow-xs hover:shadow-md active:scale-[0.99] transition-all relative overflow-hidden"
                  >
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`p-3 rounded-2xl shrink-0 transition-colors ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white'
                            : 'bg-red-50 text-red-500 group-hover:bg-red-100'
                        }`}
                      >
                        <Store className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-gray-900 text-sm truncate group-hover:text-emerald-700 transition-colors">
                            {tenant.name}
                          </h3>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1 ${
                              isOpen
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {isOpen && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            {isOpen ? 'Abierto' : 'Cerrado'}
                          </span>
                        </div>

                        {tenant.description && (
                          <p className="text-xs text-gray-500 font-normal truncate">
                            {tenant.description}
                          </p>
                        )}

                        <div className="flex items-center gap-1 text-[11px] text-gray-400 pt-0.5">
                          <Clock className="w-3 h-3 text-emerald-600 shrink-0" />
                          <span>
                            {tenant.opening_time.slice(0, 5)} - {tenant.closing_time.slice(0, 5)} hrs
                          </span>

                          {isExtraHours && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-bold ml-1 bg-blue-50 px-1.5 py-0.5 rounded-md">
                              <Sparkles className="w-2.5 h-2.5" /> Fuera de horario
                            </span>
                          )}
                        </div>
                      </div>

                      <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Footer sutil para cerrar la página con estilo */}
          <div className="pt-8 pb-4 text-center space-y-1">
            <p className="text-xs font-semibold text-gray-400 flex items-center justify-center gap-1">
              Hecho con <Heart className="w-3 h-3 text-red-500 fill-red-500" /> para Valle Real by EduJafet016
            </p>
            <p className="text-[10px] text-gray-400">
              Apoya el comercio local.
            </p>
          </div>
        </section>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}