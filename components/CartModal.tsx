'use client';

import { useState } from 'react';
import { useCartState, useCartDispatch } from '../context/CartContext';
import { generateWhatsAppLink } from '../lib/whatsapp';
import { Tenant } from '../types';
import { X, Plus, Minus, Trash2, Send, Sparkles } from 'lucide-react';
import { useCustomerData } from '../hooks/useCustomerData';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
}

export default function CartModal({ isOpen, onClose, tenant }: CartModalProps) {
  const { items, subtotal } = useCartState();
  const dispatch = useCartDispatch();

  const {
    customerName, setCustomerName,
    address, setAddress,
    zone, setZone,
    hasSavedData, saveCustomerData
  } = useCustomerData(isOpen);

  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [orderNotes, setOrderNotes] = useState('');

  if (!isOpen) return null;

  const isDelivery = deliveryType === 'delivery';

  const baseDeliveryFee = zone === 'low' 
    ? (tenant.delivery_fee_low_zone ?? tenant.delivery_fee ?? 0) 
    : (tenant.delivery_fee_high_zone ?? tenant.delivery_fee ?? 0);

  const isFreeDeliveryEligible = Boolean(
    tenant.enable_free_delivery && 
    tenant.free_delivery_min_amount && 
    subtotal >= tenant.free_delivery_min_amount
  );

  const deliveryFee = isDelivery ? (isFreeDeliveryEligible ? 0 : baseDeliveryFee) : 0;
  const total = subtotal + deliveryFee;

  // ¡Aquí estaba el método que el linter decía que no usábamos! 
  // Ahora lo pasaremos como prop al OrderForm.
  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) return alert('Por favor ingresa tu nombre.');
    if (isDelivery && !address.trim()) return alert('Por favor ingresa tu dirección de entrega.');

    saveCustomerData({
      name: customerName.trim(),
      address: address.trim(),
      zone,
    });

    const whatsappUrl = generateWhatsAppLink(
      tenant,
      items,
      {
        name: customerName.trim(),
        address: isDelivery ? address.trim() : 'Pasa a recoger al local',
        notes: orderNotes.trim(),
        deliveryType,
        zone,
      },
      subtotal
    );

    window.open(whatsappUrl, '_blank');
    dispatch({ type: 'CLEAR_CART' });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        <div className="flex justify-between items-center p-4 border-b shrink-0">
          <h2 className="text-lg font-bold text-gray-900">Tu Pedido</h2>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-6 flex-1">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">El carrito está vacío.</div>
          ) : (
            <>
              <CartItemList items={items} dispatch={dispatch} />
              
              <OrderForm 
                setDeliveryType={setDeliveryType}
                hasSavedData={hasSavedData}
                zone={zone} setZone={setZone}
                customerName={customerName} setCustomerName={setCustomerName}
                address={address} setAddress={setAddress}
                orderNotes={orderNotes} setOrderNotes={setOrderNotes}
                tenant={tenant}
                isDelivery={isDelivery}
                onSubmit={handleSendOrder} // Conectamos el evento aquí
              />
              
              <OrderSummary 
                subtotal={subtotal} 
                deliveryFee={deliveryFee} 
                total={total} 
                isDelivery={isDelivery} 
                zone={zone} 
              />
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-4 border-t bg-gray-50 rounded-b-2xl shrink-0">
            <button
              type="submit"
              form="order-form"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Send className="w-4 h-4" /> Enviar Pedido por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TIPOS PARA SUBCOMPONENTES
// ============================================================================

// Usamos una interfaz genérica para los items del carrito para evitar el 'any'
interface CartItemData {
  product: { name: string; price: number };
  selectedVariant?: { name: string; price_override?: number };
  quantity: number;
}

interface CartItemListProps {
  items: CartItemData[];
  dispatch: React.Dispatch<any>; // React Dispatch tipado genérico
}

interface OrderFormProps {
  setDeliveryType: (type: 'delivery' | 'pickup') => void;
  hasSavedData: boolean;
  zone: 'low' | 'high';
  setZone: (zone: 'low' | 'high') => void;
  customerName: string;
  setCustomerName: (name: string) => void;
  address: string;
  setAddress: (address: string) => void;
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  tenant: Tenant;
  isDelivery: boolean;
  onSubmit: (e: React.FormEvent) => void;
}

interface OrderSummaryProps {
  subtotal: number;
  deliveryFee: number;
  total: number;
  isDelivery: boolean;
  zone: 'low' | 'high';
}

// ============================================================================
// SUBCOMPONENTES (Ahora fuertemente tipados)
// ============================================================================

function CartItemList({ items, dispatch }: CartItemListProps) {
  return (
    <div className="space-y-3">
      {items.map((item, index) => {
        const price = item.selectedVariant?.price_override ?? item.product.price;
        return (
          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <div className="flex-1 pr-2">
              <h4 className="font-medium text-sm text-gray-900">{item.product.name}</h4>
              {item.selectedVariant && (
                <span className="text-xs text-gray-500 block">{item.selectedVariant.name}</span>
              )}
              <span className="text-xs font-bold text-emerald-600 block mt-0.5">
                ${(price * item.quantity).toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-white px-2 py-1 border rounded-lg shadow-sm">
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { index, quantity: item.quantity - 1 } })}
                className="text-gray-500 hover:text-emerald-600 cursor-pointer"
              >
                {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
              </button>
              <span className="text-sm font-semibold w-4 text-center text-gray-900">{item.quantity}</span>
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { index, quantity: item.quantity + 1 } })}
                className="text-gray-500 hover:text-emerald-600 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderForm({ 
  setDeliveryType, hasSavedData, zone, setZone, 
  customerName, setCustomerName, address, setAddress, 
  orderNotes, setOrderNotes, tenant, isDelivery, onSubmit 
}: OrderFormProps) {
  return (
    <form id="order-form" onSubmit={onSubmit} className="space-y-4 border-t pt-4">
      <div>
        <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">Tipo de Entrega</label>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setDeliveryType('delivery')}
            className={`py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${isDelivery ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold' : 'border-gray-200 text-gray-600'}`}
          >
            🛵 A Domicilio
          </button>
          <button
            type="button"
            onClick={() => setDeliveryType('pickup')}
            className={`py-2 text-xs font-medium rounded-xl border transition-all cursor-pointer ${!isDelivery ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold' : 'border-gray-200 text-gray-600'}`}
          >
            🏃 Pickup (Recoger)
          </button>
        </div>
      </div>

      {hasSavedData && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] p-2.5 rounded-xl font-medium flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Cargamos tu dirección anterior para pedir más rápido.</span>
        </div>
      )}

      {isDelivery && (
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1.5">Zona en Valle Real *</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setZone('low')}
              className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${zone === 'low' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold' : 'border-gray-200 text-gray-600 bg-white'}`}
            >
              <div>
                <span className="block font-semibold">Parte Baja</span>
                <span className="text-[10px] text-gray-400 font-normal leading-tight block mt-0.5">Ej: Mz. 4, Estambul...</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 mt-1.5 block">${tenant.delivery_fee_low_zone ?? tenant.delivery_fee ?? 0}.00</span>
            </button>
            <button
              type="button"
              onClick={() => setZone('high')}
              className={`py-2 px-3 text-xs font-medium rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer ${zone === 'high' ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold' : 'border-gray-200 text-gray-600 bg-white'}`}
            >
              <div>
                <span className="block font-semibold">Parte Alta</span>
                <span className="text-[10px] text-gray-400 font-normal leading-tight block mt-0.5">Ej: Sintra, Granada...</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-700 mt-1.5 block">${tenant.delivery_fee_high_zone ?? tenant.delivery_fee ?? 0}.00</span>
            </button>
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">Tu Nombre *</label>
        <input
          type="text"
          required
          placeholder="Ej. Juan Pérez"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white placeholder:text-gray-400 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {isDelivery && (
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Dirección en Valle Real *</label>
          <input
            type="text"
            required
            placeholder="Calle, número de casa/depto"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white placeholder:text-gray-400 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      )}

      <div>
        <label className="text-xs font-semibold text-gray-700 block mb-1">Notas adicionales (Opcional)</label>
        <textarea
          rows={2}
          placeholder="Ej. Sin cebolla, cambiar salsa..."
          value={orderNotes}
          onChange={(e) => setOrderNotes(e.target.value)}
          className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white placeholder:text-gray-400 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
        />
      </div>
    </form>
  );
}

function OrderSummary({ subtotal, deliveryFee, total, isDelivery, zone }: OrderSummaryProps) {
  return (
    <div className="bg-gray-50 p-3 rounded-xl space-y-1.5 text-xs text-gray-600 border">
      <div className="flex justify-between">
        <span>Subtotal:</span>
        <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
      </div>
      {isDelivery && (
        <div className="flex justify-between">
          <span>Costo de envío ({zone === 'low' ? 'Parte Baja' : 'Parte Alta'}):</span>
          <span className="font-semibold text-gray-900">{deliveryFee === 0 ? '¡GRATIS!' : `$${deliveryFee.toFixed(2)}`}</span>
        </div>
      )}
      <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-2 mt-1">
        <span>Total a Pagar:</span>
        <span className="text-emerald-600">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}