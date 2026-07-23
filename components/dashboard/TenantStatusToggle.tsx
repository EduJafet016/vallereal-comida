'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Ajusta la ruta a tu cliente
import { Power, Loader2 } from 'lucide-react';

interface Props {
  tenantId: string;
  initialIsActive?: boolean;
}

export function TenantStatusToggle({ tenantId, initialIsActive = true }: Props) {
  const [isActive, setIsActive] = useState(initialIsActive);
  const [loading, setLoading] = useState(false);

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
        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-2 active:scale-95 ${
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