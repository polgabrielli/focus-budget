import React, { useState, useEffect } from 'react';
import { type Commitment } from '../../types';
import { useBudget } from '../../context/BudgetContext';
import { X, Check, HandCoins, Calendar } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PayCommitmentModalProps {
  commitment: Commitment;
  onClose: () => void;
}

export const PayCommitmentModal: React.FC<PayCommitmentModalProps> = ({
  commitment,
  onClose,
}) => {
  const { payCommitment, selectedDate } = useBudget();
  const isDebt = commitment.type === 'debt';
  const symbol = commitment.currency === 'ARS' ? '$' : 'US$';

  const remaining = Math.max(0, commitment.totalAmount - commitment.paidAmount);

  const suggestedAmount = commitment.installmentsTotal
    ? Math.min(remaining, Math.round(commitment.totalAmount / commitment.installmentsTotal))
    : remaining;

  const [amountStr, setAmountStr] = useState<string>(suggestedAmount.toString());
  const [note, setNote] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(selectedDate);

  const parsedAmount = parseFloat(amountStr.replace(',', '.')) || 0;
  const nextRemaining = Math.max(0, remaining - parsedAmount);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedAmount <= 0) return;

    await payCommitment({
      commitmentId: commitment.id,
      amount: parsedAmount,
      note: note.trim() || undefined,
      date: paymentDate,
    });

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
          particleCount: 25,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#10B981', '#6366F1', '#3B82F6'],
        });
      }
    } catch {
      // Ignore
    }

    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isDebt ? 'Pagar Cuota / Saldo' : 'Registrar Cobro'}
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-surfaceBorder rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto animate-sheetUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surfaceBorder/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <HandCoins className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {isDebt ? 'Pagar Cuota / Saldo' : 'Registrar Cobro'}
              </h2>
              <p className="text-xs text-slate-400">
                {commitment.title} • {commitment.counterpart}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl active-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current status summary */}
        <div className="bg-surfaceElevated border border-surfaceBorder rounded-2xl p-3.5 flex items-center justify-between text-xs tabular-nums">
          <div>
            <span className="text-slate-400 block text-xs">
              {isDebt ? 'Resta pagar' : 'Resta cobrar'}
            </span>
            <span className="font-bold text-white font-mono text-sm">
              {symbol} {remaining.toLocaleString('es-AR')}
            </span>
          </div>

          {commitment.installmentsTotal && (
            <div className="text-right">
              <span className="text-slate-400 block text-xs">Cuotas</span>
              <span className="font-semibold text-indigo-300">
                {Math.min(commitment.installmentsTotal, (commitment.installmentsPaid || 0) + 1)} de{' '}
                {commitment.installmentsTotal}
              </span>
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Amount input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Monto a {isDebt ? 'pagar' : 'cobrar'} ({symbol})
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-base">
                {symbol}
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="any"
                min="0.01"
                max={remaining}
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full bg-background border border-surfaceBorder rounded-2xl pl-10 pr-4 py-3 text-lg font-mono tabular-nums font-bold text-white focus:outline-none focus:border-indigo-500"
                autoFocus
                required
              />
            </div>
            {parsedAmount > 0 && (
              <span className="text-xs text-slate-400 px-1 tabular-nums">
                Saldo restante:{' '}
                <strong className={nextRemaining === 0 ? 'text-emerald-400' : 'text-slate-200'}>
                  {symbol} {nextRemaining.toLocaleString('es-AR')}
                  {nextRemaining === 0 ? ' (¡Saldado!)' : ''}
                </strong>
              </span>
            )}
          </div>

          {/* Date Picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Fecha del {isDebt ? 'pago' : 'cobro'}</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              className="w-full bg-background border border-surfaceBorder rounded-xl px-3.5 py-2.5 min-h-[42px] text-xs text-white tabular-nums focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Optional Note */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-300">
              Nota o comprobante (opcional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={
                isDebt ? 'Ej: Transferencia Banco Galicia...' : 'Ej: Efectivo recibido...'
              }
              className="w-full bg-background border border-surfaceBorder rounded-xl px-3.5 py-2.5 min-h-[42px] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={parsedAmount <= 0}
              className={`w-full py-3.5 min-h-[48px] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors active-press ${
                parsedAmount > 0
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50'
                  : 'bg-surfaceHighlight text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>
                {isDebt
                  ? `Pagar ${symbol} ${parsedAmount.toLocaleString('es-AR')} y Asentar en Gastos`
                  : `Cobrar ${symbol} ${parsedAmount.toLocaleString('es-AR')} y Asentar en Ingresos`}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
