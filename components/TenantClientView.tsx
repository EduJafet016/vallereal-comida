'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Tenant, Category, Product, ProductVariant } from '@/types';
import { useCart } from '@/context/CartContext';
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
  Phone,
  PowerOff,
  Sparkles,
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
  const [selectedProductForVariant, setSelectedProductForVariant] =
    useState<Product | null>(null);

  const { addToCart, items, subtotal } = useCart();

  // Escuchar únicamente cambios de estado en vivo (Realtime)
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
    if (product.product_variants && product.product_variants.length > 0) {
      setSelectedProductForVariant(product);
    } else {
      addToCart(product);
    }
  };

  const handleConfirmVariant = (
    product: Product,
    variant: ProductVariant,
    notes?: string
  ) => {
    addToCart(product, variant, notes);
  };

  // Regla de Negocio
  const isWithinSchedule = isStoreOpen(tenant.opening_time, tenant.closing_time);
  const isOpen = tenant.is_active ?? false;
  const isExtraordinaryService = isOpen && !isWithinSchedule;

  const totalCartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <main className="p-4 max-w-md mx-auto min-h-screen bg-gray-50 pb-24">
      <div className="mb-3 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Ver más locales
        </Link>
      </div>

      <header className="border-b pb-4 mb-6 bg-white p-4 rounded-2xl border shadow-sm space-y-3">
        <div className="flex justify-between items-start gap-2">
          <h1 className="text-2xl font-black text-gray-900 leading-tight">{tenant.name}</h1>

          <span
            className={`text-[11px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1 ${
              isOpen
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {isOpen && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
            {isOpen ? 'Abierto' : 'Cerrado'}
          </span>
        </div>

        {tenant.description && (
          <p className="text-xs text-gray-600 font-medium leading-relaxed">
            {tenant.description}
          </p>
        )}

        {isExtraordinaryService && (
          <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl font-medium flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              Atendiendo en horario especial. ¡Tus pedidos serán recibidos normalmente!
            </span>
          </div>
        )}

        {!isOpen && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-900 text-xs rounded-xl font-medium flex items-start gap-2">
            <PowerOff className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>
              {!isWithinSchedule
                ? 'Este local se encuentra fuera de su horario de atención.'
                : 'El restaurante ha pausado la recepción de pedidos temporalmente.'}
            </span>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 pt-2 border-t border-gray-100">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-emerald-600" />
            {tenant.opening_time.slice(0, 5)} - {tenant.closing_time.slice(0, 5)} hrs
          </span>

          <span className="flex items-center gap-1 font-medium">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Valle Real
          </span>

          {tenant.whatsapp_number && (
            <span className="flex items-center gap-1 font-medium text-gray-600">
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              {tenant.whatsapp_number}
            </span>
          )}
        </div>
      </header>

      {categories.map((category) => {
        const categoryProducts = products.filter(
          (p) => p.category_id === category.id
        );

        if (categoryProducts.length === 0) return null;

        return (
          <section key={category.id} className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-3 border-l-4 border-emerald-500 pl-2">
              {category.name}
            </h2>

            <div className="space-y-3">
              {categoryProducts.map((product) => {
                const hasVariants =
                  product.product_variants && product.product_variants.length > 0;
                const isAvailable = isOpen && product.is_available;

                return (
                  <div
                    key={product.id}
                    className={`flex justify-between items-center p-3.5 border rounded-2xl shadow-sm transition-colors ${
                      isAvailable
                        ? 'bg-white hover:border-emerald-200'
                        : 'bg-gray-50 border-gray-200 opacity-60'
                    }`}
                  >
                    <div className="flex-1 pr-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3
                          className={`font-semibold text-sm ${
                            isAvailable ? 'text-gray-900' : 'text-gray-500 line-through'
                          }`}
                        >
                          {product.name}
                        </h3>

                        {hasVariants && isAvailable && (
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Layers className="w-3 h-3" /> Opciones
                          </span>
                        )}

                        {!product.is_available && (
                          <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            Agotado
                          </span>
                        )}
                      </div>

                      {product.description && (
                        <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                          {product.description}
                        </p>
                      )}

                      <span
                        className={`text-sm font-bold mt-1 block ${
                          isAvailable ? 'text-emerald-600' : 'text-gray-400'
                        }`}
                      >
                        ${product.price.toFixed(2)}
                      </span>
                    </div>

                    {isAvailable ? (
                      <button
                        onClick={() => handleAddClick(product)}
                        className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-100 active:scale-95 transition-all shrink-0 cursor-pointer"
                        aria-label={`Agregar ${product.name}`}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    ) : (
                      <span className="text-[11px] font-semibold text-gray-400 bg-gray-200 px-2.5 py-1.5 rounded-xl shrink-0 select-none">
                        {!isOpen ? 'No disponible' : 'Agotado'}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      {totalCartCount > 0 && (
        <div className="fixed bottom-4 left-0 right-0 max-w-md mx-auto px-4 z-40">
          <button
            onClick={() => setIsCartOpen(true)}
            className="w-full bg-emerald-600 text-white rounded-2xl p-4 flex justify-between items-center shadow-lg active:scale-[0.98] transition-all hover:bg-emerald-700 font-medium"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <ShoppingBag className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-white text-emerald-700 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow-sm">
                  {totalCartCount}
                </span>
              </div>
              <div className="text-left">
                <span className="text-xs block text-emerald-100">Subtotal</span>
                <span className="font-bold text-base">${subtotal.toFixed(2)}</span>
              </div>
            </div>

            <span className="text-sm font-bold underline">Ver pedido</span>
          </button>
        </div>
      )}

      <VariantModal
        isOpen={!!selectedProductForVariant}
        onClose={() => setSelectedProductForVariant(null)}
        product={selectedProductForVariant}
        onConfirm={handleConfirmVariant}
      />

      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        tenant={tenant}
      />
    </main>
  );
}