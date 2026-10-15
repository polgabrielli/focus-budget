import React, { useState } from 'react';
import { useBudget } from '../../context/BudgetContext';
import { 
  exportToCsv, 
  exportToExcel, 
  downloadBackupJson, 
  filterTransactionsForExport,
  type ExportFilterOptions 
} from '../../services/exportService';
import { buildLocalAiPrompt } from '../../services/aiPromptService';
import { db } from '../../db/db';
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
  Baby, 
  Calendar,
  Layers,
} from 'lucide-react';

interface ReportsAndAiModalProps {
  onClose: () => void;
}

export const ReportsAndAiModal: React.FC<ReportsAndAiModalProps> = ({ onClose }) => {
  const { 
    allTransactionsForMonth, 
    transactions, 
    categories, 
    commitments, 
    reminders, 
    currentTotals, 
    commitmentsSummary,
    activeCurrency,
    selectedDate 
  } = useBudget();

  const [activeTab, setActiveTab] = useState<'export' | 'ai' | 'backup'>('export');
  const [filterScope, setFilterScope] = useState<'month' | 'hija' | 'all'>('month');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [pcServerIp, setPcServerIp] = useState(() => localStorage.getItem('fb_pc_server_ip') || 'http://localhost:8000');
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const currentMonthStr = selectedDate.substring(0, 7);

  // Filter transactions based on selection
  const options: ExportFilterOptions = {
    scope: filterScope === 'hija' ? 'hija' : filterScope === 'month' ? 'month' : 'all',
    monthString: currentMonthStr,
  };

  const transactionsToExport = filterTransactionsForExport(
    filterScope === 'all' ? transactions : allTransactionsForMonth,
    options
  );

  const handleExportCsv = () => {
    const prefix = filterScope === 'hija' ? 'gastos_hija' : `focus_budget_${currentMonthStr}`;
    exportToCsv(transactionsToExport, categories, prefix);
  };

  const handleExportExcel = () => {
    const prefix = filterScope === 'hija' ? 'gastos_hija' : `focus_budget_${currentMonthStr}`;
    exportToExcel(transactionsToExport, categories, prefix);
  };

  // Generate and Copy AI Prompt
  const generatedAiPrompt = buildLocalAiPrompt({
    periodLabel: filterScope === 'hija' ? `Gastos de Hija - ${currentMonthStr}` : `Mes ${currentMonthStr}`,
    currency: activeCurrency,
    transactions: allTransactionsForMonth,
    categories,
    commitments,
    reminders,
    totals: currentTotals,
    freedomPercentage: commitmentsSummary.freedomPercentage,
  });

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(generatedAiPrompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 2500);
    } catch {
      // Fallback
      alert('Prompt generado. Selecciónalo manualmente abajo para copiar.');
    }
  };

  // Backup & Local Sync
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
      setSyncStatus(`¡Copia sincronizada exitosamente en tu PC! (${data.filename}) ✅`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setSyncStatus(`Error al conectar con la PC: ${msg}. Verifica que sync_server.py esté ejecutándose.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      <div className="bg-surface border border-surfaceBorder rounded-t-3xl sm:rounded-3xl w-full max-w-md p-5 shadow-2xl flex flex-col gap-4 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-surfaceBorder/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Reportes, IA y Respaldo</h2>
              <p className="text-[11px] text-slate-400">Exportación y modelos locales</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl active-press"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="grid grid-cols-3 p-1 bg-surfaceHighlight/50 border border-surfaceBorder rounded-2xl gap-1">
          <button
            onClick={() => setActiveTab('export')}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all active-press flex items-center justify-center gap-1 ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Excel / CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all active-press flex items-center justify-center gap-1 ${
              activeTab === 'ai'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>IA Local</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`py-2 text-[11px] font-bold rounded-xl transition-all active-press flex items-center justify-center gap-1 ${
              activeTab === 'backup'
                ? 'bg-indigo-600 text-white shadow-sm'
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
            {/* Filter Pills */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Selecciona qué deseas exportar:
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  onClick={() => setFilterScope('month')}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all active-press flex flex-col items-center gap-0.5 ${
                    filterScope === 'month'
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                      : 'bg-surfaceHighlight/30 text-slate-400 border-surfaceBorder hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Este Mes</span>
                </button>

                <button
                  onClick={() => setFilterScope('hija')}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all active-press flex flex-col items-center gap-0.5 ${
                    filterScope === 'hija'
                      ? 'bg-pink-500/20 text-pink-300 border-pink-500/40 shadow-sm'
                      : 'bg-surfaceHighlight/30 text-slate-400 border-surfaceBorder hover:text-white'
                  }`}
                >
                  <Baby className="w-3.5 h-3.5 text-pink-400" />
                  <span>Solo Hija</span>
                </button>

                <button
                  onClick={() => setFilterScope('all')}
                  className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all active-press flex flex-col items-center gap-0.5 ${
                    filterScope === 'all'
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                      : 'bg-surfaceHighlight/30 text-slate-400 border-surfaceBorder hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Histórico</span>
                </button>
              </div>
            </div>

            {/* Records count preview */}
            <div className="bg-surfaceHighlight/40 border border-surfaceBorder rounded-2xl p-3 flex items-center justify-between text-xs">
              <span className="text-slate-400">Registros a exportar:</span>
              <span className="font-bold text-white font-mono">
                {transactionsToExport.length} movimientos
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-2 pt-1">
              <button
                onClick={handleExportExcel}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 active-press transition-all"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Descargar en Excel (.xlsx)</span>
              </button>

              <button
                onClick={handleExportCsv}
                className="w-full py-3 bg-surfaceHighlight hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-2xl flex items-center justify-center gap-2 border border-surfaceBorder active-press transition-all"
              >
                <FileText className="w-4 h-4" />
                <span>Descargar en CSV (.csv)</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PUENTE CON MODELOS LOCALES DE IA */}
        {activeTab === 'ai' && (
          <div className="flex flex-col gap-3 animate-fadeIn">
            <p className="text-xs text-slate-300 leading-relaxed">
              Copia este resumen pre-formateado y pégalo directamente en tu modelo local en PC
              (<strong>LM Studio</strong> o <strong>Ollama</strong>). Incluye directivas de coaching sin culpa, reforzando victorias y adaptadas a TDAH.
            </p>

            <button
              onClick={handleCopyPrompt}
              className={`w-full py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all active-press ${
                copiedPrompt
                  ? 'bg-emerald-500 text-slate-950 shadow-emerald-500/30'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
              }`}
            >
              {copiedPrompt ? (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>¡Prompt Copiado al Portapapeles!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copiar Prompt para LM Studio / Ollama</span>
                </>
              )}
            </button>

            {/* Prompt preview */}
            <div className="flex flex-col gap-1">
              <span className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                Vista previa del prompt:
              </span>
              <pre className="w-full h-44 bg-background border border-surfaceBorder rounded-2xl p-3 text-[11px] text-slate-300 font-mono overflow-y-auto whitespace-pre-wrap select-text">
                {generatedAiPrompt}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 3: RESPALDO Y WI-FI SYNC */}
        {activeTab === 'backup' && (
          <div className="flex flex-col gap-3.5 animate-fadeIn">
            {/* Download JSON Backup */}
            <div className="bg-surfaceHighlight/30 border border-surfaceBorder rounded-2xl p-3 flex flex-col gap-2">
              <span className="text-xs font-bold text-white">Copia de Seguridad Offline (JSON)</span>
              <p className="text-[11px] text-slate-400">
                Guarda una copia exacta de toda tu base de datos (gastos, deudas, recordatorios) en un archivo local.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="py-2.5 bg-surfaceHighlight hover:bg-slate-700 text-white text-xs font-bold rounded-xl border border-surfaceBorder flex items-center justify-center gap-2 active-press transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Backup JSON</span>
              </button>
            </div>

            {/* Sync with PC over local Wi-Fi */}
            <div className="bg-surfaceHighlight/30 border border-surfaceBorder rounded-2xl p-3 flex flex-col gap-2.5">
              <div className="flex items-center gap-2">
                <Wifi className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-white">Sincronización Local Wi-Fi con PC</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Envía tus datos a tu PC con un toque mientras estés en la red Wi-Fi de tu casa ejecutando <code className="text-indigo-300">sync_server.py</code>.
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-[11px] text-slate-400 font-medium">IP o URL de tu PC:</label>
                <input
                  type="text"
                  value={pcServerIp}
                  onChange={(e) => setPcServerIp(e.target.value)}
                  placeholder="http://192.168.1.50:8000"
                  className="w-full bg-background border border-surfaceBorder rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                onClick={handleSyncToPc}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md flex items-center justify-center gap-2 active-press transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Enviar Copia a mi PC</span>
              </button>

              {syncStatus && (
                <div className="p-2 bg-background border border-surfaceBorder rounded-xl text-[11px] text-slate-300 font-mono">
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
