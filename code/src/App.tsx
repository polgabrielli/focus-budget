import React from 'react';
import { BudgetProvider, useBudget } from './context/BudgetContext';
import { HeaderBar } from './components/Header/HeaderBar';
import { BudgetDial } from './components/Dial/BudgetDial';
import { CategoryGrid } from './components/Categories/CategoryGrid';
import { CategoryManagerModal } from './components/Categories/CategoryManagerModal';
import { KeypadBottomSheet } from './components/Keypad/NumericKeypad';
import { RecentTransactionsList } from './components/Transactions/RecentTransactionsList';
import { CommitmentsView } from './components/Commitments/CommitmentsView';
import { RemindersView } from './components/Radar/RemindersView';
import { RadarWidget } from './components/Radar/RadarWidget';
import { BottomNav } from './components/Navigation/BottomNav';
import { UndoToast } from './components/Common/UndoToast';

const MainScreen: React.FC = () => {
  const { activeView } = useBudget();

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col items-center safe-area-bottom">
      {/* Top Header Bar (Date selector & Currency toggle) */}
      <HeaderBar />

      {/* View 1: Interactive Budget Dial, Category Tiles & Expandable Category History */}
      {activeView === 'dial' && (
        <main className="w-full flex flex-col items-center animate-fadeIn">
          {/* Radar Widget (Urgent bills alert strip) */}
          <RadarWidget />

          {/* Interactive Budget Dial */}
          <BudgetDial />

          {/* Category Grid (Tap any category to open the Keypad Bottom Sheet) */}
          <CategoryGrid mode="launcher" />

          {/* Expandable Category History & "Después veo" Inbox */}
          <RecentTransactionsList />
        </main>
      )}

      {/* View 2: Radar de Vencimientos y Google Calendar */}
      {activeView === 'reminders' && (
        <main className="w-full mt-2 animate-fadeIn">
          <RemindersView />
        </main>
      )}

      {/* View 3: Préstamos y Deudas ("Compromisos") */}
      {activeView === 'commitments' && (
        <main className="w-full mt-2 animate-fadeIn">
          <CommitmentsView />
        </main>
      )}

      {/* Bottom Sheet Keypad (for Category entry, Edit & Bill Pay) */}
      <KeypadBottomSheet />

      {/* Category & Smart Chips Customization Modal */}
      <CategoryManagerModal />

      {/* Floating 5-Second Undo Toast (Positioned safely above BottomNav) */}
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
