'use client';

import { useState } from 'react';
import { useCartState, useCartDispatch } from '../context/CartContext';
import { generateWhatsAppLink } from '../lib/whatsapp';
import { Tenant } from '../types';
import { X, Plus, Minus, Trash2, Send, Sparkles, MapPin, User, FileText, ShoppingBag, Bike, CheckCircle2 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-md flex justify-center items-end sm:items-center p-0 sm:p-4 transition-all">
      <div className="bg-slate-100 w-full max-w-xl rounded-t-[32px] sm:rounded-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden border border-white/40 animate-in slide-in-from-bottom duration-300">
        
        {/* Cabecera */}
        <div className="flex justify-between items-center px-6 py-5 bg-white border-b border-slate-200/60 sticky top-0 z-20 shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Tu Pedido</h2>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase">En curso</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">{tenant.name || 'Restaurante'}</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-all cursor-pointer shadow-2xs"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {items.length === 0 ? (
            <div className="text-center py-20 text-slate-400 font-medium bg-white rounded-3xl border border-slate-200/60 shadow-xs">
              <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-500" />
              Tu carrito está vacío.
            </div>
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
                onSubmit={handleSendOrder}
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

        {/* Footer */}
        {items.length > 0 && (
          <div className="p-4 sm:p-5 bg-white border-t border-slate-200/60 shadow-xl shrink-0 z-20">
            <button
              type="submit"
              form="order-form"
              className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.99] text-white py-4 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/25 transition-all cursor-pointer"
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
// SUBCOMPONENTES
// ============================================================================

interface CartItemData {
  product: { name: string; price: number };
  selectedVariant?: { name: string; price_override?: number };
  quantity: number;
}

type CartAction = 
  | { type: 'UPDATE_QUANTITY'; payload: { index: number; quantity: number } }
  | { type: 'CLEAR_CART' };

interface CartItemListProps {
  items: CartItemData[];
  dispatch: React.Dispatch<CartAction>;
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

function CartItemList({ items, dispatch }: CartItemListProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">Tus Productos</h3>
        <span className="text-xs font-bold text-slate-500">{items.length} {items.length === 1 ? 'artículo' : 'artículos'}</span>
      </div>
      {items.map((item, index) => {
        const price = item.selectedVariant?.price_override ?? item.product.price;
        return (
          <div key={index} className="flex items-center justify-between p-4 bg-white border border-slate-200/70 rounded-2xl shadow-xs hover:shadow-md transition-all">
            <div className="flex-1 pr-3">
              <h4 className="font-black text-sm text-slate-900">{item.product.name}</h4>
              {item.selectedVariant && (
                <span className="text-xs text-slate-500 font-medium block mt-0.5">{item.selectedVariant.name}</span>
              )}
              <span className="text-sm font-black text-emerald-600 block mt-1">
                ${(price * item.quantity).toFixed(2)}
              </span>
            </div>
            
            <div className="flex items-center bg-slate-100 border border-slate-200/80 rounded-xl p-1 shadow-inner">
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { index, quantity: item.quantity - 1 } })}
                className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-red-600 hover:bg-white rounded-lg transition-all cursor-pointer shadow-2xs"
              >
                {item.quantity === 1 ? <Trash2 className="w-4 h-4 text-red-500" /> : <Minus className="w-4 h-4" />}
              </button>
              <span className="text-xs font-black w-7 text-center text-slate-900">{item.quantity}</span>
              <button
                type="button"
                onClick={() => dispatch({ type: 'UPDATE_QUANTITY', payload: { index, quantity: item.quantity + 1 } })}
                className="w-8 h-8 flex items-center justify-center text-slate-600 hover:text-emerald-600 hover:bg-white rounded-lg transition-all cursor-pointer shadow-2xs"
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
    <form id="order-form" onSubmit={onSubmit} className="space-y-5">
      
      <div>
        <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2 px-1">Método de Entrega</label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setDeliveryType('delivery')}
            className={`py-3 px-4 text-xs font-black rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center gap-2.5 ${isDelivery ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-sm ring-4 ring-emerald-600/10' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
          >
            <Bike className={`w-4 h-4 ${isDelivery ? 'text-emerald-600' : 'text-slate-400'}`} /> A Domicilio
          </button>
          <button
            type="button"
            onClick={() => setDeliveryType('pickup')}
            className={`py-3 px-4 text-xs font-black rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-center gap-2.5 ${!isDelivery ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 shadow-sm ring-4 ring-emerald-600/10' : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'}`}
          >
            <ShoppingBag className={`w-4 h-4 ${!isDelivery ? 'text-emerald-600' : 'text-slate-400'}`} /> Pickup (Recoger)
          </button>
        </div>
      </div>

      {hasSavedData && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/85 text-emerald-900 text-xs p-4 rounded-2xl font-bold flex items-center gap-3 shadow-xs">
          <Sparkles className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>¡Datos recuperados! Hemos cargado tu información anterior para agilizar tu pedido.</span>
        </div>
      )}

      {isDelivery && (
        <div>
          <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-2 px-1">Selecciona tu Zona *</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setZone('low')}
              className={`p-4 text-left rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${zone === 'low' ? 'border-emerald-600 bg-white shadow-md ring-4 ring-emerald-600/10' : 'border-slate-200 bg-white/60 hover:border-slate-300'}`}
            >
              {zone === 'low' && <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-3 right-3" />}
              <div>
                <span className="block font-black text-sm text-slate-900">Parte Baja</span>
                <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Mz. 4, Estambul...</span>
              </div>
              <span className="text-xs font-black text-emerald-600 mt-3 block bg-emerald-50 px-2.5 py-1 rounded-xl w-fit border border-emerald-100">
                ${tenant.delivery_fee_low_zone ?? tenant.delivery_fee ?? 0}.00
              </span>
            </button>
            <button
              type="button"
              onClick={() => setZone('high')}
              className={`p-4 text-left rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between relative ${zone === 'high' ? 'border-emerald-600 bg-white shadow-md ring-4 ring-emerald-600/10' : 'border-slate-200 bg-white/60 hover:border-slate-300'}`}
            >
              {zone === 'high' && <CheckCircle2 className="w-4 h-4 text-emerald-600 absolute top-3 right-3" />}
              <div>
                <span className="block font-black text-sm text-slate-900">Parte Alta</span>
                <span className="text-[11px] text-slate-400 font-medium block mt-0.5">Sintra, Granada...</span>
              </div>
              <span className="text-xs font-black text-emerald-600 mt-3 block bg-emerald-50 px-2.5 py-1 rounded-xl w-fit border border-emerald-100">
                ${tenant.delivery_fee_high_zone ?? tenant.delivery_fee ?? 0}.00
              </span>
            </button>
          </div>
        </div>
      )}

      <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-200/70 shadow-xs">
        <div>
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Tu Nombre *</label>
          <div className="relative flex items-center">
            <User className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              required
              placeholder="Ej. Juan Pérez"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm text-slate-900 font-bold bg-slate-50 placeholder:text-slate-400 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all shadow-inner"
            />
          </div>
        </div>

        {isDelivery && (
          <div>
            <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Dirección en Valle Real *</label>
            <div className="relative flex items-center">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
              <input
                type="text"
                required
                placeholder="Calle, número de casa/depto"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm text-slate-900 font-bold bg-slate-50 placeholder:text-slate-400 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all shadow-inner"
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-[11px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Notas adicionales (Opcional)</label>
          <div className="relative">
            <FileText className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <textarea
              rows={2}
              placeholder="Ej. Sin cebolla, cambiar salsa..."
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full pl-10 pr-4 py-3 text-sm text-slate-900 font-bold bg-slate-50 placeholder:text-slate-400 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 focus:bg-white transition-all shadow-inner resize-none"
            />
          </div>
        </div>
      </div>
    </form>
  );
}

function OrderSummary({ subtotal, deliveryFee, total, isDelivery, zone }: OrderSummaryProps) {
  return (
    <div className="bg-white p-5 rounded-3xl space-y-3 border border-slate-200/80 shadow-sm">
      <div className="flex justify-between text-xs text-slate-500 font-semibold">
        <span>Subtotal productos</span>
        <span className="font-bold text-slate-800">${subtotal.toFixed(2)}</span>
      </div>
      {isDelivery && (
        <div className="flex justify-between text-xs text-slate-500 font-semibold">
          <span>Envío ({zone === 'low' ? 'Parte Baja' : 'Parte Alta'})</span>
          <span className="font-bold text-slate-800">{deliveryFee === 0 ? '¡GRATIS!' : `$${deliveryFee.toFixed(2)}`}</span>
        </div>
      )}
      <div className="flex justify-between items-center text-base font-black border-t border-slate-100 pt-3 mt-1">
        <span className="text-slate-800">Total a Pagar</span>
        <span className="text-xl font-black text-emerald-600">${total.toFixed(2)}</span>
      </div>
    </div>
  );
}