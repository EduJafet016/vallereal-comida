import { CartItem, Tenant } from '@/types';

interface OrderCustomerInfo {
  name: string;
  address: string;
  notes?: string;
  deliveryType: 'delivery' | 'pickup';
  zone?: 'low' | 'high';
}

export function generateWhatsAppLink(
  tenant: Tenant,
  items: CartItem[],
  customer: OrderCustomerInfo,
  subtotal: number
): string {
  const isDelivery = customer.deliveryType === 'delivery';

  // Determinación de tarifa por zona
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

  let message = `*NUEVO PEDIDO - VALLE REAL*\n`;
  message += `*Local:* ${tenant.name}\n`;
  message += `-----------------------------------\n\n`;

  message += `*Cliente:* ${customer.name}\n`;
  
  if (isDelivery) {
    const zoneName = selectedZone === 'low' ? 'Parte Baja' : 'Parte Alta';
    message += `*Entrega:* Domicilio (${zoneName})\n`;
    message += `*Dirección:* ${customer.address}\n\n`;
  } else {
    message += `*Entrega:* Pasa a recoger al local\n\n`;
  }

  message += `*DETALLE DEL PEDIDO:*\n`;

  items.forEach((item) => {
    const variantText = item.selectedVariant ? ` (${item.selectedVariant.name})` : '';
    const itemPrice = item.selectedVariant?.price_override ?? item.product.price;
    const itemTotal = itemPrice * item.quantity;

    message += `• ${item.quantity}x ${item.product.name}${variantText} - *$${itemTotal.toFixed(2)}*\n`;
    if (item.notes) {
      message += `  _Nota producto: ${item.notes}_\n`;
    }
  });

  message += `\n-----------------------------------\n`;

  message += `*Subtotal:* $${subtotal.toFixed(2)}\n`;
  if (isDelivery) {
    message += `*Envío (${selectedZone === 'low' ? 'Parte Baja' : 'Parte Alta'}):* ${
      deliveryFee === 0 ? '¡GRATIS!' : `$${deliveryFee.toFixed(2)}`
    }\n`;
  }
  message += `*TOTAL A PAGAR:* *$${total.toFixed(2)}*\n`;

  if (customer.notes && customer.notes.trim()) {
    message += `\n*Notas del cliente:* ${customer.notes.trim()}\n`;
  }

  // Limpiar número de WhatsApp eliminando cualquier caracter no numérico
  const cleanPhone = tenant.whatsapp_number.replace(/\D/g, '');

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}