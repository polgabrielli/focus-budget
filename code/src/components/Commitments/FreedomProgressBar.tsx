import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { ShieldCheck, Sparkles, TrendingUp } from 'lucide-react';

interface FreedomProgressBarProps {
  type: 'debt' | 'credit';
}

export const FreedomProgressBar: React.FC<FreedomProgressBarProps> = ({ type }) => {
  const { commitmentsSummary, activeCurrency } = useBudget();
  const symbol = activeCurrency === 'ARS' ? '$' : 'US$';

  const formatNumber = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  if (type === 'debt') {
    const { totalDebtRemaining, totalDebtPaid, totalDebtOriginal, freedomPercentage } = commitmentsSummary;
    const roundedPercent = Math.round(freedomPercentage);

    return (
      <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-emerald-950/40 border border-indigo-500/30 rounded-3xl p-4 shadow-xl">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                Barra de Libertad
              </h3>
              <p className="text-[11px] text-slate-400">Progreso positivo de desahogo</p>
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-black text-emerald-400 font-mono">
              {totalDebtOriginal > 0 ? `${roundedPercent}%` : '100%'}
            </span>
            <span className="text-xs font-semibold text-emerald-500">libre</span>
          </div>
        </div>

        {/* Dynamic Multi-segment or Solid Positive Progress Bar */}
        <div className="w-full h-3.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60 mb-2.5">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-700 ease-out shadow-sm"
            style={{ width: `${totalDebtOriginal > 0 ? Math.max(4, roundedPercent) : 100}%` }}
          />
        </div>

        {/* Metrics Footer */}
        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400">Amortizado</span>
            <span className="font-bold text-emerald-400 font-mono">
              {symbol} {formatNumber(totalDebtPaid)}
            </span>
          </div>

          <div className="flex flex-col items-end">
            <span className="text-[10px] text-slate-400">Resta liquidar</span>
            <span className="font-bold text-rose-300 font-mono">
              {symbol} {formatNumber(totalDebtRemaining)}
            </span>
          </div>
        </div>

        {/* Motivational TDAH message */}
        <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-indigo-300 bg-indigo-500/10 px-2.5 py-1.5 rounded-xl border border-indigo-500/20">
          <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>
            {roundedPercent >= 100
              ? '¡Felicitaciones! Estás 100% libre de deudas registradas 🎉'
              : roundedPercent >= 50
              ? '¡Excelente ritmo! Ya liquidaste más de la mitad de tus deudas 💪'
              : 'Cada cuota que pagas es un paso más hacia tu tranquilidad 🌟'}
          </span>
        </div>
      </div>
    );
  }

  // Credit ("Me deben") Progress Bar
  const { totalCreditRemaining, totalCreditCollected } = commitmentsSummary;
  const totalCreditOriginal = totalCreditRemaining + totalCreditCollected;
  const collectedPercent = totalCreditOriginal > 0 
    ? Math.round((totalCreditCollected / totalCreditOriginal) * 100)
    : 100;

  return (
    <div className="bg-gradient-to-br from-slate-900 to-blue-950/40 border border-blue-500/30 rounded-3xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              Recuperación de Préstamos
            </h3>
            <p className="text-[11px] text-slate-400">Dinero que te deben devolver</p>
          </div>
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black text-blue-400 font-mono">
            {collectedPercent}%
          </span>
          <span className="text-xs font-semibold text-blue-500">cobrado</span>
        </div>
      </div>

      <div className="w-full h-3.5 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/60 mb-2.5">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-700 ease-out shadow-sm"
          style={{ width: `${totalCreditOriginal > 0 ? Math.max(4, collectedPercent) : 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400">Ya cobrado</span>
          <span className="font-bold text-blue-400 font-mono">
            {symbol} {formatNumber(totalCreditCollected)}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span className="text-[10px] text-slate-400">Pendiente de cobro</span>
          <span className="font-bold text-amber-300 font-mono">
            {symbol} {formatNumber(totalCreditRemaining)}
          </span>
        </div>
      </div>
    </div>
  );
};
