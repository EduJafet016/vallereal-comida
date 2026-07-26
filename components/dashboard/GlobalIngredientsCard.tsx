'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { TenantIngredient } from '@/types';
import { Package, Plus, Trash2, Loader2 } from 'lucide-react';

interface Props {
  tenantId: string;
}

export function GlobalIngredientsCard({ tenantId }: Props) {
  const [ingredients, setIngredients] = useState<TenantIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 1. Declarar y memorizar la función PRIMERO
  const loadIngredients = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tenant_ingredients')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error cargando ingredientes:', error);
    } else {
      setIngredients(data || []);
    }
    setLoading(false);
  }, [tenantId]);

  // 2. LUEGO consumirla en el useEffect empujándola a la cola de microtareas
  useEffect(() => {
    queueMicrotask(() => {
      void loadIngredients();
    });
  }, [loadIngredients]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    const { data, error } = await supabase
      .from('tenant_ingredients')
      .insert([{ tenant_id: tenantId, name: trimmed, is_available: true }])
      .select()
      .single();

    if (error) {
      alert(`Error al agregar: ${error.message}`);
    } else if (data) {
      setIngredients(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewName('');
    }
    setIsSubmitting(false);
  };

  const handleToggle = async (id: string, currentState: boolean) => {
    // Optimistic UI update
    setIngredients(prev => 
      prev.map(ing => ing.id === id ? { ...ing, is_available: !currentState } : ing)
    );

    const { error } = await supabase
      .from('tenant_ingredients')
      .update({ is_available: !currentState })
      .eq('id', id);

    if (error) {
      // Revert if failed
      alert(`Error al actualizar estado: ${error.message}`);
      queueMicrotask(() => {
        void loadIngredients();
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Seguro que deseas eliminar este ingrediente? Podría estar en uso.')) return;

    // Optimistic UI update
    setIngredients(prev => prev.filter(ing => ing.id !== id));

    const { error } = await supabase
      .from('tenant_ingredients')
      .delete()
      .eq('id', id);

    if (error) {
      alert(`Error al eliminar: ${error.message}. Es posible que esté referenciado en un platillo.`);
      queueMicrotask(() => {
        void loadIngredients();
      });
    }
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-4 mb-6">
      <div className="flex justify-between items-center border-b pb-2">
        <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
          <Package className="w-4 h-4 text-emerald-600" /> Inventario Global (Extras)
        </span>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ej. Milanesa, Queso extra..."
          className="flex-1 p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newName.trim()}
          className="bg-emerald-600 text-white p-2 rounded-xl hover:bg-emerald-700 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>

      <div className="space-y-2 pt-2 max-h-60 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
        ) : ingredients.length === 0 ? (
          <p className="text-xs text-center text-gray-500 py-4">No hay ingredientes registrados.</p>
        ) : (
          ingredients.map(ing => (
            <div key={ing.id} className="flex items-center justify-between p-2.5 bg-gray-50 border rounded-xl">
              <span className={`text-xs font-bold ${ing.is_available ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                {ing.name}
              </span>
              
              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={ing.is_available}
                    onChange={() => handleToggle(ing.id, ing.is_available)}
                    className="sr-only peer"
                  />
                  <div className="w-8 h-4 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
                
                <button
                  onClick={() => handleDelete(ing.id)}
                  className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                  title="Eliminar"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}