
import React from 'react';
import { Transaction, TransactionType, Wallet } from '../types';
import { ArrowUpRight, ArrowDownLeft, RefreshCcw, Trash2 } from 'lucide-react';
import { TRANSLATIONS, Language } from '../data/locales';

interface TransactionListProps {
  transactions: Transaction[];
  wallets: Wallet[];
  lang: Language;
  onDelete?: (id: string) => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({ transactions, wallets, lang, onDelete }) => {
  const t = TRANSLATIONS[lang];
  const getWallet = (id: string) => wallets.find(w => w.id === id);

  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-500 dark:text-slate-400">
        <p>{t.no_transactions}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {transactions.map((t) => {
        const wallet = getWallet(t.walletId);
        const currency = wallet?.currency || '$';
        
        return (
          <div key={t.id} className="group relative flex items-center justify-between p-4 bg-white dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/30 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm">
            <div className="flex items-center space-x-4">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center shrink-0
                ${t.type === TransactionType.INCOME ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 
                  t.type === TransactionType.EXPENSE ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400' : 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'}
              `}>
                {t.type === TransactionType.INCOME && <ArrowDownLeft className="w-5 h-5" />}
                {t.type === TransactionType.EXPENSE && <ArrowUpRight className="w-5 h-5" />}
                {t.type === TransactionType.TRANSFER && <RefreshCcw className="w-5 h-5" />}
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 dark:text-white font-medium truncate pr-2">{t.description}</p>
                <div className="flex flex-wrap items-center text-xs text-slate-500 dark:text-slate-400 gap-x-2">
                  <span>{new Date(t.date).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>{t.category}</span>
                  <span>•</span>
                  <span className="text-indigo-600 dark:text-indigo-400 truncate max-w-[100px]">{wallet?.name || 'Unknown'}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 shrink-0">
               <div className={`font-bold whitespace-nowrap ${
                t.type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' : 
                t.type === TransactionType.EXPENSE ? 'text-rose-600 dark:text-rose-400' : 'text-slate-800 dark:text-white'
              }`}>
                {t.type === TransactionType.EXPENSE ? '-' : '+'}{currency}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              
              {onDelete && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(t.id);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                  title="Delete Transaction"
                  aria-label="Delete Transaction"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
