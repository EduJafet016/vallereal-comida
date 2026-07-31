'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Category, Tenant } from '@/types';
import { X, ListTree, Plus, Pencil, Trash2, Check, GripVertical } from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

// --- Importaciones de DnD Kit ---
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- Tipado de props del Modal Principal ---
interface ManageCategoriesModalProps {
  tenant: Tenant;
  onClose: () => void;
  onReload: () => void;
}

// --- Tipado riguroso para el subcomponente ---
interface SortableCategoryItemProps {
  category: Category;
  isEditing: boolean;
  currentName: string;
  onEditStateChange: (val: string) => void;
  onUpdate: () => void;
  onCancelEdit: () => void;
  onEditClick: () => void;
  onDeleteClick: () => void;
}

// --- Subcomponente Aislado para el Drag & Drop ---
function SortableCategoryItem({ 
  category, 
  isEditing, 
  currentName, 
  onEditStateChange, 
  onUpdate, 
  onCancelEdit, 
  onEditClick, 
  onDeleteClick 
}: SortableCategoryItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex justify-between items-center p-3 border rounded-xl shadow-sm gap-3 ${
        isDragging ? 'bg-blue-50 border-blue-300 shadow-md scale-[1.02]' : 'bg-gray-50 border-gray-200'
      }`}
    >
      {/* DRAG HANDLE (El área segura para arrastrar) */}
      <div 
        {...attributes} 
        {...listeners} 
        // FIX CLAVE: 'touch-none' intercepta la delegación de scroll del navegador
        className="touch-none cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-900 p-1 shrink-0 outline-none"
      >
        <GripVertical className="w-5 h-5" />
      </div>

      {isEditing ? (
        <div className="flex flex-1 gap-2 items-center">
          <input
            type="text"
            value={currentName}
            onChange={(e) => onEditStateChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') onUpdate(); }}
            className="flex-1 p-1.5 border rounded-lg text-xs bg-white text-gray-900 font-bold uppercase focus:outline-blue-500"
            autoFocus
          />
          <button onClick={onUpdate} className="p-1.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
            <Check className="w-4 h-4" />
          </button>
          <button onClick={onCancelEdit} className="p-1.5 text-gray-400 hover:text-gray-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <>
          <span className="text-sm font-bold text-gray-900 uppercase truncate flex-1 select-none">
            {category.name}
          </span>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={onEditClick} className="p-1.5 text-gray-400 hover:text-blue-600 cursor-pointer">
              <Pencil className="w-4 h-4" />
            </button>
            <button onClick={onDeleteClick} className="p-1.5 text-gray-400 hover:text-red-600 cursor-pointer">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// --- Componente Principal ---
export function ManageCategoriesModal({ tenant, onClose, onReload }: ManageCategoriesModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingState, setEditingState] = useState<Record<string, string>>({});

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  // Configuración rigurosa de sensores para no interferir con los inputs al hacer clic
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Requiere mover el mouse 5px para iniciar el drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    let isMounted = true;

    async function fetchCategories() {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('tenant_id', tenant.id)
        .order('sort_order', { ascending: true });

      if (isMounted) {
        if (data && !error) setCategories(data);
        setLoading(false);
      }
    }

    void fetchCategories();

    return () => { isMounted = false; };
  }, [tenant.id]);

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    const maxSortOrder = categories.length > 0 
      ? Math.max(...categories.map(c => c.sort_order || 0)) 
      : -1;

    const { data, error } = await supabase
      .from('categories')
      .insert([{ 
        tenant_id: tenant.id, 
        name: newCategoryName.trim(), 
        sort_order: maxSortOrder + 1 
      }])
      .select()
      .single();

    if (data && !error) {
      setCategories([...categories, data]);
      setNewCategoryName('');
      onReload(); 
    }
  };

  const handleUpdateCategory = async (id: string) => {
    const name = editingState[id];
    if (!name || !name.trim()) return;
    const trimmedName = name.trim();

    const { error } = await supabase
      .from('categories')
      .update({ name: trimmedName })
      .eq('id', id);

    if (!error) {
      setCategories(categories.map(c => c.id === id ? { ...c, name: trimmedName } : c));
      const copy = { ...editingState };
      delete copy[id];
      setEditingState(copy);
      onReload();
    }
  };

  const executeDeleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    
    if (error) {
      alert('Error: No puedes eliminar una categoría que aún tiene platillos asignados. Mueve o elimina los platillos primero.');
    } else {
      setCategories(categories.filter(c => c.id !== id));
      onReload();
    }
    setConfirmModal(prev => ({ ...prev, isOpen: false }));
  };

  const handleDeleteClick = (id: string, name: string) => {
    setConfirmModal({
      isOpen: true,
      title: '¿Eliminar categoría?',
      message: `¿Estás seguro de eliminar la categoría "${name}"?`,
      onConfirm: () => executeDeleteCategory(id),
    });
  };

  // --- Motor de Lógica Drag & Drop ---
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCategories((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        
        // arrayMove calcula la nueva estructura del array
        const reordered = arrayMove(items, oldIndex, newIndex);

        // Recalculamos el sort_order basándonos en los nuevos índices
        const updatedCategories = reordered.map((cat, i) => ({
          ...cat,
          sort_order: i
        }));

        // Actualizamos Supabase en background (Fire and Forget)
        supabase
          .from('categories')
          .upsert(updatedCategories)
          .then(({ error }) => {
            if (error) console.error("Error al persistir el nuevo orden:", error);
            else onReload(); // Avisamos a la vista padre que refresque si es necesario
          });

        return updatedCategories;
      });
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white w-full max-w-md rounded-3xl p-6 shadow-xl space-y-5 max-h-[85vh] flex flex-col">
          <div className="flex justify-between items-center border-b pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center">
                <ListTree className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base">Gestionar Categorías</h3>
              </div>
            </div>
            <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-y-auto flex-1 space-y-4 pr-1 pb-4">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nueva categoría..."
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 p-2 border rounded-xl text-xs bg-white text-gray-900 focus:outline-blue-500"
              />
              <button 
                onClick={handleAddCategory}
                className="bg-gray-900 text-white px-4 py-2 rounded-xl text-xs font-bold cursor-pointer hover:bg-gray-800 shrink-0"
              >
                <Plus className="w-4 h-4 inline" /> Agregar
              </button>
            </div>

            {loading ? (
              <p className="text-xs text-gray-400 text-center py-4">Cargando categorías...</p>
            ) : categories.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4 italic">No hay categorías configuradas.</p>
            ) : (
              <div className="space-y-2">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={categories.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {categories.map(category => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        isEditing={editingState[category.id] !== undefined}
                        currentName={editingState[category.id] ?? category.name}
                        onEditStateChange={(val: string) => setEditingState({ ...editingState, [category.id]: val })}
                        onUpdate={() => handleUpdateCategory(category.id)}
                        onCancelEdit={() => { const copy = { ...editingState }; delete copy[category.id]; setEditingState(copy); }}
                        onEditClick={() => setEditingState({ ...editingState, [category.id]: category.name })}
                        onDeleteClick={() => handleDeleteClick(category.id, category.name)}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </div>
            )}
          </div>

          <div className="pt-2 border-t shrink-0 flex justify-end">
            <button onClick={onClose} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs shadow-md cursor-pointer">
              Cerrar
            </button>
          </div>
        </div>
      </div>
      <ConfirmModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} onConfirm={confirmModal.onConfirm} onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))} />
    </>
  );
}