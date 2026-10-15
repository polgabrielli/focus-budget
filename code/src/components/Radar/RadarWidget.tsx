import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { calculateDueUrgency } from '../../services/calendarService';
import { CategoryIcon } from '../Common/CategoryIcon';
import { type Reminder } from '../../types';
import { Check, Clock, ChevronRight } from 'lucide-react';
import confetti from 'canvas-confetti';

export const RadarWidget: React.FC = () => {
  const { activeReminders, categories, payReminder, setActiveView } = useBudget();
  const [payingId, setPayingId] = useState<string | null>(null);

  if (activeReminders.length === 0) {
    return null; // Keep screen clean when all caught up!
  }

  const handleQuickPay = async (reminder: Reminder) => {
    setPayingId(reminder.id);
    try {
      await payReminder(reminder.id);

      if ('vibrate' in navigator) {
        navigator.vibrate([20, 40]);
      }
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.3 },
        colors: ['#10B981', '#F59E0B', '#3B82F6'],
      });
    } finally {
      setPayingId(null);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 mt-1 mb-2 animate-fadeIn">
      {/* Title Header */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
            Radar de Vencimientos ({activeReminders.length})
          </span>
        </div>
        <button
          onClick={() => setActiveView('reminders')}
          className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 active-press"
        >
          <span>Ver todos</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>

      {/* Horizontal Scrollable Carousel */}
      <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x">
        {activeReminders.slice(0, 5).map((reminder) => {
          const cat = categories.find((c) => c.id === reminder.categoryId);
          const urgency = calculateDueUrgency(reminder.dueDate);
          const symbol = reminder.currency === 'ARS' ? '$' : 'US$';

          return (
            <div
              key={reminder.id}
              className="snap-start shrink-0 w-64 bg-surface/90 border border-surfaceBorder rounded-2xl p-3 flex flex-col justify-between shadow-md relative overflow-hidden group hover:border-slate-500 transition-all"
            >
              {/* Category color top bar */}
              <div
                className="absolute top-0 left-0 right-0 h-1"
                style={{ backgroundColor: cat?.color || '#3B82F6' }}
              />

              <div className="flex items-start justify-between gap-2 mt-0.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: `${cat?.color || '#3B82F6'}20`,
                      color: cat?.color || '#3B82F6',
                    }}
                  >
                    <CategoryIcon name={cat?.icon || 'Clock'} className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-xs font-bold text-white truncate">
                      {reminder.title}
                    </span>
                    <span className="text-[10px] text-slate-400 truncate">
                      {cat?.name || 'Servicio'}
                    </span>
                  </div>
                </div>

                {/* Urgency Semáforo Badge */}
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full border shrink-0 ${urgency.badgeClass}`}
                >
                  {urgency.label}
                </span>
              </div>

              {/* Amount and 1-Touch Settle Button */}
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-surfaceBorder/60">
                <div className="flex items-baseline gap-0.5 font-mono">
                  <span className="text-xs font-semibold text-slate-400">{symbol}</span>
                  <span className="text-base font-black text-white">
                    {reminder.amount.toLocaleString('es-AR')}
                  </span>
                </div>

                <button
                  onClick={() => handleQuickPay(reminder)}
                  disabled={payingId === reminder.id}
                  className="flex items-center gap-1 px-3 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-sm transition-all active-press"
                  title="Pagar y asentar en gastos inmediatamente"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Pagar</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
