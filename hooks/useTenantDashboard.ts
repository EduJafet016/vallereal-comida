'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant, Product, Category } from '@/types';

export function useTenantDashboard(token: string) {
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

  // 3. Recargar productos e ingredientes/modificadores
  const reloadProducts = useCallback(async () => {
    if (!tenant) return;

    setLoadingProducts(true);

    const [{ data: catData }, { data: prodData }] = await Promise.all([
      supabase.from('categories').select('*').eq('tenant_id', tenant.id).order('sort_order'),
      supabase.from('products').select('*, categories(name), modifier_groups(id)').eq('tenant_id', tenant.id).order('category_id'),
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

  return {
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
  };
}