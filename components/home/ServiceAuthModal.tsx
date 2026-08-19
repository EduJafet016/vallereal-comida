'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { X, Wrench, Phone, Lock, ArrowRight, Loader2, HelpCircle, PlusCircle } from 'lucide-react';

interface ServiceAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ServiceTabType = 'login' | 'register' | 'recover';

export function ServiceAuthModal({ isOpen, onClose }: ServiceAuthModalProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<ServiceTabType>('login');

  // Estados de Login (WhatsApp + PIN)
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPin, setLoginPin] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Estados de Registro
  const [regName, setRegName] = useState('');
  const [regProfession, setRegProfession] = useState('Plomero');
  const [regPhone, setRegPhone] = useState('');
  const [regPin, setRegPin] = useState('');
  const [registering, setRegistering] = useState(false);

  // Estados de Recuperación
  const [recoverPhone, setRecoverPhone] = useState('');

  if (!isOpen) return null;

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

  // Iniciar sesión (CON PROTECCIÓN CONTRA FUERZA BRUTA)
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const finalPhone = normalizePhone(loginPhone);

    if (finalPhone.length < 12) {
      setLoginError('Ingresa un número válido de 10 dígitos.');
      return;
    }

    setLoggingIn(true);
    try {
      // 1. Verificar si la cuenta está bloqueada (3 intentos en los últimos 30 min)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const { count: failedAttempts } = await supabase
        .from('login_attempts')
        .select('*', { count: 'exact', head: true })
        .eq('identifier', finalPhone)
        .eq('success', false)
        .gt('attempted_at', thirtyMinutesAgo);

      if (failedAttempts && failedAttempts >= 3) {
        setLoginError("Demasiados intentos fallidos. Tu cuenta está bloqueada por 30 minutos.");
        setLoggingIn(false);
        return;
      }

      // 2. Buscar al usuario
      const { data, error } = await supabase
        .from('service_providers')
        .select('token, admin_pin')
        .eq('phone', finalPhone)
        .single();

      if (error || !data) {
        setLoginError('No se encontró ningún profesional con este número.');
        setLoggingIn(false);
        return;
      }

      // 3. Validar el PIN
      if (data.admin_pin !== loginPin) {
        // Registrar intento fallido
        await supabase.from('login_attempts').insert({ identifier: finalPhone, success: false });
        
        const intentosRestantes = 2 - (failedAttempts || 0);
        if (intentosRestantes > 0) {
          setLoginError(`El PIN es incorrecto. Te quedan ${intentosRestantes} intento(s).`);
        } else {
          setLoginError("Has sido bloqueado por 30 minutos por seguridad.");
        }
        
        setLoggingIn(false);
        return;
      }

      // 4. Si el PIN es correcto, registrar éxito (para reiniciar el contador)
      await supabase.from('login_attempts').insert({ identifier: finalPhone, success: true });

      // Guardar sesión y redirigir
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(`service_token_${data.token}`, 'true');
      storage.setItem('current_service_token', data.token);

      router.push(`/services/dashboard/${data.token}`);
      onClose();
    } catch {
      setLoginError('Error de conexión al intentar iniciar sesión.');
    } finally {
      setLoggingIn(false);
    }
  };

  // Registrar nuevo servicio
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalPhone = normalizePhone(regPhone);

    if (finalPhone.length < 12) {
      alert('Número de WhatsApp inválido. Asegúrate de ingresar 10 dígitos.');
      return;
    }

    setRegistering(true);
    try {
      const { data: existingUser } = await supabase
        .from('service_providers')
        .select('token')
        .eq('phone', finalPhone)
        .maybeSingle();

      if (existingUser) {
        alert('Ya tienes una cuenta registrada con este número. Por favor, inicia sesión con tu PIN.');
        setLoginPhone(regPhone); 
        setActiveTab('login');   
        setRegistering(false);
        return;
      }

      const newToken = Math.random().toString(36).substring(2) + Date.now().toString(36);

      const { data, error } = await supabase
        .from('service_providers')
        .insert([
          {
            name: regName.trim(),
            profession: regProfession,
            description: 'Escribe aquí tu descripción y servicios ofrecidos.',
            phone: finalPhone,
            admin_pin: regPin,
            icon: 'wrench',
            token: newToken,
          },
        ])
        .select()
        .single();

      if (error) {
        alert(`Error al registrar: ${error.message}`);
      } else if (data) {
        localStorage.setItem(`service_token_${newToken}`, 'true');
        localStorage.setItem('current_service_token', newToken);

        router.push(`/services/dashboard/${newToken}`);
        onClose();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Error inesperado';
      alert(`Error inesperado: ${message}`);
    } finally {
      setRegistering(false);
    }
  };

  // Ayuda / Recuperación
  const handleRecover = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPhone = normalizePhone(recoverPhone);
    const supportNum = '5212282927058';
    const text = encodeURIComponent(
      `Hola, soy un profesional de Valle Real y necesito recuperar el PIN de acceso vinculado al WhatsApp: ${finalPhone}`
    );
    window.open(`https://wa.me/${supportNum}?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] p-7 shadow-2xl space-y-6 border border-slate-200/80 relative overflow-hidden">
        
        {/* Header Corporativo (Azul para Servicios) */}
        <div className="flex justify-between items-center pb-1">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shadow-2xs">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-extrabold text-slate-900 text-sm tracking-tight">Portal Profesionales</h2>
              <span className="text-[10px] uppercase font-extrabold tracking-widest text-blue-600">Gestión de Servicios</span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 rounded-full transition-all cursor-pointer border border-slate-200/60"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Pestañas Estilo Píldora */}
        <div className="grid grid-cols-3 gap-1 bg-slate-100/90 p-1.5 rounded-2xl text-xs font-semibold border border-slate-200/60">
          <button
            onClick={() => setActiveTab('login')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'login' ? 'bg-white text-blue-600 shadow-2xs font-bold border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => setActiveTab('register')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'register' ? 'bg-white text-blue-600 shadow-2xs font-bold border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Registrar
          </button>
          <button
            onClick={() => setActiveTab('recover')}
            className={`py-2 rounded-xl transition-all cursor-pointer ${
              activeTab === 'recover' ? 'bg-white text-blue-600 shadow-2xs font-bold border border-slate-200/60' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Ayuda
          </button>
        </div>

        {/* CONTENEDOR CON ALTURA FIJA */}
        <div className="min-h-[290px] flex flex-col justify-between">
          
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
                  WhatsApp (10 dígitos)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-4 top-3.5" />
                  <input
                    type="tel"
                    required
                    placeholder="2281234567"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
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
                    className="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono font-bold tracking-widest focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between px-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 text-blue-600 accent-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="text-xs font-semibold text-slate-600">Recuérdame en este equipo</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loggingIn}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl text-xs transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-1"
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
                  Nombre o Negocio
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Don Carlos Plomería"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest px-1">
                    Oficio Principal
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Plomero"
                    value={regProfession}
                    onChange={(e) => setRegProfession(e.target.value)}
                    className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest px-1">
                    PIN (4 dígitos)
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    placeholder="1234"
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-mono font-bold tracking-widest focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-700 uppercase tracking-widest px-1">
                  WhatsApp (10 dígitos)
                </label>
                <input
                  type="tel"
                  required
                  placeholder="2281234567"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={registering}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-2xl text-xs transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer mt-1"
              >
                {registering ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Registrando...
                  </>
                ) : (
                  <>
                    Registrar mi Servicio <PlusCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 3: RECUPERAR */}
          {activeTab === 'recover' && (
            <form onSubmit={handleRecover} className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl border border-slate-200/60 font-medium">
                Introduce el número de WhatsApp asociado a tu perfil profesional para solicitar ayuda directa con tu PIN de acceso.
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
                  className="w-full p-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs text-slate-900 font-medium focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold py-3.5 rounded-2xl text-xs transition-all shadow-2xs active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <HelpCircle className="w-4 h-4 text-blue-600" /> Contactar Soporte
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}