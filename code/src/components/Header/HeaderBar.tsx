import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { Calendar, SlidersHorizontal, ChevronLeft, ChevronRight } from 'lucide-react';
import { ReportsAndAiModal } from '../Export/ReportsAndAiModal';

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export const HeaderBar: React.FC = () => {
  const {
    activeView,
    datePreset,
    setDatePreset,
    shiftMonth,
    selectedDate,
  } = useBudget();

  const [isReportsOpen, setIsReportsOpen] = useState(false);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setDatePreset('custom', e.target.value);
    }
  };

  const formattedCustomDate = () => {
    if (datePreset === 'today') return 'Hoy';
    if (datePreset === 'yesterday') return 'Ayer';
    const [, month, day] = selectedDate.split('-');
    return `${day}/${month}`;
  };

  const formattedMonthLabel = () => {
    const [yearStr, monthStr] = selectedDate.split('-');
    const monthIndex = Math.max(0, Math.min(11, parseInt(monthStr, 10) - 1));
    return `${MONTH_NAMES[monthIndex]} ${yearStr}`;
  };

  return (
    <>
      <header className="w-full flex flex-col gap-2.5 pt-3 pb-1.5 px-4 max-w-md mx-auto">
        {/* Top row: Brand & Tools */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <h1 className="text-base font-bold tracking-tight text-slate-100 truncate">
              Focus Budget
            </h1>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Reports, AI & Backup trigger */}
            <button
              type="button"
              onClick={() => setIsReportsOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold bg-surface hover:bg-surfaceHighlight text-slate-200 border border-surfaceBorder active-press"
              title="Exportar a Excel/CSV, Prompt para IA y Sincronización"
              aria-label="Abrir reportes, IA y respaldo"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>IA & Export</span>
            </button>
          </div>
        </div>

        {/* Second row: Month Navigation & Fast Date Selector (Only on Main Dial View) */}
        {activeView === 'dial' && (
          <div className="flex items-center justify-between gap-2">
            {/* Month Stepper */}
            <div className="flex items-center bg-surface rounded-xl border border-surfaceBorder p-0.5 shrink-0">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                className="p-2 text-slate-400 hover:text-white rounded-lg active-press"
                aria-label="Mes anterior"
                title="Mes anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-1.5 text-xs font-semibold text-slate-200 tabular-nums min-w-[92px] text-center">
                {formattedMonthLabel()}
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                className="p-2 text-slate-400 hover:text-white rounded-lg active-press"
                aria-label="Mes siguiente"
                title="Mes siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* 1-Touch Fast Date Selector */}
            <div className="flex items-center bg-surface p-1 rounded-xl border border-surfaceBorder flex-1 gap-1">
              <button
                type="button"
                onClick={() => setDatePreset('today')}
                className={`flex-1 py-1.5 min-h-[34px] text-xs font-semibold rounded-lg transition-colors active-press ${
                  datePreset === 'today'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Hoy
              </button>

              <button
                type="button"
                onClick={() => setDatePreset('yesterday')}
                className={`flex-1 py-1.5 min-h-[34px] text-xs font-semibold rounded-lg transition-colors active-press ${
                  datePreset === 'yesterday'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ayer
              </button>

              {/* Accessible Label wrapping native date input */}
              <label
                className={`flex-1 py-1.5 px-2 min-h-[34px] text-xs font-semibold rounded-lg transition-colors active-press flex items-center justify-center gap-1.5 relative cursor-pointer ${
                  datePreset === 'custom'
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5 shrink-0" />
                <span className="tabular-nums">
                  {datePreset === 'custom' ? formattedCustomDate() : 'Fecha'}
                </span>
                <input
                  type="date"
                  aria-label="Elegir fecha específica"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="sr-only"
                />
              </label>
            </div>
          </div>
        )}
      </header>

      {/* Reports & AI Modal */}
      {isReportsOpen && <ReportsAndAiModal onClose={() => setIsReportsOpen(false)} />}
    </>
  );
};
