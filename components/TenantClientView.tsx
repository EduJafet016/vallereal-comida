'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Tenant, Category, Product } from '@/types';
import { useCartState, useCartDispatch } from '@/context/CartContext';
import CartModal from '@/components/CartModal';
import VariantModal from '@/components/VariantModal';
import { TenantHeader } from '@/components/tenant/TenantHeader';
import { ProductSection } from '@/components/tenant/ProductSection';
import { isStoreOpen } from '@/lib/utils';
import {
  ShoppingBag,
  ArrowLeft,
  Sparkles,
  PowerOff,
} from 'lucide-react';

interface Props {
  initialTenant: Tenant;
  categories: Category[];
  products: Product[];
}

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

      <div className="max-w-md mx-auto px-4 -mt-10 relative z-20 space-y-3">
        <TenantHeader tenant={tenant} isOpen={isOpen} />

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
      </div>

      <ProductSection
        categories={categories}
        products={products}
        activeCategory={activeCategory}
        isOpen={isOpen}
        categoryRefs={categoryRefs}
        onCategoryClick={scrollToCategory}
        onAddProduct={handleAddClick}
      />

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