'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant, Product, Category } from '@/types';
import { Plus, RefreshCw, Utensils, Pencil, Trash2, Eye, EyeOff, X } from 'lucide-react';

interface Props {
  tenant: Tenant;
  categories: Category[];
  products: Product[];
  loading: boolean;
  onReload: () => void;
}

export function ProductsSection({ tenant, categories, products, loading, onReload }: Props) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal Nuevo Producto
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Modal Editar Producto
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  const toggleAvailability = async (product: Product) => {
    setUpdatingId(product.id);
    const newStatus = !product.is_available;

    const { error } = await supabase
      .from('products')
      .update({ is_available: newStatus })
      .eq('id', product.id);

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

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"?`)) return;

    setUpdatingId(product.id);
    const { error } = await supabase.from('products').delete().eq('id', product.id);

    if (!error) onReload();
    setUpdatingId(null);
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingProduct(true);

    try {
      let categoryId = newProdCategory;

      if (!categoryId && newCategoryName.trim()) {
        const { data: newCat, error: catErr } = await supabase
          .from('categories')
          .insert([{ tenant_id: tenant.id, name: newCategoryName.trim(), sort_order: categories.length + 1 }])
          .select()
          .single();

        if (catErr || !newCat) throw new Error('Error al crear categoría');
        categoryId = newCat.id;
      }

      if (!categoryId) return alert('Selecciona una categoría.');

      const { error: prodErr } = await supabase.from('products').insert([
        {
          tenant_id: tenant.id,
          category_id: categoryId,
          name: newProdName.trim(),
          description: newProdDesc.trim() || null,
          price: parseFloat(newProdPrice),
          is_available: true,
        },
      ]);

      if (!prodErr) {
        setNewProdName('');
        setNewProdPrice('');
        setNewProdDesc('');
        setNewProdCategory('');
        setNewCategoryName('');
        setIsAddModalOpen(false);
        onReload();
      }
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSavingProduct(true);
    const { error } = await supabase
      .from('products')
      .update({
        name: editProdName.trim(),
        price: parseFloat(editProdPrice),
        description: editProdDesc.trim() || null,
      })
      .eq('id', editingProduct.id);

    if (!error) {
      setEditingProduct(null);
      onReload();
    }
    setSavingProduct(false);
  };

  return (
    <section className="space-y-3">
      <div className="flex justify-between items-center px-1">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">Platillos</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar
          </button>
          <button onClick={onReload} className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
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
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold hover:underline"
          >
            <Plus className="w-3.5 h-3.5" /> Agregar mi primer platillo
          </button>
        </div>
      ) : (
        products.map((product) => (
          <div key={product.id} className="p-4 bg-white border rounded-2xl shadow-sm flex justify-between items-center gap-2">
            <div className="pr-2 flex-1">
              <h3 className="font-semibold text-gray-900 text-sm">{product.name}</h3>
              {product.description && <p className="text-xs text-gray-400 line-clamp-1">{product.description}</p>}
              <span className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${product.is_available ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                {product.is_available ? 'Disponible' : 'Agotado'}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  setEditingProduct(product);
                  setEditProdName(product.name);
                  setEditProdPrice(product.price.toString());
                  setEditProdDesc(product.description || '');
                }}
                className="p-2 bg-gray-50 hover:bg-gray-100 border text-gray-600 rounded-xl transition-all active:scale-95"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleDeleteProduct(product)}
                className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all active:scale-95"
              >
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

              <button
                disabled={updatingId === product.id}
                onClick={() => toggleAvailability(product)}
                className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all active:scale-95 ${
                  product.is_available
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                }`}
              >
                {updatingId === product.id ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : product.is_available ? (
                  <Eye className="w-4 h-4" />
                ) : (
                  <EyeOff className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ))
      )}

      {/* Modal Agregar Producto */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Nuevo Platillo</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3">
              <input
                type="text"
                required
                placeholder="Nombre del Platillo"
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium"
              />
              <input
                type="number"
                step="0.5"
                required
                placeholder="Precio ($)"
                value={newProdPrice}
                onChange={(e) => setNewProdPrice(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium"
              />

              {categories.length > 0 && (
                <select
                  value={newProdCategory}
                  onChange={(e) => setNewProdCategory(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium"
                >
                  <option value="">-- Seleccionar categoría --</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              )}

              {(!newProdCategory || categories.length === 0) && (
                <input
                  type="text"
                  placeholder="Nueva categoría (Ej. Bebidas)"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium"
                />
              )}

              <textarea
                rows={2}
                placeholder="Descripción (Opcional)"
                value={newProdDesc}
                onChange={(e) => setNewProdDesc(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium"
              />

              <button
                type="submit"
                disabled={creatingProduct}
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs shadow-md"
              >
                {creatingProduct ? 'Guardando...' : 'Guardar Platillo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Producto */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-gray-900 text-base">Editar Platillo</h3>
              <button onClick={() => setEditingProduct(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProductEdit} className="space-y-3">
              <input
                type="text"
                required
                value={editProdName}
                onChange={(e) => setEditProdName(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium"
              />
              <input
                type="number"
                step="0.5"
                required
                value={editProdPrice}
                onChange={(e) => setEditProdPrice(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium"
              />
              <textarea
                rows={3}
                value={editProdDesc}
                onChange={(e) => setEditProdDesc(e.target.value)}
                className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium"
              />

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 bg-gray-100 text-gray-700 font-bold py-2.5 rounded-xl text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="flex-1 bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs shadow-md"
                >
                  {savingProduct ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}