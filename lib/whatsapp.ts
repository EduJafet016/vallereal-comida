import { CartItem, Tenant } from '@/types';

interface OrderCustomerInfo {
  name: string;
  address: string;
  notes?: string;
  deliveryType: 'delivery' | 'pickup';
}

export function generateWhatsAppLink(
  tenant: Tenant,
  items: CartItem[],
  customer: OrderCustomerInfo,
  subtotal: number
): string {
  const isDelivery = customer.deliveryType === 'delivery';
  
  const deliveryFee = isDelivery 
    ? (subtotal >= tenant.free_delivery_min_amount ? 0 : tenant.delivery_fee)
    : 0;
    
  const total = subtotal + deliveryFee;

  let message = `*NUEVO PEDIDO - VALLE REAL*\n`;
  message += `*Local:* ${tenant.name}\n`;
  message += `-----------------------------------\n\n`;

  message += `*Cliente:* ${customer.name}\n`;
  message += `*Entrega:* ${isDelivery ? `Domicilio (${customer.address})` : 'Pasa a recoger'}\n\n`;

  message += `*DETALLE DEL PEDIDO:*\n`;
  
  items.forEach((item) => {
    const variantText = item.selectedVariant ? ` (${item.selectedVariant.name})` : '';
    const itemPrice = item.selectedVariant?.price_override ?? item.product.price;
    const itemTotal = itemPrice * item.quantity;
    
    message += `• ${item.quantity}x ${item.product.name}${variantText} - *$${itemTotal.toFixed(2)}*\n`;
    if (item.notes) {
      message += `  - *Nota:* ${item.notes}\n`;
    }
  });

  message += `\n-----------------------------------\n`;
  
  message += `*Subtotal:* $${subtotal.toFixed(2)}\n`;
  if (isDelivery) {
    message += `*Envío:* ${deliveryFee === 0 ? 'GRATIS' : `$${deliveryFee.toFixed(2)}`}\n`;
  }
  message += `*TOTAL A PAGAR:* *$${total.toFixed(2)}*\n`;

  if (customer.notes && customer.notes.trim()) {
    message += `\n*Notas adicionales:* ${customer.notes.trim()}\n`;
  }

  // Limpiar número de WhatsApp eliminando espacios o símbolos
  const cleanPhone = tenant.whatsapp_number.replace(/\D/g, '');

  return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
}