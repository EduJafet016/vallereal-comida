'use client';

import { useState } from 'react';
import { useCart } from '../context/CartContext';
import { generateWhatsAppLink } from '../lib/whatsapp';
import { Tenant } from '../types';
import { X, Plus, Minus, Trash2, Send } from 'lucide-react';

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
}

export default function CartModal({ isOpen, onClose, tenant }: CartModalProps) {
  const { items, updateQuantity, removeFromCart, clearCart, subtotal } = useCart();
  
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<'delivery' | 'pickup'>('delivery');
  const [orderNotes, setOrderNotes] = useState('');

  if (!isOpen) return null;

  const isDelivery = deliveryType === 'delivery';
  const deliveryFee = isDelivery
    ? (subtotal >= tenant.free_delivery_min_amount ? 0 : tenant.delivery_fee)
    : 0;
  const total = subtotal + deliveryFee;

  const handleSendOrder = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('Por favor ingresa tu nombre.');
      return;
    }

    if (isDelivery && !address.trim()) {
      alert('Por favor ingresa tu dirección de entrega.');
      return;
    }

    const whatsappUrl = generateWhatsAppLink(
      tenant,
      items,
      {
        name: customerName,
        address: isDelivery ? address : 'Pasa a recoger al local',
        notes: orderNotes,
        deliveryType,
      },
      subtotal
    );

    // Abrir WhatsApp en pestaña nueva
    window.open(whatsappUrl, '_blank');
    clearCart();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Header del Modal */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-bold text-gray-900">Tu Pedido</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Cuerpo con Scroll */}
        <div className="p-4 overflow-y-auto space-y-6 flex-1">
          {items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              El carrito está vacío.
            </div>
          ) : (
            <>
              {/* Lista de productos en carrito */}
              <div className="space-y-3">
                {items.map((item, index) => {
                  const price = item.selectedVariant?.price_override ?? item.product.price;
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-xl"
                    >
                      <div className="flex-1 pr-2">
                        <h4 className="font-medium text-sm text-gray-900">
                          {item.product.name}
                        </h4>
                        {item.selectedVariant && (
                          <span className="text-xs text-gray-500 block">
                            {item.selectedVariant.name}
                          </span>
                        )}
                        <span className="text-xs font-bold text-emerald-600 block mt-0.5">
                          ${(price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {/* Control de cantidad */}
                      <div className="flex items-center gap-2 bg-white px-2 py-1 border rounded-lg shadow-sm">
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity - 1)}
                          className="text-gray-500 hover:text-emerald-600"
                        >
                          {item.quantity === 1 ? (
                            <Trash2 className="w-4 h-4 text-red-500" />
                          ) : (
                            <Minus className="w-4 h-4" />
                          )}
                        </button>
                        <span className="text-sm font-semibold w-4 text-center text-gray-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(index, item.quantity + 1)}
                          className="text-gray-500 hover:text-emerald-600"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Formulario de cliente y entrega */}
              <form id="order-form" onSubmit={handleSendOrder} className="space-y-4 border-t pt-4">
                
                {/* Tipo de Servicio */}
                <div>
                  <label className="text-xs font-semibold text-gray-600 uppercase tracking-wider block mb-2">
                    Tipo de Entrega
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('delivery')}
                      className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                        isDelivery
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      🛵 A Domicilio
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeliveryType('pickup')}
                      className={`py-2 text-xs font-medium rounded-xl border transition-all ${
                        !isDelivery
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-700 font-bold'
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      🏃 Pickup (Recoger)
                    </button>
                  </div>
                </div>

                {/* Campos de texto con fix de legibilidad */}
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Tu Nombre *
                  </label>
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
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Dirección en Valle Real *
                    </label>
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
                  <label className="text-xs font-semibold text-gray-700 block mb-1">
                    Notas adicionales (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Ej. Sin cebolla, cambiar salsa..."
                    value={orderNotes}
                    onChange={(e) => setOrderNotes(e.target.value)}
                    className="w-full px-3 py-2 text-sm text-gray-900 font-medium bg-white placeholder:text-gray-400 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                  />
                </div>
              </form>

              {/* Resumen de Costos */}
              <div className="bg-gray-50 p-3 rounded-xl space-y-1.5 text-xs text-gray-600 border">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-gray-900">${subtotal.toFixed(2)}</span>
                </div>
                {isDelivery && (
                  <div className="flex justify-between">
                    <span>Costo de envío:</span>
                    <span className="font-semibold text-gray-900">
                      {deliveryFee === 0 ? '¡GRATIS!' : `$${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-bold text-gray-900 border-t pt-2 mt-1">
                  <span>Total a Pagar:</span>
                  <span className="text-emerald-600">${total.toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer con Botón de Enviar */}
        {items.length > 0 && (
          <div className="p-4 border-t bg-gray-50 rounded-b-2xl">
            <button
              type="submit"
              form="order-form"
              className="w-full bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white py-3.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              <Send className="w-4 h-4" />
              Enviar Pedido por WhatsApp
            </button>
          </div>
        )}
      </div>
    </div>
  );
}