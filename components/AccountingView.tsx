
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType, Wallet } from '../types';
import { TRANSLATIONS, Language } from '../data/locales';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';

interface AccountingViewProps {
  transactions: Transaction[];
  wallets: Wallet[];
  lang: Language;
}

type Period = 'daily' | 'monthly' | 'yearly';

export const AccountingView: React.FC<AccountingViewProps> = ({ transactions, wallets, lang }) => {
  const [activeTab, setActiveTab] = useState<Period>('monthly');
  const t = TRANSLATIONS[lang];

  // Helper to generate a SORTABLE key (ISO format)
  const getSortableKey = (dateStr: string, period: Period) => {
    const d = new Date(dateStr);
    if (period === 'daily') return d.toISOString().split('T')[0]; // YYYY-MM-DD
    if (period === 'monthly') return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}`; // YYYY-MM
    if (period === 'yearly') return d.getFullYear().toString(); // YYYY
    return dateStr;
  };

  // Helper to display friendly date
  const formatDisplayDate = (sortableKey: string, period: Period) => {
    const [year, month, day] = sortableKey.split('-').map(Number);
    // Note: Month is 0-indexed in Date constructor, but 1-indexed in ISO string
    if (period === 'daily') {
        const d = new Date(year, month - 1, day);
        return d.toLocaleDateString();
    }
    if (period === 'monthly') {
        const d = new Date(year, month - 1);
        return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    }
    return sortableKey; // Year is just Year
  };

  const accountingData = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number; count: number }> = {};

    transactions.forEach(tx => {
      const key = getSortableKey(tx.date, activeTab);
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0, count: 0 };
      
      if (tx.type === TransactionType.INCOME) grouped[key].income += tx.amount;
      if (tx.type === TransactionType.EXPENSE) grouped[key].expense += tx.amount;
      grouped[key].count++;
    });

    return Object.entries(grouped)
      .map(([key, data]) => ({
        key, // Sortable Key
        display: formatDisplayDate(key, activeTab), // Friendly Display
        ...data,
        net: data.income - data.expense
      }))
      .sort((a, b) => b.key.localeCompare(a.key)); // Sort descending by ISO key
  }, [transactions, activeTab]);

  const exportCSV = () => {
    const headers = ['Period', 'Income', 'Expense', 'Net Result', 'Count'];
    const rows = accountingData.map(d => [d.display, d.income, d.expense, d.net, d.count]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `accounting_report_${activeTab}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-center bg-white dark:bg-card p-4 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 sm:mb-0">{t.accounting}</h2>
        <div className="flex space-x-2">
          <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
            {(['daily', 'monthly', 'yearly'] as Period[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  activeTab === tab
                    ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white'
                }`}
              >
                {t[`accounting_${tab}` as keyof typeof t]}
              </button>
            ))}
          </div>
          <button 
            onClick={exportCSV}
            className="flex items-center space-x-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 rounded-lg font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">{t.export}</span>
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-card rounded-2xl border border-slate-200 dark:border-slate-700/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{t.date} / {t.period}</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t.income}</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t.expenses}</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-right">{t.net_result}</th>
                <th className="p-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">{t.count}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {accountingData.length === 0 ? (
                 <tr>
                   <td colSpan={5} className="p-8 text-center text-slate-500 dark:text-slate-400">
                     {t.no_transactions}
                   </td>
                 </tr>
              ) : (
                accountingData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-sm font-medium text-slate-800 dark:text-slate-200">{row.display}</td>
                    <td className="p-4 text-sm font-medium text-emerald-600 dark:text-emerald-400 text-right">
                      +{row.income.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-sm font-medium text-rose-600 dark:text-rose-400 text-right">
                      -{row.expense.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`p-4 text-sm font-bold text-right ${row.net >= 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-orange-500'}`}>
                      {row.net >= 0 ? '+' : ''}{row.net.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-4 text-sm text-slate-500 dark:text-slate-400 text-center">{row.count}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
