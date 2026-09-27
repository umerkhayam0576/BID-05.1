export type FinanceScope = 'personal' | 'company'

export interface FinanceApiAccount {
  id: number
  name: string
  type: string
  scope: FinanceScope
  currency: string
  currentBalance: string | number
}

export interface FinanceApiGoal {
  id: number
  name: string
  targetAmount: string | number
  currentAmount: string | number
  targetDate?: string | null
  scope: FinanceScope
}

export interface FinanceApiTransaction {
  id: number
  accountId: number
  scope: FinanceScope
  type: FinanceTransactionType
  amount: string | number
  description: string
  transactionDate: string
  category?: string | null
  counterparty?: string | null
}
export type FinanceTransactionType = 'income' | 'expense' | 'transfer' | 'deposit' | 'withdrawal' | 'adjustment'

export interface FinanceAccountInput {
  name: string
  type: string
  scope: FinanceScope
  currency?: string
  openingBalance?: number
}

export interface FinanceTransactionInput {
  accountId: number
  scope: FinanceScope
  type: FinanceTransactionType
  amount: number
  description: string
  transactionDate?: string
  category?: string
  counterparty?: string
  transferAccountId?: number
}

const apiBase = import.meta.env.VITE_API_URL || ''
const userId = import.meta.env.VITE_FINANCE_USER_ID || 'preview-user'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiBase}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', 'x-user-id': userId, ...(init?.headers || {}) },
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error || 'Finance request failed')
  return payload as T
}

export const financeApi = {
  listAccounts: () => request<FinanceApiAccount[]>('/api/finance/accounts'),
  createAccount: (input: FinanceAccountInput) => request<FinanceApiAccount>('/api/finance/accounts', { method: 'POST', body: JSON.stringify(input) }),
  listTransactions: () => request<FinanceApiTransaction[]>('/api/finance/transactions'),
  createTransaction: (input: FinanceTransactionInput) => request('/api/finance/transactions', { method: 'POST', body: JSON.stringify(input) }),
  deleteTransaction: (id: number) => request<void>(`/api/finance/transactions/${id}`, { method: 'DELETE' }),
  listBudgets: () => request('/api/finance/budgets'),
  listGoals: () => request<FinanceApiGoal[]>('/api/finance/goals'),
  createGoal: (input: { scope: FinanceScope; name: string; targetAmount: number; currentAmount?: number; targetDate?: string }) => request<FinanceApiGoal>('/api/finance/goals', { method: 'POST', body: JSON.stringify(input) }),
  listRecurringRules: () => request('/api/finance/recurring'),
}
