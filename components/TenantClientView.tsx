'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Tenant, Category, Product } from '@/types';
import { useCartState, useCartDispatch } from '@/context/CartContext';
import CartModal from '@/components/CartModal';
import VariantModal from '@/components/VariantModal';
import { isStoreOpen } from '@/lib/utils';
import {
  ShoppingBag,
  Plus,
  Clock,
  MapPin,
  Layers,
  ArrowLeft,
  PowerOff,
  Sparkles,
  CalendarDays,
} from 'lucide-react';

interface Props {
  initialTenant: Tenant;
  categories: Category[];
  products: Product[];
}

const formatTime12h = (timeStr: string) => {
  if (!timeStr) return '';
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minuteStr} ${ampm}`;
};

const formatWorkingDays = (days: number[] | undefined | null) => {
  if (!days || days.length === 7) return 'Todos los días';
  const daysMap: Record<number, string> = { 1: 'L', 2: 'M', 3: 'M', 4: 'J', 5: 'V', 6: 'S', 0: 'D' };
  const sorted = [...days].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  return sorted.map(d => daysMap[d]).join('-');
};

export default function TenantClientView({
  initialTenant,
  categories,
  products,
}: Props) {
  const [tenant, setTenant] = useState<Tenant>(initialTenant);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(categories[0]?.id || null);

  const [showTenantMismatchModal, setShowTenantMismatchModal] = useState(false);
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);

  const { items, subtotal } = useCartState();
  const dispatch = useCartDispatch();
  const categoryRefs = useRef<Record<string, HTMLElement | null>>({});

  const cartTenantId = items.length > 0 ? items[0].product.tenant_id : null;
  const isCartFromThisTenant = items.length === 0 || !cartTenantId || cartTenantId === tenant.id;

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-tenant-${tenant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tenants',
          filter: `id=eq.${tenant.id}`,
        },
        (payload) => {
          setTenant((prev) => ({ ...prev, ...payload.new }));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant.id]);

  const handleAddClick = (product: Product) => {
    if (items.length > 0 && cartTenantId && cartTenantId !== tenant.id) {
      setPendingProduct(product);
      setShowTenantMismatchModal(true);
      return;
    }

    const hasModifiers = Array.isArray(product.modifier_groups) && product.modifier_groups.length > 0;
    const hasVariants = Array.isArray(product.product_variants) && product.product_variants.length > 0;

    if (hasModifiers || hasVariants) {
      setSelectedProductForVariant(product);
    } else {
      dispatch({ 
        type: 'ADD_ITEM', 
        payload: { 
          product, 
          finalUnitPrice: product.price
        } 
      });
    }
  };

  const scrollToCategory = (categoryId: string) => {
    setActiveCategory(categoryId);
    const element = categoryRefs.current[categoryId];
    if (element) {
      const offset = 90;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const isWithinSchedule = isStoreOpen(tenant.opening_time, tenant.closing_time);
  const isOpen = tenant.is_active ?? false;
  const isExtraordinaryService = isOpen && !isWithinSchedule;
  const totalCartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const initialLetter = tenant.name ? tenant.name.charAt(0).toUpperCase() : 'V';
  
  const tenantLogo = (tenant as Tenant & { logo_url?: string }).logo_url;

  return (
    <main className="min-h-screen bg-slate-50/60 pb-32">
      <div className="bg-gradient-to-b from-emerald-800 via-emerald-700 to-teal-700 text-white pt-6 pb-16 px-4 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-600/30 rounded-full blur-2xl pointer-events-none" />
        
        <div className="max-w-md mx-auto space-y-4 relative z-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-100 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-full transition-all border border-white/10 backdrop-blur-md shadow-xs w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Ver más locales
          </Link>
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 -mt-10 relative z-20">
        <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xl shadow-xs shrink-0 border border-emerald-100 overflow-hidden">
              {tenantLogo ? (
                <img src={tenantLogo} alt={tenant.name} className="w-full h-full object-cover" />
              ) : (
                initialLetter
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1">
              <div className="flex items-center justify-between gap-2">
                <h1 className="text-xl font-black text-slate-900 tracking-tight break-words">{tenant.name}</h1>
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1.5 shadow-2xs ${
                    isOpen
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                      : 'bg-rose-50 text-rose-600 border border-rose-100'
                  }`}
                >
                  {isOpen && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                  {isOpen ? 'Abierto' : 'Cerrado'}
                </span>
              </div>

              {tenant.description && (
                <p className="text-xs text-slate-500 font-normal leading-relaxed">
                  {tenant.description}
                </p>
              )}
            </div>
          </div>

          {isExtraordinaryService && (
            <div className="p-3 bg-indigo-50 border border-indigo-100 text-indigo-900 text-xs rounded-2xl font-medium flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
              <span>Atendiendo en horario especial. ¡Tus pedidos serán recibidos normalmente!</span>
            </div>
          )}

          {!isOpen && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-900 text-xs rounded-2xl font-medium flex items-start gap-2.5">
              <PowerOff className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>
                {!isWithinSchedule
                  ? 'Este local se encuentra fuera de su horario de atención habitual.'
                  : 'El restaurante ha pausado la recepción de pedidos temporalmente.'}
              </span>
            </div>
          )}

          {/* Metadatos corregidos: Horario en su propia línea para que no se corte, Zona y Días abajo */}
          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100/80">
              <span className="text-slate-400 font-medium flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600 shrink-0" /> Horario
              </span>
              <span className="font-bold text-slate-800">
                {formatTime12h(tenant.opening_time)} - {formatTime12h(tenant.closing_time)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100/80">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Zona
                </span>
                <span className="font-bold text-slate-800 truncate">Valle Real</span>
              </div>

              <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100/80">
                <span className="text-slate-400 font-medium flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Días
                </span>
                <span className="font-bold text-slate-800 truncate">{formatWorkingDays(tenant.working_days)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-2xs mt-6 py-2.5">
        <div className="max-w-md mx-auto px-4 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((category) => {
            const hasProducts = products.some((p) => p.category_id === category.id);
            if (!hasProducts) return null;

            const isSelected = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => scrollToCategory(category.id)}
                className={`text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-8">
        {categories.map((category) => {
          const categoryProducts = products.filter((p) => p.category_id === category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <section
              key={category.id}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
              className="scroll-mt-24 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-emerald-600 rounded-full" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  {category.name}
                </h2>
              </div>

              <div className="space-y-3">
                {categoryProducts.map((product) => {
                  const hasModifiers =
                    (Array.isArray(product.modifier_groups) && product.modifier_groups.length > 0) ||
                    (Array.isArray(product.product_variants) && product.product_variants.length > 0);
                  const isAvailable = isOpen && product.is_available;

                  return (
                    <div
                      key={product.id}
                      className={`flex justify-between items-center p-4 bg-white border rounded-2xl shadow-xs transition-all ${
                        isAvailable
                          ? 'border-slate-100 hover:border-emerald-200 hover:shadow-md'
                          : 'border-slate-100 opacity-60 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex-1 pr-3 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`font-bold text-sm tracking-tight ${
                              isAvailable ? 'text-slate-900' : 'text-slate-500 line-through'
                            }`}
                          >
                            {product.name}
                          </h3>

                          {hasModifiers && isAvailable && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                              <Layers className="w-3 h-3" /> Personalizable
                            </span>
                          )}

                          {!product.is_available && (
                            <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">
                              Agotado
                            </span>
                          )}
                        </div>

                        {product.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                            {product.description}
                          </p>
                        )}

                        <span
                          className={`text-sm font-black block pt-0.5 ${
                            isAvailable ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          ${product.price.toFixed(2)}
                        </span>
                      </div>

                      {isAvailable ? (
                        <button
                          onClick={() => handleAddClick(product)}
                          className="w-10 h-10 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer shadow-2xs group"
                          aria-label={`Agregar ${product.name}`}
                        >
                          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-xl shrink-0 select-none">
                          {!isOpen ? 'Cerrado' : 'Agotado'}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {totalCartCount > 0 && isCartFromThisTenant && (
        <div className="fixed bottom-6 left-0 right-0 max-w-md mx-auto px-4 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl p-4 flex justify-between items-center shadow-xl shadow-emerald-600/25 active:scale-[0.98] transition-all font-medium cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-white text-emerald-700 text-xs font-black rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {totalCartCount}
                </span>
              </div>
              <div className="text-left leading-tight">
                <span className="text-[10px] font-bold tracking-wider uppercase block text-emerald-200">Subtotal</span>
                <span className="font-black text-base">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <span className="text-xs font-black tracking-wide underline uppercase bg-emerald-700/50 px-3 py-2 rounded-xl">
              Ver pedido
            </span>
          </button>
        </div>
      )}

      {showTenantMismatchModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h3 className="text-base font-bold text-slate-900 leading-snug">
              ¿Cambiar de restaurante?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tienes productos de otro restaurante en tu carrito. Si continúas, se vaciará el pedido actual para empezar uno nuevo aquí.
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => {
                  setShowTenantMismatchModal(false);
                  setPendingProduct(null);
                }}
                className="w-full py-3 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs hover:bg-slate-200 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  dispatch({ type: 'CLEAR_CART' });
                  if (pendingProduct) {
                    const hasMod = Array.isArray(pendingProduct.modifier_groups) && pendingProduct.modifier_groups.length > 0;
                    const hasVar = Array.isArray(pendingProduct.product_variants) && pendingProduct.product_variants.length > 0;
                    if (hasMod || hasVar) {
                      setSelectedProductForVariant(pendingProduct);
                    } else {
                      dispatch({ 
                        type: 'ADD_ITEM', 
                        payload: { 
                          product: pendingProduct,
                          finalUnitPrice: pendingProduct.price
                        } 
                      });
                    }
                  }
                  setShowTenantMismatchModal(false);
                  setPendingProduct(null);
                }}
                className="w-full py-3 bg-emerald-600 text-white rounded-2xl font-bold text-xs hover:bg-emerald-700 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                Sí, vaciar y pedir
              </button>
            </div>
          </div>
        </div>
      )}

      <VariantModal
        isOpen={selectedProductForVariant !== null}
        onClose={() => setSelectedProductForVariant(null)}
        product={selectedProductForVariant}
      />

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tenant={tenant}
      />
    </main>
  );
}