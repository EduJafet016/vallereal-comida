'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant } from '@/types';
import Link from 'next/link';
import { Store, ChevronRight } from 'lucide-react';
import { isStoreOpen } from '@/lib/utils';

export default function RootHomePage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTenants() {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('is_active', true);

        if (error) throw error;
        setTenants(data || []);
      } catch (err) {
        console.error('Error cargando locales:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchTenants();
  }, []);

  return (
    <main className="p-6 max-w-md mx-auto min-h-screen bg-gray-50">
      <header className="text-center my-8">
        <h1 className="text-2xl font-black text-gray-900">Valle Real Comida</h1>
        <p className="text-xs text-gray-500 mt-1">
          Pide directamente a tus locales favoritos sin comisiones
        </p>
      </header>

      <section>
        <div className="flex justify-between items-center mb-4 px-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Locales Disponibles
          </h2>
          <Link
            href="/registro"
            className="text-xs font-semibold text-emerald-600 hover:underline"
          >
            Registrar mi local
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-8 text-sm text-gray-400">Cargando directorio...</div>
        ) : tenants.length === 0 ? (
          <div className="text-center py-8 text-sm text-gray-500 bg-white rounded-2xl border p-6">
            No hay locales registrados aún.
          </div>
        ) : (
          <div className="space-y-3">
            {tenants.map((tenant) => {
              const isOpen = isStoreOpen(tenant.opening_time, tenant.closing_time);

              return (
                <Link
                  key={tenant.id}
                  href={`/${tenant.slug}`}
                  className="flex items-center justify-between p-4 border rounded-2xl shadow-sm bg-white hover:border-emerald-300 active:scale-[0.99] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-2">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                      <Store className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-sm truncate">
                          {tenant.name}
                        </h3>

                        {/* BADGE DE ABIERTO / CERRADO */}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isOpen
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {isOpen ? 'Abierto' : 'Cerrado'}
                        </span>
                      </div>

                      {tenant.description && (
                        <p className="text-xs text-gray-500 font-normal line-clamp-1 mt-0.5">
                          {tenant.description}
                        </p>
                      )}

                      <span className="text-[11px] text-gray-400 block mt-0.5">
                        Horario: {tenant.opening_time.slice(0, 5)} - {tenant.closing_time.slice(0, 5)}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0" />
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}