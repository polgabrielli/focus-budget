import React, { useState } from 'react';
import { BudgetProvider } from './context/BudgetContext';
import { HeaderBar } from './components/Header/HeaderBar';
import { MonefyDial } from './components/Dial/MonefyDial';
import { CategoryGrid } from './components/Categories/CategoryGrid';
import { NumericKeypad } from './components/Keypad/NumericKeypad';
import { RecentTransactionsList } from './components/Transactions/RecentTransactionsList';
import { UndoToast } from './components/Common/UndoToast';

const MainScreen: React.FC = () => {
  const [amountStr, setAmountStr] = useState<string>('0');
  const [note, setNote] = useState<string>('');
  const [isNoteOpen, setIsNoteOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center pb-8 safe-area-bottom">
      {/* Top Header Bar */}
      <HeaderBar />

      {/* Monefy Interactive Dial */}
      <MonefyDial />

      {/* Category Grid (Intent-Based for TDAH) */}
      <CategoryGrid
        amountStr={amountStr}
        setAmountStr={setAmountStr}
        note={note}
        setNote={setNote}
        setIsNoteOpen={setIsNoteOpen}
      />

      {/* Big Tactile Keypad */}
      <NumericKeypad
        amountStr={amountStr}
        setAmountStr={setAmountStr}
        note={note}
        setNote={setNote}
        isNoteOpen={isNoteOpen}
        setIsNoteOpen={setIsNoteOpen}
      />

      {/* Recent Movements List */}
      <RecentTransactionsList />

      {/* 5-Second Undo Floating Bar */}
      <UndoToast />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <BudgetProvider>
      <MainScreen />
    </BudgetProvider>
  );
};

export default App;
