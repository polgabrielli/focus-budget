import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { type CommitmentType } from '../../types';
import { FreedomProgressBar } from './FreedomProgressBar';
import { CommitmentCard } from './CommitmentCard';
import { NewCommitmentModal } from './NewCommitmentModal';
import { Plus, CheckCircle, Sparkles } from 'lucide-react';

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
      <div className="grid grid-cols-2 p-1 bg-surface/90 border border-surfaceBorder rounded-2xl gap-1 shadow-md">
        <button
          onClick={() => setActiveTab('debt')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active-press ${
            activeTab === 'debt'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Debo (Pasivos)</span>
          {totalDebtsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px] font-mono">
              {totalDebtsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('credit')}
          className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all active-press ${
            activeTab === 'credit'
              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span>Me deben (Activos)</span>
          {totalCreditsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[10px] font-mono">
              {totalCreditsCount}
            </span>
          )}
        </button>
      </div>

      {/* Freedom & Progress Bar */}
      <FreedomProgressBar type={activeTab} />

      {/* Header of Active Commitments */}
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          {activeTab === 'debt' ? 'Compromisos por Pagar' : 'Préstamos por Cobrar'}
        </span>
        <button
          onClick={() => setIsNewModalOpen(true)}
          className="flex items-center gap-1 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2.5 py-1 rounded-xl border border-indigo-500/20 active-press"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Nuevo</span>
        </button>
      </div>

      {/* List of Active Commitments */}
      <div className="flex flex-col gap-3">
        {activeCommitments.length === 0 ? (
          <div className="bg-surface/50 border border-surfaceBorder/60 rounded-3xl p-8 text-center flex flex-col items-center justify-center gap-2.5 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-surfaceHighlight flex items-center justify-center text-slate-400">
              <Sparkles className="w-6 h-6 text-emerald-400" />
            </div>
            <p className="text-sm font-semibold text-white">
              {activeTab === 'debt'
                ? '¡No tienes deudas activas registradas!'
                : 'No tienes préstamos pendientes de cobro.'}
            </p>
            <p className="text-xs text-slate-400 max-w-xs">
              {activeTab === 'debt'
                ? 'Disfruta de tu tranquilidad mental o registra un compromiso si necesitas hacer un seguimiento ordenado.'
                : 'Si prestas dinero a amigos o familiares, regístralo aquí para no olvidarte de cobrarlo con diplomacia.'}
            </p>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="mt-2 flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow-md active-press"
            >
              <Plus className="w-3.5 h-3.5" />
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
        <div className="mt-2 pt-2 border-t border-surfaceBorder/50 flex flex-col gap-2">
          <button
            onClick={() => setShowCompleted(!showCompleted)}
            className="flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-white px-1 py-1"
          >
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Compromisos ya saldados ({completedCommitments.length})</span>
            </div>
            <span className="text-[11px] underline">
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
