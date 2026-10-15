import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { CategoryIcon } from '../Common/CategoryIcon';
import { Trash2, ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { type Transaction } from '../../types';

export const RecentTransactionsList: React.FC = () => {
  const { 
    transactions, 
    allTransactionsForMonth, 
    categories, 
    deleteTransaction,
    selectedDate 
  } = useBudget();

  const [viewScope, setViewScope] = useState<'day' | 'month'>('day');
  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  const displayedList = viewScope === 'day' ? transactions : allTransactionsForMonth;

  // Format currency
  const formatAmount = (tx: Transaction) => {
    const symbol = tx.currency === 'ARS' ? '$' : 'US$';
    const sign = tx.type === 'income' ? '+' : '-';
    return `${sign}${symbol} ${new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 2,
    }).format(tx.amount)}`;
  };

  const getCategory = (catId: string) => {
    return categories.find((c) => c.id === catId);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 mt-3 mb-12">
      {/* Header bar of the list */}
      <div className="flex items-center justify-between mb-2 px-1">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white"
        >
          <span>Movimientos Registrados</span>
          <span className="text-[11px] bg-surfaceHighlight px-2 py-0.5 rounded-full text-slate-400 font-mono">
            {displayedList.length}
          </span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          )}
        </button>

        {/* Day / Month Scope Switcher */}
        <div className="flex items-center bg-surface p-0.5 rounded-lg border border-surfaceBorder text-[11px]">
          <button
            onClick={() => setViewScope('day')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              viewScope === 'day'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Día
          </button>
          <button
            onClick={() => setViewScope('month')}
            className={`px-2 py-0.5 rounded-md transition-all ${
              viewScope === 'month'
                ? 'bg-indigo-600 text-white font-medium'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Collapsible List Container */}
      {isExpanded && (
        <div className="flex flex-col gap-1.5">
          {displayedList.length === 0 ? (
            <div className="bg-surface/50 border border-surfaceBorder/60 rounded-2xl p-6 text-center flex flex-col items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-400/80" />
              <p className="text-xs text-slate-400">
                {viewScope === 'day'
                  ? `No hay registros para el ${selectedDate}.`
                  : 'No hay registros en este mes todavía.'}
              </p>
              <span className="text-[11px] text-slate-500">
                Escribe un monto arriba y toca una categoría para comenzar.
              </span>
            </div>
          ) : (
            displayedList.map((tx) => {
              const cat = getCategory(tx.categoryId);
              const isIncome = tx.type === 'income';

              return (
                <div
                  key={tx.id}
                  className="bg-surface/90 border border-surfaceBorder/70 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-sm hover:border-slate-600 transition-all"
                >
                  {/* Category icon and info */}
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat?.color || '#94A3B8'}25`,
                        color: cat?.color || '#94A3B8',
                      }}
                    >
                      <CategoryIcon name={cat?.icon || 'HelpCircle'} className="w-4 h-4" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="text-xs font-semibold text-white truncate">
                          {cat?.name || 'Otro'}
                        </span>
                        {tx.subTag && (
                          <span className="text-[10px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-1.5 py-0.2 rounded-md font-medium shrink-0">
                            {tx.subTag}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span>{tx.date}</span>
                        {tx.note && (
                          <>
                            <span>•</span>
                            <span className="truncate italic text-slate-300">"{tx.note}"</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Amount and delete action */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-sm font-bold font-mono ${
                        isIncome ? 'text-emerald-400' : 'text-slate-100'
                      }`}
                    >
                      {formatAmount(tx)}
                    </span>

                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 active-press rounded-lg transition-colors"
                      title="Eliminar registro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
