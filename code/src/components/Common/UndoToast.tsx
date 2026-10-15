import React, { useEffect, useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { RotateCcw, X, CheckCircle2 } from 'lucide-react';

export const UndoToast: React.FC = () => {
  const { 
    isUndoVisible, 
    lastAddedTransaction, 
    undoLastTransaction, 
    dismissUndo, 
    categories 
  } = useBudget();
  
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isUndoVisible) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const duration = 5000; // 5 seconds

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isUndoVisible]);

  if (!isUndoVisible || !lastAddedTransaction) {
    return null;
  }

  const category = categories.find((c) => c.id === lastAddedTransaction.categoryId);
  const currencySymbol = lastAddedTransaction.currency === 'ARS' ? '$' : 'US$';

  return (
    <div className="fixed bottom-6 left-4 right-4 max-w-md mx-auto z-50 animate-slideUp">
      <div className="bg-slate-900/95 border border-slate-700/80 rounded-2xl p-3.5 shadow-2xl backdrop-blur-xl flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex flex-col truncate">
              <span className="text-xs text-slate-300">
                Guardado: <strong className="text-white font-semibold">{currencySymbol} {lastAddedTransaction.amount}</strong>
              </span>
              <span className="text-[11px] text-slate-400 truncate">
                {category?.name || 'Movimiento'} {lastAddedTransaction.subTag ? `(${lastAddedTransaction.subTag})` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Big Undo Button */}
            <button
              onClick={undoLastTransaction}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl active-press shadow-md"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Deshacer</span>
            </button>

            {/* Dismiss */}
            <button
              onClick={dismissUndo}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg active-press"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 5-second countdown progress bar */}
        <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-75 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
