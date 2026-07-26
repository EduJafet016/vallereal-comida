'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store } from 'lucide-react';

interface HeaderActionsProps {
  onOpenModal: () => void;
}

export function HeaderActions({ onOpenModal }: HeaderActionsProps) {
  const router = useRouter();

  // Lazy initialization para detectar si hay una sesión activa en localStorage o sessionStorage
  const [activeDashboardUrl] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('auth_token_') && localStorage.getItem(key) === 'true') {
        const token = key.replace('auth_token_', '');
        return `/dashboard/${token}`;
      }
    }
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key?.startsWith('auth_token_') && sessionStorage.getItem(key) === 'true') {
        const token = key.replace('auth_token_', '');
        return `/dashboard/${token}`;
      }
    }
    return null;
  });

  return (
    <div>
      {activeDashboardUrl ? (
        <button
          onClick={() => router.push(activeDashboardUrl)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          <Store className="w-4 h-4" /> Mi Panel
        </button>
      ) : (
        <button
          onClick={onOpenModal}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
        >
          Comerciantes
        </button>
      )}
    </div>
  );
}