import React, { useState, useMemo, useEffect } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { CategoryIcon } from '../Common/CategoryIcon';
import { convertAmount } from '../../services/currencyService';
import {
  ArrowDownRight,
  ArrowUpRight,
  Plus,
  Minus,
  PieChart,
  Activity,
  Award,
  Calendar,
} from 'lucide-react';

type VisualMode = 'ring' | 'pace' | 'chips';

export const BudgetDial: React.FC = () => {
  const {
    currentTotals,
    categoryTotals,
    categories,
    allTransactionsForMonth,
    activeCurrency,
    selectedDate,
    exchangeRate,
    transactionType,
    setTransactionType,
  } = useBudget();

  const [visualMode, setVisualMode] = useState<VisualMode>('ring');
  const [inspectedCatId, setInspectedCatId] = useState<string | null>(null);

  // Reset inspected category when switching between Gastos/Ingresos or changing month
  useEffect(() => {
    setInspectedCatId(null);
  }, [transactionType, selectedDate]);

  const currencySymbol = activeCurrency === 'ARS' ? '$' : 'US$';
  const fallbackRate = exchangeRate?.venta || 1400;

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(val);
  };

  const formatCompact = (val: number) => {
    if (val >= 1_000_000) {
      return `${(val / 1_000_000).toLocaleString('es-AR', { maximumFractionDigits: 1 })}M`;
    }
    if (val >= 10_000) {
      return `${Math.round(val / 1_000)}k`;
    }
    return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(val);
  };

  // Donut Geometry
  const radius = 78;
  const strokeWidth = 18;
  const circumference = 2 * Math.PI * radius;

  const currentCategoryTotal = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);
  const activeEntries = Object.entries(categoryTotals)
    .filter(([, amount]) => amount > 0)
    .sort((a, b) => b[1] - a[1]);
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
      icon: cat?.icon || 'HelpCircle',
      color: cat?.color || '#94A3B8',
      amount,
      percentage,
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const inspectedSegment = segments.find((s) => s.catId === inspectedCatId) || null;

  // Top chip for the currently inspected category in the ring
  const inspectedTopChip = useMemo(() => {
    if (!inspectedCatId) return null;
    const chipTotals: Record<string, number> = {};
    allTransactionsForMonth
      .filter((tx) => tx.categoryId === inspectedCatId && tx.type === transactionType)
      .forEach((tx) => {
        const key = tx.subTag || 'Sin chip';
        const val = convertAmount(tx.amount, tx.currency, activeCurrency, tx.exchangeRate || fallbackRate);
        chipTotals[key] = (chipTotals[key] || 0) + val;
      });
    const sorted = Object.entries(chipTotals).sort((a, b) => b[1] - a[1]);
    if (sorted.length === 0 || sorted[0][0] === 'Sin chip') return null;
    return sorted[0][0];
  }, [inspectedCatId, allTransactionsForMonth, transactionType, activeCurrency, fallbackRate]);

  // VIEW 2 DATA: Pace Thermometer (Plata vs Calendario) & 4 Weekly Bars
  const paceData = useMemo(() => {
    const [yearStr, monthStr] = selectedDate.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();

    const now = new Date();
    const isCurrentMonth =
      now.getFullYear() === year && now.getMonth() + 1 === month;
    const currentDay = isCurrentMonth ? now.getDate() : daysInMonth;
    const elapsedPct = Math.min(100, Math.max(1, Math.round((currentDay / daysInMonth) * 100)));

    const hasIncome = currentTotals.income > 0;
    const spentPct = hasIncome
      ? Math.round((currentTotals.expense / currentTotals.income) * 100)
      : 0;

    // Weekly breakdown (Sem 1: 1-7, Sem 2: 8-14, Sem 3: 15-21, Sem 4: 22+)
    const weeks = [
      { label: 'Sem 1', subLabel: '1-7', total: 0, byCat: {} as Record<string, number> },
      { label: 'Sem 2', subLabel: '8-14', total: 0, byCat: {} as Record<string, number> },
      { label: 'Sem 3', subLabel: '15-21', total: 0, byCat: {} as Record<string, number> },
      { label: 'Sem 4', subLabel: `22-${daysInMonth}`, total: 0, byCat: {} as Record<string, number> },
    ];

    allTransactionsForMonth
      .filter((tx) => tx.type === 'expense')
      .forEach((tx) => {
        const day = parseInt(tx.date.split('-')[2] || '1', 10);
        const weekIdx = day <= 7 ? 0 : day <= 14 ? 1 : day <= 21 ? 2 : 3;
        const val = convertAmount(tx.amount, tx.currency, activeCurrency, tx.exchangeRate || fallbackRate);
        weeks[weekIdx].total += val;
        weeks[weekIdx].byCat[tx.categoryId] = (weeks[weekIdx].byCat[tx.categoryId] || 0) + val;
      });

    const maxWeekTotal = Math.max(...weeks.map((w) => w.total), 1);

    return {
      currentDay,
      daysInMonth,
      elapsedPct,
      hasIncome,
      spentPct,
      weeks,
      maxWeekTotal,
    };
  }, [selectedDate, currentTotals, allTransactionsForMonth, activeCurrency, fallbackRate]);

  // VIEW 3 DATA: Top 5 Chips / Subcategories across the month
  const topChipsData = useMemo(() => {
    const map = new Map<
      string,
      {
        key: string;
        chipName: string;
        categoryName: string;
        categoryIcon: string;
        color: string;
        amount: number;
      }
    >();

    let totalPool = 0;

    allTransactionsForMonth
      .filter((tx) => tx.type === transactionType)
      .forEach((tx) => {
        const cat = categories.find((c) => c.id === tx.categoryId);
        const val = convertAmount(tx.amount, tx.currency, activeCurrency, tx.exchangeRate || fallbackRate);
        totalPool += val;

        const chipLabel = tx.subTag || cat?.name || 'General';
        const mapKey = `${tx.categoryId}::${chipLabel}`;
        const existing = map.get(mapKey);
        if (existing) {
          existing.amount += val;
        } else {
          map.set(mapKey, {
            key: mapKey,
            chipName: chipLabel,
            categoryName: cat?.name || 'Otro',
            categoryIcon: cat?.icon || 'HelpCircle',
            color: cat?.color || '#6366F1',
            amount: val,
          });
        }
      });

    return Array.from(map.values())
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)
      .map((item) => ({
        ...item,
        percentage: totalPool > 0 ? Math.round((item.amount / totalPool) * 100) : 0,
      }));
  }, [allTransactionsForMonth, transactionType, categories, activeCurrency, fallbackRate]);

  return (
    <section className="w-full max-w-md mx-auto px-4 mt-1 flex flex-col items-center">
      {/* Main Dial Card */}
      <div className="w-full bg-surface border border-surfaceBorder rounded-2xl p-3.5 flex flex-col items-center">
        {/* 3-in-1 Visual Mode Switcher */}
        <div
          role="tablist"
          aria-label="Modo de visualización gráfica"
          className="w-full grid grid-cols-3 p-1 bg-background/70 border border-surfaceBorder rounded-xl mb-2.5 gap-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={visualMode === 'ring'}
            onClick={() => setVisualMode('ring')}
            className={`py-1.5 px-2 min-h-[30px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active-press ${
              visualMode === 'ring'
                ? 'bg-surfaceElevated text-white shadow-sm border border-surfaceBorder'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5 text-indigo-400" />
            <span>Anillo</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={visualMode === 'pace'}
            onClick={() => setVisualMode('pace')}
            className={`py-1.5 px-2 min-h-[30px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active-press ${
              visualMode === 'pace'
                ? 'bg-surfaceElevated text-white shadow-sm border border-surfaceBorder'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Ritmo</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={visualMode === 'chips'}
            onClick={() => setVisualMode('chips')}
            className={`py-1.5 px-2 min-h-[30px] rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors active-press ${
              visualMode === 'chips'
                ? 'bg-surfaceElevated text-white shadow-sm border border-surfaceBorder'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>Top Chips</span>
          </button>
        </div>

        {/* ==================== MODE 1: INTERACTIVE RING ==================== */}
        {visualMode === 'ring' && (
          <div className="w-full flex flex-col items-center animate-fadeIn">
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
                  segments.map((seg) => {
                    const isInspected = inspectedCatId === seg.catId;
                    const isDimmed = inspectedCatId !== null && !isInspected;
                    return (
                      <circle
                        key={seg.catId}
                        cx="100"
                        cy="100"
                        r={radius}
                        fill="transparent"
                        stroke={seg.color}
                        strokeWidth={isInspected ? strokeWidth + 4 : strokeWidth}
                        strokeDasharray={seg.strokeDasharray}
                        strokeDashoffset={seg.strokeDashoffset}
                        strokeLinecap="butt"
                        onClick={() =>
                          setInspectedCatId(isInspected ? null : seg.catId)
                        }
                        className={`transition-all duration-300 ease-out cursor-pointer ${
                          isDimmed ? 'opacity-40' : 'opacity-100 hover:opacity-90'
                        }`}
                      >
                        <title>{`${seg.name}: ${currencySymbol} ${formatAmount(seg.amount)} (${Math.round(seg.percentage * 100)}%)`}</title>
                      </circle>
                    );
                  })
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

              {/* Center Readout: Either Inspected Category OR Overall Month Balance */}
              {inspectedSegment ? (
                <button
                  type="button"
                  onClick={() => setInspectedCatId(null)}
                  title="Tocar para volver al Balance del Mes"
                  className="absolute inset-5 rounded-full flex flex-col items-center justify-center text-center p-2 hover:bg-surfaceElevated/40 transition-colors active-press"
                >
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center mb-1"
                    style={{
                      backgroundColor: `${inspectedSegment.color}25`,
                      color: inspectedSegment.color,
                    }}
                  >
                    <CategoryIcon name={inspectedSegment.icon} className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-white truncate max-w-[125px]">
                    {inspectedSegment.name}
                  </span>
                  <span className="text-lg font-extrabold text-slate-100 tabular-nums mt-0.5">
                    {currencySymbol} {formatAmount(inspectedSegment.amount)}
                  </span>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full mt-0.5 tabular-nums"
                    style={{
                      backgroundColor: `${inspectedSegment.color}25`,
                      color: inspectedSegment.color,
                    }}
                  >
                    {Math.round(inspectedSegment.percentage * 100)}% del total
                  </span>
                  {inspectedTopChip && (
                    <span className="text-[10px] text-slate-400 truncate max-w-[120px] mt-0.5">
                      Top: {inspectedTopChip}
                    </span>
                  )}
                </button>
              ) : (
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
              )}
            </div>

            {/* Interactive Visual Legend Pills (Tap to inspect slice without guessing colors) */}
            {segments.length > 0 && (
              <div className="w-full flex items-center gap-1.5 overflow-x-auto scrollbar-none pt-1 pb-0.5 justify-center flex-wrap">
                {segments.slice(0, 5).map((seg) => {
                  const isSelected = inspectedCatId === seg.catId;
                  return (
                    <button
                      key={seg.catId}
                      type="button"
                      onClick={() =>
                        setInspectedCatId(isSelected ? null : seg.catId)
                      }
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-semibold border transition-all active-press ${
                        isSelected
                          ? 'bg-surfaceHighlight text-white border-slate-500 scale-105'
                          : 'bg-background/60 text-slate-300 border-surfaceBorder hover:text-white'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="truncate max-w-[85px]">{seg.name}</span>
                      <span className="text-slate-400 tabular-nums">
                        {Math.round(seg.percentage * 100)}%
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ==================== MODE 2: PACE THERMOMETER & WEEKLY BARS ==================== */}
        {visualMode === 'pace' && (
          <div className="w-full min-h-[208px] flex flex-col justify-between gap-3 py-1 animate-fadeIn">
            {/* Thermometer: Time vs Money */}
            <div className="bg-background/60 border border-surfaceBorder rounded-xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Plata vs. Calendario</span>
                </span>
                {paceData.hasIncome ? (
                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                      paceData.spentPct <= paceData.elapsedPct
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : paceData.spentPct <= paceData.elapsedPct + 15
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-rose-500/20 text-rose-300'
                    }`}
                  >
                    {paceData.spentPct <= paceData.elapsedPct
                      ? '🟢 Ritmo saludable'
                      : paceData.spentPct <= paceData.elapsedPct + 15
                      ? '🟡 Ritmo parejo'
                      : '🟠 Ritmo acelerado'}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Sin ingresos cargados
                  </span>
                )}
              </div>

              {/* Bar 1: Month Elapsed */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
                  <span>Mes transcurrido (Día {paceData.currentDay} de {paceData.daysInMonth})</span>
                  <span className="font-semibold text-slate-200">{paceData.elapsedPct}%</span>
                </div>
                <div className="w-full h-2 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                    style={{ width: `${paceData.elapsedPct}%` }}
                  />
                </div>
              </div>

              {/* Bar 2: Income Consumed */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between text-[11px] text-slate-400 tabular-nums">
                  <span>Ingresos consumidos ({currencySymbol} {formatCompact(currentTotals.expense)})</span>
                  <span className="font-semibold text-slate-200">
                    {paceData.hasIncome ? `${paceData.spentPct}%` : '—'}
                  </span>
                </div>
                <div className="w-full h-2.5 bg-surface rounded-full overflow-hidden relative">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      !paceData.hasIncome
                        ? 'bg-slate-600'
                        : paceData.spentPct <= paceData.elapsedPct
                        ? 'bg-emerald-500'
                        : paceData.spentPct <= paceData.elapsedPct + 15
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                    style={{
                      width: `${paceData.hasIncome ? Math.min(100, paceData.spentPct) : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* 4 Weekly Bars */}
            <div className="bg-background/60 border border-surfaceBorder rounded-xl p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-200">Pulso por Semana del Mes</span>
                <span className="text-[11px] text-slate-400">Gastos en {activeCurrency}</span>
              </div>

              <div className="grid grid-cols-4 gap-2.5 items-end h-20 pt-2">
                {paceData.weeks.map((w) => {
                  const heightPct =
                    w.total > 0
                      ? Math.max(14, Math.round((w.total / paceData.maxWeekTotal) * 100))
                      : 6;
                  return (
                    <div
                      key={w.label}
                      className="flex flex-col items-center justify-end h-full gap-1"
                    >
                      <span className="text-[10px] font-bold text-slate-300 tabular-nums">
                        {w.total > 0 ? `${currencySymbol}${formatCompact(w.total)}` : '—'}
                      </span>
                      <div className="w-full bg-surface rounded-lg h-11 flex items-end overflow-hidden p-0.5 border border-surfaceBorder/60">
                        <div
                          className={`w-full rounded-md transition-all duration-300 ${
                            w.total > 0 ? 'bg-indigo-500' : 'bg-slate-800'
                          }`}
                          style={{ height: `${heightPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {w.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================== MODE 3: TOP 5 SMART CHIPS ==================== */}
        {visualMode === 'chips' && (
          <div className="w-full min-h-[208px] flex flex-col justify-between py-1 animate-fadeIn">
            <div className="flex items-center justify-between mb-1.5 px-0.5">
              <span className="text-xs font-bold text-slate-200">
                Top 5 {transactionType === 'expense' ? 'Gastos' : 'Ingresos'} por Chip / Rubro
              </span>
              <span className="text-[11px] text-slate-400">
                % del mes
              </span>
            </div>

            {topChipsData.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-background/50 rounded-xl border border-surfaceBorder">
                <span className="text-xs font-semibold text-slate-300">
                  Todavía no hay movimientos este mes
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Elegí un chip al cargar tus gastos para ver acá el ranking visual.
                </span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 my-auto">
                {topChipsData.map((item) => (
                  <div
                    key={item.key}
                    className="bg-background/60 border border-surfaceBorder rounded-xl px-3 py-2 flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <div
                          className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                          style={{
                            backgroundColor: `${item.color}22`,
                            color: item.color,
                          }}
                        >
                          <CategoryIcon name={item.categoryIcon} className="w-3.5 h-3.5" />
                        </div>
                        <span className="font-bold text-slate-100 truncate">
                          {item.chipName}
                        </span>
                        {item.chipName !== item.categoryName && (
                          <span className="text-[11px] text-slate-400 truncate">
                            • {item.categoryName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 tabular-nums">
                        <span className="font-bold text-slate-100">
                          {currencySymbol} {formatCompact(item.amount)}
                        </span>
                        <span
                          className="text-[10px] font-bold px-1.5 py-0.5 rounded-md"
                          style={{
                            backgroundColor: `${item.color}25`,
                            color: item.color,
                          }}
                        >
                          {item.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(4, item.percentage)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

