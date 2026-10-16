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
    openKeypad,
  } = useBudget();

  const currencySymbol = activeCurrency === 'ARS' ? '$' : 'US$';

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(val);
  };

  // Donut Geometry
  const radius = 78;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  const currentCategoryTotal = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);
  const activeEntries = Object.entries(categoryTotals).filter(([, amount]) => amount > 0);
  const gapLength = activeEntries.length > 1 ? 3 : 0;

  let cumulativePercentage = 0;
  const segments = activeEntries.map(([catId, amount]) => {
    const cat = categories.find((c) => c.id === catId);
    const percentage = currentCategoryTotal > 0 ? amount / currentCategoryTotal : 0;
    const rawSegmentLength = percentage * circumference;
    const visibleLength = Math.max(2, rawSegmentLength - gapLength);
    const strokeDasharray = `${visibleLength} ${circumference - visibleLength}`;
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
    <section className="w-full max-w-md mx-auto px-4 mt-1 flex flex-col items-center">
      {/* Main Dial Card */}
      <div className="w-full bg-surface border border-surfaceBorder rounded-2xl p-4 flex flex-col items-center">
        {/* Donut & Balance Center */}
        <div className="relative w-52 h-52 flex items-center justify-center">
          <svg
            className="w-full h-full -rotate-90 transform"
            viewBox="0 0 200 200"
            role="img"
            aria-label="Distribución mensual por categoría"
          >
            {/* Track */}
            <circle
              cx="100"
              cy="100"
              r={radius}
              fill="transparent"
              stroke="#1A2232"
              strokeWidth={strokeWidth}
            />

            {/* Category Slices */}
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
                  strokeLinecap="butt"
                  onClick={() => openKeypad({ categoryId: seg.catId })}
                  className="transition-all duration-300 ease-out cursor-pointer hover:opacity-85"
                >
                  <title>{`${seg.name}: ${currencySymbol} ${formatAmount(seg.amount)} (${Math.round(seg.percentage * 100)}%)`}</title>
                </circle>
              ))
            ) : (
              <circle
                cx="100"
                cy="100"
                r={radius}
                fill="transparent"
                stroke="#242F42"
                strokeWidth={strokeWidth}
                strokeDasharray="6 6"
              />
            )}
          </svg>

          {/* Center Readout */}
          <div className="absolute inset-4 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-xs font-medium text-slate-400">
              Balance Mes
            </span>

            <div className="flex items-baseline justify-center gap-1 mt-0.5 tabular-nums">
              <span className="text-sm font-semibold text-slate-400">{currencySymbol}</span>
              <span
                className={`text-2xl font-extrabold tracking-tight ${
                  currentTotals.balance >= 0 ? 'text-slate-100' : 'text-rose-400'
                }`}
              >
                {formatAmount(currentTotals.balance)}
              </span>
            </div>

            {/* Income vs Expense summary */}
            <div className="flex items-center gap-2.5 mt-2 px-2.5 py-1 rounded-lg bg-background/80 border border-surfaceBorder/80 text-xs tabular-nums">
              <div className="flex items-center gap-0.5 text-emerald-400 font-semibold" title="Ingresos del mes">
                <ArrowUpRight className="w-3.5 h-3.5 shrink-0" />
                <span>{formatAmount(currentTotals.income)}</span>
              </div>
              <span className="text-slate-600">•</span>
              <div className="flex items-center gap-0.5 text-rose-400 font-semibold" title="Gastos del mes">
                <ArrowDownRight className="w-3.5 h-3.5 shrink-0" />
                <span>{formatAmount(currentTotals.expense)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mode Selector & Quick Entry Trigger */}
        <div className="w-full grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-surfaceBorder/70">
          <button
            type="button"
            onClick={() => setTransactionType('expense')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 min-h-[42px] rounded-xl text-xs font-semibold transition-colors active-press ${
              transactionType === 'expense'
                ? 'bg-rose-500/20 text-rose-200 border border-rose-500/40'
                : 'bg-background/60 text-slate-400 border border-surfaceBorder hover:text-slate-200'
            }`}
          >
            <Minus className="w-4 h-4 shrink-0" />
            <span>Gastos (-)</span>
          </button>

          <button
            type="button"
            onClick={() => setTransactionType('income')}
            className={`flex items-center justify-center gap-2 py-2.5 px-4 min-h-[42px] rounded-xl text-xs font-semibold transition-colors active-press ${
              transactionType === 'income'
                ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/40'
                : 'bg-background/60 text-slate-400 border border-surfaceBorder hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Ingresos (+)</span>
          </button>
        </div>
      </div>
    </section>
  );
};
