'use client';

import { useState } from 'react';
import { 
  Wrench, Zap, Stethoscope, Droplet, Phone, Search, 
  Hammer, Scissors, ShieldAlert, Sparkles, Paintbrush, 
  Car, Key, Laptop, Truck, ChevronRight 
} from 'lucide-react';

export interface ServiceProvider {
  id: string;
  name: string;
  profession: string;
  description: string;
  phone: string;
  icon: 'wrench' | 'zap' | 'medical' | 'plumbing' | 'hammer' | 'scissors' | 'security' | 'clean' | 'paint' | 'car' | 'lock' | 'tech' | 'delivery' | 'default';
}

const MOCK_SERVICES: ServiceProvider[] = [
  { id: '1', name: 'Don Carlos', profession: 'Plomero', description: 'Reparación de fugas, instalación de tuberías y destape de drenajes.', phone: '521234567890', icon: 'plumbing' },
  { id: '2', name: 'Ing. Roberto', profession: 'Electricista', description: 'Instalaciones eléctricas, cortos circuitos y cableado estructurado.', phone: '521234567890', icon: 'zap' },
  { id: '3', name: 'Dra. Elena Ruiz', profession: 'Doctor', description: 'Consulta médica general, certificados y control de presión arterial.', phone: '521234567890', icon: 'medical' },
  { id: '4', name: 'Maestro Esteban', profession: 'Carpintero', description: 'Fabricación y reparación de muebles a la medida, puertas y closets.', phone: '521234567890', icon: 'hammer' },
  { id: '5', name: 'Fermín "El Cerrajas"', profession: 'Cerrajero', description: 'Apertura de puertas, cambio de combinaciones y chapas de seguridad.', phone: '521234567890', icon: 'lock' },
  { id: '6', name: 'Javier M.', profession: 'Albañil', description: 'Reparaciones menores, impermeabilización, loseta y colados.', phone: '521234567890', icon: 'hammer' },
  { id: '7', name: 'Taller Mecánico Express', profession: 'Mecánico', description: 'Diagnóstico por computadora, afinaciones y frenos a domicilio.', phone: '521234567890', icon: 'car' },
  { id: '8', name: 'Lupita y Equipo', profession: 'Limpieza', description: 'Limpieza profunda de casas, departamentos y oficinas por día.', phone: '521234567890', icon: 'clean' },
  { id: '9', name: 'Don Mario', profession: 'Pintor', description: 'Pintura interior y exterior, aplicación de pasta y selladores.', phone: '521234567890', icon: 'paint' },
  { id: '10', name: 'Tec. Alejandro', profession: 'Técnico PC', description: 'Formateo, reparación de laptops, ensamble y redes Wi-Fi.', phone: '521234567890', icon: 'tech' },
  { id: '11', name: 'Estética Mary', profession: 'Estilista', description: 'Cortes de cabello, tintes y peinados a domicilio previa cita.', phone: '521234567890', icon: 'scissors' },
  { id: '12', name: 'Fletes y Mudanzas Valle', profession: 'Fletes', description: 'Transporte de muebles y cargas locales con camioneta cerrada.', phone: '521234567890', icon: 'delivery' },
  { id: '13', name: 'Raúl Sánchez', profession: 'Jardinero', description: 'Poda de árboles, pasto, diseño de jardines y control de plagas.', phone: '521234567890', icon: 'wrench' },
  { id: '14', name: 'Seguridad Privada Val', profession: 'Seguridad', description: 'Instalación de cámaras de circuito cerrado (CCTV) y alarmas.', phone: '521234567890', icon: 'security' },
  { id: '15', name: 'Lic. Sofía Morales', profession: 'Abogado', description: 'Asesoría legal civil, mercantil y redacción de contratos.', phone: '521234567890', icon: 'default' },
];

const CATEGORIES = [
  'Todos', 'Plomero', 'Electricista', 'Doctor', 'Carpintero', 
  'Cerrajero', 'Albañil', 'Mecánico', 'Limpieza', 'Pintor', 
  'Técnico PC', 'Estilista', 'Fletes', 'Jardinero', 'Seguridad', 'Abogado'
];

const getIcon = (type: ServiceProvider['icon']) => {
  switch (type) {
    case 'plumbing': return <Droplet className="w-5 h-5 text-blue-500" />;
    case 'zap': return <Zap className="w-5 h-5 text-amber-500" />;
    case 'medical': return <Stethoscope className="w-5 h-5 text-emerald-500" />;
    case 'hammer': return <Hammer className="w-5 h-5 text-orange-500" />;
    case 'lock': return <Key className="w-5 h-5 text-yellow-600" />;
    case 'car': return <Car className="w-5 h-5 text-indigo-500" />;
    case 'clean': return <Sparkles className="w-5 h-5 text-teal-500" />;
    case 'paint': return <Paintbrush className="w-5 h-5 text-pink-500" />;
    case 'tech': return <Laptop className="w-5 h-5 text-purple-500" />;
    case 'scissors': return <Scissors className="w-5 h-5 text-rose-500" />;
    case 'delivery': return <Truck className="w-5 h-5 text-cyan-600" />;
    case 'security': return <ShieldAlert className="w-5 h-5 text-red-500" />;
    default: return <Wrench className="w-5 h-5 text-slate-500" />;
  }
};

// Función auxiliar para normalizar textos (elimina acentos y pasa a minúsculas)
const normalizeText = (text: string) => {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
};

export function ServiceList() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const filteredServices = MOCK_SERVICES.filter((service) => {
    // Normalizamos la consulta del usuario y los campos del servicio
    const query = normalizeText(searchQuery);
    const name = normalizeText(service.name);
    const profession = normalizeText(service.profession);
    const description = normalizeText(service.description);

    const matchesSearch = 
      name.includes(query) ||
      profession.includes(query) ||
      description.includes(query);
    
    const matchesCategory = selectedCategory === 'Todos' || service.profession === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="animate-in fade-in duration-500 w-full">
      
      {/* BARRA DE BÚSQUEDA Y FILTROS STICKY */}
      <div className="sticky top-0 z-40 bg-slate-50/95 backdrop-blur-md py-3 px-4 shadow-xs mb-2">
        <div className="max-w-md mx-auto relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-3.5 z-10 pointer-events-none" />
          <input
            type="text"
            placeholder="Buscar oficio, nombre o servicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 placeholder:text-slate-400 rounded-2xl text-xs font-medium shadow-md shadow-black/5 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all border border-slate-200/80"
          />
        </div>

        {/* INVITACIÓN VISUAL A DESLIZAR */}
        <div className="max-w-md mx-auto mt-2.5 px-1 flex items-center justify-between text-[11px] font-semibold text-slate-400">
          <span>Categorías</span>
          <span className="flex items-center gap-0.5 text-blue-600 animate-pulse">
            Desliza para ver más <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>

        {/* CHIPS DE CATEGORÍA CON SCROLL HORIZONTAL */}
        <div className="flex gap-2 mt-1.5 px-1 overflow-x-auto pb-2 scrollbar-none max-w-md mx-auto relative">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                selectedCategory === cat 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* RESULTADOS */}
      <div className="max-w-md mx-auto px-4 space-y-4 pb-10">
        {filteredServices.length > 0 ? (
          filteredServices.map((service) => (
            <div key={service.id} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col gap-3 transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center border border-slate-100">
                  {getIcon(service.icon)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{service.name}</h3>
                  <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                    {service.profession}
                  </span>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                {service.description}
              </p>

              <a
                href={`https://wa.me/${service.phone}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5" />
                Contactar por WhatsApp
              </a>
            </div>
          ))
        ) : (
          <div className="text-center py-12 flex flex-col items-center gap-2">
            <Search className="w-8 h-8 text-slate-300" />
            <p className="text-sm font-medium text-slate-500">
              {`No encontramos resultados para "${searchQuery}"`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}