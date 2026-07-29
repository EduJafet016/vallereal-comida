'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant, Product, Category } from '@/types';
import { Plus, RefreshCw, Utensils, Pencil, Trash2, Eye, EyeOff, Layers, Loader2, ListTree, Star, GripVertical } from 'lucide-react';
import { ConfirmModal } from './products/ConfirmModal';
import { AddProductModal, NewProductData } from './products/AddProductModal';
import { EditProductModal } from './products/EditProductModal';
import { ManageCategoriesModal } from './products/ManageCategoriesModal';

// --- DND-KIT IMPORTS ---
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface Props {
  tenant: Tenant;
  categories: Category[];
  products: Product[];
  loading: boolean;
  onReload: () => void;
}

// ==========================================
// COMPONENTE INTERNO: Ítem Arrastrable
// ==========================================
interface SortableItemProps {
  product: Product;
  updatingId: string | null;
  toggleFeatured: (product: Product) => void;
  setEditingProduct: (product: Product) => void;
  handleDeleteProduct: (product: Product) => void;
  updatePrice: (productId: string, newPrice: number) => void;
  toggleAvailability: (product: Product) => void;
}

function SortableItem({
  product,
  updatingId,
  toggleFeatured,
  setEditingProduct,
  handleDeleteProduct,
  updatePrice,
  toggleAvailability,
}: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: product.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
    opacity: isDragging ? 0.6 : 1,
  };

  const groupsCount = product.modifier_groups?.length || 0;
  const isFeatured = product.is_featured;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 border rounded-xl flex justify-between items-center gap-3 transition-colors ${
        isFeatured ? 'bg-amber-50/45 border-amber-200' : 'bg-slate-50/70 border-slate-200/70'
      } ${isDragging ? 'shadow-lg bg-white ring-2 ring-[#007A55]/20' : ''}`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {/* Botón de agarre (Handle) */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 text-slate-400 hover:text-slate-600 cursor-grab active:cursor-grabbing shrink-0 touch-none"
          title="Reordenar platillo"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        <div className="min-w-0 flex-1">
          {/* Ajuste visual: items-start, break-words y shrink-0 en la estrella */}
          <div className="flex items-start gap-1.5 pr-2">
            <h3 className="font-bold text-slate-900 text-xs leading-tight break-words">
              {product.name}
            </h3>
            {isFeatured && (
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0 mt-[1px]" />
            )}
          </div>
          
          {/* Ajuste visual: line-clamp-2 en lugar de truncate */}
          {product.description && (
            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {product.description}
            </p>
          )}
          
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
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
          <button 
            onClick={() => toggleFeatured(product)} 
            disabled={updatingId === product.id}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${isFeatured ? 'text-amber-500 hover:text-amber-600 bg-amber-50' : 'text-slate-400 hover:text-amber-500'}`}
            title={isFeatured ? 'Quitar destacado' : 'Destacar platillo'}
          >
            <Star className={`w-3.5 h-3.5 ${isFeatured ? 'fill-amber-500' : ''}`} />
          </button>
          <div className="w-px h-4 bg-slate-200 mx-1"></div>
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
}

// ==========================================
// COMPONENTE PRINCIPAL
// ==========================================
export function ProductsSection({ tenant, categories, products: initialProducts, loading, onReload }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [localProducts, setLocalProducts] = useState<Product[]>(initialProducts);
  const [prevPropsProducts, setPrevPropsProducts] = useState<Product[]>(initialProducts);

  if (initialProducts !== prevPropsProducts) {
    setPrevPropsProducts(initialProducts);
    setLocalProducts(initialProducts);
  }

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
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

  // Configuración de sensores para dnd-kit
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Manejador del final del arrastre acotado por categoría
  const handleDragEnd = async (event: DragEndEvent, categoryId: string) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    // Filtrar únicamente los productos de esta categoría específica
    const categoryProducts = localProducts.filter((p) => p.category_id === categoryId);
    
    const oldIndex = categoryProducts.findIndex((p) => p.id === active.id);
    const newIndex = categoryProducts.findIndex((p) => p.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    // 1. Reordenamiento visual dentro de los límites de la categoría
    const reorderedCategoryProducts = arrayMove(categoryProducts, oldIndex, newIndex);
    
    // Asignar nuevos sort_orders basados en su posición dentro de la categoría
    const updatedCategoryWithIndices = reorderedCategoryProducts.map((prod, index) => ({
      ...prod,
      sort_order: index,
    }));

    // Reconstruir el arreglo global manteniendo intactas las demás categorías
    const otherProducts = localProducts.filter((p) => p.category_id !== categoryId);
    const newGlobalProducts = [...otherProducts, ...updatedCategoryWithIndices];

    setLocalProducts(newGlobalProducts);

    // 2. Persistencia en Supabase
    try {
      const updates = updatedCategoryWithIndices.map((prod) => 
        supabase
          .from('products')
          .update({ sort_order: prod.sort_order })
          .eq('id', prod.id)
      );

      await Promise.all(updates);
    } catch (error) {
      console.error('Error al guardar el nuevo orden:', error);
      alert('Hubo un error al guardar el orden de los platillos.');
      setLocalProducts(initialProducts);
    }
  };

  const toggleFeatured = async (product: Product) => {
    const nextState = !product.is_featured;
    setUpdatingId(product.id);

    const updated = localProducts.map((p) => (p.id === product.id ? { ...p, is_featured: nextState } : p));
    setLocalProducts(updated);

    const { error } = await supabase.from('products').update({ is_featured: nextState }).eq('id', product.id);
    
    if (error) {
      alert(`Error al actualizar estado destacado: ${error.message}`);
      setLocalProducts(initialProducts);
    }
    setUpdatingId(null);
  };

  const toggleAvailability = async (product: Product) => {
    const nextState = !product.is_available;
    setUpdatingId(product.id);

    const updated = localProducts.map((p) => (p.id === product.id ? { ...p, is_available: nextState } : p));
    setLocalProducts(updated);

    const { error } = await supabase.from('products').update({ is_available: nextState }).eq('id', product.id);
    
    if (error) {
      alert(`Error al actualizar disponibilidad: ${error.message}`);
      setLocalProducts(initialProducts);
    }
    setUpdatingId(null);
  };

  const updatePrice = async (productId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setUpdatingId(productId);

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

    const updated = localProducts.filter((p) => p.id !== product.id);
    setLocalProducts(updated);

    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      alert(`Error al eliminar platillo: ${error.message}`);
      setLocalProducts(initialProducts);
    } else {
      onReload(); 
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

      const categoryProductsCount = localProducts.filter(p => p.category_id === categoryId).length;

      const { error: prodErr } = await supabase.from('products').insert([{
        tenant_id: tenant.id,
        category_id: categoryId,
        name: data.name.trim(),
        description: data.description.trim() || null,
        price: parseFloat(data.price),
        is_available: true,
        sort_order: categoryProductsCount,
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
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      <div className="flex justify-between items-center border-b border-slate-100 pb-3">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Utensils className="w-3.5 h-3.5 text-[#007A55]" /> Platillos
        </span>
        <div className="flex items-center gap-2">
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
        <div className="space-y-6">
          {categories.map((category) => {
            const categoryProducts = localProducts.filter((p) => p.category_id === category.id);
            if (categoryProducts.length === 0) return null;

            return (
              <div key={category.id} className="space-y-2.5">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-1.5">
                  <div className="w-1.5 h-3.5 bg-[#007A55] rounded-full" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {category.name}
                  </h3>
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                    {categoryProducts.length}
                  </span>
                </div>

                <DndContext 
                  sensors={sensors} 
                  collisionDetection={closestCenter} 
                  onDragEnd={(e) => handleDragEnd(e, category.id)}
                >
                  <SortableContext 
                    items={categoryProducts.map((p) => p.id)} 
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2.5">
                      {categoryProducts.map((product) => (
                        <SortableItem
                          key={product.id}
                          product={product}
                          updatingId={updatingId}
                          toggleFeatured={toggleFeatured}
                          setEditingProduct={setEditingProduct}
                          handleDeleteProduct={handleDeleteProduct}
                          updatePrice={updatePrice}
                          toggleAvailability={toggleAvailability}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
              </div>
            );
          })}
        </div>
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