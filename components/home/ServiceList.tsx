'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  Wrench, Zap, Stethoscope, Droplet, Hammer, 
  Scissors, ShieldAlert, Sparkles, Paintbrush, 
  Car, Key, Laptop, Truck, MessageCircle, Search 
} from 'lucide-react';

interface ServiceProvider {
  id: string;
  name: string;
  profession: string;
  description: string;
  phone: string;
  icon: string;
}

// Mapeo dinámico de íconos según lo que guardó el profesional
const ICON_MAP: Record<string, React.ElementType> = {
  plumbing: Droplet,
  zap: Zap,
  medical: Stethoscope,
  hammer: Hammer,
  lock: Key,
  car: Car,
  clean: Sparkles,
  paint: Paintbrush,
  tech: Laptop,
  scissors: Scissors,
  delivery: Truck,
  security: ShieldAlert,
  wrench: Wrench,
};

export function ServiceList() {
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory] = useState('Todos');

  // Cargar profesionales desde Supabase al montar el componente
  useEffect(() => {
    async function fetchProviders() {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .order('created_at', { ascending: false }); // Opcional: los más recientes primero

      if (!error && data) {
        setProviders(data);
      }
      setLoading(false);
    }

    fetchProviders();
  }, []);

  // Filtrar por búsqueda y categoría
  const filteredProviders = providers.filter((item) => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.profession.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'Todos' || item.profession.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-8 text-center">
        <p className="text-xs font-semibold text-slate-400 animate-pulse">Cargando directorio de profesionales...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6 space-y-4">
      
      {/* Buscador */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
        <input
          type="text"
          placeholder="Buscar oficio, nombre o servicio..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200/80 rounded-2xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none shadow-xs transition-all"
        />
      </div>

      {/* Lista de perfiles reales */}
      <div className="space-y-3">
        {filteredProviders.length === 0 ? (
          <div className="bg-white p-8 rounded-3xl border border-slate-200/80 text-center space-y-2 shadow-xs">
            <Wrench className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-700">No hay profesionales registrados</p>
            <p className="text-[11px] text-slate-400">Sé el primero en registrar tu servicio desde la esquina superior.</p>
          </div>
        ) : (
          filteredProviders.map((provider) => {
            const IconComponent = ICON_MAP[provider.icon] || Wrench;
            
            return (
              <div 
                key={provider.id} 
                className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-3 transition-all hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">{provider.name}</h3>
                      <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        {provider.profession}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {provider.description}
                </p>

                <a
                  href={`https://wa.me/${provider.phone}?text=${encodeURIComponent(`Hola ${provider.name}, vi tu servicio de ${provider.profession} en Valle Real y me interesa cotizar.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
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