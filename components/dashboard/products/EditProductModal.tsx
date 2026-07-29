'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Product, Tenant, ModifierGroup, Modifier, TenantIngredient, ProductVariant } from '@/types';
import { X, Layers, Plus, Pencil, Trash2, Check, Search, Link as LinkIcon } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

interface EditProductModalProps {
  product: Product | null;
  tenant: Tenant;
  onClose: () => void;
  onReload: () => void;
}

export function EditProductModal({ product, tenant, onClose, onReload }: EditProductModalProps) {
  const [editProdName, setEditProdName] = useState(product?.name || '');
  const [editProdPrice, setEditProdPrice] = useState(product?.price?.toString() || '');
  const [editProdDesc, setEditProdDesc] = useState(product?.description || '');
  const [savingProduct, setSavingProduct] = useState(false);

  // Estados para Variantes (Tamaños/Porciones)
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [newVariantName, setNewVariantName] = useState('');
  const [newVariantPrice, setNewVariantPrice] = useState('');
  const [editingVariantState, setEditingVariantState] = useState<Record<string, { name: string; price: string }>>({});

  const [modifierGroups, setModifierGroups] = useState<ModifierGroup[]>([]);
  const [tenantGroups, setTenantGroups] = useState<{ id: string, name: string }[]>([]); 
  const [selectedGlobalGroupId, setSelectedGlobalGroupId] = useState('');
  
  const [globalIngredients, setGlobalIngredients] = useState<TenantIngredient[]>([]);
  const [loadingModifiers, setLoadingModifiers] = useState(true);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMin, setNewGroupMin] = useState(0);
  const [newGroupMax, setNewGroupMax] = useState(0);
  
  const [modifierInputs, setModifierInputs] = useState<Record<string, { name: string; priceDelta: string }>>({});
  const [editingModifierState, setEditingModifierState] = useState<Record<string, { name: string; priceDelta: string }>>({});
  const [editingGroupState, setEditingGroupState] = useState<Record<string, string>>({});

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

  // --- LÓGICA: Sincronización Segura ---
  const [prevProductId, setPrevProductId] = useState<string | undefined>(product?.id);

  if (product && product.id !== prevProductId) {
    setPrevProductId(product.id);
    
    setEditProdName(product.name || '');
    setEditProdPrice(product.price?.toString() || '');
    setEditProdDesc(product.description || '');
    
    setVariants(product.product_variants || []);
    setNewVariantName('');
    setNewVariantPrice('');
    setEditingVariantState({});

    setModifierInputs({});
    setEditingModifierState({});
    setEditingGroupState({});
    setActiveDropdown(null);
    setNewGroupName('');
    setNewGroupMin(0);
    setNewGroupMax(0);
    setSelectedGlobalGroupId('');
  }

  // Efecto enfocado a consultas externas (Supabase)
  useEffect(() => {
    if (!product) return;

    const productId = product.id;
    const tenantId = tenant.id;
    let isMounted = true;

    async function loadData() {
      // 1. Obtener grupos VINCULADOS mediante la tabla puente
      const linkedGroupsPromise = supabase
        .from('product_modifier_groups')
        .select('modifier_groups(*, modifiers(*))')
        .eq('product_id', productId);

      // 2. Obtener TODOS los grupos del tenant para el dropdown de "Vincular"
      const allGroupsPromise = supabase
        .from('modifier_groups')
        .select('id, name')
        .eq('tenant_id', tenantId)
        .order('name');

      // 3. Obtener ingredientes globales
      const ingredientsPromise = supabase
        .from('tenant_ingredients')
        .select('*')
        .eq('tenant_id', tenantId);

      // 4. Obtener variantes del producto
      const variantsPromise = supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: true });

      const [linkedRes, allGroupsRes, ingredientsRes, variantsRes] = await Promise.all([
        linkedGroupsPromise, 
        allGroupsPromise, 
        ingredientsPromise,
        variantsPromise
      ]);

      if (isMounted) {
        if (!linkedRes.error && linkedRes.data) {
          const extractedGroups: ModifierGroup[] = [];
          linkedRes.data.forEach((row) => {
            const mg = row.modifier_groups;
            if (Array.isArray(mg)) {
              extractedGroups.push(...(mg as unknown as ModifierGroup[]));
            } else if (mg) {
              extractedGroups.push(mg as unknown as ModifierGroup);
            }
          });
          setModifierGroups(extractedGroups);
        }
        
        if (!allGroupsRes.error && allGroupsRes.data) {
          setTenantGroups(allGroupsRes.data);
        }
        if (!ingredientsRes.error && ingredientsRes.data) {
          setGlobalIngredients(ingredientsRes.data);
        }
        if (!variantsRes.error && variantsRes.data) {
          setVariants(variantsRes.data);
        }
        setLoadingModifiers(false);
      }
    }

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [product, tenant.id]);

  if (!product) return null;

  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProduct(true);
    const { error } = await supabase
      .from('products')
      .update({
        name: editProdName.trim(),
        price: parseFloat(editProdPrice),
        description: editProdDesc.trim() || null,
      })
      .eq('id', product.id);

    if (!error) onReload();
    setSavingProduct(false);
  };

  // --- GESTIÓN DE VARIANTES (Tamaños / Porciones) ---
  const handleAddVariant = async () => {
    if (!newVariantName.trim() || !newVariantPrice.trim()) return;

    const { data, error } = await supabase
      .from('product_variants')
      .insert([{
        product_id: product.id,
        tenant_id: tenant.id,
        name: newVariantName.trim(),
        price_override: parseFloat(newVariantPrice) || 0,
      }])
      .select()
      .single();

    if (!error && data) {
      setVariants([...variants, data]);
      setNewVariantName('');
      setNewVariantPrice('');
    } else {
      alert("Error al agregar la variante.");
    }
  };

  const handleUpdateVariant = async (variantId: string) => {
    const state = editingVariantState[variantId];
    if (!state || !state.name.trim()) return;

    const trimmedName = state.name.trim();
    const priceOverride = parseFloat(state.price) || 0;

    const { error } = await supabase
      .from('product_variants')
      .update({ name: trimmedName, price_override: priceOverride })
      .eq('id', variantId);

    if (!error) {
      setVariants(variants.map(v => v.id === variantId ? { ...v, name: trimmedName, price_override: priceOverride } : v));
      const copy = { ...editingVariantState };
      delete copy[variantId];
      setEditingVariantState(copy);
    }
  };

  const executeDeleteVariant = async (variantId: string) => {
    const { error } = await supabase.from('product_variants').delete().eq('id', variantId);
    if (!error) {
      setVariants(variants.filter(v => v.id !== variantId));
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeleteVariant = (variantId: string, variantName: string) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar opción?',
      message: `¿Estás seguro de eliminar la opción "${variantName}"?`,
      onConfirm: () => executeDeleteVariant(variantId),
    });
  };

  // VINCULAR un grupo existente al platillo
  const handleLinkGroup = async () => {
    if (!selectedGlobalGroupId) return;
    
    if (modifierGroups.some(g => g.id === selectedGlobalGroupId)) {
      alert("Este grupo ya está vinculado al platillo.");
      return;
    }

    const { error: linkError } = await supabase.from('product_modifier_groups').insert([{
      product_id: product.id,
      modifier_group_id: selectedGlobalGroupId,
      tenant_id: tenant.id
    }]);

    if (!linkError) {
      const { data: groupData } = await supabase
        .from('modifier_groups')
        .select('*, modifiers(*)')
        .eq('id', selectedGlobalGroupId)
        .single();
      
      if (groupData) {
        setModifierGroups([...modifierGroups, groupData as ModifierGroup]);
        setSelectedGlobalGroupId('');
      }
    } else {
      alert("Hubo un error al vincular el grupo.");
    }
  };

  // CREAR y vincular un grupo nuevo
  const handleAddGroup = async () => {
    if (!newGroupName.trim()) return;

    const { data: newGroup, error: groupError } = await supabase
      .from('modifier_groups')
      .insert([{
        tenant_id: tenant.id,
        name: newGroupName.trim(),
        is_required: newGroupMin > 0,
        min_selections: newGroupMin,
        max_selections: newGroupMax,
      }])
      .select('*, modifiers(*)')
      .single();

    if (!groupError && newGroup) {
      await supabase.from('product_modifier_groups').insert([{
        product_id: product.id,
        modifier_group_id: newGroup.id,
        tenant_id: tenant.id
      }]);

      setModifierGroups([...modifierGroups, newGroup as ModifierGroup]);
      setTenantGroups([...tenantGroups, { id: newGroup.id, name: newGroup.name }]);
      setNewGroupName('');
      setNewGroupMin(0);
      setNewGroupMax(0);
    }
  };

  const handleUpdateGroupName = async (groupId: string) => {
    const newName = editingGroupState[groupId];
    if (!newName || !newName.trim()) return;
    const trimmedName = newName.trim();

    const { error } = await supabase.from('modifier_groups').update({ name: trimmedName }).eq('id', groupId);
    if (!error) {
      setModifierGroups(modifierGroups.map((g) => g.id === groupId ? { ...g, name: trimmedName } : g));
      setTenantGroups(tenantGroups.map((g) => g.id === groupId ? { ...g, name: trimmedName } : g));
      const copy = { ...editingGroupState };
      delete copy[groupId];
      setEditingGroupState(copy);
    }
  };

  const handleUpdateGroupConfig = async (groupId: string, field: 'min_selections' | 'max_selections', value: number) => {
    setModifierGroups((prev) => prev.map(g => {
      if (g.id !== groupId) return g;
      const updated = { ...g, [field]: value };
      if (field === 'min_selections') updated.is_required = value > 0;
      return updated;
    }));

    const updateData: { min_selections?: number; max_selections?: number; is_required?: boolean } = { [field]: value };
    if (field === 'min_selections') updateData.is_required = value > 0;
    
    await supabase.from('modifier_groups').update(updateData).eq('id', groupId);
  };

  const executeUnlinkGroup = async (groupId: string) => {
    const { error } = await supabase
      .from('product_modifier_groups')
      .delete()
      .match({ product_id: product.id, modifier_group_id: groupId });

    if (!error) {
      setModifierGroups(modifierGroups.filter((g) => g.id !== groupId));
    }
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleUnlinkGroup = (groupId: string, groupName: string) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Quitar del platillo?',
      message: `¿Desvincular el grupo "${groupName}" de este platillo? El grupo seguirá existiendo en otros platillos.`,
      onConfirm: () => executeUnlinkGroup(groupId),
    });
  };

  const resolveGlobalIngredient = async (name: string): Promise<string | null> => {
    const trimmed = name.trim();
    const existing = globalIngredients.find(g => g.name.toLowerCase() === trimmed.toLowerCase());
    if (existing) return existing.id;

    const { data, error } = await supabase
      .from('tenant_ingredients')
      .insert([{ tenant_id: tenant.id, name: trimmed, is_available: true }])
      .select().single();
    
    if (data && !error) {
      setGlobalIngredients(prev => [...prev, data]);
      return data.id;
    }
    return null;
  };

  const handleAddModifier = async (groupId: string) => {
    const input = modifierInputs[groupId];
    if (!input || !input.name.trim()) return;

    const trimmedName = input.name.trim();
    const priceDelta = parseFloat(input.priceDelta) || 0;
    const globalIngId = await resolveGlobalIngredient(trimmedName);

    const { data, error } = await supabase
      .from('modifiers')
      .insert([{
        group_id: groupId,
        name: trimmedName,
        price_delta: priceDelta,
        is_available: true,
        global_ingredient_id: globalIngId
      }])
      .select().single();

    if (!error && data) {
      const newModSafelyTyped: Modifier = { ...data, global_ingredient_id: data.global_ingredient_id ?? undefined };
      setModifierGroups(modifierGroups.map((g) => g.id === groupId ? { ...g, modifiers: [...(g.modifiers || []), newModSafelyTyped] } : g));
      setModifierInputs({ ...modifierInputs, [groupId]: { name: '', priceDelta: '' } });
      setActiveDropdown(null);
    }
  };

  const handleUpdateModifier = async (groupId: string, modifierId: string) => {
    const state = editingModifierState[modifierId];
    if (!state || !state.name.trim()) return;

    const trimmedName = state.name.trim();
    const priceDelta = parseFloat(state.priceDelta) || 0;
    const globalIngId = await resolveGlobalIngredient(trimmedName);

    const { error } = await supabase
      .from('modifiers')
      .update({ name: trimmedName, price_delta: priceDelta, global_ingredient_id: globalIngId })
      .eq('id', modifierId);

    if (!error) {
      setModifierGroups(modifierGroups.map((g) => g.id === groupId ? {
        ...g, modifiers: g.modifiers?.map((m) => m.id === modifierId ? { ...m, name: trimmedName, price_delta: priceDelta, global_ingredient_id: globalIngId ?? undefined } : m)
      } : g));
      const copy = { ...editingModifierState };
      delete copy[modifierId];
      setEditingModifierState(copy);
    }
  };

  const executeDeleteModifier = async (groupId: string, modifierId: string) => {
    const { error } = await supabase.from('modifiers').delete().eq('id', modifierId);
    if (!error) {
      setModifierGroups(modifierGroups.map((g) => g.id === groupId ? { ...g, modifiers: g.modifiers?.filter((m) => m.id !== modifierId) } : g));
    }
    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleDeleteModifier = (groupId: string, modifierId: string, modName: string) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar opción?',
      message: `¿Estás seguro de eliminar la opción "${modName}" de este grupo? Esta acción afectará a TODOS los platillos que usen este grupo.`,
      onConfirm: () => executeDeleteModifier(groupId, modifierId),
    });
  };

  const handleGlobalClose = async () => {
    for (const groupId of Object.keys(editingGroupState)) await handleUpdateGroupName(groupId);
    for (const modId of Object.keys(editingModifierState)) {
      const group = modifierGroups.find(g => g.modifiers?.some(m => m.id === modId));
      if (group) await handleUpdateModifier(group.id, modId);
    }
    onReload();
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-xl space-y-5 max-h-[90vh] flex flex-col">
          <div className="flex justify-between items-center border-b pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Editar Platillo: {product.name}</h3>
                <p className="text-xs text-gray-500">Configura nombre, precio y opciones</p>
              </div>
            </div>
            <button onClick={handleGlobalClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 space-y-5 pr-1 pb-10">
            <form onSubmit={handleSaveProductEdit} className="space-y-3 bg-gray-50 p-4 rounded-2xl border border-gray-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">Información General</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nombre del platillo"
                  value={editProdName}
                  onChange={(e) => setEditProdName(e.target.value)}
                  className="w-full p-2.5 bg-white border rounded-xl text-xs text-gray-900 font-medium sm:col-span-2 placeholder-gray-400 focus:outline-emerald-500"
                />
                <input
                  type="number"
                  step="0.5"
                  required
                  placeholder="Precio Base ($)"
                  value={editProdPrice}
                  onChange={(e) => setEditProdPrice(e.target.value)}
                  className="w-full p-2.5 bg-white border rounded-xl text-xs text-gray-900 font-medium placeholder-gray-400 focus:outline-emerald-500"
                />
              </div>
              <textarea
                rows={2}
                placeholder="Descripción del platillo (opcional)"
                value={editProdDesc}
                onChange={(e) => setEditProdDesc(e.target.value)}
                className="w-full p-2.5 bg-white border rounded-xl text-xs text-gray-900 font-medium placeholder-gray-400 focus:outline-emerald-500"
              />
              <button
                type="submit"
                disabled={savingProduct}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all cursor-pointer"
              >
                {savingProduct ? 'Actualizando...' : 'Guardar Cambios'}
              </button>
            </form>

            {/* ======================================================== */}
            {/* SECCIÓN DE VARIANTES / TAMAÑOS / OPCIONES DE PRECIO       */}
            {/* ======================================================== */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Variantes y Tamaños (Opcional)</h4>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Si este platillo se vende por tamaños u opciones con diferente precio (ej. &quot;Orden de 3&quot;, &quot;Orden de 5&quot;), agrégalas aquí. Si dejas esto vacío, el platillo usará el precio base general.
              </p>

              <div className="space-y-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nombre (Ej. Orden de 5)"
                    value={newVariantName}
                    onChange={(e) => setNewVariantName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddVariant()}
                    className="flex-1 p-2 bg-white border rounded-xl text-xs font-medium text-gray-900 focus:outline-emerald-500"
                  />
                  <input
                    type="number"
                    step="0.5"
                    placeholder="Precio ($)"
                    value={newVariantPrice}
                    onChange={(e) => setNewVariantPrice(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddVariant()}
                    className="w-24 p-2 bg-white border rounded-xl text-xs font-medium text-gray-900 focus:outline-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar
                  </button>
                </div>
              </div>

              {variants.length > 0 && (
                <div className="space-y-2">
                  {variants.map((variant) => {
                    const isEditing = editingVariantState[variant.id] !== undefined;
                    const vState = editingVariantState[variant.id] || { name: variant.name, price: (variant.price_override ?? 0).toString() };
                    const variantPrice = variant.price_override ?? 0;

                    return (
                      <div key={variant.id} className="flex justify-between items-center bg-white p-2.5 rounded-xl border text-xs gap-2 shadow-2xs">
                        {isEditing ? (
                          <div className="flex flex-1 gap-2 items-center">
                            <input
                              type="text"
                              value={vState.name}
                              onChange={(e) => setEditingVariantState({ ...editingVariantState, [variant.id]: { ...vState, name: e.target.value } })}
                              className="flex-1 p-1.5 border rounded-lg text-xs font-medium text-gray-900"
                            />
                            <input
                              type="number"
                              step="0.5"
                              value={vState.price}
                              onChange={(e) => setEditingVariantState({ ...editingVariantState, [variant.id]: { ...vState, price: e.target.value } })}
                              className="w-20 p-1.5 border rounded-lg text-xs font-medium text-gray-900"
                            />
                            <button onClick={() => handleUpdateVariant(variant.id)} className="p-1.5 bg-emerald-600 text-white rounded-lg cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                            <button onClick={() => { const copy = { ...editingVariantState }; delete copy[variant.id]; setEditingVariantState(copy); }} className="p-1.5 text-gray-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 font-bold text-gray-800">
                              {variant.name}
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-black text-emerald-600">${variantPrice.toFixed(2)}</span>
                              <button onClick={() => setEditingVariantState({ ...editingVariantState, [variant.id]: { name: variant.name, price: variantPrice.toString() } })} className="text-gray-400 hover:text-emerald-600 cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                              <button onClick={() => handleDeleteVariant(variant.id, variant.name)} className="text-gray-400 hover:text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ======================================================== */}
            {/* SECCIÓN DE GRUPOS DE OPCIONES GLOBALES (Modificadores)   */}
            {/* ======================================================== */}
            <div className="space-y-3 pt-2 border-t">
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">Grupos de Opciones Globales</h4>
              
              <div className="space-y-4 bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100">
                
                {/* 1. SECCIÓN VINCULAR GRUPO EXISTENTE */}
                <div className="flex gap-2">
                  <select
                    value={selectedGlobalGroupId}
                    onChange={(e) => setSelectedGlobalGroupId(e.target.value)}
                    className="flex-1 p-2 bg-white border rounded-xl text-xs font-medium text-gray-900 focus:outline-emerald-500 cursor-pointer"
                  >
                    <option value="">-- Vincular grupo existente (Ej. Proteínas) --</option>
                    {tenantGroups.map(g => (
                      <option key={`opt-${g.id}`} value={g.id} disabled={modifierGroups.some(mg => mg.id === g.id)}>
                        {g.name} {modifierGroups.some(mg => mg.id === g.id) ? '(Ya vinculado)' : ''}
                      </option>
                    ))}
                  </select>
                  <button 
                    type="button" 
                    onClick={handleLinkGroup}
                    disabled={!selectedGlobalGroupId}
                    className="bg-gray-900 hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold px-3 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1 shadow-sm shrink-0"
                  >
                    <LinkIcon className="w-3.5 h-3.5" /> Vincular
                  </button>
                </div>

                <div className="flex items-center gap-3 opacity-60">
                  <div className="h-px bg-emerald-700 flex-1"></div>
                  <span className="text-[9px] text-emerald-800 font-black tracking-widest uppercase">O Crear Nuevo</span>
                  <div className="h-px bg-emerald-700 flex-1"></div>
                </div>

                {/* 2. SECCIÓN CREAR GRUPO NUEVO */}
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Nombre del Grupo Nuevo (Ej. Tipos de Salsa)"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddGroup()}
                    className="w-full p-2 bg-white border rounded-xl text-xs font-medium text-gray-900 focus:outline-emerald-500"
                  />
                  <div className="flex justify-between items-center pt-1 gap-2">
                    <div className="flex gap-2 flex-1">
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-700 bg-white px-2 py-1.5 border rounded-xl">
                        MÍN:
                        <input type="number" min="0" value={newGroupMin} onChange={(e) => setNewGroupMin(parseInt(e.target.value) || 0)} className="w-10 outline-none text-emerald-700 font-bold bg-transparent text-center" />
                      </label>
                      <label className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-700 bg-white px-2 py-1.5 border rounded-xl">
                        MÁX:
                        <input type="number" min="0" value={newGroupMax === 0 ? '' : newGroupMax} placeholder="∞" onChange={(e) => setNewGroupMax(parseInt(e.target.value) || 0)} className="w-10 outline-none text-emerald-700 font-bold bg-transparent text-center" />
                      </label>
                    </div>
                    <button onClick={handleAddGroup} type="button" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1 shadow-sm shrink-0">
                      <Plus className="w-3.5 h-3.5" /> Agregar
                    </button>
                  </div>
                </div>

              </div>

              {loadingModifiers ? (
                <p className="text-xs text-gray-400 text-center py-4">Cargando opciones...</p>
              ) : modifierGroups.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4 italic">No hay grupos configurados en este platillo.</p>
              ) : (
                <div className="space-y-4">
                  {modifierGroups.map((group) => {
                    const currentInput = modifierInputs[group.id] || { name: '', priceDelta: '' };
                    const isEditingGroup = editingGroupState[group.id] !== undefined;
                    const groupEditName = editingGroupState[group.id] ?? group.name;
                    const suggestedIngredients = currentInput.name.trim().length > 0 
                      ? globalIngredients.filter(g => g.name.toLowerCase().includes(currentInput.name.toLowerCase()))
                      : [];

                    return (
                      <div key={group.id} className="p-3.5 bg-white border rounded-2xl shadow-sm space-y-3 relative">
                        <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500 rounded-l-2xl"></div>
                        
                        <div className="flex justify-between items-center border-b pb-2 gap-2 pl-2">
                          {isEditingGroup ? (
                            <div className="flex-1 flex gap-2 items-center">
                              <input
                                type="text"
                                value={groupEditName}
                                onChange={(e) => setEditingGroupState({ ...editingGroupState, [group.id]: e.target.value })}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleUpdateGroupName(group.id); }}
                                className="flex-1 p-1 bg-white border rounded-lg text-xs font-bold uppercase text-gray-900"
                                autoFocus
                              />
                              <button onClick={() => handleUpdateGroupName(group.id)} className="p-1 bg-emerald-600 text-white rounded-lg cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                              <button onClick={() => { const copy = { ...editingGroupState }; delete copy[group.id]; setEditingGroupState(copy); }} className="p-1 text-gray-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                            </div>
                          ) : (
                            <div className="flex-1">
                              <div className="flex items-center gap-1.5">
                                <h5 className="font-bold text-xs text-gray-900 uppercase">{group.name}</h5>
                                <button onClick={() => setEditingGroupState({ ...editingGroupState, [group.id]: group.name })} className="text-gray-400 hover:text-emerald-600 cursor-pointer"><Pencil className="w-3 h-3" /></button>
                              </div>
                            </div>
                          )}
                          {!isEditingGroup && (
                            <button onClick={() => handleUnlinkGroup(group.id, group.name)} title="Quitar de este platillo" className="text-red-400 hover:text-red-600 p-1 text-xs font-semibold cursor-pointer transition-colors"><Trash2 className="w-4 h-4" /></button>
                          )}
                        </div>

                        <div className="flex gap-3 bg-gray-50 p-2 rounded-xl border border-gray-100 ml-2">
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                              Mín {group.min_selections === 0 ? '(Opcional)' : '(Obligatorio)'}
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={group.min_selections ?? 0}
                              onChange={(e) => handleUpdateGroupConfig(group.id, 'min_selections', parseInt(e.target.value) || 0)}
                              className="w-full p-1.5 border rounded-lg text-xs bg-white text-gray-900 font-medium focus:outline-emerald-500"
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">
                              Máx (0 = Sin límite)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={group.max_selections || ''}
                              placeholder="∞"
                              onChange={(e) => handleUpdateGroupConfig(group.id, 'max_selections', parseInt(e.target.value) || 0)}
                              className="w-full p-1.5 border rounded-lg text-xs bg-white text-gray-900 font-medium focus:outline-emerald-500"
                            />
                          </div>
                        </div>

                        <div className="space-y-2 pl-3">
                          {group.modifiers?.map((mod) => {
                            const isEditingThis = editingModifierState[mod.id] !== undefined;
                            const modState = editingModifierState[mod.id] || { name: mod.name, priceDelta: mod.price_delta.toString() };
                            const globalLink = globalIngredients.find(g => g.id === mod.global_ingredient_id || g.name.toLowerCase() === mod.name.toLowerCase());
                            const isGlobalAgotado = globalLink && !globalLink.is_available;

                            return (
                              <div key={mod.id} className="flex justify-between items-center bg-gray-50 p-2 rounded-xl border text-xs gap-2">
                                {isEditingThis ? (
                                  <div className="flex flex-1 gap-2 items-center">
                                    <input type="text" value={modState.name} onChange={(e) => setEditingModifierState({ ...editingModifierState, [mod.id]: { ...modState, name: e.target.value } })} className="flex-1 p-1 border rounded-lg text-xs" />
                                    <input type="number" step="0.5" value={modState.priceDelta} onChange={(e) => setEditingModifierState({ ...editingModifierState, [mod.id]: { ...modState, priceDelta: e.target.value } })} className="w-16 p-1 border rounded-lg text-xs" />
                                    <button onClick={() => handleUpdateModifier(group.id, mod.id)} className="p-1 bg-emerald-600 text-white rounded-lg cursor-pointer"><Check className="w-3.5 h-3.5" /></button>
                                    <button onClick={() => { const copy = { ...editingModifierState }; delete copy[mod.id]; setEditingModifierState(copy); }} className="p-1 text-gray-400 cursor-pointer"><X className="w-3.5 h-3.5" /></button>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex-1 flex flex-col">
                                      <span className={`${isGlobalAgotado ? 'text-gray-400 line-through' : 'text-gray-800'}`}>{mod.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className={`font-bold ${isGlobalAgotado ? 'text-gray-400 line-through' : 'text-emerald-600'}`}>{mod.price_delta > 0 ? `+$${mod.price_delta}` : '0.00'}</span>
                                      <button onClick={() => setEditingModifierState({ ...editingModifierState, [mod.id]: { name: mod.name, priceDelta: mod.price_delta.toString() } })} className="text-gray-400 hover:text-emerald-600 cursor-pointer"><Pencil className="w-3.5 h-3.5" /></button>
                                      <button onClick={() => handleDeleteModifier(group.id, mod.id, mod.name)} title="Eliminar de TODOS los platillos" className="text-gray-400 hover:text-red-600 cursor-pointer"><Trash2 className="w-3.5 h-3.5" /></button>
                                    </div>
                                  </>
                                )}
                              </div>
                            );
                          })}

                          <div className="flex gap-2 pt-1 relative">
                            <div className="flex-1 relative">
                              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" />
                              <input
                                type="text"
                                placeholder="Buscar/crear ingrediente..."
                                value={currentInput.name}
                                onFocus={() => setActiveDropdown(group.id)}
                                onBlur={() => setTimeout(() => setActiveDropdown(null), 200)}
                                onChange={(e) => setModifierInputs({ ...modifierInputs, [group.id]: { ...currentInput, name: e.target.value } })}
                                className="w-full pl-8 p-2 border rounded-xl text-xs bg-white text-gray-900 focus:outline-emerald-500"
                              />
                              {activeDropdown === group.id && suggestedIngredients.length > 0 && (
                                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                                  {suggestedIngredients.map(ing => (
                                    <div key={ing.id} onClick={() => setModifierInputs({ ...modifierInputs, [group.id]: { ...currentInput, name: ing.name } })} className="p-2.5 hover:bg-emerald-50 text-xs text-gray-700 cursor-pointer border-b">
                                      {ing.name}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                            <input type="number" step="0.5" placeholder="Extra $" value={currentInput.priceDelta} onChange={(e) => setModifierInputs({ ...modifierInputs, [group.id]: { ...currentInput, priceDelta: e.target.value } })} className="w-20 p-2 border rounded-xl text-xs bg-white focus:outline-emerald-500" />
                            <button type="button" onClick={() => handleAddModifier(group.id)} className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-3 py-2 rounded-xl text-xs cursor-pointer">Agregar</button>
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
            <button onClick={handleGlobalClose} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md cursor-pointer">Cerrar y Guardar</button>
          </div>
        </div>
      </div>
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))} />
    </>
  );
}