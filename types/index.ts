export interface Tenant {
  id: string;
  name: string;
  slug: string;
  whatsapp_number: string;
  opening_time: string;
  closing_time: string;
  delivery_fee: number;
  free_delivery_min_amount: number;
  description?: string;
  is_active?: boolean;
  created_at?: string;
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