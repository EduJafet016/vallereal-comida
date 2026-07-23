'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant } from '@/types';
import { AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  tenant: Tenant;
  token: string;
}

export function DeleteTenantModal({ tenant, token }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [deletePinConfirm, setDeletePinConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDeleteTenant = async () => {
    if (deletePinConfirm !== (tenant as any).admin_pin) {
      alert('El PIN de confirmación es incorrecto.');
      return;
    }

    setDeleting(true);

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenant.id);

      if (error) throw error;

      alert('Tu restaurante ha sido eliminado correctamente.');
      localStorage.removeItem(`auth_token_${token}`);
      window.location.href = '/';
    } catch (err: any) {
      alert(`Error al eliminar: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 space-y-3">
        <div className="flex items-center gap-2 border-b border-red-100 pb-2 text-red-700">
          <AlertTriangle className="w-4 h-4" />
          <h3 className="text-xs font-bold uppercase tracking-wider">Zona de Peligro</h3>
        </div>
        <p className="text-xs text-gray-600">
          Si eliminas este local, perderás de forma permanente tu menú, platillos y configuraciones.
        </p>
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
        >
          <Trash2 className="w-4 h-4" /> Eliminar Restaurante
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl space-y-4 border">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-gray-900 text-base">¿Eliminar {tenant.name}?</h3>
              <p className="text-xs text-gray-500">
                Esta acción es <strong className="text-red-600">irreversible</strong>.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1 text-center">
                Escribe tu PIN para confirmar:
              </label>
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                value={deletePinConfirm}
                onChange={(e) => setDeletePinConfirm(e.target.value.replace(/\D/g, ''))}
                placeholder="••••"
                className="w-full p-3 border rounded-xl text-center text-lg font-mono font-bold tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setDeletePinConfirm('');
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteTenant}
                disabled={deleting || deletePinConfirm.length !== 4}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}