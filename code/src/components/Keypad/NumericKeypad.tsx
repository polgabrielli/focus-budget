import React, { useEffect, useState, useCallback } from 'react';
import { Delete, FileText, X, Check, RefreshCw } from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';
import { CategoryIcon } from '../Common/CategoryIcon';
import { type CurrencyCode, type UsdRateType } from '../../types';
import confetti from 'canvas-confetti';

interface NumericKeypadProps {
  amountStr: string;
  setAmountStr: React.Dispatch<React.SetStateAction<string>>;
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  isNoteOpen: boolean;
  setIsNoteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  currency?: CurrencyCode;
  conversionPreview?: string | null;
  onSubmit?: () => void;
}

export const NumericKeypad: React.FC<NumericKeypadProps> = ({
  amountStr,
  setAmountStr,
  note,
  setNote,
  isNoteOpen,
  setIsNoteOpen,
  currency,
  conversionPreview,
  onSubmit,
}) => {
  const { activeCurrency } = useBudget();
  const effectiveCurrency = currency || activeCurrency;
  const currencySymbol = effectiveCurrency === 'ARS' ? '$' : 'US$';

  const handleDigit = useCallback(
    (digit: string) => {
      const normalized = digit === ',' ? '.' : digit;
      setAmountStr((prev) => {
        if (prev === '0' && normalized !== '.') {
          return normalized;
        }
        if (normalized === '.' && prev.includes('.')) {
          return prev;
        }
        if (prev.includes('.')) {
          const parts = prev.split('.');
          if (parts[1] && parts[1].length >= 2) {
            return prev;
          }
        }
        if (prev.length >= 10) return prev;
        return prev === '0' ? normalized : prev + normalized;
      });
    },
    [setAmountStr]
  );

  const handleDelete = useCallback(() => {
    setAmountStr((prev) => {
      if (prev.length <= 1) return '0';
      return prev.slice(0, -1);
    });
  }, [setAmountStr]);

  const handleClear = useCallback(() => {
    setAmountStr('0');
  }, [setAmountStr]);

  // Physical keyboard support for PC/Mac
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName.toLowerCase();
      if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
        if (e.key === 'Enter' && onSubmit) {
          e.preventDefault();
          onSubmit();
        }
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === '.' || e.key === ',') {
        e.preventDefault();
        handleDigit('.');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Delete') {
        e.preventDefault();
        handleClear();
      } else if (e.key === 'Enter' && onSubmit) {
        e.preventDefault();
        onSubmit();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleDigit, handleDelete, handleClear, onSubmit]);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-2.5">
      {/* Amount Display & Note Trigger */}
      <div className="bg-surfaceElevated border border-surfaceBorder rounded-2xl p-3.5 flex flex-col gap-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-col min-w-0">
            <div className="flex items-baseline gap-1.5 overflow-hidden">
              <span className="text-xl font-bold text-slate-400">{currencySymbol}</span>
              <span className="text-3xl font-extrabold tracking-tight text-white font-mono tabular-nums">
                {amountStr}
              </span>
            </div>
            {conversionPreview && (
              <span className="text-xs font-medium text-slate-400 tabular-nums animate-fadeIn">
                {conversionPreview}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Note toggle button */}
            <button
              type="button"
              onClick={() => setIsNoteOpen(!isNoteOpen)}
              className={`p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl transition-colors active-press ${
                note || isNoteOpen
                  ? 'bg-indigo-600/25 text-indigo-200 border border-indigo-500/40'
                  : 'text-slate-300 hover:text-white bg-surfaceHighlight border border-surfaceBorder'
              }`}
              title="Añadir nota opcional"
              aria-label="Añadir nota opcional"
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* Clear button if amount > 0 */}
            {amountStr !== '0' && (
              <button
                type="button"
                onClick={handleClear}
                className="p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center rounded-xl text-slate-300 hover:text-white bg-surfaceHighlight border border-surfaceBorder active-press"
                title="Borrar todo"
                aria-label="Borrar todo"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Optional Note input row */}
        {isNoteOpen && (
          <div className="pt-2 border-t border-surfaceBorder/80 flex items-center gap-2 animate-fadeIn">
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota opcional (ej: Carrefour, Farmacity)..."
              className="w-full bg-background border border-surfaceBorder rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              autoFocus
            />
          </div>
        )}
      </div>

      {/* Tactile Keypad (Large 52px keys for iPhone 11 thumb comfort) */}
      <div className="grid grid-cols-3 gap-2">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
          <button
            key={num}
            type="button"
            onClick={() => handleDigit(num)}
            className="h-13 min-h-[50px] bg-surface hover:bg-surfaceHighlight active:bg-surfaceHighlight text-white font-semibold text-xl rounded-xl border border-surfaceBorder transition-colors active-press flex items-center justify-center font-mono tabular-nums"
          >
            {num}
          </button>
        ))}

        {/* Decimal button */}
        <button
          type="button"
          onClick={() => handleDigit('.')}
          className="h-13 min-h-[50px] bg-surface hover:bg-surfaceHighlight active:bg-surfaceHighlight text-slate-200 font-bold text-2xl rounded-xl border border-surfaceBorder transition-colors active-press flex items-center justify-center"
        >
          .
        </button>

        {/* Zero button */}
        <button
          type="button"
          onClick={() => handleDigit('0')}
          className="h-13 min-h-[50px] bg-surface hover:bg-surfaceHighlight active:bg-surfaceHighlight text-white font-semibold text-xl rounded-xl border border-surfaceBorder transition-colors active-press flex items-center justify-center font-mono tabular-nums"
        >
          0
        </button>

        {/* Backspace button */}
        <button
          type="button"
          onClick={handleDelete}
          aria-label="Borrar último dígito"
          className="h-13 min-h-[50px] bg-surface hover:bg-surfaceHighlight active:bg-surfaceHighlight text-rose-400 font-semibold rounded-xl border border-surfaceBorder transition-colors active-press flex items-center justify-center"
        >
          <Delete className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

/**
 * Monefy-Style Bottom Sheet Keypad Modal
 * Opens when tapping any Category on the Home Screen, editing a transaction, or settling a bill.
 */
export const KeypadBottomSheet: React.FC = () => {
  const {
    keypadDraft,
    closeKeypad,
    categories,
    activeCategories,
    addTransaction,
    updateTransaction,
    payReminder,
    selectedDate,
    exchangeRate,
    refreshExchangeRate,
  } = useBudget();

  const [amountStr, setAmountStr] = useState<string>('0');
  const [note, setNote] = useState<string>('');
  const [isNoteOpen, setIsNoteOpen] = useState<boolean>(false);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [selectedSubTag, setSelectedSubTag] = useState<string | null>(null);
  const [entryDate, setEntryDate] = useState<string>(selectedDate);
  const [currency, setCurrency] = useState<CurrencyCode>('ARS');
  const [rateType, setRateType] = useState<UsdRateType>('mep');
  const [isRefreshingRate, setIsRefreshingRate] = useState<boolean>(false);

  const mepRate = exchangeRate?.mep?.venta || exchangeRate?.venta || 1400;
  const oficialRate = exchangeRate?.oficial?.venta || 1400;
  const activeRate = rateType === 'oficial' ? oficialRate : mepRate;

  const handleRefreshRate = async () => {
    setIsRefreshingRate(true);
    try {
      await refreshExchangeRate();
    } finally {
      setTimeout(() => setIsRefreshingRate(false), 350);
    }
  };

  useEffect(() => {
    if (keypadDraft.isOpen) {
      if (keypadDraft.editingTransaction) {
        const tx = keypadDraft.editingTransaction;
        setAmountStr(String(tx.amount));
        setNote(tx.note || '');
        setIsNoteOpen(Boolean(tx.note));
        setSelectedCatId(tx.categoryId);
        setSelectedSubTag(tx.subTag || null);
        setEntryDate(tx.date);
        setCurrency(tx.currency || 'ARS');
      } else if (keypadDraft.reminderToPay) {
        const rem = keypadDraft.reminderToPay;
        setAmountStr(String(rem.amount));
        setNote(`Pago de servicio: ${rem.title}`);
        setIsNoteOpen(false);
        setSelectedCatId(rem.categoryId);
        setSelectedSubTag(rem.title);
        setEntryDate(selectedDate);
        setCurrency(rem.currency || 'ARS');
      } else {
        setAmountStr(keypadDraft.initialAmount || '0');
        setNote(keypadDraft.initialNote || '');
        setIsNoteOpen(Boolean(keypadDraft.initialNote));
        setSelectedCatId(keypadDraft.categoryId || activeCategories[0]?.id || null);
        setSelectedSubTag(keypadDraft.subTag || null);
        setEntryDate(selectedDate);
        setCurrency(keypadDraft.initialCurrency || 'ARS');
      }
    }
  }, [keypadDraft, activeCategories, selectedDate]);

  useEffect(() => {
    if (!keypadDraft.isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeKeypad();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [keypadDraft.isOpen, closeKeypad]);

  if (!keypadDraft.isOpen) return null;

  const parsedAmount = parseFloat(amountStr.replace(',', '.')) || 0;
  const currentCategory = categories.find((c) => c.id === selectedCatId) || activeCategories[0];

  let convertedPreview: string | null = null;
  if (parsedAmount > 0) {
    if (currency === 'USD') {
      const convertedArs = Math.round(parsedAmount * activeRate);
      convertedPreview = `≈ $ ${convertedArs.toLocaleString('es-AR')} ARS (${rateType === 'oficial' ? 'Oficial' : 'MEP'}: $${activeRate.toLocaleString('es-AR')})`;
    } else {
      const convertedUsd = (parsedAmount / (activeRate || 1)).toLocaleString('es-AR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
      convertedPreview = `≈ US$ ${convertedUsd} (${rateType === 'oficial' ? 'Oficial' : 'MEP'}: $${activeRate.toLocaleString('es-AR')})`;
    }
  }

  const handleConfirm = async () => {
    if (parsedAmount <= 0 || !currentCategory) return;

    if (keypadDraft.editingTransaction) {
      await updateTransaction(keypadDraft.editingTransaction.id, {
        amount: parsedAmount,
        categoryId: currentCategory.id,
        subTag: selectedSubTag,
        note: note.trim(),
        date: entryDate,
        currency,
        exchangeRate: activeRate,
      });
    } else if (keypadDraft.reminderToPay) {
      await payReminder(keypadDraft.reminderToPay.id, parsedAmount, entryDate);
    } else {
      await addTransaction({
        amount: parsedAmount,
        categoryId: currentCategory.id,
        subTag: selectedSubTag,
        note: note.trim() || undefined,
        date: entryDate,
        currency,
        exchangeRate: activeRate,
      });
    }

    try {
      if ('vibrate' in navigator) navigator.vibrate(15);
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!prefersReducedMotion) {
        confetti({
          particleCount: 18,
          spread: 50,
          origin: { y: 0.8 },
          colors: ['#10B981', '#6366F1', '#3B82F6'],
          ticks: 100,
        });
      }
    } catch {
      // Ignore
    }

    closeKeypad();
  };

  const symbol = currency === 'ARS' ? '$' : 'US$';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={
        keypadDraft.editingTransaction
          ? 'Editar movimiento'
          : keypadDraft.reminderToPay
          ? 'Confirmar pago de vencimiento'
          : 'Registrar movimiento'
      }
      onClick={closeKeypad}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border-t sm:border border-surfaceBorder rounded-t-3xl sm:rounded-3xl w-full max-w-md p-4 pb-safe shadow-2xl flex flex-col gap-3 animate-sheetUp max-h-[92vh] overflow-y-auto"
      >
        {/* Top bar: Category badge & Close */}
        <div className="flex items-center justify-between gap-2 pb-2 border-b border-surfaceBorder/70">
          <div className="flex items-center gap-2.5 min-w-0">
            {currentCategory && (
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  backgroundColor: `${currentCategory.color}22`,
                  color: currentCategory.color,
                }}
              >
                <CategoryIcon name={currentCategory.icon} className="w-5 h-5" />
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold text-white truncate">
                {keypadDraft.editingTransaction
                  ? 'Editar movimiento'
                  : keypadDraft.reminderToPay
                  ? `Pagar ${keypadDraft.reminderToPay.title}`
                  : currentCategory?.name || 'Nuevo movimiento'}
              </span>
              <span className="text-xs text-slate-400 truncate">
                {selectedSubTag ? `Sub-etiqueta: ${selectedSubTag}` : entryDate}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={closeKeypad}
            aria-label="Cerrar teclado"
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl bg-surfaceHighlight/60 active-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Currency & Exchange Rate Bar (Visible ONLY when recording/editing a movement) */}
        <div className="flex items-center justify-between gap-2 p-1.5 bg-surfaceElevated rounded-2xl border border-surfaceBorder">
          {/* Currency Toggle */}
          <div
            role="group"
            aria-label="Moneda del movimiento"
            className="flex items-center bg-surface p-0.5 rounded-xl border border-surfaceBorder shrink-0"
          >
            <button
              type="button"
              onClick={() => setCurrency('ARS')}
              className={`px-3 py-1.5 min-h-[34px] text-xs font-bold rounded-lg transition-colors active-press ${
                currency === 'ARS'
                  ? 'bg-slate-100 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              ARS ($)
            </button>
            <button
              type="button"
              onClick={() => setCurrency('USD')}
              className={`px-3 py-1.5 min-h-[34px] text-xs font-bold rounded-lg transition-colors active-press ${
                currency === 'USD'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              USD (US$)
            </button>
          </div>

          {/* Exchange Rate: Oficial vs MEP (Selector & Live Rate) */}
          <div className="flex items-center gap-1 min-w-0">
            <button
              type="button"
              onClick={() => setRateType('mep')}
              title={`Usar cotización Dólar MEP (Bolsa): $${mepRate.toLocaleString('es-AR')}`}
              aria-label={`Usar cotización MEP ${mepRate} pesos`}
              className={`px-2 py-1 min-h-[32px] text-xs font-semibold rounded-lg border transition-colors active-press tabular-nums shrink-0 ${
                rateType === 'mep'
                  ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50'
                  : 'bg-surfaceHighlight text-slate-400 border-surfaceBorder hover:text-slate-200'
              }`}
            >
              MEP ${mepRate.toLocaleString('es-AR')}
            </button>
            <button
              type="button"
              onClick={() => setRateType('oficial')}
              title={`Usar cotización Dólar Oficial: $${oficialRate.toLocaleString('es-AR')}`}
              aria-label={`Usar cotización Oficial ${oficialRate} pesos`}
              className={`px-2 py-1 min-h-[32px] text-xs font-semibold rounded-lg border transition-colors active-press tabular-nums shrink-0 ${
                rateType === 'oficial'
                  ? 'bg-indigo-600/30 text-indigo-200 border-indigo-500/50'
                  : 'bg-surfaceHighlight text-slate-400 border-surfaceBorder hover:text-slate-200'
              }`}
            >
              Oficial ${oficialRate.toLocaleString('es-AR')}
            </button>
            <button
              type="button"
              onClick={handleRefreshRate}
              title="Actualizar cotizaciones en vivo desde Dolar API"
              aria-label="Actualizar cotización dólar"
              className="p-1.5 min-w-[32px] min-h-[32px] flex items-center justify-center rounded-lg text-slate-400 hover:text-white bg-surfaceHighlight border border-surfaceBorder active-press shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRate ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>
        </div>

        {/* Category switcher pills (when adding or editing) */}
        {!keypadDraft.reminderToPay && (
          <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {activeCategories.map((cat) => {
              const isSelected = currentCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedCatId(cat.id);
                    if (cat.id !== 'cat-hija') setSelectedSubTag(null);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-xl text-xs font-semibold shrink-0 border transition-colors active-press ${
                    isSelected
                      ? 'bg-indigo-600/25 text-indigo-200 border-indigo-500/50'
                      : 'bg-surfaceElevated text-slate-300 border-surfaceBorder hover:text-white'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: cat.color }}
                  />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Sub-tag pills if current category has subTags (e.g. Hija) */}
        {currentCategory?.subTags && currentCategory.subTags.length > 0 && !keypadDraft.reminderToPay && (
          <div className="flex flex-wrap gap-1.5 bg-surfaceElevated p-2.5 rounded-xl border border-surfaceBorder">
            {currentCategory.subTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => setSelectedSubTag(selectedSubTag === tag ? null : tag)}
                className={`px-3 py-1.5 min-h-[34px] rounded-lg text-xs font-semibold transition-colors active-press ${
                  selectedSubTag === tag
                    ? 'bg-pink-500 text-white'
                    : 'bg-surfaceHighlight text-slate-300 hover:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {/* Keypad */}
        <NumericKeypad
          amountStr={amountStr}
          setAmountStr={setAmountStr}
          note={note}
          setNote={setNote}
          isNoteOpen={isNoteOpen}
          setIsNoteOpen={setIsNoteOpen}
          currency={currency}
          conversionPreview={convertedPreview}
          onSubmit={handleConfirm}
        />

        {/* Primary Confirm CTA */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={parsedAmount <= 0}
          className={`w-full py-3.5 min-h-[48px] rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors active-press ${
            parsedAmount > 0
              ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/50'
              : 'bg-surfaceHighlight text-slate-500 cursor-not-allowed'
          }`}
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>
            {keypadDraft.editingTransaction
              ? 'Guardar cambios'
              : keypadDraft.reminderToPay
              ? `Confirmar pago (${keypadDraft.reminderToPay.currency === 'ARS' ? '$' : 'US$'} ${parsedAmount.toLocaleString('es-AR')})`
              : `Guardar ${symbol} ${parsedAmount.toLocaleString('es-AR')} en ${currentCategory?.name || 'Categoría'}`}
          </span>
        </button>
      </div>
    </div>
  );
};
