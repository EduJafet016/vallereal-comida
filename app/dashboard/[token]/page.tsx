'use client';

import { use } from 'react';
import { useTenantDashboard } from '@/hooks/useTenantDashboard';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PinAuthCard } from '@/components/dashboard/PinAuthCard';
import { TenantSettingsCard } from '@/components/dashboard/TenantSettingsCard';
import { TenantLinksCard } from '@/components/dashboard/TenantLinksCard';
import { SecurityCard } from '@/components/dashboard/SecurityCard';
import { ProductsSection } from '@/components/dashboard/ProductsSection';
import { DeleteTenantModal } from '@/components/dashboard/DeleteTenantModal';
import { GlobalIngredientsCard } from '@/components/dashboard/GlobalIngredientsCard';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function TenantDashboardPage({ params }: PageProps) {
  const { token } = use(params);

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

  if (loadingTenant) {
    return <div className="p-8 text-center text-sm text-gray-500">Cargando panel...</div>;
  }

  if (tenantError || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso Denegado 🔒</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          El token de administración es inválido o no existe.
        </p>
      </div>
    );
  }

  return (
    <main className="p-4 max-w-lg mx-auto min-h-screen bg-gray-50 space-y-6">
      <DashboardHeader tenantName={tenant.name} />

      {!isAuthenticated ? (
        <PinAuthCard
          tenant={tenant}
          token={token}
          onAuthenticated={() => setIsAuthenticated(true)}
        />
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
        </>
      )}
    </main>
  );
}