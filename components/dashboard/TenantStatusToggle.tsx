'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant } from '@/types';
import { Bike, Store, Utensils, Loader2 } from 'lucide-react';

interface Props {
  tenant: Tenant;
  onReload: () => void;
}

export function TenantDeliveryInputs({ tenant, onReload }: Props) {
  const [loadingField, setLoadingField] = useState<string | null>(null);

  const handleToggle = async (field: 'allow_delivery' | 'allow_pickup' | 'allow_dine_in', currentValue: boolean) => {
    setLoadingField(field);
    const nextValue = !currentValue;

    const { error } = await supabase
      .from('tenants')
      .update({ [field]: nextValue })
      .eq('id', tenant.id);

    if (error) {
      console.error('Error al actualizar método de entrega:', error);
      alert('Ocurrió un error al actualizar la configuración.');
    } else {
      onReload();
    }
    setLoadingField(null);
  };

  const deliveryAllowed = tenant.allow_delivery ?? true;
  const pickupAllowed = tenant.allow_pickup ?? true;
  const dineInAllowed = tenant.allow_dine_in ?? false;

  return (
    <div className="bg-white p-5 rounded-2xl border shadow-sm space-y-4">
      <div>
        <h3 className="text-sm font-bold text-gray-900">Métodos de Entrega</h3>
        <p className="text-xs text-gray-500">Activa o desactiva las opciones disponibles para tus clientes en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        
        {/* Envio a Domicilio */}
        <button
          type="button"
          disabled={loadingField === 'allow_delivery'}
          onClick={() => handleToggle('allow_delivery', deliveryAllowed)}
          className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
            deliveryAllowed 
              ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900' 
              : 'border-gray-200 bg-gray-50 text-gray-400 opacity-75'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${deliveryAllowed ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold">A Domicilio</span>
              <span className="text-[10px] font-medium">{deliveryAllowed ? 'Habilitado' : 'Deshabilitado'}</span>
            </div>
          </div>
          {loadingField === 'allow_delivery' && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
        </button>

        {/* Pasar a Recoger */}
        <button
          type="button"
          disabled={loadingField === 'allow_pickup'}
          onClick={() => handleToggle('allow_pickup', pickupAllowed)}
          className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
            pickupAllowed 
              ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900' 
              : 'border-gray-200 bg-gray-50 text-gray-400 opacity-75'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${pickupAllowed ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
              <Store className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold">Para Recoger</span>
              <span className="text-[10px] font-medium">{pickupAllowed ? 'Habilitado' : 'Deshabilitado'}</span>
            </div>
          </div>
          {loadingField === 'allow_pickup' && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
        </button>

        {/* Comer en Mesa */}
        <button
          type="button"
          disabled={loadingField === 'allow_dine_in'}
          onClick={() => handleToggle('allow_dine_in', dineInAllowed)}
          className={`p-3.5 rounded-2xl border-2 text-left transition-all flex items-center justify-between cursor-pointer ${
            dineInAllowed 
              ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900' 
              : 'border-gray-200 bg-gray-50 text-gray-400 opacity-75'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${dineInAllowed ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-500'}`}>
              <Utensils className="w-4 h-4" />
            </div>
            <div>
              <span className="block text-xs font-bold">En Mesa</span>
              <span className="text-[10px] font-medium">{dineInAllowed ? 'Habilitado' : 'Deshabilitado'}</span>
            </div>
          </div>
          {loadingField === 'allow_dine_in' && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
        </button>

      </div>
    </div>
  );
}