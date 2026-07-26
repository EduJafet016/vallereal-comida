'use client';

interface TenantDeliveryInputsProps {
  editFeeLow: string;
  setEditFeeLow: (val: string) => void;
  editFeeHigh: string;
  setEditFeeHigh: (val: string) => void;
  editEnableFree: boolean;
  setEditEnableFree: (val: boolean) => void;
  editFreeMinAmount: string;
  setEditFreeMinAmount: (val: string) => void;
}

export function TenantDeliveryInputs({
  editFeeLow,
  setEditFeeLow,
  editFeeHigh,
  setEditFeeHigh,
  editEnableFree,
  setEditEnableFree,
  editFreeMinAmount,
  setEditFreeMinAmount,
}: TenantDeliveryInputsProps) {
  return (
    <div className="pt-2 border-t space-y-2">
      <span className="text-xs font-bold text-gray-800 block">Costos de Envío por Zona</span>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Parte Baja ($)</label>
          <input
            type="number"
            min="0"
            value={editFeeLow}
            onChange={(e) => setEditFeeLow(e.target.value)}
            className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Parte Alta ($)</label>
          <input
            type="number"
            min="0"
            value={editFeeHigh}
            onChange={(e) => setEditFeeHigh(e.target.value)}
            className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 cursor-pointer pt-1">
        <input
          type="checkbox"
          checked={editEnableFree}
          onChange={(e) => setEditEnableFree(e.target.checked)}
          className="w-4 h-4 text-emerald-600 accent-emerald-600 rounded"
        />
        <span className="text-xs font-semibold text-gray-800">
          Ofrecer Envío Gratis por consumo mínimo
        </span>
      </label>

      {editEnableFree && (
        <div>
          <label className="text-[11px] font-semibold text-gray-600 block mb-0.5">Monto mínimo ($)</label>
          <input
            type="number"
            min="0"
            value={editFreeMinAmount}
            onChange={(e) => setEditFreeMinAmount(e.target.value)}
            className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      )}
    </div>
  );
}