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
  HandCoins
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
  const percentPaid = Math.min(100, Math.round((commitment.paidAmount / commitment.totalAmount) * 100));

  const formatAmount = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <>
      <div className={`p-4 rounded-3xl border transition-all flex flex-col gap-3 shadow-md ${
        commitment.isCompleted
          ? 'bg-surface/40 border-emerald-500/30 opacity-75'
          : 'bg-surface/90 border-surfaceBorder hover:border-slate-500'
      }`}>
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            {/* Counterpart Avatar */}
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shrink-0 shadow-inner ${
              isDebt 
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' 
                : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
            }`}>
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
          <div className="flex items-center gap-1">
            {commitment.isCompleted ? (
              <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saldado</span>
              </span>
            ) : showDeleteConfirm ? (
              <div className="flex items-center gap-1 bg-rose-950/80 p-1 rounded-xl border border-rose-500/40 animate-fadeIn">
                <button
                  onClick={() => deleteCommitment(commitment.id)}
                  className="px-2 py-0.5 text-[10px] font-bold text-white bg-rose-600 rounded-lg active-press"
                >
                  Confirmar
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-1 text-[10px] text-slate-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors active-press"
                title="Eliminar compromiso"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Amount & Progress details */}
        <div className="flex items-baseline justify-between pt-1">
          <div>
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              {commitment.isCompleted ? 'Total Liquidado' : isDebt ? 'Resta pagar' : 'Resta cobrar'}
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-semibold text-slate-400">{symbol}</span>
              <span className={`text-xl font-black font-mono tracking-tight ${
                commitment.isCompleted ? 'text-emerald-400' : isDebt ? 'text-rose-400' : 'text-blue-400'
              }`}>
                {formatAmount(commitment.isCompleted ? commitment.totalAmount : remaining)}
              </span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
              Progreso
            </span>
            <span className="text-xs font-bold font-mono text-emerald-400">
              {percentPaid}% ({symbol} {formatAmount(commitment.paidAmount)})
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              commitment.isCompleted
                ? 'bg-emerald-400'
                : isDebt
                ? 'bg-gradient-to-r from-indigo-500 to-emerald-400'
                : 'bg-gradient-to-r from-cyan-500 to-blue-400'
            }`}
            style={{ width: `${Math.max(3, percentPaid)}%` }}
          />
        </div>

        {/* Footer: Installments info & Quick Pay action */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <div className="flex items-center gap-3 text-slate-400 text-[11px]">
            {commitment.installmentsTotal && (
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3 text-indigo-400" />
                <span>
                  Cuota {commitment.installmentsPaid || 0}/{commitment.installmentsTotal}
                </span>
              </span>
            )}

            {commitment.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-amber-400" />
                <span>Vence: {commitment.dueDate}</span>
              </span>
            )}
          </div>

          {!commitment.isCompleted && (
            <button
              onClick={() => setIsPayOpen(true)}
              className={`flex items-center gap-1.5 px-3 py-1.5 font-bold text-xs rounded-xl shadow-md transition-all active-press ${
                isDebt
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-blue-500 hover:bg-blue-400 text-white shadow-blue-500/20'
              }`}
            >
              <HandCoins className="w-3.5 h-3.5" />
              <span>{isDebt ? 'Pagar Cuota' : 'Registrar Cobro'}</span>
              <ArrowRight className="w-3 h-3" />
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
