import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { 
  calculateDueUrgency, 
  generateGoogleCalendarUrl, 
  downloadIcsFile 
} from '../../services/calendarService';
import { CategoryIcon } from '../Common/CategoryIcon';
import { NewReminderModal } from './NewReminderModal';
import { type Reminder } from '../../types';
import { 
  Clock, 
  Plus, 
  Check, 
  Calendar, 
  Download, 
  Trash2, 
  Repeat, 
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const RemindersView: React.FC = () => {
  const { 
    activeReminders, 
    reminders, 
    categories, 
    payReminder, 
    deleteReminder, 
    activeCurrency 
  } = useBudget();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const symbol = activeCurrency === 'ARS' ? '$' : 'US$';

  // Total pending amount for upcoming bills
  const totalPendingAmount = activeReminders.reduce((sum, r) => sum + r.amount, 0);

  const completedReminders = reminders.filter((r) => r.status === 'paid');

  const handlePay = async (reminder: Reminder) => {
    await payReminder(reminder.id);

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate([20, 40]);
      }
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.4 },
        colors: ['#10B981', '#F59E0B', '#3B82F6'],
      });
    } catch {
      // Ignore
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 flex flex-col gap-4 pb-24 animate-fadeIn">
      {/* Top Banner: Upcoming Month Total */}
      <div className="bg-gradient-to-br from-slate-900 via-amber-950/30 to-slate-900 border border-amber-500/30 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Radar de Vencimientos
              </h2>
              <p className="text-[11px] text-slate-400">Anticipación escalonada y alertas</p>
            </div>
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1 text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl shadow-md active-press"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Total to pay */}
        <div className="flex items-baseline justify-between pt-2 border-t border-slate-800">
          <span className="text-xs text-slate-400">Total próximo por vencer</span>
          <div className="flex items-baseline gap-1 font-mono">
            <span className="text-xs font-semibold text-slate-400">{symbol}</span>
            <span className="text-xl font-black text-amber-300">
              {totalPendingAmount.toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {/* Active Reminders List */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Próximos Vencimientos ({activeReminders.length})
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {activeReminders.length === 0 ? (
          <div className="bg-surface/50 border border-surfaceBorder/60 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2 shadow-sm">
            <Sparkles className="w-8 h-8 text-emerald-400" />
            <p className="text-sm font-semibold text-white">
              ¡Estás al día con todos tus pagos!
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              No tienes ningún servicio ni impuesto pendiente de vencimiento.
            </p>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl active-press"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Añadir vencimiento</span>
            </button>
          </div>
        ) : (
          activeReminders.map((reminder) => {
            const cat = categories.find((c) => c.id === reminder.categoryId);
            const urgency = calculateDueUrgency(reminder.dueDate);
            const reminderSymbol = reminder.currency === 'ARS' ? '$' : 'US$';
            const gCalUrl = generateGoogleCalendarUrl(reminder);

            return (
              <div
                key={reminder.id}
                className="bg-surface/90 border border-surfaceBorder rounded-3xl p-4 flex flex-col gap-3 shadow-md relative overflow-hidden group hover:border-slate-500 transition-all"
              >
                {/* Category color indicator */}
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: cat?.color || '#3B82F6' }}
                />

                {/* Top Row: Service info and Semáforo Badge */}
                <div className="flex items-start justify-between gap-2 mt-0.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-inner"
                      style={{
                        backgroundColor: `${cat?.color || '#3B82F6'}20`,
                        color: cat?.color || '#3B82F6',
                      }}
                    >
                      <CategoryIcon name={cat?.icon || 'Clock'} className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-bold text-white truncate">
                        {reminder.title}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{cat?.name || 'Servicio'}</span>
                        {reminder.isRecurring && (
                          <span className="flex items-center gap-0.5 text-indigo-300 text-[10px] bg-indigo-500/10 px-1.5 py-0.2 rounded-md border border-indigo-500/20">
                            <Repeat className="w-2.5 h-2.5" />
                            <span>Mensual</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Urgency Badge */}
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded-full border shrink-0 ${urgency.badgeClass}`}
                  >
                    {urgency.label}
                  </span>
                </div>

                {/* Middle Row: Amount and Due Date */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                      Fecha Límite
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-200 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{reminder.dueDate}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                      Monto
                    </span>
                    <div className="flex items-baseline gap-0.5 font-mono">
                      <span className="text-xs font-semibold text-slate-400">
                        {reminderSymbol}
                      </span>
                      <span className="text-lg font-black text-white">
                        {reminder.amount.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Actions (1-Touch Pay, Google Calendar, .ICS, Delete) */}
                <div className="flex items-center justify-between pt-2 border-t border-surfaceBorder/60 gap-1.5">
                  <div className="flex items-center gap-1">
                    {/* Google Calendar Link */}
                    <a
                      href={gCalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-surfaceHighlight/60 hover:bg-surfaceHighlight rounded-xl border border-surfaceBorder transition-all active-press"
                      title="Sincronizar evento con Google Calendar"
                    >
                      <ExternalLink className="w-3 h-3 text-blue-400" />
                      <span>Google Cal</span>
                    </a>

                    {/* Download .ICS File */}
                    <button
                      onClick={() => downloadIcsFile(reminder)}
                      className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white bg-surfaceHighlight/60 hover:bg-surfaceHighlight rounded-xl border border-surfaceBorder transition-all active-press"
                      title="Descargar archivo .ics con alarmas escalonadas (7d, 3d, 1d, hoy)"
                    >
                      <Download className="w-3 h-3 text-emerald-400" />
                      <span>.ics</span>
                    </button>

                    {/* Delete */}
                    {deleteConfirmId === reminder.id ? (
                      <div className="flex items-center gap-1 bg-rose-950/80 p-0.5 rounded-xl border border-rose-500/40 animate-fadeIn">
                        <button
                          onClick={() => deleteReminder(reminder.id)}
                          className="px-2 py-0.5 text-[10px] font-bold text-white bg-rose-600 rounded-lg"
                        >
                          Confirmar
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1 text-[10px] text-slate-300"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(reminder.id)}
                        className="p-1 text-slate-500 hover:text-rose-400 rounded-lg active-press transition-colors"
                        title="Eliminar vencimiento"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Quick Settle Button */}
                  <button
                    onClick={() => handlePay(reminder)}
                    className="flex items-center gap-1 px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 transition-all active-press"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>✓ Pagar</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* History of Non-recurring Paid Bills */}
      {completedReminders.length > 0 && (
        <div className="mt-2 pt-2 border-t border-surfaceBorder/50 flex flex-col gap-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white px-1 py-1"
          >
            <span>Historial de pagos saldados ({completedReminders.length})</span>
            <span className="text-[11px] underline">
              {showHistory ? 'Ocultar' : 'Ver historial'}
            </span>
          </button>

          {showHistory && (
            <div className="flex flex-col gap-2 animate-fadeIn">
              {completedReminders.map((r) => (
                <div
                  key={r.id}
                  className="bg-surface/50 border border-surfaceBorder/60 rounded-2xl p-2.5 flex items-center justify-between text-xs opacity-75"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="font-semibold text-slate-200">{r.title}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-300">
                    {r.currency === 'ARS' ? '$' : 'US$'} {r.amount.toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal to add new reminder */}
      {isNewModalOpen && <NewReminderModal onClose={() => setIsNewModalOpen(false)} />}
    </div>
  );
};
