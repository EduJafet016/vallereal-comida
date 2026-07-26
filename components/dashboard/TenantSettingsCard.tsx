'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant } from '@/types';
import { Truck, Power, Loader2, Upload, Settings } from 'lucide-react';
import { TenantScheduleInputs } from './TenantScheduleInputs';
import { TenantDeliveryInputs } from './TenantDeliveryInputs';

interface Props {
  tenant: Tenant;
  onTenantUpdated: (updated: Tenant) => void;
}

const WEEK_DAYS = [
  { id: 1, label: 'L' },
  { id: 2, label: 'M' },
  { id: 3, label: 'M' },
  { id: 4, label: 'J' },
  { id: 5, label: 'V' },
  { id: 6, label: 'S' },
  { id: 0, label: 'D' },
];

export function TenantSettingsCard({ tenant, onTenantUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  // Form states
  const [editIsActive, setEditIsActive] = useState(tenant.is_active ?? true);
  const [editName, setEditName] = useState(tenant.name || '');
  const [editDescription, setEditDescription] = useState(tenant.description || '');
  const [editWhatsapp, setEditWhatsapp] = useState(tenant.whatsapp_number || '');
  const [editOpeningTime, setEditOpeningTime] = useState(tenant.opening_time || '09:00');
  const [editClosingTime, setEditClosingTime] = useState(tenant.closing_time || '21:00');
  const [editFeeLow, setEditFeeLow] = useState(tenant.delivery_fee_low_zone?.toString() ?? '10');
  const [editFeeHigh, setEditFeeHigh] = useState(tenant.delivery_fee_high_zone?.toString() ?? '20');
  const [editEnableFree, setEditEnableFree] = useState(tenant.enable_free_delivery ?? true);
  const [editFreeMinAmount, setEditFreeMinAmount] = useState(tenant.free_delivery_min_amount?.toString() ?? '150');
  
  const [editWorkingDays, setEditWorkingDays] = useState<number[]>(
    tenant.working_days ?? [0, 1, 2, 3, 4, 5, 6]
  );

  const isActive = tenant.is_active ?? true;
  const tenantLogo = (tenant as Tenant & { logo_url?: string }).logo_url;
  const initialLetter = tenant.name ? tenant.name.charAt(0).toUpperCase() : 'V';

  const handleQuickStatusToggle = async () => {
    setTogglingStatus(true);
    const nextState = !tenant.is_active;

    const { error } = await supabase
      .from('tenants')
      .update({ is_active: nextState })
      .eq('id', tenant.id);

    if (error) {
      alert(`Error al actualizar estado: ${error.message}`);
    } else {
      const updated = { ...tenant, is_active: nextState };
      setEditIsActive(nextState);
      onTenantUpdated(updated);
    }
    setTogglingStatus(false);
  };

  const toggleWorkingDay = (dayId: number) => {
    setEditWorkingDays(prev => 
      prev.includes(dayId) 
        ? prev.filter(d => d !== dayId) 
        : [...prev, dayId]
    );
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadingLogo(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${tenant.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('tenant-logos')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('tenant-logos')
        .getPublicUrl(filePath);

      const publicUrl = publicUrlData.publicUrl;

      const { error: updateError } = await supabase
        .from('tenants')
        .update({ logo_url: publicUrl })
        .eq('id', tenant.id);

      if (updateError) throw updateError;

      onTenantUpdated({ ...tenant, logo_url: publicUrl } as Tenant);
    } catch (error) {
      console.error('Error al subir el logotipo:', error);
      alert('Hubo un error al subir la imagen. Verifica tu conexión o intenta más tarde.');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = editWhatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('Ingresa un número de WhatsApp válido.');
      return;
    }

    if (editWorkingDays.length === 0) {
      alert('Debes seleccionar al menos un día de trabajo.');
      return;
    }

    setSaving(true);

    const updatedFields = {
      is_active: editIsActive,
      name: editName.trim(),
      description: editDescription.trim() || null,
      whatsapp_number: cleanPhone,
      opening_time: editOpeningTime,
      closing_time: editClosingTime,
      working_days: editWorkingDays,
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
      const finalUpdatedTenant = {
        ...tenant,
        ...updatedFields,
        description: editDescription.trim() || undefined,
      };
      onTenantUpdated(finalUpdatedTenant);
      setIsEditing(false);
    }
    setSaving(false);
  };

  const renderActiveDays = () => {
    const activeDays = tenant.working_days ?? [0, 1, 2, 3, 4, 5, 6];
    if (activeDays.length === 7) return 'Lunes a Domingo';
    return WEEK_DAYS.filter(d => activeDays.includes(d.id)).map(d => d.label).join(' - ');
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Settings className="w-3.5 h-3.5 text-[#007A55]" /> Datos y Envíos
        </span>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-xs text-[#007A55] font-bold hover:underline cursor-pointer"
        >
          {isEditing ? 'Cancelar' : 'Editar Información'}
        </button>
      </div>

      {!isEditing ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#007A55] flex items-center justify-center font-black text-xl shadow-2xs shrink-0 border border-emerald-100/80 overflow-hidden">
              {tenantLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={tenantLogo} alt={tenant.name} className="w-full h-full object-cover" />
              ) : (
                initialLetter
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">{tenant.name}</p>
              <p className="text-xs text-slate-500 line-clamp-1">{tenant.description || 'Sin descripción'}</p>
            </div>
          </div>

          <div className="bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className={`p-2 rounded-xl border ${
                  isActive
                    ? 'bg-emerald-100/70 text-[#007A55] border-emerald-200'
                    : 'bg-red-50 text-red-600 border-red-200'
                }`}
              >
                <Power className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900">
                  Estado: <span className={isActive ? 'text-[#007A55]' : 'text-red-600'}>{isActive ? 'Abierto' : 'Cerrado'}</span>
                </p>
                <p className="text-[11px] text-slate-500">
                  {isActive ? 'Recibiendo pedidos' : 'Pedidos pausados'}
                </p>
              </div>
            </div>

            <button
              onClick={handleQuickStatusToggle}
              disabled={togglingStatus}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all border flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                isActive
                  ? 'bg-[#007A55] text-white border-[#007A55] hover:bg-[#006344]'
                  : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
              }`}
            >
              {togglingStatus && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{isActive ? '● En Servicio' : '○ Fuera de Servicio'}</span>
            </button>
          </div>

          <div className="text-xs space-y-2 text-slate-600 bg-slate-50/40 p-3.5 rounded-xl border border-slate-200/60">
            <p><strong className="text-slate-800">WhatsApp:</strong> {tenant.whatsapp_number}</p>
            <p><strong className="text-slate-800">Días Laborales:</strong> {renderActiveDays()}</p>
            <p><strong className="text-slate-800">Horario:</strong> {tenant.opening_time?.slice(0, 5)} - {tenant.closing_time?.slice(0, 5)} hrs</p>

            <div className="pt-2 border-t border-slate-200/60 mt-2 space-y-1">
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-[#007A55]" /> Logística de Envío
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
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-3 pt-1">
          <div className="flex items-center gap-4 p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#007A55] flex items-center justify-center font-black text-xl shrink-0 border border-emerald-100 overflow-hidden shadow-2xs">
              {tenantLogo ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={tenantLogo} alt={tenant.name} className="w-full h-full object-cover" />
              ) : (
                initialLetter
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
              <p className="text-xs font-bold text-slate-800">Logotipo del Local</p>
              <label className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer ${
                uploadingLogo ? 'bg-slate-200 text-slate-400 pointer-events-none' : 'bg-white text-[#007A55] border border-emerald-200 hover:bg-emerald-50 shadow-2xs'
              }`}>
                {uploadingLogo ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Subiendo...</>
                ) : (
                  <><Upload className="w-3.5 h-3.5" /> Cambiar imagen</>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleLogoUpload} 
                  disabled={uploadingLogo} 
                  className="hidden" 
                />
              </label>
            </div>
          </div>

          <div className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">Recibir Pedidos (Apertura)</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#007A55]"></div>
            </label>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Nombre</label>
            <input
              type="text"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#007A55] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Descripción Corta</label>
            <input
              type="text"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#007A55] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">WhatsApp de Pedidos</label>
            <input
              type="tel"
              required
              value={editWhatsapp}
              onChange={(e) => setEditWhatsapp(e.target.value.replace(/\D/g, ''))}
              className="w-full p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#007A55] focus:outline-none"
            />
          </div>

          <TenantScheduleInputs
            editOpeningTime={editOpeningTime}
            setEditOpeningTime={setEditOpeningTime}
            editClosingTime={editClosingTime}
            setEditClosingTime={setEditClosingTime}
            editWorkingDays={editWorkingDays}
            toggleWorkingDay={toggleWorkingDay}
            weekDays={WEEK_DAYS}
          />

          <TenantDeliveryInputs
            editFeeLow={editFeeLow}
            setEditFeeLow={setEditFeeLow}
            editFeeHigh={editFeeHigh}
            setEditFeeHigh={setEditFeeHigh}
            editEnableFree={editEnableFree}
            setEditEnableFree={setEditEnableFree}
            editFreeMinAmount={editFreeMinAmount}
            setEditFreeMinAmount={setEditFreeMinAmount}
          />

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#007A55] hover:bg-[#006344] text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-2xs active:scale-[0.98] disabled:opacity-50 mt-2 cursor-pointer"
          >
            {saving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      )}
    </div>
  );
}