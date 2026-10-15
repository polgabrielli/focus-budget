import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { ArrowDownRight, ArrowUpRight, Plus, Minus } from 'lucide-react';

export const MonefyDial: React.FC = () => {
  const {
    currentTotals,
    categoryTotals,
    categories,
    activeCurrency,
    transactionType,
    setTransactionType,
  } = useBudget();

  const currencySymbol = activeCurrency === 'ARS' ? '$' : 'US$';

  // Format currency numbers nicely with thousands separators
  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Prepare Donut Segments
  const radius = 76;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;
  
  // Total of the currently selected transaction type (for percentage computation)
  const currentCategoryTotal = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

  // Build segments
  let cumulativePercentage = 0;
  const segments = Object.entries(categoryTotals)
    .filter(([, amount]) => amount > 0)
    .map(([catId, amount]) => {
      const cat = categories.find(c => c.id === catId);
      const percentage = currentCategoryTotal > 0 ? amount / currentCategoryTotal : 0;
      const strokeDasharray = `${percentage * circumference} ${circumference}`;
      const strokeDashoffset = -cumulativePercentage * circumference;
      cumulativePercentage += percentage;

      return {
        catId,
        name: cat?.name || 'Otro',
        color: cat?.color || '#94A3B8',
        amount,
        percentage,
        strokeDasharray,
        strokeDashoffset,
      };
    });

  return (
    <div className="flex flex-col items-center justify-center relative my-1 px-4">
      {/* Donut Container */}
      <div className="relative w-56 h-56 flex items-center justify-center">
        {/* SVG Donut */}
        <svg 
          className="w-full h-full -rotate-90 transform" 
          viewBox="0 0 200 200"
        >
          {/* Background circle track */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="transparent"
            stroke="#151D2A"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {segments.length > 0 ? (
            segments.map((seg) => (
              <circle
                key={seg.catId}
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-out"
              />
            ))
          ) : (
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke="#27354D"
              strokeWidth={strokeWidth}
              strokeDasharray="4 8"
            />
          )}
        </svg>

        {/* Center of the Dial: Balance & Totals */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
            Balance Mes
          </span>
          
          <div className="flex items-baseline justify-center gap-0.5 mt-0.5">
            <span className="text-xs font-semibold text-slate-300">{currencySymbol}</span>
            <span className={`text-2xl font-black tracking-tight ${
              currentTotals.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {formatAmount(currentTotals.balance)}
            </span>
          </div>

          {/* Micro breakdown: Ingresos vs Gastos */}
          <div className="flex items-center gap-2.5 mt-1.5 text-[11px]">
            <div className="flex items-center text-emerald-400 font-medium">
              <ArrowUpRight className="w-3 h-3" />
              <span>{formatAmount(currentTotals.income)}</span>
            </div>
            <span className="text-slate-600">|</span>
            <div className="flex items-center text-rose-400 font-medium">
              <ArrowDownRight className="w-3 h-3" />
              <span>{formatAmount(currentTotals.expense)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mode Selector Pill: (-) Gastos vs (+) Ingresos */}
      <div className="flex items-center bg-surface/90 border border-surfaceBorder rounded-full p-1 mt-1 shadow-md">
        <button
          onClick={() => setTransactionType('expense')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active-press ${
            transactionType === 'expense'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Minus className="w-3.5 h-3.5" />
          <span>Gastos (-)</span>
        </button>

        <button
          onClick={() => setTransactionType('income')}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold transition-all active-press ${
            transactionType === 'income'
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Ingresos (+)</span>
        </button>
      </div>
    </div>
  );
};
