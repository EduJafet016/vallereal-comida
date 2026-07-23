'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { KeyRound, Phone, ArrowRight, ShieldCheck, Check, Copy, ExternalLink, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function RecoverLinkPage() {
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [recoveredToken, setRecoveredToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanPhone = whatsappNumber.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMsg('Ingresa un número de WhatsApp válido (mínimo 10 dígitos).');
      return;
    }

    if (pin.length !== 4 || isNaN(Number(pin))) {
      setErrorMsg('El PIN debe tener exactamente 4 números.');
      return;
    }

    setLoading(true);

    try {
      // Buscar en Supabase el registro que coincida con el WhatsApp y el PIN
      const { data, error } = await supabase
        .from('tenants')
        .select('admin_token, name')
        .eq('whatsapp_number', cleanPhone)
        .eq('admin_pin', pin)
        .maybeSingle();

      if (error) {
        console.error('Error al recuperar:', error);
        setErrorMsg('Ocurrió un error al verificar los datos. Intenta nuevamente.');
      } else if (!data) {
        setErrorMsg('No se encontró ningún negocio registrado con ese número y PIN.');
      } else {
        setRecoveredToken(data.admin_token);
      }
    } catch {
      setErrorMsg('Error de conexión al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const dashboardUrl =
    typeof window !== 'undefined' && recoveredToken
      ? `${window.location.origin}/dashboard/${recoveredToken}`
      : '';

  const copyToClipboard = () => {
    if (!dashboardUrl) return;
    navigator.clipboard.writeText(dashboardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <main className="p-4 max-w-md mx-auto min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full bg-white p-6 rounded-3xl border shadow-sm space-y-6">
        
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Recuperar mi Enlace</h1>
          <p className="text-xs text-gray-500 mt-1">
            Ingresa los datos de tu negocio para acceder a tu panel
          </p>
        </div>

        {!recoveredToken ? (
          /* FORMULARIO DE RECUPERACIÓN */
          <form onSubmit={handleRecover} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Número de WhatsApp Registrado
              </label>
              <div className="relative">
                <input
                  type="tel"
                  required
                  placeholder="Ej. 2281234567"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full p-3 pl-10 border rounded-xl text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                PIN de Seguridad (4 dígitos)
              </label>
              <input
                type="password"
                maxLength={4}
                required
                placeholder="••••"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full p-3 border rounded-xl text-center text-lg font-mono text-gray-900 font-bold tracking-widest placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-red-500 font-semibold bg-red-50 border border-red-200 p-3 rounded-xl text-center">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Verificando...' : 'Obtener mi Enlace'}{' '}
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <Link
                href="/registro"
                className="text-xs text-gray-400 hover:text-gray-600 font-semibold inline-flex items-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" /> ¿No tienes negocio? Regístrate aquí
              </Link>
            </div>
          </form>
        ) : (
          /* ENLACE RECUPERADO CON ÉXITO */
          <div className="space-y-4 text-center">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h2 className="font-bold text-sm">¡Enlace recuperado con éxito!</h2>
              <p className="text-xs text-emerald-700 mt-1">
                Guarda este enlace en los marcadores de tu navegador para no volver a perderlo.
              </p>
            </div>

            <div className="p-3 bg-gray-100 rounded-xl border text-left flex items-center justify-between gap-2">
              <span className="text-xs font-mono text-gray-900 font-medium truncate">
                {dashboardUrl}
              </span>
              <button
                onClick={copyToClipboard}
                className="p-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-700 transition-all flex items-center gap-1 text-xs font-semibold shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>

            <a
              href={dashboardUrl}
              className="block w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all hover:bg-emerald-700 text-center flex items-center justify-center gap-2"
            >
              Ir a mi Panel <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>
    </main>
  );
}