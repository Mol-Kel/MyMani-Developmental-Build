export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number; // in cents
  currency: string;
  category: string;
  date: string;
  note?: string;
  receiptUri?: string;
  recurring?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Budget {
  id: string;
  category: string;
  allocatedAmount: number; // in cents
  spentAmount: number; // in cents
  month: string; // YYYY-MM format
  createdAt: string;
  updatedAt: string;
}

export interface SavingsGoal {
  id: string;
  title: string;
  targetAmount: number; // in cents
  currentAmount: number; // in cents
  targetDate?: string;
  isReached: boolean;
  deposits: Deposit[];
  createdAt: string;
  updatedAt: string;
}

export interface Deposit {
  id: string;
  amount: number; // in cents
  date: string;
  note?: string;
}

export interface Note {
  id: string;
  content: string;
  date?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export const EXPENSE_CATEGORIES = [
  'Food & Dining',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills & Utilities',
  'Healthcare',
  'Education',
  'Other',
] as const;

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Other',
] as const;
