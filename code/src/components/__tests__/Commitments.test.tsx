import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CommitmentsView } from '../Commitments/CommitmentsView';
import { FreedomProgressBar } from '../Commitments/FreedomProgressBar';
import { CommitmentCard } from '../Commitments/CommitmentCard';
import { PayCommitmentModal } from '../Commitments/PayCommitmentModal';
import { BudgetProvider, useBudget } from '../../context/BudgetContext';
import { db } from '../../db/db';
import { type Commitment } from '../../types';

const TestCommitmentsIntegration: React.FC = () => {
  const { addCommitment } = useBudget();

  return (
    <div>
      <button
        onClick={async () => {
          await addCommitment({
            title: 'Préstamo Auto',
            counterpart: 'Banco Santander',
            type: 'debt',
            totalAmount: 120000,
            currency: 'ARS',
            installmentsTotal: 6,
          });
          await addCommitment({
            title: 'Préstamo Vacaciones',
            counterpart: 'Lucas Gómez',
            type: 'credit',
            totalAmount: 50000,
            currency: 'ARS',
          });
        }}
      >
        Crear Compromisos Test
      </button>
      <CommitmentsView />
    </div>
  );
};

describe('Módulo de Préstamos y Deudas (Fase 2)', () => {
  beforeEach(async () => {
    await db.commitments.clear();
    await db.transactions.clear();
    await db.categories.clear();
  });

  describe('FreedomProgressBar', () => {
    it('displays 100% freedom when there are no debts', () => {
      render(
        <BudgetProvider>
          <FreedomProgressBar type="debt" />
        </BudgetProvider>
      );

      expect(screen.getByText('100%')).toBeInTheDocument();
      expect(screen.getByText(/100% libre/i)).toBeInTheDocument();
    });
  });

  describe('CommitmentsView & Tab Navigation', () => {
    it('switches between "Debo (Pasivos)" and "Me deben (Activos)" tabs', async () => {
      render(
        <BudgetProvider>
          <TestCommitmentsIntegration />
        </BudgetProvider>
      );

      fireEvent.click(screen.getByText('Crear Compromisos Test'));

      // Initially on 'Debo' tab
      await waitFor(() => {
        expect(screen.getByText('Préstamo Auto')).toBeInTheDocument();
        expect(screen.getByText('Banco Santander')).toBeInTheDocument();
        expect(screen.queryByText('Lucas Gómez')).not.toBeInTheDocument();
      });

      // Switch to 'Me deben' tab
      fireEvent.click(screen.getByText(/Me deben/i));

      await waitFor(() => {
        expect(screen.getByText('Préstamo Vacaciones')).toBeInTheDocument();
        expect(screen.getByText('Lucas Gómez')).toBeInTheDocument();
        expect(screen.queryByText('Banco Santander')).not.toBeInTheDocument();
      });
    });

    it('opens and cancels the New Commitment modal', async () => {
      render(
        <BudgetProvider>
          <CommitmentsView />
        </BudgetProvider>
      );

      // Click Nuevo button
      fireEvent.click(screen.getByRole('button', { name: /Nuevo/i }));

      expect(screen.getByText('Nuevo Compromiso')).toBeInTheDocument();

      // Click Close
      const closeBtn = screen.getAllByRole('button').find((b) => b.querySelector('svg.lucide-x'));
      fireEvent.click(closeBtn!);

      await waitFor(() => {
        expect(screen.queryByText('Nuevo Compromiso')).not.toBeInTheDocument();
      });
    });
  });

  describe('Commitment Payment & 1-Touch Amortization Link', () => {
    it('amortizes debt, updates installment count, and creates linked expense transaction in 1 touch', async () => {
      const mockDebt: Commitment = {
        id: crypto.randomUUID(),
        title: 'Tarjeta Visa',
        counterpart: 'Banco Galicia',
        type: 'debt',
        totalAmount: 60000,
        paidAmount: 0,
        installmentsTotal: 3,
        installmentsPaid: 0,
        currency: 'ARS',
        dueDate: null,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await db.commitments.add(mockDebt);

      const handleClose = vi.fn();

      render(
        <BudgetProvider>
          <PayCommitmentModal commitment={mockDebt} onClose={handleClose} />
        </BudgetProvider>
      );

      // Pre-fills suggested installment amount: 60.000 / 3 = 20.000
      expect(screen.getByDisplayValue('20000')).toBeInTheDocument();

      // Submit payment form
      const submitBtn = screen.getByRole('button', { name: /Pagar \$ 20\.000 y Asentar en Gastos/i });
      fireEvent.submit(submitBtn.closest('form')!);

      await waitFor(async () => {
        // Commitment in DB should be updated
        const updatedCommitment = await db.commitments.get(mockDebt.id);
        expect(updatedCommitment?.paidAmount).toBe(20000);
        expect(updatedCommitment?.installmentsPaid).toBe(1);
        expect(updatedCommitment?.isCompleted).toBe(false);

        // Transaction in DB should be registered as expense with commitmentId
        const txs = await db.transactions.where('commitmentId').equals(mockDebt.id).toArray();
        expect(txs).toHaveLength(1);
        expect(txs[0].amount).toBe(20000);
        expect(txs[0].type).toBe('expense');
        expect(txs[0].subTag).toBe('Tarjeta Visa');
      });

      expect(handleClose).toHaveBeenCalled();
    });

    it('marks commitment as completed when paid in full and displays saldado badge', async () => {
      const mockDebt: Commitment = {
        id: crypto.randomUUID(),
        title: 'Préstamo Amigo',
        counterpart: 'Carlos',
        type: 'debt',
        totalAmount: 10000,
        paidAmount: 10000,
        currency: 'ARS',
        dueDate: null,
        isCompleted: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      render(
        <BudgetProvider>
          <CommitmentCard commitment={mockDebt} />
        </BudgetProvider>
      );

      expect(screen.getByText('Saldado')).toBeInTheDocument();
      expect(screen.queryByText(/Pagar Cuota/i)).not.toBeInTheDocument();
    });
  });
});
