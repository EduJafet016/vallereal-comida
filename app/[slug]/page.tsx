// app/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'; 
import { notFound } from 'next/navigation';
import TenantClientView from '@/components/TenantClientView';

// 1. En Next.js 15+, params es una PROMESA, debes tiparla y esperarla
type Props = {
  params: Promise<{ slug: string }>;
};

export default async function TenantPage({ params }: Props) {
  // 2. Await obligatorio de params en las nuevas versiones de Next
  const resolvedParams = await params;
  const { slug } = resolvedParams;

  const supabase = await createClient(); 

  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (tenantError || !tenant) {
    console.error("Error cargando Tenant:", tenantError);
    notFound(); 
  }

  const [catRes, prodRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('name'),
    supabase
      .from('products')
      .select(`
        *,
        product_variants(*),
        modifier_groups (
          id,
          product_id,
          tenant_id,
          name,
          is_required,
          min_selections,
          max_selections,
          modifiers (
            id,
            group_id,
            name,
            price_delta,
            is_available
          )
        )
      `)
      .eq('tenant_id', tenant.id)
  ]);

  // 3. Auditoría de servidor: Esto se imprimirá en tu TERMINAL (donde corre npm run dev), no en el navegador
  if (catRes.error) console.error("Error de Categorías (¿RLS?):", catRes.error);
  if (prodRes.error) console.error("Error de Productos y Modificadores (¿RLS?):", prodRes.error);
  console.log(`Menú cargado para ${tenant.name} -> Categorías: ${catRes.data?.length || 0} | Productos: ${prodRes.data?.length || 0}`);

  return (
    <TenantClientView 
      initialTenant={tenant} 
      categories={catRes.data || []} 
      products={prodRes.data || []} 
    />
  );
}