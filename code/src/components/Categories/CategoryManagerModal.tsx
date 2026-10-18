import React, { useState, useEffect } from 'react';
import { X, Plus, Check, RotateCcw, Settings2 } from 'lucide-react';
import { useBudget } from '../../context/BudgetContext';
import {
  CategoryIcon,
  AVAILABLE_CATEGORY_ICONS,
  AVAILABLE_CATEGORY_COLORS,
} from '../Common/CategoryIcon';
import { type TransactionType } from '../../types';

const SLOT_3_PRESETS = [
  { name: 'Hija', icon: 'Baby', color: '#EC4899', chips: ['Cuota', 'Niñera', 'Pañales/Farmacia', 'Colegio', 'Ropa/Extras'] },
  { name: 'Hijos', icon: 'Users', color: '#EC4899', chips: ['Colegio', 'Actividades', 'Ropa', 'Salud', 'Salidas'] },
  { name: 'Mascotas', icon: 'PawPrint', color: '#F59E0B', chips: ['Alimento', 'Veterinaria', 'Paseador/Guardería', 'Farmacia', 'Accesorios'] },
  { name: 'Pareja / Familia', icon: 'Heart', color: '#EC4899', chips: ['Salidas', 'Regalos', 'Viajes', 'Compartido', 'Extras'] },
  { name: 'Estudios', icon: 'GraduationCap', color: '#3B82F6', chips: ['Cuota', 'Cursos', 'Libros/Apuntes', 'Software', 'Exámenes'] },
];

export const CategoryManagerModal: React.FC = () => {
  const {
    isCategoryManagerOpen,
    editingCategoryId,
    closeCategoryManager,
    categories,
    transactionType,
    updateCategory,
    addSubTagToCategory,
    removeSubTagFromCategory,
    resetCategoriesToDefault,
  } = useBudget();

  const [tabType, setTabType] = useState<TransactionType>(transactionType);
  const [selectedId, setSelectedId] = useState<string>('');
  const [nameInput, setNameInput] = useState<string>('');
  const [newChipInput, setNewChipInput] = useState<string>('');
  const [confirmReset, setConfirmReset] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<boolean>(false);

  const editableCategories = categories.filter(
    (c) => c.type === tabType && c.id !== 'cat-despues-veo'
  );

  useEffect(() => {
    if (isCategoryManagerOpen) {
      setConfirmReset(false);
      if (editingCategoryId) {
        const target = categories.find((c) => c.id === editingCategoryId);
        if (target && target.id !== 'cat-despues-veo') {
          setTabType(target.type);
          setSelectedId(target.id);
          setNameInput(target.name);
          return;
        }
      }
      setTabType(transactionType);
      const first = categories.find(
        (c) => c.type === transactionType && c.id !== 'cat-despues-veo'
      );
      if (first) {
        setSelectedId(first.id);
        setNameInput(first.name);
      }
    }
  }, [isCategoryManagerOpen, editingCategoryId, transactionType, categories]);

  const selectedCategory =
    editableCategories.find((c) => c.id === selectedId) || editableCategories[0];

  useEffect(() => {
    if (selectedCategory) {
      setNameInput(selectedCategory.name);
    }
  }, [selectedCategory?.id]);

  useEffect(() => {
    if (!isCategoryManagerOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCategoryManager();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isCategoryManagerOpen, closeCategoryManager]);

  if (!isCategoryManagerOpen) return null;

  const handleSaveName = async () => {
    if (!selectedCategory) return;
    const trimmed = nameInput.trim();
    if (!trimmed || trimmed === selectedCategory.name) return;
    await updateCategory(selectedCategory.id, { name: trimmed });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  const handleAddChip = async () => {
    if (!selectedCategory) return;
    const trimmed = newChipInput.trim();
    if (!trimmed) return;
    await addSubTagToCategory(selectedCategory.id, trimmed);
    setNewChipInput('');
  };

  const handleApplyPreset = async (preset: typeof SLOT_3_PRESETS[number]) => {
    if (!selectedCategory) return;
    setNameInput(preset.name);
    await updateCategory(selectedCategory.id, {
      name: preset.name,
      icon: preset.icon,
      color: preset.color,
      subTags: preset.chips,
    });
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 1500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Personalizar Categorías"
      onClick={closeCategoryManager}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border-t sm:border border-surfaceBorder rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 pb-safe shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto animate-sheetUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surfaceBorder/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Settings2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Personalizar Categorías y Chips</h2>
              <p className="text-xs text-slate-400">
                Adaptá nombres, íconos, colores y subcategorías a tu vida
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={closeCategoryManager}
            aria-label="Cerrar"
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl active-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Expense / Income Switcher */}
        <div className="grid grid-cols-2 p-1 bg-surfaceElevated border border-surfaceBorder rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => {
              setTabType('expense');
              const first = categories.find((c) => c.type === 'expense' && c.id !== 'cat-despues-veo');
              if (first) setSelectedId(first.id);
            }}
            className={`py-2 min-h-[36px] text-xs font-bold rounded-xl transition-colors active-press ${
              tabType === 'expense'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Categorías de Gasto
          </button>
          <button
            type="button"
            onClick={() => {
              setTabType('income');
              const first = categories.find((c) => c.type === 'income');
              if (first) setSelectedId(first.id);
            }}
            className={`py-2 min-h-[36px] text-xs font-bold rounded-xl transition-colors active-press ${
              tabType === 'income'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Categorías de Ingreso
          </button>
        </div>

        {/* Category Selector Strip */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-slate-300">
            1. Elegí qué categoría editar:
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            {editableCategories.map((cat) => {
              const isSelected = selectedCategory?.id === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(cat.id);
                    setNameInput(cat.name);
                  }}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border text-center transition-all active-press ${
                    isSelected
                      ? 'bg-surfaceHighlight border-indigo-500 ring-1 ring-indigo-500/50'
                      : 'bg-surfaceElevated border-surfaceBorder hover:border-slate-600'
                  }`}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-1"
                    style={{
                      backgroundColor: `${cat.color}22`,
                      color: cat.color,
                    }}
                  >
                    <CategoryIcon name={cat.icon} className="w-4 h-4" />
                  </div>
                  <span className="text-[11px] font-medium text-slate-200 line-clamp-1">
                    {cat.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {selectedCategory && (
          <div className="bg-surfaceElevated border border-surfaceBorder rounded-2xl p-3.5 flex flex-col gap-3.5">
            {/* Quick Presets for Slot 3 (cat-hija) */}
            {selectedCategory.id === 'cat-hija' && (
              <div className="flex flex-col gap-1.5 pb-2.5 border-b border-surfaceBorder/80">
                <span className="text-[11px] font-semibold text-pink-300">
                  Plantillas rápidas para este casillero destacado:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {SLOT_3_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => handleApplyPreset(preset)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors active-press ${
                        selectedCategory.name === preset.name
                          ? 'bg-pink-500/25 text-pink-200 border-pink-500/50'
                          : 'bg-surface text-slate-300 border-surfaceBorder hover:text-white'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Category Name Input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Nombre de la categoría:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={handleSaveName}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveName();
                    }
                  }}
                  maxLength={24}
                  className="flex-1 bg-background border border-surfaceBorder rounded-xl px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSaveName}
                  className="px-3 py-2 min-h-[34px] rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 active-press"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{savedFeedback ? '¡Listo!' : 'Guardar'}</span>
                </button>
              </div>
            </div>

            {/* Smart Chips (subTags) Management */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300">
                Chips rápidos de 1 toque ({selectedCategory.subTags?.length || 0}):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {selectedCategory.subTags && selectedCategory.subTags.length > 0 ? (
                  selectedCategory.subTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface border border-surfaceBorder text-xs text-slate-200 font-medium"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeSubTagFromCategory(selectedCategory.id, tag)}
                        aria-label={`Eliminar chip ${tag}`}
                        className="text-slate-400 hover:text-rose-400 p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400">
                    Sin chips todavía. Agregá uno abajo.
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={newChipInput}
                  onChange={(e) => setNewChipInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddChip();
                    }
                  }}
                  placeholder="Agregar nuevo chip (ej: Verdulería, Prepaga)..."
                  className="flex-1 bg-background border border-surfaceBorder rounded-xl px-3 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleAddChip}
                  disabled={!newChipInput.trim()}
                  className="px-3 py-2 min-h-[34px] rounded-xl bg-surfaceHighlight hover:bg-slate-700 disabled:opacity-40 text-white text-xs font-bold border border-surfaceBorder flex items-center gap-1 active-press"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Sumar</span>
                </button>
              </div>
            </div>

            {/* Color Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Color:</label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_CATEGORY_COLORS.map((hex) => {
                  const isCurrentColor = selectedCategory.color.toLowerCase() === hex.toLowerCase();
                  return (
                    <button
                      key={hex}
                      type="button"
                      onClick={() => updateCategory(selectedCategory.id, { color: hex })}
                      aria-label={`Color ${hex}`}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform active-press ${
                        isCurrentColor ? 'ring-2 ring-white scale-110' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: hex }}
                    >
                      {isCurrentColor && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon Picker */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">Ícono:</label>
              <div className="grid grid-cols-6 gap-1.5 max-h-36 overflow-y-auto p-1 bg-background/60 rounded-xl border border-surfaceBorder">
                {AVAILABLE_CATEGORY_ICONS.map((item) => {
                  const isCurrentIcon = selectedCategory.icon === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => updateCategory(selectedCategory.id, { icon: item.key })}
                      title={item.label}
                      aria-label={`Ícono ${item.label}`}
                      className={`p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors active-press ${
                        isCurrentIcon
                          ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/60'
                          : 'text-slate-300 hover:bg-surfaceHighlight hover:text-white'
                      }`}
                    >
                      <CategoryIcon name={item.key} className="w-4 h-4" />
                      <span className="text-[9px] truncate max-w-full">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Footer: Restore Defaults & Close */}
        <div className="flex items-center justify-between gap-2 pt-1">
          {!confirmReset ? (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 flex items-center gap-1.5 active-press"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar originales</span>
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={async () => {
                  await resetCategoriesToDefault();
                  setConfirmReset(false);
                }}
                className="px-3 py-1.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold active-press"
              >
                Confirmar reseteo
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="text-xs text-slate-400 hover:text-white px-2"
              >
                Cancelar
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={closeCategoryManager}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold active-press"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
};
