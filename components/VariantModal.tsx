'use client';

import { useState } from 'react';
import { Product, ProductVariant } from '@/types';
import { X, Check } from 'lucide-react';

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onConfirm: (product: Product, variant: ProductVariant, notes?: string) => void;
}

export default function VariantModal({
  isOpen,
  onClose,
  product,
  onConfirm,
}: VariantModalProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [notes, setNotes] = useState('');

  if (!isOpen || !product) return null;

  const variants = product.product_variants || [];

  const handleConfirm = () => {
    if (!selectedVariant) return;
    onConfirm(product, selectedVariant, notes);
    setSelectedVariant(null);
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-center items-end sm:items-center p-0 sm:p-4">
      <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b pb-3 mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{product.name}</h3>
            <p className="text-xs text-gray-500">Selecciona una opción</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lista de Variantes */}
        <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
          {variants.map((variant) => {
            const isSelected = selectedVariant?.id === variant.id;
            const price = variant.price_override ?? product.price;

            return (
              <button
                key={variant.id}
                type="button"
                onClick={() => setSelectedVariant(variant)}
                className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/60 ring-1 ring-emerald-600'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-600 text-white'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                  <span className="font-medium text-sm text-gray-800">
                    {variant.name}
                  </span>
                </div>
                <span className="font-bold text-sm text-emerald-600">
                  ${price.toFixed(2)}
                </span>
              </button>
            );
          })}
        </div>

        {/* Campo de notas para la variante */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-600 block mb-1">
            Instrucciones específicas (Opcional)
          </label>
          <input
            type="text"
            placeholder="Ej. Bien dorada, poco picante..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Botón de Confirmación */}
        <button
          disabled={!selectedVariant}
          onClick={handleConfirm}
          className="w-full bg-emerald-600 disabled:bg-gray-300 text-white py-3 rounded-xl font-bold text-sm shadow-md transition-all active:scale-[0.98]"
        >
          {selectedVariant
            ? `Agregar · $${(selectedVariant.price_override ?? product.price).toFixed(2)}`
            : 'Selecciona una opción'}
        </button>
      </div>
    </div>
  );
}