
import React from 'react';
import { Wallet } from '../types';
import { Wallet as WalletIcon, CreditCard, Smartphone, DollarSign, Briefcase, Landmark } from 'lucide-react';

interface WalletCardProps {
  wallet: Wallet;
  isSelected?: boolean;
  onClick?: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ wallet, isSelected, onClick }) => {
  const getIcon = () => {
    const typeLower = wallet.type.toLowerCase();
    if (typeLower.includes('bank')) return <Landmark className="w-5 h-5" />;
    if (typeLower.includes('mobile') || typeLower.includes('money') || typeLower.includes('flooz')) return <Smartphone className="w-5 h-5" />;
    if (typeLower.includes('card')) return <CreditCard className="w-5 h-5" />;
    if (typeLower.includes('investment')) return <Briefcase className="w-5 h-5" />;
    return <WalletIcon className="w-5 h-5" />;
  };

  return (
    <div 
      onClick={onClick}
      className={`
        relative p-5 rounded-2xl transition-all duration-300 cursor-pointer overflow-hidden group shadow-sm
        ${isSelected 
          ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 shadow-lg shadow-indigo-900/50 ring-2 ring-indigo-400 text-white' 
          : 'bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/50 hover:border-slate-300 dark:hover:border-slate-600'
        }
      `}
    >
      <div className={`absolute top-0 right-0 p-3 opacity-5 dark:opacity-10 group-hover:scale-125 transition-transform duration-500`}>
         <DollarSign className={`w-24 h-24 ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`} />
      </div>

      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between mb-4">
          <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-700 dark:text-white'}`}>
            {getIcon()}
          </div>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${isSelected ? 'bg-indigo-500/30 text-indigo-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>
            {wallet.type}
          </span>
        </div>
        
        <div>
          <h3 className={`text-sm font-medium ${isSelected ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'}`}>
            {wallet.name}
          </h3>
          <p className={`text-2xl font-bold mt-1 ${isSelected ? 'text-white' : 'text-slate-800 dark:text-white'}`}>
            {wallet.currency} {wallet.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
};
