import { describe, it, expect } from 'vitest';
import { buildLocalAiPrompt } from '../aiPromptService';
import { type Transaction, type Category, type Commitment, type Reminder } from '../../types';

describe('aiPromptService', () => {
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
      id: '1',
      amount: 45000,
      type: 'expense',
      categoryId: 'cat-super',
      currency: 'ARS',
      exchangeRate: 1400,
      date: '2026-10-10',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: '2',
      amount: 30000,
      type: 'expense',
      categoryId: 'cat-hija',
      subTag: 'Pañales/Farmacia',
      currency: 'ARS',
      exchangeRate: 1400,
      date: '2026-10-12',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockCommitments: Commitment[] = [
    {
      id: 'c1',
      title: 'Préstamo Auto',
      counterpart: 'Banco',
      type: 'debt',
      totalAmount: 100000,
      paidAmount: 60000,
      currency: 'ARS',
      isCompleted: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  const mockReminders: Reminder[] = [
    {
      id: 'r1',
      title: 'Fibertel',
      amount: 15000,
      currency: 'ARS',
      dueDate: '2026-10-25',
      categoryId: 'cat-hogar',
      isRecurring: true,
      status: 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  it('generates a structured non-punitive Markdown prompt with ADHD guidelines', () => {
    const prompt = buildLocalAiPrompt({
      periodLabel: 'Octubre 2026',
      currency: 'ARS',
      transactions: mockTransactions,
      categories: mockCategories,
      commitments: mockCommitments,
      reminders: mockReminders,
      totals: {
        income: 200000,
        expense: 75000,
        balance: 125000,
      },
      freedomPercentage: 60,
    });

    expect(prompt).toContain('# 🧠 REVISIÓN FINANCIERA — COACHING AMABLE TDAH');
    expect(prompt).toContain('Cero culpa, cero sermones o reproches');
    expect(prompt).toContain('Octubre 2026');
    expect(prompt).toContain('**Ingresos Totales:** $ 200.000');
    expect(prompt).toContain('**Gastos Totales:** $ 75.000');
    expect(prompt).toContain('**Balance Neto:** $ 125.000');
    expect(prompt).toContain('60% libre de deudas');

    // Desglose categorías
    expect(prompt).toContain('Súper y Casa');
    expect(prompt).toContain('Pañales/Farmacia');

    // Préstamos y vencimientos
    expect(prompt).toContain('Préstamo Auto');
    expect(prompt).toContain('Fibertel');

    // 4 peticiones para la IA
    expect(prompt).toContain('Celebrar las Victorias');
    expect(prompt).toContain('Análisis de Fricción e Impulsos');
    expect(prompt).toContain('Claridad sobre los gastos de mi Hija');
    expect(prompt).toContain('Plan de 3 Pasos para la Próxima Semana');
  });
});
