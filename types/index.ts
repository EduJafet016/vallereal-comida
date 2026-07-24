export interface Tenant {
  id: string;
  name: string;
  slug: string;
  whatsapp_number: string;
  opening_time: string;
  closing_time: string;
  delivery_fee: number; // Se mantiene por retrocompatibilidad
  delivery_fee_low_zone: number;
  delivery_fee_high_zone: number;
  enable_free_delivery: boolean;
  free_delivery_min_amount: number;
  description?: string;
  is_active?: boolean;
  force_open?: boolean; // Regla para apertura extraordinaria fuera de horario
  admin_pin?: string;
  admin_token?: string;
  created_at?: string;
}

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

export interface Category {
  id: string;
  tenant_id: string;
  name: string;
  sort_order: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  name: string;
  price_override?: number;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  product_variants?: ProductVariant[];
}

export interface CartItem {
  product: Product;
  selectedVariant?: ProductVariant;
  notes?: string;
  quantity: number;
}