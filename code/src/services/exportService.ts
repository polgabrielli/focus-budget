import * as XLSX from 'xlsx';
import { type Transaction, type Category, type Commitment, type Reminder } from '../types';

export interface ExportFilterOptions {
  scope: 'month' | 'all' | 'hija' | 'category';
  categoryId?: string;
  monthString?: string; // YYYY-MM
}

/**
 * Filters transactions based on scope options (month, all, exclusive Hija, or specific category).
 */
export function filterTransactionsForExport(
  transactions: Transaction[],
  options: ExportFilterOptions
): Transaction[] {
  return transactions.filter((tx) => {
    if (tx.deletedAt) return false;

    if (options.scope === 'hija') {
      return tx.categoryId === 'cat-hija';
    }

    if (options.scope === 'category' && options.categoryId) {
      return tx.categoryId === options.categoryId;
    }

    if (options.scope === 'month' && options.monthString) {
      return tx.date.startsWith(options.monthString);
    }

    return true;
  });
}

/**
 * Prevents Spreadsheet Formula Injection (CSV/Excel Injection - CWE-1236)
 * by prefixing cells that begin with formula trigger characters (=, +, -, @, tab, CR)
 * with a single quote so Excel/LibreOffice/Google Sheets treat them as literal text.
 */
export function sanitizeSpreadsheetCell(value: string): string {
  if (!value) return '';
  if (/^[\s]*[=+\-@]/.test(value) || /^[\t\r]/.test(value)) {
    return `'${value}`;
  }
  return value;
}

function sanitizeFilename(prefix: string): string {
  return prefix.replace(/[^a-zA-Z0-9_-]/g, '_') || 'focus_budget';
}

/**
 * Prepares tabular data objects with human-readable category names, currency format,
 * and protection against spreadsheet formula injection.
 */
export function prepareTabularData(
  transactions: Transaction[],
  categories: Category[]
) {
  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  return transactions.map((tx) => {
    const catName = catMap.get(tx.categoryId) || 'Otro';
    const typeLabel = tx.type === 'expense' ? 'Gasto' : 'Ingreso';

    return {
      Fecha: tx.date,
      Tipo: typeLabel,
      Categoría: sanitizeSpreadsheetCell(catName),
      'Sub-etiqueta': sanitizeSpreadsheetCell(tx.subTag || ''),
      Monto: tx.amount,
      Moneda: tx.currency,
      'Cotización Dólar': tx.exchangeRate || '',
      Nota: sanitizeSpreadsheetCell(tx.note || ''),
    };
  });
}

function getLocalDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Exports transactions to CSV with UTF-8 BOM so Excel opens accented Spanish words cleanly.
 */
export function exportToCsv(
  transactions: Transaction[],
  categories: Category[],
  filenamePrefix = 'focus_budget'
): void {
  const data = prepareTabularData(transactions, categories);

  if (data.length === 0) {
    alert('No hay registros para exportar con los filtros seleccionados.');
    return;
  }

  const headers = Object.keys(data[0]);
  const csvRows: string[] = [];

  // Header row
  csvRows.push(headers.join(';'));

  // Data rows
  data.forEach((row) => {
    const values = headers.map((header) => {
      const val = row[header as keyof typeof row];
      const stringVal = val === null || val === undefined ? '' : String(val);
      // Escape quotes and wrap in quotes if contains delimiter or newline
      if (stringVal.includes(';') || stringVal.includes('"') || stringVal.includes('\n') || stringVal.includes('\r')) {
        return `"${stringVal.replace(/"/g, '""')}"`;
      }
      return stringVal;
    });
    csvRows.push(values.join(';'));
  });

  // Prepend UTF-8 BOM (\uFEFF)
  const csvContent = '\uFEFF' + csvRows.join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const todayStr = getLocalDateString();
  const safePrefix = sanitizeFilename(filenamePrefix);
  link.setAttribute('download', `${safePrefix}_${todayStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Exports transactions to native Excel (.xlsx) file using SheetJS (xlsx).
 */
export function exportToExcel(
  transactions: Transaction[],
  categories: Category[],
  filenamePrefix = 'focus_budget'
): void {
  const data = prepareTabularData(transactions, categories);

  if (data.length === 0) {
    alert('No hay registros para exportar con los filtros seleccionados.');
    return;
  }

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Fecha
    { wch: 10 }, // Tipo
    { wch: 22 }, // Categoría
    { wch: 18 }, // Sub-etiqueta
    { wch: 14 }, // Monto
    { wch: 8 },  // Moneda
    { wch: 16 }, // Cotización
    { wch: 28 }, // Nota
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Movimientos');

  const todayStr = getLocalDateString();
  const safePrefix = sanitizeFilename(filenamePrefix);
  XLSX.writeFile(workbook, `${safePrefix}_${todayStr}.xlsx`);
}

/**
 * Generates and downloads a complete full backup JSON file.
 */
export function downloadBackupJson(backupData: {
  transactions: Transaction[];
  categories: Category[];
  commitments: Commitment[];
  reminders: Reminder[];
}): void {
  const payload = {
    app: 'FocusBudget',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    ...backupData,
  };

  const jsonString = JSON.stringify(payload, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  const todayStr = getLocalDateString();
  link.setAttribute('download', `focus_budget_backup_${todayStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

