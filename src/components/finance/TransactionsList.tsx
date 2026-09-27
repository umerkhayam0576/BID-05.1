import React, { useState } from 'react';
import {
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowLeftRight,
  Trash2,
  Calendar,
  Plus,
  Receipt,
} from 'lucide-react';
import { FinanceTransaction, TransactionType } from '../../types/finance';

interface TransactionsListProps {
  transactions: FinanceTransaction[];
  privacyMode: boolean;
  onDeleteTransaction: (id: string) => void;
  onOpenAddTransaction: () => void;
  searchQuery: string;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  privacyMode,
  onDeleteTransaction,
  onOpenAddTransaction,
  searchQuery,
}) => {
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const format = (val: number, isIncome: boolean) => {
    if (privacyMode) return '$••••••';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(Math.abs(val));
    return isIncome ? `+${formatted}` : `-${formatted}`;
  };

  // Categories list
  const categories = Array.from(new Set(transactions.map((t) => t.category)));

  const filtered = transactions.filter((t) => {
    if (filterType !== 'all' && t.type !== filterType) return false;
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        t.merchant.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        t.accountName.toLowerCase().includes(q) ||
        (t.note && t.note.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div
      id="recent-transactions-card"
      className="p-4 sm:p-5 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-4"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#dae2fd]">
              Recent Activity & Transaction Ledger
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3b82f6]/10 text-[#adc6ff] border border-[#3b82f6]/30 font-semibold">
              {filtered.length} Recorded
            </span>
          </div>
          <p className="text-xs text-[#86948a] mt-0.5">
            Real-time feed of debit, credit, income deposits, and internal transfers
          </p>
        </div>

        <button
          onClick={onOpenAddTransaction}
          className="h-8 px-3 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Add Transaction</span>
        </button>
      </div>

      {/* Filter Chips & Type Selector */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-[#171f33]">
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {[
            { id: 'all', label: 'All' },
            { id: 'expense', label: 'Expenses' },
            { id: 'income', label: 'Income' },
            { id: 'transfer', label: 'Transfers' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterType(tab.id as any)}
              className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                filterType === tab.id
                  ? 'bg-[#171f33] text-[#4edea3] border border-[#4edea3]/40 font-semibold'
                  : 'text-[#86948a] hover:text-[#dae2fd]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Category selector */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="h-7 px-2 bg-[#0b1326] border border-[#222a3d] rounded text-xs font-mono text-[#dae2fd] outline-none"
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Transactions Table / List */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="text-[10px] text-[#86948a] uppercase border-b border-[#222a3d]">
            <tr>
              <th className="pb-2 font-semibold">Date</th>
              <th className="pb-2 font-semibold">Merchant / Source</th>
              <th className="pb-2 font-semibold">Category</th>
              <th className="pb-2 font-semibold hidden md:table-cell">Account</th>
              <th className="pb-2 font-semibold text-right">Amount</th>
              <th className="pb-2 font-semibold text-right pr-2">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#171f33]">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-[#86948a]">
                  No matching transactions found.
                </td>
              </tr>
            ) : (
              filtered.map((t) => {
                const isIncome = t.type === 'income';
                const isTransfer = t.type === 'transfer';

                return (
                  <tr
                    key={t.id}
                    className="hover:bg-[#0b1326]/60 transition-colors group"
                  >
                    {/* Date */}
                    <td className="py-3 text-[#86948a] whitespace-nowrap">
                      {t.date}
                    </td>

                    {/* Merchant & Note */}
                    <td className="py-3 pr-3">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs ${
                            isIncome
                              ? 'bg-[#4edea3]/10 text-[#4edea3]'
                              : isTransfer
                              ? 'bg-[#3b82f6]/10 text-[#adc6ff]'
                              : 'bg-[#ff7886]/10 text-[#ff7886]'
                          }`}
                        >
                          {isIncome ? (
                            <ArrowDownLeft className="w-3.5 h-3.5" />
                          ) : isTransfer ? (
                            <ArrowLeftRight className="w-3.5 h-3.5" />
                          ) : (
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-semibold text-[#dae2fd] block truncate max-w-[200px] sm:max-w-xs">
                            {t.merchant}
                          </span>
                          {t.note && (
                            <span className="text-[10px] text-[#86948a] block truncate">
                              {t.note}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded bg-[#0b1326] border border-[#222a3d] text-[11px] text-[#bbcabf]">
                        {t.category}
                      </span>
                    </td>

                    {/* Account */}
                    <td className="py-3 text-[#86948a] whitespace-nowrap hidden md:table-cell">
                      {t.accountName}
                    </td>

                    {/* Amount */}
                    <td
                      className={`py-3 text-right font-bold whitespace-nowrap ${
                        isIncome
                          ? 'text-[#4edea3]'
                          : isTransfer
                          ? 'text-[#adc6ff]'
                          : 'text-[#dae2fd]'
                      }`}
                    >
                      {format(t.amount, isIncome)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 text-right pr-2">
                      <button
                        onClick={() => onDeleteTransaction(t.id)}
                        className="p-1 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-[#ff7886] transition-colors cursor-pointer"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
