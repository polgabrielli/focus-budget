import React, { useState } from 'react';
import { Settings2 } from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';
import { CategoryIcon } from '../Common/CategoryIcon';
import confetti from 'canvas-confetti';
import { type Category } from '../../types';

interface CategoryGridProps {
  amountStr?: string;
  setAmountStr?: React.Dispatch<React.SetStateAction<string>>;
  note?: string;
  setNote?: React.Dispatch<React.SetStateAction<string>>;
  setIsNoteOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  mode?: 'inline' | 'launcher';
  selectedCategoryId?: string | null;
  onSelectCategory?: (cat: Category, subTag?: string | null) => void;
  onSaved?: () => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  amountStr = '0',
  setAmountStr,
  note = '',
  setNote,
  setIsNoteOpen,
  mode = 'inline',
  selectedCategoryId = null,
  onSelectCategory,
  onSaved,
}) => {
  const {
    activeCategories,
    addTransaction,
    transactionType,
    categoryTotals,
    activeCurrency,
    openKeypad,
    openCategoryManager,
  } = useBudget();

  const [selectedHijaCat, setSelectedHijaCat] = useState<Category | null>(null);
  const [highlightError, setHighlightError] = useState(false);

  const amount = parseFloat(amountStr.replace(',', '.')) || 0;
  const currencySymbol = activeCurrency === 'ARS' ? '$' : 'US$';

  const formatCompactAmount = (val: number) => {
    return new Intl.NumberFormat('es-AR', {
      maximumFractionDigits: 0,
    }).format(val);
  };

  const triggerPositiveFeedback = () => {
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(15);
      }
      const prefersReducedMotion =
        typeof window !== 'undefined' &&
        typeof window.matchMedia === 'function' &&
        window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (!prefersReducedMotion) {
        confetti({
          particleCount: 18,
          spread: 50,
          origin: { y: 0.85 },
          colors: ['#10B981', '#6366F1', '#3B82F6'],
          ticks: 110,
        });
      }
    } catch {
      // Ignore if unsupported
    }
  };

  const handleCategoryPress = async (cat: Category, subTag?: string | null) => {
    if (onSelectCategory) {
      onSelectCategory(cat, subTag ?? null);
      setSelectedHijaCat(null);
      return;
    }

    // Home Screen Launcher mode: tapping any category opens the Keypad Sheet directly in 1 touch
    if (mode === 'launcher' && amount <= 0) {
      setSelectedHijaCat(null);
      openKeypad({ categoryId: cat.id, subTag: subTag ?? null });
      return;
    }

    // Inline mode: require amount > 0 first
    if (!amount || amount <= 0) {
      setHighlightError(true);
      setTimeout(() => setHighlightError(false), 1200);
      return;
    }

    // Expand sub-tags in inline mode for cat-hija
    if (cat.id === 'cat-hija' && cat.subTags && cat.subTags.length > 0 && subTag === undefined) {
      setSelectedHijaCat(cat);
      return;
    }

    await addTransaction({
      amount,
      categoryId: cat.id,
      subTag: subTag || null,
      note: note.trim() || undefined,
    });

    triggerPositiveFeedback();

    setAmountStr?.('0');
    setNote?.('');
    setIsNoteOpen?.(false);
    setSelectedHijaCat(null);
    onSaved?.();
  };

  return (
    <section className="w-full max-w-md mx-auto px-4 my-2.5">
      {/* Header row */}
      <div className="flex items-center justify-between mb-2 px-0.5 gap-2">
        <div className="flex items-center gap-2">
          <h2 className="text-xs font-semibold text-slate-300">
            {transactionType === 'expense' ? 'Categorías de Gasto' : 'Categorías de Ingreso'}
          </h2>
          { !onSelectCategory && (
            <button
              type="button"
              onClick={() => openCategoryManager()}
              className="flex items-center gap-1 px-2 py-0.5 min-h-[24px] rounded-lg bg-surface hover:bg-surfaceHighlight border border-surfaceBorder text-[11px] font-medium text-indigo-300 hover:text-white transition-colors active-press"
              title="Editar nombres, íconos, colores y chips de las categorías"
              aria-label="Personalizar categorías"
            >
              <Settings2 className="w-3 h-3" />
              <span>Personalizar</span>
            </button>
          )}
        </div>

        {mode === 'launcher' && amount <= 0 ? (
          <span className="text-xs text-slate-400 truncate">
            Tocá una para cargar
          </span>
        ) : amount > 0 ? (
          <span className="text-xs font-medium text-emerald-400">
            Tocá una categoría para guardar
          </span>
        ) : (
          highlightError && (
            <span role="alert" className="text-xs font-semibold text-amber-400">
              ¡Escribe un monto primero!
            </span>
          )
        )}
      </div>

      {/* Sub-tag selector drawer for Hija (or any category with subTags) */}
      {selectedHijaCat && (
        <div className="bg-surfaceElevated border border-pink-500/40 rounded-2xl p-3.5 mb-3 animate-fadeIn">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-semibold text-pink-200">
              Sub-etiqueta para {selectedHijaCat.name}:
            </span>
            <button
              type="button"
              onClick={() => handleCategoryPress(selectedHijaCat, null)}
              className="text-xs font-medium text-slate-300 hover:text-white underline py-1 px-2"
            >
              Guardar sin sub-etiqueta
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedHijaCat.subTags?.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => handleCategoryPress(selectedHijaCat, tag)}
                className="px-3.5 py-2 min-h-[38px] bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/40 text-pink-100 text-xs font-semibold rounded-xl active-press"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4-column tactile category grid with Monefy monthly totals */}
      <div className="grid grid-cols-4 gap-2">
        {activeCategories.map((cat) => {
          const isDespuesVeo = cat.id === 'cat-despues-veo';
          const isSelected = selectedCategoryId === cat.id;
          const catTotal = categoryTotals[cat.id] || 0;

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => handleCategoryPress(cat)}
              className={`flex flex-col items-center justify-between p-2.5 min-h-[84px] rounded-2xl border transition-all active-press relative group ${
                isSelected
                  ? 'bg-surfaceHighlight border-indigo-500 ring-1 ring-indigo-500/50'
                  : isDespuesVeo
                  ? 'bg-surface/80 border-dashed border-slate-600 hover:border-slate-400'
                  : 'bg-surface border-surfaceBorder hover:border-slate-600'
              }`}
            >
              {/* Category Icon */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-active:scale-95"
                style={{
                  backgroundColor: `${cat.color}1F`,
                  color: cat.color,
                }}
              >
                <CategoryIcon name={cat.icon} className="w-5 h-5" />
              </div>

              {/* Category Name */}
              <span className="text-xs font-medium text-slate-100 text-center leading-tight line-clamp-2">
                {cat.name}
              </span>

              {/* Monthly accumulated total on the tile (Monefy style) */}
              <span
                className={`text-[11px] mt-1 tabular-nums font-medium truncate max-w-full ${
                  catTotal > 0 ? 'text-slate-300' : 'text-slate-500'
                }`}
              >
                {catTotal > 0 ? `${currencySymbol} ${formatCompactAmount(catTotal)}` : '—'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
};
