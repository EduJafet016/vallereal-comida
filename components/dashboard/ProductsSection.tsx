'use client';

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant, Product, Category, ModifierGroup, Modifier } from '@/types';
import { Plus, RefreshCw, Utensils, Pencil, Trash2, Eye, EyeOff, X, Layers, Check } from 'lucide-react';

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

  // Modal Editar Producto + Modificadores
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // Estado local para los grupos de modificadores del producto en edición
  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [loadingModifiers, setLoadingModifiers] = useState(false);

  // Estados temporales para crear nuevos grupos / opciones
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupRequired, setNewGroupRequired] = useState(true);
  const [newGroupType, setNewGroupType] = useState<'single' | 'multiple'>('single');
  
  // Control de inputs por grupo para añadir modificadores: { [groupId]: { name: string, priceDelta: string } }
  const [modifierInputs, setModifierInputs] = useState<Record<string, { name: string; priceDelta: string }>>({});

  // Estado para editar un modificador existente de forma en línea: { [modifierId]: { name: string, priceDelta: string } }
  const [editingModifierState, setEditingModifierState] = useState<Record<string, { name: string; priceDelta: string }>>({});

  // Estado para el Modal de Confirmación Personalizado (Sustituye a window.confirm)
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

  // Cargar modificadores desde Supabase cuando se abre el modal de edición
  const fetchProductModifiers = useCallback(async (productId: string) => {
    setLoadingModifiers(true);
    setModifierGroups([]);
    const { data: groups, error } = await supabase
      .from('modifier_groups')
      .select('*, modifiers(*)')
      .eq('product_id', productId)
      .order('created_at', { ascending: true });

    if (!error && groups) {
      setModifierGroups(groups);
    }
    setLoadingModifiers(false);
  }, []);

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

  // --- GESTIÓN DE MODIFICADORES ---
  const handleAddGroup = async () => {
    if (!editingProduct || !newGroupName.trim()) return;

    const isSingle = newGroupType === 'single';

    const { data, error } = await supabase
      .from('modifier_groups')
      .insert([
        {
          product_id: editingProduct.id,
          tenant_id: tenant.id,
          name: newGroupName.trim(),
          is_required: newGroupRequired,
          min_selections: newGroupRequired ? 1 : 0,
          max_selections: isSingle ? 1 : 5,
        },
      ])
      .select('*, modifiers(*)')
      .single();

    if (!error && data) {
      setModifierGroups([...modifierGroups, data]);
      setNewGroupName('');
      setNewGroupRequired(true);
      setNewGroupType('single');
    }
  };

  const executeDeleteGroup = async (groupId: string) => {
    const { error } = await supabase.from('modifier_groups').delete().eq('id', groupId);
    if (!error) {
      setModifierGroups(modifierGroups.filter((g) => g.id !== groupId));
    }
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar grupo de opciones?',
      message: `¿Eliminar el grupo "${groupName}" y todas sus opciones?`,
      onConfirm: () => executeDeleteGroup(groupId),
    });
  };

  const handleAddModifier = async (groupId: string) => {
    const input = modifierInputs[groupId];
    if (!input || !input.name.trim()) return;

    const priceDelta = parseFloat(input.priceDelta) || 0;

    const { data, error } = await supabase
      .from('modifiers')
      .insert([
        {
          group_id: groupId,
          name: input.name.trim(),
          price_delta: priceDelta,
          is_available: true,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      setModifierGroups(
        modifierGroups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              modifiers: [...(group.modifiers || []), data],
            };
          }
          return group;
        })
      );
      setModifierInputs({
        ...modifierInputs,
        [groupId]: { name: '', priceDelta: '' },
      });
    }
  };

  const handleUpdateModifier = async (groupId: string, modifierId: string) => {
    const state = editingModifierState[modifierId];
    if (!state || !state.name.trim()) return;

    const priceDelta = parseFloat(state.priceDelta) || 0;

    const { error } = await supabase
      .from('modifiers')
      .update({ name: state.name.trim(), price_delta: priceDelta })
      .eq('id', modifierId);

    if (!error) {
      setModifierGroups(
        modifierGroups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              modifiers: group.modifiers?.map((m) => (m.id === modifierId ? { ...m, name: state.name.trim(), price_delta: priceDelta } : m)),
            };
          }
          return group;
        })
      );
      const copy = { ...editingModifierState };
      delete copy[modifierId];
      setEditingModifierState(copy);
    }
  };

  const executeDeleteModifier = async (groupId: string, modifierId: string) => {
    const { error } = await supabase.from('modifiers').delete().eq('id', modifierId);
    if (!error) {
      setModifierGroups(
        modifierGroups.map((group) => {
          if (group.id === groupId) {
            return {
              ...group,
              modifiers: group.modifiers?.filter((m) => m.id !== modifierId),
            };
          }
          return group;
        })
      );
    }
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteModifier = (groupId: string, modifierId: string, modName: string) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar opción?',
      message: `¿Estás seguro de eliminar la opción "${modName}"?`,
      onConfirm: () => executeDeleteModifier(groupId, modifierId),
    });
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
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold hover:underline cursor-pointer"
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
                  fetchProductModifiers(product.id);
                }}
                className="p-2 bg-gray-50 hover:bg-gray-100 border text-gray-600 rounded-xl transition-all active:scale-95 cursor-pointer"
                title="Editar platillo y opciones"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => handleDeleteProduct(product)}
                className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all active:scale-95 cursor-pointer"
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
                className={`p-2 rounded-xl text-xs font-bold border flex items-center gap-1 transition-all active:scale-95 cursor-pointer ${
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
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
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
                placeholder="Precio Base ($)"
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
                className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs shadow-md cursor-pointer"
              >
                {creatingProduct ? 'Guardando...' : 'Guardar Platillo'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Producto y sus Modificadores */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">Editar Platillo: {editingProduct.name}</h3>
                  <p className="text-xs text-gray-500">Configura nombre, precio y opciones</p>
                </div>
              </div>
              <button onClick={() => setEditingProduct(null)} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-5 pr-1">
              <form onSubmit={handleSaveProductEdit} id="edit-product-form" className="space-y-3 bg-gray-50 p-4 rounded-2xl border">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Información General</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nombre"
                    value={editProdName}
                    onChange={(e) => setEditProdName(e.target.value)}
                    className="w-full p-2.5 bg-white border rounded-xl text-xs text-gray-900 font-medium sm:col-span-2"
                  />
                  <input
                    type="number"
                    step="0.5"
                    required
                    placeholder="Precio Base"
                    value={editProdPrice}
                    onChange={(e) => setEditProdPrice(e.target.value)}
                    className="w-full p-2.5 bg-white border rounded-xl text-xs text-gray-900 font-medium"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Descripción"
                  value={editProdDesc}
                  onChange={(e) => setEditProdDesc(e.target.value)}
                  className="w-full p-2.5 bg-white border rounded-xl text-xs text-gray-900 font-medium"
                />
                <button
                  type="submit"
                  disabled={savingProduct}
                  className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
                >
                  {savingProduct ? 'Actualizando...' : 'Guardar Cambios Generales'}
                </button>
              </form>

              {/* Sección de Grupos de Modificadores */}
              <div className="space-y-3 pt-2 border-t">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Grupos de Opciones</h4>

                {/* Formulario Crear Grupo */}
                <div className="space-y-2 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-100">
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Nombre del Grupo (ej. Ingredientes)"
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      className="flex-1 p-2 bg-white border rounded-xl text-xs font-medium text-gray-900"
                    />
                    <select
                      value={newGroupType}
                      onChange={(e) => setNewGroupType(e.target.value as 'single' | 'multiple')}
                      className="p-2 bg-white border rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
                    >
                      <option value="single">Selección Única (Ej. 1)</option>
                      <option value="multiple">Selección Múltiple / Combinados</option>
                    </select>
                  </div>

                  <div className="flex justify-between items-center pt-1">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-white px-3 py-1.5 border rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={newGroupRequired}
                        onChange={(e) => setNewGroupRequired(e.target.checked)}
                        className="rounded accent-emerald-600"
                      />
                      Obligatorio
                    </label>

                    <button
                      type="button"
                      onClick={handleAddGroup}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Grupo
                    </button>
                  </div>
                </div>

                {/* Listado de Grupos */}
                {loadingModifiers ? (
                  <p className="text-xs text-gray-400 text-center py-4">Cargando opciones...</p>
                ) : modifierGroups.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4 italic">No hay grupos de opciones configurados para este platillo.</p>
                ) : (
                  <div className="space-y-4">
                    {modifierGroups.map((group) => {
                      const currentInput = modifierInputs[group.id] || { name: '', priceDelta: '' };
                      const isSingle = group.max_selections === 1;

                      return (
                        <div key={group.id} className="p-3.5 bg-white border rounded-2xl shadow-sm space-y-3">
                          <div className="flex justify-between items-center border-b pb-2">
                            <div>
                              <h5 className="font-bold text-xs text-gray-900 uppercase">{group.name}</h5>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                                  {group.is_required ? 'Obligatorio' : 'Opcional'}
                                </span>
                                <span className="text-[10px] text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">
                                  {isSingle ? 'Selección Única' : `Múltiple (Máx. ${group.max_selections})`}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteGroup(group.id, group.name)}
                              className="text-red-500 hover:text-red-700 p-1 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Eliminar grupo
                            </button>
                          </div>

                          {/* Listado de Opciones con opción de Editar y Borrar */}
                          <div className="space-y-2 pl-2">
                            {group.modifiers?.map((mod) => {
                              const isEditingThis = editingModifierState[mod.id] !== undefined;
                              const modState = editingModifierState[mod.id] || { name: mod.name, priceDelta: mod.price_delta.toString() };

                              return (
                                <div key={mod.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border text-xs gap-2">
                                  {isEditingThis ? (
                                    <div className="flex flex-1 gap-2 items-center">
                                      <input
                                        type="text"
                                        value={modState.name}
                                        onChange={(e) =>
                                          setEditingModifierState({
                                            ...editingModifierState,
                                            [mod.id]: { ...modState, name: e.target.value },
                                          })
                                        }
                                        className="flex-1 p-1 bg-white border rounded-lg text-xs text-gray-900 font-medium"
                                      />
                                      <input
                                        type="number"
                                        step="0.5"
                                        value={modState.priceDelta}
                                        onChange={(e) =>
                                          setEditingModifierState({
                                            ...editingModifierState,
                                            [mod.id]: { ...modState, priceDelta: e.target.value },
                                          })
                                        }
                                        className="w-16 p-1 bg-white border rounded-lg text-xs text-gray-900 font-medium"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateModifier(group.id, mod.id)}
                                        className="p-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
                                        title="Guardar cambios"
                                      >
                                        <Check className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const copy = { ...editingModifierState };
                                          delete copy[mod.id];
                                          setEditingModifierState(copy);
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                                        title="Cancelar"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <>
                                      <span className="font-medium text-gray-800 flex-1">{mod.name}</span>
                                      <div className="flex items-center gap-3">
                                        <span className="font-bold text-emerald-600">
                                          {mod.price_delta > 0 ? `+$${mod.price_delta.toFixed(2)}` : 'Sin costo extra'}
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            setEditingModifierState({
                                              ...editingModifierState,
                                              [mod.id]: { name: mod.name, priceDelta: mod.price_delta.toString() },
                                            })
                                          }
                                          className="text-gray-400 hover:text-emerald-600 cursor-pointer"
                                          title="Editar opción"
                                        >
                                          <Pencil className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteModifier(group.id, mod.id, mod.name)}
                                          className="text-gray-400 hover:text-red-600 cursor-pointer"
                                          title="Eliminar opción"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              );
                            })}

                            {/* Inputs para agregar una nueva opción al grupo */}
                            <div className="flex gap-2 pt-1">
                              <input
                                type="text"
                                placeholder="Nombre (ej. Arrachera)"
                                value={currentInput.name}
                                onChange={(e) =>
                                  setModifierInputs({
                                    ...modifierInputs,
                                    [group.id]: {
                                      ...currentInput,
                                      name: e.target.value,
                                    },
                                  })
                                }
                                className="flex-1 p-2 border rounded-xl text-xs font-medium bg-white text-gray-900"
                              />
                              <input
                                type="number"
                                step="0.5"
                                placeholder="Extra ($)"
                                value={currentInput.priceDelta}
                                onChange={(e) =>
                                  setModifierInputs({
                                    ...modifierInputs,
                                    [group.id]: {
                                      ...currentInput,
                                      priceDelta: e.target.value,
                                    },
                                  })
                                }
                                className="w-20 p-2 border rounded-xl text-xs font-medium bg-white text-gray-900"
                              />
                              <button
                                type="button"
                                onClick={() => handleAddModifier(group.id)}
                                className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer"
                              >
                                Agregar
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2 border-t shrink-0 flex justify-end">
              <button
                type="button"
                onClick={() => setEditingProduct(null)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md transition-all cursor-pointer"
              >
                Cerrar y Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación Personalizado */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
              ⚠️
            </div>
            <h3 className="text-lg font-bold text-gray-900 leading-snug">
              {confirmModal.title}
            </h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              {confirmModal.message}
            </p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmModal.onConfirm}
                className="w-full py-3 bg-red-600 text-white rounded-2xl font-bold text-xs hover:bg-red-700 transition-all shadow-md shadow-red-600/20 cursor-pointer"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}