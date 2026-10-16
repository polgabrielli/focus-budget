import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import {
  calculateDueUrgency,
  generateGoogleCalendarUrl,
  downloadIcsFile,
} from '../../services/calendarService';
import { convertAmount } from '../../services/currencyService';
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
  Pencil,
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const RemindersView: React.FC = () => {
  const {
    activeReminders,
    reminders,
    categories,
    payReminder,
    deleteReminder,
    activeCurrency,
    exchangeRate,
    openKeypad,
  } = useBudget();

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const symbol = activeCurrency === 'ARS' ? '$' : 'US$';
  const rate = exchangeRate?.venta || 1400;

  // Convert each reminder amount to activeCurrency before summing
  const totalPendingAmount = activeReminders.reduce(
    (sum, r) => sum + convertAmount(r.amount, r.currency, activeCurrency, rate),
    0
  );

  const completedReminders = reminders.filter((r) => r.status === 'paid' && !r.deletedAt);

  const handlePay = async (reminder: Reminder) => {
    await payReminder(reminder.id);

    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(15);
      }
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        confetti({
          particleCount: 20,
          spread: 55,
          origin: { y: 0.4 },
          colors: ['#10B981', '#6366F1', '#3B82F6'],
        });
      }
    } catch {
      // Ignore
    }
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 flex flex-col gap-4 pb-24 animate-fadeIn">
      {/* Summary Header Card */}
      <div className="bg-surface border border-surfaceBorder rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">
                Radar de Vencimientos
              </h2>
              <p className="text-xs text-slate-400">Anticipación escalonada y alertas</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsNewModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white px-3.5 py-2 min-h-[38px] rounded-xl active-press"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Nuevo</span>
          </button>
        </div>

        {/* Total to pay converted to activeCurrency */}
        <div className="flex items-baseline justify-between pt-3 border-t border-surfaceBorder/80">
          <span className="text-xs font-medium text-slate-400">Total próximo por vencer</span>
          <div className="flex items-baseline gap-1 font-mono tabular-nums">
            <span className="text-xs font-semibold text-slate-400">{symbol}</span>
            <span className="text-xl font-extrabold text-slate-100">
              {Math.round(totalPendingAmount).toLocaleString('es-AR')}
            </span>
          </div>
        </div>
      </div>

      {/* Section Title */}
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-xs font-semibold text-slate-300">
          Próximos Vencimientos ({activeReminders.length})
        </h3>
      </div>

      <div className="flex flex-col gap-3">
        {activeReminders.length === 0 ? (
          <div className="bg-surface border border-surfaceBorder rounded-2xl p-7 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-sm font-semibold text-white">
              ¡Estás al día con todos tus pagos!
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              No tenés ningún servicio ni impuesto pendiente de vencimiento.
            </p>
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="mt-2 flex items-center gap-1.5 px-4 py-2.5 min-h-[40px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl active-press"
            >
              <Plus className="w-4 h-4" />
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
                className="bg-surface border border-surfaceBorder rounded-2xl p-4 flex flex-col gap-3 hover:border-slate-600 transition-colors"
              >
                {/* Top Row: Service info and Urgency Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                      style={{
                        backgroundColor: `${cat?.color || '#3B82F6'}20`,
                        color: cat?.color || '#3B82F6',
                      }}
                    >
                      <CategoryIcon name={cat?.icon || 'Clock'} className="w-5 h-5" />
                    </div>

                    <div className="flex flex-col min-w-0 gap-0.5">
                      <span className="text-sm font-bold text-white truncate">
                        {reminder.title}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <span>{cat?.name || 'Servicio'}</span>
                        {reminder.isRecurring && (
                          <span className="flex items-center gap-1 text-indigo-300 text-xs bg-indigo-500/15 px-2 py-0.5 rounded-md border border-indigo-500/30">
                            <Repeat className="w-3 h-3" />
                            <span>Mensual</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Urgency Badge */}
                  <span
                    className={`text-xs px-2.5 py-1 rounded-full border shrink-0 tabular-nums ${urgency.badgeClass}`}
                  >
                    {urgency.label}
                  </span>
                </div>

                {/* Middle Row: Due Date and Amount */}
                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <span className="text-xs text-slate-400 block">
                      Fecha límite
                    </span>
                    <div className="flex items-center gap-1.5 text-xs text-slate-200 font-medium tabular-nums mt-0.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{reminder.dueDate}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">
                      Monto estimado
                    </span>
                    <div className="flex items-baseline justify-end gap-1 font-mono tabular-nums mt-0.5">
                      <span className="text-xs font-semibold text-slate-400">
                        {reminderSymbol}
                      </span>
                      <span className="text-lg font-extrabold text-white">
                        {reminder.amount.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row: Calendar Sync, Delete, Edit Amount & Settle */}
                <div className="flex items-center justify-between pt-2.5 border-t border-surfaceBorder/70 gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={gCalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] text-xs font-medium text-slate-200 hover:text-white bg-surfaceHighlight/70 hover:bg-surfaceHighlight rounded-xl border border-surfaceBorder transition-colors active-press"
                      title="Sincronizar evento con Google Calendar"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Google Cal</span>
                    </a>

                    <button
                      type="button"
                      onClick={() => downloadIcsFile(reminder)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 min-h-[36px] text-xs font-medium text-slate-200 hover:text-white bg-surfaceHighlight/70 hover:bg-surfaceHighlight rounded-xl border border-surfaceBorder transition-colors active-press"
                      title="Descargar archivo .ics con alarmas escalonadas (7d, 3d, 1d, hoy)"
                    >
                      <Download className="w-3.5 h-3.5 text-indigo-400" />
                      <span>.ics</span>
                    </button>

                    {deleteConfirmId === reminder.id ? (
                      <div className="flex items-center gap-1 bg-rose-950/90 p-1 rounded-xl border border-rose-500/40 animate-fadeIn">
                        <button
                          type="button"
                          onClick={() => deleteReminder(reminder.id)}
                          className="px-2.5 py-1 min-h-[30px] text-xs font-bold text-white bg-rose-600 rounded-lg"
                        >
                          Confirmar
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          aria-label="Cancelar eliminación"
                          className="px-2 py-1 min-h-[30px] text-xs text-slate-300 hover:text-white"
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(reminder.id)}
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-400 rounded-xl active-press transition-colors"
                        title="Eliminar vencimiento"
                        aria-label="Eliminar vencimiento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => openKeypad({ reminderToPay: reminder })}
                      className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center rounded-xl bg-surfaceHighlight text-slate-300 hover:text-white border border-surfaceBorder active-press"
                      title="Ajustar monto exacto antes de pagar"
                      aria-label={`Editar monto de ${reminder.title}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePay(reminder)}
                      className="flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors active-press"
                    >
                      <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>✓ Pagar</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* History of Non-recurring Paid Bills */}
      {completedReminders.length > 0 && (
        <div className="mt-2 pt-3 border-t border-surfaceBorder/60 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white px-1 py-2"
          >
            <span>Historial de pagos saldados ({completedReminders.length})</span>
            <span className="text-xs underline">
              {showHistory ? 'Ocultar' : 'Ver historial'}
            </span>
          </button>

          {showHistory && (
            <div className="flex flex-col gap-2 animate-fadeIn">
              {completedReminders.map((r) => (
                <div
                  key={r.id}
                  className="bg-surface/70 border border-surfaceBorder rounded-2xl p-3 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-slate-200">{r.title}</span>
                  </div>
                  <span className="font-mono tabular-nums font-bold text-slate-300">
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
