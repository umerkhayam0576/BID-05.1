import React, { useState } from 'react';
import {
  Building2,
  Plus,
  Landmark,
  TrendingUp,
  CreditCard,
  Car,
  GraduationCap,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { FinanceAccount } from '../../types/finance';

interface AccountsListProps {
  accounts: FinanceAccount[];
  privacyMode: boolean;
  onOpenAddAccount: () => void;
  onSelectAccount?: (acc: FinanceAccount) => void;
}

export const AccountsList: React.FC<AccountsListProps> = ({
  accounts,
  privacyMode,
  onOpenAddAccount,
  onSelectAccount,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'cash' | 'investment' | 'credit' | 'loan'>('all');

  const format = (val: number) => {
    if (privacyMode) return '$••••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Math.abs(val));
  };

  const filteredAccounts =
    selectedCategory === 'all'
      ? accounts
      : accounts.filter((a) => a.category === selectedCategory);

  const getAccountIcon = (category: string, name: string) => {
    if (name.toLowerCase().includes('auto') || name.toLowerCase().includes('toyota')) {
      return <Car className="w-4 h-4 text-[#ff7886]" />;
    }
    if (name.toLowerCase().includes('student') || name.toLowerCase().includes('mohela')) {
      return <GraduationCap className="w-4 h-4 text-[#ff7886]" />;
    }
    if (category === 'cash') {
      return <Landmark className="w-4 h-4 text-[#4edea3]" />;
    }
    if (category === 'investment') {
      return <TrendingUp className="w-4 h-4 text-[#3b82f6]" />;
    }
    return <CreditCard className="w-4 h-4 text-[#f59e0b]" />;
  };

  return (
    <div
      id="accounts-portfolio-card"
      className="p-4 sm:p-5 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#dae2fd]">
              Connected Financial Accounts & Ledgers
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-semibold">
              {accounts.length} Active
            </span>
          </div>
          <p className="text-xs text-[#86948a] mt-0.5">
            Depository banks, self-directed brokerage, crypto custody, and liability notes
          </p>
        </div>

        <button
          onClick={onOpenAddAccount}
          className="h-8 px-3 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 text-[#4edea3]" />
          <span>Add Account</span>
        </button>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs font-mono">
        {[
          { id: 'all', label: 'All Accounts' },
          { id: 'cash', label: 'Cash & Savings' },
          { id: 'investment', label: 'Investments' },
          { id: 'credit', label: 'Credit Cards' },
          { id: 'loan', label: 'Loans & Debts' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id as any)}
            className={`px-2.5 py-1 rounded-md transition-colors whitespace-nowrap cursor-pointer ${
              selectedCategory === tab.id
                ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/40 font-semibold'
                : 'text-[#86948a] hover:text-[#dae2fd] hover:bg-[#171f33]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filteredAccounts.map((acc) => {
          const isLiability = acc.category === 'credit' || acc.category === 'loan';

          return (
            <div
              key={acc.id}
              onClick={() => onSelectAccount && onSelectAccount(acc)}
              className="p-3.5 rounded-lg bg-[#0b1326] border border-[#222a3d] hover:border-[#3b455b] transition-all flex flex-col justify-between group cursor-pointer"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-md bg-[#131b2e] border border-[#222a3d] flex items-center justify-center shrink-0">
                      {getAccountIcon(acc.category, acc.name)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#dae2fd] group-hover:text-[#4edea3] transition-colors leading-tight">
                        {acc.name}
                      </h4>
                      <span className="text-[10px] font-mono text-[#86948a]">
                        {acc.institution} • {acc.accountNumberMask}
                      </span>
                    </div>
                  </div>

                  {acc.apyOrApr && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#171f33] text-[#bbcabf] border border-[#2d3449]">
                      {acc.apyOrApr}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#171f33] flex items-center justify-between font-mono">
                <span className="text-[10px] text-[#86948a] uppercase">
                  {acc.updatedAt}
                </span>
                <span
                  className={`text-sm font-bold ${
                    isLiability ? 'text-[#ff7886]' : 'text-[#4edea3]'
                  }`}
                >
                  {isLiability ? `-${format(acc.balance)}` : format(acc.balance)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
