'use client';

import React, { createContext, useContext, useReducer, useMemo, ReactNode } from 'react';
import { CartItem, Product, ProductVariant } from '@/types';

// 1. Definición estricta de Estado y Acciones (Lógica de Negocio)
interface CartState {
  items: CartItem[];
  subtotal: number;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; variant?: ProductVariant; notes?: string } }
  | { type: 'REMOVE_ITEM'; payload: number }
  | { type: 'UPDATE_QUANTITY'; payload: { index: number; quantity: number } }
  | { type: 'CLEAR_CART' };

// 2. Separación ortogonal de Contextos (Lectura vs Escritura)
const CartStateContext = createContext<CartState | undefined>(undefined);
const CartDispatchContext = createContext<React.Dispatch<CartAction> | undefined>(undefined);

// Función pura para el cálculo algorítmico del subtotal
const calculateSubtotal = (items: CartItem[]): number => {
  return items.reduce((sum, item) => {
    const price = item.selectedVariant?.price_override ?? item.product.price;
    return sum + (price * item.quantity);
  }, 0);
};

// 3. Reducer: Transiciones de estado inmutables y puras
const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, variant, notes } = action.payload;
      const existingIndex = state.items.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedVariant?.id === variant?.id &&
          item.notes === notes
      );

      let newItems;
      if (existingIndex > -1) {
        newItems = [...state.items];
        // Mutación profunda controlada para evitar mutar referencias antiguas
        newItems[existingIndex] = { 
          ...newItems[existingIndex], 
          quantity: newItems[existingIndex].quantity + 1 
        };
      } else {
        newItems = [...state.items, { product, selectedVariant: variant, notes, quantity: 1 }];
      }
      return { items: newItems, subtotal: calculateSubtotal(newItems) };
    }
    case 'REMOVE_ITEM': {
      const newItems = state.items.filter((_, i) => i !== action.payload);
      return { items: newItems, subtotal: calculateSubtotal(newItems) };
    }
    case 'UPDATE_QUANTITY': {
      const { index, quantity } = action.payload;
      if (quantity <= 0) {
        const newItems = state.items.filter((_, i) => i !== index);
        return { items: newItems, subtotal: calculateSubtotal(newItems) };
      }
      const newItems = [...state.items];
      newItems[index] = { ...newItems[index], quantity };
      return { items: newItems, subtotal: calculateSubtotal(newItems) };
    }
    case 'CLEAR_CART':
      return { items: [], subtotal: 0 };
    default:
      return state;
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  // Inicialización del state machine
  const [state, dispatch] = useReducer(cartReducer, { items: [], subtotal: 0 });

  // Memoización estricta para garantizar la estabilidad referencial
  const stateValue = useMemo(() => state, [state]);

  return (
    <CartDispatchContext.Provider value={dispatch}>
      <CartStateContext.Provider value={stateValue}>
        {children}
      </CartStateContext.Provider>
    </CartDispatchContext.Provider>
  );
}

// 4. Custom Hooks especializados con fail-fast integrado
export function useCartState() {
  const context = useContext(CartStateContext);
  if (context === undefined) {
    throw new Error('useCartState debe usarse dentro de un CartProvider');
  }
  return context;
}

export function useCartDispatch() {
  const context = useContext(CartDispatchContext);
  if (context === undefined) {
    throw new Error('useCartDispatch debe usarse dentro de un CartProvider');
  }
  return context;
}