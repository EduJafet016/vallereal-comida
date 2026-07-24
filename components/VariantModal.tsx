'use client';

import { useState } from 'react';
import { Product, ModifierGroup, Modifier } from '@/types';
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
  const [selectedModifiers, setSelectedModifiers] = useState<Record<string, Modifier[]>>({});
  const [notes, setNotes] = useState('');

  // Sincronización segura de estado por cambio de producto
  if (product !== prevProduct) {
    setPrevProduct(product);
    if (product && product.modifier_groups) {
      const initialSelections: Record<string, Modifier[]> = {};
      product.modifier_groups.forEach((group) => {
        if (group.is_required && group.modifiers && group.modifiers.length > 0) {
          initialSelections[group.id] = group.max_selections === 1 ? [group.modifiers[0]] : [];
        } else {
          initialSelections[group.id] = [];
        }
      });
      setSelectedModifiers(initialSelections);
    } else {
      setSelectedModifiers({});
    }
    setNotes('');
  }

  if (!isOpen || !product) return null;

  const modifierGroups: ModifierGroup[] = product.modifier_groups || [];

  // Validación robusta basada en min_selections y is_required
  const isFormValid = modifierGroups.every((group) => {
    const selectedCount = Array.isArray(selectedModifiers[group.id]) 
      ? selectedModifiers[group.id].length 
      : 0;
    const minReq = group.min_selections ?? (group.is_required ? 1 : 0);
    return selectedCount >= minReq;
  });

  const basePrice = product.price || 0;
  
  // Sumatoria blindada: Garantizamos que modList sea siempre un arreglo mediante Array.isArray
  const modifiersTotalDelta = Object.values(selectedModifiers).reduce((sum, modList) => {
    const list = Array.isArray(modList) ? modList : [];
    return sum + list.reduce((subSum, mod) => subSum + (mod.price_delta || 0), 0);
  }, 0);

  const finalPrice = basePrice + modifiersTotalDelta;

  const handleSelectModifier = (group: ModifierGroup, modifier: Modifier) => {
    setSelectedModifiers((prev) => {
      const currentList = Array.isArray(prev[group.id]) ? prev[group.id] : [];
      const exists = currentList.some((mod) => mod.id === modifier.id);

      // Si es selección única (max_selections === 1)
      if (group.max_selections === 1) {
        return {
          ...prev,
          [group.id]: [modifier],
        };
      }

      // Si es selección múltiple
      if (exists) {
        return {
          ...prev,
          [group.id]: currentList.filter((mod) => mod.id !== modifier.id),
        };
      } else {
        if (group.max_selections && currentList.length >= group.max_selections) {
          return prev; 
        }
        return {
          ...prev,
          [group.id]: [...currentList, modifier],
        };
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
        selectedModifiers: formattedModifiers,
        finalUnitPrice: finalPrice,
        notes: notes.trim() || undefined,
      },
    });

    setSelectedModifiers({});
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-3 mb-4 shrink-0">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
            <p className="text-xs text-gray-500">Personaliza tu platillo</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido scrolleable de Grupos de Modificadores */}
        <div className="space-y-5 mb-4 overflow-y-auto flex-1 pr-1">
          {modifierGroups.length === 0 ? (
            <div className="text-center py-6 text-xs text-gray-500">
              Este producto no cuenta con opciones adicionales configuradas. Puedes agregarlo directamente.
            </div>
          ) : (
            modifierGroups.map((group) => {
              const currentList = Array.isArray(selectedModifiers[group.id]) ? selectedModifiers[group.id] : [];
              const modifiersList = group.modifiers || [];
              const isSingle = group.max_selections === 1;

              return (
                <div key={group.id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700">
                      {group.name} {group.max_selections && group.max_selections > 1 && `(Máx. ${group.max_selections})`}
                    </h4>
                    {group.is_required && (
                      <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                        Obligatorio
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    {modifiersList.map((modifier) => {
                      const isSelected = currentList.some((mod) => mod.id === modifier.id);

                      return (
                        <button
                          key={modifier.id}
                          type="button"
                          onClick={() => handleSelectModifier(group, modifier)}
                          className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-5 h-5 ${isSingle ? 'rounded-full' : 'rounded-md'} border flex items-center justify-center shrink-0 ${
                                isSelected
                              ? 'border-emerald-600 bg-emerald-600 text-white'
                              : 'border-gray-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </div>
                            <span className="font-medium text-sm text-gray-800">
                              {modifier.name}
                            </span>
                          </div>
                          <span className="font-bold text-sm text-emerald-600">
                            {(modifier.price_delta || 0) > 0 ? `+$${modifier.price_delta.toFixed(2)}` : 'Incluido'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}

          {/* Campo de notas generales */}
          <div className="pt-2">
            <label className="text-xs font-semibold text-gray-600 block mb-1">
              Instrucciones específicas (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Sin cebolla, aparte..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 bg-white"
            />
          </div>
        </div>

        {/* Botón de Confirmación Fijo */}
        <div className="pt-2 border-t shrink-0">
          <button
            disabled={!isFormValid && modifierGroups.length > 0}
            onClick={modifierGroups.length === 0 ? () => {
              dispatch({
                type: 'ADD_ITEM',
                payload: { product, finalUnitPrice: basePrice, notes: notes.trim() || undefined }
              });
              onClose();
            } : handleConfirm}
            className="w-full bg-emerald-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98] cursor-pointer"
          >
            {isFormValid || modifierGroups.length === 0
              ? `Agregar · $${finalPrice.toFixed(2)}`
              : 'Selecciona los campos obligatorios'}
          </button>
        </div>

      </div>
    </div>
  );
}