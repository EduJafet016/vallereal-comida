'use client';

import { useState } from 'react';
import { Tenant } from '@/types';
import { Link2, Copy, Check, ExternalLink } from 'lucide-react';

interface Props {
  tenant: Tenant;
}

export function TenantLinksCard({ tenant }: Props) {
  const [copiedAdmin, setCopiedAdmin] = useState(false);
  const [copiedPublic, setCopiedPublic] = useState(false);

  const adminUrl = typeof window !== 'undefined' ? `${window.location.origin}/dashboard/${tenant.admin_token}` : '';
  const publicUrl = typeof window !== 'undefined' ? `${window.location.origin}/${tenant.slug}` : '';

  const handleCopy = (text: string, type: 'admin' | 'public') => {
    navigator.clipboard.writeText(text);
    if (type === 'admin') {
      setCopiedAdmin(true);
      setTimeout(() => setCopiedAdmin(false), 2000);
    } else {
      setCopiedPublic(true);
      setTimeout(() => setCopiedPublic(false), 2000);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Link2 className="w-3.5 h-3.5 text-[#007A55]" /> Enlaces de tu negocio
        </span>
      </div>

      <div className="space-y-3">
        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Panel de administración (Privado)</span>
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              readOnly
              value={adminUrl}
              className="w-full bg-white border border-slate-200 text-slate-600 text-xs px-2.5 py-1.5 rounded-lg font-mono truncate focus:outline-none"
            />
            <button
              onClick={() => handleCopy(adminUrl, 'admin')}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
            >
              {copiedAdmin ? <Check className="w-3.5 h-3.5 text-[#007A55]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedAdmin ? 'Copiado' : 'Copiar'}</span>
            </button>
          </div>
        </div>

        <div className="bg-slate-50/70 p-3 rounded-xl border border-slate-200/70 space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Menú para clientes (Público)</span>
          <div className="flex items-center justify-between gap-2">
            <input
              type="text"
              readOnly
              value={publicUrl}
              className="w-full bg-white border border-slate-200 text-slate-600 text-xs px-2.5 py-1.5 rounded-lg font-mono truncate focus:outline-none"
            />
            <button
              onClick={() => handleCopy(publicUrl, 'public')}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs"
            >
              {copiedPublic ? <Check className="w-3.5 h-3.5 text-[#007A55]" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copiedPublic ? 'Copiado' : 'Copiar'}</span>
            </button>
            <a
              href={`/${tenant.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 text-[#007A55] rounded-lg transition-all shrink-0 shadow-2xs"
              title="Abrir menú"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}