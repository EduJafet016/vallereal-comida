'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant } from '@/types';
import { 
  ShieldCheck, Store, ExternalLink, LogOut, Lock, 
  CheckCircle2, AlertCircle, Utensils, Search, Wrench, 
  Phone, Briefcase, Layers 
} from 'lucide-react';

interface ServiceProvider {
  id: string;
  name: string;
  profession: string;
  description: string;
  phone: string;
  icon: string;
  created_at?: string;
  token?: string;
  pin?: string;
}

export default function MasterAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Pestaña activa del Master Admin ('tenants' para comida | 'services' para prestadores)
  const [activeTab, setActiveTab] = useState<'tenants' | 'services'>('tenants');

  // Datos
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [providers, setProviders] = useState<ServiceProvider[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTenants = useCallback(async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTenants(data);
    }
  }, []);

  const fetchProviders = useCallback(async () => {
    const { data, error } = await supabase
      .from('service_providers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setProviders(data);
    }
  }, []);

  const fetchAllData = useCallback(async () => {
    await Promise.all([fetchTenants(), fetchProviders()]);
  }, [fetchTenants, fetchProviders]);

  const checkSession = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user.app_metadata?.role === 'superadmin') {
      setAuthenticated(true);
      await fetchAllData();
    }
    setLoading(false);
  }, [fetchAllData]);

  useEffect(() => {
    queueMicrotask(() => {
      void checkSession();
    });
  }, [checkSession]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      alert(`Error al iniciar sesión: ${error.message}`);
      setLoading(false);
      return;
    }

    if (data.user.app_metadata?.role === 'superadmin') {
      setAuthenticated(true);
      await fetchAllData();
    } else {
      alert('Acceso denegado: No tienes permisos de Super Admin.');
      await supabase.auth.signOut();
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthenticated(false);
  };

  // Métricas dinámicas según la pestaña activa
  const tenantStats = useMemo(() => {
    const total = tenants.length;
    const active = tenants.filter(t => t.is_active).length;
    const inactive = total - active;
    return { total, active, inactive };
  }, [tenants]);

  const providerStats = useMemo(() => {
    return { total: providers.length };
  }, [providers]);

  // Filtrado de restaurantes en tiempo real
  const filteredTenants = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return tenants;

    return tenants.filter(
      (t) =>
        t.name.toLowerCase().includes(query) ||
        t.slug.toLowerCase().includes(query) ||
        t.whatsapp_number.includes(query)
    );
  }, [tenants, searchQuery]);

  // Filtrado de prestadores de servicios en tiempo real
  const filteredProviders = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return providers;

    return providers.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.profession.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.phone.includes(query)
    );
  }, [providers, searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="text-sm font-medium">Verificando credenciales...</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <main className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-gray-900 border border-gray-800 p-8 rounded-3xl w-full max-w-sm space-y-5">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white">Soporte Master</h1>
            <p className="text-xs text-gray-400 mt-1">Acceso privado de administración global</p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">Correo electrónico</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-300 block mb-1">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 bg-gray-800 border border-gray-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-lg"
          >
            Entrar al Panel
          </button>
        </form>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto space-y-6">
      <header className="bg-white p-6 rounded-3xl border shadow-sm space-y-5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">Panel Super Admin</h1>
              <p className="text-xs text-gray-500">Gestión y métricas globales de Valle Real</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="text-xs font-semibold text-gray-600 hover:text-red-600 bg-gray-100 p-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Salir
          </button>
        </div>

        {/* Control Principal de Módulos (Comercios vs Servicios) */}
        <div className="flex items-center gap-2 bg-gray-100 p-1.5 rounded-2xl">
          <button
            onClick={() => setActiveTab('tenants')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'tenants'
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Utensils className="w-4 h-4 text-emerald-600" />
            Comercios ({tenants.length})
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`flex-1 py-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'services'
                ? 'bg-white text-blue-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <Wrench className="w-4 h-4 text-blue-600" />
            Servicios ({providers.length})
          </button>
        </div>

        {/* Tarjetas de Métricas Condicionales */}
        {activeTab === 'tenants' ? (
          <div className="grid grid-cols-3 gap-3 pt-1">
            <div className="bg-gray-50 p-3 rounded-2xl border border-gray-100 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-gray-400 text-[10px] font-bold uppercase tracking-wider">
                <Utensils className="w-3 h-3" /> Totales
              </div>
              <p className="text-lg font-black text-gray-800">{tenantStats.total}</p>
            </div>

            <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100/60 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3 h-3" /> Activos
              </div>
              <p className="text-lg font-black text-emerald-700">{tenantStats.active}</p>
            </div>

            <div className="bg-amber-50/60 p-3 rounded-2xl border border-amber-100/60 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-amber-600 text-[10px] font-bold uppercase tracking-wider">
                <AlertCircle className="w-3 h-3" /> Inactivos
              </div>
              <p className="text-lg font-black text-amber-700">{tenantStats.inactive}</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 pt-1">
            <div className="bg-blue-50/60 p-3 rounded-2xl border border-blue-100/60 text-center space-y-1">
              <div className="flex items-center justify-center gap-1 text-blue-600 text-[10px] font-bold uppercase tracking-wider">
                <Briefcase className="w-3 h-3" /> Prestadores Registrados
              </div>
              <p className="text-lg font-black text-blue-800">{providerStats.total}</p>
            </div>
          </div>
        )}

        {/* Barra de Búsqueda adaptativa */}
        <div className="relative pt-1">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 translate-y-0.5" />
          <input
            type="text"
            placeholder={
              activeTab === 'tenants'
                ? "Buscar comercios por nombre, slug o WhatsApp..."
                : "Buscar servicios por nombre, oficio o teléfono..."
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </div>
      </header>

      {/* VISTA 1: LISTADO DE COMERCIOS */}
      {activeTab === 'tenants' && (
        <section className="grid gap-4 md:grid-cols-2">
          {filteredTenants.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-3xl border text-center space-y-1">
              <p className="text-sm font-semibold text-gray-700">No se encontró ningún restaurante</p>
              <p className="text-xs text-gray-400">Intenta con otro término de búsqueda.</p>
            </div>
          ) : (
            filteredTenants.map((item) => (
              <div key={item.id} className="bg-white p-5 rounded-3xl border shadow-sm space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{item.name}</h3>
                    <p className="text-xs text-emerald-600 font-mono">/{item.slug}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${item.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {item.is_active ? 'Activo' : 'Inactivo'}
                  </span>
                </div>

                <div className="text-xs text-gray-500 space-y-1 pt-2 border-t font-mono">
                  <p>📱 WhatsApp: {item.whatsapp_number}</p>
                  <p>🔑 PIN: {item.admin_pin}</p>
                </div>

                <div className="pt-2 flex gap-2">
                  <a
                    href={`/dashboard/${item.admin_token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 rounded-xl text-xs text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    <Store className="w-3.5 h-3.5" /> Entrar como Admin
                  </a>
                  <a
                    href={`/${item.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border rounded-xl hover:bg-gray-50 text-gray-600 transition-all"
                    title="Ver menú público"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))
          )}
        </section>
      )}

      {/* VISTA 2: LISTADO DE SERVICIOS */}
      {activeTab === 'services' && (
        <section className="grid gap-4 md:grid-cols-2">
          {filteredProviders.length === 0 ? (
            <div className="col-span-full bg-white p-8 rounded-3xl border text-center space-y-1">
              <p className="text-sm font-semibold text-gray-700">No se encontró ningún prestador de servicios</p>
              <p className="text-xs text-gray-400">Intenta con otro término de búsqueda.</p>
            </div>
          ) : (
            filteredProviders.map((provider) => (
              <div key={provider.id} className="bg-white p-5 rounded-3xl border shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold shrink-0">
                      <Wrench className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-extrabold text-gray-900 text-base">{provider.name}</h3>
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        {provider.profession}
                      </span>
                    </div>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed font-medium line-clamp-2 pt-1">
                  {provider.description || 'Sin descripción configurada.'}
                </p>

                <div className="text-xs text-gray-500 space-y-1 pt-2 border-t font-mono">
                  <p className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-gray-400" /> WhatsApp: {provider.phone}
                  </p>
                  {/* Ahora puedes ver el PIN del prestador de servicio */}
                  <p>🔑 PIN: {provider.pin}</p>
                </div>

                <div className="pt-2 flex gap-2">
                  <a
                    href={`/services/dashboard/${provider.token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Entrar como Admin
                  </a>
                  <a
                    href={`https://wa.me/${provider.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 border rounded-xl hover:bg-gray-50 text-gray-600 transition-all flex items-center justify-center"
                    title="Contactar por WhatsApp"
                  >
                    <Phone className="w-4 h-4 text-emerald-500" />
                  </a>
                </div>

                <div className="pt-2 flex gap-2">
                  <a
                    href={`https://wa.me/${provider.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl text-xs text-center transition-all flex items-center justify-center gap-1.5"
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-400" /> Contactar por WhatsApp
                  </a>
                </div>
              </div>
            ))
          )}
        </section>
      )}
    </main>
  );
}