import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { type CurrencyCode } from '../../types';
import { X, Plus, Clock, Calendar, Repeat } from 'lucide-react';

interface NewReminderModalProps {
  onClose: () => void;
}

export const NewReminderModal: React.FC<NewReminderModalProps> = ({ onClose }) => {
  const { addReminder, categories, activeCurrency, selectedDate } = useBudget();

  const expenseCategories = categories.filter((c) => c.type === 'expense');

  const [title, setTitle] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [currency, setCurrency] = useState<CurrencyCode>(activeCurrency);
  const [categoryId, setCategoryId] = useState('cat-hogar');
  const [dueDate, setDueDate] = useState(selectedDate);
  const [isRecurring, setIsRecurring] = useState(true);

  const parsedAmount = parseFloat(amountStr) || 0;
  const symbol = currency === 'ARS' ? '$' : 'US$';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || parsedAmount <= 0 || !dueDate) return;

    await addReminder({
      title: title.trim(),
      amount: parsedAmount,
      currency,
      dueDate,
      categoryId,
      isRecurring,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-surface border border-surfaceBorder rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surfaceBorder/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white">Nuevo Vencimiento</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl active-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {/* Título del servicio */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">
              Nombre del Servicio o Gasto
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Internet Fibertel, Edenor, Alquiler, OSDE..."
              className="w-full bg-background border border-surfaceBorder rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
              autoFocus
            />
          </div>

          {/* Monto y Moneda */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2 flex flex-col gap-1">
              <label className="text-xs font-semibold text-slate-300">
                Monto Estimado
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">
                  {symbol}
                </span>
                <input
                  type="number"
                  step="any"
                  min="1"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
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

          {/* Categoría asociada */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300">
              Categoría
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-background border border-surfaceBorder rounded-xl px-3 py-2 text-xs font-medium text-white focus:outline-none focus:border-indigo-500"
            >
              {expenseCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Fecha de vencimiento */}
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Fecha de Vencimiento</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-background border border-surfaceBorder rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          {/* Recurrente Mensual Toggle */}
          <div className="bg-surfaceHighlight/30 border border-surfaceBorder/60 rounded-2xl p-3 flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Repeat className="w-4 h-4 text-emerald-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">
                  ¿Se repite todos los meses?
                </span>
                <span className="text-[11px] text-slate-400">
                  Al pagarlo se renovará automáticamente para el mes próximo
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded"
            />
          </div>

          {/* Submit */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={parsedAmount <= 0 || !title.trim()}
              className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active-press transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Guardar en Radar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
