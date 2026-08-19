'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { X, Store, Lock, Phone, ArrowRight, HelpCircle, PlusCircle, Loader2 } from 'lucide-react';

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
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Estado Registro
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');
  const [regDesc] = useState('');
  const [registering, setRegistering] = useState(false);

  // Estado Recuperación
  const [recoverPhone, setRecoverPhone] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const cleanPhone = loginPhone.replace(/\D/g, '');

    if (cleanPhone.length < 10) {
      setLoginError('Ingresa un número válido de 10 dígitos.');
      return;
    }

    setLoggingIn(true);
    try {
      // 1. Verificar bloqueo por tiempo (3 intentos fallidos en los últimos 30 min)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { count: failedAttempts } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('identifier', cleanPhone)
        .eq('success', false)
        .gt('attempted_at', thirtyMinutesAgo);

      if (failedAttempts && failedAttempts >= 3) {
        setLoginError('Demasiados intentos fallidos. Tu cuenta está bloqueada por 30 minutos.');
        setLoggingIn(false);
        return;
      }

      // 2. Buscar al comercio
      const { data, error } = await supabase
        .from('tenants')
        .select('admin_token, admin_pin')
        .eq('whatsapp_number', cleanPhone)
        .single();

      if (error || !data) {
        setLoginError('No se encontró ningún negocio registrado con este número.');
        setLoggingIn(false);
        return;
      }

      // 3. Validar el PIN
      if (data.admin_pin !== loginPin) {
        // Registrar intento fallido
        await supabase.from('login_attempts').insert({ identifier: cleanPhone, success: false });

        const intentosRestantes = 2 - (failedAttempts || 0);
        if (intentosRestantes > 0) {
          setLoginError(`El PIN es incorrecto. Te quedan ${intentosRestantes} intento(s).`);
        } else {
          setLoginError('Has sido bloqueado por 30 minutos por seguridad.');
        }

        setLoggingIn(false);
        return;
      }

      // 4. Si es correcto, registrar éxito para reiniciar métrica de fallos
      await supabase.from('login_attempts').insert({ identifier: cleanPhone, success: true });

      // Almacenamiento condicional según "Recuérdame" y registro del tenant activo actual
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(`auth_token_${data.admin_token}`, 'true');
      storage.setItem('current_tenant_token', data.admin_token); 

      router.push(`/dashboard/${data.admin_token}`);
      onClose();
    } catch {
      setLoginError('Error de conexión al intentar iniciar sesión.');
    } finally {
      setLoggingIn(false);
    }
  };

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
        localStorage.setItem('current_tenant_token', adminToken);
        router.push(`/dashboard/${adminToken}`);
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado';
      alert(`Error inesperado: ${message}`);
    } finally {
      setRegistering(false);
    }
  };

  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = recoverPhone.replace(/\D/g, '');
    const supportNum = '5212282927058';
    const text = encodeURIComponent(
      `Hola, necesito recuperar la clave de acceso para mi negocio registrado con el WhatsApp: ${cleanPhone}`
    );
    window.open(`https://wa.me/${supportNum}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-7 shadow-2xl space-y-6 border border-slate-200/80 relative overflow-hidden">
        
        {/* Header Corporativo */}
        <div className="flex justify-between items-center pb-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#007A55] border border-emerald-100 flex items-center justify-center shadow-2xs">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">Portal Comerciantes</h2>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#007A55]">Acceso Administrativo</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-all cursor-pointer border border-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas Estilo Píldora Corporativas */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100/90 p-1.5 rounded-2xl text-xs font-semibold border border-slate-200/60">
          <button
            onClick={() => setActiveTab('login')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'login' ? 'bg-white text-[#007A55] shadow-2xs font-bold border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'register' ? 'bg-white text-[#007A55] shadow-2xs font-bold border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Registrar
          </button>
          <button
            onClick={() => setActiveTab('recover')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'recover' ? 'bg-white text-[#007A55] shadow-2xs font-bold border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ayuda
          </button>
        </div>

        {/* CONTENEDOR CON ALTURA FIJA PARA EVITAR SALTOS */}
        <div className="min-h-[305px] flex flex-col justify-between">
          
          {/* TAB 1: LOGIN */}
          {activeTab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              {loginError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-2xl text-xs font-medium">
                  {loginError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest px-1">
                  WhatsApp
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="2281234567"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#007A55]/20 focus:border-[#007A55] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest px-1">
                  PIN de Acceso
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="••••"
                    value={loginPin}
                    onChange={(e) => setLoginPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono font-bold tracking-widest focus:bg-white focus:ring-2 focus:ring-[#007A55]/20 focus:border-[#007A55] focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Checkbox Recuérdame */}
              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-[#007A55] accent-[#007A55] rounded border-slate-300 focus:ring-[#007A55] cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600">Recuérdame en este equipo</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-[#007A55] hover:bg-[#006344] text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-1"
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verificando...
                  </>
                ) : (
                  <>
                    Acceder al Panel <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2: REGISTRO */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest px-1">
                  Nombre del Negocio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Tacos Don Charly"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#007A55]/20 focus:border-[#007A55] focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest px-1">
                  WhatsApp de Pedidos
                </label>
                <input
                  type="tel"
                  required
                  placeholder="2281234567"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#007A55]/20 focus:border-[#007A55] focus:outline-none transition-all"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest px-1">
                  Crea tu PIN (4 dígitos)
                </label>
                <input
                  type="password"
                  maxLength={4}
                  required
                  placeholder="1234"
                  value={regPin}
                  onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono font-bold tracking-widest focus:bg-white focus:ring-2 focus:ring-[#007A55]/20 focus:border-[#007A55] focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={registering}
                className="w-full bg-[#007A55] hover:bg-[#006344] text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-1"
              >
                {registering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Registrando...
                  </>
                ) : (
                  <>
                    Registrar mi Local <PlusCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: RECUPERAR */}
          {activeTab === 'recover' && (
            <form onSubmit={handleRecover} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 font-medium">
                Introduce el número de WhatsApp asociado a tu comercio para solicitar ayuda directa con tu clave de acceso.
              </p>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest px-1">
                  WhatsApp Registrado
                </label>
                <input
                  type="tel"
                  required
                  placeholder="2281234567"
                  value={recoverPhone}
                  onChange={(e) => setRecoverPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-[#007A55]/20 focus:border-[#007A55] focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-50 hover:bg-emerald-100 text-[#007A55] border border-emerald-200 font-bold py-3.5 rounded-2xl text-xs transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <HelpCircle className="w-4 h-4 text-[#007A55]" /> Contactar Soporte
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}