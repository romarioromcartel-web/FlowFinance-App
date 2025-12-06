

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE',
  TRANSFER = 'TRANSFER'
}

export interface Wallet {
  id: string;
  name: string;
  type: string; // e.g., 'Bank', 'Mobile Money', 'Cash', 'Crypto'
  institution?: string; // e.g., 'Orabank', 'Wave'
  balance: number;
  currency: string;
  color: string;
}

export interface Transaction {
  id: string;
  walletId: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  date: string; // ISO date string
  memberId?: string; // For multi-user support
}

export interface DateRange {
  start: Date;
  end: Date;
}

export type ViewState = 'dashboard' | 'wallets' | 'transactions' | 'analytics' | 'accounting' | 'budget' | 'settings';

export type Theme = 'dark' | 'light';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isThinking?: boolean;
}

export type BudgetMethod = 'ENVELOPE' | 'ZERO_BASED' | 'FREE' | 'REMAINING';

export interface BudgetLimit {
  category: string;
  limit: number;
}

export interface Member {
  id: string;
  name: string;
  email?: string;
  avatar?: string; // Base64 string or URL
  role: 'admin' | 'viewer' | 'editor';
  isAdmin: boolean;
  isPremium: boolean;
}