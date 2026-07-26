'use client';

import { CalendarDays } from 'lucide-react';

interface TenantScheduleInputsProps {
  editOpeningTime: string;
  setEditOpeningTime: (val: string) => void;
  editClosingTime: string;
  setEditClosingTime: (val: string) => void;
  editWorkingDays: number[];
  toggleWorkingDay: (dayId: number) => void;
  weekDays: { id: number; label: string }[];
}

export function TenantScheduleInputs({
  editOpeningTime,
  setEditOpeningTime,
  editClosingTime,
  setEditClosingTime,
  editWorkingDays,
  toggleWorkingDay,
  weekDays,
}: TenantScheduleInputsProps) {
  return (
    <>
      <div className="pt-2 border-t border-gray-100">
        <label className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 mb-2">
          <CalendarDays className="w-4 h-4 text-emerald-600" /> Días de Trabajo
        </label>
        <div className="flex items-center justify-between gap-1">
          {weekDays.map((day) => {
            const isActiveDay = editWorkingDays.includes(day.id);
            return (
              <button
                key={day.id}
                type="button"
                onClick={() => toggleWorkingDay(day.id)}
                className={`w-8 h-8 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  isActiveDay
                    ? 'bg-emerald-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
              >
                {day.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2">
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Apertura</label>
          <input
            type="time"
            value={editOpeningTime}
            onChange={(e) => setEditOpeningTime(e.target.value)}
            className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-gray-700 block mb-1">Cierre</label>
          <input
            type="time"
            value={editClosingTime}
            onChange={(e) => setEditClosingTime(e.target.value)}
            className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
        </div>
      </div>
    </>
  );
}