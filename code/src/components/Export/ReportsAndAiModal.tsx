import React, { useState, useEffect, useRef } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { CategoryIcon } from '../Common/CategoryIcon';
import {
  exportToCsv,
  exportToExcel,
  downloadBackupJson,
  filterTransactionsForExport,
  type ExportFilterOptions,
} from '../../services/exportService';
import { buildLocalAiPrompt } from '../../services/aiPromptService';
import { db } from '../../db/db';
import { type Transaction } from '../../types';
import {
  X,
  FileSpreadsheet,
  FileText,
  Sparkles,
  Copy,
  Check,
  Download,
  Upload,
  Wifi,
  Calendar,
  Layers,
  FolderDown,
  Settings2,
} from 'lucide-react';

interface ReportsAndAiModalProps {
  onClose: () => void;
}

export const ReportsAndAiModal: React.FC<ReportsAndAiModalProps> = ({ onClose }) => {
  const {
    allTransactionsForMonth,
    categories,
    commitments,
    reminders,
    currentTotals,
    commitmentsSummary,
    activeCurrency,
    selectedDate,
    exchangeRate,
    restoreBackup,
    openCategoryManager,
  } = useBudget();

  const [activeTab, setActiveTab] = useState<'export' | 'ai' | 'backup'>('export');
  const [filterScope, setFilterScope] = useState<'month' | 'hija' | 'all'>('month');
  const [allHistoricalTxs, setAllHistoricalTxs] = useState<Transaction[]>(allTransactionsForMonth);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [pcServerIp, setPcServerIp] = useState(
    () => localStorage.getItem('fb_pc_server_ip') || 'http://localhost:8000'
  );
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMonthStr = selectedDate.substring(0, 7);
  const featuredCat = categories.find((c) => c.id === 'cat-hija');
  const featuredCatName = featuredCat?.name || 'Hija';
  const featuredCatIcon = featuredCat?.icon || 'Baby';

  // Load full transaction history from IndexedDB so "Histórico" exports all months
  useEffect(() => {
    let mounted = true;
    db.transactions
      .filter((t) => !t.deletedAt)
      .toArray()
      .then((items) => {
        if (mounted) {
          setAllHistoricalTxs(items);
        }
      })
      .catch(() => {
        // Fallback to current month
      });
    return () => {
      mounted = false;
    };
  }, [allTransactionsForMonth]);

  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [onClose]);

  const options: ExportFilterOptions = {
    scope: filterScope === 'hija' ? 'hija' : filterScope === 'month' ? 'month' : 'all',
    monthString: currentMonthStr,
  };

  const sourcePool = filterScope === 'all' ? allHistoricalTxs : allTransactionsForMonth;
  const transactionsToExport = filterTransactionsForExport(sourcePool, options);

  const handleExportCsv = () => {
    const prefix = filterScope === 'hija' ? 'gastos_hija' : `focus_budget_${currentMonthStr}`;
    exportToCsv(transactionsToExport, categories, prefix);
  };

  const handleExportExcel = () => {
    const prefix = filterScope === 'hija' ? 'gastos_hija' : `focus_budget_${currentMonthStr}`;
    exportToExcel(transactionsToExport, categories, prefix);
  };

  // Generate AI Prompt with currency conversion
  const generatedAiPrompt = buildLocalAiPrompt({
    periodLabel:
      filterScope === 'hija' ? `Gastos de Hija - ${currentMonthStr}` : `Mes ${currentMonthStr}`,
    currency: activeCurrency,
    transactions: allTransactionsForMonth,
    categories,
    commitments,
    reminders,
    totals: currentTotals,
    freedomPercentage: commitmentsSummary.freedomPercentage,
    exchangeRate: exchangeRate?.venta || 1400,
  });

  // Clipboard copy with HTTP LAN fallback
  const handleCopyPrompt = async () => {
    try {
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(generatedAiPrompt);
      } else {
        const tempArea = document.createElement('textarea');
        tempArea.value = generatedAiPrompt;
        tempArea.style.position = 'fixed';
        tempArea.style.opacity = '0';
        document.body.appendChild(tempArea);
        tempArea.select();
        document.execCommand('copy');
        document.body.removeChild(tempArea);
      }
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      alert('Prompt generado. Seleccionalo abajo para copiar.');
    }
  };

  // Backup Download
  const handleDownloadBackup = async () => {
    const allTxs = await db.transactions.toArray();
    const allCats = await db.categories.toArray();
    const allComms = await db.commitments.toArray();
    const allRems = await db.reminders.toArray();

    downloadBackupJson({
      transactions: allTxs,
      categories: allCats,
      commitments: allComms,
      reminders: allRems,
    });
  };

  // Backup Restore from Local JSON File
  const handleImportBackupFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      await restoreBackup(parsed);
      setSyncStatus('Respaldo JSON restaurado con éxito en este dispositivo.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncStatus(`Error al leer el archivo de respaldo: ${msg}`);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Push Backup to PC
  const handleSyncToPc = async () => {
    setSyncStatus('Conectando con el servidor en tu PC...');
    try {
      localStorage.setItem('fb_pc_server_ip', pcServerIp.trim());

      const allTxs = await db.transactions.toArray();
      const allCats = await db.categories.toArray();
      const allComms = await db.commitments.toArray();
      const allRems = await db.reminders.toArray();

      const payload = {
        app: 'FocusBudget',
        timestamp: new Date().toISOString(),
        transactions: allTxs,
        categories: allCats,
        commitments: allComms,
        reminders: allRems,
      };

      const res = await fetch(`${pcServerIp.trim()}/api/backup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSyncStatus(`Copia sincronizada exitosamente en tu PC (${data.filename})`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncStatus(
        `Error al conectar con la PC: ${msg}. Verificá que sync_server.py esté ejecutándose.`
      );
    }
  };

  // Pull Latest Backup from PC
  const handleRestoreFromPc = async () => {
    setSyncStatus('Descargando última copia desde tu PC...');
    try {
      localStorage.setItem('fb_pc_server_ip', pcServerIp.trim());
      const res = await fetch(`${pcServerIp.trim()}/api/backup/latest`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      await restoreBackup(data);
      setSyncStatus('Datos restaurados exitosamente desde tu PC.');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncStatus(`No se pudo restaurar desde la PC: ${msg}`);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Reportes, IA y Respaldo"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-surface border border-surfaceBorder rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto animate-sheetUp"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surfaceBorder/70 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Reportes, IA y Respaldo</h2>
              <p className="text-xs text-slate-400">Exportación y modelos locales</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => {
                onClose();
                openCategoryManager();
              }}
              className="flex items-center gap-1 px-2.5 py-1.5 min-h-[34px] rounded-xl bg-surfaceElevated hover:bg-surfaceHighlight border border-surfaceBorder text-xs font-semibold text-indigo-300 hover:text-white active-press"
              title="Personalizar nombres, íconos y chips de las categorías"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Categorías</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-slate-400 hover:text-white rounded-xl active-press"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 p-1 bg-surfaceElevated border border-surfaceBorder rounded-2xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`py-2.5 min-h-[40px] text-xs font-bold rounded-xl transition-colors active-press flex items-center justify-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel / CSV</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`py-2.5 min-h-[40px] text-xs font-bold rounded-xl transition-colors active-press flex items-center justify-center gap-1.5 ${
              activeTab === 'ai'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>IA Local</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('backup')}
            className={`py-2.5 min-h-[40px] text-xs font-bold rounded-xl transition-colors active-press flex items-center justify-center gap-1.5 ${
              activeTab === 'backup'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Wi-Fi Sync</span>
          </button>
        </div>

        {/* TAB 1: EXPORTACIÓN EXCEL / CSV */}
        {activeTab === 'export' && (
          <div className="flex flex-col gap-4 animate-fadeIn">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-slate-300">
                Seleccioná qué deseás exportar:
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setFilterScope('month')}
                  className={`py-2.5 px-2 min-h-[56px] text-xs font-semibold rounded-xl border transition-colors active-press flex flex-col items-center justify-center gap-1 ${
                    filterScope === 'month'
                      ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/40'
                      : 'bg-surfaceElevated text-slate-400 border-surfaceBorder hover:text-white'
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                  <span>Este Mes</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterScope('hija')}
                  className={`py-2.5 px-2 min-h-[56px] text-xs font-semibold rounded-xl border transition-colors active-press flex flex-col items-center justify-center gap-1 ${
                    filterScope === 'hija'
                      ? 'bg-pink-500/20 text-pink-200 border-pink-500/40'
                      : 'bg-surfaceElevated text-slate-400 border-surfaceBorder hover:text-white'
                  }`}
                >
                  <CategoryIcon name={featuredCatIcon} className="w-4 h-4 text-pink-400" />
                  <span className="truncate max-w-full">Solo {featuredCatName}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFilterScope('all')}
                  className={`py-2.5 px-2 min-h-[56px] text-xs font-semibold rounded-xl border transition-colors active-press flex flex-col items-center justify-center gap-1 ${
                    filterScope === 'all'
                      ? 'bg-indigo-600/20 text-indigo-200 border-indigo-500/40'
                      : 'bg-surfaceElevated text-slate-400 border-surfaceBorder hover:text-white'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>Histórico</span>
                </button>
              </div>
            </div>

            {/* Records count preview */}
            <div className="bg-surfaceElevated border border-surfaceBorder rounded-2xl p-3.5 flex items-center justify-between text-xs tabular-nums">
              <span className="text-slate-400">Registros a exportar:</span>
              <span className="font-bold text-white font-mono">
                {transactionsToExport.length} movimientos
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleExportExcel}
                className="w-full py-3.5 min-h-[46px] bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 active-press transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Descargar en Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                className="w-full py-3.5 min-h-[46px] bg-surfaceElevated hover:bg-surfaceHighlight text-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 border border-surfaceBorder active-press transition-colors"
              >
                <FileText className="w-4 h-4" />
                <span>Descargar en CSV (.csv)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PUENTE CON MODELOS LOCALES DE IA */}
        {activeTab === 'ai' && (
          <div className="flex flex-col gap-3.5 animate-fadeIn">
            <p className="text-xs text-slate-300 leading-relaxed">
              Copiá este resumen estructurado y pegalo en tu modelo local en PC (
              <strong>LM Studio</strong> u <strong>Ollama</strong>). Incluye lineamientos de
              análisis constructivo y sin reproches.
            </p>

            <button
              type="button"
              onClick={handleCopyPrompt}
              className={`w-full py-3.5 min-h-[46px] rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-colors active-press ${
                copiedPrompt
                  ? 'bg-emerald-500 text-emerald-950'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white'
              }`}
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-4 h-4 stroke-[2.5]" />
                  <span>¡Prompt Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Prompt para LM Studio / Ollama</span>
                </>
              )}
            </button>

            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-slate-400 font-semibold">
                Vista previa del prompt:
              </span>
              <pre className="w-full h-44 bg-background border border-surfaceBorder rounded-2xl p-3 text-xs text-slate-300 font-mono overflow-y-auto whitespace-pre-wrap select-text">
                {generatedAiPrompt}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: RESPALDO Y WI-FI SYNC */}
        {activeTab === 'backup' && (
          <div className="flex flex-col gap-3.5 animate-fadeIn">
            {/* Offline JSON Export & Import */}
            <div className="bg-surfaceElevated border border-surfaceBorder rounded-2xl p-3.5 flex flex-col gap-2.5">
              <span className="text-xs font-bold text-white">
                Copia de Seguridad Offline (JSON)
              </span>
              <p className="text-xs text-slate-400">
                Guardá o restaurá una copia completa de tu base de datos (gastos, deudas,
                recordatorios) en un archivo local.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownloadBackup}
                  className="py-2.5 px-3 min-h-[40px] bg-surfaceHighlight hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-surfaceBorder flex items-center justify-center gap-1.5 active-press transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar JSON</span>
                </button>

                <label className="py-2.5 px-3 min-h-[40px] bg-surfaceHighlight hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-surfaceBorder flex items-center justify-center gap-1.5 active-press transition-colors cursor-pointer">
                  <FolderDown className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Importar JSON</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/json,.json"
                    onChange={handleImportBackupFile}
                    className="sr-only"
                  />
                </label>
              </div>
            </div>

            {/* Sync with PC over local Wi-Fi */}
            <div className="bg-surfaceElevated border border-surfaceBorder rounded-2xl p-3.5 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold text-white">
                  Sincronización Local Wi-Fi con PC
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Enviá o restaurá tus datos en tu red local ejecutando{' '}
                <code className="text-indigo-300">sync_server.py</code> en tu PC.
              </p>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-slate-400 font-medium">
                  IP o URL de tu PC:
                </label>
                <input
                  type="text"
                  value={pcServerIp}
                  onChange={(e) => setPcServerIp(e.target.value)}
                  placeholder="http://192.168.1.50:8000"
                  className="w-full bg-background border border-surfaceBorder rounded-xl px-3.5 py-2 min-h-[40px] text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleSyncToPc}
                  className="py-2.5 px-3 min-h-[42px] bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 active-press transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Enviar Copia a mi PC</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestoreFromPc}
                  className="py-2.5 px-3 min-h-[42px] bg-surfaceHighlight hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-surfaceBorder flex items-center justify-center gap-1.5 active-press transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Traer de mi PC</span>
                </button>
              </div>

              {syncStatus && (
                <div
                  role="status"
                  className="p-2.5 bg-background border border-surfaceBorder rounded-xl text-xs text-slate-200 font-mono"
                >
                  {syncStatus}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
