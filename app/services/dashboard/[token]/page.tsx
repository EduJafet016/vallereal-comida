'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { 
  ArrowLeft, Store, Phone, Wrench, Zap, Stethoscope, 
  Droplet, Hammer, Scissors, ShieldAlert, Sparkles, 
  Paintbrush, Car, Key, Laptop, Truck, Save, CheckCircle2 
} from 'lucide-react';

interface PageProps {
  params: Promise<{ token: string }>;
}

interface ServiceProvider {
  id: string;
  name: string;
  profession: string;
  description: string;
  phone: string;
  icon: string;
  token: string;
}

const AVAILABLE_ICONS = [
  { id: 'plumbing', label: 'Plomería', icon: Droplet },
  { id: 'zap', label: 'Electricidad', icon: Zap },
  { id: 'medical', label: 'Salud', icon: Stethoscope },
  { id: 'hammer', label: 'Carpintería / Albañilería', icon: Hammer },
  { id: 'lock', label: 'Cerrajería', icon: Key },
  { id: 'car', label: 'Mecánica', icon: Car },
  { id: 'clean', label: 'Limpieza', icon: Sparkles },
  { id: 'paint', label: 'Pintura', icon: Paintbrush },
  { id: 'tech', label: 'Tecnología', icon: Laptop },
  { id: 'scissors', label: 'Estética', icon: Scissors },
  { id: 'delivery', label: 'Fletes', icon: Truck },
  { id: 'security', label: 'Seguridad', icon: ShieldAlert },
  { id: 'wrench', label: 'General / Oficios', icon: Wrench },
];

export default function ServiceDashboardPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();

  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState(false);
  const [error, setError] = useState('');

  // Cargar datos del profesional según el token de la URL
  useEffect(() => {
    async function fetchProvider() {
      setLoading(true);
      const { data, error } = await supabase
        .from('service_providers')
        .select('*')
        .eq('token', token)
        .single();

      if (error || !data) {
        setError('Token de administración inválido o expirado.');
      } else {
        setProvider(data);
      }
      setLoading(false);
    }

    fetchProvider();
  }, [token]);

  // Función para regresar asegurando mantener la pestaña de servicios activa
  const handleGoBack = () => {
    localStorage.setItem('valle_real_active_tab', 'servicios');
    router.push('/');
  };

  // Normalizador estandarizado a 52 para México
  const normalizePhone = (input: string) => {
    let clean = input.replace(/\D/g, '');
    if (clean.length === 10) {
      clean = `52${clean}`;
    } else if (clean.length === 13 && clean.startsWith('521')) {
      clean = `52${clean.substring(3)}`;
    }
    return clean;
  };

  // Guardar cambios en Supabase con teléfono normalizado
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;

    setSaving(true);
    setSuccessMessage(false);

    const finalPhone = normalizePhone(provider.phone);

    const { error } = await supabase
      .from('service_providers')
      .update({
        name: provider.name,
        profession: provider.profession,
        description: provider.description,
        phone: finalPhone,
        icon: provider.icon,
      })
      .eq('token', token);

    setSaving(false);

    if (error) {
      setError('Error al guardar los cambios.');
    } else {
      // Actualizamos localmente el estado con el teléfono ya normalizado
      setProvider({ ...provider, phone: finalPhone });
      setSuccessMessage(true);
      setTimeout(() => setSuccessMessage(false), 3000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-xs text-xs font-semibold text-slate-500 animate-pulse">
          Cargando tu panel profesional...
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center max-w-xs space-y-3">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-xl">
            🔒
          </div>
          <h2 className="text-base font-bold text-slate-900">Acceso Denegado</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {error || 'El perfil no existe.'}
          </p>
          <button
            onClick={handleGoBack}
            className="w-full py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
          >
            Regresar al Inicio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col items-center">
      <main className="w-full max-w-md bg-slate-50 min-h-screen border-x border-slate-200/70 shadow-sm flex flex-col pb-12">
        
        {/* Header Superior Azul */}
        <header className="bg-gradient-to-b from-blue-900 via-blue-800 to-indigo-800 text-white p-5 pt-6 rounded-b-[2rem] shadow-sm space-y-3 relative overflow-hidden shrink-0">
          <div className="flex items-center justify-between relative z-10">
            <button
              onClick={handleGoBack}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/10 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Regresar
            </button>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-400/20 text-blue-100 border border-blue-400/30">
              <Store className="w-3 h-3 text-blue-300" />
              Panel Profesional
            </span>
          </div>

          <div className="relative z-10 pt-1">
            <h1 className="text-2xl font-black tracking-tight text-white leading-tight">
              {provider.name}
            </h1>
            <p className="text-xs text-blue-100/80 mt-0.5 font-medium">
              Modifica la información visible en tu tarjeta pública
            </p>
          </div>
        </header>

        {/* Formulario de Edición */}
        <form onSubmit={handleSave} className="p-4 space-y-4 flex-1">
          
          {successMessage && (
            <div className="p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-2xl border border-emerald-200 flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ¡Cambios guardados correctamente!
            </div>
          )}

          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Información General</h3>

            {/* Nombre */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Nombre o Negocio</label>
              <input
                type="text"
                value={provider.name}
                onChange={(e) => setProvider({ ...provider, name: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>

            {/* Profesión / Oficio */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Oficio / Categoría</label>
              <input
                type="text"
                value={provider.profession}
                onChange={(e) => setProvider({ ...provider, profession: e.target.value })}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800"
              />
            </div>

            {/* Teléfono WhatsApp */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">WhatsApp (ej. 2281234567)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={provider.phone}
                  onChange={(e) => setProvider({ ...provider, phone: e.target.value })}
                  required
                  placeholder="2281234567"
                  className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 font-mono"
                />
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600">Descripción de Servicios</label>
              <textarea
                value={provider.description}
                onChange={(e) => setProvider({ ...provider, description: e.target.value })}
                rows={3}
                required
                className="w-full p-3.5 bg-slate-50 rounded-xl text-xs border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-800 resize-none"
              />
            </div>
          </div>

          {/* Selector de Ícono */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Selecciona tu Ícono</h3>
            <div className="grid grid-cols-4 gap-2">
              {AVAILABLE_ICONS.map((item) => {
                const IconComponent = item.icon;
                const isSelected = provider.icon === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setProvider({ ...provider, icon: item.id })}
                    className={`flex flex-col items-center justify-center p-3 rounded-2xl border transition-all cursor-pointer ${
                      isSelected 
                        ? 'bg-blue-50 border-blue-500 text-blue-600 shadow-sm' 
                        : 'bg-slate-50 border-slate-100 text-slate-500 hover:bg-slate-100'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 mb-1" />
                    <span className="text-[9px] font-bold text-center truncate w-full">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Guardando cambios...' : 'Guardar Cambios'}
          </button>
        </form>
      </main>
    </div>
  );
}