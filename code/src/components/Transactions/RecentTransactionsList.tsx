import React, { useState, useMemo } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { CategoryIcon } from '../Common/CategoryIcon';
import { Trash2, ChevronDown, ChevronRight, Pencil, Clock, ArrowRight } from 'lucide-react';
import { type Transaction } from '../../types';
import { convertAmount } from '../../services/currencyService';

export const RecentTransactionsList: React.FC = () => {
  const {
    transactions,
    allTransactionsForMonth,
    categories,
    deleteTransaction,
    updateTransaction,
    openKeypad,
    selectedDate,
    activeCurrency,
    exchangeRate,
  } = useBudget();

  const [viewScope, setViewScope] = useState<'categories' | 'month' | 'day'>('categories');
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [reclassifyingId, setReclassifyingId] = useState<string | null>(null);

  const displayedList =
    viewScope === 'day' ? transactions : allTransactionsForMonth;

  const rate = exchangeRate?.venta || 1400;
  const activeSymbol = activeCurrency === 'ARS' ? '$' : 'US$';

  const formatAmount = (tx: Transaction) => {
    const symbol = tx.currency === 'ARS' ? '$' : 'US$';
    const sign = tx.type === 'income' ? '+' : '-';
    return `${sign}${symbol} ${new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 2,
    }).format(tx.amount)}`;
  };

  const formatSummaryAmount = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  const getCategory = (catId: string) => {
    return categories.find((c) => c.id === catId);
  };

  // Unclassified "Después veo" items for quick 1-tap sorting
  const pendingDespuesVeo = useMemo(() => {
    return allTransactionsForMonth.filter((tx) => tx.categoryId === 'cat-despues-veo');
  }, [allTransactionsForMonth]);

  const realExpenseCategories = useMemo(() => {
    return categories.filter((c) => c.type === 'expense' && c.id !== 'cat-despues-veo');
  }, [categories]);

  // Group transactions by category (Monefy History style)
  const categoryGroups = useMemo(() => {
    const groupsMap = new Map<
      string,
      {
        categoryId: string;
        totalConverted: number;
        items: Transaction[];
      }
    >();

    let grandTotalExpense = 0;

    displayedList.forEach((tx) => {
      const converted = convertAmount(
        tx.amount,
        tx.currency,
        activeCurrency,
        tx.exchangeRate || rate
      );
      if (tx.type === 'expense') {
        grandTotalExpense += converted;
      }

      const existing = groupsMap.get(tx.categoryId);
      if (existing) {
        existing.totalConverted += converted;
        existing.items.push(tx);
      } else {
        groupsMap.set(tx.categoryId, {
          categoryId: tx.categoryId,
          totalConverted: converted,
          items: [tx],
        });
      }
    });

    return Array.from(groupsMap.values())
      .map((g) => ({
        ...g,
        category: categories.find((c) => c.id === g.categoryId),
        percentage:
          grandTotalExpense > 0
            ? Math.min(100, Math.round((g.totalConverted / grandTotalExpense) * 100))
            : 0,
      }))
      .sort((a, b) => b.totalConverted - a.totalConverted);
  }, [displayedList, categories, activeCurrency, rate]);

  const toggleCategoryCollapse = (catId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  return (
    <section className="w-full max-w-md mx-auto px-4 mt-3 mb-12 flex flex-col gap-3">
      {/* "Después veo" Quick Reclassification Banner */}
      {pendingDespuesVeo.length > 0 && (
        <div className="bg-surfaceElevated border border-amber-500/40 rounded-2xl p-3.5 flex flex-col gap-2.5 animate-fadeIn">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="text-xs font-bold text-slate-100">
                Tenés {pendingDespuesVeo.length}{' '}
                {pendingDespuesVeo.length === 1 ? 'gasto pendiente' : 'gastos pendientes'} en “Después veo”
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {pendingDespuesVeo.map((tx) => {
              const isOpen = reclassifyingId === tx.id;
              return (
                <div
                  key={tx.id}
                  className="bg-background/80 border border-surfaceBorder rounded-xl p-2.5 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold text-white truncate">
                        {tx.note ? `"${tx.note}"` : 'Gasto sin clasificar'}
                      </span>
                      <span className="text-xs text-slate-400 tabular-nums">{tx.date}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-bold text-amber-300 tabular-nums">
                        {formatAmount(tx)}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReclassifyingId(isOpen ? null : tx.id)}
                        className="px-2.5 py-1.5 min-h-[34px] rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 text-xs font-semibold flex items-center gap-1 active-press"
                      >
                        <span>Clasificar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-surfaceBorder/80 animate-fadeIn">
                      {realExpenseCategories.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={async () => {
                            await updateTransaction(tx.id, { categoryId: cat.id });
                            setReclassifyingId(null);
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[34px] rounded-lg bg-surface hover:bg-surfaceHighlight border border-surfaceBorder text-xs font-medium text-slate-200 active-press"
                        >
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          <span>{cat.name}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Header bar: Title & Monefy View Switcher */}
      <div className="flex items-center justify-between gap-2 px-0.5">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-slate-300">
            Historial de Movimientos
          </h2>
          <span className="text-xs bg-surfaceHighlight px-2 py-0.5 rounded-full text-slate-300 font-medium tabular-nums">
            {displayedList.length}
          </span>
        </div>

        {/* Scope Switcher: Por Categoría (Monefy) | Mes | Día */}
        <div
          role="group"
          aria-label="Modo de visualización del historial"
          className="flex items-center bg-surface p-0.5 rounded-xl border border-surfaceBorder text-xs"
        >
          <button
            type="button"
            onClick={() => setViewScope('categories')}
            className={`px-2.5 py-1 min-h-[32px] rounded-lg font-medium transition-colors active-press ${
              viewScope === 'categories'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Categorías
          </button>
          <button
            type="button"
            onClick={() => setViewScope('month')}
            className={`px-2.5 py-1 min-h-[32px] rounded-lg font-medium transition-colors active-press ${
              viewScope === 'month'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Mes
          </button>
          <button
            type="button"
            onClick={() => setViewScope('day')}
            className={`px-2.5 py-1 min-h-[32px] rounded-lg font-medium transition-colors active-press ${
              viewScope === 'day'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Día
          </button>
        </div>
      </div>

      {/* Empty State */}
      {displayedList.length === 0 ? (
        <div className="bg-surface border border-surfaceBorder rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-1.5">
          <p className="text-sm font-semibold text-slate-200">
            {viewScope === 'day'
              ? `No hay registros para el ${selectedDate}.`
              : 'No hay registros en este mes todavía.'}
          </p>
          <span className="text-xs text-slate-400">
            Tocá cualquier categoría arriba para cargar un movimiento en 2 toques.
          </span>
        </div>
      ) : viewScope === 'categories' ? (
        /* MONEFY-STYLE EXPANDABLE CATEGORY GROUPS */
        <div className="flex flex-col gap-2.5">
          {categoryGroups.map((group) => {
            const cat = group.category;
            const isCollapsed = Boolean(collapsedCategories[group.categoryId]);
            const isIncomeGroup = cat?.type === 'income';
            const color = cat?.color || '#94A3B8';

            return (
              <div
                key={group.categoryId}
                className="bg-surface border border-surfaceBorder rounded-2xl overflow-hidden transition-colors"
              >
                {/* Category Group Header (Tap to Expand/Collapse) */}
                <button
                  type="button"
                  onClick={() => toggleCategoryCollapse(group.categoryId)}
                  aria-expanded={!isCollapsed}
                  className="w-full p-3.5 flex flex-col gap-2 text-left hover:bg-surfaceElevated/60 transition-colors active-press"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: `${color}22`,
                          color,
                        }}
                      >
                        <CategoryIcon name={cat?.icon || 'HelpCircle'} className="w-4 h-4" />
                      </div>

                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm font-bold text-slate-100 truncate">
                          {cat?.name || 'Otro'}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-surfaceHighlight text-slate-300 font-medium tabular-nums shrink-0">
                          {group.items.length}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs font-medium text-slate-400 tabular-nums">
                        {group.percentage}%
                      </span>
                      <span
                        className={`text-sm font-bold tabular-nums ${
                          isIncomeGroup ? 'text-emerald-400' : 'text-slate-100'
                        }`}
                      >
                        {activeSymbol} {formatSummaryAmount(group.totalConverted)}
                      </span>
                      {isCollapsed ? (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </div>

                  {/* Proportional Spend Bar */}
                  {!isIncomeGroup && (
                    <div className="w-full h-1.5 bg-background rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.max(4, group.percentage)}%`,
                          backgroundColor: color,
                        }}
                      />
                    </div>
                  )}
                </button>

                {/* Individual Movements inside Category */}
                {!isCollapsed && (
                  <div className="border-t border-surfaceBorder/70 divide-y divide-surfaceBorder/50 bg-background/40">
                    {group.items.map((tx) => {
                      const isIncome = tx.type === 'income';
                      const isHija = tx.categoryId === 'cat-hija';

                      return (
                        <div
                          key={tx.id}
                          className="px-3.5 py-2.5 flex items-center justify-between gap-2 hover:bg-surface/60 transition-colors"
                        >
                          <div className="flex flex-col min-w-0 gap-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs text-slate-400 tabular-nums">
                                {tx.date}
                              </span>
                              {tx.subTag && (
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-md font-medium shrink-0 ${
                                    isHija
                                      ? 'bg-pink-500/20 text-pink-200 border border-pink-500/30'
                                      : 'bg-surfaceHighlight text-slate-300 border border-surfaceBorder'
                                  }`}
                                >
                                  {tx.subTag}
                                </span>
                              )}
                              {tx.note && (
                                <span className="text-xs text-slate-200 truncate">
                                  "{tx.note}"
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`text-sm font-bold font-mono tabular-nums mr-1 ${
                                isIncome ? 'text-emerald-400' : 'text-slate-100'
                              }`}
                            >
                              {formatAmount(tx)}
                            </span>

                            <button
                              type="button"
                              onClick={() => openKeypad({ editingTransaction: tx })}
                              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-lg transition-colors active-press"
                              title="Editar registro"
                              aria-label="Editar registro"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteTransaction(tx.id)}
                              className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-400 rounded-lg transition-colors active-press"
                              title="Eliminar registro"
                              aria-label="Eliminar registro"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        /* CHRONOLOGICAL FLAT LIST (Mes / Día) */
        <div className="flex flex-col gap-2">
          {displayedList.map((tx) => {
            const cat = getCategory(tx.categoryId);
            const isIncome = tx.type === 'income';
            const isHija = tx.categoryId === 'cat-hija';

            return (
              <div
                key={tx.id}
                className="bg-surface border border-surfaceBorder rounded-2xl p-3 flex items-center justify-between gap-3 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${cat?.color || '#94A3B8'}22`,
                      color: cat?.color || '#94A3B8',
                    }}
                  >
                    <CategoryIcon name={cat?.icon || 'HelpCircle'} className="w-4 h-4" />
                  </div>

                  <div className="flex flex-col min-w-0 gap-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="text-sm font-semibold text-white truncate">
                        {cat?.name || 'Otro'}
                      </span>
                      {tx.subTag && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md font-medium shrink-0 ${
                            isHija
                              ? 'bg-pink-500/20 text-pink-200 border border-pink-500/30'
                              : 'bg-surfaceHighlight text-slate-300 border border-surfaceBorder'
                          }`}
                        >
                          {tx.subTag}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span className="tabular-nums">{tx.date}</span>
                      {tx.note && (
                        <>
                          <span>•</span>
                          <span className="truncate text-slate-300">"{tx.note}"</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <span
                    className={`text-sm font-bold font-mono tabular-nums mr-1 ${
                      isIncome ? 'text-emerald-400' : 'text-slate-100'
                    }`}
                  >
                    {formatAmount(tx)}
                  </span>

                  <button
                    type="button"
                    onClick={() => openKeypad({ editingTransaction: tx })}
                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-slate-100 rounded-lg transition-colors active-press"
                    title="Editar registro"
                    aria-label="Editar registro"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteTransaction(tx.id)}
                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-400 rounded-lg transition-colors active-press"
                    title="Eliminar registro"
                    aria-label="Eliminar registro"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
