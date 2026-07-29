import { CartItem, Tenant } from '@/types';

interface OrderCustomerInfo {
  name: string;
  address: string;
  notes?: string;
  deliveryType: 'delivery' | 'pickup' | 'dine_in';
  zone?: 'low' | 'high';
}

export function generateWhatsAppLink(
  tenant: Tenant,
  items: CartItem[],
  customer: OrderCustomerInfo,
  subtotal: number
): string {
  const isDelivery = customer.deliveryType === 'delivery';
  const isPickup = customer.deliveryType === 'pickup';
  const isDineIn = customer.deliveryType === 'dine_in';

  // Determinación de tarifa por zona (solo aplica para envío a domicilio)
  const selectedZone = customer.zone ?? 'low';
  const baseDeliveryFee = selectedZone === 'low'
    ? (tenant.delivery_fee_low_zone ?? tenant.delivery_fee ?? 10)
    : (tenant.delivery_fee_high_zone ?? (tenant.delivery_fee ? tenant.delivery_fee + 5 : 20));

  // Evaluación de envío gratis
  const isFreeDeliveryEligible =
    (tenant.enable_free_delivery ?? true) &&
    subtotal >= tenant.free_delivery_min_amount;

  const deliveryFee = isDelivery
    ? (isFreeDeliveryEligible ? 0 : baseDeliveryFee)
    : 0;

  const total = subtotal + deliveryFee;

  // 1. Cabecera (Alto Contraste)
  let message = `🛎️ *NUEVO PEDIDO - VALLE REAL* 🛎️\n`;
  message += `🏪 *Local:* ${tenant.name}\n`;
  message += `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️\n\n`;

  // 2. Datos de Logística y Cliente
  message += `👤 *Cliente:* ${customer.name}\n`;

  if (isDelivery) {
    const zoneName = selectedZone === 'low' ? 'Parte Baja' : 'Parte Alta';
    message += `🛵 *Tipo:* A Domicilio (${zoneName})\n`;
    message += `📍 *Dirección:* ${customer.address}\n`;
  } else if (isPickup) {
    message += `🚶 *Tipo:* Pasa a recoger al local\n`;
  } else if (isDineIn) {
    message += `🍽️ *Tipo:* Comer en Mesa\n`;
    message += `📍 *Mesa / Ubicación:* ${customer.address}\n`;
  }

  // Agrupamos las indicaciones del cliente con sus datos
  if (customer.notes && customer.notes.trim()) {
    message += `💬 *Indicaciones:* _${customer.notes.trim()}_\n`;
  }
  
  message += `\n📋 *DETALLE DEL PEDIDO:*\n\n`;

  // 3. Iteración y Desglose de Productos
  items.forEach((item) => {
    // Cálculo seguro: usa finalUnitPrice si el frontend ya lo procesó, o lo calcula sumando los deltas
    const basePrice = item.selectedVariant?.price_override ?? item.product.price;
    const modifiersDelta = item.selectedModifiers?.reduce((sum, mod) => sum + mod.priceDelta, 0) ?? 0;
    const unitPrice = item.finalUnitPrice ?? (basePrice + modifiersDelta);
    const itemTotal = unitPrice * item.quantity;

    // Línea principal del producto
    message += `🔸 *${item.quantity}x ${item.product.name}* - *$${itemTotal.toFixed(2)}*\n`;
    
    // Sub-nodos (Variantes, Modificadores, Notas)
    if (item.selectedVariant) {
      message += `   ↳ 🔹 *Opción:* ${item.selectedVariant.name}\n`;
    }

    if (item.selectedModifiers && item.selectedModifiers.length > 0) {
      const modsText = item.selectedModifiers
        .map(m => `${m.modifierName} (+$${m.priceDelta})`)
        .join(', ');
      message += `   ↳ ➕ *Extras:* ${modsText}\n`;
    }

    if (item.notes) {
      message += `   ↳ 📝 *Nota:* _${item.notes}_\n`;
    }
    message += `\n`; // Separador visual entre productos
  });

  message += `〰️〰️〰️〰️〰️〰️〰️〰️〰️〰️\n`;

  // 4. Resumen Financiero
  message += `💵 *Subtotal:* $${subtotal.toFixed(2)}\n`;
  
  if (isDelivery) {
    const zoneName = selectedZone === 'low' ? 'Parte Baja' : 'Parte Alta';
    const feeText = deliveryFee === 0 ? '¡GRATIS!' : `$${deliveryFee.toFixed(2)}`;
    message += `🛵 *Envío (${zoneName}):* ${feeText}\n`;
  }
  
  message += `💰 *TOTAL A PAGAR: $${total.toFixed(2)}*\n`;

  // Sanitización de cadena (Regex para números limpios)
  const cleanPhone = tenant.whatsapp_number.replace(/\D/g, '');

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}