'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-gray-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto text-xl font-bold">
          ⚠️
        </div>
        <h3 className="text-lg font-bold text-gray-900 leading-snug">
          {title}
        </h3>
        <p className="text-xs text-gray-600 leading-relaxed">
          {message}
        </p>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={onCancel}
            className="w-full py-3 bg-gray-100 text-gray-700 rounded-2xl font-bold text-xs hover:bg-gray-200 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="w-full py-3 bg-red-600 text-white rounded-2xl font-bold text-xs hover:bg-red-700 transition-all shadow-md shadow-red-600/20 cursor-pointer"
          >
            Sí, eliminar
          </button>
        </div>
      </div>
    </div>
  );
}