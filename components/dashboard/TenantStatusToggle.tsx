'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Power, Loader2 } from 'lucide-react';

interface Props {
  tenantId: string;
  initialIsActive?: boolean;
  closingTime?: string; // Ejemplo: '22:30:00' o '22:30'
}

export function TenantStatusToggle({ tenantId, initialIsActive = true, closingTime }: Props) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [loading, setLoading] = useState(false);

  // Efecto de Auto-Apagado Inteligente
  useEffect(() => {
    // Si el local ya está apagado o no tenemos hora de cierre, no hacemos nada
    if (!isActive || !closingTime) return;

    // Encapsulamos la función dentro del useEffect para evitar la Temporal Dead Zone (TDZ)
    const turnOffAutomatically = async () => {
      const { error } = await supabase
        .from('tenants')
        .update({ is_active: false })
        .eq('id', tenantId);

      if (!error) {
        setIsActive(false);
        console.log('Se alcanzó la hora de cierre. Negocio apagado automáticamente.');
      }
    };

    const interval = setInterval(() => {
      const now = new Date();
      // Obtenemos la hora actual en formato HH:mm
      const currentHour = now.getHours().toString().padStart(2, '0');
      const currentMinute = now.getMinutes().toString().padStart(2, '0');
      const currentTimeString = `${currentHour}:${currentMinute}`;

      // Extraemos solo los primeros 5 caracteres de closingTime (HH:mm) para ignorar los segundos
      const closingTimePrefix = closingTime.slice(0, 5);

      // Si la hora y minuto actual coinciden exactamente con la hora de cierre
      if (currentTimeString === closingTimePrefix) {
        turnOffAutomatically();
      }
    }, 30000); // Revisamos el reloj cada 30 segundos para no perder el minuto exacto

    return () => clearInterval(interval);
  }, [isActive, closingTime, tenantId]);

  const toggleStatus = async () => {
    setLoading(true);
    const nextState = !isActive;

    const { error } = await supabase
      .from('tenants')
      .update({ is_active: nextState })
      .eq('id', tenantId);

    if (error) {
      console.error('Error al actualizar estado:', error);
      alert('Ocurrió un error al actualizar el estado del restaurante.');
    } else {
      setIsActive(nextState);
    }
    setLoading(false);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl border transition-colors ${
          isActive 
            ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
            : 'bg-red-50 text-red-600 border-red-100'
        }`}>
          <Power className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-900">
            Estado del Negocio: <span className={isActive ? 'text-emerald-600' : 'text-red-600'}>{isActive ? 'Abierto' : 'Cerrado'}</span>
          </h3>
          <p className="text-xs text-gray-500">
            {isActive 
              ? 'El restaurante está recibiendo pedidos' 
              : 'Menú en modo lectura (pedidos pausados)'}
          </p>
        </div>
      </div>

      <button
        onClick={toggleStatus}
        disabled={loading}
        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-2 cursor-pointer active:scale-95 ${
          isActive
            ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700 shadow-sm'
            : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
        }`}
      >
        {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
        <span>{isActive ? '● Servicio Activo' : '○ Pausado'}</span>
      </button>
    </div>
  );
}