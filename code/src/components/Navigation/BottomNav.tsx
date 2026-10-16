import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { PieChart, HandCoins, Clock } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeView, setActiveView, commitments, activeReminders } = useBudget();

  const activeDebtsCount = commitments.filter((c) => c.type === 'debt' && !c.isCompleted).length;
  const activeRemindersCount = activeReminders.length;

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-md border-t border-surfaceBorder px-4 pt-1.5 pb-safe"
    >
      <div className="max-w-md mx-auto grid grid-cols-3 gap-2">
        {/* Tab 1: Registro (Dial & Historial Monefy) */}
        <button
          type="button"
          onClick={() => setActiveView('dial')}
          aria-current={activeView === 'dial' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 min-h-[52px] rounded-xl transition-colors active-press ${
            activeView === 'dial'
              ? 'text-indigo-400 font-semibold bg-surface'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <PieChart className="w-5 h-5" />
          <span className="text-xs tracking-tight">Registro</span>
        </button>

        {/* Tab 2: Radar de Vencimientos */}
        <button
          type="button"
          onClick={() => setActiveView('reminders')}
          aria-current={activeView === 'reminders' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 min-h-[52px] rounded-xl transition-colors active-press relative ${
            activeView === 'reminders'
              ? 'text-indigo-400 font-semibold bg-surface'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <Clock className="w-5 h-5" />
            {activeRemindersCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-amber-500 text-amber-950 rounded-full text-[10px] tabular-nums font-bold flex items-center justify-center ring-2 ring-background">
                {activeRemindersCount}
              </span>
            )}
          </div>
          <span className="text-xs tracking-tight">Radar</span>
        </button>

        {/* Tab 3: Compromisos (Préstamos y Deudas) */}
        <button
          type="button"
          onClick={() => setActiveView('commitments')}
          aria-current={activeView === 'commitments' ? 'page' : undefined}
          className={`flex flex-col items-center justify-center gap-1 py-1.5 min-h-[52px] rounded-xl transition-colors active-press relative ${
            activeView === 'commitments'
              ? 'text-indigo-400 font-semibold bg-surface'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className="relative">
            <HandCoins className="w-5 h-5" />
            {activeDebtsCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-surfaceHighlight text-slate-200 border border-surfaceBorder rounded-full text-[10px] tabular-nums font-semibold flex items-center justify-center ring-2 ring-background">
                {activeDebtsCount}
              </span>
            )}
          </div>
          <span className="text-xs tracking-tight">Compromisos</span>
        </button>
      </div>
    </nav>
  );
};
