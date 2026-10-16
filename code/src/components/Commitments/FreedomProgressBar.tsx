import React from 'react';
import { useBudget } from '../../context/BudgetContext';
import { ShieldCheck, TrendingUp } from 'lucide-react';

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
    const { totalDebtRemaining, totalDebtPaid, totalDebtOriginal, freedomPercentage } =
      commitmentsSummary;
    const roundedPercent = Math.round(freedomPercentage);

    return (
      <div className="bg-surface border border-surfaceBorder rounded-2xl p-4">
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100">
                Barra de Libertad
              </h3>
              <p className="text-xs text-slate-400">Progreso de desahogo financiero</p>
            </div>
          </div>

          <div className="flex items-baseline gap-1 tabular-nums">
            <span className="text-2xl font-extrabold text-emerald-400 font-mono">
              {totalDebtOriginal > 0 ? `${roundedPercent}%` : '100%'}
            </span>
            <span className="text-xs font-semibold text-emerald-400">libre</span>
          </div>
        </div>

        {/* Clean Solid Progress Bar */}
        <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-surfaceBorder/80 mb-3">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${totalDebtOriginal > 0 ? Math.max(4, roundedPercent) : 100}%` }}
          />
        </div>

        {/* Metrics Footer */}
        <div className="flex items-center justify-between text-xs pt-2.5 border-t border-surfaceBorder/80 tabular-nums">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-slate-400">Amortizado</span>
            <span className="text-sm font-bold text-emerald-400 font-mono">
              {symbol} {formatNumber(totalDebtPaid)}
            </span>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <span className="text-xs text-slate-400">Resta liquidar</span>
            <span className="text-sm font-bold text-slate-100 font-mono">
              {symbol} {formatNumber(totalDebtRemaining)}
            </span>
          </div>
        </div>

        <p className="mt-3 text-xs text-slate-300 bg-background/70 px-3 py-2 rounded-xl border border-surfaceBorder/70">
          {roundedPercent >= 100
            ? 'Estás 100% libre de deudas registradas.'
            : roundedPercent >= 50
            ? 'Excelente ritmo: ya liquidaste más de la mitad de tus deudas.'
            : 'Cada cuota pagada reduce tu carga mental y libera tu flujo mensual.'}
        </p>
      </div>
    );
  }

  // Credit ("Me deben") Progress Bar
  const { totalCreditRemaining, totalCreditCollected } = commitmentsSummary;
  const totalCreditOriginal = totalCreditRemaining + totalCreditCollected;
  const collectedPercent =
    totalCreditOriginal > 0
      ? Math.round((totalCreditCollected / totalCreditOriginal) * 100)
      : 100;

  return (
    <div className="bg-surface border border-surfaceBorder rounded-2xl p-4">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-sky-500/15 text-sky-400 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">
              Recuperación de Préstamos
            </h3>
            <p className="text-xs text-slate-400">Dinero que te deben devolver</p>
          </div>
        </div>

        <div className="flex items-baseline gap-1 tabular-nums">
          <span className="text-2xl font-extrabold text-sky-400 font-mono">
            {collectedPercent}%
          </span>
          <span className="text-xs font-semibold text-sky-400">cobrado</span>
        </div>
      </div>

      <div className="w-full h-2.5 bg-background rounded-full overflow-hidden border border-surfaceBorder/80 mb-3">
        <div
          className="h-full bg-sky-500 rounded-full transition-all duration-500 ease-out"
          style={{ width: `${totalCreditOriginal > 0 ? Math.max(4, collectedPercent) : 100}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs pt-2.5 border-t border-surfaceBorder/80 tabular-nums">
        <div className="flex flex-col gap-0.5">
          <span className="text-xs text-slate-400">Ya cobrado</span>
          <span className="text-sm font-bold text-sky-400 font-mono">
            {symbol} {formatNumber(totalCreditCollected)}
          </span>
        </div>

        <div className="flex flex-col items-end gap-0.5">
          <span className="text-xs text-slate-400">Pendiente de cobro</span>
          <span className="text-sm font-bold text-slate-100 font-mono">
            {symbol} {formatNumber(totalCreditRemaining)}
          </span>
        </div>
      </div>
    </div>
  );
};
