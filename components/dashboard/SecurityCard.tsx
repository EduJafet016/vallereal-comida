'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant } from '@/types';
import { KeyRound, ShieldCheck } from 'lucide-react';

interface Props {
  tenant: Tenant;
  onPinUpdated: (newPin: string) => void;
}

export function SecurityCard({ tenant, onPinUpdated }: Props) {
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length !== 4 || isNaN(Number(newPin))) return;

    const { error } = await supabase
      .from('tenants')
      .update({ admin_pin: newPin })
      .eq('id', tenant.id);

    if (!error) {
      onPinUpdated(newPin);
      setSuccessMsg('PIN actualizado correctamente');
      setNewPin('');
      setIsChangingPin(false);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-2">
      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-2.5 rounded-xl flex items-center gap-2 mb-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" /> {successMsg}
        </div>
      )}

      <div className="flex justify-between items-center">
        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <KeyRound className="w-4 h-4 text-emerald-600" /> Seguridad
        </span>
        <button
          onClick={() => setIsChangingPin(!isChangingPin)}
          className="text-xs text-emerald-600 font-semibold hover:underline"
        >
          {isChangingPin ? 'Cancelar' : 'Cambiar PIN'}
        </button>
      </div>

      {isChangingPin && (
        <form onSubmit={handleUpdatePin} className="pt-3 border-t flex gap-2">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="Nuevo PIN"
            value={newPin}
            onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
            className="flex-1 p-2 border rounded-xl text-xs font-mono text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="bg-emerald-600 text-white font-bold px-3 py-2 rounded-xl text-xs hover:bg-emerald-700"
          >
            Guardar
          </button>
        </form>
      )}
    </div>
  );
}