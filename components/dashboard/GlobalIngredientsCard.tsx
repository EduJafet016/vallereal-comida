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
    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      <div className="border-b border-slate-100 pb-3">
        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
          <Package className="w-3.5 h-3.5 text-[#007A55]" /> Inventario Global (Extras)
        </span>
      </div>

      <form onSubmit={handleAdd} className="flex gap-2">
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Ej. Milanesa, Queso extra..."
          className="flex-1 p-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 font-medium focus:ring-2 focus:ring-[#007A55] focus:outline-none"
          disabled={isSubmitting}
        />
        <button
          type="submit"
          disabled={isSubmitting || !newName.trim()}
          className="bg-[#007A55] text-white p-2.5 rounded-xl hover:bg-[#006344] disabled:opacity-50 transition-all cursor-pointer shadow-2xs shrink-0 flex items-center justify-center"
          title="Agregar ingrediente"
        >
          {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </form>

      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
        {loading ? (
          <div className="flex justify-center p-4"><Loader2 className="w-5 h-5 animate-spin text-slate-400" /></div>
        ) : ingredients.length === 0 ? (
          <p className="text-xs text-center text-slate-400 py-4">No hay ingredientes registrados.</p>
        ) : (
          ingredients.map(ing => (
            <div key={ing.id} className="flex items-center justify-between p-2.5 bg-slate-50/70 border border-slate-200/70 rounded-xl">
              <span className={`text-xs font-bold ${ing.is_available ? 'text-slate-800' : 'text-slate-400 line-through'}`}>
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
                  <div className="w-8 h-4 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#007A55]"></div>
                </label>
                
                <button
                  onClick={() => handleDelete(ing.id)}
                  className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer p-1"
                  title="Eliminar"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}