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
 * Prepares tabular data objects with human-readable category names and currency format.
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
      Categoría: catName,
      'Sub-etiqueta': tx.subTag || '',
      Monto: tx.amount,
      Moneda: tx.currency,
      'Cotización Dólar': tx.exchangeRate || '',
      Nota: tx.note || '',
    };
  });
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
      if (stringVal.includes(';') || stringVal.includes('"') || stringVal.includes('\n')) {
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
  const todayStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `${filenamePrefix}_${todayStr}.csv`);
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

  const todayStr = new Date().toISOString().split('T')[0];
  XLSX.writeFile(workbook, `${filenamePrefix}_${todayStr}.xlsx`);
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
  const todayStr = new Date().toISOString().split('T')[0];
  link.setAttribute('download', `focus_budget_backup_${todayStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
