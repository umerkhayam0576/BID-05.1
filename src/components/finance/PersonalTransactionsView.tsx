import React, { useEffect, useState } from 'react';

type PersonalAccount = {
  id: string;
  name: string;
  currency: string;
  openingBalance: string;
};

type PersonalTransaction = {
  id: string;
  accountId: string;
  transactionType: string;
  category: string | null;
  description: string | null;
  amount: string;
  transactionDate: string;
};

const CATEGORIES = ['Salary', 'Business Income', 'Food', 'Transport', 'Bills', 'Shopping', 'Health', 'Education', 'Other'];

export const PersonalTransactionsView: React.FC = () => {
  const [accounts, setAccounts] = useState<PersonalAccount[]>([]);
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<PersonalTransaction | null>(null);
  const [form, setForm] = useState({
    accountId: '',
    transactionType: 'income',
    category: 'Salary',
    description: '',
    amount: '',
    transactionDate: new Date().toISOString().slice(0, 10),
  });

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [accountsResponse, transactionsResponse] = await Promise.all([
        fetch('/api/personal-finance/accounts', { credentials: 'include' }),
        fetch('/api/personal-finance/transactions', { credentials: 'include' }),
      ]);
      if (!accountsResponse.ok || !transactionsResponse.ok) throw new Error('Could not load personal transaction data');
      const accountData = await accountsResponse.json() as PersonalAccount[];
      setAccounts(accountData);
      setTransactions(await transactionsResponse.json());
      setForm((current) => ({ ...current, accountId: current.accountId || accountData[0]?.id || '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load transactions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const addTransaction = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.accountId || !form.amount || !form.transactionDate) {
      setError('Account, amount, and date are required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const response = await fetch(editing ? '/api/personal-finance/transactions/' + editing.id : '/api/personal-finance/transactions', {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: form.accountId,
          transactionType: form.transactionType,
          category: form.category,
          description: form.description.trim() || null,
          amount: form.amount,
          transactionDate: form.transactionDate,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save transaction');
      setTransactions((current) => editing ? current.map((item) => item.id === data.id ? data : item) : [data, ...current]);
      setEditing(null);
      setForm((current) => ({ ...current, description: '', amount: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save transaction');
    } finally {
      setSaving(false);
    }
  };

  const removeTransaction = async (transaction: PersonalTransaction) => {
    if (!window.confirm('Remove this transaction? This permanently deletes the record.')) return;
    const response = await fetch('/api/personal-finance/transactions/' + transaction.id, { method: 'DELETE', credentials: 'include' });
    if (!response.ok) { const data = await response.json(); setError(data.error || 'Could not remove transaction'); return; }
    setTransactions((current) => current.filter((item) => item.id !== transaction.id));
  };

  const accountName = (accountId: string) => accounts.find((account) => account.id === accountId)?.name || 'Unknown account';
  const income = transactions.filter((item) => item.transactionType === 'income').reduce((sum, item) => sum + Number(item.amount), 0);
  const expenses = transactions.filter((item) => item.transactionType === 'expense').reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1400px] mx-auto">
      <section className="rounded-xl border border-[#222a3d] bg-[#131b2e] p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#4edea3] font-mono font-bold">Personal Wealth</p>
        <div className="mt-1 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#dae2fd]">Personal Transactions</h1>
            <p className="mt-1 text-sm text-[#86948a]">Record personal income and expenses against your own accounts. Every entry is stored under your authenticated personal account.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 min-w-[280px]">
            <div className="rounded-lg border border-[#222a3d] bg-[#0b1326] px-4 py-3">
              <span className="block text-[10px] uppercase font-mono text-[#86948a]">Income</span>
              <span className="block mt-1 text-lg font-mono font-bold text-[#4edea3]">$${income.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="rounded-lg border border-[#222a3d] bg-[#0b1326] px-4 py-3">
              <span className="block text-[10px] uppercase font-mono text-[#86948a]">Expenses</span>
              <span className="block mt-1 text-lg font-mono font-bold text-[#ffb4ab]">$${expenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-5">
        <section className="rounded-xl border border-[#222a3d] bg-[#131b2e] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#dae2fd]">Transaction history</h2>
              <p className="text-xs text-[#86948a] mt-0.5">${transactions.length} recorded transaction${transactions.length === 1 ? '' : 's'}</p>
            </div>
            <button type="button" onClick={() => void loadData()} className="text-xs font-mono text-[#4edea3] hover:underline">Refresh</button>
          </div>
          {error && <div className="m-4 rounded-lg border border-[#ff7886]/40 bg-[#ff7886]/10 px-3 py-2 text-xs text-[#ffb4ab]">{error}</div>}
          {loading ? (
            <div className="p-8 text-sm text-[#86948a]">Loading transactions from the database…</div>
          ) : transactions.length === 0 ? (
            <div className="p-8 text-sm text-[#86948a]">No personal transactions yet. Record your first income or expense on the right.</div>
          ) : (
            <div className="divide-y divide-[#222a3d]">
              {transactions.map((transaction) => (
                <div key={transaction.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={transaction.transactionType === 'income' ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}>
                        {transaction.transactionType === 'income' ? '↑' : '↓'}
                      </span>
                      <h3 className="font-semibold text-[#dae2fd]">{transaction.description || transaction.category || 'Personal transaction'}</h3>
                    </div>
                    <p className="mt-1 text-xs font-mono text-[#86948a]">{transaction.transactionDate} · {accountName(transaction.accountId)} · {transaction.category || 'Uncategorized'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                  <span className={`font-mono font-bold ${transaction.transactionType === 'income' ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}`}>
                    {transaction.transactionType === 'income' ? '+' : '-'}${Number(transaction.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                  <button type="button" onClick={() => { setEditing(transaction); setForm({ accountId: transaction.accountId, transactionType: transaction.transactionType, category: transaction.category || 'Other', description: transaction.description || '', amount: transaction.amount, transactionDate: transaction.transactionDate }); }} className="rounded-md border border-[#2d3449] px-3 py-2 text-xs text-[#dae2fd]">Edit</button>
                  <button type="button" onClick={() => void removeTransaction(transaction)} className="rounded-md border border-[#ff7886]/40 bg-[#ff7886]/10 px-3 py-2 text-xs text-[#ffb4ab]">Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#4edea3]/30 bg-[#131b2e] p-5 h-fit">
          <p className="text-[10px] uppercase tracking-wider text-[#4edea3] font-mono font-bold">{editing ? 'Edit transaction' : 'New transaction'}</p>
          <h2 className="mt-1 text-lg font-bold text-[#dae2fd]">{editing ? 'Correct transaction' : 'Record income or expense'}</h2>
          <form onSubmit={addTransaction} className="mt-5 space-y-4">
            <label className="block">
              <span className="block text-xs font-semibold text-[#bbcabf] mb-1.5">Account</span>
              <select value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })} className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" disabled={!accounts.length}>
                {!accounts.length && <option value="">No accounts available</option>}
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.currency}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs font-semibold text-[#bbcabf] mb-1.5">Type</span>
                <select value={form.transactionType} onChange={(e) => setForm({ ...form, transactionType: e.target.value })} className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]">
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-[#bbcabf] mb-1.5">Amount</span>
                <input type="number" min="0" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
              </label>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-[#bbcabf] mb-1.5">Category</span>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]">
                {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-[#bbcabf] mb-1.5">Description</span>
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. September salary" className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-[#bbcabf] mb-1.5">Date</span>
              <input type="date" value={form.transactionDate} onChange={(e) => setForm({ ...form, transactionDate: e.target.value })} className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
            </label>
            <button type="submit" disabled={saving || !accounts.length} className="w-full h-10 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold disabled:opacity-60">
              {saving ? 'Saving…' : editing ? 'Update transaction' : 'Save transaction'}
            </button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm((current) => ({ ...current, description: '', amount: '' })); }} className="w-full text-xs text-[#86948a]">Cancel edit</button>}
          </form>
        </section>
      </div>
    </div>
  );
};

export default PersonalTransactionsView;
