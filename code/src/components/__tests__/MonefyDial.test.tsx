import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MonefyDial } from '../Dial/MonefyDial';
import { BudgetProvider, useBudget } from '../../context/BudgetContext';
import { db } from '../../db/db';

const TestDialWrapper: React.FC = () => {
  const { addTransaction } = useBudget();

  return (
    <div>
      <button
        onClick={async () => {
          await addTransaction({
            amount: 50000,
            categoryId: 'cat-sueldo',
            type: 'income',
          });
          await addTransaction({
            amount: 15000,
            categoryId: 'cat-super',
            type: 'expense',
          });
        }}
      >
        Cargar Datos Dial
      </button>
      <MonefyDial />
    </div>
  );
};

describe('MonefyDial Component', () => {
  beforeEach(async () => {
    await db.transactions.clear();
    await db.categories.clear();
  });

  it('renders initial balance 0 with expense/income toggles', () => {
    render(
      <BudgetProvider>
        <MonefyDial />
      </BudgetProvider>
    );

    expect(screen.getByText('Balance Mes')).toBeInTheDocument();
    expect(screen.getByText('Gastos (-)')).toBeInTheDocument();
    expect(screen.getByText('Ingresos (+)')).toBeInTheDocument();
  });

  it('updates Net Balance, Income (+), and Expenses (-) accurately', async () => {
    render(
      <BudgetProvider>
        <TestDialWrapper />
      </BudgetProvider>
    );

    fireEvent.click(screen.getByText('Cargar Datos Dial'));

    // Net balance = 50.000 - 15.000 = 35.000
    await waitFor(() => {
      expect(screen.getByText('35.000')).toBeInTheDocument();
      expect(screen.getByText('50.000')).toBeInTheDocument();
      expect(screen.getByText('15.000')).toBeInTheDocument();
    });
  });

  it('toggles transaction mode when clicking Gastos / Ingresos', () => {
    render(
      <BudgetProvider>
        <MonefyDial />
      </BudgetProvider>
    );

    const expenseBtn = screen.getByText('Gastos (-)').closest('button');
    const incomeBtn = screen.getByText('Ingresos (+)').closest('button');

    expect(expenseBtn?.className).toContain('bg-rose-500/20');

    fireEvent.click(incomeBtn!);
    expect(incomeBtn?.className).toContain('bg-emerald-500/20');
  });
});
