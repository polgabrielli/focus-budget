import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { fetchExchangeRate, convertAmount } from '../services/currencyService';

export type AppView = 'dial' | 'commitments' | 'reminders';

export interface CommitmentsSummary {
  totalDebtRemaining: number;
  totalDebtPaid: number;
  totalDebtOriginal: number;
  freedomPercentage: number;
  totalCreditRemaining: number;
  totalCreditCollected: number;
}

export interface KeypadDraft {
  isOpen: boolean;
  categoryId?: string | null;
  subTag?: string | null;
  initialAmount?: string;
  initialNote?: string;
  initialCurrency?: CurrencyCode;
  editingTransaction?: Transaction | null;
  reminderToPay?: Reminder | null;
}

interface UndoSnapshot {
  action: 'add' | 'delete';
  transaction: Transaction;
  previousCommitment?: Commitment | null;
  previousReminder?: Reminder | null;
}

interface BudgetContextType {
  activeView: AppView;
  setActiveView: (view: AppView) => void;
  selectedDate: string; // YYYY-MM-DD
  datePreset: 'today' | 'yesterday' | 'custom';
  setDatePreset: (preset: 'today' | 'yesterday' | 'custom', customDate?: string) => void;
  shiftMonth: (delta: -1 | 1) => void;
  activeCurrency: CurrencyCode;
  setActiveCurrency: (currency: CurrencyCode) => void;
  transactionType: TransactionType;
  setTransactionType: (type: TransactionType) => void;
  exchangeRate: ExchangeRateCache | null;
  refreshExchangeRate: () => Promise<void>;
  transactions: Transaction[];
  allTransactionsForMonth: Transaction[];
  categories: Category[];
  activeCategories: Category[];
  commitments: Commitment[];
  commitmentsSummary: CommitmentsSummary;
  reminders: Reminder[];
  activeReminders: Reminder[];
  lastAddedTransaction: Transaction | null;
  lastUndoAction: 'add' | 'delete';
  isUndoVisible: boolean;
  keypadDraft: KeypadDraft;
  openKeypad: (draft?: Partial<Omit<KeypadDraft, 'isOpen'>>) => void;
  closeKeypad: () => void;
  addTransaction: (params: {
    amount: number;
    categoryId: string;
    subTag?: string | null;
    note?: string;
    type?: TransactionType;
    currency?: CurrencyCode;
    exchangeRate?: number;
    commitmentId?: string | null;
    reminderId?: string | null;
    date?: string;
  }) => Promise<Transaction>;
  updateTransaction: (
    id: string,
    updates: Partial<Pick<Transaction, 'amount' | 'categoryId' | 'subTag' | 'note' | 'date' | 'currency' | 'type' | 'exchangeRate'>>
  ) => Promise<void>;
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
  restoreBackup: (payload: {
    transactions?: Transaction[];
    categories?: Category[];
    commitments?: Commitment[];
    reminders?: Reminder[];
  }) => Promise<void>;
  currentTotals: {
    income: number;
    expense: number;
    balance: number;
  };
  categoryTotals: Record<string, number>;
  refreshData: () => Promise<void>;
}

const BudgetContext = createContext<BudgetContextType | undefined>(undefined);

/**
 * Generates a RFC4122 v4 UUID even on non-HTTPS LAN origins where crypto.randomUUID is undefined.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayString(): string {
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

  // Global Keypad Sheet Draft (Monefy-style category -> keypad flow)
  const [keypadDraft, setKeypadDraft] = useState<KeypadDraft>({
    isOpen: false,
    categoryId: null,
    subTag: null,
    initialAmount: '0',
    initialNote: '',
    editingTransaction: null,
    reminderToPay: null,
  });

  // Undo mechanism (5-second window) with full side-effect reversal
  const [lastAddedTransaction, setLastAddedTransaction] = useState<Transaction | null>(null);
  const [lastUndoAction, setLastUndoAction] = useState<'add' | 'delete'>('add');
  const [isUndoVisible, setIsUndoVisible] = useState<boolean>(false);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const undoSnapshotRef = useRef<UndoSnapshot | null>(null);

  const triggerUndoBanner = useCallback((snapshot: UndoSnapshot) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoSnapshotRef.current = snapshot;
    setLastAddedTransaction(snapshot.transaction);
    setLastUndoAction(snapshot.action);
    setIsUndoVisible(true);

    undoTimerRef.current = setTimeout(() => {
      setIsUndoVisible(false);
      setLastAddedTransaction(null);
      undoSnapshotRef.current = null;
    }, 5000);
  }, []);

  const openKeypad = useCallback((draft?: Partial<Omit<KeypadDraft, 'isOpen'>>) => {
    setKeypadDraft({
      isOpen: true,
      categoryId: draft?.categoryId ?? null,
      subTag: draft?.subTag ?? null,
      initialAmount: draft?.initialAmount ?? '0',
      initialNote: draft?.initialNote ?? '',
      initialCurrency: draft?.initialCurrency,
      editingTransaction: draft?.editingTransaction ?? null,
      reminderToPay: draft?.reminderToPay ?? null,
    });
  }, []);

  const closeKeypad = useCallback(() => {
    setKeypadDraft((prev) => ({
      ...prev,
      isOpen: false,
      editingTransaction: null,
      reminderToPay: null,
    }));
  }, []);

  const refreshExchangeRate = useCallback(async () => {
    const rate = await fetchExchangeRate();
    setExchangeRate(rate);
  }, []);

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

  // Keep "Today" fresh when returning from background on iOS PWA
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && datePreset === 'today') {
        const currentToday = getTodayString();
        setSelectedDate((prev) => (prev !== currentToday ? currentToday : prev));
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [datePreset]);

  // Fetch transactions, commitments, and reminders using indexed queries where possible
  const refreshData = useCallback(async () => {
    try {
      const currentMonth = selectedDate.substring(0, 7); // 'YYYY-MM'

      const monthItems = await db.transactions
        .where('date')
        .startsWith(currentMonth)
        .filter((t) => !t.deletedAt)
        .toArray();

      // Sort newest first (by date desc, then createdAt desc)
      monthItems.sort((a, b) => {
        const dateCmp = b.date.localeCompare(a.date);
        if (dateCmp !== 0) return dateCmp;
        return b.createdAt.localeCompare(a.createdAt);
      });

      setAllTransactionsForMonth(monthItems);

      const dateItems = monthItems.filter((t) => t.date === selectedDate);
      setTransactions(dateItems);

      const commItems = await db.commitments
        .filter((c) => !c.deletedAt)
        .toArray();
      setCommitments(commItems);

      const remItems = await db.reminders
        .filter((r) => !r.deletedAt)
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

  // Shift active month backward or forward
  const shiftMonth = (delta: -1 | 1) => {
    const [yearStr, monthStr] = selectedDate.split('-');
    let year = parseInt(yearStr, 10);
    let month = parseInt(monthStr, 10) + delta;
    if (month < 1) {
      month = 12;
      year -= 1;
    } else if (month > 12) {
      month = 1;
      year += 1;
    }
    const today = getTodayString();
    const targetPrefix = `${year}-${String(month).padStart(2, '0')}`;
    if (today.startsWith(targetPrefix)) {
      setDatePresetState('today');
      setSelectedDate(today);
    } else {
      setDatePresetState('custom');
      setSelectedDate(`${targetPrefix}-01`);
    }
  };

  // Internal helper to add transaction with optional side-effect undo snapshot
  const addTransactionInternal = async (
    {
      amount,
      categoryId,
      subTag,
      note,
      type,
      currency,
      exchangeRate: customRate,
      commitmentId,
      reminderId,
      date,
    }: {
      amount: number;
      categoryId: string;
      subTag?: string | null;
      note?: string;
      type?: TransactionType;
      currency?: CurrencyCode;
      exchangeRate?: number;
      commitmentId?: string | null;
      reminderId?: string | null;
      date?: string;
    },
    sideEffects?: {
      previousCommitment?: Commitment | null;
      previousReminder?: Reminder | null;
    }
  ): Promise<Transaction> => {
    const nowIso = new Date().toISOString();
    const rate = customRate || exchangeRate?.venta || 1400;

    const matchedCat = categories.find((c) => c.id === categoryId);
    const finalType = type || matchedCat?.type || transactionType;
    const finalCurrency = currency || activeCurrency;

    const newTx: Transaction = {
      id: generateUUID(),
      amount,
      type: finalType,
      categoryId,
      subTag: subTag || null,
      currency: finalCurrency,
      exchangeRate: rate,
      date: date || selectedDate,
      note: note || '',
      commitmentId: commitmentId || null,
      reminderId: reminderId || null,
      createdAt: nowIso,
      updatedAt: nowIso,
      deletedAt: null,
    };

    await db.transactions.add(newTx);

    triggerUndoBanner({
      action: 'add',
      transaction: newTx,
      previousCommitment: sideEffects?.previousCommitment || null,
      previousReminder: sideEffects?.previousReminder || null,
    });

    await refreshData();
    return newTx;
  };

  const addTransaction = async (params: {
    amount: number;
    categoryId: string;
    subTag?: string | null;
    note?: string;
    type?: TransactionType;
    currency?: CurrencyCode;
    exchangeRate?: number;
    commitmentId?: string | null;
    reminderId?: string | null;
    date?: string;
  }): Promise<Transaction> => {
    return addTransactionInternal(params);
  };

  // Update existing transaction (edit amount, category, subTag, note, date, currency, exchangeRate)
  const updateTransaction = async (
    id: string,
    updates: Partial<Pick<Transaction, 'amount' | 'categoryId' | 'subTag' | 'note' | 'date' | 'currency' | 'type' | 'exchangeRate'>>
  ) => {
    const existing = await db.transactions.get(id);
    if (!existing) return;

    const matchedCat = updates.categoryId
      ? categories.find((c) => c.id === updates.categoryId)
      : undefined;

    await db.transactions.update(id, {
      ...updates,
      type: updates.type || matchedCat?.type || existing.type,
      updatedAt: new Date().toISOString(),
    });

    await refreshData();
  };

  // Undo Last Transaction (or Restore Last Deleted Transaction) + revert Commitment/Reminder state
  const undoLastTransaction = async () => {
    if (!lastAddedTransaction) return;
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);

    const snapshot = undoSnapshotRef.current;

    if (snapshot?.action === 'delete') {
      // Restore soft-deleted transaction
      await db.transactions.update(lastAddedTransaction.id, {
        deletedAt: null,
        updatedAt: new Date().toISOString(),
      });
      if (snapshot.previousCommitment) {
        await db.commitments.put(snapshot.previousCommitment);
      }
      if (snapshot.previousReminder) {
        await db.reminders.put(snapshot.previousReminder);
      }
    } else {
      // Revert added transaction
      await db.transactions.delete(lastAddedTransaction.id);
      if (snapshot?.previousCommitment) {
        await db.commitments.put(snapshot.previousCommitment);
      }
      if (snapshot?.previousReminder) {
        await db.reminders.put(snapshot.previousReminder);
      }
    }

    setIsUndoVisible(false);
    setLastAddedTransaction(null);
    undoSnapshotRef.current = null;
    await refreshData();
  };

  const dismissUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setIsUndoVisible(false);
    setLastAddedTransaction(null);
    undoSnapshotRef.current = null;
  };

  // Delete Transaction (Soft-delete + revert linked commitment if applicable)
  const deleteTransaction = async (id: string) => {
    const tx = await db.transactions.get(id);
    if (!tx) return;

    const nowIso = new Date().toISOString();
    let prevCommitment: Commitment | null = null;

    if (tx.commitmentId) {
      const comm = await db.commitments.get(tx.commitmentId);
      if (comm) {
        prevCommitment = { ...comm };
        const revertedPaid = Math.max(0, comm.paidAmount - tx.amount);
        const revertedInstallments =
          comm.installmentsTotal && comm.installmentsPaid
            ? Math.max(0, comm.installmentsPaid - 1)
            : comm.installmentsPaid;
        await db.commitments.update(comm.id, {
          paidAmount: revertedPaid,
          installmentsPaid: revertedInstallments,
          isCompleted: revertedPaid >= comm.totalAmount,
          updatedAt: nowIso,
        });
      }
    }

    await db.transactions.update(id, {
      deletedAt: nowIso,
      updatedAt: nowIso,
    });

    triggerUndoBanner({
      action: 'delete',
      transaction: tx,
      previousCommitment: prevCommitment,
    });

    await refreshData();
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
      id: generateUUID(),
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

  // Pay Commitment (Amortization linked with Daily Transactions + reversible via Undo)
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

    const previousCommitmentSnapshot: Commitment = { ...commitment };

    const newPaidAmount = Math.min(commitment.totalAmount, commitment.paidAmount + amount);
    const isCompleted = newPaidAmount >= commitment.totalAmount;

    let newInstallmentsPaid = commitment.installmentsPaid;
    if (commitment.installmentsTotal) {
      if (isCompleted) {
        newInstallmentsPaid = commitment.installmentsTotal;
      } else {
        newInstallmentsPaid = Math.min(
          commitment.installmentsTotal,
          (commitment.installmentsPaid || 0) + 1
        );
      }
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
    const defaultNote =
      commitment.type === 'debt'
        ? `Pago cuota a ${commitment.counterpart} ${installmentText}`.trim()
        : `Cobro cuota de ${commitment.counterpart} ${installmentText}`.trim();

    await addTransactionInternal(
      {
        amount,
        categoryId: txCategory,
        subTag: commitment.title,
        note: note || defaultNote,
        type: txType,
        currency: commitment.currency,
        commitmentId: commitment.id,
        date: date || selectedDate,
      },
      { previousCommitment: previousCommitmentSnapshot }
    );
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
      id: generateUUID(),
      title: params.title.trim(),
      amount: params.amount,
      currency: params.currency,
      dueDate: params.dueDate,
      categoryId: params.categoryId,
      isRecurring: params.isRecurring,
      recurrenceDay: params.isRecurring
        ? params.recurrenceDay || parseInt(params.dueDate.split('-')[2], 10)
        : null,
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

  // Pay Reminder (1-Touch Service Payment + reversible via Undo)
  const payReminder = async (
    reminderId: string,
    customAmount?: number,
    paymentDate?: string
  ) => {
    const reminder = await db.reminders.get(reminderId);
    if (!reminder) return;

    const previousReminderSnapshot: Reminder = { ...reminder };
    const nowIso = new Date().toISOString();
    const amountToPay = customAmount !== undefined ? customAmount : reminder.amount;

    if (reminder.isRecurring) {
      const nextDueDate = getNextMonthlyDueDate(reminder.dueDate, reminder.recurrenceDay);
      await db.reminders.update(reminderId, {
        dueDate: nextDueDate,
        amount: amountToPay,
        paidDate: nowIso,
        updatedAt: nowIso,
        status: 'pending',
      });
    } else {
      await db.reminders.update(reminderId, {
        status: 'paid',
        amount: amountToPay,
        paidDate: nowIso,
        updatedAt: nowIso,
      });
    }

    await addTransactionInternal(
      {
        amount: amountToPay,
        categoryId: reminder.categoryId,
        subTag: reminder.title,
        note: `Pago de servicio: ${reminder.title}`,
        type: 'expense',
        currency: reminder.currency,
        reminderId: reminder.id,
        date: paymentDate || selectedDate,
      },
      { previousReminder: previousReminderSnapshot }
    );
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

  // Restore Backup JSON
  const restoreBackup = async (payload: {
    transactions?: Transaction[];
    categories?: Category[];
    commitments?: Commitment[];
    reminders?: Reminder[];
  }) => {
    if (Array.isArray(payload.categories) && payload.categories.length > 0) {
      await db.categories.bulkPut(payload.categories);
      const allCats = await db.categories.orderBy('sortOrder').toArray();
      setCategories(allCats);
    }
    if (Array.isArray(payload.transactions)) {
      await db.transactions.bulkPut(payload.transactions);
    }
    if (Array.isArray(payload.commitments)) {
      await db.commitments.bulkPut(payload.commitments);
    }
    if (Array.isArray(payload.reminders)) {
      await db.reminders.bulkPut(payload.reminders);
    }
    await refreshData();
  };

  // Active sorted reminders for the Radar
  const activeReminders = useMemo(() => {
    return reminders
      .filter((r) => r.status === 'pending' && !r.deletedAt)
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  }, [reminders]);

  // Filter categories by current transaction type (expense vs income)
  const activeCategories = useMemo(() => {
    return categories.filter((c) => c.type === transactionType);
  }, [categories, transactionType]);

  // Calculate Totals for the current month using convertAmount
  const currentTotals = useMemo(() => {
    let income = 0;
    let expense = 0;
    const fallbackRate = exchangeRate?.venta || 1400;

    allTransactionsForMonth.forEach((tx) => {
      const rateToUse = tx.exchangeRate || fallbackRate;
      const val = convertAmount(tx.amount, tx.currency, activeCurrency, rateToUse);

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
    const fallbackRate = exchangeRate?.venta || 1400;

    allTransactionsForMonth
      .filter((tx) => tx.type === transactionType)
      .forEach((tx) => {
        const rateToUse = tx.exchangeRate || fallbackRate;
        const val = convertAmount(tx.amount, tx.currency, activeCurrency, rateToUse);
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

    commitments.forEach((c) => {
      const total = convertAmount(c.totalAmount, c.currency, activeCurrency, rate);
      const paid = convertAmount(c.paidAmount, c.currency, activeCurrency, rate);
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

    const freedomPercentage =
      totalDebtOriginal > 0
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
        shiftMonth,
        activeCurrency,
        setActiveCurrency,
        transactionType,
        setTransactionType,
        exchangeRate,
        refreshExchangeRate,
        transactions,
        allTransactionsForMonth,
        categories,
        activeCategories,
        commitments,
        commitmentsSummary,
        reminders,
        activeReminders,
        lastAddedTransaction,
        lastUndoAction,
        isUndoVisible,
        keypadDraft,
        openKeypad,
        closeKeypad,
        addTransaction,
        updateTransaction,
        undoLastTransaction,
        dismissUndo,
        deleteTransaction,
        addCommitment,
        payCommitment,
        deleteCommitment,
        addReminder,
        payReminder,
        deleteReminder,
        restoreBackup,
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
