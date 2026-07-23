'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Store, Check, Copy, ArrowRight, ShieldCheck, Phone, KeyRound, FileText, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const formatToSlug = (text: string) => {
  return text
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export default function RegisterTenantPage() {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('21:00');
  const [pin, setPin] = useState('');

  const [loading, setLoading] = useState(false);
  const [createdToken, setCreatedToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Handlers con sanitización de teclado numérico
  const handlePinChange = (val: string) => {
    const onlyNums = val.replace(/\D/g, '');
    if (onlyNums.length <= 4) {
      setPin(onlyNums);
    }
  };

  const handlePhoneChange = (val: string) => {
    const onlyNums = val.replace(/\D/g, '');
    setWhatsappNumber(onlyNums);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    if (pin.length !== 4) {
      alert('El PIN debe tener exactamente 4 números.');
      return;
    }

    if (whatsappNumber.length < 10) {
      alert('Ingresa un número de WhatsApp válido (mínimo 10 dígitos).');
      return;
    }

    setLoading(true);

    const baseSlug = formatToSlug(name) || `local-${Date.now().toString().slice(-4)}`;
    const generatedAdminToken = crypto.randomUUID();

    const insertPayload = (targetSlug: string) => ({
      name: name.trim(),
      slug: targetSlug,
      description: description.trim() || null,
      whatsapp_number: whatsappNumber,
      opening_time: openingTime,
      closing_time: closingTime,
      admin_pin: pin,
      admin_token: generatedAdminToken,
      is_active: true,
    });

    try {
      let { data, error } = await supabase
        .from('tenants')
        .insert([insertPayload(baseSlug)])
        .select('admin_token');

      if (error && (error.code === '23505' || error.message.includes('tenants_slug_key'))) {
        const uniqueSlug = `${baseSlug}-${Math.random().toString(36).substring(2, 6)}`;
        const secondTry = await supabase
          .from('tenants')
          .insert([insertPayload(uniqueSlug)])
          .select('admin_token');

        data = secondTry.data;
        error = secondTry.error;
      }

      if (error) {
        console.error('Error de Supabase:', error);
        alert(`No se pudo crear el local: ${error.message}`);
      } else {
        setCreatedToken(data && data[0]?.admin_token ? data[0].admin_token : generatedAdminToken);
      }
    } catch (err: any) {
      console.error('Error inesperado:', err);
      alert('Ocurrió un error inesperado al procesar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  const dashboardUrl =
    typeof window !== 'undefined' && createdToken
      ? `${window.location.origin}/dashboard/${createdToken}`
      : '';

  const copyToClipboard = () => {
    if (!dashboardUrl) return;
    navigator.clipboard.writeText(dashboardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <main className="p-4 max-w-md mx-auto min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-full bg-white p-6 rounded-3xl border shadow-sm space-y-6 relative">
        
        {/* BOTÓN VOLVER A LA PÁGINA PRINCIPAL */}
        <div className="flex justify-between items-center border-b pb-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-emerald-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-full transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Volver al inicio
          </Link>
        </div>

        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Store className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Registrar mi Restaurante</h1>
          <p className="text-xs text-gray-500 mt-1">
            Crea tu menú en Valle Real en menos de 1 minuto
          </p>
        </div>

        {!createdToken ? (
          /* FORMULARIO DE REGISTRO */
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Nombre del Local
              </label>
              <input
                type="text"
                required
                placeholder="Ej. Antojitos Doña Lola"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 border rounded-xl text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Descripción Corta (Giro del negocio)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ej. Tacos, empanadas y antojitos tradicionales"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 pl-10 border rounded-xl text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                Número de WhatsApp (para recibir pedidos)
              </label>
              <div className="relative">
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  required
                  placeholder="Ej. 2281234567"
                  value={whatsappNumber}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className="w-full p-3 pl-10 border rounded-xl text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3.5" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Apertura
                </label>
                <input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  Cierre
                </label>
                <input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">
                PIN de Seguridad (4 dígitos)
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                required
                placeholder="••••"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                className="w-full p-3 border rounded-xl text-center text-lg font-mono text-gray-900 font-bold tracking-widest placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl text-sm transition-all shadow-md active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Creando local...' : 'Crear mi Local'}{' '}
              <ArrowRight className="w-4 h-4" />
            </button>

            {/* ENLACE DE RECUPERACIÓN */}
            <div className="text-center pt-2 border-t">
              <Link
                href="/recuperar"
                className="text-xs text-gray-500 hover:text-emerald-600 font-semibold inline-flex items-center gap-1 transition-colors"
              >
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                ¿Ya tienes un negocio y perdiste tu enlace? Recupéralo aquí
              </Link>
            </div>
          </form>
        ) : (
          /* PANTALLA DE ÉXITO */
          <div className="space-y-4 text-center">
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl">
              <ShieldCheck className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <h2 className="font-bold text-sm">¡Tu negocio ha sido creado!</h2>
              <p className="text-xs text-emerald-700 mt-1">
                Guarda este enlace privado. Es la única forma de acceder a tu panel de administración.
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
              className="block w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-sm shadow-md transition-all hover:bg-emerald-700 text-center"
            >
              Ir a mi Panel de Administración
            </a>
          </div>
        )}
      </div>
    </main>
  );
}