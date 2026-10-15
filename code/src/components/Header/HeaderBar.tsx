import React, { useRef } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { Calendar, RefreshCw } from 'lucide-react';

export const HeaderBar: React.FC = () => {
  const { 
    datePreset, 
    setDatePreset, 
    selectedDate, 
    activeCurrency, 
    setActiveCurrency, 
    exchangeRate,
  } = useBudget();

  const dateInputRef = useRef<HTMLInputElement>(null);

  const handleCustomDateClick = () => {
    dateInputRef.current?.showPicker();
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      setDatePreset('custom', e.target.value);
    }
  };

  // Format date display for custom selector
  const formattedCustomDate = () => {
    if (datePreset === 'today') return 'Hoy';
    if (datePreset === 'yesterday') return 'Ayer';
    const [, month, day] = selectedDate.split('-');
    return `${day}/${month}`;
  };

  return (
    <header className="w-full flex flex-col gap-2 pt-2 pb-1 px-4 max-w-md mx-auto">
      {/* Top row: Brand & Currency & Rate */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <span className="text-white font-bold text-xs">FB</span>
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-1.5">
              Focus Budget
            </h1>
          </div>
        </div>

        {/* Currency Switcher & Rate Badge */}
        <div className="flex items-center gap-2">
          {exchangeRate && (
            <div 
              title={`Cotización oficial venta: $${exchangeRate.venta}`}
              className="hidden sm:flex items-center gap-1 text-[11px] text-slate-400 bg-surface px-2 py-0.5 rounded-full border border-surfaceBorder"
            >
              <RefreshCw className="w-2.5 h-2.5 text-emerald-400 animate-spin-slow" />
              <span>US$ = ${exchangeRate.venta}</span>
            </div>
          )}

          <div className="flex items-center bg-surface p-0.5 rounded-full border border-surfaceBorder">
            <button
              onClick={() => setActiveCurrency('ARS')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all active-press ${
                activeCurrency === 'ARS'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ARS ($)
            </button>
            <button
              onClick={() => setActiveCurrency('USD')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all active-press ${
                activeCurrency === 'USD'
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USD ($)
            </button>
          </div>
        </div>
      </div>

      {/* Second row: 1-Touch Fast Date Selector (TDAH Frictionless) */}
      <div className="flex items-center justify-between bg-surface/90 backdrop-blur-md p-1 rounded-xl border border-surfaceBorder/80 shadow-md">
        <div className="flex items-center gap-1 w-full">
          {/* HOY */}
          <button
            onClick={() => setDatePreset('today')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all active-press ${
              datePreset === 'today'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-surfaceHighlight/50'
            }`}
          >
            Hoy
          </button>

          {/* AYER */}
          <button
            onClick={() => setDatePreset('yesterday')}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-all active-press ${
              datePreset === 'yesterday'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-surfaceHighlight/50'
            }`}
          >
            Ayer
          </button>

          {/* CALENDARIO */}
          <button
            onClick={handleCustomDateClick}
            className={`flex-1 py-1.5 px-2 text-xs font-medium rounded-lg transition-all active-press flex items-center justify-center gap-1.5 relative ${
              datePreset === 'custom'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-semibold'
                : 'text-slate-400 hover:text-white hover:bg-surfaceHighlight/50'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{datePreset === 'custom' ? formattedCustomDate() : 'Fecha'}</span>
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </button>
        </div>
      </div>
    </header>
  );
};
