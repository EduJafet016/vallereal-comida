'use client';

import { Category, Product } from '@/types';
import { Layers, Plus } from 'lucide-react';

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

                  return (
                    <div
                      key={product.id}
                      className={`flex justify-between items-center p-4 bg-white border rounded-2xl shadow-xs transition-all ${
                        isAvailable
                          ? 'border-slate-100 hover:border-emerald-200 hover:shadow-md'
                          : 'border-slate-100 opacity-60 bg-slate-50/50'
                      }`}
                    >
                      <div className="flex-1 pr-3 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3
                            className={`font-bold text-sm tracking-tight ${
                              isAvailable ? 'text-slate-900' : 'text-slate-500 line-through'
                            }`}
                          >
                            {product.name}
                          </h3>

                          {hasModifiers && isAvailable && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-100">
                              <Layers className="w-3 h-3" /> Personalizable
                            </span>
                          )}

                          {!product.is_available && (
                            <span className="text-[10px] font-bold bg-rose-50 text-rose-600 px-2 py-0.5 rounded-full border border-rose-100">
                              Agotado
                            </span>
                          )}
                        </div>

                        {product.description && (
                          <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed font-normal">
                            {product.description}
                          </p>
                        )}

                        <span
                          className={`text-sm font-black block pt-0.5 ${
                            isAvailable ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          ${product.price.toFixed(2)}
                        </span>
                      </div>

                      {isAvailable ? (
                        <button
                          onClick={() => onAddProduct(product)}
                          className="w-10 h-10 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 shrink-0 cursor-pointer shadow-2xs group"
                          aria-label={`Agregar ${product.name}`}
                        >
                          <Plus className="w-5 h-5 transition-transform group-hover:rotate-90" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-3 py-2 rounded-xl shrink-0 select-none">
                          {!isOpen ? 'Cerrado' : 'Agotado'}
                        </span>
                      )}
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