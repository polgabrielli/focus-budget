import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RecentTransactionsList } from '../Transactions/RecentTransactionsList';
import { BudgetProvider, useBudget } from '../../context/BudgetContext';
import { db } from '../../db/db';

const TestListWrapper: React.FC = () => {
  const { addTransaction } = useBudget();

  return (
    <div>
      <button
        onClick={async () => {
          await addTransaction({
            amount: 7200,
            categoryId: 'cat-hija',
            subTag: 'Pañales/Farmacia',
            note: 'Óleo y toallitas',
          });
        }}
      >
        Agregar Movimiento
      </button>
      <RecentTransactionsList />
    </div>
  );
};

describe('RecentTransactionsList Component', () => {
  beforeEach(async () => {
    await db.transactions.clear();
    await db.categories.clear();
  });

  it('renders friendly empty state when there are no transactions', () => {
    render(
      <BudgetProvider>
        <RecentTransactionsList />
      </BudgetProvider>
    );

    expect(screen.getByText(/No hay registros/i)).toBeInTheDocument();
  });

  it('displays recorded transaction with category, subTag, and note', async () => {
    render(
      <BudgetProvider>
        <TestListWrapper />
      </BudgetProvider>
    );

    fireEvent.click(screen.getByText('Agregar Movimiento'));

    await waitFor(() => {
      expect(screen.getByText('Hija')).toBeInTheDocument();
      expect(screen.getByText('Pañales/Farmacia')).toBeInTheDocument();
      expect(screen.getByText(/"Óleo y toallitas"/i)).toBeInTheDocument();
      expect(screen.getByText('-$ 7.200')).toBeInTheDocument();
    });
  });

  it('removes transaction when clicking the delete button', async () => {
    render(
      <BudgetProvider>
        <TestListWrapper />
      </BudgetProvider>
    );

    fireEvent.click(screen.getByText('Agregar Movimiento'));

    await waitFor(() => {
      expect(screen.getByText('Hija')).toBeInTheDocument();
    });

    const deleteBtn = screen.getByTitle('Eliminar registro');
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(screen.queryByText('Hija')).not.toBeInTheDocument();
      expect(screen.getByText(/No hay registros/i)).toBeInTheDocument();
    });
  });
});
