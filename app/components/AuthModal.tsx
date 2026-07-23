'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { X, Store, Lock, Phone, ArrowRight, HelpCircle, PlusCircle } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'login' | 'register' | 'recover';

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('login');

  // Estado Login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Estado Registro
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regDesc, setRegDesc] = useState('');
  const [registering, setRegistering] = useState(false);

  // Estado Recuperación
  const [recoverPhone, setRecoverPhone] = useState('');

  if (!isOpen) return null;

  // Handler Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanPhone = loginPhone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      setLoginError('Ingresa un número de 10 dígitos.');
      return;
    }

    setLoggingIn(true);

    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('admin_token, admin_pin')
        .eq('whatsapp_number', cleanPhone)
        .single();

      if (error || !data) {
        setLoginError('No encontramos un restaurante con este número.');
        return;
      }

      if (data.admin_pin !== loginPin) {
        setLoginError('El PIN ingresado es incorrecto.');
        return;
      }

      // Guardar token local y redirigir
      localStorage.setItem(`auth_token_${data.admin_token}`, 'true');
      router.push(`/dashboard/${data.admin_token}`);
      onClose();
    } catch {
      setLoginError('Ocurrió un error inesperado.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Handler Registro
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = regPhone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      alert('Número de WhatsApp inválido.');
      return;
    }

    setRegistering(true);

    try {
      const slug = regName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const adminToken = crypto.randomUUID();

      const { data, error } = await supabase
        .from('tenants')
        .insert([
          {
            name: regName.trim(),
            slug,
            whatsapp_number: cleanPhone,
            admin_pin: regPin,
            admin_token: adminToken,
            description: regDesc.trim() || null,
            opening_time: '09:00',
            closing_time: '21:00',
            is_active: true,
          },
        ])
        .select()
        .single();

      if (error) {
        alert(`Error al registrar: ${error.message}`);
      } else if (data) {
        localStorage.setItem(`auth_token_${adminToken}`, 'true');
        router.push(`/dashboard/${adminToken}`);
        onClose();
      }
    } catch (err: any) {
      alert(`Error inesperado: ${err.message}`);
    } finally {
      setRegistering(false);
    }
  };

  // Handler Recuperación por WhatsApp
  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = recoverPhone.replace(/\D/g, '');
    const supportNum = '5212282927058'; // Reemplazar con tu número de soporte/admin
    const text = encodeURIComponent(
      `Hola, necesito recuperar la clave de acceso para mi negocio registrado con el WhatsApp: ${cleanPhone}`
    );
    window.open(`https://wa.me/${supportNum}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl space-y-5 border">
        {/* Header & Botón Cerrar */}
        <div className="flex justify-between items-center border-b pb-3">
          <h2 className="font-bold text-gray-900 text-base flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" /> Portal Comerciantes
          </h2>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pestañas (Tabs) */}
        <div className="flex bg-gray-100 p-1 rounded-xl text-xs font-semibold">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'login' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'register' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            Registrar
          </button>
          <button
            onClick={() => setActiveTab('recover')}
            className={`flex-1 py-2 rounded-lg transition-all ${
              activeTab === 'recover' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-500'
            }`}
          >
            Ayuda
          </button>
        </div>

        {/* CONTENIDO TAB 1: LOGIN */}
        {activeTab === 'login' && (
          <form onSubmit={handleLogin} className="space-y-3">
            {loginError && (
              <div className="bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-xl text-xs font-semibold">
                {loginError}
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                WhatsApp del Negocio
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  placeholder="2281234567"
                  value={loginPhone}
                  onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                PIN de Acceso (4 dígitos)
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="••••"
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full pl-9 pr-3 py-2.5 border rounded-xl text-xs text-gray-900 font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loggingIn}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loggingIn ? 'Verificando...' : 'Entrar a mi Panel'} <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* CONTENIDO TAB 2: REGISTRO */}
        {activeTab === 'register' && (
          <form onSubmit={handleRegister} className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Nombre del Restaurante
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Taquería El Paisa"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                WhatsApp de Pedidos
              </label>
              <input
                type="tel"
                required
                placeholder="2281234567"
                value={regPhone}
                onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Crea tu PIN de Acceso (4 dígitos)
              </label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="1234"
                value={regPin}
                onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-mono font-bold tracking-widest focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={registering}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {registering ? 'Creando...' : 'Crear mi Local'} <PlusCircle className="w-4 h-4" />
            </button>
          </form>
        )}

        {/* CONTENIDO TAB 3: RECUPERAR */}
        {activeTab === 'recover' && (
          <form onSubmit={handleRecover} className="space-y-3">
            <p className="text-xs text-gray-500 leading-relaxed">
              Ingresa el número con el que registraste tu negocio para contactar a soporte y validar tu PIN.
            </p>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                WhatsApp Registrado
              </label>
              <input
                type="tel"
                required
                placeholder="2281234567"
                value={recoverPhone}
                onChange={(e) => setRecoverPhone(e.target.value.replace(/\D/g, ''))}
                className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-bold py-3 rounded-xl text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4" /> Solicitar PIN por WhatsApp
            </button>
          </form>
        )}
      </div>
    </div>
  );
}