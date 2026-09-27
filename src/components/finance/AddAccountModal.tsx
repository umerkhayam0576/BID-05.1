import React, { useState } from 'react';
import { X, Plus, Landmark, CreditCard, TrendingUp, Car } from 'lucide-react';
import { FinanceAccount, AccountCategory } from '../../types/finance';

interface AddAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddAccount: (acc: FinanceAccount) => void;
}

export const AddAccountModal: React.FC<AddAccountModalProps> = ({
  isOpen,
  onClose,
  onAddAccount,
}) => {
  const [name, setName] = useState('');
  const [institution, setInstitution] = useState('');
  const [category, setCategory] = useState<AccountCategory>('cash');
  const [balance, setBalance] = useState('');
  const [apyOrApr, setApyOrApr] = useState('');
  const [mask, setMask] = useState('•••• 1234');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numBalance = parseFloat(balance);
    if (!name.trim() || isNaN(numBalance)) return;

    const newAcc: FinanceAccount = {
      id: `acc-${Date.now()}`,
      name: name.trim(),
      institution: institution.trim() || 'Manual Account',
      category,
      balance: numBalance,
      currency: 'USD',
      accountNumberMask: mask.startsWith('••••') ? mask : `•••• ${mask.slice(-4)}`,
      apyOrApr: apyOrApr.trim() || undefined,
      updatedAt: 'Added just now',
    };

    onAddAccount(newAcc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#171f33]">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-[#3b82f6]/10 border border-[#3b82f6]/30 flex items-center justify-center text-[#adc6ff]">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#dae2fd]">
                Link / Add Financial Account
              </h3>
              <p className="text-[11px] text-[#86948a]">
                Add bank account, investment portfolio, credit card, or loan
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
          <div>
            <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
              Account Nickname *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Marcus High Yield Savings"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Institution Name
              </label>
              <input
                type="text"
                placeholder="e.g. Goldman Sachs"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Account Type
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AccountCategory)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs text-[#dae2fd] outline-none font-mono"
              >
                <option value="cash">Cash & Checking / Savings</option>
                <option value="investment">Investments & Retirement</option>
                <option value="credit">Credit Card (Liability)</option>
                <option value="loan">Loan / Mortgage (Liability)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Current Balance ($) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="e.g. 15000"
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs font-mono text-[#dae2fd] outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
                Yield / Rate (APY or APR)
              </label>
              <input
                type="text"
                placeholder="e.g. 4.85% APY"
                value={apyOrApr}
                onChange={(e) => setApyOrApr(e.target.value)}
                className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs font-mono text-[#dae2fd] outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold mb-1">
              Account Number Mask
            </label>
            <input
              type="text"
              placeholder="•••• 4821"
              value={mask}
              onChange={(e) => setMask(e.target.value)}
              className="w-full h-9 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3] rounded-md px-3 text-xs font-mono text-[#dae2fd] outline-none"
            />
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
              <span>Link Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
