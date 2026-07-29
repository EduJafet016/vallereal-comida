'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant, Product, Category } from '@/types';
// 1. Agregado el ícono ListTree
import { Plus, RefreshCw, Utensils, Pencil, Trash2, Eye, EyeOff, Layers, Loader2, ListTree } from 'lucide-react';
import { ConfirmModal } from './products/ConfirmModal';
import { AddProductModal, NewProductData } from './products/AddProductModal';
import { EditProductModal } from './products/EditProductModal';
// 2. Importación del nuevo modal
import { ManageCategoriesModal } from './products/ManageCategoriesModal';

interface Props {
  tenant: Tenant;
  categories: Category[];
  products: Product[];
  loading: boolean;
  onReload: () => void;
}

export function ProductsSection({ tenant, categories, products: initialProducts, loading, onReload }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fuente de verdad local para evitar refetches globales innecesarios y saltos de posición
  const [localProducts, setLocalProducts] = useState<Product[]>(initialProducts);
  const [prevPropsProducts, setPrevPropsProducts] = useState<Product[]>(initialProducts);

  if (initialProducts !== prevPropsProducts) {
    setPrevPropsProducts(initialProducts);
    setLocalProducts(initialProducts);
  }

  // Modales
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  
  // 3. Estado para controlar el modal de categorías
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);

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
    const nextState = !product.is_available;
    setUpdatingId(product.id);

    // 1. Cambio local instantáneo (Cero parpadeos, cero retrasos)
    const updated = localProducts.map((p) => (p.id === product.id ? { ...p, is_available: nextState } : p));
    setLocalProducts(updated);

    const { error } = await supabase.from('products').update({ is_available: nextState }).eq('id', product.id);
    
    if (error) {
      alert(`Error al actualizar disponibilidad: ${error.message}`);
      setLocalProducts(initialProducts); // Revertir si ocurre un error de red
    }
    setUpdatingId(null);
  };

  const updatePrice = async (productId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setUpdatingId(productId);

    // Cambio local instantáneo
    const updated = localProducts.map((p) => (p.id === productId ? { ...p, price: newPrice } : p));
    setLocalProducts(updated);

    const { error } = await supabase.from('products').update({ price: newPrice }).eq('id', productId);
    if (error) {
      alert(`Error al actualizar precio: ${error.message}`);
      setLocalProducts(initialProducts);
    }
    setUpdatingId(null);
  };

  const executeDeleteProduct = async (product: Product) => {
    setUpdatingId(product.id);

    // Eliminación local instantánea
    const updated = localProducts.filter((p) => p.id !== product.id);
    setLocalProducts(updated);

    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      alert(`Error al eliminar platillo: ${error.message}`);
      setLocalProducts(initialProducts);
    } else {
      onReload(); // Solo recargamos si es necesario cuando se elimina físicamente o se agregan nuevos
    }
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
        onReload(); // Recarga necesaria al crear para traer IDs generados por la BD
      }
    } finally {
      setCreatingProduct(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-[#007A55]" /> Platillos
        </span>
        <div className="flex items-center gap-2">
          {/* 4. Botón de categorías inyectado aquí, respetando tu UI */}
          <button
            onClick={() => setIsCategoriesModalOpen(true)}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
            title="Gestionar categorías"
          >
            <ListTree className="w-3.5 h-3.5" /> Categorías
          </button>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 bg-[#007A55] hover:bg-[#006344] text-white text-xs font-bold rounded-xl transition-all shadow-2xs flex items-center gap-1 cursor-pointer active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
          <button
            onClick={onReload}
            disabled={loading}
            className="p-1.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition-all shadow-2xs cursor-pointer"
            title="Actualizar lista"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && localProducts.length === 0 ? (
        <div className="text-center py-6 text-xs text-slate-400">Cargando platillos...</div>
      ) : localProducts.length === 0 ? (
        <div className="text-center py-10 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-slate-400 space-y-2">
          <Utensils className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs font-medium text-slate-600">Aún no has agregado platillos.</p>
          <button onClick={() => setIsAddModalOpen(true)} className="inline-flex items-center gap-1 text-xs text-[#007A55] font-bold hover:underline cursor-pointer">
            <Plus className="w-3.5 h-3.5" /> Agregar mi primer platillo
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {localProducts.map((product) => {
            const groupsCount = product.modifier_groups?.length || 0;

            return (
              <div key={product.id} className="p-3 bg-slate-50/70 border border-slate-200/70 rounded-xl flex justify-between items-center gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-slate-900 text-xs truncate">{product.name}</h3>
                  {product.description && <p className="text-[11px] text-slate-500 truncate">{product.description}</p>}
                  
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className={`inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      product.is_available 
                        ? 'bg-emerald-100/70 text-[#007A55] border border-emerald-200' 
                        : 'bg-red-50 text-red-600 border border-red-200'
                    }`}>
                      {product.is_available ? 'Disponible' : 'Agotado'}
                    </span>
                    {groupsCount > 0 && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        <Layers className="w-3 h-3" /> {groupsCount} {groupsCount === 1 ? 'Grupo' : 'Grupos'}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                    <button 
                      onClick={() => setEditingProduct(product)} 
                      className="p-1.5 text-slate-500 hover:text-[#007A55] rounded-lg transition-colors cursor-pointer"
                      title="Editar"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product)} 
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-0.5 bg-white border border-slate-200 px-2 py-1 rounded-xl shadow-2xs">
                    <span className="text-xs font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      step="0.5"
                      defaultValue={product.price}
                      onBlur={(e) => updatePrice(product.id, parseFloat(e.target.value))}
                      className="w-12 text-xs font-bold text-slate-900 bg-transparent text-center focus:outline-none"
                    />
                  </div>

                  <button 
                    disabled={updatingId === product.id} 
                    onClick={() => toggleAvailability(product)} 
                    className={`p-2 rounded-xl border flex items-center transition-all cursor-pointer shadow-2xs ${
                      product.is_available 
                        ? 'bg-emerald-50 text-[#007A55] border-emerald-200 hover:bg-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                    title={product.is_available ? 'Marcar agotado' : 'Marcar disponible'}
                  >
                    {updatingId === product.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : product.is_available ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modales */}
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

      {/* 5. Montaje del nuevo modal */}
      {isCategoriesModalOpen && (
        <ManageCategoriesModal
          tenant={tenant}
          onClose={() => setIsCategoriesModalOpen(false)}
          onReload={onReload}
        />
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}