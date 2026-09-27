export type AccountCategory = 'cash' | 'investment' | 'credit' | 'loan';

export interface FinanceAccount {
  id: string;
  name: string;
  institution: string;
  category: AccountCategory;
  balance: number;
  currency: string;
  accountNumberMask: string; // e.g. "•••• 4821"
  apyOrApr?: string; // e.g. "4.75% APY" or "19.99% APR"
  updatedAt: string;
}

export type TransactionType = 'expense' | 'income' | 'transfer';

export interface FinanceTransaction {
  id: string;
  date: string;
  merchant: string;
  category: string;
  accountName: string;
  amount: number; // positive for income, negative for expense
  type: TransactionType;
  status: 'cleared' | 'pending';
  note?: string;
  iconName?: string;
}

export interface FinanceBudget {
  id: string;
  category: string;
  spent: number;
  allocated: number;
  period: string; // "Monthly"
  color: string;
  icon: string;
}

export interface FinanceGoal {
  id: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  targetDate: string;
  category: string;
  color: string;
  notes?: string;
}

export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  dueDay: number; // e.g. 24th of each month
  nextDueDate: string;
  category: string;
  autoPay: boolean;
  frequency: 'Monthly' | 'Annual' | 'Quarterly';
}

export interface NetWorthPoint {
  month: string;
  assets: number;
  liabilities: number;
  netWorth: number;
}
