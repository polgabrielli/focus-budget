import { describe, it, expect } from 'vitest';
import { 
  filterTransactionsForExport, 
  prepareTabularData 
} from '../exportService';
import { type Transaction, type Category } from '../../types';

describe('exportService', () => {
  const mockCategories: Category[] = [
    {
      id: 'cat-super',
      name: 'Súper y Casa',
      type: 'expense',
      icon: 'ShoppingCart',
      color: '#10B981',
      description: '',
      isSystem: true,
      sortOrder: 1,
    },
    {
      id: 'cat-hija',
      name: 'Hija',
      type: 'expense',
      icon: 'Baby',
      color: '#EC4899',
      description: '',
      isSystem: true,
      sortOrder: 3,
    },
  ];

  const mockTransactions: Transaction[] = [
    {
      id: 'tx-1',
      amount: 5000,
      type: 'expense',
      categoryId: 'cat-super',
      currency: 'ARS',
      exchangeRate: 1400,
      date: '2026-10-15',
      note: 'Supermercado Día',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: 'tx-2',
      amount: 12000,
      type: 'expense',
      categoryId: 'cat-hija',
      subTag: 'Pañales/Farmacia',
      currency: 'ARS',
      exchangeRate: 1400,
      date: '2026-10-14',
      note: 'Farmacity',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: 'tx-3',
      amount: 40000,
      type: 'expense',
      categoryId: 'cat-hija',
      subTag: 'Cuota',
      currency: 'ARS',
      exchangeRate: 1400,
      date: '2026-09-20', // Previous month
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: null,
    },
    {
      id: 'tx-deleted',
      amount: 9999,
      type: 'expense',
      categoryId: 'cat-super',
      currency: 'ARS',
      exchangeRate: 1400,
      date: '2026-10-15',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      deletedAt: new Date().toISOString(), // Soft-deleted
    },
  ];

  describe('filterTransactionsForExport', () => {
    it('excludes soft-deleted transactions', () => {
      const filtered = filterTransactionsForExport(mockTransactions, { scope: 'all' });
      expect(filtered).toHaveLength(3);
      expect(filtered.some((t) => t.id === 'tx-deleted')).toBe(false);
    });

    it('filters exclusively by Hija category when scope is "hija"', () => {
      const filtered = filterTransactionsForExport(mockTransactions, { scope: 'hija' });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.categoryId === 'cat-hija')).toBe(true);
    });

    it('filters by month string (e.g. 2026-10)', () => {
      const filtered = filterTransactionsForExport(mockTransactions, {
        scope: 'month',
        monthString: '2026-10',
      });
      expect(filtered).toHaveLength(2);
      expect(filtered.every((t) => t.date.startsWith('2026-10'))).toBe(true);
    });
  });

  describe('prepareTabularData', () => {
    it('transforms raw transactions into formatted human-readable rows with category names', () => {
      const rows = prepareTabularData([mockTransactions[1]], mockCategories);
      expect(rows).toHaveLength(1);
      expect(rows[0]).toEqual({
        Fecha: '2026-10-14',
        Tipo: 'Gasto',
        Categoría: 'Hija',
        'Sub-etiqueta': 'Pañales/Farmacia',
        Monto: 12000,
        Moneda: 'ARS',
        'Cotización Dólar': 1400,
        Nota: 'Farmacity',
      });
    });
  });
});
