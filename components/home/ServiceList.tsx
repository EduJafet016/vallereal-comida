'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Wrench, Zap, Stethoscope, Droplet, Hammer, 
  Scissors, ShieldAlert, Sparkles, Paintbrush, 
  Car, Key, Laptop, Truck, MessageCircle, Search, Layers 
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
  { label: 'Todos', emoji: '✨', iconKey: 'all' },
  { label: 'Plomería', emoji: '🚰', iconKey: 'plumbing' },
  { label: 'Electricidad', emoji: '⚡', iconKey: 'zap' },
  { label: 'Salud', emoji: '🩺', iconKey: 'medical' },
  { label: 'Carpintería', emoji: '🪵', iconKey: 'hammer' },
  { label: 'Cerrajería', emoji: '🔐', iconKey: 'lock' },
  { label: 'Mecánica', emoji: '🔧', iconKey: 'car' },
  { label: 'Limpieza', emoji: '🧹', iconKey: 'clean' },
  { label: 'Pintura', emoji: '🎨', iconKey: 'paint' },
  { label: 'Tecnología', emoji: '💻', iconKey: 'tech' },
  { label: 'Estética', emoji: '✂️', iconKey: 'scissors' },
  { label: 'Fletes', emoji: '🚚', iconKey: 'delivery' },
  { label: 'Seguridad', emoji: '🛡️', iconKey: 'security' },
  { label: 'Otros', emoji: '🛠️', iconKey: 'wrench' }
];

const ICON_MAP: Record<string, React.ElementType> = {
  plumbing: Droplet, zap: Zap, medical: Stethoscope, hammer: Hammer,
  lock: Key, car: Car, clean: Sparkles, paint: Paintbrush,
  tech: Laptop, scissors: Scissors, delivery: Truck,
  security: ShieldAlert, wrench: Wrench,
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

  // Lógica de filtrado basada en iconKey
  const selectedCatObj = CATEGORIES.find(c => c.label === selectedCategory) || CATEGORIES[0];
  
  const filteredProviders = providers.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = 
      selectedCatObj.iconKey === 'all' || 
      item.icon === selectedCatObj.iconKey;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-5 animate-in fade-in duration-500">
      
      {/* Buscador */}
      <div className="relative group">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-4 group-focus-within:text-blue-600 transition-colors" />
        <input
          type="text"
          placeholder="¿Qué servicio buscas hoy?"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-xs font-medium focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 shadow-sm transition-all outline-none"
        />
      </div>

      {/* Categorías con Desvanecido */}
      <div className="relative">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 mask-fade-x">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.label;
            return (
              <button
                key={cat.label}
                onClick={() => setSelectedCategory(cat.label)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-2xl text-[11px] font-bold whitespace-nowrap transition-all active:scale-90 ${
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
            return (
              <div key={provider.id} className="group bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">{provider.name}</h3>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {provider.profession}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed mb-4 font-medium">{provider.description}</p>
                <a
                  href={`https://wa.me/${provider.phone}?text=${encodeURIComponent(`Hola ${provider.name}, vi tu servicio en Valle Real.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  Contactar por WhatsApp
                </a>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}