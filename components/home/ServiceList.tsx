'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Wrench, Zap, Stethoscope, Droplet, Hammer, 
  Scissors, ShieldAlert, Sparkles, Paintbrush, 
  Car, Key, Laptop, Truck, MessageCircle, Search, Layers,
  Bug, Shirt, BookOpen, ShoppingBag, Dog, Home
} from 'lucide-react';

interface ServiceProvider {
  id: string;
  name: string;
  profession: string;
  description: string;
  phone: string;
  icon: string;
}

const CATEGORIES = [
  { label: 'Todos', emoji: '✨', iconKey: 'all', keywords: [] },
  { label: 'Plomería', emoji: '🚰', iconKey: 'plumbing', keywords: ['plomero', 'plomeria', 'fuga', 'tuberia', 'agua', 'tinaco', 'bomba'] },
  { label: 'Electricidad', emoji: '⚡', iconKey: 'zap', keywords: ['electricista', 'electricidad', 'luz', 'cableado', 'cortocircuito', 'corriente'] },
  { label: 'Salud', emoji: '🩺', iconKey: 'medical', keywords: ['medico', 'doctor', 'enfermera', 'salud', 'clinica', 'dental', 'dentista'] },
  { label: 'Mascotas', emoji: '🐕', iconKey: 'dog', keywords: ['mascotas', 'perro', 'paseador', 'veterinario', 'canino'] },
  { label: 'Fumigación', emoji: '🐜', iconKey: 'bug', keywords: ['fumigacion', 'plagas', 'insectos', 'cucarachas'] },
  { label: 'Ropa y Costura', emoji: '🧵', iconKey: 'shirt', keywords: ['costura', 'ropa', 'dobladillo', 'sastre', 'arreglo'] },
  { label: 'Carpintería', emoji: '🪵', iconKey: 'hammer', keywords: ['carpintero', 'carpinteria', 'madera', 'muebles', 'albañil', 'albañileria'] },
  { label: 'Cerrajería', emoji: '🔐', iconKey: 'lock', keywords: ['cerrajero', 'cerrajeria', 'chapas', 'llaves', 'candado'] },
  { label: 'Mecánica', emoji: '🔧', iconKey: 'car', keywords: ['mecanico', 'mecanica', 'auto', 'carro', 'taller', 'motor', 'llantas'] },
  { label: 'Limpieza', emoji: '🧹', iconKey: 'clean', keywords: ['limpieza', 'aseo', 'empleada', 'domestica', 'lavado'] },
  { label: 'Pintura', emoji: '🎨', iconKey: 'paint', keywords: ['pintor', 'pintura', 'fachada', 'impermeabilizante'] },
  { label: 'Tecnología', emoji: '💻', iconKey: 'tech', keywords: ['computadoras', 'soporte', 'redes', 'software', 'hardware', 'tecnologia', 'celulares', 'reparacion'] },
  { label: 'Estética', emoji: '✂️', iconKey: 'scissors', keywords: ['estetica', 'cabello', 'corte', 'barberia', 'belleza', 'uñas', 'maquillaje'] },
  { label: 'Ventas por Catálogo', emoji: '🛍️', iconKey: 'shopping', keywords: ['catalogo', 'natura', 'avon', 'vianey', 'ventas', 'blancos', 'edredones'] },
  { label: 'Papelería', emoji: '📚', iconKey: 'book', keywords: ['papeleria', 'impresiones', 'copias', 'escaneo', 'cuadernos'] },
  { label: 'Fletes', emoji: '🚚', iconKey: 'delivery', keywords: ['fletes', 'mudanzas', 'transporte', 'carga'] },
  { label: 'Seguridad', emoji: '🛡️', iconKey: 'security', keywords: ['seguridad', 'alarmas', 'camaras', 'vigilancia', 'cctv'] },
  { label: 'Mant. General', emoji: '🏠', iconKey: 'home', keywords: ['mantenimiento', 'general', 'hogar', 'reparaciones'] },
  { label: 'Otros', emoji: '🛠️', iconKey: 'wrench', keywords: ['soldador', 'soldadura'] }
];

const ICON_MAP: Record<string, React.ElementType> = {
  plumbing: Droplet, zap: Zap, medical: Stethoscope, hammer: Hammer,
  lock: Key, car: Car, clean: Sparkles, paint: Paintbrush,
  tech: Laptop, scissors: Scissors, delivery: Truck,
  security: ShieldAlert, wrench: Wrench,
  bug: Bug, shirt: Shirt, book: BookOpen, shopping: ShoppingBag, dog: Dog, home: Home
};

const COLOR_MAP: Record<string, { bg: string, text: string, border: string }> = {
  plumbing: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
  zap: { bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-100' },
  medical: { bg: 'bg-rose-50', text: 'text-rose-600', border: 'border-rose-100' },
  hammer: { bg: 'bg-orange-50', text: 'text-orange-600', border: 'border-orange-100' },
  lock: { bg: 'bg-slate-100', text: 'text-slate-600', border: 'border-slate-200' },
  car: { bg: 'bg-zinc-100', text: 'text-zinc-600', border: 'border-zinc-200' },
  clean: { bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-100' },
  paint: { bg: 'bg-pink-50', text: 'text-pink-600', border: 'border-pink-100' },
  tech: { bg: 'bg-indigo-50', text: 'text-indigo-600', border: 'border-indigo-100' },
  scissors: { bg: 'bg-fuchsia-50', text: 'text-fuchsia-600', border: 'border-fuchsia-100' },
  delivery: { bg: 'bg-emerald-50', text: 'text-emerald-600', border: 'border-emerald-100' },
  security: { bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
  wrench: { bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200' },
  default: { bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' }
};

// Función para normalizar texto (quitar acentos y pasar a minúsculas)
const normalizeText = (text: string) => {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

export function ServiceList() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  useEffect(() => {
    async function fetchProviders() {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) setProviders(data);
      setLoading(false);
    }
    fetchProviders();
  }, []);

  const selectedCatObj = CATEGORIES.find(c => c.label === selectedCategory) || CATEGORIES[0];
  
  const filteredProviders = providers.filter((item) => {
    // Búsqueda por texto (Search bar)
    const matchesSearch = 
      normalizeText(item.name).includes(normalizeText(searchQuery)) ||
      normalizeText(item.profession).includes(normalizeText(searchQuery)) ||
      normalizeText(item.description).includes(normalizeText(searchQuery));

    if (selectedCatObj.iconKey === 'all') return matchesSearch;

    // 1. Coincidencia directa por el ícono asignado (Prioridad Alta)
    const matchesCategoryIcon = item.icon === selectedCatObj.iconKey;
    
    // 2. Coincidencia por palabra clave usando Expresiones Regulares (Límites de palabra \b)
    const professionText = normalizeText(`${item.profession} ${item.description}`);
    const matchesKeyword = selectedCatObj.keywords.some(keyword => {
      const cleanKeyword = normalizeText(keyword);
      // Evita falsos positivos. Ej: buscar 'carga' ya no hará match con 'cargadores'
      const regex = new RegExp(`\\b${cleanKeyword}\\b`, 'i');
      return regex.test(professionText);
    });

    return matchesSearch && (matchesCategoryIcon || matchesKeyword);
  });

  return (
    <div className="max-w-md mx-auto px-4 pt-6 space-y-5 animate-in fade-in duration-500 relative">
      
      {/* Buscador Elevado */}
      <div className="relative group">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 group-focus-within:text-blue-600 transition-colors" />
        <input
          type="text"
          placeholder="¿Qué servicio buscas hoy?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-xs font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-md transition-all outline-none"
        />
      </div>

      {/* Categorías con Scroll Oculto forzado por CSS Inyectado */}
      <div className="relative">
        <style>{`
          .hide-scroll-x::-webkit-scrollbar { display: none; }
          .hide-scroll-x { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
        <div className="flex items-center gap-2 overflow-x-auto py-2 mask-fade-x hide-scroll-x">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[11px] font-bold whitespace-nowrap transition-all active:scale-95 shrink-0 ${
                  isSelected 
                    ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Profesionales */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-10 text-xs text-slate-400 animate-pulse">Cargando directorio...</div>
        ) : filteredProviders.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-100 text-center space-y-2 shadow-sm">
            <Layers className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">Sin resultados en esta categoría</p>
          </div>
        ) : (
          filteredProviders.map((provider) => {
            const IconComponent = ICON_MAP[provider.icon] || Wrench;
            const theme = COLOR_MAP[provider.icon] || COLOR_MAP['default'];

            return (
              <div key={provider.id} className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-slate-200 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-2xl ${theme.bg} ${theme.text} border ${theme.border} flex items-center justify-center shrink-0`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-black text-slate-900 truncate">{provider.name}</h3>
                    <span className={`text-[10px] font-bold ${theme.text} ${theme.bg} px-2 py-0.5 rounded-full inline-block mt-0.5 truncate max-w-full`}>
                      {provider.profession}
                    </span>
                  </div>
                </div>
                
                <p className="text-[11px] text-slate-500 leading-relaxed mb-4 font-medium line-clamp-3">
                  {provider.description}
                </p>
                
                <a
                  href={`https://wa.me/${provider.phone}?text=${encodeURIComponent(`Hola ${provider.name}, vi tu servicio en Valle Real.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3.5 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg shadow-emerald-500/20"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  Contactar por WhatsApp
                </a>
              </div>
            );
          })
        )}
      </div>
      
      {/* Spacer para forzar el DOM y evitar colisión con el menú flotante */}
      <div className="h-32 w-full shrink-0 pointer-events-none opacity-0"></div>
    </div>
  );
}