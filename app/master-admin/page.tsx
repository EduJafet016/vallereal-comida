'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldCheck, Store, ExternalLink, LogOut, Lock } from 'lucide-react';

export default function MasterAdminPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [tenants, setTenants] = useState<any[]>([]);

  // Comprobar sesión existente
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session && session.user.app_metadata?.role === 'superadmin') {
      setAuthenticated(true);
      fetchTenants();
    }
    setLoading(false);
  };

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
      fetchTenants();
    } else {
      alert('Acceso denegado: No tienes permisos de Super Admin.');
      await supabase.auth.signOut();
    }
    setLoading(false);
  };

  const fetchTenants = async () => {
    const { data, error } = await supabase
      .from('tenants')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setTenants(data);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setAuthenticated(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <p className="text-sm font-medium">Verificando credenciales...</p>
      </div>
    );
  }

  // VISTA 1: FORMULARIO DE LOGIN MASTER
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

  // VISTA 2: LISTADO COMPLETO DE RESTAURANTES Y ACCESO DIRECTO
  return (
    <main className="min-h-screen bg-gray-50 p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center font-bold">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Panel Super Admin</h1>
            <p className="text-xs text-gray-500">{tenants.length} restaurante(s) registrado(s)</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-xs font-semibold text-gray-600 hover:text-red-600 bg-gray-100 p-2.5 rounded-xl flex items-center gap-1.5 transition-colors"
        >
          <LogOut className="w-4 h-4" /> Salir
        </button>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {tenants.map((item) => (
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
        ))}
      </section>
    </main>
  );
}