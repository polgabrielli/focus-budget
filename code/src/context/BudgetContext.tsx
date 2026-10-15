import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { db, seedCategories } from '../db/db';
import { 
  type Transaction, 
  type Category, 
  type TransactionType, 
  type CurrencyCode, 
  type ExchangeRateCache 
} from '../types';
import { fetchExchangeRate } from '../services/currencyService';

interface BudgetContextType {
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
  lastAddedTransaction: Transaction | null;
  isUndoVisible: boolean;
  addTransaction: (params: {
    amount: number;
    categoryId: string;
    subTag?: string | null;
    note?: string;
  }) => Promise<Transaction>;
  undoLastTransaction: () => Promise<void>;
  dismissUndo: () => void;
  deleteTransaction: (id: string) => Promise<void>;
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

export const BudgetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [datePreset, setDatePresetState] = useState<'today' | 'yesterday' | 'custom'>('today');
  const [activeCurrency, setActiveCurrency] = useState<CurrencyCode>('ARS');
  const [transactionType, setTransactionType] = useState<TransactionType>('expense');
  const [exchangeRate, setExchangeRate] = useState<ExchangeRateCache | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [allTransactionsForMonth, setAllTransactionsForMonth] = useState<Transaction[]>([]);
  
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

  // Fetch transactions for selected date and current month
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
    } catch (err) {
      console.error('Error refreshing transactions:', err);
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
  }: {
    amount: number;
    categoryId: string;
    subTag?: string | null;
    note?: string;
  }): Promise<Transaction> => {
    const nowIso = new Date().toISOString();
    const rate = exchangeRate?.venta || 1400;

    const newTx: Transaction = {
      id: crypto.randomUUID(),
      amount,
      type: transactionType,
      categoryId,
      subTag: subTag || null,
      currency: activeCurrency,
      exchangeRate: rate,
      date: selectedDate,
      note: note || '',
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

  // Delete Transaction (Soft-delete for future sync)
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

  // Filter categories by current transaction type (expense vs income)
  const activeCategories = useMemo(() => {
    return categories.filter(c => c.type === transactionType);
  }, [categories, transactionType]);

  // Calculate Totals for the current month
  // Standardized in activeCurrency for consistent display
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

  // Calculate category totals for the donut dial (expenses of the month)
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

  return (
    <BudgetContext.Provider
      value={{
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
        lastAddedTransaction,
        isUndoVisible,
        addTransaction,
        undoLastTransaction,
        dismissUndo,
        deleteTransaction,
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
