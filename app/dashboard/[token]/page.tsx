'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant, Product, Category } from '@/types';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { PinAuthCard } from '@/components/dashboard/PinAuthCard';
import { TenantSettingsCard } from '@/components/dashboard/TenantSettingsCard';
import { TenantLinksCard } from '@/components/dashboard/TenantLinksCard';
import { SecurityCard } from '@/components/dashboard/SecurityCard';
import { ProductsSection } from '@/components/dashboard/ProductsSection';
import { DeleteTenantModal } from '@/components/dashboard/DeleteTenantModal';

interface PageProps {
  params: Promise<{ token: string }>;
}

export default function TenantDashboardPage({ params }: PageProps) {
  const { token } = use(params);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [tenantError, setTenantError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // 1. Obtener datos del Tenant
  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    async function fetchTenantByToken() {
      try {
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('admin_token', token)
          .single();

        if (cancelled) return;

        if (error || !data) {
          setTenantError(true);
          return;
        }

        setTenant(data);

        const savedAuth = localStorage.getItem(`auth_token_${token}`);
        if (savedAuth === 'true') {
          setIsAuthenticated(true);
        }
      } catch {
        if (!cancelled) setTenantError(true);
      } finally {
        if (!cancelled) setLoadingTenant(false);
      }
    }

    void fetchTenantByToken();

    return () => {
      cancelled = true;
    };
  }, [token]);

  // 2. Bypass automático para SuperAdmin y token con PIN en URL
  useEffect(() => {
    if (!tenant) return;

    const checkAutoUnlock = async () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const pinFromUrl = urlParams.get('pin');

        if (pinFromUrl && pinFromUrl === tenant.admin_pin) {
          setIsAuthenticated(true);
          localStorage.setItem(`auth_token_${token}`, 'true');
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.app_metadata?.role === 'superadmin') {
        setIsAuthenticated(true);
        localStorage.setItem(`auth_token_${token}`, 'true');
      }
    };

    checkAutoUnlock();
  }, [tenant, token]);

  const reloadProducts = useCallback(async () => {
    if (!tenant) return;

    setLoadingProducts(true);

    const [{ data: catData }, { data: prodData }] = await Promise.all([
      supabase.from('categories').select('*').eq('tenant_id', tenant.id).order('sort_order'),
      supabase.from('products').select('*, categories(name)').eq('tenant_id', tenant.id).order('category_id'),
    ]);

    setCategories(catData || []);
    setProducts(prodData || []);
    setLoadingProducts(false);
  }, [tenant]);

  useEffect(() => {
    if (!tenant || !isAuthenticated) return;

    queueMicrotask(() => {
      void reloadProducts();
    });
  }, [tenant, isAuthenticated, reloadProducts]);

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