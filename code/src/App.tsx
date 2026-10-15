import React, { useState } from 'react';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { HeaderBar } from './components/Header/HeaderBar';
import { MonefyDial } from './components/Dial/MonefyDial';
import { CategoryGrid } from './components/Categories/CategoryGrid';
import { NumericKeypad } from './components/Keypad/NumericKeypad';
import { RecentTransactionsList } from './components/Transactions/RecentTransactionsList';
import { CommitmentsView } from './components/Commitments/CommitmentsView';
import { BottomNav } from './components/Navigation/BottomNav';
import { UndoToast } from './components/Common/UndoToast';

const MainScreen: React.FC = () => {
  const { activeView } = useBudget();
  const [amountStr, setAmountStr] = useState<string>('0');
  const [note, setNote] = useState<string>('');
  const [isNoteOpen, setIsNoteOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center pb-24 safe-area-bottom">
      {/* Top Header Bar (Date selector & Currency toggle) */}
      <HeaderBar />

      {/* View 1: Main Dial & 2-Touch Registration */}
      {activeView === 'dial' && (
        <div className="w-full flex flex-col items-center animate-fadeIn">
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
        </div>
      )}

      {/* View 2: Préstamos y Deudas ("Compromisos") */}
      {activeView === 'commitments' && (
        <div className="w-full mt-2 animate-fadeIn">
          <CommitmentsView />
        </div>
      )}

      {/* Floating 5-Second Undo Toast */}
      <UndoToast />

      {/* Persistent Bottom Navigation */}
      <BottomNav />
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
