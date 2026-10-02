// app/[slug]/page.tsx
import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server'; 
import { notFound } from 'next/navigation';
import TenantClientView from '@/components/TenantClientView';
import { Product, ModifierGroup } from '@/types';

// params es una PROMESA
type Props = {
  params: Promise<{ slug: string }>;
};

// Tipo seguro para la respuesta cruda de Supabase con la tabla puente
interface RawProductResponse extends Omit<Product, 'modifier_groups'> {
  product_modifier_groups?: {
    modifier_groups: ModifierGroup | null;
  }[];
}

// 1. GENERACIÓN DE METADATA DINÁMICA (Open Graph para WhatsApp/Facebook)
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params;
  const { slug } = resolvedParams;
  
  const supabase = await createClient();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('name, description, logo_url')
    .eq('slug', slug)
    .single();

  if (!tenant) {
    return { title: 'Local no encontrado | Valle Real' };
  }

  // URL base de la aplicación (Fallback para el entorno local)
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vallereal-comida.vercel.app';
  
  // Apuntamos a la API dinámica generadora de imágenes que creaste
  const ogUrl = new URL(`${appUrl}/api/og`);
  ogUrl.searchParams.set('name', tenant.name);
  if (tenant.logo_url) {
    ogUrl.searchParams.set('logo', tenant.logo_url);
  }

  return {
    title: `${tenant.name} | Menú en Valle Real`,
    description: tenant.description || `Pide a domicilio en ${tenant.name} a través de Valle Real sin comisiones.`,
    openGraph: {
      title: `${tenant.name} | Menú en Valle Real`,
      description: tenant.description || `Revisa el menú de ${tenant.name} y pide a domicilio aquí.`,
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: `Menú de ${tenant.name}`,
        },
      ],
    },
  };
}

// 2. COMPONENTE PRINCIPAL DE LA PÁGINA
export default async function TenantPage({ params }: Props) {
  // Await obligatorio de params
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

  // Auditoría de servidor
  if (catRes.error) console.error("Error de Categorías (¿RLS?):", catRes.error);
  if (prodRes.error) console.error("Error de Productos y Modificadores (¿RLS?):", prodRes.error);
  console.log(`Menú cargado para ${tenant.name} -> Categorías: ${catRes.data?.length || 0} | Productos: ${prodRes.data?.length || 0}`);

  // Mapeo estructural tipado estrictamente (sin usar "any")
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