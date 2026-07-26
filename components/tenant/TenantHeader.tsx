'use client';

import { Tenant } from '@/types';
import { Clock, MapPin, CalendarDays } from 'lucide-react';

interface TenantHeaderProps {
  tenant: Tenant;
  isOpen: boolean;
}

const formatTime12h = (timeStr: string) => {
  if (!timeStr) return '';
  const [hourStr, minuteStr] = timeStr.split(':');
  const hour = parseInt(hourStr, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const formattedHour = hour % 12 || 12;
  return `${formattedHour}:${minuteStr} ${ampm}`;
};

const formatWorkingDays = (days: number[] | undefined | null) => {
  if (!days || days.length === 7) return 'Todos los días';
  const daysMap: Record<number, string> = { 1: 'L', 2: 'M', 3: 'M', 4: 'J', 5: 'V', 6: 'S', 0: 'D' };
  const sorted = [...days].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
  return sorted.map(d => daysMap[d]).join('-');
};

export function TenantHeader({ tenant, isOpen }: TenantHeaderProps) {
  const initialLetter = tenant.name ? tenant.name.charAt(0).toUpperCase() : 'V';
  const tenantLogo = (tenant as Tenant & { logo_url?: string }).logo_url;

  return (
    <div className="bg-white rounded-3xl p-5 shadow-xl shadow-slate-200/50 border border-slate-100 space-y-4">
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-black text-xl shadow-xs shrink-0 border border-emerald-100 overflow-hidden">
          {tenantLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tenantLogo} alt={tenant.name} className="w-full h-full object-cover" />
          ) : (
            initialLetter
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <h1 className="text-xl font-black text-slate-900 tracking-tight break-words">{tenant.name}</h1>
            <span
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 flex items-center gap-1.5 shadow-2xs ${
                isOpen
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                  : 'bg-rose-50 text-rose-600 border border-rose-100'
              }`}
            >
              {isOpen && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </div>

          {tenant.description && (
            <p className="text-xs text-slate-500 font-normal leading-relaxed">
              {tenant.description}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
        <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-100/80">
          <span className="text-slate-400 font-medium flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" /> Horario
          </span>
          <span className="font-bold text-slate-800">
            {formatTime12h(tenant.opening_time)} - {formatTime12h(tenant.closing_time)}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100/80">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Zona
            </span>
            <span className="font-bold text-slate-800 truncate">Valle Real</span>
          </div>

          <div className="flex items-center justify-between bg-slate-50 p-2.5 rounded-2xl border border-slate-100/80">
            <span className="text-slate-400 font-medium flex items-center gap-1.5">
              <CalendarDays className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> Días
            </span>
            <span className="font-bold text-slate-800 truncate">{formatWorkingDays(tenant.working_days)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}