'use client';

import { Store } from 'lucide-react';

interface Props {
  tenantName: string;
}

export function DashboardHeader({ tenantName }: Props) {
  return (
    <header className="border-b pb-4 mb-6 bg-white p-4 rounded-2xl shadow-sm">
      <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <Store className="w-5 h-5 text-emerald-600" /> {tenantName}
      </h1>
      <p className="text-xs text-gray-500">Panel de Administración Directa</p>
    </header>
  );
}