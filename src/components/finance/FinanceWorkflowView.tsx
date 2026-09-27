import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { financeApi, type FinanceApiAccount, type FinanceApiGoal, type FinanceApiTransaction } from '../../services/financeApi';
import { CheckCircle2, Circle, ClipboardCheck, Download, Plus, RefreshCw, ShieldCheck } from 'lucide-react';
import { FinanceAccount, FinanceBudget, FinanceGoal, FinanceTransaction, RecurringBill } from '../../types/finance';
import { INITIAL_ACCOUNTS, INITIAL_BUDGETS, INITIAL_NET_WORTH_HISTORY, INITIAL_TRANSACTIONS } from '../../data/financeData';
import { AccountsList } from './AccountsList';
import { TransactionsList } from './TransactionsList';
import { BudgetsProgress } from './BudgetsProgress';
import { RecurringBills } from './RecurringBills';
import { FinancialGoals } from './FinancialGoals';
import { NetWorthChart } from './NetWorthChart';
import { FinanceMetricCards } from './FinanceMetricCards';
import { AddAccountModal } from './AddAccountModal';
import { AddTransactionModal } from './AddTransactionModal';
import { AddGoalModal } from './AddGoalModal';
import { ImportTransactionsModal } from './ImportTransactionsModal';
import { ConnectFinancialAccountModal } from './ConnectFinancialAccountModal';
import { FinancialConnectionsPanel, type Connection } from './FinancialConnectionsPanel';
import { ProviderConfigurationPanel } from './ProviderConfigurationPanel';
import { FinanceSyncAutomation } from './FinanceSyncAutomation';

interface FinanceWorkflowViewProps {
  privacyMode: boolean;
}

type WorkflowStep = 'accounts' | 'transactions' | 'plan' | 'review';

export const FinanceWorkflowView: React.FC<FinanceWorkflowViewProps> = ({ privacyMode }) => {
  const [accounts, setAccounts] = useState<FinanceAccount[]>(INITIAL_ACCOUNTS);
  const [transactions, setTransactions] = useState<FinanceTransaction[]>(INITIAL_TRANSACTIONS);
  const [budgets] = useState<FinanceBudget[]>(INITIAL_BUDGETS);
  const [goals, setGoals] = useState<FinanceGoal[]>([]);
  const [bills] = useState<RecurringBill[]>([]);
  const [activeStep, setActiveStep] = useState<WorkflowStep>('accounts');
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isConnectAccountModalOpen, setIsConnectAccountModalOpen] = useState(false);
  const [connections, setConnections] = useState<Connection[]>([
    { provider: 'Wise', mode: 'company', status: 'pending', balance: '—', lastSync: 'Partner approval required' },
    { provider: 'Payoneer', mode: 'company', status: 'not_connected', balance: '—', lastSync: 'Not connected' },
    { provider: 'Airwallex', mode: 'company', status: 'not_connected', balance: '—', lastSync: 'Not connected' },
    { provider: 'Mercury', mode: 'personal', status: 'not_connected', balance: '—', lastSync: 'Not connected' },
  ]);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [lastReconciled, setLastReconciled] = useState<string | null>(null);
  const requestConnection = (index: number) => setConnections((current) => current.map((connection, itemIndex) => itemIndex === index ? { ...connection, status: 'pending', lastSync: 'Awaiting partner approval' } : connection));
  const approveConnection = (index: number) => setConnections((current) => current.map((connection, itemIndex) => itemIndex === index ? { ...connection, status: 'connected', balance: 'Awaiting first sync', lastSync: 'Approved by partner' } : connection));
  const removeConnection = (index: number) => {
    if (!window.confirm(`Remove ${connections[index].provider} account connection?`)) return;
    setConnections((current) => current.filter((_, itemIndex) => itemIndex !== index));
  };
  const addRequestedConnection = (provider: Connection['provider'], mode: Connection['mode']) => setConnections((current) => current.some((connection) => connection.provider === provider) ? current.map((connection) => connection.provider === provider ? { ...connection, mode, status: 'pending', lastSync: mode === 'company' ? 'Partner approval required' : 'Ready for provider authorization' } : connection) : [...current, { provider, mode, status: mode === 'company' ? 'pending' : 'connected', balance: 'Awaiting first sync', lastSync: mode === 'company' ? 'Partner approval required' : 'Ready for provider authorization' }]);

  const apiEnabled = Boolean(import.meta.env.VITE_API_URL);
  const { data: remoteAccounts, error: accountsError, mutate: refreshAccounts } = useSWR<FinanceApiAccount[]>(apiEnabled ? 'finance-accounts' : null, financeApi.listAccounts);
  const { data: remoteTransactions, error: transactionsError, mutate: refreshTransactions } = useSWR<FinanceApiTransaction[]>(apiEnabled ? 'finance-transactions' : null, financeApi.listTransactions);
  const { data: remoteGoals, error: goalsError, mutate: refreshGoals } = useSWR<FinanceApiGoal[]>(apiEnabled ? 'finance-goals' : null, financeApi.listGoals);

  const syncedAccounts = remoteAccounts?.map((account): FinanceAccount => ({
    id: String(account.id),
    name: account.name,
    institution: account.type,
    category: account.type === 'credit' ? 'credit' : account.type === 'loan' ? 'loan' : 'cash',
    balance: Number(account.currentBalance),
    currency: account.currency,
    accountNumberMask: 'API',
    updatedAt: new Date().toISOString(),
  }));
  const syncedTransactions = remoteTransactions?.map((transaction): FinanceTransaction => ({
    id: String(transaction.id),
    date: transaction.transactionDate,
    merchant: transaction.counterparty || transaction.description,
    category: transaction.category || 'Uncategorized',
    accountName: String(transaction.accountId),
    amount: transaction.type === 'expense' || transaction.type === 'withdrawal' ? -Number(transaction.amount) : Number(transaction.amount),
    type: transaction.type === 'income' ? 'income' : transaction.type === 'expense' ? 'expense' : 'transfer',
    status: 'cleared',
    note: transaction.description,
  }));
  const syncedGoals = remoteGoals?.map((goal): FinanceGoal => ({
    id: String(goal.id),
    title: goal.name,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    targetDate: goal.targetDate || '',
    category: 'general',
    color: '#4edea3',
  }));
  const displayedAccounts = syncedAccounts || accounts;
  const displayedTransactions = syncedTransactions || transactions;
  const displayedGoals = syncedGoals || goals;
  const syncError = accountsError || transactionsError || goalsError;
  const connectedCount = connections.filter((connection) => connection.status === 'connected').length;
  const syncNow = async () => {
    if (!apiEnabled) return;
    await Promise.all([refreshAccounts(), refreshTransactions(), refreshGoals()]);
  };

  const totals = useMemo(() => {
    const assets = displayedAccounts.filter((account) => !['credit', 'loan'].includes(account.category)).reduce((sum, account) => sum + account.balance, 0);
    const liabilities = displayedAccounts.filter((account) => ['credit', 'loan'].includes(account.category)).reduce((sum, account) => sum + account.balance, 0);
    const income = displayedTransactions.filter((transaction) => transaction.type === 'income').reduce((sum, transaction) => sum + transaction.amount, 0);
    const spending = Math.abs(displayedTransactions.filter((transaction) => transaction.type === 'expense').reduce((sum, transaction) => sum + transaction.amount, 0));
    return { assets, liabilities, netWorth: assets - liabilities, income, spending };
  }, [displayedAccounts, displayedTransactions, budgets]);

  const handleAddTransaction = async (transaction: FinanceTransaction) => {
    setTransactions((current) => [transaction, ...current]);
    if (!apiEnabled) return;
    const selectedAccount = displayedAccounts.find((account) => account.name === transaction.accountName);
    if (!selectedAccount || !/^\d+$/.test(selectedAccount.id)) return;
    try {
      await financeApi.createTransaction({
        accountId: Number(selectedAccount.id),
        scope: 'personal',
        type: transaction.type,
        amount: Math.abs(transaction.amount),
        description: transaction.note || transaction.merchant,
        transactionDate: transaction.date,
        category: transaction.category,
        counterparty: transaction.merchant,
      });
      await Promise.all([refreshAccounts(), refreshTransactions()]);
    } catch (error) {
      console.error('[v0] Could not persist transaction:', error);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactions((current) => current.filter((transaction) => transaction.id !== id));
    if (!apiEnabled || !/^\d+$/.test(id)) return;
    try {
      await financeApi.deleteTransaction(Number(id));
      await Promise.all([refreshAccounts(), refreshTransactions()]);
    } catch (error) {
      console.error('[v0] Could not delete transaction:', error);
    }
  };

  const handleAddGoal = async (goal: FinanceGoal) => {
    setGoals((current) => [...current, goal]);
    if (!apiEnabled) return;
    try {
      await financeApi.createGoal({ scope: 'personal', name: goal.title, targetAmount: goal.targetAmount, currentAmount: goal.currentAmount, targetDate: goal.targetDate });
      await refreshGoals();
    } catch (error) {
      console.error('[v0] Could not persist goal:', error);
    }
  };

  const handleAddAccount = async (account: FinanceAccount) => {
    setAccounts((current) => [...current, account]);
    if (!apiEnabled) return;
    try {
      await financeApi.createAccount({
        scope: 'personal',
        name: account.name,
        type: account.category,
        openingBalance: account.balance,
      });
      await refreshAccounts();
    } catch (error) {
      console.error('[v0] Could not persist account:', error);
    }
  };

  const completeStep = (step: WorkflowStep) => {
    const order: WorkflowStep[] = ['accounts', 'transactions', 'plan', 'review'];
    setActiveStep(order[Math.min(order.indexOf(step) + 1, order.length - 1)]);
  };

  const exportSummary = () => {
    const lines = [
      'Bid Exact Personal Finance Monthly Summary',
      `Generated: ${new Date().toLocaleDateString()}`,
      `Net worth: $${totals.netWorth.toLocaleString()}`,
      `Assets: $${totals.assets.toLocaleString()}`,
      `Liabilities: $${totals.liabilities.toLocaleString()}`,
      `Income recorded: $${totals.income.toLocaleString()}`,
      `Spending recorded: $${totals.spending.toLocaleString()}`,
      `Transactions: ${transactions.length}`,
      `Accounts: ${accounts.length}`,
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BidExact_Finance_Summary_${new Date().toISOString().slice(0, 10)}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-3 sm:p-5 lg:p-7 space-y-5 max-w-[1600px] mx-auto">
      {apiEnabled && <div className={`rounded-lg border px-3 py-2 text-xs ${syncError ? 'border-[#ff7886]/40 bg-[#ff7886]/10 text-[#ffb4ab]' : 'border-[#4edea3]/30 bg-[#4edea3]/10 text-[#9af5c9]'}`}>{syncError ? 'Database sync unavailable. Showing local preview data.' : remoteAccounts || remoteTransactions ? 'Live Neon data connected.' : 'Connecting to live finance data…'}</div>}
      <section className="rounded-xl border border-[#222a3d] bg-[#131b2e] p-4 sm:p-5">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-[#4edea3] font-mono font-bold">Personal finance operating workflow</p>
            <h1 className="mt-1 text-xl sm:text-2xl font-bold text-[#dae2fd]">Monthly money control center</h1>
            <p className="mt-1 text-sm text-[#86948a] max-w-2xl">Connect accounts, capture transactions, set the plan, then reconcile and close the month with an auditable summary.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setIsConnectAccountModalOpen(true)} className="h-9 px-3 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Connect account</button>
            <button onClick={() => setIsTransactionModalOpen(true)} className="h-9 px-3 rounded-md border border-[#2d3449] bg-[#171f33] text-[#dae2fd] text-xs font-bold inline-flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" />Add transaction</button>
            <button onClick={exportSummary} className="h-9 px-3 rounded-md border border-[#2d3449] bg-[#171f33] text-[#dae2fd] text-xs font-mono inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />Export summary</button>
          </div>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-5">
          {[
            ['1', 'Connect accounts', 'accounts'],
            ['2', 'Capture activity', 'transactions'],
            ['3', 'Plan and protect', 'plan'],
            ['4', 'Review and close', 'review'],
          ].map(([number, label, step]) => {
            const active = activeStep === step;
            const complete = ['transactions', 'plan', 'review'].includes(activeStep) && step === 'accounts' || activeStep === 'plan' && step === 'transactions' || activeStep === 'review' && step === 'plan';
            return <button key={step} onClick={() => setActiveStep(step as WorkflowStep)} className={`text-left rounded-lg border p-3 transition-colors ${active ? 'border-[#4edea3]/60 bg-[#4edea3]/10' : 'border-[#222a3d] bg-[#0b1326] hover:border-[#3b455b]'}`}><span className={`text-[10px] font-mono ${active ? 'text-[#4edea3]' : 'text-[#86948a]'}`}>{complete ? '✓' : number}</span><span className="block mt-1 text-xs font-semibold text-[#dae2fd]">{label}</span></button>;
          })}
        </div>
      </section>

      <FinancialConnectionsPanel connections={connections} onRequest={requestConnection} onApprove={approveConnection} onRemove={removeConnection} />
      <FinanceSyncAutomation onSyncNow={syncNow} connectedCount={connectedCount} />
      <ProviderConfigurationPanel />

      <FinanceMetricCards
        totalAssets={totals.assets}
        totalLiabilities={totals.liabilities}
        netWorth={totals.netWorth}
        monthlyIncome={totals.income}
        monthlyExpenses={totals.spending}
        budgetAllocated={budgets.reduce((sum, budget) => sum + budget.allocated, 0)}
        budgetSpent={budgets.reduce((sum, budget) => sum + budget.spent, 0)}
        liquidCash={displayedAccounts.filter((account) => account.category === 'cash').reduce((sum, account) => sum + account.balance, 0)}
        privacyMode={privacyMode}
      />

      {activeStep === 'accounts' && <div className="space-y-4"><AccountsList accounts={displayedAccounts} privacyMode={privacyMode} onOpenAddAccount={() => setIsAccountModalOpen(true)} /><div className="flex justify-end"><button onClick={() => completeStep('accounts')} className="h-9 px-4 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold">Continue to activity</button></div></div>}
      {activeStep === 'transactions' && <div className="space-y-4"><div className="flex justify-end"><button onClick={() => setIsImportModalOpen(true)} className="h-9 rounded-md border border-[#2d3449] bg-[#171f33] px-3 text-xs font-semibold text-[#dae2fd]">Import CSV / OFX</button></div><TransactionsList transactions={displayedTransactions} privacyMode={privacyMode} onDeleteTransaction={handleDeleteTransaction} onOpenAddTransaction={() => setIsTransactionModalOpen(true)} searchQuery="" /><div className="flex justify-end"><button onClick={() => completeStep('transactions')} className="h-9 px-4 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold">Continue to planning</button></div></div>}
      {activeStep === 'plan' && <div className="grid grid-cols-1 xl:grid-cols-2 gap-4"><BudgetsProgress budgets={budgets} privacyMode={privacyMode} /><RecurringBills bills={bills} privacyMode={privacyMode} /><FinancialGoals goals={displayedGoals} privacyMode={privacyMode} onOpenAddGoal={() => setIsGoalModalOpen(true)} onContributeGoal={() => undefined} /><div className="xl:col-span-2 flex justify-end"><button onClick={() => completeStep('plan')} className="h-9 px-4 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold">Continue to monthly close</button></div></div>}
      {activeStep === 'review' && <div className="space-y-4"><section className="rounded-xl border border-[#222a3d] bg-[#131b2e] p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] uppercase tracking-wider text-[#4edea3] font-mono font-bold">Monthly close checklist</p><h2 className="mt-1 text-lg font-bold text-[#dae2fd]">Review, reconcile, and close</h2></div><ShieldCheck className="w-5 h-5 text-[#4edea3]" /></div><div className="grid sm:grid-cols-2 gap-3 mt-5">{['All account balances reviewed', 'Pending transactions categorized', 'Budgets compared with actuals', 'Bills and goals reviewed'].map((item) => <div key={item} className="flex items-center gap-2 rounded-lg border border-[#222a3d] bg-[#0b1326] p-3 text-xs text-[#bbcabf]"><CheckCircle2 className="w-4 h-4 text-[#4edea3]" />{item}</div>)}</div><div className="mt-5 flex flex-wrap items-center justify-between gap-3"><span className="text-xs text-[#86948a]">{lastReconciled ? `Last closed ${lastReconciled}` : 'This month is ready for review.'}</span><button onClick={() => setLastReconciled(new Date().toLocaleDateString())} className="h-9 px-4 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold inline-flex items-center gap-1.5"><RefreshCw className="w-3.5 h-3.5" />Reconcile and close month</button></div></section><NetWorthChart data={INITIAL_NET_WORTH_HISTORY} privacyMode={privacyMode} /></div>}

      <ConnectFinancialAccountModal isOpen={isConnectAccountModalOpen} onClose={() => setIsConnectAccountModalOpen(false)} onRequested={addRequestedConnection} />
      <AddAccountModal isOpen={isAccountModalOpen} onClose={() => setIsAccountModalOpen(false)} onAddAccount={handleAddAccount} />
      <AddTransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} accounts={displayedAccounts} onAddTransaction={handleAddTransaction} />
      <AddGoalModal isOpen={isGoalModalOpen} onClose={() => setIsGoalModalOpen(false)} onAddGoal={handleAddGoal} />
      <ImportTransactionsModal isOpen={isImportModalOpen} accounts={displayedAccounts} onClose={() => setIsImportModalOpen(false)} onImport={(imported) => setTransactions((current) => [...imported, ...current])} />
    </div>
  );
};

export default FinanceWorkflowView;
