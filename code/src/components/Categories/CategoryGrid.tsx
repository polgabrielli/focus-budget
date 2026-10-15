import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { CategoryIcon } from '../Common/CategoryIcon';
import confetti from 'canvas-confetti';
import { type Category } from '../../types';

interface CategoryGridProps {
  amountStr: string;
  setAmountStr: React.Dispatch<React.SetStateAction<string>>;
  note: string;
  setNote: React.Dispatch<React.SetStateAction<string>>;
  setIsNoteOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({
  amountStr,
  setAmountStr,
  note,
  setNote,
  setIsNoteOpen,
}) => {
  const { activeCategories, addTransaction, transactionType } = useBudget();
  const [selectedHijaCat, setSelectedHijaCat] = useState<Category | null>(null);
  const [highlightError, setHighlightError] = useState(false);

  const amount = parseFloat(amountStr);

  const triggerPositiveFeedback = () => {
    try {
      // Haptic vibration on supported devices
      if ('vibrate' in navigator) {
        navigator.vibrate([15, 30, 15]);
      }
      // Micro confetti on save
      confetti({
        particleCount: 25,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#10B981', '#3B82F6', '#EC4899', '#F59E0B'],
        ticks: 150,
      });
    } catch {
      // Ignore if not supported
    }
  };

  const handleCategoryPress = async (cat: Category, subTag?: string | null) => {
    // If no amount entered, trigger feedback to enter amount
    if (!amount || amount <= 0) {
      setHighlightError(true);
      setTimeout(() => setHighlightError(false), 800);
      return;
    }

    // If it's category 'Hija' and no subtag specified yet, prompt quick subtag selection
    if (cat.id === 'cat-hija' && !subTag && cat.subTags && cat.subTags.length > 0) {
      setSelectedHijaCat(cat);
      return;
    }

    // 2-Touch Instant Save!
    await addTransaction({
      amount,
      categoryId: cat.id,
      subTag: subTag || null,
      note: note.trim() || undefined,
    });

    triggerPositiveFeedback();

    // Reset input state
    setAmountStr('0');
    setNote('');
    setIsNoteOpen(false);
    setSelectedHijaCat(null);
  };

  return (
    <div className="w-full max-w-md mx-auto px-4 my-2">
      {/* Category header / prompt */}
      <div className="flex items-center justify-between mb-1.5 px-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          {transactionType === 'expense' ? 'Categorías de Gasto' : 'Categorías de Ingreso'}
        </span>
        {amount > 0 ? (
          <span className="text-xs font-medium text-emerald-400 animate-pulse">
            Toca una categoría para guardar
          </span>
        ) : (
          highlightError && (
            <span className="text-xs font-medium text-amber-400 animate-bounce">
              ¡Escribe un monto primero!
            </span>
          )
        )}
      </div>

      {/* Special Sub-tag selection for "Hija" */}
      {selectedHijaCat && (
        <div className="bg-pink-950/40 border border-pink-500/40 rounded-2xl p-3 mb-3 animate-fadeIn">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-pink-300 flex items-center gap-1.5">
              👶 Sub-etiqueta para Hija:
            </span>
            <button
              onClick={() => handleCategoryPress(selectedHijaCat, null)}
              className="text-[11px] text-pink-300/80 hover:text-white underline"
            >
              Guardar sin sub-etiqueta
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {selectedHijaCat.subTags?.map((tag) => (
              <button
                key={tag}
                onClick={() => handleCategoryPress(selectedHijaCat, tag)}
                className="px-3 py-1.5 bg-pink-500 text-white text-xs font-semibold rounded-xl hover:bg-pink-400 active-press shadow-sm"
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Categories (4 columns on mobile) */}
      <div className="grid grid-cols-4 gap-2">
        {activeCategories.map((cat) => {
          const isDespuesVeo = cat.id === 'cat-despues-veo';
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryPress(cat)}
              className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all active-press relative group ${
                isDespuesVeo
                  ? 'bg-slate-800/80 border-dashed border-slate-500 hover:border-slate-300'
                  : 'bg-surface/90 border-surfaceBorder hover:border-slate-500'
              }`}
              style={{
                boxShadow: amount > 0 ? `0 2px 10px -2px ${cat.color}25` : undefined,
              }}
            >
              {/* Category Icon with custom background tint */}
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-1.5 transition-transform group-active:scale-90"
                style={{
                  backgroundColor: `${cat.color}20`,
                  color: cat.color,
                }}
              >
                <CategoryIcon name={cat.icon} className="w-5 h-5" />
              </div>

              {/* Category Name */}
              <span className="text-[11px] font-medium text-slate-200 text-center leading-tight line-clamp-2">
                {cat.name}
              </span>

              {/* Visual indicator for Hija category */}
              {cat.id === 'cat-hija' && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-pink-500 rounded-full ring-2 ring-background" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
