import React, { useState } from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CategoryGrid } from '../Categories/CategoryGrid';
import { BudgetProvider } from '../../context/BudgetContext';
import { db } from '../../db/db';

const CategoryGridWrapper: React.FC<{ initialAmount?: string }> = ({ initialAmount = '0' }) => {
  const [amountStr, setAmountStr] = useState(initialAmount);
  const [note, setNote] = useState('');
  const [, setIsNoteOpen] = useState(false);

  return (
    <BudgetProvider>
      <div data-testid="current-amount">{amountStr}</div>
      <CategoryGrid
        amountStr={amountStr}
        setAmountStr={setAmountStr}
        note={note}
        setNote={setNote}
        setIsNoteOpen={setIsNoteOpen}
      />
    </BudgetProvider>
  );
};

describe('CategoryGrid Component (2-Touch Rule & Anti-Parálisis)', () => {
  beforeEach(async () => {
    await db.transactions.clear();
    await db.categories.clear();
  });

  it('displays warning when clicking category with amount 0', async () => {
    render(<CategoryGridWrapper initialAmount="0" />);

    await waitFor(() => {
      expect(screen.getByText('Súper y Casa')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Súper y Casa'));

    // Should display warning
    expect(screen.getByText(/¡Escribe un monto primero!/i)).toBeInTheDocument();

    // No transactions saved in DB
    const count = await db.transactions.count();
    expect(count).toBe(0);
  });

  it('saves instantly when clicking a category with amount > 0 (The 2-Touch Rule)', async () => {
    render(<CategoryGridWrapper initialAmount="2500" />);

    await waitFor(() => {
      expect(screen.getByText('Súper y Casa')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Súper y Casa'));

    await waitFor(async () => {
      const txs = await db.transactions.toArray();
      expect(txs).toHaveLength(1);
      expect(txs[0].amount).toBe(2500);
      expect(txs[0].categoryId).toBe('cat-super');
    });

    // Keypad amount should be reset to '0'
    expect(screen.getByTestId('current-amount')).toHaveTextContent('0');
  });

  it('renders "Después veo ⏳" anti-parálisis category and saves instantly', async () => {
    render(<CategoryGridWrapper initialAmount="800" />);

    await waitFor(() => {
      expect(screen.getByText('Después veo ⏳')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Después veo ⏳'));

    await waitFor(async () => {
      const txs = await db.transactions.toArray();
      expect(txs).toHaveLength(1);
      expect(txs[0].amount).toBe(800);
      expect(txs[0].categoryId).toBe('cat-despues-veo');
    });
  });

  it('expands sub-tags for "Hija" and saves with chosen subTag', async () => {
    render(<CategoryGridWrapper initialAmount="15000" />);

    await waitFor(() => {
      expect(screen.getByText('Hija')).toBeInTheDocument();
    });

    // Click Hija category
    fireEvent.click(screen.getByText('Hija'));

    // Should display sub-tags
    await waitFor(() => {
      expect(screen.getByText('Pañales/Farmacia')).toBeInTheDocument();
      expect(screen.getByText('Niñera')).toBeInTheDocument();
      expect(screen.getByText('Cuota')).toBeInTheDocument();
    });

    // Click 'Pañales/Farmacia'
    fireEvent.click(screen.getByText('Pañales/Farmacia'));

    await waitFor(async () => {
      const txs = await db.transactions.toArray();
      expect(txs).toHaveLength(1);
      expect(txs[0].amount).toBe(15000);
      expect(txs[0].categoryId).toBe('cat-hija');
      expect(txs[0].subTag).toBe('Pañales/Farmacia');
    });

    // Reset amount
    expect(screen.getByTestId('current-amount')).toHaveTextContent('0');
  });
});
