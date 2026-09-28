import React, { useEffect, useState } from 'react';

type PersonalTransaction = {
  accountId: string;
  transactionType: string;
  amount: string;
};

type PersonalAccount = {
  id: string;
  name: string;
  accountType: string;
  currency: string;
  openingBalance: string;
  status: string;
};

const ACCOUNT_TYPES = ['cash', 'checking', 'savings', 'investment', 'other'];

export const PersonalAccountsView: React.FC = () => {
  const [accounts, setAccounts] = useState<PersonalAccount[]>([]);
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', accountType: 'cash', currency: 'USD', openingBalance: '' });
  const [editing, setEditing] = useState<PersonalAccount | null>(null);

  const loadAccounts = async () => {
    setLoading(true);
    setError('');
    try {
      const [accountsResponse, transactionsResponse] = await Promise.all([
        fetch('/api/personal-finance/accounts', { credentials: 'include' }),
        fetch('/api/personal-finance/transactions', { credentials: 'include' }),
      ]);
      if (!accountsResponse.ok || !transactionsResponse.ok) throw new Error('Could not load personal account data');
      setAccounts(await accountsResponse.json());
      setTransactions(await transactionsResponse.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load personal accounts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void loadAccounts(); }, []);

  const addAccount = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) { setError('Account name is required.'); return; }
    setSaving(true);
    setError('');
    try {
      const response = await fetch(editing ? '/api/personal-finance/accounts/' + editing.id : '/api/personal-finance/accounts', {
        method: editing ? 'PUT' : 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          accountType: form.accountType,
          currency: form.currency.trim().toUpperCase() || 'USD',
          openingBalance: form.openingBalance || '0',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not create account');
      setAccounts((current) => editing ? current.map((account) => account.id === data.id ? data : account) : [data, ...current]);
      setEditing(null);
      setForm({ name: '', accountType: 'cash', currency: 'USD', openingBalance: '' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create account');
    } finally {
      setSaving(false);
    }
  };

  const removeAccount = async (account: PersonalAccount) => {
    if (!window.confirm('Remove "' + account.name + '"? It will be archived and its transaction history will be preserved.')) return;
    const response = await fetch('/api/personal-finance/accounts/' + account.id, { method: 'DELETE', credentials: 'include' });
    if (!response.ok) { const data = await response.json(); setError(data.error || 'Could not remove account'); return; }
    setAccounts((current) => current.filter((item) => item.id !== account.id));
  };

  const currentBalance = (account: PersonalAccount) => transactions.reduce((balance, transaction) => {
    if (transaction.accountId !== account.id) return balance;
    const amount = Number(transaction.amount || 0);
    return transaction.transactionType === 'income' ? balance + amount : transaction.transactionType === 'expense' ? balance - amount : balance;
  }, Number(account.openingBalance || 0));

  const totalCurrent = accounts.reduce((sum, account) => sum + currentBalance(account), 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1400px] mx-auto">
      <section className="rounded-xl border border-[#222a3d] bg-[#131b2e] p-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#4edea3] font-mono font-bold">Personal Wealth</p>
        <div className="mt-1 flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-[#dae2fd]">Personal Accounts</h1>
            <p className="mt-1 text-sm text-[#86948a]">Live balances calculated from opening balances plus recorded income and expenses. Company funds stay separate.</p>
          </div>
          <div className="rounded-lg border border-[#222a3d] bg-[#0b1326] px-4 py-3">
            <span className="block text-[10px] uppercase font-mono text-[#86948a]">Current balances</span>
            <span className="block mt-1 text-lg font-mono font-bold text-[#4edea3]">${totalCurrent.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-5">
        <section className="rounded-xl border border-[#222a3d] bg-[#131b2e] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between">
            <div>
              <h2 className="font-bold text-[#dae2fd]">Your accounts</h2>
              <p className="text-xs text-[#86948a] mt-0.5">{accounts.length} active account{accounts.length === 1 ? '' : 's'}</p>
            </div>
            <button type="button" onClick={() => void loadAccounts()} className="text-xs font-mono text-[#4edea3] hover:underline">Refresh</button>
          </div>
          {error && <div className="m-4 rounded-lg border border-[#ff7886]/40 bg-[#ff7886]/10 px-3 py-2 text-xs text-[#ffb4ab]">{error}</div>}
          {loading ? (
            <div className="p-8 text-sm text-[#86948a]">Loading accounts from the database…</div>
          ) : accounts.length === 0 ? (
            <div className="p-8 text-sm text-[#86948a]">No personal accounts yet. Add your first account on the right.</div>
          ) : (
            <div className="divide-y divide-[#222a3d]">
              {accounts.map((account) => {
                const balance = currentBalance(account);
                return <div key={account.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[#4edea3]">account_balance</span>
                      <h3 className="font-semibold text-[#dae2fd]">{account.name}</h3>
                    </div>
                    <p className="mt-1 text-xs font-mono text-[#86948a] uppercase">{account.accountType} · {account.currency} · {account.status}</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="block text-[10px] uppercase font-mono text-[#86948a]">Current balance</span>
                    <span className="block mt-1 text-lg font-mono font-bold text-[#dae2fd]">
                      {account.currency} {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="block mt-0.5 text-[10px] font-mono text-[#86948a]">
                      Opening {Number(account.openingBalance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => { setEditing(account); setForm({ name: account.name, accountType: account.accountType, currency: account.currency, openingBalance: account.openingBalance }); }} className="rounded-md border border-[#2d3449] px-3 py-2 text-xs text-[#dae2fd]">Edit</button>
                    <button type="button" onClick={() => void removeAccount(account)} className="rounded-md border border-[#ff7886]/40 bg-[#ff7886]/10 px-3 py-2 text-xs text-[#ffb4ab]">Remove</button>
                  </div>
                </div>
              })}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-[#4edea3]/30 bg-[#131b2e] p-5 h-fit">
          <p className="text-[10px] uppercase tracking-wider text-[#4edea3] font-mono font-bold">{editing ? 'Edit account' : 'Add account'}</p>
          <h2 className="mt-1 text-lg font-bold text-[#dae2fd]">{editing ? 'Correct personal account' : 'Create personal account'}</h2>
          <form onSubmit={addAccount} className="mt-5 space-y-4">
            <label className="block">
              <span className="block text-xs font-semibold text-[#bbcabf] mb-1.5">Account name</span>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Main Bank" className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-[#bbcabf] mb-1.5">Account type</span>
              <select value={form.accountType} onChange={(e) => setForm({ ...form, accountType: e.target.value })} className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]">
                {ACCOUNT_TYPES.map((type) => <option key={type} value={type}>{type[0].toUpperCase() + type.slice(1)}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs font-semibold text-[#bbcabf] mb-1.5">Currency</span>
                <input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} maxLength={3} className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-[#bbcabf] mb-1.5">Opening balance</span>
                <input type="number" min="0" step="0.01" value={form.openingBalance} onChange={(e) => setForm({ ...form, openingBalance: e.target.value })} placeholder="0.00" className="w-full rounded-md border border-[#2d3449] bg-[#0b1326] px-3 py-2.5 text-sm text-[#dae2fd] outline-none focus:border-[#4edea3]" />
              </label>
            </div>
            <button type="submit" disabled={saving} className="w-full h-10 rounded-md bg-[#4edea3] text-[#003824] text-xs font-bold disabled:opacity-60">
              {saving ? 'Saving…' : editing ? 'Update account' : 'Save personal account'}
            </button>
            {editing && <button type="button" onClick={() => { setEditing(null); setForm({ name: '', accountType: 'cash', currency: 'USD', openingBalance: '' }); }} className="w-full text-xs text-[#86948a]">Cancel edit</button>}
          </form>
        </section>
      </div>
    </div>
  );
};

export default PersonalAccountsView;
