import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db, seedCategories } from '../db/db';
import { 
  type Transaction, 
  type Category, 
  type TransactionType, 
  type CurrencyCode, 
  type ExchangeRateCache,
  type Commitment,
  type CommitmentType,
  type Reminder,
} from '../types';
import { fetchExchangeRate } from '../services/currencyService';

export type AppView = 'dial' | 'commitments' | 'reminders';

export interface CommitmentsSummary {
  totalDebtRemaining: number;
  totalDebtPaid: number;
  totalDebtOriginal: number;
  freedomPercentage: number;
  totalCreditRemaining: number;
  totalCreditCollected: number;
}

interface BudgetContextType {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  selectedDate: string; // YYYY-MM-DD
  datePreset: 'today' | 'yesterday' | 'custom';
  setDatePreset: (preset: 'today' | 'yesterday' | 'custom', customDate?: string) => void;
  activeCurrency: CurrencyCode;
  setActiveCurrency: (currency: CurrencyCode) => void;
  transactionType: TransactionType;
  setTransactionType: (type: TransactionType) => void;
  exchangeRate: ExchangeRateCache | null;
  transactions: Transaction[];
  allTransactionsForMonth: Transaction[];
  categories: Category[];
  activeCategories: Category[];
  commitments: Commitment[];
  commitmentsSummary: CommitmentsSummary;
  reminders: Reminder[];
  activeReminders: Reminder[];
  lastAddedTransaction: Transaction | null;
  isUndoVisible: boolean;
  addTransaction: (params: {
    amount: number;
    categoryId: string;
    subTag?: string | null;
    note?: string;
    type?: TransactionType;
    currency?: CurrencyCode;
    commitmentId?: string | null;
    date?: string;
  }) => Promise<Transaction>;
  undoLastTransaction: () => Promise<void>;
  dismissUndo: () => void;
  deleteTransaction: (id: string) => Promise<void>;
  addCommitment: (params: {
    title: string;
    counterpart: string;
    type: CommitmentType;
    totalAmount: number;
    currency: CurrencyCode;
    installmentsTotal?: number;
    dueDate?: string | null;
    notes?: string;
  }) => Promise<Commitment>;
  payCommitment: (params: {
    commitmentId: string;
    amount: number;
    categoryId?: string;
    note?: string;
    date?: string;
  }) => Promise<void>;
  deleteCommitment: (id: string) => Promise<void>;
  addReminder: (params: {
    title: string;
    amount: number;
    currency: CurrencyCode;
    dueDate: string;
    categoryId: string;
    isRecurring: boolean;
    recurrenceDay?: number | null;
  }) => Promise<Reminder>;
  payReminder: (reminderId: string, customAmount?: number, paymentDate?: string) => Promise<void>;
  deleteReminder: (id: string) => Promise<void>;
  currentTotals: {
    income: number;
    expense: number;
    balance: number;
  };
  categoryTotals: Record<string, number>;
  refreshData: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getYesterdayString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getNextMonthlyDueDate(currentDueDate: string, recurrenceDay?: number | null): string {
  const [yearStr, monthStr, dayStr] = currentDueDate.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10);
  const day = recurrenceDay || parseInt(dayStr, 10);

  month += 1;
  if (month > 12) {
    month = 1;
    year += 1;
  }

  const maxDays = new Date(year, month, 0).getDate();
  const clampedDay = Math.min(day, maxDays);

  const formattedMonth = String(month).padStart(2, '0');
  const formattedDay = String(clampedDay).padStart(2, '0');
  return `${year}-${formattedMonth}-${formattedDay}`;
}

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeView, setActiveView] = useState<AppView>('dial');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [datePreset, setDatePresetState] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>('ARS');
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateCache | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactionsForMonth, setAllTransactionsForMonth] = useState<Transaction[]>([]);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  
  // Undo mechanism (5-second window)
  const [lastAddedTransaction, setLastAddedTransaction] = useState<Transaction | null>(null);
  const [isUndoVisible, setIsUndoVisible] = useState<boolean>(false);
  const [undoTimer, setUndoTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Initialize DB and fetch exchange rate
  const initApp = useCallback(async () => {
    try {
      await seedCategories();
      const allCats = await db.categories.orderBy('sortOrder').toArray();
      setCategories(allCats);

      const rate = await fetchExchangeRate();
      setExchangeRate(rate);
    } catch (err) {
      console.error('Error initializing FocusBudget:', err);
    }
  }, []);

  // Fetch transactions, commitments, and reminders
  const refreshData = useCallback(async () => {
    try {
      const currentMonth = selectedDate.substring(0, 7); // 'YYYY-MM'

      // Get all non-deleted transactions for the current month
      const monthItems = await db.transactions
        .filter(t => !t.deletedAt && t.date.startsWith(currentMonth))
        .toArray();
      
      setAllTransactionsForMonth(monthItems);

      // Get transactions for selected date
      const dateItems = monthItems.filter(t => t.date === selectedDate);
      setTransactions(dateItems);

      // Get all non-deleted commitments
      const commItems = await db.commitments
        .filter(c => !c.deletedAt)
        .toArray();
      setCommitments(commItems);

      // Get all non-deleted reminders
      const remItems = await db.reminders
        .filter(r => !r.deletedAt)
        .toArray();
      setReminders(remItems);
    } catch (err) {
      console.error('Error refreshing data:', err);
    }
  }, [selectedDate]);

  useEffect(() => {
    initApp();
  }, [initApp]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Set date preset handler
  const setDatePreset = (preset: 'today' | 'yesterday' | 'custom', customDate?: string) => {
    setDatePresetState(preset);
    if (preset === 'today') {
      setSelectedDate(getTodayString());
    } else if (preset === 'yesterday') {
      setSelectedDate(getYesterdayString());
    } else if (preset === 'custom' && customDate) {
      setSelectedDate(customDate);
    }
  };

  // Add Transaction
  const addTransaction = async ({
    amount,
    categoryId,
    subTag,
    note,
    type,
    currency,
    commitmentId,
    date,
  }: {
    amount: number;
    categoryId: string;
    subTag?: string | null;
    note?: string;
    type?: TransactionType;
    currency?: CurrencyCode;
    commitmentId?: string | null;
    date?: string;
  }): Promise<Transaction> => {
    const nowIso = new Date().toISOString();
    const rate = exchangeRate?.venta || 1400;

    const matchedCat = categories.find((c) => c.id === categoryId);
    const finalType = type || matchedCat?.type || transactionType;
    const finalCurrency = currency || activeCurrency;

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      amount,
      type: finalType,
      categoryId,
      subTag: subTag || null,
      currency: finalCurrency,
      exchangeRate: rate,
      date: date || selectedDate,
      note: note || '',
      commitmentId: commitmentId || null,
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    };

    await db.transactions.add(newTx);

    // Set Undo Toast
    if (undoTimer) clearTimeout(undoTimer);
    setLastAddedTransaction(newTx);
    setIsUndoVisible(true);

    const timer = setTimeout(() => {
      setIsUndoVisible(false);
      setLastAddedTransaction(null);
    }, 5000);
    setUndoTimer(timer);

    await refreshData();
    return newTx;
  };

  // Undo Last Transaction
  const undoLastTransaction = async () => {
    if (!lastAddedTransaction) return;

    if (undoTimer) clearTimeout(undoTimer);
    await db.transactions.delete(lastAddedTransaction.id);
    setIsUndoVisible(false);
    setLastAddedTransaction(null);
    await refreshData();
  };

  const dismissUndo = () => {
    if (undoTimer) clearTimeout(undoTimer);
    setIsUndoVisible(false);
    setLastAddedTransaction(null);
  };

  // Delete Transaction (Soft-delete)
  const deleteTransaction = async (id: string) => {
    const tx = await db.transactions.get(id);
    if (tx) {
      await db.transactions.update(id, {
        deletedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
      await refreshData();
    }
  };

  // Add Commitment
  const addCommitment = async (params: {
    title: string;
    counterpart: string;
    type: CommitmentType;
    totalAmount: number;
    currency: CurrencyCode;
    installmentsTotal?: number;
    dueDate?: string | null;
    notes?: string;
  }): Promise<Commitment> => {
    const nowIso = new Date().toISOString();
    const newCommitment: Commitment = {
      id: crypto.randomUUID(),
      title: params.title.trim(),
      counterpart: params.counterpart.trim(),
      type: params.type,
      totalAmount: params.totalAmount,
      paidAmount: 0,
      installmentsTotal: params.installmentsTotal || undefined,
      installmentsPaid: params.installmentsTotal ? 0 : undefined,
      currency: params.currency,
      dueDate: params.dueDate || null,
      notes: params.notes || '',
      isCompleted: false,
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    };

    await db.commitments.add(newCommitment);
    await refreshData();
    return newCommitment;
  };

  // Pay Commitment (Amortization linked with Daily Transactions)
  const payCommitment = async ({
    commitmentId,
    amount,
    categoryId,
    note,
    date,
  }: {
    commitmentId: string;
    amount: number;
    categoryId?: string;
    note?: string;
    date?: string;
  }) => {
    const commitment = await db.commitments.get(commitmentId);
    if (!commitment) return;

    const newPaidAmount = commitment.paidAmount + amount;
    const isCompleted = newPaidAmount >= commitment.totalAmount;
    
    let newInstallmentsPaid = commitment.installmentsPaid;
    if (commitment.installmentsTotal) {
      newInstallmentsPaid = Math.min(
        commitment.installmentsTotal,
        (commitment.installmentsPaid || 0) + 1
      );
    }

    const nowIso = new Date().toISOString();
    await db.commitments.update(commitmentId, {
      paidAmount: newPaidAmount,
      installmentsPaid: newInstallmentsPaid,
      isCompleted,
      updatedAt: nowIso,
    });

    const txType: TransactionType = commitment.type === 'debt' ? 'expense' : 'income';
    const fallbackCategory = txType === 'expense' ? 'cat-hogar' : 'cat-otros-ingresos';
    const txCategory = categoryId || fallbackCategory;

    const installmentText = commitment.installmentsTotal 
      ? `(Cuota ${newInstallmentsPaid}/${commitment.installmentsTotal})`
      : '';
    const defaultNote = commitment.type === 'debt'
      ? `Pago cuota a ${commitment.counterpart} ${installmentText}`.trim()
      : `Cobro cuota de ${commitment.counterpart} ${installmentText}`.trim();

    await addTransaction({
      amount,
      categoryId: txCategory,
      subTag: commitment.title,
      note: note || defaultNote,
      type: txType,
      currency: commitment.currency,
      commitmentId: commitment.id,
      date: date || selectedDate,
    });

    await refreshData();
  };

  // Delete Commitment (Soft-delete)
  const deleteCommitment = async (id: string) => {
    const nowIso = new Date().toISOString();
    await db.commitments.update(id, {
      deletedAt: nowIso,
      updatedAt: nowIso,
    });
    await refreshData();
  };

  // Add Reminder (Radar de Vencimientos)
  const addReminder = async (params: {
    title: string;
    amount: number;
    currency: CurrencyCode;
    dueDate: string;
    categoryId: string;
    isRecurring: boolean;
    recurrenceDay?: number | null;
  }): Promise<Reminder> => {
    const nowIso = new Date().toISOString();
    const newReminder: Reminder = {
      id: crypto.randomUUID(),
      title: params.title.trim(),
      amount: params.amount,
      currency: params.currency,
      dueDate: params.dueDate,
      categoryId: params.categoryId,
      isRecurring: params.isRecurring,
      recurrenceDay: params.isRecurring ? (params.recurrenceDay || parseInt(params.dueDate.split('-')[2], 10)) : null,
      status: 'pending',
      paidDate: null,
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    };

    await db.reminders.add(newReminder);
    await refreshData();
    return newReminder;
  };

  // Pay Reminder (1-Touch Service Payment)
  const payReminder = async (
    reminderId: string,
    customAmount?: number,
    paymentDate?: string
  ) => {
    const reminder = await db.reminders.get(reminderId);
    if (!reminder) return;

    const nowIso = new Date().toISOString();
    const amountToPay = customAmount !== undefined ? customAmount : reminder.amount;

    // Record expense transaction
    await addTransaction({
      amount: amountToPay,
      categoryId: reminder.categoryId,
      subTag: reminder.title,
      note: `Pago de servicio: ${reminder.title}`,
      type: 'expense',
      currency: reminder.currency,
      date: paymentDate || selectedDate,
    });

    if (reminder.isRecurring) {
      const nextDueDate = getNextMonthlyDueDate(reminder.dueDate, reminder.recurrenceDay);
      await db.reminders.update(reminderId, {
        dueDate: nextDueDate,
        paidDate: nowIso,
        updatedAt: nowIso,
        status: 'pending', // rolls over to next month's radar!
      });
    } else {
      await db.reminders.update(reminderId, {
        status: 'paid',
        paidDate: nowIso,
        updatedAt: nowIso,
      });
    }

    await refreshData();
  };

  // Delete Reminder (Soft-delete)
  const deleteReminder = async (id: string) => {
    const nowIso = new Date().toISOString();
    await db.reminders.update(id, {
      deletedAt: nowIso,
      updatedAt: nowIso,
    });
    await refreshData();
  };

  // Active sorted reminders for the Radar
  const activeReminders = useMemo(() => {
    return reminders
      .filter(r => r.status === 'pending' && !r.deletedAt)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [reminders]);

  // Filter categories by current transaction type (expense vs income)
  const activeCategories = useMemo(() => {
    return categories.filter(c => c.type === transactionType);
  }, [categories, transactionType]);

  // Calculate Totals for the current month
  const currentTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    const rate = exchangeRate?.venta || 1400;

    allTransactionsForMonth.forEach(tx => {
      let val = tx.amount;
      if (tx.currency !== activeCurrency) {
        if (activeCurrency === 'ARS' && tx.currency === 'USD') {
          val = val * (tx.exchangeRate || rate);
        } else if (activeCurrency === 'USD' && tx.currency === 'ARS') {
          val = (tx.exchangeRate || rate) > 0 ? val / (tx.exchangeRate || rate) : 0;
        }
      }

      if (tx.type === 'income') {
        income += val;
      } else {
        expense += val;
      }
    });

    return {
      income,
      expense,
      balance: income - expense,
    };
  }, [allTransactionsForMonth, activeCurrency, exchangeRate]);

  // Calculate category totals for the donut dial
  const categoryTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    const rate = exchangeRate?.venta || 1400;

    allTransactionsForMonth
      .filter(tx => tx.type === transactionType)
      .forEach(tx => {
        let val = tx.amount;
        if (tx.currency !== activeCurrency) {
          if (activeCurrency === 'ARS' && tx.currency === 'USD') {
            val = val * (tx.exchangeRate || rate);
          } else if (activeCurrency === 'USD' && tx.currency === 'ARS') {
            val = (tx.exchangeRate || rate) > 0 ? val / (tx.exchangeRate || rate) : 0;
          }
        }
        totals[tx.categoryId] = (totals[tx.categoryId] || 0) + val;
      });

    return totals;
  }, [allTransactionsForMonth, transactionType, activeCurrency, exchangeRate]);

  // Calculate Commitments & Freedom Metrics
  const commitmentsSummary = useMemo<CommitmentsSummary>(() => {
    let totalDebtRemaining = 0;
    let totalDebtPaid = 0;
    let totalDebtOriginal = 0;
    let totalCreditRemaining = 0;
    let totalCreditCollected = 0;

    const rate = exchangeRate?.venta || 1400;

    commitments.forEach(c => {
      let total = c.totalAmount;
      let paid = c.paidAmount;

      if (c.currency !== activeCurrency) {
        if (activeCurrency === 'ARS' && c.currency === 'USD') {
          total = total * rate;
          paid = paid * rate;
        } else if (activeCurrency === 'USD' && c.currency === 'ARS') {
          total = rate > 0 ? total / rate : 0;
          paid = rate > 0 ? paid / rate : 0;
        }
      }

      const remaining = Math.max(0, total - paid);

      if (c.type === 'debt') {
        totalDebtOriginal += total;
        totalDebtPaid += paid;
        if (!c.isCompleted) {
          totalDebtRemaining += remaining;
        }
      } else {
        totalCreditCollected += paid;
        if (!c.isCompleted) {
          totalCreditRemaining += remaining;
        }
      }
    });

    const freedomPercentage = totalDebtOriginal > 0 
      ? Math.min(100, (totalDebtPaid / totalDebtOriginal) * 100) 
      : 100;

    return {
      totalDebtRemaining,
      totalDebtPaid,
      totalDebtOriginal,
      freedomPercentage,
      totalCreditRemaining,
      totalCreditCollected,
    };
  }, [commitments, activeCurrency, exchangeRate]);

  return (
    <BudgetContext.Provider
      value={{
        activeView,
        setActiveView,
        selectedDate,
        datePreset,
        setDatePreset,
        activeCurrency,
        setActiveCurrency,
        transactionType,
        setTransactionType,
        exchangeRate,
        transactions,
        allTransactionsForMonth,
        categories,
        activeCategories,
        commitments,
        commitmentsSummary,
        reminders,
        activeReminders,
        lastAddedTransaction,
        isUndoVisible,
        addTransaction,
        undoLastTransaction,
        dismissUndo,
        deleteTransaction,
        addCommitment,
        payCommitment,
        deleteCommitment,
        addReminder,
        payReminder,
        deleteReminder,
        currentTotals,
        categoryTotals,
        refreshData,
      }}
    >
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = (): BudgetContextType => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within a BudgetProvider');
  }
  return context;
};
