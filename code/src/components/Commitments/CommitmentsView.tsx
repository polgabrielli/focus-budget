import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { type CommitmentType } from '../../types';
import { FreedomProgressBar } from './FreedomProgressBar';
import { CommitmentCard } from './CommitmentCard';
import { NewCommitmentModal } from './NewCommitmentModal';
import { Plus, CheckCircle } from 'lucide-react';

export const CommitmentsView: React.FC = () => {
  const { commitments } = useBudget();
  const [activeTab, setActiveTab] = useState<CommitmentType>('debt');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeCommitments = commitments.filter(
    (c) => c.type === activeTab && !c.isCompleted
  );

  const completedCommitments = commitments.filter(
    (c) => c.type === activeTab && c.isCompleted
  );

  const totalDebtsCount = commitments.filter((c) => c.type === 'debt' && !c.isCompleted).length;
  const totalCreditsCount = commitments.filter((c) => c.type === 'credit' && !c.isCompleted).length;

  return (
    <div className="w-full max-w-md mx-auto px-4 flex flex-col gap-4 pb-24">
      {/* Tab Switcher: Debo vs Me deben */}
      <div className="grid grid-cols-2 p-1 bg-surface border border-surfaceBorder rounded-2xl gap-1">
        <button
          type="button"
          onClick={() => setActiveTab('debt')}
          className={`py-2.5 px-3 min-h-[42px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors active-press ${
            activeTab === 'debt'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Debo</span>
          {totalDebtsCount > 0 && (
            <span className="px-2 py-0.5 bg-black/25 text-white rounded-full text-xs tabular-nums">
              {totalDebtsCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('credit')}
          className={`py-2.5 px-3 min-h-[42px] rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-colors active-press ${
            activeTab === 'credit'
              ? 'bg-indigo-600 text-white'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>Me deben</span>
          {totalCreditsCount > 0 && (
            <span className="px-2 py-0.5 bg-black/25 text-white rounded-full text-xs tabular-nums">
              {totalCreditsCount}
            </span>
          )}
        </button>
      </div>

      {/* Freedom & Progress Bar */}
      <FreedomProgressBar type={activeTab} />

      {/* Header of Active Commitments */}
      <div className="flex items-center justify-between px-0.5">
        <h3 className="text-xs font-semibold text-slate-300">
          {activeTab === 'debt' ? 'Compromisos por Pagar' : 'Préstamos por Cobrar'}
        </h3>
        <button
          type="button"
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 px-3.5 py-2 min-h-[38px] rounded-xl active-press"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Nuevo</span>
        </button>
      </div>

      {/* List of Active Commitments */}
      <div className="flex flex-col gap-3">
        {activeCommitments.length === 0 ? (
          <div className="bg-surface border border-surfaceBorder rounded-2xl p-7 text-center flex flex-col items-center justify-center gap-2">
            <p className="text-sm font-semibold text-white">
              {activeTab === 'debt'
                ? '¡No tenés deudas activas registradas!'
                : 'No tenés préstamos pendientes de cobro.'}
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              {activeTab === 'debt'
                ? 'Disfrutá de tu tranquilidad o registrá un compromiso para llevar el seguimiento de cuotas.'
                : 'Si prestás dinero a amigos o familiares, registralo acá para llevar la cuenta clara.'}
            </p>
            <button
              type="button"
              onClick={() => setIsNewModalOpen(true)}
              className="mt-2 flex items-center gap-1.5 px-4 py-2.5 min-h-[40px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl active-press"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar compromiso</span>
            </button>
          </div>
        ) : (
          activeCommitments.map((commitment) => (
            <CommitmentCard key={commitment.id} commitment={commitment} />
          ))
        )}
      </div>

      {/* Completed Section (Accordion) */}
      {completedCommitments.length > 0 && (
        <div className="mt-2 pt-3 border-t border-surfaceBorder/60 flex flex-col gap-2">
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white px-1 py-2"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Compromisos ya saldados ({completedCommitments.length})</span>
            </div>
            <span className="text-xs underline">
              {showCompleted ? 'Ocultar' : 'Ver historial'}
            </span>
          </button>

          {showCompleted && (
            <div className="flex flex-col gap-3 animate-fadeIn">
              {completedCommitments.map((commitment) => (
                <CommitmentCard key={commitment.id} commitment={commitment} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* New Commitment Modal */}
      {isNewModalOpen && (
        <NewCommitmentModal
          initialType={activeTab}
          onClose={() => setIsNewModalOpen(false)}
        />
      )}
    </div>
  );
};
