'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { BeforeInstallPromptEvent, NavigatorStandalone, Tenant, Product, Category } from '@/types';
import Link from 'next/link';
import {
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

type TenantWithMenu = Tenant & {
  products?: Pick<Product, 'name' | 'description'>[];
  categories?: Pick<Category, 'name'>[];
  logo_url?: string | null;
};

export default function RootHomePage() {
  const [tenants, setTenants] = useState<TenantWithMenu[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

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

  const filteredTenants = tenants
    .filter((t) => {
      const query = search.toLowerCase().trim();
      if (!query) return true;

      const matchTenant = 
        t.name.toLowerCase().includes(query) || 
        (t.description && t.description.toLowerCase().includes(query));

      const matchCategory = t.categories?.some(cat => 
        cat.name.toLowerCase().includes(query)
      );

      const matchProduct = t.products?.some(prod => 
        prod.name.toLowerCase().includes(query) ||
        (prod.description && prod.description.toLowerCase().includes(query))
      );

      return matchTenant || matchCategory || matchProduct;
    })
    .sort((a, b) => {
      const aOpen = a.is_active ?? false;
      const bOpen = b.is_active ?? false;

      if (aOpen && !bOpen) return -1;
      if (!aOpen && bOpen) return 1;

      return a.name.localeCompare(b.name);
    });

  return (
    <main className="min-h-screen bg-slate-50/60 flex flex-col justify-between pb-8">
      <div>
        {/* Header Superior */}
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
                    onClick={handleInstallClick}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-950 bg-emerald-300 hover:bg-emerald-200 px-3.5 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer animate-pulse"
                  >
                    <Download className="w-3.5 h-3.5" /> Instalar App
                  </button>
                )}

                <button
                  onClick={() => setIsAuthOpen(true)}
                  className="text-xs font-semibold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl transition-all border border-white/10 backdrop-blur-md cursor-pointer"
                >
                  Comerciantes
                </button>
              </div>
            </div>

            <div className="pt-2">
              <h1 className="text-3xl font-black tracking-tight leading-none">
                Valle Real Comida
              </h1>
              <p className="text-xs text-emerald-100/80 font-medium mt-1.5">
                Pide directamente a tus locales favoritos sin comisiones
              </p>
            </div>
          </div>
        </header>

        {/* BARRA DE BÚSQUEDA STICKY (Se queda fija arriba al hacer scroll) */}
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

        <section className="max-w-md mx-auto px-4 mt-4 space-y-5">
          <div className="bg-emerald-50/80 border border-emerald-100/80 p-4 rounded-2xl flex items-start gap-3.5 shadow-xs">
            <div className="p-2 bg-emerald-600 text-white rounded-xl shadow-xs shrink-0 mt-0.5">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="text-xs space-y-0.5">
              <p className="font-bold text-emerald-950">Pedidos Directos</p>
              <p className="text-emerald-800/80 leading-relaxed">
                Tratas directamente con los vecinos de Valle Real. Tu pedido llega a su WhatsApp sin recargos.
              </p>
            </div>
          </div>

          <div className="flex justify-between items-center px-1 pt-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" /> Locales Disponibles
            </h2>
            <span className="text-[11px] font-semibold text-slate-400 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
              {filteredTenants.length} {filteredTenants.length === 1 ? 'encontrado' : 'encontrados'}
            </span>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-white rounded-2xl border border-slate-100 animate-pulse shadow-xs" />
              ))}
            </div>
          ) : filteredTenants.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-2 shadow-xs">
              <p className="text-sm font-semibold text-slate-700">No se encontraron resultados</p>
              <p className="text-xs text-slate-400">Intenta buscar con otra palabra clave de platillo, categoría o local.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredTenants.map((tenant) => {
                const isWithinSchedule = isStoreOpen(tenant.opening_time, tenant.closing_time);
                
                const isOpen = tenant.is_active ?? false;
                const isExtraHours = isOpen && !isWithinSchedule;

                const initial = tenant.name ? tenant.name.charAt(0).toUpperCase() : 'V';

                return (
                  <Link
                    key={tenant.id}
                    href={`/${tenant.slug}`}
                    prefetch={false}
                    className={`group block bg-white border p-4 sm:p-4.5 rounded-2xl shadow-xs hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all relative overflow-hidden ${
                      isOpen ? 'border-slate-100 hover:border-emerald-200' : 'border-slate-100 opacity-75'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center font-black text-base transition-all shadow-xs ${
                          isOpen
                            ? 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-sm'
                            : 'bg-slate-100 text-slate-400'
                        }`}
                      >
                        {tenant.logo_url ? (
                          <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover rounded-2xl" />
                        ) : (
                          initial
                        )}
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className={`font-bold text-sm truncate transition-colors ${
                            isOpen ? 'text-slate-900 group-hover:text-emerald-700' : 'text-slate-500'
                          }`}>
                            {tenant.name}
                          </h3>

                          <span
                            className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full shrink-0 flex items-center gap-1.5 shadow-2xs ${
                              isOpen
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/60'
                                : 'bg-rose-50 text-rose-600 border border-rose-100/60'
                            }`}
                          >
                            {isOpen && (
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                            {isOpen ? 'Abierto' : 'Cerrado'}
                          </span>
                        </div>

                        {tenant.description && (
                          <p className="text-xs text-slate-500 font-normal truncate">
                            {tenant.description}
                          </p>
                        )}

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 pt-0.5">
                          <span className="inline-flex items-center gap-1 font-medium">
                            <Clock className={`w-3 h-3 shrink-0 ${isOpen ? 'text-emerald-600' : 'text-slate-400'}`} />
                            {tenant.opening_time.slice(0, 5)} - {tenant.closing_time.slice(0, 5)} hrs
                          </span>

                          {isExtraHours && (
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-indigo-600 font-bold bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100/50">
                              <Sparkles className="w-2.5 h-2.5" /> Fuera de horario
                            </span>
                          )}
                        </div>
                      </div>

                      <div className={`w-7 h-7 rounded-full flex items-center justify-center transition-all shrink-0 ${
                        isOpen ? 'bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:translate-x-0.5' : 'text-slate-200'
                      }`}>
                        <ChevronRight className="w-4 h-4" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="pt-8 pb-4 text-center space-y-1">
            <p className="text-xs font-semibold text-slate-400 flex items-center justify-center gap-1">
              Hecho con <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> para Valle Real by EduJafet016
            </p>
            <p className="text-[10px] text-slate-400">
              Apoya el comercio local.
            </p>
          </div>
        </section>
      </div>

      <AuthModal isOpen={isAuthOpen} onClose={() => setIsAuthOpen(false)} />
    </main>
  );
}