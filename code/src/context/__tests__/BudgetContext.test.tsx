import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BudgetProvider, useBudget } from '../BudgetContext';
import { db } from '../../db/db';

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BudgetProvider>{children}</BudgetProvider>
);

describe('BudgetContext & Calculations', () => {
  beforeEach(async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Offline in unit tests'));
    await db.transactions.clear();
    await db.categories.clear();
    await db.exchangeRates.clear();
    // Seed exchange rate for predictable multi-currency tests
    await db.exchangeRates.put({
      id: 'USD',
      currency: 'USD',
      compra: 1350,
      venta: 1400,
      source: 'test',
      fetchedAt: new Date().toISOString(),
    });
  });

  it('calculates Net Balance = Income - Expenses accurately', async () => {
    const { result } = renderHook(() => useBudget(), { wrapper });

    await waitFor(() => {
      expect(result.current.categories.length).toBeGreaterThan(0);
    });

    // Add Income: $100.000
    await act(async () => {
      result.current.setTransactionType('income');
    });

    await act(async () => {
      await result.current.addTransaction({
        amount: 100000,
        categoryId: 'cat-sueldo',
      });
    });

    // Add Expense: $35.000
    await act(async () => {
      result.current.setTransactionType('expense');
    });

    await act(async () => {
      await result.current.addTransaction({
        amount: 35000,
        categoryId: 'cat-super',
      });
    });

    await waitFor(() => {
      expect(result.current.currentTotals.income).toBe(100000);
      expect(result.current.currentTotals.expense).toBe(35000);
      expect(result.current.currentTotals.balance).toBe(65000);
    });
  });

  it('handles multi-currency conversion (USD to ARS in totals)', async () => {
    const { result } = renderHook(() => useBudget(), { wrapper });

    await waitFor(() => {
      expect(result.current.exchangeRate?.venta).toBe(1400);
    });

    // Register a USD expense of US$ 10
    await act(async () => {
      result.current.setActiveCurrency('USD');
      result.current.setTransactionType('expense');
    });

    await act(async () => {
      await result.current.addTransaction({
        amount: 10,
        categoryId: 'cat-digital',
      });
    });

    // In USD, expense is 10
    await waitFor(() => {
      expect(result.current.currentTotals.expense).toBe(10);
    });

    // Switch view to ARS: 10 USD * 1400 rate = 14000 ARS
    await act(async () => {
      result.current.setActiveCurrency('ARS');
    });

    await waitFor(() => {
      expect(result.current.currentTotals.expense).toBe(14000);
    });
  });

  it('switches dates with 1-touch presets (Hoy, Ayer, Custom)', async () => {
    const { result } = renderHook(() => useBudget(), { wrapper });

    const now = new Date();
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
      now.getDate()
    ).padStart(2, '0')}`;

    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(
      yesterdayDate.getMonth() + 1
    ).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    expect(result.current.datePreset).toBe('today');
    expect(result.current.selectedDate).toBe(todayStr);

    // Switch to Ayer
    act(() => {
      result.current.setDatePreset('yesterday');
    });
    expect(result.current.datePreset).toBe('yesterday');
    expect(result.current.selectedDate).toBe(yesterdayStr);

    // Switch to Custom
    act(() => {
      result.current.setDatePreset('custom', '2026-10-01');
    });
    expect(result.current.datePreset).toBe('custom');
    expect(result.current.selectedDate).toBe('2026-10-01');
  });

  it('performs soft deletion of transactions', async () => {
    const { result } = renderHook(() => useBudget(), { wrapper });

    let createdId = '';
    await act(async () => {
      const tx = await result.current.addTransaction({
        amount: 500,
        categoryId: 'cat-super',
      });
      createdId = tx.id;
    });

    await waitFor(() => {
      expect(result.current.transactions.length).toBe(1);
    });

    // Delete transaction
    await act(async () => {
      await result.current.deleteTransaction(createdId);
    });

    await waitFor(() => {
      expect(result.current.transactions.length).toBe(0);
    });

    // In DB, deletedAt should be populated
    const txInDb = await db.transactions.get(createdId);
    expect(txInDb?.deletedAt).toBeDefined();
    expect(txInDb?.deletedAt).not.toBeNull();
  });

  it('reverts linked commitment paidAmount and installmentsPaid when undoing a commitment payment', async () => {
    const { result } = renderHook(() => useBudget(), { wrapper });

    let commitmentId = '';
    await act(async () => {
      const comm = await result.current.addCommitment({
        title: 'Préstamo Notebook',
        counterpart: 'Banco',
        type: 'debt',
        totalAmount: 90000,
        currency: 'ARS',
        installmentsTotal: 3,
      });
      commitmentId = comm.id;
    });

    await act(async () => {
      await result.current.payCommitment({
        commitmentId,
        amount: 30000,
      });
    });

    await waitFor(async () => {
      const updated = await db.commitments.get(commitmentId);
      expect(updated?.paidAmount).toBe(30000);
      expect(updated?.installmentsPaid).toBe(1);
    });

    // Undo the payment
    await act(async () => {
      await result.current.undoLastTransaction();
    });

    await waitFor(async () => {
      const reverted = await db.commitments.get(commitmentId);
      expect(reverted?.paidAmount).toBe(0);
      expect(reverted?.installmentsPaid).toBe(0);
      const txCount = await db.transactions.count();
      expect(txCount).toBe(0);
    });
  });

  it('reverts recurring reminder dueDate when undoing a reminder payment', async () => {
    const { result } = renderHook(() => useBudget(), { wrapper });

    let reminderId = '';
    await act(async () => {
      const rem = await result.current.addReminder({
        title: 'Luz Edenor',
        amount: 18000,
        currency: 'ARS',
        dueDate: '2026-10-18',
        categoryId: 'cat-hogar',
        isRecurring: true,
      });
      reminderId = rem.id;
    });

    await act(async () => {
      await result.current.payReminder(reminderId);
    });

    await waitFor(async () => {
      const advanced = await db.reminders.get(reminderId);
      expect(advanced?.dueDate).toBe('2026-11-18');
    });

    // Undo the payment
    await act(async () => {
      await result.current.undoLastTransaction();
    });

    await waitFor(async () => {
      const reverted = await db.reminders.get(reminderId);
      expect(reverted?.dueDate).toBe('2026-10-18');
      expect(reverted?.status).toBe('pending');
    });
  });

  it('edits and reclassifies a "Después veo" transaction', async () => {
    const { result } = renderHook(() => useBudget(), { wrapper });

    let txId = '';
    await act(async () => {
      const tx = await result.current.addTransaction({
        amount: 4500,
        categoryId: 'cat-despues-veo',
        note: 'Compra rápida',
      });
      txId = tx.id;
    });

    await act(async () => {
      await result.current.updateTransaction(txId, {
        categoryId: 'cat-super',
        amount: 4800,
      });
    });

    await waitFor(async () => {
      const updated = await db.transactions.get(txId);
      expect(updated?.categoryId).toBe('cat-super');
      expect(updated?.amount).toBe(4800);
    });
  });

  it('customizes a category name/icon and adds/removes custom sub-tags (Smart Chips)', async () => {
    const { result } = renderHook(() => useBudget(), { wrapper });

    await waitFor(() => {
      expect(result.current.categories.length).toBeGreaterThan(0);
    });

    // Add a custom chip to Súper y Almacén
    await act(async () => {
      await result.current.addSubTagToCategory('cat-super', 'Dietética');
    });

    await waitFor(() => {
      const superCat = result.current.categories.find((c) => c.id === 'cat-super');
      expect(superCat?.subTags).toContain('Dietética');
    });

    // Remove the custom chip
    await act(async () => {
      await result.current.removeSubTagFromCategory('cat-super', 'Dietética');
    });

    await waitFor(() => {
      const superCat = result.current.categories.find((c) => c.id === 'cat-super');
      expect(superCat?.subTags).not.toContain('Dietética');
    });

    // Customize cat-hija to Mascotas for a general audience user
    await act(async () => {
      await result.current.updateCategory('cat-hija', {
        name: 'Mascotas',
        icon: 'PawPrint',
      });
    });

    await waitFor(() => {
      const updatedCat = result.current.categories.find((c) => c.id === 'cat-hija');
      expect(updatedCat?.name).toBe('Mascotas');
      expect(updatedCat?.icon).toBe('PawPrint');
    });
  });

  it('validates and sanitizes backup payloads in restoreBackup, rejecting malformed records', async () => {
    const { result } = renderHook(() => useBudget(), { wrapper });

    await waitFor(() => {
      expect(result.current.categories.length).toBeGreaterThan(0);
    });

    // Reject payload without valid collections
    await expect(
      result.current.restoreBackup({} as unknown as Parameters<typeof result.current.restoreBackup>[0])
    ).rejects.toThrow(/colecciones válidas/i);

    // Import mixed valid and malformed transactions
    await act(async () => {
      await result.current.restoreBackup({
        transactions: [
          {
            id: 'valid-tx-1',
            amount: 15000,
            type: 'expense',
            categoryId: 'cat-super',
            currency: 'ARS',
            exchangeRate: 1400,
            date: '2026-10-18',
            note: 'Compra válida',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          // Malformed record with NaN amount and invalid date should be filtered out
          {
            id: 'corrupt-tx-2',
            amount: Number.NaN,
            type: 'expense',
            categoryId: 'cat-super',
            currency: 'ARS',
            exchangeRate: 1400,
            date: 'invalid-date',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      });
    });

    const validInDb = await db.transactions.get('valid-tx-1');
    const corruptInDb = await db.transactions.get('corrupt-tx-2');
    expect(validInDb?.amount).toBe(15000);
    expect(corruptInDb).toBeUndefined();
  });
});


