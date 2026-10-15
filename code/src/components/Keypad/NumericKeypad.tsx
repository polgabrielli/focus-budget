import React from 'react';
import { Delete, FileText, X } from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';

interface NumericKeypadProps {
  amountStr: string;
  setAmountStr: React.Dispatch<React.SetStateAction<string>>;
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  isNoteOpen: boolean;
  setIsNoteOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  amountStr,
  setAmountStr,
  note,
  setNote,
  isNoteOpen,
  setIsNoteOpen,
}) => {
  const { activeCurrency } = useBudget();
  const currencySymbol = activeCurrency === 'ARS' ? '$' : 'US$';

  const handleDigit = (digit: string) => {
    // Avoid double leading zeros
    if (amountStr === '0' && digit !== '.') {
      setAmountStr(digit);
      return;
    }
    // Prevent multiple decimals
    if (digit === '.' && amountStr.includes('.')) {
      return;
    }
    // Limit max decimal places to 2
    if (amountStr.includes('.')) {
      const parts = amountStr.split('.');
      if (parts[1] && parts[1].length >= 2) {
        return;
      }
    }
    // Max length limit to prevent overflow
    if (amountStr.length >= 10) return;

    setAmountStr(prev => (prev === '0' ? digit : prev + digit));
  };

  const handleDelete = () => {
    setAmountStr(prev => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  };

  const handleClear = () => {
    setAmountStr('0');
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 flex flex-col gap-2">
      {/* Amount Display & Note Trigger */}
      <div className="bg-surface/95 border border-surfaceBorder rounded-2xl p-3 flex flex-col gap-2 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-1.5 overflow-hidden">
            <span className="text-xl font-bold text-slate-400">{currencySymbol}</span>
            <span className="text-3xl font-extrabold tracking-tight text-white font-mono">
              {amountStr}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {/* Note toggle button (Non-blocking) */}
            <button
              onClick={() => setIsNoteOpen(!isNoteOpen)}
              className={`p-2 rounded-xl transition-all active-press ${
                note || isNoteOpen
                  ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/40'
                  : 'text-slate-400 hover:text-white bg-surfaceHighlight/50'
              }`}
              title="Añadir nota opcional"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* Clear button if amount > 0 */}
            {amountStr !== '0' && (
              <button
                onClick={handleClear}
                className="p-2 rounded-xl text-slate-400 hover:text-white bg-surfaceHighlight/50 active-press"
                title="Borrar todo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Optional Note input row */}
        {isNoteOpen && (
          <div className="pt-2 border-t border-surfaceBorder/60 flex items-center gap-2 animate-fadeIn">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota opcional (ej: Carrefour, Farmacity)..."
              className="w-full bg-surfaceHighlight/40 border border-surfaceBorder/80 rounded-xl px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Tactile Keypad (Large keys for iPhone 11) */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            onClick={() => handleDigit(num)}
            className="h-12 bg-surface hover:bg-surfaceHighlight active:bg-surfaceHighlight/80 text-white font-semibold text-xl rounded-xl border border-surfaceBorder/60 shadow-sm transition-all active-press flex items-center justify-center font-mono"
          >
            {num}
          </button>
        ))}

        {/* Decimal button */}
        <button
          onClick={() => handleDigit('.')}
          className="h-12 bg-surface hover:bg-surfaceHighlight active:bg-surfaceHighlight/80 text-slate-300 font-bold text-2xl rounded-xl border border-surfaceBorder/60 shadow-sm transition-all active-press flex items-center justify-center"
        >
          .
        </button>

        {/* Zero button */}
        <button
          onClick={() => handleDigit('0')}
          className="h-12 bg-surface hover:bg-surfaceHighlight active:bg-surfaceHighlight/80 text-white font-semibold text-xl rounded-xl border border-surfaceBorder/60 shadow-sm transition-all active-press flex items-center justify-center font-mono"
        >
          0
        </button>

        {/* Backspace button */}
        <button
          onClick={handleDelete}
          className="h-12 bg-surface hover:bg-surfaceHighlight active:bg-surfaceHighlight/80 text-rose-400 font-semibold rounded-xl border border-surfaceBorder/60 shadow-sm transition-all active-press flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
