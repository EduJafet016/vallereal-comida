import { Metadata } from 'next';
import { supabase } from '@/lib/supabase';
import RootHomePage from './HomeClient';

type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// 1. GENERACIÓN DE METADATA EN EL SERVIDOR ANTES DE CARGAR LA PÁGINA
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const resolvedParams = await searchParams;
  const proveedorId = resolvedParams.proveedor as string | undefined;

  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vallereal-comida.vercel.app';

  // Si no hay proveedor en la URL, devolvemos la Metadata global estática
  if (!proveedorId) {
    return {
      title: 'Valle Real | Directorio Local',
      description: 'Encuentra comida a domicilio y servicios profesionales de confianza en tu comunidad.',
      openGraph: {
        title: 'Valle Real | Directorio Local',
        description: 'Encuentra comida a domicilio y servicios profesionales de confianza en tu comunidad.',
      },
    };
  }

  // Si es un enlace compartido de un servicio, buscamos su info
  const { data: provider } = await supabase
    .from('service_providers')
    .select('name, profession, description')
    .eq('id', proveedorId)
    .single();

  // Fallback de seguridad
  if (!provider) {
    return { title: 'Servicio no encontrado | Valle Real' };
  }

  // Llamamos a tu API dinámica (la misma que usamos para restaurantes)
  // Como los servicios no tienen 'logo_url', la API automáticamente usará la Inicial gigante con el fondo esmeralda
  const ogUrl = new URL(`${appUrl}/api/og`);
  ogUrl.searchParams.set('name', encodeURIComponent(provider.name));

  return {
    title: `${provider.name} | Servicios Valle Real`,
    description: provider.description || `Contacta a ${provider.name} en Valle Real.`,
    openGraph: {
      title: `${provider.name} | Servicios Valle Real`,
      description: provider.description || `Contacta a ${provider.name} en Valle Real.`,
      images: [
        {
          url: ogUrl.toString(),
          width: 1200,
          height: 630,
          alt: provider.name,
        },
      ],
    },
  };
}

// 2. RENDERIZADO DE LA INTERFAZ DE CLIENTE
export default function Page() {
  // Renderizamos el componente que acabas de renombrar
  return <RootHomePage />;
}