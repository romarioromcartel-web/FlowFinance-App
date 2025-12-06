


import React, { useState } from 'react';
import { X, Crown } from 'lucide-react';
import { CURRENCIES } from '../data/currencies';
import { TRANSLATIONS, Language } from '../data/locales';
import { Wallet } from '../types';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: any) => void;
  lang: Language;
}

const BANKS = [
  'Orabank', 'Ecobank', 'Boa', 'NSIA', 'Coris Bank', 'UBA', 'GTBank', 'Société Générale', 
  'Standard Chartered', 'Banque Atlantique', 'Moneco', 'PayPal', 'Revolut', 'Wise'
].sort();

const MOBILE_MONEY = [
  'TMoney', 'Flooz', 'Wave', 'Orange Money', 'MTN MoMo', 'M-Pesa', 'Airtel Money'
].sort();

export const AddWalletModal: React.FC<AddWalletModalProps> = ({ isOpen, onClose, onAdd, lang }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [type, setType] = useState('Bank');
  const [institution, setInstitution] = useState('');
  const [currencyCode, setCurrencyCode] = useState('USD');
  
  const t = TRANSLATIONS[lang];

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedCurrency = CURRENCIES.find(c => c.code === currencyCode);
    
    // Construct a descriptive name if Institution is selected and Name is simple
    let finalName = name;
    if (institution && !name.includes(institution)) {
      finalName = `${institution} - ${name}`;
    }

    onAdd({
      name: finalName,
      balance: parseFloat(balance) || 0,
      type,
      institution,
      currency: selectedCurrency ? selectedCurrency.symbol : '$',
      color: 'blue' 
    });
    setName('');
    setBalance('');
    setInstitution('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-fade-in max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">{t.new_wallet}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.account_type}</label>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setInstitution('');
              }}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            >
              <option value="Bank">{t.provider_bank}</option>
              <option value="Mobile Money">{t.provider_momo}</option>
              <option value="Cash">Cash</option>
              <option value="Salary Account">Salary Account</option>
              <option value="Debt/Loan">Debt / Loan</option>
              <option value="Housing Fund">Housing Fund</option>
              <option value="Food Budget">Food Budget</option>
              <option value="Savings">Savings</option>
              <option value="Crypto">Crypto</option>
              <option value="Investment">Investment</option>
            </select>
          </div>

          {/* Conditional Institution Dropdown */}
          {type === 'Bank' && (
            <div className="animate-slide-up">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.institution}</label>
              <select
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">{t.select_bank}</option>
                {BANKS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          )}

          {type === 'Mobile Money' && (
            <div className="animate-slide-up">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.institution}</label>
              <select
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">{t.select_provider}</option>
                {MOBILE_MONEY.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.wallet_name}</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-400 dark:placeholder-slate-600"
              placeholder={institution ? `${institution} Main` : "e.g. My Wallet"}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.initial_balance}</label>
              <input
                type="number"
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none placeholder-slate-400 dark:placeholder-slate-600"
                placeholder="0.00"
              />
            </div>
             <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">{t.currency}</label>
              <select
                value={currencyCode}
                onChange={(e) => setCurrencyCode(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg py-2.5 px-3 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                {CURRENCIES.map(c => (
                  <option key={c.code} value={c.code}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors mt-4 shadow-lg shadow-indigo-500/20"
          >
            {t.create}
          </button>
        </form>
      </div>
    </div>
  );
};