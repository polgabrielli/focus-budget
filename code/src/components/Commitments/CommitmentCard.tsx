import React, { useState } from 'react';
import { type Commitment } from '../../types';
import { useBudget } from '../../context/BudgetContext';
import { PayCommitmentModal } from './PayCommitmentModal';
import {
  CheckCircle2,
  Trash2,
  Calendar,
  Layers,
  ArrowRight,
  HandCoins,
} from 'lucide-react';

interface CommitmentCardProps {
  commitment: Commitment;
}

export const CommitmentCard: React.FC<CommitmentCardProps> = ({ commitment }) => {
  const { deleteCommitment } = useBudget();
  const [isPayOpen, setIsPayOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isDebt = commitment.type === 'debt';
  const symbol = commitment.currency === 'ARS' ? '$' : 'US$';
  const remaining = Math.max(0, commitment.totalAmount - commitment.paidAmount);
  const percentPaid = Math.min(
    100,
    Math.round((commitment.paidAmount / commitment.totalAmount) * 100)
  );

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <>
      <div
        className={`p-4 rounded-2xl border transition-colors flex flex-col gap-3 ${
          commitment.isCompleted
            ? 'bg-surface/60 border-surfaceBorder opacity-80'
            : 'bg-surface border-surfaceBorder hover:border-slate-600'
        }`}
      >
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                isDebt
                  ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                  : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
              }`}
            >
              {commitment.counterpart.charAt(0).toUpperCase()}
            </div>

            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">
                {commitment.title}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {commitment.counterpart}
              </span>
            </div>
          </div>

          {/* Status or Delete */}
          <div className="flex items-center gap-1 shrink-0">
            {commitment.isCompleted ? (
              <span className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saldado</span>
              </span>
            ) : showDeleteConfirm ? (
              <div className="flex items-center gap-1 bg-rose-950/90 p-1 rounded-xl border border-rose-500/40 animate-fadeIn">
                <button
                  type="button"
                  onClick={() => deleteCommitment(commitment.id)}
                  className="px-2.5 py-1 min-h-[30px] text-xs font-bold text-white bg-rose-600 rounded-lg active-press"
                >
                  Confirmar
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  aria-label="Cancelar eliminación"
                  className="px-2 py-1 min-h-[30px] text-xs text-slate-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-slate-400 hover:text-rose-400 rounded-xl transition-colors active-press"
                title="Eliminar compromiso"
                aria-label="Eliminar compromiso"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Amount & Progress details */}
        <div className="flex items-baseline justify-between pt-1 tabular-nums">
          <div>
            <span className="text-xs text-slate-400 block">
              {commitment.isCompleted
                ? 'Total liquidado'
                : isDebt
                ? 'Resta pagar'
                : 'Resta cobrar'}
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xs font-semibold text-slate-400">{symbol}</span>
              <span className="text-xl font-extrabold font-mono tracking-tight text-slate-100">
                {formatAmount(commitment.isCompleted ? commitment.totalAmount : remaining)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-400 block">
              Progreso
            </span>
            <span className="text-xs font-bold font-mono text-emerald-400 mt-0.5 block">
              {percentPaid}% ({symbol} {formatAmount(commitment.paidAmount)})
            </span>
          </div>
        </div>

        {/* Clean Progress Bar */}
        <div className="w-full h-2 bg-background rounded-full overflow-hidden border border-surfaceBorder/80">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              commitment.isCompleted
                ? 'bg-emerald-500'
                : isDebt
                ? 'bg-emerald-500'
                : 'bg-indigo-500'
            }`}
            style={{ width: `${Math.max(4, percentPaid)}%` }}
          />
        </div>

        {/* Footer: Installments info & Quick Pay action */}
        <div className="flex items-center justify-between pt-1 text-xs gap-2 flex-wrap">
          <div className="flex items-center gap-3 text-slate-400 text-xs tabular-nums">
            {commitment.installmentsTotal && (
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  Cuota {commitment.installmentsPaid || 0}/{commitment.installmentsTotal}
                </span>
              </span>
            )}

            {commitment.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Vence: {commitment.dueDate}</span>
              </span>
            )}
          </div>

          {!commitment.isCompleted && (
            <button
              type="button"
              onClick={() => setIsPayOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 min-h-[38px] font-bold text-xs rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white transition-colors active-press ml-auto"
            >
              <HandCoins className="w-3.5 h-3.5" />
              <span>{isDebt ? 'Pagar Cuota' : 'Registrar Cobro'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Pay Modal */}
      {isPayOpen && (
        <PayCommitmentModal
          commitment={commitment}
          onClose={() => setIsPayOpen(false)}
        />
      )}
    </>
  );
};
