'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant } from '@/types';
import { Settings, Truck } from 'lucide-react';

interface Props {
  tenant: Tenant;
  onTenantUpdated: (updated: Tenant) => void;
}

export function TenantSettingsCard({ tenant, onTenantUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editName, setEditName] = useState(tenant.name || '');
  const [editDescription, setEditDescription] = useState(tenant.description || '');
  const [editWhatsapp, setEditWhatsapp] = useState(tenant.whatsapp_number || '');
  const [editOpeningTime, setEditOpeningTime] = useState(tenant.opening_time || '09:00');
  const [editClosingTime, setEditClosingTime] = useState(tenant.closing_time || '21:00');
  const [editFeeLow, setEditFeeLow] = useState(tenant.delivery_fee_low_zone?.toString() ?? '10');
  const [editFeeHigh, setEditFeeHigh] = useState(tenant.delivery_fee_high_zone?.toString() ?? '20');
  const [editEnableFree, setEditEnableFree] = useState(tenant.enable_free_delivery ?? true);
  const [editFreeMinAmount, setEditFreeMinAmount] = useState(tenant.free_delivery_min_amount?.toString() ?? '150');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = editWhatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('Ingresa un número de WhatsApp válido.');
      return;
    }

    setSaving(true);

    const updatedFields = {
      name: editName.trim(),
      description: editDescription.trim() || null,
      whatsapp_number: cleanPhone,
      opening_time: editOpeningTime,
      closing_time: editClosingTime,
      delivery_fee_low_zone: parseFloat(editFeeLow) || 0,
      delivery_fee_high_zone: parseFloat(editFeeHigh) || 0,
      enable_free_delivery: editEnableFree,
      free_delivery_min_amount: parseFloat(editFreeMinAmount) || 0,
    };

    const { error } = await supabase
      .from('tenants')
      .update(updatedFields)
      .eq('id', tenant.id);

    if (error) {
      alert(`Error al actualizar: ${error.message}`);
    } else {
      onTenantUpdated({
        ...tenant,
        ...updatedFields,
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    }
    setSaving(false);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
      <div className="flex justify-between items-center border-b pb-2">
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <Settings className="w-4 h-4 text-emerald-600" /> Datos y Envíos
        </span>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs text-emerald-600 font-semibold hover:underline"
        >
          {isEditing ? 'Cancelar' : 'Editar Información'}
        </button>
      </div>

      {!isEditing ? (
        <div className="text-xs space-y-2 text-gray-700">
          <p><strong className="text-gray-900">Nombre:</strong> {tenant.name}</p>
          <p><strong className="text-gray-900">Descripción:</strong> {tenant.description || 'Sin descripción'}</p>
          <p><strong className="text-gray-900">WhatsApp:</strong> {tenant.whatsapp_number}</p>
          <p><strong className="text-gray-900">Horario:</strong> {tenant.opening_time.slice(0, 5)} - {tenant.closing_time.slice(0, 5)} hrs</p>
          
          <div className="pt-2 border-t mt-2 space-y-1 bg-gray-50 p-2.5 rounded-xl border">
            <span className="font-bold text-gray-900 flex items-center gap-1">
              <Truck className="w-3.5 h-3.5 text-emerald-600" /> Logística de Envío
            </span>
            <p>• Parte Baja: <strong>${tenant.delivery_fee_low_zone ?? 10}.00</strong></p>
            <p>• Parte Alta: <strong>${tenant.delivery_fee_high_zone ?? 20}.00</strong></p>
            <p>
              • Envío Gratis:{' '}
              <strong>
                {tenant.enable_free_delivery
                  ? `A partir de $${tenant.free_delivery_min_amount}.00`
                  : 'Desactivado'}
              </strong>
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3 pt-1">
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Nombre</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">Descripción Corta</label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1">WhatsApp de Pedidos</label>
            <input
              type="tel"
              required
              value={editWhatsapp}
              onChange={(e) => setEditWhatsapp(e.target.value.replace(/\D/g, ''))}
              className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Apertura</label>
              <input
                type="time"
                value={editOpeningTime}
                onChange={(e) => setEditOpeningTime(e.target.value)}
                className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 block mb-1">Cierre</label>
              <input
                type="time"
                value={editClosingTime}
                onChange={(e) => setEditClosingTime(e.target.value)}
                className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2 border-t space-y-2">
            <span className="text-xs font-bold text-gray-800 block">Costos de Envío por Zona</span>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Parte Baja ($)</label>
                <input
                  type="number"
                  min="0"
                  value={editFeeLow}
                  onChange={(e) => setEditFeeLow(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Parte Alta ($)</label>
                <input
                  type="number"
                  min="0"
                  value={editFeeHigh}
                  onChange={(e) => setEditFeeHigh(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={editEnableFree}
                onChange={(e) => setEditEnableFree(e.target.checked)}
                className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded"
              />
              <span className="text-xs font-semibold text-gray-800">
                Ofrecer Envío Gratis por consumo mínimo
              </span>
            </label>

            {editEnableFree && (
              <div>
                <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Monto mínimo ($)</label>
                <input
                  type="number"
                  min="0"
                  value={editFreeMinAmount}
                  onChange={(e) => setEditFreeMinAmount(e.target.value)}
                  className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      )}
    </div>
  );
}