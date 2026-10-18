import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ReportsAndAiModal } from '../Export/ReportsAndAiModal';
import { BudgetProvider } from '../../context/BudgetContext';
import { db } from '../../db/db';

describe('ReportsAndAiModal Component (Fase 4)', () => {
  beforeEach(async () => {
    await db.transactions.clear();
    await db.categories.clear();
    await db.commitments.clear();
    await db.reminders.clear();
  });

  it('renders all 3 tabs: Excel/CSV, IA Local, and Wi-Fi Sync', () => {
    render(
      <BudgetProvider>
        <ReportsAndAiModal onClose={vi.fn()} />
      </BudgetProvider>
    );

    expect(screen.getByRole('button', { name: /Excel \/ CSV/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /IA Local/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Wi-Fi Sync/i })).toBeInTheDocument();
  });

  it('allows switching to IA Local tab and copying the prompt', async () => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    render(
      <BudgetProvider>
        <ReportsAndAiModal onClose={vi.fn()} />
      </BudgetProvider>
    );

    // Switch to IA Local tab
    fireEvent.click(screen.getByRole('button', { name: /IA Local/i }));

    expect(screen.getAllByText(/LM Studio/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/Vista previa del prompt/i)).toBeInTheDocument();

    // Click copy button
    const copyBtn = screen.getByRole('button', { name: /Copiar Prompt para LM Studio \/ Ollama/i });
    fireEvent.click(copyBtn);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
  });

  it('allows switching to Wi-Fi Sync tab and blocks external non-LAN URLs for security', async () => {
    render(
      <BudgetProvider>
        <ReportsAndAiModal onClose={vi.fn()} />
      </BudgetProvider>
    );

    // Switch to Wi-Fi Sync tab
    fireEvent.click(screen.getByRole('button', { name: /Wi-Fi Sync/i }));

    expect(screen.getByText(/Sincronización Local Wi-Fi con PC/i)).toBeInTheDocument();
    const urlInput = screen.getByPlaceholderText(/192\.168/i);
    expect(urlInput).toBeInTheDocument();

    // Attempt to sync to a public external domain (should be blocked before network fetch)
    fireEvent.change(urlInput, { target: { value: 'https://evil-external-site.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Enviar Copia a mi PC/i }));

    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent(/solo permite direcciones de tu red local/i);
    });
  });
});
