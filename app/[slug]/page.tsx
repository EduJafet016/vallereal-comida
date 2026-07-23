export const revalidate = 60;
import { supabase } from '@/lib/supabase';
import { Tenant, Category, Product } from '@/types';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import TenantClientView from '@/components/TenantClientView';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function TenantPage({ params }: PageProps) {
  const { slug } = await params;

  // 1. Fetch directo en el servidor de Vercel
  const { data: tenantData } = await supabase
    .from('tenants')
    .select('id, name, slug, description, whatsapp_number, opening_time, closing_time, is_active')
    .eq('slug', slug)
    .single();

  if (!tenantData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center bg-gray-50">
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

  // 2. Fetch en paralelo de Categorías y Productos desde el Servidor
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

  return (
    <TenantClientView
      initialTenant={tenantData as Tenant}
      categories={(catRes.data as Category[]) || []}
      products={(prodRes.data as Product[]) || []}
    />
  );
}