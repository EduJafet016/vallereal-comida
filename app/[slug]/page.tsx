// app/[slug]/page.tsx
import { createClient } from '@/lib/supabase/server'; 
import { notFound } from 'next/navigation';
import TenantClientView from '@/components/TenantClientView';
import { Product, ModifierGroup } from '@/types';

// 1. En Next.js 15+, params es una PROMESA, debes tiparla y esperarla
type Props = {
  params: Promise<{ slug: string }>;
};

// Tipo seguro para la respuesta cruda de Supabase con la tabla puente
interface RawProductResponse extends Omit<Product, 'modifier_groups'> {
  product_modifier_groups?: {
    modifier_groups: ModifierGroup | null;
  }[];
}

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
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase
      .from('products')
      .select(`
        *,
        product_variants(*),
        product_modifier_groups (
          modifier_groups (
            id,
            tenant_id,
            name,
            is_required,
            min_selections,
            max_selections,
            created_at,
            modifiers (
              id,
              group_id,
              name,
              price_delta,
              is_available,
              global_ingredient_id,
              category_id,
              modifier_categories ( name )
            )
          )
        )
      `)
      .eq('tenant_id', tenant.id)
      .order('is_featured', { ascending: false }) // Prioridad 1: Destacados
      .order('sort_order', { ascending: true })   // Prioridad 2: Índice de Drag and Drop
      .order('name', { ascending: true })         // Prioridad 3: Fallback alfabético determinista
  ]);

  // 3. Auditoría de servidor
  if (catRes.error) console.error("Error de Categorías (¿RLS?):", catRes.error);
  if (prodRes.error) console.error("Error de Productos y Modificadores (¿RLS?):", prodRes.error);
  console.log(`Menú cargado para ${tenant.name} -> Categorías: ${catRes.data?.length || 0} | Productos: ${prodRes.data?.length || 0}`);

  // 4. Mapeo estructural tipado estrictamente (sin usar "any")
  const rawProducts = (prodRes.data || []) as unknown as RawProductResponse[];
  
  const formattedProducts: Product[] = rawProducts.map((prod) => {
    const extractedGroups: ModifierGroup[] = (prod.product_modifier_groups || [])
      .map((pmg) => pmg.modifier_groups)
      .filter((mg): mg is ModifierGroup => mg !== null);
      
    // Excluimos product_modifier_groups del objeto final y reasignamos modifier_groups plano
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { product_modifier_groups, ...cleanProduct } = prod;
      
    return {
      ...cleanProduct,
      modifier_groups: extractedGroups,
    };
  });

  return (
    <TenantClientView 
      initialTenant={tenant} 
      categories={catRes.data || []} 
      products={formattedProducts} 
    />
  );
}