import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UndoToast } from '../Common/UndoToast';
import { BudgetProvider, useBudget } from '../../context/BudgetContext';
import { db } from '../../db/db';

const TestUndoTrigger: React.FC = () => {
  const { addTransaction } = useBudget();

  return (
    <div>
      <button
        onClick={() =>
          addTransaction({
            amount: 3200,
            categoryId: 'cat-super',
          })
        }
      >
        Guardar Gasto Test
      </button>
      <UndoToast />
    </div>
  );
};

describe('UndoToast Component (5-second safety net)', () => {
  beforeEach(async () => {
    await db.transactions.clear();
    await db.categories.clear();
  });

  it('is hidden initially', () => {
    render(
      <BudgetProvider>
        <UndoToast />
      </BudgetProvider>
    );

    expect(screen.queryByText(/Deshacer/i)).not.toBeInTheDocument();
  });

  it('appears immediately after registering a transaction with the correct amount', async () => {
    render(
      <BudgetProvider>
        <TestUndoTrigger />
      </BudgetProvider>
    );

    fireEvent.click(screen.getByText('Guardar Gasto Test'));

    await waitFor(() => {
      expect(screen.getByText(/Guardado:/i)).toBeInTheDocument();
      expect(screen.getByText(/3200/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Deshacer/i })).toBeInTheDocument();
    });
  });

  it('reverts/deletes the transaction when clicking "Deshacer"', async () => {
    render(
      <BudgetProvider>
        <TestUndoTrigger />
      </BudgetProvider>
    );

    // Save
    fireEvent.click(screen.getByText('Guardar Gasto Test'));

    await waitFor(async () => {
      const count = await db.transactions.count();
      expect(count).toBe(1);
    });

    // Click Undo
    const undoBtn = screen.getByRole('button', { name: /Deshacer/i });
    fireEvent.click(undoBtn);

    // Should be deleted
    await waitFor(async () => {
      const count = await db.transactions.count();
      expect(count).toBe(0);
    });

    // Toast should disappear
    expect(screen.queryByText(/Deshacer/i)).not.toBeInTheDocument();
  });
});
