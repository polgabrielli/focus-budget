import React, { useEffect, useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { RotateCcw, X, CheckCircle2 } from 'lucide-react';

export const UndoToast: React.FC = () => {
  const {
    isUndoVisible,
    lastAddedTransaction,
    lastUndoAction,
    undoLastTransaction,
    dismissUndo,
    categories,
  } = useBudget();

  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!isUndoVisible) {
      setProgress(100);
      return;
    }

    const startTime = Date.now();
    const duration = 5000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isUndoVisible, lastAddedTransaction]);

  if (!isUndoVisible || !lastAddedTransaction) {
    return null;
  }

  const category = categories.find((c) => c.id === lastAddedTransaction.categoryId);
  const currencySymbol = lastAddedTransaction.currency === 'ARS' ? '$' : 'US$';

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-4 right-4 max-w-md mx-auto z-40 animate-slideUp"
    >
      <div className="bg-surfaceElevated border border-surfaceBorder rounded-2xl p-3.5 shadow-2xl flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div className="flex flex-col truncate">
              <span className="text-xs text-slate-300 tabular-nums">
                {lastUndoAction === 'delete' ? 'Eliminado:' : 'Guardado:'}{' '}
                <strong className="text-white font-semibold">
                  {currencySymbol} {lastAddedTransaction.amount}
                </strong>
              </span>
              <span className="text-xs text-slate-400 truncate">
                {category?.name || 'Movimiento'}{' '}
                {lastAddedTransaction.subTag ? `(${lastAddedTransaction.subTag})` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={undoLastTransaction}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] bg-amber-500 hover:bg-amber-400 text-amber-950 font-bold text-xs rounded-xl active-press"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Deshacer</span>
            </button>

            <button
              type="button"
              onClick={dismissUndo}
              aria-label="Cerrar notificación"
              className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl active-press"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="w-full h-1 bg-background rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-400 transition-all duration-75 ease-linear rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};
