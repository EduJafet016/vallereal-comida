// components/RootHomePage.tsx
"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { BeforeInstallPromptEvent, NavigatorStandalone, Tenant } from "@/types";
import Link from "next/link";
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
} from "lucide-react";

// Importamos ambos modales de forma independiente
import { AuthModal } from "@/app/components/AuthModal";
import { ServiceAuthModal } from "@/components/home/ServiceAuthModal";
import { ServiceList } from "@/components/home/ServiceList";
import { FloatingToggle } from "./ui/FloatingToggle";

interface TenantWithStatus extends Tenant {
  isOpen: boolean;
  status: string;
  isWithinSchedule: boolean;
}

interface RootHomePageProps {
  initialTenants: TenantWithStatus[];
}

export default function RootHomePage({ initialTenants }: RootHomePageProps) {
  const [tenants, setTenants] = useState<TenantWithStatus[]>(initialTenants);
  const [search, setSearch] = useState("");
  
  // Estados separados para cada modal
  const [isComidaAuthOpen, setIsComidaAuthOpen] = useState(false);
  const [isServiceAuthOpen, setIsServiceAuthOpen] = useState(false);
  
  // Estado para el Toggle ('comidas' | 'servicios')
const [activeTab, setActiveTab] = useState<'comidas' | 'servicios'>(() => {
  if (typeof window !== 'undefined') {
    return (localStorage.getItem('valle_real_active_tab') as 'comidas' | 'servicios') || 'comidas';
  }
  return 'comidas';
});

  // Estados para la instalación PWA
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(() => {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
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

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      alert(
        "Para instalar la app:\n\n• En Android/Chrome: Abre el menú de los 3 puntos y selecciona 'Instalar aplicación' o 'Agregar a la pantalla principal'.\n• En iPhone/Safari: Toca el botón de Compartir y selecciona 'Agregar a inicio'."
      );
    }
  };

  useEffect(() => {
    if (!initialTenants || initialTenants.length === 0) return;

    const channel = supabase
      .channel("realtime-directory")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "tenants",
        },
        (payload) => {
          if (payload.eventType === "UPDATE") {
            const updatedTenant = payload.new as Tenant;
            setTenants((prev) =>
              prev.map((t) =>
                t.id === updatedTenant.id
                  ? { ...t, ...updatedTenant }
                  : t
              )
            );
          } else if (payload.eventType === "DELETE") {
            setTenants((prev) => prev.filter((t) => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [initialTenants]);

  const filteredTenants = tenants
    .filter(
      (t) =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.description?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      if (a.isOpen && !b.isOpen) return -1;
      if (!a.isOpen && b.isOpen) return 1;
      return a.name.localeCompare(b.name);
    });

  // FUNCIÓN CLAVE: Abre el modal correspondiente según la pestaña activa
  const handleOpenAuth = () => {
    if (activeTab === 'servicios') {
      setIsServiceAuthOpen(true);
    } else {
      setIsComidaAuthOpen(true);
    }
  };

  // Detección dinámica de sesión activa en la esquina superior
  const getActiveDashboardUrl = () => {
    if (typeof window === 'undefined') return null;
    if (activeTab === 'servicios') {
      const token = localStorage.getItem('current_service_token') || sessionStorage.getItem('current_service_token');
      return token ? `/services/dashboard/${token}` : null;
    } else {
      const token = localStorage.getItem('current_tenant_token') || sessionStorage.getItem('current_tenant_token');
      return token ? `/dashboard/${token}` : null;
    }
  };

  const activeDashboardUrl = getActiveDashboardUrl();

  return (
    <main className="min-h-screen bg-white flex flex-col justify-between pb-24 relative">
      <div>
        <header className={`pt-8 pb-10 px-4 rounded-b-[2.5rem] shadow-md transition-all duration-500 bg-gradient-to-br text-white ${
          activeTab === 'servicios' 
            ? 'from-blue-900 via-blue-800 to-indigo-800' 
            : 'from-emerald-600 via-emerald-700 to-teal-800'
        }`}>
          <div className="max-w-md mx-auto space-y-4">
            <div className="flex justify-between items-center">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-[11px] font-medium border border-white/10 ${
                activeTab === 'servicios' ? 'text-blue-100' : 'text-emerald-100'
              }`}>
                <MapPin className={`w-3 h-3 ${activeTab === 'servicios' ? 'text-blue-300' : 'text-emerald-300'}`} /> Valle Real
              </span>

              <div className="flex items-center gap-2">
                {!isInstalled && (
                  <button
                    onClick={handleInstallClick}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all shadow-sm cursor-pointer animate-pulse ${
                      activeTab === 'servicios'
                        ? 'text-blue-950 bg-blue-300 hover:bg-blue-200'
                        : 'text-emerald-950 bg-emerald-300 hover:bg-emerald-200'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" /> Instalar App
                  </button>
                )}

                {activeDashboardUrl ? (
                  <a
                    href={activeDashboardUrl}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-sm flex items-center gap-1 ${
                      activeTab === 'servicios'
                        ? 'text-blue-950 bg-blue-300 hover:bg-blue-200'
                        : 'text-emerald-950 bg-emerald-300 hover:bg-emerald-200'
                    }`}
                  >
                    <Store className="w-3.5 h-3.5" /> Mi Panel
                  </a>
                ) : (
                  <button
                    onClick={handleOpenAuth}
                    className={`text-xs font-semibold hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-xl transition-all border border-white/10 cursor-pointer ${
                      activeTab === 'servicios' ? 'text-blue-100' : 'text-emerald-100'
                    }`}
                  >
                    {activeTab === 'servicios' ? 'Profesionales' : 'Comerciantes'}
                  </button>
                )}
              </div>
            </div>

            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight leading-tight transition-all duration-300">
                Valle Real {activeTab === 'comidas' ? 'Comida' : 'Servicios'}
              </h1>
              <p className={`text-xs font-medium mt-1 ${activeTab === 'servicios' ? 'text-blue-100/90' : 'text-emerald-100/90'}`}>
                {activeTab === 'comidas' 
                  ? 'Pide directamente a tus locales favoritos sin comisiones'
                  : 'Encuentra y contacta profesionales de confianza en tu comunidad'
                }
              </p>
            </div>

            {activeTab === 'comidas' && (
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
            )}
          </div>
        </header>

        {activeTab === 'comidas' ? (
          <section className="max-w-md mx-auto px-4 mt-6 space-y-4 animate-in fade-in duration-300">
            <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs space-y-0.5">
                <p className="font-bold text-emerald-950">Pedidos Directos</p>
                <p className="text-emerald-800/80 leading-relaxed">
                  Tratas directamente con los vecinos de Valle Real. Tu pedido
                  llega a su WhatsApp sin recargos.
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center px-1 pt-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" />{" "}
                Locales Disponibles
              </h2>
              <span className="text-[11px] font-semibold text-gray-400">
                {filteredTenants.length} registrados
              </span>
            </div>

            {filteredTenants.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center space-y-2">
                <p className="text-sm font-semibold text-gray-700">
                  No se encontraron locales
                </p>
                <p className="text-xs text-gray-400">
                  Intenta buscar con otra palabra clave.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredTenants.map((tenant) => {
                  const isOpen = tenant.isOpen;
                  const isExtraHours = isOpen && !tenant.isWithinSchedule;

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
                              ? "bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white"
                              : "bg-red-50 text-red-500 group-hover:bg-red-100"
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
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-red-100 text-red-700"
                              }`}
                            >
                              {isOpen && (
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              )}
                              {tenant.status}
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
                              {tenant.opening_time.slice(0, 5)} -{" "}
                              {tenant.closing_time.slice(0, 5)} hrs
                            </span>

                            {isExtraHours && (
                              <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 font-bold ml-1 bg-blue-50 px-1.5 py-0.5 rounded-md">
                                <Sparkles className="w-2.5 h-2.5" /> Fuera de
                                horario
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
          </section>
        ) : (
          <section className="mt-4 animate-in fade-in duration-300">
            <ServiceList />
          </section>
        )}

        <div className="pt-8 pb-4 text-center space-y-1">
          <p className="text-xs font-semibold text-gray-400 flex items-center justify-center gap-1">
            Hecho con <Heart className="w-3 h-3 text-red-500 fill-red-500" />{" "}
            para Valle Real by EduJafet016
          </p>
          <p className="text-[10px] text-gray-400">
            Apoya el comercio local.
          </p>
        </div>
      </div>

      <FloatingToggle activeTab={activeTab} onChange={setActiveTab} />
      
      {/* Montamos ambos modales de forma independiente para que se abran según corresponda */}
      <AuthModal isOpen={isComidaAuthOpen} onClose={() => setIsComidaAuthOpen(false)} />
      <ServiceAuthModal isOpen={isServiceAuthOpen} onClose={() => setIsServiceAuthOpen(false)} />
    </main>
  );
}