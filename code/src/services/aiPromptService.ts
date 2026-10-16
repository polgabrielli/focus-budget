import { 
  type Transaction, 
  type Category, 
  type Commitment, 
  type Reminder 
} from '../types';

export interface PromptGenerationData {
  periodLabel: string;
  currency: string;
  transactions: Transaction[];
  categories: Category[];
  commitments: Commitment[];
  reminders: Reminder[];
  totals: {
    income: number;
    expense: number;
    balance: number;
  };
  freedomPercentage: number;
  exchangeRate?: number;
}

/**
 * Builds a structured, non-punitive Markdown prompt tailored for local LLMs
 * (LM Studio / Ollama) with coaching guidelines designed for ADHD / TDAH minds.
 */
export function buildLocalAiPrompt(data: PromptGenerationData): string {
  const {
    periodLabel,
    currency,
    transactions,
    categories,
    commitments,
    reminders,
    totals,
    freedomPercentage,
    exchangeRate = 1400,
  } = data;

  const symbol = currency === 'ARS' ? '$' : 'US$';
  const format = (val: number) =>
    new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 }).format(val);

  // Group expenses by category (converting to target currency)
  const categoryTotals: Record<string, { name: string; amount: number; count: number }> = {};
  const hijaSubTags: Record<string, number> = {};

  transactions
    .filter((t) => !t.deletedAt && t.type === 'expense')
    .forEach((tx) => {
      const cat = categories.find((c) => c.id === tx.categoryId);
      const name = cat?.name || 'Otro';

      let convertedAmount = tx.amount;
      const rateToUse = tx.exchangeRate || exchangeRate;
      if (tx.currency !== currency) {
        if (currency === 'ARS' && tx.currency === 'USD') {
          convertedAmount = tx.amount * rateToUse;
        } else if (currency === 'USD' && tx.currency === 'ARS') {
          convertedAmount = rateToUse > 0 ? tx.amount / rateToUse : 0;
        }
      }

      if (!categoryTotals[tx.categoryId]) {
        categoryTotals[tx.categoryId] = { name, amount: 0, count: 0 };
      }
      categoryTotals[tx.categoryId].amount += convertedAmount;
      categoryTotals[tx.categoryId].count += 1;

      // Special breakdown for Hija
      if (tx.categoryId === 'cat-hija') {
        const tag = tx.subTag || 'General / Sin sub-etiqueta';
        hijaSubTags[tag] = (hijaSubTags[tag] || 0) + convertedAmount;
      }
    });

  const sortedCategories = Object.values(categoryTotals).sort((a, b) => b.amount - a.amount);

  // Debts summary
  const activeDebts = commitments.filter((c) => c.type === 'debt' && !c.isCompleted);
  const activeCredits = commitments.filter((c) => c.type === 'credit' && !c.isCompleted);

  // Upcoming Reminders
  const activeReminders = reminders.filter((r) => r.status === 'pending');

  return `
# 🧠 REVISIÓN FINANCIERA — COACHING AMABLE TDAH (FOCUS BUDGET)

> **Rol para la IA:** Actúa como un mentor financiero empático, comprensivo y constructivo, especializado en psicología del TDAH.
> **Reglas fundamentales de respuesta:**
> 1. **Cero culpa, cero sermones o reproches:** Las personas con TDAH lidiamos a menudo con sobrecarga cognitiva y fatiga decisional. El dinero es una herramienta para la vida, no una prueba moral.
> 2. **Refuerzo positivo primero:** Destaca los logros, los días de bajo gasto y el avance hacia la libertad financiera.
> 3. **Estrategias de fricción cero:** Si sugieres mejoras, no propongas planillas complejas ni privaciones extremas. Propón pequeños "hacks" cotidianos para reducir la compra por conveniencia o impulsividad.
> 4. **Claridad cristalina para la familia:** Asegura un resumen transparente sobre los gastos dedicados a mi hija.

---

## 📊 1. Resumen del Período: ${periodLabel}

* **Moneda de análisis:** ${currency} (${symbol})
* **Ingresos Totales:** ${symbol} ${format(totals.income)}
* **Gastos Totales:** ${symbol} ${format(totals.expense)}
* **Balance Neto:** ${symbol} ${format(totals.balance)} ${totals.balance >= 0 ? '(Superávit positivo 🎉)' : '(Déficit a compensar 🛡️)'}
* **Índice de Libertad de Deudas:** ${Math.round(freedomPercentage)}% libre de deudas

---

## 🛒 2. Desglose de Gastos por Categoría

${
  sortedCategories.length > 0
    ? sortedCategories
        .map(
          (c) =>
            `* **${c.name}:** ${symbol} ${format(c.amount)} (${c.count} transacciones) — ${
              totals.expense > 0 ? Math.round((c.amount / totals.expense) * 100) : 0
            }% del gasto total`
        )
        .join('\n')
    : '* Sin gastos registrados en este período.'
}

${
  Object.keys(hijaSubTags).length > 0
    ? `
### 👶 Desglose Exclusivo — Gastos de mi Hija:
${Object.entries(hijaSubTags)
  .map(([tag, amt]) => `  - **${tag}:** ${symbol} ${format(amt)}`)
  .join('\n')}
`
    : ''
}

---

## 🤝 3. Estado de Compromisos y Préstamos

* **Deudas activas por pagar (${activeDebts.length}):**
${
  activeDebts.length > 0
    ? activeDebts
        .map(
          (d) =>
            `  - **${d.title} (${d.counterpart}):** Restan ${d.currency === 'ARS' ? '$' : 'US$'} ${format(
              d.totalAmount - d.paidAmount
            )} (Pagado: ${Math.round((d.paidAmount / d.totalAmount) * 100)}%${
              d.installmentsTotal ? ` | Cuota ${d.installmentsPaid || 0}/${d.installmentsTotal}` : ''
            })`
        )
        .join('\n')
    : '  - *¡Sin deudas activas!*'
}

* **Préstamos que me deben cobrar (${activeCredits.length}):**
${
  activeCredits.length > 0
    ? activeCredits
        .map(
          (c) =>
            `  - **${c.title} (${c.counterpart}):** Pendiente de cobro ${c.currency === 'ARS' ? '$' : 'US$'} ${format(
              c.totalAmount - c.paidAmount
            )}`
        )
        .join('\n')
    : '  - *Sin préstamos pendientes a cobrar.*'
}

---

## ⏱️ 4. Radar de Vencimientos Próximos

${
  activeReminders.length > 0
    ? activeReminders
        .map(
          (r) =>
            `* **${r.title}:** ${r.currency === 'ARS' ? '$' : 'US$'} ${format(r.amount)} — Fecha: ${r.dueDate}${
              r.isRecurring ? ' (Recurrente mensual)' : ''
            }`
        )
        .join('\n')
    : '* Sin vencimientos pendientes en el radar.'
}

---

## 🎯 Lo que necesito que me respondas en tu análisis:

1. **Celebrar las Victorias:** ¿Qué cosas se hicieron bien en este período? Resalta los aciertos financieros y el avance en el desahogo de deudas.
2. **Análisis de Fricción e Impulsos:** Identifica si hubo fugas en conveniencia (ej: delivery o compras rápidas) y recomiéndame 1 o 2 trucos de muy baja fricción para el hogar sin sentir que me estoy privando.
3. **Claridad sobre los gastos de mi Hija:** Hazme un resumen ordenado y claro de cuánto representó el cuidado de mi hija este mes.
4. **Plan de 3 Pasos para la Próxima Semana:** Dame exactamente 3 acciones pequeñas, ultra concretas y sin agobio mental para la semana que entra.
`.trim();
}
