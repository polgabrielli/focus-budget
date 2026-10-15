import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { type CommitmentType, type CurrencyCode } from '../../types';
import { X, Plus, Layers, User } from 'lucide-react';

interface NewCommitmentModalProps {
  initialType?: CommitmentType;
  onClose: () => void;
}

export const NewCommitmentModal: React.FC<NewCommitmentModalProps> = ({
  initialType = 'debt',
  onClose,
}) => {
  const { addCommitment, activeCurrency } = useBudget();

  const [type, setType] = useState<CommitmentType>(initialType);
  const [title, setTitle] = useState('');
  const [counterpart, setCounterpart] = useState('');
  const [totalAmountStr, setTotalAmountStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(activeCurrency);
  const [hasInstallments, setHasInstallments] = useState(false);
  const [installmentsCountStr, setInstallmentsCountStr] = useState('3');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');

  const parsedAmount = parseFloat(totalAmountStr) || 0;
  const parsedInstallments = hasInstallments ? parseInt(installmentsCountStr, 10) || 1 : undefined;

  const installmentPreview = parsedInstallments && parsedInstallments > 0
    ? Math.round(parsedAmount / parsedInstallments)
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !counterpart.trim() || parsedAmount <= 0) return;

    await addCommitment({
      title: title.trim(),
      counterpart: counterpart.trim(),
      type,
      totalAmount: parsedAmount,
      currency,
      installmentsTotal: parsedInstallments,
      dueDate: dueDate || null,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const symbol = currency === 'ARS' ? '$' : 'US$';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-surface border border-surfaceBorder rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surfaceBorder/60 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Nuevo Compromiso</span>
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl active-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Type Toggle: Debo vs Me deben */}
        <div className="grid grid-cols-2 p-1 bg-surfaceHighlight/50 border border-surfaceBorder rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setType('debt')}
            className={`py-2 text-xs font-bold rounded-xl transition-all active-press ${
              type === 'debt'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Debo (Pasivo)
          </button>
          <button
            type="button"
            onClick={() => setType('credit')}
            className={`py-2 text-xs font-bold rounded-xl transition-all active-press ${
              type === 'credit'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Me deben (Activo)
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Contraparte (Persona o entidad) */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span>{type === 'debt' ? '¿A quién le debes?' : '¿Quién te debe?'}</span>
            </label>
            <input
              type="text"
              value={counterpart}
              onChange={(e) => setCounterpart(e.target.value)}
              placeholder="Ej: Mamá, Lucas, Banco Galicia..."
              className="w-full bg-background border border-surfaceBorder rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
              autoFocus
            />
          </div>

          {/* Título o Concepto */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">
              Concepto o Título
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Préstamo arreglos casa, Tarjeta Visa..."
              className="w-full bg-background border border-surfaceBorder rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Monto Total
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  {symbol}
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={totalAmountStr}
                  onChange={(e) => setTotalAmountStr(e.target.value)}
                  placeholder="0"
                  className="w-full bg-background border border-surfaceBorder rounded-xl pl-8 pr-3 py-2 text-sm font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Moneda
              </label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="w-full bg-background border border-surfaceBorder rounded-xl px-2 py-2 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500 h-9"
              >
                <option value="ARS">ARS ($)</option>
                <option value="USD">USD ($)</option>
              </select>
            </div>
          </div>

          {/* Cuotas fijas toggle */}
          <div className="bg-surfaceHighlight/30 border border-surfaceBorder/60 rounded-2xl p-3 flex flex-col gap-2.5">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-medium text-slate-200">
                  ¿Se cancela en cuotas fijas?
                </span>
              </div>
              <input
                type="checkbox"
                checked={hasInstallments}
                onChange={(e) => setHasInstallments(e.target.checked)}
                className="w-4 h-4 accent-indigo-500 rounded"
              />
            </label>

            {hasInstallments && (
              <div className="pt-2 border-t border-surfaceBorder/50 flex items-center justify-between gap-3 animate-fadeIn">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400">Total cuotas:</span>
                  <input
                    type="number"
                    min="2"
                    max="60"
                    value={installmentsCountStr}
                    onChange={(e) => setInstallmentsCountStr(e.target.value)}
                    className="w-16 bg-background border border-surfaceBorder rounded-lg px-2 py-1 text-xs text-center font-bold text-white"
                  />
                </div>
                {installmentPreview > 0 && (
                  <span className="text-[11px] text-indigo-300 font-mono">
                    ~ {symbol} {installmentPreview.toLocaleString('es-AR')} / cuota
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Fecha de vencimiento opcional */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">
              Fecha de vencimiento o límite (opcional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-background border border-surfaceBorder rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Notas opcionales */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">
              Notas adicionales (opcional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: CBU, datos de transferencia..."
              className="w-full bg-background border border-surfaceBorder rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Botón Guardar */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active-press transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Guardar Compromiso</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
