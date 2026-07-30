'use client';

import { useState } from 'react';
import { Product, ModifierGroup, Modifier, ProductVariant } from '@/types';
import { useCartDispatch } from '../context/CartContext';
import { X, Check } from 'lucide-react';

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export default function VariantModal({
  isOpen,
  onClose,
  product,
}: VariantModalProps) {
  const dispatch = useCartDispatch();
  
  const [prevProduct, setPrevProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | undefined>(undefined);
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, Modifier[]>>({});
  const [notes, setNotes] = useState('');

  // Sincronización segura de estado por cambio de producto
  if (product !== prevProduct) {
    setPrevProduct(product);
    if (product) {
      const variants = product.product_variants || [];
      const initialVariant = variants.length > 0 ? variants[0] : undefined;
      setSelectedVariant(initialVariant);

      if (product.modifier_groups) {
        const initialSelections: Record<string, Modifier[]> = {};
        product.modifier_groups.forEach((group) => {
          const maxAllowed = getDynamicMaxSelections(group, initialVariant);
          if (group.is_required && group.modifiers && group.modifiers.length > 0) {
            const availableModifiers = group.modifiers.filter(m => m.is_available !== false);
            // Si es de selección única y es obligatorio, autoseleccionamos el primero por comodidad
            initialSelections[group.id] = maxAllowed === 1 && availableModifiers.length > 0 
              ? [availableModifiers[0]] 
              : [];
          } else {
            initialSelections[group.id] = [];
          }
        });
        setSelectedModifiers(initialSelections);
      } else {
        setSelectedModifiers({});
      }
    } else {
      setSelectedVariant(undefined);
      setSelectedModifiers({});
    }
    setNotes('');
  }

  if (!isOpen || !product) return null;

  const variants: ProductVariant[] = product.product_variants || [];
  const modifierGroups: ModifierGroup[] = product.modifier_groups || [];

  // --- LÓGICA CLAVE: Lee el límite configurado por el tenant en la variante ---
  function getDynamicMaxSelections(group: ModifierGroup, variant?: ProductVariant): number {
    if (variant && variant.max_modifier_selections !== undefined && variant.max_modifier_selections !== null) {
      return variant.max_modifier_selections;
    }
    return group.max_selections ?? 1;
  }

  // Manejador al cambiar de variante (recorta excesos si se reduce el límite)
const handleSelectVariant = (variant: ProductVariant) => {
    setSelectedVariant(variant);

    setSelectedModifiers((prev) => {
      const updated = { ...prev };
      modifierGroups.forEach((group) => {
        const newMax = getDynamicMaxSelections(group, variant);
        const currentList = updated[group.id] || [];
        
        if (newMax === 0) {
          // Si el límite es 0, vaciamos inmediatamente las selecciones
          updated[group.id] = [];
        } else if (newMax === 1 && currentList.length === 0 && group.is_required && group.modifiers && group.modifiers.length > 0) {
          const firstAvail = group.modifiers.find(m => m.is_available !== false);
          updated[group.id] = firstAvail ? [firstAvail] : [];
        } else if (currentList.length > newMax) {
          updated[group.id] = currentList.slice(0, newMax);
        }
      });
      return updated;
    });
  };

  const isVariantsValid = variants.length === 0 || selectedVariant !== undefined;
  
    const isModifiersValid = modifierGroups.every((group) => {
    const dynamicMax = getDynamicMaxSelections(group, selectedVariant);
    
    // Si la variante bloquea los extras (0), damos el grupo por válido automáticamente
    if (dynamicMax === 0) return true;

    const selectedCount = Array.isArray(selectedModifiers[group.id]) 
      ? selectedModifiers[group.id].length 
      : 0;
      
    const minReq = group.min_selections ?? (group.is_required ? 1 : 0);
    
    // Validamos contra el requerimiento original, pero nunca pedimos más del máximo permitido
    return selectedCount >= Math.min(minReq, dynamicMax);
  });

  const isFormValid = isVariantsValid && isModifiersValid;

  const basePrice = selectedVariant?.price_override ?? product.price ?? 0;
  
  const modifiersTotalDelta = Object.values(selectedModifiers).reduce((sum, modList) => {
    const list = Array.isArray(modList) ? modList : [];
    return sum + list.reduce((subSum, mod) => subSum + (mod.price_delta || 0), 0);
  }, 0);

  const finalPrice = basePrice + modifiersTotalDelta;

  const handleSelectModifier = (group: ModifierGroup, modifier: Modifier) => {
    const currentMax = getDynamicMaxSelections(group, selectedVariant);

    setSelectedModifiers((prev) => {
      const currentList = Array.isArray(prev[group.id]) ? prev[group.id] : [];
      const exists = currentList.some((mod) => mod.id === modifier.id);

      if (currentMax === 1) {
        // Si es de máximo 1 selección y ya estaba seleccionado, permitimos quitarlo solo si no es estrictamente obligatorio
        if (exists && !group.is_required) {
          return { ...prev, [group.id]: [] };
        }
        // Si es obligatorio con máx 1, simplemente reemplazamos por el nuevo elegido
        return { ...prev, [group.id]: [modifier] };
      }

      if (exists) {
        return { ...prev, [group.id]: currentList.filter((mod) => mod.id !== modifier.id) };
      } else {
        if (currentList.length >= currentMax) {
          return prev; // Ya alcanzó el límite permitido por la variante
        }
        return { ...prev, [group.id]: [...currentList, modifier] };
      }
    });
  };

  const handleConfirm = () => {
    if (!isFormValid) return;

    const formattedModifiers = Object.entries(selectedModifiers).flatMap(([groupId, modList]) => {
      const group = modifierGroups.find((g) => g.id === groupId);
      const list = Array.isArray(modList) ? modList : [];
      return list.map((mod) => ({
        groupName: group?.name || 'Opciones',
        modifierName: mod.name,
        priceDelta: mod.price_delta || 0,
      }));
    });

    dispatch({
      type: 'ADD_ITEM',
      payload: {
        product,
        variant: selectedVariant,
        selectedModifiers: formattedModifiers,
        finalUnitPrice: finalPrice,
        notes: notes.trim() || undefined,
      },
    });

    setSelectedVariant(undefined);
    setSelectedModifiers({});
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] flex flex-col">
        
        <div className="flex justify-between items-start border-b pb-3 mb-4 shrink-0">
          <div>
            <h3 className="text-lg font-black text-slate-900">{product.name}</h3>
            <p className="text-xs text-slate-500 font-medium">Personaliza tu platillo</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5 mb-4 overflow-y-auto flex-1 pr-1">
          
          {variants.length > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Elige una opción *
                </h4>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                  Obligatorio
                </span>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {variants.map((variant) => {
                  const isSelected = selectedVariant?.id === variant.id;
                  const variantPrice = variant.price_override ?? 0;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => handleSelectVariant(variant)}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/10'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </div>
                        <span className="font-bold text-sm text-slate-800">{variant.name}</span>
                      </div>
                      <span className="font-black text-sm text-emerald-600">
                        ${variantPrice.toFixed(2)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {modifierGroups.length === 0 && variants.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 font-medium">
              Este producto no cuenta con opciones adicionales configuradas. Puedes agregarlo directamente.
            </div>
          ) : (
            modifierGroups.map((group) => {
              const currentList = Array.isArray(selectedModifiers[group.id]) ? selectedModifiers[group.id] : [];
              const modifiersList = group.modifiers || [];
              const dynamicMax = getDynamicMaxSelections(group, selectedVariant);
              const isSingle = dynamicMax === 1;

              return (
                <div key={group.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                      {group.name} {dynamicMax > 1 && `(Máx. ${dynamicMax})`}
                    </h4>
                    {group.is_required && (
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                        Obligatorio
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {modifiersList.map((modifier) => {
                      const isSelected = currentList.some((mod) => mod.id === modifier.id);
                      const isAvailable = modifier.is_available !== false && dynamicMax > 0;

                      return (
                        <button
                          key={modifier.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => handleSelectModifier(group, modifier)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl border-2 text-left transition-all ${
                            !isAvailable
                              ? 'opacity-50 cursor-not-allowed bg-slate-50 border-slate-200'
                              : isSelected
                                ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/10 cursor-pointer'
                                : 'border-slate-200 hover:border-slate-300 cursor-pointer bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 ${isSingle ? 'rounded-full' : 'rounded-lg'} border-2 flex items-center justify-center shrink-0 ${
                                !isAvailable
                                  ? 'border-slate-300 bg-slate-200'
                                  : isSelected
                                    ? 'border-emerald-600 bg-emerald-600 text-white'
                                    : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className={`w-3.5 h-3.5 ${!isAvailable ? 'text-slate-400' : 'stroke-[3]'}`} />}
                            </div>
                            <span className={`font-bold text-sm ${!isAvailable ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                              {modifier.name}
                            </span>
                          </div>
                          <span className={`font-black text-sm ${!isAvailable ? 'text-slate-400' : 'text-emerald-600'}`}>
                            {!isAvailable 
                              ? 'Agotado' 
                              : (modifier.price_delta || 0) > 0 
                                ? `+$${modifier.price_delta.toFixed(2)}` 
                                : 'Incluido'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          <div className="pt-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-wider block mb-1.5">
              Instrucciones específicas (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Sin cebolla, aparte..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 text-sm font-bold border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-slate-900 bg-slate-50"
            />
          </div>
        </div>

        <div className="pt-3 border-t shrink-0">
          <button
            disabled={!isFormValid}
            onClick={handleConfirm}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white py-4 px-6 rounded-2xl font-black text-sm shadow-xl shadow-emerald-600/25 transition-all active:scale-[0.99] cursor-pointer"
          >
            {isFormValid
              ? `Agregar · $${finalPrice.toFixed(2)}`
              : 'Selecciona los campos obligatorios'}
          </button>
        </div>

      </div>
    </div>
  );
}