'use client';

import { use, useEffect, useState, useCallback } from 'react';
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
  RefreshCw,
  ArrowLeft,
  Phone,
  PowerOff,
  Sparkles,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function TenantPage({ params }: PageProps) {
  const { slug } = use(params);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modales
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] =
    useState<Product | null>(null);

  const { addToCart, items, subtotal } = useCart();

  // Carga de Datos Optimizada en Paralelo
  const loadData = useCallback(
    async (isSilent = false) => {
      if (!slug) return;

      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        // 1. Obtener datos del Tenant por slug
        const { data: tenantData, error: tenantErr } = await supabase
          .from('tenants')
          .select('id, name, slug, description, whatsapp_number, opening_time, closing_time, is_active')
          .eq('slug', slug)
          .single();

        if (tenantErr || !tenantData) throw new Error('Local no encontrado');
        setTenant(tenantData as Tenant);

        // 2. Cargar Categorías y Productos SIMULTÁNEAMENTE (Promise.all)
        const [catRes, prodRes] = await Promise.all([
          supabase
            .from('categories')
            .select('id, tenant_id, name, sort_order')
            .eq('tenant_id', tenantData.id)
            .order('sort_order'),
          supabase
            .from('products')
            .select('id, tenant_id, category_id, name, description, price, is_available, product_variants(id, product_id, name, price_override)')
            .eq('tenant_id', tenantData.id),
        ]);

        if (catRes.error) throw catRes.error;
        if (prodRes.error) throw prodRes.error;

        setCategories(catRes.data || []);
        setProducts(prodRes.data || []);
        setError(null);
      } catch (err: any) {
        console.error('Error al cargar menú:', err);
        setError('El local solicitado no existe.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    loadData(false);
  }, [loadData]);

  // Realtime Subscription
  useEffect(() => {
    if (!tenant?.id) return;

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
          setTenant((prev) => (prev ? { ...prev, ...payload.new } : null));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tenant?.id]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadData(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loadData]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-gray-500 font-medium text-sm">
        Cargando local...
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Local no encontrado 😕</h2>
        <p className="text-sm text-gray-500 mb-4">
          No existe ningún negocio registrado con el slug{' '}
          <code className="bg-gray-100 px-1 py-0.5 rounded text-red-500">/{slug}</code>.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white font-medium text-sm rounded-xl hover:bg-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Ver directorio de locales
        </Link>
      </div>
    );
  }

  // REGLA DE NEGOCIO HÍBRIDA
  const isWithinSchedule = isStoreOpen(tenant.opening_time, tenant.closing_time);
  const isManualActive = tenant.is_active ?? false;

  const isOpen = isManualActive;
  const isExtraordinaryService = isOpen && !isWithinSchedule;

  const totalCartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <main className="p-4 max-w-md mx-auto min-h-screen bg-gray-50 pb-24">
      {/* Botón superior para Volver al Directorio */}
      <div className="mb-3 flex justify-between items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-600 bg-white border border-gray-200 px-3 py-1.5 rounded-full transition-all shadow-sm"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Ver más locales
        </Link>

        <button
          onClick={() => loadData(true)}
          title="Actualizar menú"
          className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-white border border-transparent hover:border-gray-200 rounded-full transition-all"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-emerald-600' : ''}`} />
        </button>
      </div>

      {/* Header del Local */}
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

      {/* Menú por categorías */}
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

      {/* Barra Flotante de Carrito */}
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

      {/* Modales */}
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