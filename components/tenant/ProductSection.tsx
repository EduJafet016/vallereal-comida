'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Category, Product, ProductVariant } from '@/types';
import { useCartDispatch } from '@/context/CartContext';
import { Layers, Plus, Star, Check, SlidersHorizontal } from 'lucide-react';
import VariantModal from '@/components/VariantModal';

interface FormattedModifier {
  groupName: string;
  modifierName: string;
  priceDelta: number;
}

interface ProductSectionProps {
  categories: Category[];
  products: Product[];
  activeCategory: string | null;
  isOpen: boolean;
  categoryRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onCategoryClick: (categoryId: string) => void;
  onAddProduct: (product: Product) => void;
}

function FlyingItem({ 
  startX, 
  startY, 
  image, 
  onComplete 
}: { 
  startX: number; 
  startY: number; 
  image: string; 
  onComplete: () => void;
}) {
  const [style, setStyle] = useState({
    transform: `translate3d(${startX - 24}px, ${startY - 24}px, 0) scale(1)`,
    opacity: 1,
  });

  useEffect(() => {
    const targetX = window.innerWidth / 2;
    const targetY = window.innerHeight - 60;

    requestAnimationFrame(() => {
      setTimeout(() => {
        setStyle({
          transform: `translate3d(${targetX - 24}px, ${targetY - 24}px, 0) scale(0.15)`,
          opacity: 0,
        });
      }, 20);
    });

    const timer = setTimeout(onComplete, 600);
    return () => clearTimeout(timer);
  }, [startX, startY, onComplete]);

  return (
    <div
      className="fixed z-[100] w-12 h-12 rounded-full overflow-hidden border-2 border-emerald-500 shadow-2xl pointer-events-none"
      style={{
        left: 0,
        top: 0,
        transform: style.transform,
        opacity: style.opacity,
        transition: 'transform 0.6s cubic-bezier(0.25, 1, 0.5, 1), opacity 0.5s ease-in 0.1s',
      }}
    >
      {image ? (
        <Image src={image} fill className="object-cover" alt="" sizes="48px" />
      ) : (
        <div className="w-full h-full bg-emerald-100" />
      )}
    </div>
  );
}

export function ProductSection({
  categories,
  products,
  activeCategory,
  isOpen,
  categoryRefs,
  onCategoryClick,
  onAddProduct,
}: ProductSectionProps) {
  const dispatch = useCartDispatch();
  
  const [addedStatus, setAddedStatus] = useState<Record<string, boolean>>({});
  const [variantOpeningStatus, setVariantOpeningStatus] = useState<Record<string, boolean>>({});
  const [flyingItems, setFlyingItems] = useState<{ id: string; x: number; y: number; img: string }[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const handleActionClick = (e: React.MouseEvent, product: Product, hasMods: boolean) => {
    e.stopPropagation(); 

    if (hasMods) {
      setVariantOpeningStatus((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => {
        setEditingProduct(product);
        setVariantOpeningStatus((prev) => ({ ...prev, [product.id]: false }));
      }, 150);
    } else {
      setAddedStatus((prev) => ({ ...prev, [product.id]: true }));
      setTimeout(() => setAddedStatus((prev) => ({ ...prev, [product.id]: false })), 1200);

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const clickX = e.clientX || rect.left + rect.width / 2;
      const clickY = e.clientY || rect.top + rect.height / 2;

      setFlyingItems((prev) => [
        ...prev,
        { id: Date.now().toString() + Math.random(), x: clickX, y: clickY, img: product.image_url || '' }
      ]);

      onAddProduct(product);
    }
  };

  return (
    <>
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-100 shadow-2xs mt-6 py-2.5">
        <div className="max-w-md mx-auto px-4 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((category) => {
            const hasProducts = products.some((p) => p.category_id === category.id);
            if (!hasProducts) return null;

            const isSelected = activeCategory === category.id;

            return (
              <button
                key={category.id}
                onClick={() => onCategoryClick(category.id)}
                className={`text-xs font-bold px-4 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer shadow-2xs ${
                  isSelected
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20 shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {category.name}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-md mx-auto px-4 mt-6 space-y-8">
        {categories.map((category) => {
          const categoryProducts = products.filter((p) => p.category_id === category.id);
          if (categoryProducts.length === 0) return null;

          return (
            <section
              key={category.id}
              ref={(el) => { categoryRefs.current[category.id] = el; }}
              className="scroll-mt-24 space-y-3"
            >
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-emerald-600 rounded-full" />
                <h2 className="text-xs font-black uppercase tracking-wider text-slate-800">
                  {category.name}
                </h2>
              </div>

              <div className="space-y-3">
                {categoryProducts.map((product) => {
                  const hasModifiers =
                    (Array.isArray(product.modifier_groups) && product.modifier_groups.length > 0) ||
                    (Array.isArray(product.product_variants) && product.product_variants.length > 0);
                  
                  const isAvailable = isOpen && product.is_available;
                  const isFeatured = product.is_featured;
                  const isRecentlyAdded = addedStatus[product.id];
                  const isOpeningVariant = variantOpeningStatus[product.id];

                  const cardStyle = !isAvailable
                    ? 'border-slate-100 opacity-60 bg-slate-50/50'
                    : isRecentlyAdded
                      ? 'border-emerald-400 bg-emerald-50/30'
                      : isOpeningVariant
                        ? 'border-indigo-400 bg-indigo-50/30 scale-[0.98]'
                        : isFeatured
                          ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300'
                          : 'border-slate-100 bg-white hover:border-emerald-200';

                  return (
                    <div
                      key={product.id}
                      className={`flex justify-between items-stretch p-3.5 border rounded-2xl shadow-xs transition-all duration-300 gap-3 ${cardStyle} ${
                        isAvailable ? 'cursor-pointer hover:shadow-md group/card' : ''
                      }`}
                      onClick={(e) => {
                        if (isAvailable) handleActionClick(e, product, hasModifiers);
                      }}
                    >
                      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                        <div className="space-y-1.5">
                          <h3
                            className={`font-bold text-[15px] leading-tight tracking-tight transition-colors ${
                              isAvailable 
                                ? isRecentlyAdded 
                                  ? 'text-emerald-700' 
                                  : isOpeningVariant
                                    ? 'text-indigo-700'
                                    : 'text-slate-900 group-hover/card:text-emerald-700' 
                                : 'text-slate-500 line-through'
                            }`}
                          >
                            {product.name}
                          </h3>

                          <div className="flex flex-wrap items-center gap-1.5">
                            {isFeatured && isAvailable && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-200/50">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Top
                              </span>
                            )}
                            {hasModifiers && isAvailable && (
                              <span className={`inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider font-black px-1.5 py-0.5 rounded-md border transition-colors ${
                                isOpeningVariant ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                              }`}>
                                <Layers className="w-2.5 h-2.5" /> Al gusto
                              </span>
                            )}
                          </div>

                          {product.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed pr-2">
                              {product.description}
                            </p>
                          )}
                        </div>

                        <span
                          className={`text-sm font-black pt-2 block transition-colors ${
                            isAvailable 
                              ? isRecentlyAdded 
                                ? 'text-emerald-600' 
                                : isOpeningVariant
                                  ? 'text-indigo-600'
                                  : isFeatured ? 'text-amber-700' : 'text-emerald-700' 
                              : 'text-slate-400'
                          }`}
                        >
                          ${product.price.toFixed(2)}
                        </span>
                      </div>

                      <div className="shrink-0 flex items-center justify-center">
                        {product.image_url ? (
                          <div className={`relative w-32 h-32 rounded-xl overflow-hidden shadow-sm border bg-white transition-all duration-300 ${
                            isRecentlyAdded ? 'border-emerald-400 scale-[0.98]' : isOpeningVariant ? 'border-indigo-400 scale-95' : 'border-slate-100 group-hover/card:shadow-md'
                          }`}>
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className={`object-cover transition-transform duration-500 ${
                                isRecentlyAdded ? 'scale-110 opacity-90' : isOpeningVariant ? 'scale-105 blur-[1px]' : 'group-hover/card:scale-105'
                              }`}
                              sizes="128px"
                            />
                            
                            {isAvailable ? (
                              <button
                                onClick={(e) => handleActionClick(e, product, hasModifiers)}
                                className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 z-10 ${
                                  isRecentlyAdded
                                    ? 'bg-emerald-500 text-white scale-110 shadow-emerald-500/40' 
                                    : isOpeningVariant
                                      ? 'bg-indigo-600 text-white shadow-indigo-500/40 scale-105'
                                      : isFeatured 
                                        ? 'bg-amber-500 text-white hover:bg-amber-600 hover:scale-105 active:scale-95' 
                                        : 'bg-white text-emerald-600 border border-slate-100 hover:bg-emerald-50 hover:scale-105 active:scale-95'
                                }`}
                                aria-label={`Agregar ${product.name}`}
                              >
                                {isRecentlyAdded ? (
                                  <Check className="w-5 h-5 animate-in zoom-in duration-200" />
                                ) : isOpeningVariant ? (
                                  <SlidersHorizontal className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Plus className="w-5 h-5" />
                                )}
                              </button>
                            ) : (
                              <div className="absolute inset-x-0 bottom-0 bg-black/70 backdrop-blur-sm py-1.5 flex justify-center z-10">
                                <span className="text-[10px] font-bold text-white tracking-widest uppercase">
                                  {!isOpen ? 'Cerrado' : 'Agotado'}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : (
                          isAvailable ? (
                            <button
                              onClick={(e) => handleActionClick(e, product, hasModifiers)}
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shrink-0 cursor-pointer group ${
                                isRecentlyAdded
                                  ? 'bg-emerald-500 text-white scale-110 shadow-lg shadow-emerald-500/40'
                                  : isOpeningVariant
                                    ? 'bg-indigo-600 text-white scale-95 shadow-lg shadow-indigo-500/40'
                                    : isFeatured 
                                      ? 'bg-amber-100 hover:bg-amber-500 text-amber-600 hover:text-white shadow-2xs active:scale-95' 
                                      : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white shadow-2xs active:scale-95'
                              }`}
                              aria-label={`Agregar ${product.name}`}
                            >
                              {isRecentlyAdded ? (
                                <Check className="w-5 h-5 animate-in zoom-in duration-200" />
                              ) : isOpeningVariant ? (
                                <SlidersHorizontal className="w-4 h-4 animate-spin" />
                              ) : (
                                <Plus className="w-5 h-5 transition-transform group-hover/card:rotate-90" />
                              )}
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-xl shrink-0 select-none">
                              {!isOpen ? 'Cerrado' : 'Agotado'}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      <VariantModal
        isOpen={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        product={editingProduct}
        onConfirmWithCoords={(
          e: React.MouseEvent,
          finalPrice: number,
          variant: ProductVariant | undefined,
          formattedModifiers: FormattedModifier[],
          notes: string
        ) => {
          if (!editingProduct) return;

          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          const clickX = e.clientX || rect.left + rect.width / 2;
          const clickY = e.clientY || rect.top + rect.height / 2;

          setFlyingItems((prev) => [
            ...prev,
            { id: Date.now().toString() + Math.random(), x: clickX, y: clickY, img: editingProduct.image_url || '' }
          ]);

          dispatch({
            type: 'ADD_ITEM',
            payload: {
              product: editingProduct,
              variant,
              selectedModifiers: formattedModifiers,
              finalUnitPrice: finalPrice,
              notes: notes || undefined,
            },
          });
        }}
      />

      {flyingItems.map((item) => (
        <FlyingItem 
          key={item.id} 
          startX={item.x} 
          startY={item.y} 
          image={item.img} 
          onComplete={() => setFlyingItems((prev) => prev.filter((i) => i.id !== item.id))} 
        />
      ))}
    </>
  );
}