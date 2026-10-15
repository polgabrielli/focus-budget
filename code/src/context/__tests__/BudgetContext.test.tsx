import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { BudgetProvider, useBudget } from '../BudgetContext';
import { db } from '../../db/db';

const wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BudgetProvider>{children}</BudgetProvider>
);

describe('BudgetContext & Calculations', () => {
  beforeEach(async () => {
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
});
