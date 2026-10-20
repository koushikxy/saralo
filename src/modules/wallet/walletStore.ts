import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { persistStorage } from '../../core/storage/persistStorage';

export interface WalletTransaction {
  id: string;
  type: 'INCOME' | 'EXPENSE';
  amount: number;
  category: string;
  note?: string;
  date: string;
  time?: string;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  ifscCode: string;
  accountHolder: string;
  accountType: 'Savings' | 'Current';
}

export interface SavedCard {
  id: string;
  cardName: string;
  cardType: 'Credit' | 'Debit';
  network: 'Visa' | 'Mastercard' | 'RuPay' | 'Amex';
  cardNumber: string;
  expiryDate: string;
  cardHolder: string;
  colorTheme?: 'dark' | 'blue' | 'purple' | 'emerald';
}

export const INCOME_SOURCES = [
  'Salary',
  'Freelance / Projects',
  'Business / Sales',
  'Investments',
  'Allowance / Pocket Money',
  'Gift',
  'Refund / Cashback',
  'Other',
] as const;

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Groceries',
  'Shopping',
  'Rent & Housing',
  'Bills & Utilities',
  'Transport & Fuel',
  'Health & Fitness',
  'Entertainment',
  'Education',
  'Other',
] as const;

export interface WalletState {
  transactions: WalletTransaction[];
  upiId: string;
  upiName: string;
  customQrImageUri: string | null;
  bankAccounts: BankAccount[];
  savedCards: SavedCard[];
  monthlyBudget: number;
  categoryBudgets: Record<string, number>;

  addTransaction: (tx: Omit<WalletTransaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
  updateTransaction: (id: string, tx: Partial<WalletTransaction>) => void;
  setUpiDetails: (upiId: string, upiName: string) => void;
  setCustomQrImageUri: (uri: string | null) => void;
  addBankAccount: (bank: Omit<BankAccount, 'id'>) => void;
  deleteBankAccount: (id: string) => void;
  addCard: (card: Omit<SavedCard, 'id'>) => void;
  deleteCard: (id: string) => void;
  setBudgets: (monthlyBudget: number, categoryBudgets: Record<string, number>) => void;

  getTotalBalance: () => number;
  getTotalIncome: () => number;
  getTotalExpense: () => number;
}

export const useWalletStore = create<WalletState>()(
  persist((set, get) => ({
  upiId: '',
  monthlyBudget: 0,
  categoryBudgets: {},
  setBudgets: (monthlyBudget, categoryBudgets) => set({ monthlyBudget, categoryBudgets }),
  upiName: '',
  customQrImageUri: null,

  bankAccounts: [],

  savedCards: [],

  transactions: [],

  addTransaction: (tx) => {
    const newTx: WalletTransaction = {
      ...tx,
      id: 'tx-' + Date.now(),
    };
    set((state) => ({ transactions: [newTx, ...state.transactions] }));
  },

  updateTransaction: (id, tx) =>
    set((state) => ({ transactions: state.transactions.map((t) => (t.id === id ? { ...t, ...tx } : t)) })),

  deleteTransaction: (id) => {
    set((state) => ({
      transactions: state.transactions.filter((t) => t.id !== id),
    }));
  },

  setUpiDetails: (upiId, upiName) => {
    set({ upiId, upiName });
  },

  setCustomQrImageUri: (uri) => {
    set({ customQrImageUri: uri });
  },

  addBankAccount: (bank) => {
    const b: BankAccount = {
      ...bank,
      id: 'b-' + Date.now(),
    };
    set((state) => ({ bankAccounts: [b, ...state.bankAccounts] }));
  },

  deleteBankAccount: (id) => {
    set((state) => ({
      bankAccounts: state.bankAccounts.filter((b) => b.id !== id),
    }));
  },

  addCard: (card) => {
    const c: SavedCard = {
      ...card,
      id: 'c-' + Date.now(),
    };
    set((state) => ({ savedCards: [c, ...state.savedCards] }));
  },

  deleteCard: (id) => {
    set((state) => ({
      savedCards: state.savedCards.filter((c) => c.id !== id),
    }));
  },

  getTotalBalance: () => {
    return get().transactions.reduce((sum, t) => {
      return t.type === 'INCOME' ? sum + t.amount : sum - t.amount;
    }, 0);
  },

  getTotalIncome: () => {
    return get().transactions.reduce((sum, t) => {
      return t.type === 'INCOME' ? sum + t.amount : sum;
    }, 0);
  },

  getTotalExpense: () => {
    return get().transactions.reduce((sum, t) => {
      return t.type === 'EXPENSE' ? sum + t.amount : sum;
    }, 0);
  },
}), {
  name: 'lifeos-wallet',
  storage: persistStorage,
  version: 1,
  migrate: (state: any) => ({
    ...state,
    savedCards: (state.savedCards || []).map(({ cvv, ...card }: SavedCard & { cvv?: string }) => card),
  }),
})
);
