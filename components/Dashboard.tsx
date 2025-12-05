
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Transaction, Wallet, TransactionType, DateRange } from '../types';
import { TransactionList } from './TransactionList';
import { Plus, Wallet as WalletIcon } from 'lucide-react';
import { TRANSLATIONS, Language } from '../data/locales';

interface DashboardProps {
  wallets: Wallet[];
  transactions: Transaction[];
  dateRange: DateRange;
  onAddWallet: () => void;
  lang: Language;
  onDeleteTransaction?: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ wallets, transactions, dateRange, onAddWallet, lang, onDeleteTransaction }) => {
  const t = TRANSLATIONS[lang];

  // Empty State
  if (wallets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-6 animate-fade-in py-20">
        <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
          <WalletIcon className="w-12 h-12 text-indigo-500" />
        </div>
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">{t.welcome_title}</h2>
          <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">{t.welcome_desc}</p>
        </div>
        <button 
          onClick={onAddWallet}
          className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus className="w-6 h-6" />
          <span>{t.create_first_wallet}</span>
        </button>
      </div>
    );
  }

  // Filter transactions AND Sort by Date Descending (Newest first)
  const filteredTransactions = transactions
    .filter(t => {
      const d = new Date(t.date);
      return d >= dateRange.start && d <= dateRange.end;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Calculate Totals - Grouped by Currency
  const totalsByCurrency = wallets.reduce((acc, wallet) => {
    const currency = wallet.currency;
    if (!acc[currency]) {
      acc[currency] = { balance: 0, income: 0, expense: 0 };
    }
    acc[currency].balance += wallet.balance;
    return acc;
  }, {} as Record<string, { balance: number, income: number, expense: number }>);

  // Add Income/Expenses from transactions to the totals
  filteredTransactions.forEach(tx => {
    const wallet = wallets.find(w => w.id === tx.walletId);
    if (wallet) {
      const currency = wallet.currency;
      if (!totalsByCurrency[currency]) {
        totalsByCurrency[currency] = { balance: 0, income: 0, expense: 0 }; 
      }
      if (tx.type === TransactionType.INCOME) totalsByCurrency[currency].income += tx.amount;
      if (tx.type === TransactionType.EXPENSE) totalsByCurrency[currency].expense += tx.amount;
    }
  });

  // Pie Chart Data
  const expensesByCategory = filteredTransactions
    .filter(t => t.type === TransactionType.EXPENSE)
    .reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {});

  const pieData = Object.keys(expensesByCategory).map(key => ({
    name: key,
    value: expensesByCategory[key]
  }));

  const COLORS = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  // Area Chart Data
  // FIX: Use ISO Date string (YYYY-MM-DD) as key to ensure correct sorting
  const dailyDataMap = filteredTransactions.reduce((acc: any, t) => {
    const dateKey = new Date(t.date).toISOString().split('T')[0];
    if (!acc[dateKey]) acc[dateKey] = { date: dateKey, income: 0, expense: 0 };
    if (t.type === TransactionType.INCOME) acc[dateKey].income += t.amount;
    if (t.type === TransactionType.EXPENSE) acc[dateKey].expense += t.amount;
    return acc;
  }, {});

  // Sort by date ascending for the chart
  const areaData = Object.values(dailyDataMap).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {Object.entries(totalsByCurrency).map(([curr, stats]: [string, { balance: number, income: number, expense: number }]) => (
        <div key={curr} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
             <div className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t.total_balance} ({curr})</p>
              <h2 className="text-3xl font-bold text-slate-900 dark:text-white mt-2">{curr} {stats.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            </div>
            <div className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t.income} ({t.period})</p>
              <h2 className="text-3xl font-bold text-emerald-500 dark:text-emerald-400 mt-2">+{curr} {stats.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            </div>
            <div className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{t.expenses} ({t.period})</p>
              <h2 className="text-3xl font-bold text-rose-500 dark:text-rose-400 mt-2">-{curr} {stats.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
            </div>
        </div>
      ))}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spending Trend Chart */}
        <div className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 h-[350px] shadow-sm">
          <h3 className="text-slate-900 dark:text-white font-semibold mb-4">{t.cash_flow}</h3>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={areaData as any[]}>
              <defs>
                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-700" />
              <XAxis 
                dataKey="date" 
                stroke="#94a3b8" 
                fontSize={12} 
                tickLine={false} 
                tickFormatter={(str) => new Date(str).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} 
                itemStyle={{ color: '#fff' }}
                labelFormatter={(label) => new Date(label).toLocaleDateString()}
              />
              <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIncome)" />
              <Area type="monotone" dataKey="expense" stroke="#f43f5e" fillOpacity={1} fill="url(#colorExpense)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 h-[350px] shadow-sm">
          <h3 className="text-slate-900 dark:text-white font-semibold mb-4">{t.categories}</h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-500">
              {t.no_transactions}
            </div>
          )}
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <h3 className="text-slate-900 dark:text-white font-semibold mb-4">{t.recent_transactions}</h3>
        <TransactionList 
          transactions={filteredTransactions.slice(0, 5)} 
          wallets={wallets} 
          lang={lang}
          onDelete={onDeleteTransaction}
        />
      </div>
    </div>
  );
};
