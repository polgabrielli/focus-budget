import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { PieChart, HandCoins, Clock } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeView, setActiveView, commitments, activeReminders } = useBudget();

  const activeDebtsCount = commitments.filter((c) => c.type === 'debt' && !c.isCompleted).length;
  const activeRemindersCount = activeReminders.length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/85 backdrop-blur-xl border-t border-surfaceBorder/80 px-4 pt-2 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around py-1">
        {/* Tab 1: Registro (Dial & Teclado) */}
        <button
          onClick={() => setActiveView('dial')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all active-press ${
            activeView === 'dial'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all ${
            activeView === 'dial' ? 'bg-indigo-600/20 text-indigo-400' : ''
          }`}>
            <PieChart className="w-5 h-5" />
          </div>
          <span className="text-[11px] tracking-tight">Registro</span>
        </button>

        {/* Tab 2: Radar de Vencimientos */}
        <button
          onClick={() => setActiveView('reminders')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all active-press relative ${
            activeView === 'reminders'
              ? 'text-amber-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all relative ${
            activeView === 'reminders' ? 'bg-amber-500/20 text-amber-400' : ''
          }`}>
            <Clock className="w-5 h-5" />
            {activeRemindersCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-amber-500 text-slate-950 rounded-full text-[9px] font-mono font-bold flex items-center justify-center ring-2 ring-background">
                {activeRemindersCount}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight">Radar</span>
        </button>

        {/* Tab 3: Compromisos (Préstamos y Deudas) */}
        <button
          onClick={() => setActiveView('commitments')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-2xl transition-all active-press relative ${
            activeView === 'commitments'
              ? 'text-indigo-400 font-bold'
              : 'text-slate-400 hover:text-slate-200 font-medium'
          }`}
        >
          <div className={`p-1.5 rounded-xl transition-all relative ${
            activeView === 'commitments' ? 'bg-indigo-600/20 text-indigo-400' : ''
          }`}>
            <HandCoins className="w-5 h-5" />
            {activeDebtsCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-rose-500 text-white rounded-full text-[9px] font-mono font-bold flex items-center justify-center ring-2 ring-background">
                {activeDebtsCount}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight">Compromisos</span>
        </button>
      </div>
    </nav>
  );
};
