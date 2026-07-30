export interface Tenant {
  id: string;
  name: string;
  slug: string;
  whatsapp_number: string;
  opening_time: string;
  closing_time: string;
  working_days?: number[];
  delivery_fee: number; 
  delivery_fee_low_zone: number;
  delivery_fee_high_zone: number;
  enable_free_delivery: boolean;
  free_delivery_min_amount: number;
  description?: string;
  is_active?: boolean;
  force_open?: boolean; 
  admin_pin?: string;
  admin_token?: string;
  created_at?: string;
  allow_delivery?: boolean;
  allow_pickup?: boolean;
  allow_dine_in?: boolean;
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
  tenant_id: string;
  name: string;
  price_override?: number;
  max_modifier_selections?: number;
  created_at?: string;
}

// === Inventario Global ===
export interface TenantIngredient {
  id: string;
  tenant_id: string;
  name: string;
  is_available: boolean;
  created_at?: string;
}

export interface ModifierCategory {
  id: string;
  tenant_id: string;
  name: string;
}

// === Sistema profesional de modificadores y extras ===
export interface Modifier {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
  global_ingredient_id?: string;
  category_id?: string;
  modifier_categories?: { name: string };
  created_at?: string;
}

export interface ModifierGroup {
  id: string;
  product_id?: string;
  tenant_id: string;
  name: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  modifiers?: Modifier[];
  created_at?: string;
}

export interface Product {
  id: string;
  tenant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  is_available: boolean;
  is_featured?: boolean;
  sort_order?: number;
  product_variants?: ProductVariant[];
  modifier_groups?: ModifierGroup[]; 
}

// === Carrito e interfaces extendidas ===
export interface CartItem {
  product: Product;
  selectedVariant?: ProductVariant;
  selectedModifiers?: {
    groupName: string;
    modifierName: string;
    priceDelta: number;
  }[];
  finalUnitPrice?: number; 
  notes?: string;
  quantity: number;
}

export type TenantWithMenu = Tenant & {
  products?: Pick<Product, 'name' | 'description'>[];
  categories?: Pick<Category, 'name'>[];
  logo_url?: string | null;
};