
import React, { useState } from 'react';
import { TransactionType, Wallet, Member } from '../types';
import { X, Users, Calendar } from 'lucide-react';
import { TRANSLATIONS, Language } from '../data/locales';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  wallets: Wallet[];
  members: Member[];
  lang: Language;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose, onAdd, wallets, members, lang }) => {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [walletId, setWalletId] = useState(wallets[0]?.id || '');
  const [category, setCategory] = useState('General');
  const [memberId, setMemberId] = useState(members[0]?.id || '');
  // Default to today in YYYY-MM-DD format for input[type=date]
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const t = TRANSLATIONS[lang];

  // Update walletId/memberId if lists change
  React.useEffect(() => {
    if (wallets.length > 0 && !walletId) setWalletId(wallets[0].id);
    if (members.length > 0 && !memberId) setMemberId(members[0].id);
  }, [wallets, members, walletId, memberId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      amount: parseFloat(amount),
      description,
      type,
      walletId: walletId || wallets[0]?.id,
      category,
      date: new Date(date).toISOString(),
      memberId: memberId || members[0]?.id
    });
    setAmount('');
    setDescription('');
    // Reset to today
    setDate(new Date().toISOString().split('T')[0]);
    onClose();
  };

  const selectedWallet = wallets.find(w => w.id === walletId);
  const currencySymbol = selectedWallet?.currency || '$';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.new_transaction}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.EXPENSE ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              {t.expense}
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`py-2 text-sm font-medium rounded-md transition-all ${type === TransactionType.INCOME ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
              {t.income}
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.amount}</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{currencySymbol}</span>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-8 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-400 dark:placeholder-slate-600"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.description}</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-400 dark:placeholder-slate-600"
              placeholder="e.g. Grocery Shopping"
            />
          </div>

          {/* Date Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.date}</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.wallet}</label>
              <select
                value={walletId}
                onChange={(e) => setWalletId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {wallets.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.category}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="General">{t.cat_general}</option>
                <option value="Food">{t.cat_food}</option>
                <option value="Transport">{t.cat_transport}</option>
                <option value="Utilities">{t.cat_utilities}</option>
                <option value="Shopping">{t.cat_shopping}</option>
                <option value="Salary">{t.cat_salary}</option>
                <option value="Health">{t.cat_health}</option>
                <option value="Housing">{t.cat_housing}</option>
                <option value="Entertainment">{t.cat_entertainment}</option>
                <option value="Transfer">{t.cat_transfer}</option>
              </select>
            </div>
          </div>
          
          {members.length > 1 && (
             <div>
                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.who_spent}</label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <select
                    value={memberId}
                    onChange={(e) => setMemberId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 pl-10 pr-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    {members.map(m => (
                      <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                  </select>
                </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors mt-4 shadow-lg shadow-indigo-500/20"
          >
            {t.save}
          </button>
        </form>
      </div>
    </div>
  );
};
