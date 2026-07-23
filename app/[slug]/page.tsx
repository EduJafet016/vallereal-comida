'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Tenant, Product, Category } from '@/types';
import { 
  ArrowLeft, 
  Store, 
  Clock, 
  MapPin, 
  Phone, 
  Plus, 
  Check, 
  ShoppingBag, 
  Sparkles 
} from 'lucide-react';
import { isStoreOpen } from '@/lib/utils';
import Link from 'next/link';

export default function TenantPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTenantData = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Obtener el local por slug
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (tenantError || !tenantData) {
        router.push('/');
        return;
      }

      setTenant(tenantData);

      // 2. Obtener categorías y productos del local
      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').eq('tenant_id', tenantData.id).order('name'),
        supabase.from('products').select('*').eq('tenant_id', tenantData.id).eq('is_available', true)
      ]);

      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Error cargando datos del local:', err);
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    if (slug) {
      fetchTenantData();
    }
  }, [slug, fetchTenantData]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tenant) return null;

  const isOpen = tenant.is_active ?? false;
  const isWithinSchedule = isStoreOpen(tenant.opening_time, tenant.closing_time);
  const isExtraHours = isOpen && !isWithinSchedule;

  return (
    <main className="min-h-screen bg-gray-50 pb-24">
      {/* Header / Botón Volver */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 sticky top-0 z-20 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-emerald-600 bg-gray-100 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Ver más locales
        </Link>

        <span className="text-xs font-semibold text-gray-400">
          Valle Real
        </span>
      </div>

      {/* Información Principal del Local */}
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-5 space-y-4 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-snug">
                {tenant.name}
              </h1>
              {tenant.description && (
                <p className="text-xs text-gray-500 font-normal leading-relaxed">
                  {tenant.description}
                </p>
              )}
            </div>

            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full shrink-0 flex items-center gap-1.5 shadow-xs ${
                isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
              }`}
            >
              {isOpen && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{tenant.opening_time.slice(0, 5)} - {tenant.closing_time.slice(0, 5)} hrs</span>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Valle Real</span>
            </div>

            {tenant.whatsapp_number && (
              <div className="col-span-2 flex items-center gap-1.5 pt-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{tenant.whatsapp_number}</span>
              </div>
            )}
          </div>

          {isExtraHours && (
            <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl flex items-center gap-2 text-[11px] text-blue-700 font-semibold">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
              <span>El local abrió fuera de su horario habitual.</span>
            </div>
          )}
        </div>

        {/* Listado de Menú por Categorías */}
        <div className="mt-6 space-y-6">
          {categories.length === 0 ? (
            // Si no hay categorías, mostramos todos los productos juntos
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
                Menú Disponible
              </h2>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} isOpen={isOpen} />
              ))}
            </div>
          ) : (
            categories.map((category) => {
              const categoryProducts = products.filter((p) => p.category_id === category.id);
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-4 bg-emerald-600 rounded-full" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      {category.name}
                    </h2>
                  </div>

                  <div className="space-y-2.5">
                    {categoryProducts.map((product) => (
                      <ProductCard key={product.id} product={product} isOpen={isOpen} />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}

// Subcomponente individual de Producto para mantener limpio el código
function ProductCard({ product, isOpen }: { product: Product; isOpen: boolean }) {
  return (
    <div className="bg-white border border-gray-100 hover:border-emerald-200 p-4 rounded-2xl shadow-xs transition-all flex items-center justify-between gap-4 group">
      <div className="space-y-1 min-w-0">
        <h3 className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors truncate">
          {product.name}
        </h3>
        {product.description && (
          <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        )}
        <p className="text-sm font-extrabold text-emerald-600 pt-0.5">
          ${product.price.toFixed(2)}
        </p>
      </div>

      <button
        disabled={!isOpen}
        className={`p-2.5 rounded-xl shrink-0 transition-all ${
          isOpen
            ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white active:scale-95 cursor-pointer shadow-xs'
            : 'bg-gray-100 text-gray-300 cursor-not-allowed'
        }`}
        title={isOpen ? 'Agregar al carrito' : 'Local cerrado'}
      >
        <Plus className="w-4 h-4 stroke-[2.5]" />
      </button>
    </div>
  );
}