


import React, { useState } from 'react';
import { Transaction, TransactionType, BudgetMethod, BudgetLimit } from '../types';
import { TRANSLATIONS, Language } from '../data/locales';
import { AlertTriangle, CheckCircle, PieChart, Info } from 'lucide-react';

interface BudgetingViewProps {
  transactions: Transaction[];
  lang: Language;
  budgetMethod: BudgetMethod;
  setBudgetMethod: (m: BudgetMethod) => void;
  budgetLimits: BudgetLimit[];
  setBudgetLimits: (l: BudgetLimit[]) => void;
}

export const BudgetingView: React.FC<BudgetingViewProps> = ({ 
  transactions, lang, budgetMethod, setBudgetMethod, budgetLimits, setBudgetLimits
}) => {
  const t = TRANSLATIONS[lang];
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempLimit, setTempLimit] = useState('');

  // Categories extraction
  const categories: string[] = Array.from<string>(new Set(transactions.map(t => t.category))).sort();
  // Ensure default categories are present if no transactions yet
  if (categories.length === 0) categories.push('General', 'Food', 'Transport', 'Utilities');

  // Calculate current spending per category (Monthly)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const spending = transactions
    .filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === TransactionType.EXPENSE;
    })
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);
  
  const totalIncome = transactions
    .filter(t => {
       const d = new Date(t.date);
       return d.getMonth() === currentMonth && d.getFullYear() === currentYear && t.type === TransactionType.INCOME;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  const getLimit = (cat: string) => budgetLimits.find(b => b.category === cat)?.limit || 0;
  
  const handleSaveLimit = (cat: string) => {
    const newLimit = parseFloat(tempLimit);
    if (!isNaN(newLimit)) {
      const newLimits = budgetLimits.filter(b => b.category !== cat);
      newLimits.push({ category: cat, limit: newLimit });
      setBudgetLimits(newLimits);
    }
    setEditingCategory(null);
  };

  const totalBudgeted = budgetLimits.reduce((sum, b) => sum + b.limit, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-20">
      {/* Header & Method Selector */}
      <div className="bg-white dark:bg-card p-6 rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
           <div>
             <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.budget}</h2>
             <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{t.period_month}</p>
           </div>
           
           <div className="mt-4 md:mt-0">
             <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-2">{t.budget_method}</label>
             <select 
               value={budgetMethod}
               onChange={(e) => setBudgetMethod(e.target.value as BudgetMethod)}
               className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2 px-3 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
             >
               <option value="ENVELOPE">{t.budget_envelope}</option>
               <option value="ZERO_BASED">{t.budget_zero_based}</option>
               <option value="FREE">{t.budget_free}</option>
               <option value="REMAINING">{t.budget_remaining}</option>
             </select>
           </div>
        </div>

        {/* Method Specific Summaries */}
        {budgetMethod === 'ZERO_BASED' && (
           <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-center">
                 <p className="text-xs text-slate-500">{t.income}</p>
                 <p className="font-bold text-emerald-500">+{totalIncome.toFixed(2)}</p>
              </div>
              <div className="text-center border-l border-slate-200 dark:border-slate-700">
                 <p className="text-xs text-slate-500">Budgeted</p>
                 <p className="font-bold text-indigo-500">{totalBudgeted.toFixed(2)}</p>
              </div>
              <div className="text-center border-l border-slate-200 dark:border-slate-700">
                 <p className="text-xs text-slate-500">Left to Budget</p>
                 <p className={`font-bold ${(totalIncome - totalBudgeted) < 0 ? 'text-rose-500' : 'text-slate-700 dark:text-white'}`}>
                   {(totalIncome - totalBudgeted).toFixed(2)}
                 </p>
              </div>
           </div>
        )}
      </div>

      {/* Category List with Envelopes/Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {categories.map(cat => {
          const spent = spending[cat] || 0;
          const limit = getLimit(cat);
          const percent = limit > 0 ? (spent / limit) * 100 : 0;
          const isOver = limit > 0 && spent > limit;
          
          return (
            <div key={cat} className={`bg-white dark:bg-card p-5 rounded-xl border ${isOver ? 'border-rose-300 dark:border-rose-900/50 ring-1 ring-rose-200 dark:ring-rose-900/20' : 'border-slate-200 dark:border-slate-700/50'} shadow-sm relative overflow-hidden group`}>
               {isOver && (
                 <div className="absolute top-0 right-0 p-2">
                   <AlertTriangle className="w-5 h-5 text-rose-500 animate-pulse" />
                 </div>
               )}
               
               <div className="flex justify-between items-center mb-3">
                 <h3 className="font-semibold text-slate-800 dark:text-white flex items-center space-x-2">
                   <span>{cat}</span>
                 </h3>
                 {editingCategory === cat ? (
                   <div className="flex items-center space-x-2">
                     <input 
                       type="number" 
                       autoFocus
                       className="w-20 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded px-2 py-1 text-sm"
                       value={tempLimit}
                       onChange={e => setTempLimit(e.target.value)}
                       onKeyDown={e => e.key === 'Enter' && handleSaveLimit(cat)}
                     />
                     <button onClick={() => handleSaveLimit(cat)} className="text-xs bg-indigo-500 text-white px-2 py-1 rounded">{t.save}</button>
                   </div>
                 ) : (
                   <button 
                    onClick={() => { setEditingCategory(cat); setTempLimit(limit.toString()); }}
                    className="text-xs text-indigo-500 hover:text-indigo-600 font-medium"
                   >
                     {limit === 0 ? t.set_limit : `${t.set_limit}: ${limit}`}
                   </button>
                 )}
               </div>

               <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                 <span>{t.spent}: {spent.toFixed(2)}</span>
                 <span>{t.remaining}: {(limit - spent).toFixed(2)}</span>
               </div>

               <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                 <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOver ? 'bg-rose-500' : 
                      percent > 80 ? 'bg-orange-400' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(percent, 100)}%` }}
                 />
               </div>
               {isOver && <p className="text-xs text-rose-500 mt-2 font-medium">{t.over_budget}</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};