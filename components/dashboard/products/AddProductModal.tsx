'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Category } from '@/types';

export interface NewProductData {
  name: string;
  price: string;
  description: string;
  categoryId: string;
  newCategoryName: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  isSaving: boolean;
  onSave: (data: NewProductData) => Promise<void>;
}

export function AddProductModal({
  isOpen,
  onClose,
  categories,
  isSaving,
  onSave,
}: AddProductModalProps) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave({ name, price, description, categoryId, newCategoryName });
    // Limpiamos tras guardar
    setName('');
    setPrice('');
    setDescription('');
    setCategoryId('');
    setNewCategoryName('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="font-bold text-gray-900 text-base">Nuevo Platillo</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="text"
            required
            placeholder="Nombre del Platillo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium"
          />
          <input
            type="number"
            step="0.5"
            required
            placeholder="Precio Base ($)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium"
          />

          {categories.length > 0 && (
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium"
            >
              <option value="">-- Seleccionar categoría --</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {(!categoryId || categories.length === 0) && (
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
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium"
          />

          <button
            type="submit"
            disabled={isSaving}
            className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs shadow-md cursor-pointer"
          >
            {isSaving ? 'Guardando...' : 'Guardar Platillo'}
          </button>
        </form>
      </div>
    </div>
  );
}