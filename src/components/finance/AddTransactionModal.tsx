import React, { useState } from 'react';
import { X, Plus, DollarSign, ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react';
import { FinanceTransaction, TransactionType, FinanceAccount } from '../../types/finance';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: FinanceTransaction) => void;
  accounts: FinanceAccount[];
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  accounts,
}) => {
  const [type, setType] = useState<TransactionType>('expense');
  const [merchant, setMerchant] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Groceries & Provisions');
  const [accountId, setAccountId] = useState(accounts[0]?.id || '');
  const [date, setDate] = useState(
    new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })
  );
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!merchant.trim() || isNaN(numAmount) || numAmount <= 0) return;

    const selectedAcc = accounts.find((a) => a.id === accountId) || accounts[0];

    const finalAmount = type === 'expense' ? -numAmount : numAmount;

    const newTx: FinanceTransaction = {
      id: `tx-${Date.now()}`,
      date,
      merchant: merchant.trim(),
      category: type === 'income' ? 'Income' : category,
      accountName: selectedAcc ? selectedAcc.name : 'Primary Account',
      amount: finalAmount,
      type,
      status: 'cleared',
      note: note.trim() || undefined,
    };

    onAddTransaction(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#171f33]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#4edea3]/10 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#dae2fd]">
                Record Transaction
              </h3>
              <p className="text-[11px] text-[#86948a]">
                Log an expense, incoming deposit, or account transfer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Type Selector Pills */}
          <div className="grid grid-cols-3 gap-2 p-1 bg-[#0b1326] rounded-lg border border-[#222a3d]">
            <button
              type="button"
              onClick={() => setType('expense')}
              className={`py-1.5 rounded text-xs font-mono font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                type === 'expense'
                  ? 'bg-[#ff7886] text-[#41000b] shadow-sm'
                  : 'text-[#86948a] hover:text-[#dae2fd]'
              }`}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Expense</span>
            </button>
            <button
              type="button"
              onClick={() => setType('income')}
              className={`py-1.5 rounded text-xs font-mono font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                type === 'income'
                  ? 'bg-[#4edea3] text-[#003824] shadow-sm'
                  : 'text-[#86948a] hover:text-[#dae2fd]'
              }`}
            >
              <ArrowDownLeft className="w-3.5 h-3.5" />
              <span>Income</span>
            </button>
            <button
              type="button"
              onClick={() => setType('transfer')}
              className={`py-1.5 rounded text-xs font-mono font-semibold flex items-center justify-center gap-1 transition-colors cursor-pointer ${
                type === 'transfer'
                  ? 'bg-[#3b82f6] text-white shadow-sm'
                  : 'text-[#86948a] hover:text-[#dae2fd]'
              }`}
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>Transfer</span>
            </button>
          </div>

          {/* Amount & Merchant */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Amount ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 75.50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs font-mono text-[#dae2fd] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Merchant / Source *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Trader Joe's or Employer Payroll"
                value={merchant}
                onChange={(e) => setMerchant(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
              />
            </div>
          </div>

          {/* Category & Account */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {type !== 'income' ? (
              <div>
                <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                  Budget Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
                >
                  <option value="Groceries & Provisions">Groceries & Provisions</option>
                  <option value="Dining Out & Coffee">Dining Out & Coffee</option>
                  <option value="Housing & Rent">Housing & Rent</option>
                  <option value="Transportation & Fuel">Transportation & Fuel</option>
                  <option value="Utilities & Gigabit Internet">Utilities & Internet</option>
                  <option value="Subscriptions & Software">Subscriptions & Software</option>
                  <option value="Health, Wellness & Gym">Health & Fitness</option>
                  <option value="Travel & Discretionary">Travel & Leisure</option>
                  <option value="Investments">Investments</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                  Income Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
                >
                  <option value="Income">Salary / Direct Deposit</option>
                  <option value="Bonus & Dividends">Bonus & Dividends</option>
                  <option value="Side Hustle / Consulting">Side Income</option>
                  <option value="Refund / Reimbursement">Refund / Reimbursement</option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Account
              </label>
              <select
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({a.institution})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Note */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Date
              </label>
              <input
                type="text"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs font-mono text-[#dae2fd] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Optional Memo / Note
              </label>
              <input
                type="text"
                placeholder="e.g. Weekly family groceries"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 border-t border-[#222a3d] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded text-xs font-mono text-[#86948a] hover:text-[#dae2fd]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Save Transaction</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
