import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { PieChart, HandCoins } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { activeView, setActiveView, commitments } = useBudget();

  const activeDebtsCount = commitments.filter((c) => c.type === 'debt' && !c.isCompleted).length;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background/85 backdrop-blur-xl border-t border-surfaceBorder/80 px-4 pt-2 pb-safe">
      <div className="max-w-md mx-auto flex items-center justify-around py-1">
        {/* Tab 1: Registro (Dial & Teclado) */}
        <button
          onClick={() => setActiveView('dial')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all active-press ${
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

        {/* Tab 2: Compromisos (Préstamos y Deudas) */}
        <button
          onClick={() => setActiveView('commitments')}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all active-press relative ${
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
