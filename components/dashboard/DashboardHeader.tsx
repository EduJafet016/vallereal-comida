'use client';

import Link from 'next/link';
import { Store, ArrowLeft } from 'lucide-react';

interface Props {
  tenantName: string;
  backUrl?: string; // Opcional: por si quieres definir la ruta a donde regresa (ej. /master-admin)
}

export function DashboardHeader({ tenantName, backUrl = '/master-admin' }: Props) {
  return (
    <header className="border-b pb-4 mb-6 bg-white p-4 rounded-2xl shadow-sm flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* BOTÓN VOLVER */}
        <Link
          href={backUrl}
          className="p-2 bg-gray-50 hover:bg-gray-100 border text-gray-600 rounded-xl transition-all active:scale-95 flex items-center justify-center shrink-0"
          title="Volver a los restaurantes"
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
    </header>
  );
}