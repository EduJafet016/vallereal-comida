'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant } from '@/types';
import { Shield, KeyRound, Loader2 } from 'lucide-react';

interface Props {
  tenant: Tenant;
  onPinUpdated: (newPin: string) => void;
}

export function SecurityCard({ tenant, onPinUpdated }: Props) {
  const [isEditingPin, setIsEditingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [saving, setSaving] = useState(false);

  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length < 4) {
      alert('El PIN debe tener al menos 4 caracteres.');
      return;
    }

    setSaving(true);
    const { error } = await supabase
      .from('tenants')
      .update({ admin_pin: newPin })
      .eq('id', tenant.id);

    if (error) {
      alert(`Error al actualizar PIN: ${error.message}`);
    } else {
      onPinUpdated(newPin);
      setNewPin('');
      setIsEditingPin(false);
      alert('PIN de seguridad actualizado con éxito.');
    }
    setSaving(false);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-[#007A55]" /> Seguridad
        </span>
        <button
          onClick={() => setIsEditingPin(!isEditingPin)}
          className="text-xs text-[#007A55] font-bold hover:underline cursor-pointer"
        >
          {isEditingPin ? 'Cancelar' : 'Cambiar PIN'}
        </button>
      </div>

      {!isEditingPin ? (
        <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#007A55] border border-emerald-100">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-900">PIN de acceso activo</p>
              <p className="text-[11px] text-slate-500">Protege la administración de tu local</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
            {tenant.admin_pin || '----'}
          </span>
        </div>
      ) : (
        <form onSubmit={handleUpdatePin} className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nuevo PIN de Seguridad</label>
            <input
              type="text"
              required
              maxLength={10}
              placeholder="Ej. 1234"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#007A55] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#007A55] hover:bg-[#006344] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-2xs active:scale-[0.98] disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
          >
            {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Guardar Nuevo PIN</span>
          </button>
        </form>
      )}
    </div>
  );
}