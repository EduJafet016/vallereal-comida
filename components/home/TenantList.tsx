'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { TenantWithMenu, Category } from '@/types';
import { isStoreOpen } from '@/lib/utils';
import { calculateTenantCompleteness } from '@/lib/tenantScoring';
import { Clock, ChevronRight, Sparkles, UtensilsCrossed, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';

interface TenantListProps {
  tenants: TenantWithMenu[];
  loading: boolean;
  searchQuery: string;
}

export function TenantList({ tenants, loading, searchQuery }: TenantListProps) {
  // Estado para la pestaña activa ('active' para listos/con menú, 'pending' para configuración inicial)
  const [activeTab, setActiveTab] = useState<'active' | 'pending'>('active');
  
  // Estado para la categoría seleccionada en los botones con iconos
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Listado de categorías rápidas con iconos
  const categoriesList = [
    { id: 'all', label: 'Todos', icon: '🍽️' },
    { id: 'postres', label: 'Postres', icon: '🍰' },
    { id: 'pizza', label: 'Pizza', icon: '🍕' },
    { id: 'hamburguesas', label: 'Burgers', icon: '🍔' },
    { id: 'tortas', label: 'Tortas', icon: '🌮' },
    { id: 'bebidas', label: 'Bebidas', icon: '🥤' },
  ];

  // 1. Filtrar por búsqueda y calcular completitud + estado de salud
  const processedTenants = useMemo(() => {
    return tenants.map((tenant) => {
      const health = calculateTenantCompleteness(tenant, tenant.products || []);
      return {
        ...tenant,
        health,
      };
    });
  }, [tenants]);

  // 2. Filtrar por texto de búsqueda, pestaña, categoría seleccionada y ordenar inteligentemente
  const filteredTenants = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return processedTenants
      .filter((tenant) => {
        // Filtro por pestañas de estado (Activos / Pendientes)
        if (tenant.health.status !== activeTab) return false;

        // Filtro por categoría rápida de iconos
        if (selectedCategory !== 'all') {
          const matchesCategory = tenant.categories?.some((cat: Pick<Category, 'name'>) => 
            cat.name.toLowerCase().includes(selectedCategory)
          ) || tenant.name.toLowerCase().includes(selectedCategory) ||
             tenant.products?.some(p => p.name.toLowerCase().includes(selectedCategory));
          
          if (!matchesCategory) return false;
        }

        // Si no hay búsqueda por texto, pasa los filtros anteriores
        if (!query) return true;

        const matchTenant = 
          tenant.name.toLowerCase().includes(query) || 
          (tenant.description && tenant.description.toLowerCase().includes(query));

        const matchCategory = tenant.categories?.some((cat: Pick<Category, 'name'>) => 
          cat.name.toLowerCase().includes(query)
        );

        const matchProduct = tenant.products?.some((prod) => 
          prod.name.toLowerCase().includes(query) ||
          (prod.description && prod.description.toLowerCase().includes(query))
        );

        return matchTenant || matchCategory || matchProduct;
      })
      .sort((a, b) => {
        // 1. Priorizar siempre a los abiertos/activos sobre los cerrados
        const aIsOpen = a.is_active ?? false;
        const bIsOpen = b.is_active ?? false;

        if (aIsOpen !== bIsOpen) {
          return aIsOpen ? -1 : 1;
        }

        // 2. Si ambos tienen el mismo estado operativo, ordenar por puntaje de completitud
        if (b.health.score !== a.health.score) {
          return b.health.score - a.health.score;
        }

        // 3. Si empatan en puntaje, ordenar alfabéticamente
        return a.name.localeCompare(b.name);
      });
  }, [processedTenants, searchQuery, activeTab, selectedCategory]);

  // Contadores dinámicos para las pestañas
  const counts = useMemo(() => {
    return {
      active: processedTenants.filter(t => t.health.status === 'active').length,
      pending: processedTenants.filter(t => t.health.status === 'pending').length,
    };
  }, [processedTenants]);

  return (
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

{/* Carrusel de Categorías con desplazamiento optimizado para PC y Móvil */}
      <div className="relative group">
        {/* Degradado indicador en el borde derecho para sugerir que hay más contenido */}
        <div className="absolute right-0 top-0 bottom-2 w-10 bg-gradient-to-l from-slate-50/90 to-transparent pointer-events-none z-10 transition-opacity" />

        <div 
          id="categories-container"
          className="flex gap-2 overflow-x-auto pb-2 scrollbar-none px-1 scroll-smooth"
        >
          {categoriesList.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-xs cursor-pointer shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-emerald-200 ring-2 ring-emerald-600/20'
                  : 'bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50'
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.label}</span>
            </button>
          ))}
        </div>

        {/* Botones de desplazamiento para PC (visibles en pantallas medianas en adelante) */}
        <button 
          onClick={() => {
            const container = document.getElementById('categories-container');
            if (container) container.scrollLeft -= 200;
          }}
          className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full items-center justify-center shadow-md text-slate-600 hover:bg-slate-50 hover:text-emerald-600 z-20 cursor-pointer transition-all opacity-0 group-hover:opacity-100"
          aria-label="Anterior"
        >
          ‹
        </button>

        <button 
          onClick={() => {
            const container = document.getElementById('categories-container');
            if (container) container.scrollLeft += 200;
          }}
          className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 w-8 h-8 bg-white border border-slate-200 rounded-full items-center justify-center shadow-md text-slate-600 hover:bg-slate-50 hover:text-emerald-600 z-20 cursor-pointer transition-all opacity-0 group-hover:opacity-100"
          aria-label="Siguiente"
        >
          ›
        </button>
      </div>

      {/* Cabecera y Pestañas de Estado (Activos / Pendientes) */}
      <div className="flex flex-col gap-3 px-1 pt-1">
        <div className="flex justify-between items-center">
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <UtensilsCrossed className="w-3.5 h-3.5 text-emerald-600" /> Locales Disponibles
          </h2>
          <span className="text-[11px] font-semibold text-slate-400 bg-slate-200/60 px-2.5 py-0.5 rounded-full">
            {filteredTenants.length} {filteredTenants.length === 1 ? 'encontrado' : 'encontrados'}
          </span>
        </div>

        {/* Botones de Pestañas */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'active' 
                ? 'bg-white text-emerald-700 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" /> Activos ({counts.active})
          </button>

          <button
            onClick={() => setActiveTab('pending')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'pending' 
                ? 'bg-white text-amber-700 shadow-2xs' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" /> Pendientes ({counts.pending})
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3.5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-white rounded-3xl border border-slate-100 animate-pulse shadow-xs" />
          ))}
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-100 p-8 text-center space-y-2 shadow-xs">
          <p className="text-sm font-semibold text-slate-700">No se encontraron resultados</p>
          <p className="text-xs text-slate-400">Intenta con otra categoría o palabra clave.</p>
        </div>
      ) : (
        <div className="space-y-4">
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
                className={`group block bg-white border p-5 sm:p-6 rounded-3xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.99] transition-all relative overflow-hidden ${
                  isOpen ? 'border-slate-100 hover:border-emerald-200' : 'border-slate-100 opacity-75'
                }`}
              >
                <div className="flex items-center gap-4.5">
                  {/* Logo más grande para mayor visibilidad */}
                  <div
                    className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl sm:rounded-3xl shrink-0 flex items-center justify-center font-black text-xl transition-all shadow-xs ${
                      isOpen
                        ? 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white group-hover:shadow-sm'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {tenant.logo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={tenant.logo_url} alt={tenant.name} className="w-full h-full object-cover rounded-2xl sm:rounded-3xl" />
                    ) : (
                      initial
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-extrabold text-base sm:text-lg truncate transition-colors ${
                        isOpen ? 'text-slate-900 group-hover:text-emerald-700' : 'text-slate-500'
                      }`}>
                        {tenant.name}
                      </h3>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span
                          className={`text-[11px] font-bold px-3 py-1 rounded-full flex items-center gap-1.5 shadow-2xs ${
                            isOpen
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100/80'
                              : 'bg-rose-50 text-rose-600 border border-rose-100/80'
                          }`}
                        >
                          {isOpen && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                          {isOpen ? 'Abierto' : 'Cerrado'}
                        </span>
                      </div>
                    </div>

                    {tenant.description ? (
                      <p className="text-xs sm:text-sm text-slate-500 font-normal line-clamp-1">
                        {tenant.description}
                      </p>
                    ) : tenant.health.missingItems.length > 0 && activeTab === 'pending' ? (
                      <p className="text-xs text-amber-600 font-medium truncate">
                        Falta: {tenant.health.missingItems.join(', ')}
                      </p>
                    ) : null}

                    <div className="flex items-center gap-2 text-xs text-slate-400 pt-1">
                      <span className="inline-flex items-center gap-1 font-medium">
                        <Clock className={`w-3.5 h-3.5 shrink-0 ${isOpen ? 'text-emerald-600' : 'text-slate-400'}`} />
                        {tenant.opening_time.slice(0, 5)} - {tenant.closing_time.slice(0, 5)} hrs
                      </span>

                      {isExtraHours && (
                        <span className="inline-flex items-center gap-1 text-[10px] text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100/50">
                          <Sparkles className="w-3 h-3" /> Fuera de horario
                        </span>
                      )}
                    </div>
                  </div>

                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0 ${
                    isOpen ? 'bg-slate-50 text-slate-300 group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:translate-x-0.5' : 'text-slate-200'
                  }`}>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}