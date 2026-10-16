import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { calculateDueUrgency } from '../../services/calendarService';
import { CategoryIcon } from '../Common/CategoryIcon';
import { type Reminder } from '../../types';
import { Check, Clock, ChevronRight, Pencil } from 'lucide-react';
import confetti from 'canvas-confetti';

export const RadarWidget: React.FC = () => {
  const { activeReminders, categories, payReminder, setActiveView, openKeypad } = useBudget();
  const [payingId, setPayingId] = useState<string | null>(null);

  if (activeReminders.length === 0) {
    return null;
  }

  const handleQuickPay = async (reminder: Reminder) => {
    setPayingId(reminder.id);
    try {
      await payReminder(reminder.id);

      if ('vibrate' in navigator) {
        navigator.vibrate(15);
      }
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        confetti({
          particleCount: 18,
          spread: 50,
          origin: { y: 0.3 },
          colors: ['#10B981', '#F59E0B', '#3B82F6'],
        });
      }
    } finally {
      setPayingId(null);
    }
  };

  return (
    <section className="w-full max-w-md mx-auto px-4 mt-1 mb-2 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 px-0.5">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-400" />
          <h2 className="text-xs font-semibold text-slate-300">
            Radar de Vencimientos ({activeReminders.length})
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setActiveView('reminders')}
          className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-0.5 py-1 px-1.5 rounded-lg active-press"
        >
          <span>Ver todos</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Horizontal Scrollable Carousel */}
      <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x">
        {activeReminders.slice(0, 5).map((reminder) => {
          const cat = categories.find((c) => c.id === reminder.categoryId);
          const urgency = calculateDueUrgency(reminder.dueDate);
          const symbol = reminder.currency === 'ARS' ? '$' : 'US$';

          return (
            <div
              key={reminder.id}
              className="snap-start shrink-0 w-64 bg-surface border border-surfaceBorder rounded-2xl p-3.5 flex flex-col justify-between hover:border-slate-600 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
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
                    <span className="text-xs text-slate-400 truncate">
                      {cat?.name || 'Servicio'}
                    </span>
                  </div>
                </div>

                {/* Urgency Badge */}
                <span
                  className={`text-xs px-2 py-0.5 rounded-full border shrink-0 tabular-nums ${urgency.badgeClass}`}
                >
                  {urgency.label}
                </span>
              </div>

              {/* Amount and Actions */}
              <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-surfaceBorder/70">
                <div className="flex items-baseline gap-1 font-mono tabular-nums">
                  <span className="text-xs font-semibold text-slate-400">{symbol}</span>
                  <span className="text-base font-extrabold text-white">
                    {reminder.amount.toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => openKeypad({ reminderToPay: reminder })}
                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl bg-surfaceHighlight text-slate-300 hover:text-white border border-surfaceBorder active-press"
                    title="Editar monto antes de pagar"
                    aria-label={`Editar monto de ${reminder.title}`}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleQuickPay(reminder)}
                    disabled={payingId === reminder.id}
                    className="flex items-center gap-1 px-3 py-1.5 min-h-[36px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl transition-colors active-press"
                    title="Pagar y asentar en gastos inmediatamente"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Pagar</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
