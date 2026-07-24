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

// Nuevas interfaces para el sistema profesional de modificadores y extras
export interface Modifier {
  id: string;
  group_id: string;
  name: string;
  price_delta: number;
  is_available: boolean;
}

export interface ModifierGroup {
  id: string;
  product_id: string;
  tenant_id: string;
  name: string;
  is_required: boolean;
  min_selections: number;
  max_selections: number;
  modifiers?: Modifier[];
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
  modifier_groups?: ModifierGroup[]; // Añadido para soportar los grupos de modificadores
}

export interface CartItem {
  product: Product;
  selectedVariant?: ProductVariant;
  selectedModifiers?: {
    groupName: string;
    modifierName: string;
    priceDelta: number;
  }[];
  finalUnitPrice?: number; // Precio base calculado + modificadores
  notes?: string;
  quantity: number;
}