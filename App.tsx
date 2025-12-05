

import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Wallet as WalletIcon, 
  BarChart3, 
  Plus, 
  Menu, 
  X,
  Sparkles,
  Globe,
  Calculator,
  MessageSquare,
  Moon,
  Sun,
  PieChart,
  Settings,
  WifiOff,
  UserCircle,
  Heart
} from 'lucide-react';
import { Transaction, Wallet, ViewState, DateRange, TransactionType, Theme, BudgetMethod, BudgetLimit, Member } from './types';
import { WalletCard } from './components/WalletCard';
import { TransactionList } from './components/TransactionList';
import { AddTransactionModal } from './components/AddTransactionModal';
import { AddWalletModal } from './components/AddWalletModal';
import { Dashboard } from './components/Dashboard';
import { AccountingView } from './components/AccountingView';
import { BudgetingView } from './components/BudgetingView';
import { SettingsView } from './components/SettingsView';
import { ChatAssistant } from './components/ChatAssistant';
import { TRANSLATIONS, Language } from './data/locales';

// Persistence Helper
const loadFromStorage = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (e) {
    return fallback;
  }
};

const saveToStorage = (key: string, data: any) => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Storage Error", e);
  }
};

const App: React.FC = () => {
  // State initialization with Persistence
  const [wallets, setWallets] = useState<Wallet[]>(() => loadFromStorage('flow_wallets', []));
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadFromStorage('flow_transactions', []));
  
  // Budget & Members
  const [budgetMethod, setBudgetMethod] = useState<BudgetMethod>(() => loadFromStorage('flow_budget_method', 'FREE'));
  const [budgetLimits, setBudgetLimits] = useState<BudgetLimit[]>(() => loadFromStorage('flow_budget_limits', []));
  const [members, setMembers] = useState<Member[]>(() => loadFromStorage('flow_members', [{ id: '1', name: 'Me', role: 'admin' }]));

  const [view, setView] = useState<ViewState>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [lang, setLang] = useState<Language>(() => loadFromStorage('flow_lang', 'en'));
  const [theme, setTheme] = useState<Theme>(() => loadFromStorage('flow_theme', 'dark'));
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  
  // Modals & Chat
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  // Date Filter (Default to current month)
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    end: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0)
  });

  const t = TRANSLATIONS[lang];
  const currentUser = members[0]; // Assuming first member is 'Me'

  // Persistence Effects
  useEffect(() => saveToStorage('flow_wallets', wallets), [wallets]);
  useEffect(() => saveToStorage('flow_transactions', transactions), [transactions]);
  useEffect(() => saveToStorage('flow_budget_method', budgetMethod), [budgetMethod]);
  useEffect(() => saveToStorage('flow_budget_limits', budgetLimits), [budgetLimits]);
  useEffect(() => saveToStorage('flow_members', members), [members]);
  useEffect(() => saveToStorage('flow_lang', lang), [lang]);
  useEffect(() => saveToStorage('flow_theme', theme), [theme]);

  // Online Status Listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Theme Handling
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Helper to handle view changes and close chat/sidebar
  const handleViewChange = (newView: ViewState) => {
    setView(newView);
    setIsSidebarOpen(false);
    setIsChatOpen(false); // Auto-close chat when navigating
  };

  const handleAddTransaction = (newTx: Omit<Transaction, 'id'>) => {
    // Robustness: ensure amount is a number
    const numericAmount = typeof newTx.amount === 'string' ? parseFloat(newTx.amount) : newTx.amount;
    
    const tx: Transaction = { 
      ...newTx, 
      amount: numericAmount,
      id: Math.random().toString(36).substr(2, 9) 
    };
    
    setTransactions(prev => [tx, ...prev]);
    
    // Update Wallet Balance
    setWallets(prev => prev.map(w => {
      if (w.id === tx.walletId) {
        return {
          ...w,
          balance: tx.type === TransactionType.INCOME 
            ? w.balance + numericAmount 
            : w.balance - numericAmount
        };
      }
      return w;
    }));
  };

  const handleDeleteTransaction = (id: string) => {
    if (!window.confirm(t.delete_confirm)) return;

    const txToDelete = transactions.find(t => t.id === id);
    if (!txToDelete) return;

    setTransactions(prev => prev.filter(t => t.id !== id));

    // Revert Wallet Balance
    setWallets(prev => prev.map(w => {
      if (w.id === txToDelete.walletId) {
        return {
          ...w,
          balance: txToDelete.type === TransactionType.INCOME
            ? w.balance - txToDelete.amount
            : w.balance + txToDelete.amount
        };
      }
      return w;
    }));
  };

  const handleResetData = () => {
    // Avoid setting state to [] to prevent useEffects from overwriting cleared storage
    // Directly clear storage and reload
    const keys = [
      'flow_wallets', 
      'flow_transactions', 
      'flow_budget_limits', 
      'flow_members', 
      'flow_budget_method',
      // We purposefully DO NOT clear 'flow_lang' and 'flow_theme' to improve UX after reset
    ];
    
    keys.forEach(key => localStorage.removeItem(key));

    // Reloading immediately ensures the app starts fresh from empty storage
    window.location.reload();
  };

  const handleAddWallet = (newWallet: Omit<Wallet, 'id'>) => {
    const w: Wallet = { ...newWallet, id: Math.random().toString(36).substr(2, 9) };
    setWallets(prev => [...prev, w]);
  };

  // Sidebar Component
  const Sidebar = () => (
    <div className={`
      fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-transform duration-300 transform 
      ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:relative flex flex-col
    `}>
      <div className="flex flex-col p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
           <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
             FlowFinance
           </h1>
           <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
             <X />
           </button>
        </div>
        
        {/* User Profile Summary */}
        <div className="flex items-center space-x-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
          <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-200 dark:bg-slate-700 shrink-0">
            {currentUser?.avatar ? (
              <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <UserCircle className="w-6 h-6" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
              {currentUser?.name || 'User'}
            </p>
            <p className="text-xs text-slate-500 truncate">
               {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
      </div>
      
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {[
          { id: 'dashboard', icon: LayoutDashboard, label: t.dashboard },
          { id: 'wallets', icon: WalletIcon, label: t.wallets },
          { id: 'transactions', icon: BarChart3, label: t.transactions },
          { id: 'budget', icon: PieChart, label: t.budget },
          { id: 'accounting', icon: Calculator, label: t.accounting },
          { id: 'settings', icon: Settings, label: t.settings },
        ].map((item) => (
          <button 
            key={item.id}
            onClick={() => handleViewChange(item.id as ViewState)}
            className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-colors font-medium ${
              view === item.id 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-4">
        {/* Language & Theme Selector */}
        <div className="flex items-center justify-between space-x-2">
           <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg flex-1 border border-slate-200 dark:border-slate-700">
             <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400" />
             <select 
               value={lang}
               onChange={(e) => setLang(e.target.value as Language)}
               className="bg-transparent text-xs font-medium focus:outline-none cursor-pointer w-full text-slate-900 dark:text-slate-100"
             >
               <option value="en" className="bg-white dark:bg-slate-900">English</option>
               <option value="fr" className="bg-white dark:bg-slate-900">Français</option>
               <option value="es" className="bg-white dark:bg-slate-900">Español</option>
               <option value="de" className="bg-white dark:bg-slate-900">Deutsch</option>
               <option value="zh" className="bg-white dark:bg-slate-900">中文</option>
               <option value="hi" className="bg-white dark:bg-slate-900">हिन्दी</option>
               <option value="ar" className="bg-white dark:bg-slate-900">العربية</option>
               <option value="pt" className="bg-white dark:bg-slate-900">Português</option>
               <option value="ru" className="bg-white dark:bg-slate-900">Русский</option>
               <option value="ja" className="bg-white dark:bg-slate-900">日本語</option>
             </select>
           </div>
           
           <button 
             onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
             className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors border border-slate-200 dark:border-slate-700"
             title={theme === 'dark' ? t.light_mode : t.dark_mode}
           >
             {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
           </button>
        </div>

        <button 
          onClick={() => {
            setIsChatOpen(true);
            setIsSidebarOpen(false);
          }}
          disabled={!isOnline}
          className={`w-full flex items-center justify-center space-x-2 p-3 rounded-xl transition-all font-medium ${
            isOnline 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/30'
              : 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
          }`}
        >
          {isOnline ? <MessageSquare className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
          <span>{isOnline ? t.ask_ai : 'Offline'}</span>
        </button>

        <a 
          href="https://my.moneyfusion.net/6932422bcce144007fbc2721" 
          target="_blank"
          rel="noopener noreferrer"
          className="w-full flex items-center justify-center space-x-2 p-3 rounded-xl transition-all font-medium bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40"
        >
          <Heart className="w-4 h-4" />
          <span>{t.donate}</span>
        </a>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300 overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 z-30">
          <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-emerald-500 bg-clip-text text-transparent">
            FlowFinance
          </h1>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 dark:text-white">
            <Menu />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto pb-24 md:pb-0">
             {view === 'dashboard' && (
               <Dashboard 
                 wallets={wallets} 
                 transactions={transactions} 
                 dateRange={dateRange}
                 onAddWallet={() => setIsWalletModalOpen(true)}
                 lang={lang}
                 onDeleteTransaction={handleDeleteTransaction}
               />
             )}

             {view === 'wallets' && (
               <div className="space-y-6 animate-fade-in">
                 <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.wallets}</h2>
                    <button 
                      onClick={() => setIsWalletModalOpen(true)}
                      className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.add_wallet}</span>
                    </button>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wallets.map(w => <WalletCard key={w.id} wallet={w} />)}
                 </div>
               </div>
             )}

             {view === 'transactions' && (
               <div className="space-y-6 animate-fade-in">
                 <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{t.transactions}</h2>
                    <button 
                      onClick={() => setIsTxModalOpen(true)}
                      className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{t.add_transaction}</span>
                    </button>
                 </div>
                 <TransactionList transactions={transactions} wallets={wallets} lang={lang} onDelete={handleDeleteTransaction} />
               </div>
             )}

             {view === 'accounting' && (
                <AccountingView transactions={transactions} wallets={wallets} lang={lang} />
             )}

             {view === 'budget' && (
                <BudgetingView 
                   transactions={transactions} 
                   lang={lang} 
                   budgetMethod={budgetMethod} 
                   setBudgetMethod={setBudgetMethod}
                   budgetLimits={budgetLimits}
                   setBudgetLimits={setBudgetLimits}
                />
             )}

             {view === 'settings' && (
                <SettingsView members={members} setMembers={setMembers} lang={lang} onResetData={handleResetData} />
             )}
          </div>
        </div>

        {/* Floating Action Button (Mobile) */}
        <button
          onClick={() => setIsTxModalOpen(true)}
          className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-indigo-700 transition-colors z-30"
        >
          <Plus className="w-8 h-8" />
        </button>

        {/* Modals */}
        <AddTransactionModal
          isOpen={isTxModalOpen}
          onClose={() => setIsTxModalOpen(false)}
          onAdd={handleAddTransaction}
          wallets={wallets}
          members={members}
          lang={lang}
        />
        
        <AddWalletModal
          isOpen={isWalletModalOpen}
          onClose={() => setIsWalletModalOpen(false)}
          onAdd={handleAddWallet}
          lang={lang}
        />

        {/* Chat Assistant */}
        {isChatOpen && (
          <ChatAssistant 
            isOpen={isChatOpen} 
            onClose={() => setIsChatOpen(false)} 
            wallets={wallets}
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            lang={lang}
          />
        )}
      </main>
    </div>
  );
};

export default App;