'use client';

import Image from 'next/image';
import { Category, Product } from '@/types';
import { Layers, Plus, Star } from 'lucide-react';

interface ProductSectionProps {
  categories: Category[];
  products: Product[];
  activeCategory: string | null;
  isOpen: boolean;
  categoryRefs: React.MutableRefObject<Record<string, HTMLElement | null>>;
  onCategoryClick: (categoryId: string) => void;
  onAddProduct: (product: Product) => void;
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

                  const cardStyle = !isAvailable
                    ? 'border-slate-100 opacity-60 bg-slate-50/50'
                    : isFeatured
                      ? 'border-amber-200 bg-amber-50/40 hover:border-amber-300'
                      : 'border-slate-100 bg-white hover:border-emerald-200';

                  return (
                    <div
                      key={product.id}
                      className={`flex justify-between items-stretch p-3.5 border rounded-2xl shadow-xs transition-all gap-3 ${cardStyle} ${
                        isAvailable ? 'cursor-pointer hover:shadow-md group/card' : ''
                      }`}
                      onClick={() => {
                        if (isAvailable) onAddProduct(product);
                      }}
                    >
                      {/* Lado Izquierdo: Información flexible */}
                      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
                        <div className="space-y-1.5">
                          <h3
                            className={`font-bold text-[15px] leading-tight tracking-tight ${
                              isAvailable ? 'text-slate-900 group-hover/card:text-emerald-700 transition-colors' : 'text-slate-500 line-through'
                            }`}
                          >
                            {product.name}
                          </h3>

                          {/* Badges compactos y en línea */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            {isFeatured && isAvailable && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md border border-amber-200/50">
                                <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Top
                              </span>
                            )}
                            {hasModifiers && isAvailable && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] uppercase tracking-wider font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-100">
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
                          className={`text-sm font-black pt-2 block ${
                            isAvailable ? (isFeatured ? 'text-amber-700' : 'text-emerald-700') : 'text-slate-400'
                          }`}
                        >
                          ${product.price.toFixed(2)}
                        </span>
                      </div>

                      {/* Lado Derecho: Imagen y Botón Flotante */}
                      <div className="shrink-0 flex items-center justify-center">
                        {product.image_url ? (
                          <div className="relative w-32 h-32 rounded-xl overflow-hidden shadow-sm border border-slate-100 bg-white group-hover/card:shadow-md transition-all">
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              fill
                              className="object-cover transition-transform duration-300 group-hover/card:scale-105"
                              sizes="128px"
                            />
                            
                            {/* OVERLAY: Botón flotante sobre la imagen */}
                            {isAvailable ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Evita la duplicación de eventos de click
                                  onAddProduct(product);
                                }}
                                className={`absolute bottom-2 right-2 w-8 h-8 rounded-full flex items-center justify-center shadow-lg transition-transform active:scale-95 z-10 ${
                                  isFeatured 
                                    ? 'bg-amber-500 text-white hover:bg-amber-600' 
                                    : 'bg-white text-emerald-600 border border-slate-100 hover:bg-emerald-50'
                                }`}
                                aria-label={`Agregar ${product.name}`}
                              >
                                <Plus className="w-5 h-5" />
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
                          /* Fallback visual cuando no hay imagen en la DB */
                          isAvailable ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddProduct(product);
                              }}
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer shadow-2xs ${
                                isFeatured 
                                  ? 'bg-amber-100 hover:bg-amber-500 text-amber-600 hover:text-white' 
                                  : 'bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white'
                              }`}
                              aria-label={`Agregar ${product.name}`}
                            >
                              <Plus className="w-5 h-5 transition-transform group-hover/card:rotate-90" />
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
    </>
  );
}