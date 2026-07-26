'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTenantDashboard } from '@/hooks/useTenantDashboard';

import { PinAuthCard } from '@/components/dashboard/PinAuthCard';
import { TenantSettingsCard } from '@/components/dashboard/TenantSettingsCard';
import { TenantLinksCard } from '@/components/dashboard/TenantLinksCard';
import { SecurityCard } from '@/components/dashboard/SecurityCard';
import { ProductsSection } from '@/components/dashboard/ProductsSection';
import { DeleteTenantModal } from '@/components/dashboard/DeleteTenantModal';
import { GlobalIngredientsCard } from '@/components/dashboard/GlobalIngredientsCard';
import { ShieldCheck, ArrowLeft, LogOut } from 'lucide-react';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function TenantDashboardPage({ params }: PageProps) {
  const { token } = use(params);
  const router = useRouter();

  const {
    tenant,
    setTenant,
    loadingTenant,
    tenantError,
    isAuthenticated,
    setIsAuthenticated,
    categories,
    products,
    loadingProducts,
    reloadProducts,
  } = useTenantDashboard(token);

  // Validar persistencia de sesión al montar o cambiar el token
  useEffect(() => {
    const hasSession =
      localStorage.getItem(`auth_token_${token}`) === 'true' ||
      sessionStorage.getItem(`auth_token_${token}`) === 'true';

    if (hasSession) {
      setIsAuthenticated(true);
    }
  }, [token, setIsAuthenticated]);

  const handleLogout = () => {
    localStorage.removeItem(`auth_token_${token}`);
    sessionStorage.removeItem(`auth_token_${token}`);
    localStorage.removeItem('current_tenant_token');
    sessionStorage.removeItem('current_tenant_token');
    setIsAuthenticated(false);
    router.push('/');
  };

  if (loadingTenant) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white px-6 py-4 rounded-2xl border border-slate-200/80 shadow-2xs text-xs font-semibold text-slate-500 animate-pulse">
          Cargando panel de administración...
        </div>
      </div>
    );
  }

  if (tenantError || !tenant) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm text-center max-w-xs space-y-3">
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto text-xl">
            🔒
          </div>
          <h2 className="text-base font-bold text-slate-900">Acceso Denegado</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            El token de administración es inválido o no existe.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/80 flex flex-col items-center">
      {/* Contenedor Vista App Móvil Centrada */}
      <main className="w-full max-w-md bg-slate-50 min-h-screen border-x border-slate-200/70 shadow-sm flex flex-col pb-12">
        
        {/* Banner Hero Superior */}
        <header className="bg-[#007A55] text-white p-5 pt-6 rounded-b-[2rem] shadow-sm space-y-3 relative overflow-hidden shrink-0">
          <div className="flex items-center justify-between relative z-10">
            {/* BOTÓN REGRESAR AL INICIO */}
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 hover:bg-white/25 backdrop-blur-md text-white border border-white/10 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Regresar
            </button>

            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-100 border border-emerald-400/30">
              <ShieldCheck className="w-3 h-3 text-emerald-300" />
              Acceso Directo
            </span>
          </div>

          <div className="relative z-10 pt-1">
            <h1 className="text-2xl font-black tracking-tight text-white leading-tight">
              {tenant.name}
            </h1>
            <p className="text-xs text-emerald-100/80 mt-0.5 font-medium">
              Gestión de pedidos, logística y menú
            </p>
          </div>

          <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
        </header>

        {/* Cuerpo del Panel */}
        <div className="p-4 space-y-4 flex-1">
          {!isAuthenticated ? (
            <div className="pt-4">
              <PinAuthCard
                tenant={tenant}
                token={token}
                onAuthenticated={() => setIsAuthenticated(true)}
              />
            </div>
          ) : (
            <>
              <TenantSettingsCard
                tenant={tenant}
                onTenantUpdated={(updated) => setTenant(updated)}
              />

              <TenantLinksCard tenant={tenant} />

              <SecurityCard
                tenant={tenant}
                onPinUpdated={(newPin) => setTenant({ ...tenant, admin_pin: newPin })}
              />

              <GlobalIngredientsCard tenantId={tenant.id} />

              <ProductsSection
                tenant={tenant}
                categories={categories}
                products={products}
                loading={loadingProducts}
                onReload={reloadProducts}
              />

              <DeleteTenantModal tenant={tenant} token={token} />

              {/* Botón de Cerrar Sesión Adicional al final */}
              <div className="pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200/60 font-bold py-3.5 rounded-2xl text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  Cerrar Sesión en este Equipo
                </button>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}