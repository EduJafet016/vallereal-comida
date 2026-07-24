'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Tenant, Product, Category, CartItem, ProductVariant } from '@/types';
import { 
  ArrowLeft, 
  Store, 
  Clock, 
  MapPin, 
  Phone, 
  Plus, 
  Minus,
  Check, 
  ShoppingBag, 
  Sparkles,
  X,
  Send,
  Trash2
} from 'lucide-react';
import { isStoreOpen } from '@/lib/utils';
import Link from 'next/link';

export default function TenantPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);
  
  // Estados del Modal de Carrito / Checkout
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');

  const fetchTenantData = useCallback(async () => {
    try {
      setLoading(true);
      const { data: tenantData, error: tenantError } = await supabase
        .from('tenants')
        .select('*')
        .eq('slug', slug)
        .single();

      if (tenantError || !tenantData) {
        router.push('/');
        return;
      }

      setTenant(tenantData);

      const [catRes, prodRes] = await Promise.all([
        supabase.from('categories').select('*').eq('tenant_id', tenantData.id).order('name'),
        supabase.from('products').select('*, product_variants(*)').eq('tenant_id', tenantData.id).eq('is_available', true)
      ]);

      setCategories(catRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Error cargando datos del local:', err);
    } finally {
      setLoading(false);
    }
  }, [slug, router]);

  useEffect(() => {
    if (slug) {
      fetchTenantData();
    }
  }, [slug, fetchTenantData]);

  // Manejo del carrito con soporte para variantes
  const addToCart = (product: Product, selectedVariant?: ProductVariant) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex(
        (item) => item.product.id === product.id && item.selectedVariant?.id === selectedVariant?.id
      );

      if (existingIndex > -1) {
        const newCart = [...prevCart];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          quantity: newCart[existingIndex].quantity + 1,
        };
        return newCart;
      } else {
        return [...prevCart, { product, selectedVariant, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (productId: string, variantId: string | undefined, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((item) => {
          if (item.product.id === productId && item.selectedVariant?.id === variantId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  const totalPrice = cart.reduce((acc, item) => {
    const itemPrice = item.selectedVariant?.price_override ?? item.product.price;
    return acc + itemPrice * item.quantity;
  }, 0);

  // Enviar pedido por WhatsApp
  const handleCheckoutWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || !tenant.whatsapp_number) {
      alert('Este local no tiene configurado un número de WhatsApp.');
      return;
    }

    if (!customerName.trim() || !customerAddress.trim()) {
      alert('Por favor ingresa tu nombre y dirección de entrega.');
      return;
    }

    let message = `*¡Hola! Nuevo pedido desde Valle Real Comida* 🍔\n\n`;
    message += `👤 *Cliente:* ${customerName}\n`;
    message += `📍 *Dirección:* ${customerAddress}\n`;
    if (customerNotes) message += `📝 *Notas:* ${customerNotes}\n`;
    message += `\n*--- DETALLE DEL PEDIDO ---*\n`;

    cart.forEach((item) => {
      const price = item.selectedVariant?.price_override ?? item.product.price;
      const variantText = item.selectedVariant ? ` (${item.selectedVariant.name})` : '';
      message += `• ${item.quantity}x ${item.product.name}${variantText} ($${(price * item.quantity).toFixed(2)})\n`;
    });

    message += `\n💰 *Total a pagar:* *$${totalPrice.toFixed(2)}*`;

    const encodedMessage = encodeURIComponent(message);
    const cleanPhone = tenant.whatsapp_number.replace(/\D/g, '');
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tenant) return null;

  const isOpen = tenant.is_active ?? false;
  const isWithinSchedule = isStoreOpen(tenant.opening_time, tenant.closing_time);
  const isExtraHours = (isOpen && !isWithinSchedule) || tenant.force_open;

  return (
    <main className="min-h-screen bg-gray-50 pb-28">
      {/* Header / Botón Volver */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-gray-100 sticky top-0 z-20 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-emerald-600 bg-gray-100 hover:bg-emerald-50 px-3 py-2 rounded-xl transition-all"
        >
          <ArrowLeft className="w-4 h-4" /> Ver más locales
        </Link>

        <span className="text-xs font-semibold text-gray-400">
          Valle Real
        </span>
      </div>

      {/* Información Principal del Local */}
      <div className="max-w-md mx-auto px-4 pt-6">
        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-5 space-y-4 relative overflow-hidden">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h1 className="text-xl font-black text-gray-900 tracking-tight leading-snug">
                {tenant.name}
              </h1>
              {tenant.description && (
                <p className="text-xs text-gray-500 font-normal leading-relaxed">
                  {tenant.description}
                </p>
              )}
            </div>

            <span
              className={`text-[11px] font-bold px-3 py-1 rounded-full shrink-0 flex items-center gap-1.5 shadow-xs ${
                isOpen ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'
              }`}
            >
              {isOpen && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
              {isOpen ? 'Abierto' : 'Cerrado'}
            </span>
          </div>

          <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-[11px] text-gray-500 font-medium">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>{tenant.opening_time.slice(0, 5)} - {tenant.closing_time.slice(0, 5)} hrs</span>
            </div>

            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">Valle Real</span>
            </div>

            {tenant.whatsapp_number && (
              <div className="col-span-2 flex items-center gap-1.5 pt-1">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{tenant.whatsapp_number}</span>
              </div>
            )}
          </div>

          {isExtraHours && (
            <div className="bg-blue-50 border border-blue-100 p-2.5 rounded-xl flex items-center gap-2 text-[11px] text-blue-700 font-semibold">
              <Sparkles className="w-4 h-4 text-blue-500 shrink-0" />
              <span>El local abrió fuera de su horario habitual.</span>
            </div>
          )}
        </div>

        {/* Listado de Menú por Categorías */}
        <div className="mt-6 space-y-6">
          {categories.length === 0 ? (
            <div className="space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 px-1">
                Menú Disponible
              </h2>
              {products.map((product) => (
                <ProductCardItem 
                  key={product.id} 
                  product={product} 
                  isOpen={isOpen} 
                  cart={cart}
                  onAdd={addToCart}
                  onUpdateQty={updateQuantity}
                />
              ))}
            </div>
          ) : (
            categories.map((category) => {
              const categoryProducts = products.filter((p) => p.category_id === category.id);
              if (categoryProducts.length === 0) return null;

              return (
                <div key={category.id} className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <div className="w-1.5 h-4 bg-emerald-600 rounded-full" />
                    <h2 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      {category.name}
                    </h2>
                  </div>

                  <div className="space-y-2.5">
                    {categoryProducts.map((product) => (
                      <ProductCardItem 
                        key={product.id} 
                        product={product} 
                        isOpen={isOpen} 
                        cart={cart}
                        onAdd={addToCart}
                        onUpdateQty={updateQuantity}
                      />
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Barra Flotante del Carrito */}
      {totalItems > 0 && (
        <div className="fixed bottom-4 left-0 right-0 px-4 z-30 max-w-md mx-auto">
          <div className="bg-emerald-600 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-xl">
                <ShoppingBag className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-xs font-medium text-emerald-100">{totalItems} {totalItems === 1 ? 'producto' : 'productos'}</p>
                <p className="text-sm font-extrabold">${totalPrice.toFixed(2)}</p>
              </div>
            </div>

            <button 
              onClick={() => setIsCartOpen(true)}
              className="bg-white text-emerald-700 hover:bg-emerald-50 px-4 py-2.5 rounded-xl font-bold text-xs transition-all shadow-sm cursor-pointer"
            >
              Ver Carrito
            </button>
          </div>
        </div>
      )}

      {/* Modal de Checkout */}
      {isCartOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-t-[2rem] sm:rounded-3xl max-h-[90vh] overflow-y-auto p-6 space-y-6 shadow-2xl animate-in fade-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <h2 className="font-extrabold text-gray-900 text-base">Tu Carrito</h2>
              </div>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de productos en el modal */}
            <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
              {cart.map((item, idx) => {
                const price = item.selectedVariant?.price_override ?? item.product.price;
                return (
                  <div key={idx} className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold text-gray-900 truncate">
                        {item.product.name} {item.selectedVariant && <span className="text-emerald-700 font-normal">({item.selectedVariant.name})</span>}
                      </p>
                      <p className="text-xs font-extrabold text-emerald-600">${(price * item.quantity).toFixed(2)}</p>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-white border border-gray-200 p-1 rounded-xl shrink-0">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.selectedVariant?.id, -1)}
                        className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span className="text-xs font-bold px-1">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.selectedVariant?.id, 1)}
                        className="p-1 text-gray-600 hover:text-emerald-600 transition-colors"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Formulario de datos para WhatsApp */}
            <form onSubmit={handleCheckoutWhatsApp} className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Datos de entrega</h3>
              
              <input
                type="text"
                placeholder="Tu nombre completo"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />

              <input
                type="text"
                placeholder="Dirección o calle en Valle Real"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />

              <textarea
                placeholder="Notas adicionales (ej. sin cebolla, pago con billete de 200...)"
                value={customerNotes}
                onChange={(e) => setCustomerNotes(e.target.value)}
                rows={2}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
              />

              <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500">Total a pagar:</span>
                <span className="text-base font-black text-emerald-600">${totalPrice.toFixed(2)}</span>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-2xl transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 text-xs cursor-pointer active:scale-98"
              >
                <Send className="w-4 h-4" /> Enviar pedido por WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}

// Componente individual de Producto que maneja variantes si existen
function ProductCardItem({ 
  product, 
  isOpen, 
  cart,
  onAdd, 
  onUpdateQty 
}: { 
  product: Product; 
  isOpen: boolean; 
  cart: CartItem[];
  onAdd: (product: Product, variant?: ProductVariant) => void;
  onUpdateQty: (productId: string, variantId: string | undefined, delta: number) => void;
}) {
  const hasVariants = product.product_variants && product.product_variants.length > 0;
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(
    hasVariants ? product.product_variants![0] : undefined
  );

  const currentPrice = selectedVariant?.price_override ?? product.price;

  // Buscar si este producto (con la variante actual) ya está en el carrito
  const cartItem = cart.find(
    (i) => i.product.id === product.id && i.selectedVariant?.id === selectedVariant?.id
  );

  return (
    <div className="bg-white border border-gray-100 hover:border-emerald-200 p-4 rounded-2xl shadow-xs transition-all flex flex-col gap-3 group">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <h3 className="font-bold text-gray-900 text-sm group-hover:text-emerald-700 transition-colors truncate">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
          <p className="text-sm font-extrabold text-emerald-600 pt-0.5">
            ${currentPrice.toFixed(2)}
          </p>
        </div>

        {isOpen && !hasVariants && (
          cartItem ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-1 rounded-xl shrink-0">
              <button
                onClick={() => onUpdateQty(product.id, undefined, -1)}
                className="p-1.5 bg-white text-emerald-700 rounded-lg shadow-xs hover:bg-emerald-100 transition-all cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
              <span className="text-xs font-black text-emerald-900 px-1.5">{cartItem.quantity}</span>
              <button
                onClick={() => onUpdateQty(product.id, undefined, 1)}
                className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onAdd(product)}
              className="p-2.5 rounded-xl shrink-0 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white active:scale-95 cursor-pointer shadow-xs transition-all"
              title="Agregar al carrito"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          )
        )}

        {!isOpen && (
          <button
            disabled
            className="p-2.5 rounded-xl shrink-0 bg-gray-100 text-gray-300 cursor-not-allowed"
            title="Local cerrado"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        )}
      </div>

      {/* Selector de variantes si el producto las tiene */}
      {hasVariants && (
        <div className="pt-2 border-t border-gray-100 space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {product.product_variants!.map((variant) => {
              const isSelected = selectedVariant?.id === variant.id;
              return (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={`text-[11px] font-semibold px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-600 text-white shadow-xs' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {variant.name}
                </button>
              );
            })}
          </div>

          {isOpen && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-bold text-emerald-600">${currentPrice.toFixed(2)}</span>
              {cartItem ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => onUpdateQty(product.id, selectedVariant?.id, -1)}
                    className="p-1.5 bg-white text-emerald-700 rounded-lg shadow-xs hover:bg-emerald-100 transition-all cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                  <span className="text-xs font-black text-emerald-900 px-1.5">{cartItem.quantity}</span>
                  <button
                    onClick={() => onUpdateQty(product.id, selectedVariant?.id, 1)}
                    className="p-1.5 bg-emerald-600 text-white rounded-lg shadow-xs hover:bg-emerald-700 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => onAdd(product, selectedVariant)}
                  className="bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" /> Agregar
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}