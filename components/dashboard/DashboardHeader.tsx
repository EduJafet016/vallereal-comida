'use client';

import Link from 'next/link';
import { Store, ArrowLeft, ExternalLink } from 'lucide-react';

interface Props {
  tenantName: string;
  slug?: string;
  isSuperAdmin?: boolean;
}

export function DashboardHeader({ tenantName, slug, isSuperAdmin }: Props) {
  // Si no hay slug o es superadmin, regresa a la raíz o al panel máster
  const backUrl = isSuperAdmin 
    ? '/master-admin' 
    : slug 
      ? `/${slug}` 
      : '/';

  return (
    <header className="border-b pb-4 mb-6 bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link
          href={backUrl}
          className="p-2 bg-gray-50 hover:bg-gray-100 border text-gray-600 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
          title="Volver"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>

        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" /> {tenantName}
          </h1>
          <p className="text-xs text-gray-500">Panel de Administración Directa</p>
        </div>
      </div>

      {slug && (
        <Link
          href={`/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-emerald-600 font-bold flex items-center gap-1 hover:underline"
        >
          <span>Tienda</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      )}
    </header>
  );
}