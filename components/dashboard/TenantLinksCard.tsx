'use client';

import { useState } from 'react';
import { Tenant } from '@/types';
import { Share2, Check, Copy, ExternalLink } from 'lucide-react';

interface Props {
  tenant: Tenant;
}

export function TenantLinksCard({ tenant }: Props) {
  const [copiedDashboard, setCopiedDashboard] = useState(false);
  const [copiedMenu, setCopiedMenu] = useState(false);

  const dashboardUrl = typeof window !== 'undefined' ? window.location.href : '';
  const menuUrl = typeof window !== 'undefined' ? `${window.location.origin}/${tenant.slug}` : '';

  const copyDashboardLink = () => {
    if (!dashboardUrl) return;
    navigator.clipboard.writeText(dashboardUrl);
    setCopiedDashboard(true);
    setTimeout(() => setCopiedDashboard(false), 3000);
  };

  const copyMenuLink = () => {
    if (!menuUrl) return;
    navigator.clipboard.writeText(menuUrl);
    setCopiedMenu(true);
    setTimeout(() => setCopiedMenu(false), 3000);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
      <div className="flex items-center gap-2 border-b pb-2">
        <Share2 className="w-4 h-4 text-emerald-600" />
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
          Enlaces de tu Negocio
        </h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl border text-xs">
          <div className="truncate pr-2">
            <span className="block text-[10px] font-bold text-gray-400 uppercase">
              Panel de Administración (Privado)
            </span>
            <span className="font-mono text-gray-700 truncate block">
              {dashboardUrl}
            </span>
          </div>
          <button
            onClick={copyDashboardLink}
            className="px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center gap-1 shrink-0 transition-all active:scale-95"
          >
            {copiedDashboard ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
            {copiedDashboard ? 'Copiado' : 'Copiar'}
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl border text-xs">
          <div className="truncate pr-2">
            <span className="block text-[10px] font-bold text-gray-400 uppercase">
              Menú para Clientes (Público)
            </span>
            <span className="font-mono text-gray-700 truncate block">
              /{tenant.slug}
            </span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={copyMenuLink}
              className="px-2.5 py-1.5 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center gap-1 transition-all active:scale-95"
            >
              {copiedMenu ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
              {copiedMenu ? 'Copiado' : 'Copiar'}
            </button>
            <a
              href={menuUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all"
              title="Ver menú público"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}