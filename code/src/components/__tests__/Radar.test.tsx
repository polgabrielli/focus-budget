import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RadarWidget } from '../Radar/RadarWidget';
import { RemindersView } from '../Radar/RemindersView';
import { BudgetProvider, useBudget } from '../../context/BudgetContext';
import { db } from '../../db/db';

const TestRadarWrapper: React.FC = () => {
  const { addReminder } = useBudget();

  return (
    <div>
      <button
        onClick={async () => {
          await addReminder({
            title: 'Internet Fibertel',
            amount: 22000,
            currency: 'ARS',
            dueDate: '2026-10-20',
            categoryId: 'cat-hogar',
            isRecurring: true,
          });
        }}
      >
        Crear Vencimiento Test
      </button>
      <RadarWidget />
      <RemindersView />
    </div>
  );
};

describe('Radar de Vencimientos & Sincronización (Fase 3)', () => {
  beforeEach(async () => {
    await db.reminders.clear();
    await db.transactions.clear();
    await db.categories.clear();
  });

  describe('RadarWidget', () => {
    it('does not render when there are no active reminders', () => {
      const { container } = render(
        <BudgetProvider>
          <RadarWidget />
        </BudgetProvider>
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders horizontal card when a reminder is active and displays service info', async () => {
      render(
        <BudgetProvider>
          <TestRadarWrapper />
        </BudgetProvider>
      );

      fireEvent.click(screen.getByText('Crear Vencimiento Test'));

      await waitFor(() => {
        expect(screen.getAllByText('Internet Fibertel').length).toBeGreaterThan(0);
        expect(screen.getAllByText('22.000').length).toBeGreaterThan(0);
      });
    });

    it('settles bill in 1 touch, creates expense transaction in IndexedDB, and advances recurring date', async () => {
      render(
        <BudgetProvider>
          <TestRadarWrapper />
        </BudgetProvider>
      );

      fireEvent.click(screen.getByText('Crear Vencimiento Test'));

      await waitFor(() => {
        expect(screen.getAllByText('Internet Fibertel').length).toBeGreaterThan(0);
      });

      // Click "Pagar" button
      const payButtons = screen.getAllByRole('button', { name: /Pagar/i });
      fireEvent.click(payButtons[0]);

      await waitFor(async () => {
        // Transaction should be registered as expense
        const txs = await db.transactions.toArray();
        expect(txs).toHaveLength(1);
        expect(txs[0].amount).toBe(22000);
        expect(txs[0].type).toBe('expense');
        expect(txs[0].note).toContain('Internet Fibertel');

        // Recurring reminder should be advanced to next month (2026-11-20)
        const remindersInDb = await db.reminders.toArray();
        expect(remindersInDb).toHaveLength(1);
        expect(remindersInDb[0].dueDate).toBe('2026-11-20');
        expect(remindersInDb[0].status).toBe('pending');
      });
    });
  });

  describe('RemindersView', () => {
    it('creates a new reminder using the modal', async () => {
      render(
        <BudgetProvider>
          <RemindersView />
        </BudgetProvider>
      );

      // Open modal
      fireEvent.click(screen.getByRole('button', { name: /Nuevo/i }));

      // Fill form
      fireEvent.change(screen.getByPlaceholderText(/Internet Fibertel/i), {
        target: { value: 'Edenor Luz' },
      });
      fireEvent.change(screen.getByPlaceholderText('0'), {
        target: { value: '14500' },
      });

      // Submit
      fireEvent.click(screen.getByRole('button', { name: /Guardar en Radar/i }));

      await waitFor(async () => {
        const inDb = await db.reminders.where('title').equals('Edenor Luz').first();
        expect(inDb).toBeDefined();
        expect(inDb?.amount).toBe(14500);
      });
    });

    it('provides Google Calendar universal link and .ics download action', async () => {
      render(
        <BudgetProvider>
          <TestRadarWrapper />
        </BudgetProvider>
      );

      fireEvent.click(screen.getByText('Crear Vencimiento Test'));

      await waitFor(() => {
        const gCalLink = screen.getByTitle('Sincronizar evento con Google Calendar');
        expect(gCalLink).toHaveAttribute('href');
        expect(gCalLink.getAttribute('href')).toContain('calendar.google.com');

        const icsBtn = screen.getByTitle(/Descargar archivo \.ics/i);
        expect(icsBtn).toBeInTheDocument();
      });
    });
  });
});
