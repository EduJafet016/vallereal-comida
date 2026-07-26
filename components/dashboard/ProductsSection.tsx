'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant, Product, Category } from '@/types';
import { Plus, RefreshCw, Utensils, Pencil, Trash2, Eye, EyeOff, Layers } from 'lucide-react';
import { ConfirmModal } from './products/ConfirmModal';
import { AddProductModal, NewProductData } from './products/AddProductModal';
import { EditProductModal } from './products/EditProductModal';

interface Props {
  tenant: Tenant;
  categories: Category[];
  products: Product[];
  loading: boolean;
  onReload: () => void;
}

export function ProductsSection({ tenant, categories, products, loading, onReload }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const toggleAvailability = async (product: Product) => {
    setUpdatingId(product.id);
    const { error } = await supabase.from('products').update({ is_available: !product.is_available }).eq('id', product.id);
    if (!error) onReload();
    setUpdatingId(null);
  };

  const updatePrice = async (productId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setUpdatingId(productId);
    await supabase.from('products').update({ price: newPrice }).eq('id', productId);
    onReload();
    setUpdatingId(null);
  };

  const executeDeleteProduct = async (product: Product) => {
    setUpdatingId(product.id);
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (!error) onReload();
    setUpdatingId(null);
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteProduct = (product: Product) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar platillo?',
      message: `¿Estás seguro de eliminar "${product.name}"? Esta acción no se puede deshacer.`,
      onConfirm: () => executeDeleteProduct(product),
    });
  };

  const handleCreateProduct = async (data: NewProductData) => {
    setCreatingProduct(true);
    try {
      let categoryId = data.categoryId;

      if (!categoryId && data.newCategoryName.trim()) {
        const { data: newCat, error: catErr } = await supabase
          .from('categories')
          .insert([{ tenant_id: tenant.id, name: data.newCategoryName.trim(), sort_order: categories.length + 1 }])
          .select().single();
        if (catErr || !newCat) throw new Error('Error al crear categoría');
        categoryId = newCat.id;
      }

      if (!categoryId) return alert('Selecciona una categoría.');

      const { error: prodErr } = await supabase.from('products').insert([{
        tenant_id: tenant.id,
        category_id: categoryId,
        name: data.name.trim(),
        description: data.description.trim() || null,
        price: parseFloat(data.price),
        is_available: true,
      }]);

      if (!prodErr) {
        setIsAddModalOpen(false);
        onReload();
      }
    } finally {
      setCreatingProduct(false);
    }
  };

  return (
    <section className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Platillos</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
          <button onClick={onReload} className="text-xs text-emerald-600 font-semibold flex items-center gap-1 cursor-pointer">
            <RefreshCw className="w-3 h-3" /> Actualizar
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-6 text-xs text-gray-400">Cargando...</div>
      ) : products.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-2xl border border-dashed text-gray-400 space-y-2">
          <Utensils className="w-8 h-8 mx-auto text-gray-300" />
          <p className="text-xs font-medium text-gray-500">Aún no has agregado platillos.</p>
          <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold hover:underline cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Agregar mi primer platillo
          </button>
        </div>
      ) : (
        products.map((product) => {
          const groupsCount = product.modifier_groups?.length || 0;

          return (
            <div key={product.id} className="p-4 bg-white border rounded-2xl shadow-sm flex justify-between items-center gap-2">
              <div className="pr-2 flex-1">
                <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
                {product.description && <p className="text-xs text-gray-400 line-clamp-1">{product.description}</p>}
                
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${product.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                    {product.is_available ? 'Disponible' : 'Agotado'}
                  </span>
                  {groupsCount > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                      <Layers className="w-3 h-3" /> {groupsCount} {groupsCount === 1 ? 'Grupo' : 'Grupos'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setEditingProduct(product)} className="p-2 bg-gray-50 hover:bg-gray-100 border text-gray-600 rounded-xl transition-all cursor-pointer">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDeleteProduct(product)} className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all cursor-pointer">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1 bg-gray-50 border px-2 py-1 rounded-xl">
                  <span className="text-xs font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.5"
                    defaultValue={product.price}
                    onBlur={(e) => updatePrice(product.id, parseFloat(e.target.value))}
                    className="w-12 text-sm font-bold text-gray-900 bg-transparent text-center focus:outline-none"
                  />
                </div>
                <button disabled={updatingId === product.id} onClick={() => toggleAvailability(product)} className={`p-2 rounded-xl border flex items-center transition-all cursor-pointer ${product.is_available ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                  {updatingId === product.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : product.is_available ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>
            </div>
          );
        })
      )}

      <AddProductModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        categories={categories}
        isSaving={creatingProduct}
        onSave={handleCreateProduct}
      />

      <EditProductModal
        product={editingProduct}
        tenant={tenant}
        onClose={() => setEditingProduct(null)}
        onReload={onReload}
      />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </section>
  );
}