import { Tenant, Product } from '@/types';

export interface TenantHealth {
  score: number;
  status: 'active' | 'pending';
  missingItems: string[];
}

export function calculateTenantCompleteness(tenant: Tenant, products: Partial<Product>[]): TenantHealth {
  let score = 0;
  const missingItems: string[] = [];

  if (tenant.name && tenant.name.trim() !== '') {
    score += 20;
  } else {
    missingItems.push('Nombre del restaurante');
  }

  const tenantRecord = tenant as unknown as Record<string, unknown>;
  const tenantImage = tenantRecord.logo_url || tenantRecord.image_url || tenantRecord.image;
  
  if (typeof tenantImage === 'string' && tenantImage.trim() !== '') {
    score += 20;
  } else {
    missingItems.push('Logo o imagen de perfil');
  }

  if (tenant.opening_time && tenant.closing_time) {
    score += 20;
  } else {
    missingItems.push('Horarios de apertura');
  }

  const hasProducts = products.some(p => p.tenant_id === tenant.id || products.length > 0);
  if (hasProducts) {
    score += 40;
  } else {
    missingItems.push('Al menos un platillo en el menú');
  }

  return {
    score,
    status: hasProducts && score >= 60 ? 'active' : 'pending',
    missingItems,
  };
}