import React from 'react';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from 'lucide-react';

interface FinanceMetricCardsProps {
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  budgetAllocated: number;
  budgetSpent: number;
  liquidCash: number;
  privacyMode: boolean;
  onViewAccounts?: () => void;
  onViewBudgets?: () => void;
}

export const FinanceMetricCards: React.FC<FinanceMetricCardsProps> = ({
  totalAssets,
  totalLiabilities,
  netWorth,
  monthlyIncome,
  monthlyExpenses,
  budgetAllocated,
  budgetSpent,
  liquidCash,
  privacyMode,
  onViewAccounts,
  onViewBudgets,
}) => {
  const format = (val: number, forceSign = false) => {
    if (privacyMode) return '$••••••';
    const formatted = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(Math.abs(val));
    if (forceSign) {
      return val >= 0 ? `+${formatted}` : `-${formatted}`;
    }
    return val < 0 ? `-${formatted}` : formatted;
  };

  const netCashflow = monthlyIncome - monthlyExpenses;
  const savingsRate = monthlyIncome > 0 ? Math.round((netCashflow / monthlyIncome) * 100) : 0;
  const budgetRemaining = budgetAllocated - budgetSpent;
  const budgetPercent = budgetAllocated > 0 ? Math.round((budgetSpent / budgetAllocated) * 100) : 0;
  const monthlyBurnRate = monthlyExpenses > 0 ? monthlyExpenses : 4700;
  const runwayMonths = (liquidCash / monthlyBurnRate).toFixed(1);

  return (
    <div
      id="finance-kpi-row"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
    >
      {/* 1. Total Net Worth */}
      <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] hover:border-[#2d3449] transition-all flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#86948a] font-semibold">
              Total Net Worth
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-semibold">
              <TrendingUp className="w-3 h-3" />
              <span>+1.98% MoM</span>
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#dae2fd]">
            {format(netWorth)}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#222a3d] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1 text-[#4edea3]">
            <span>Assets:</span>
            <span className="font-semibold">{format(totalAssets)}</span>
          </div>
          <div className="flex items-center gap-1 text-[#ff7886]">
            <span>Debts:</span>
            <span className="font-semibold">{format(totalLiabilities)}</span>
          </div>
        </div>
      </div>

      {/* 2. Monthly Net Cash Flow */}
      <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] hover:border-[#2d3449] transition-all flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#86948a] font-semibold">
              Monthly Cash Flow
            </span>
            <span className="flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-semibold">
              <Sparkles className="w-3 h-3" />
              <span>{savingsRate}% Saved</span>
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#4edea3]">
            {format(netCashflow, true)}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#222a3d] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1 text-[#adc6ff]">
            <span>In:</span>
            <span className="font-semibold">{format(monthlyIncome)}</span>
          </div>
          <div className="flex items-center gap-1 text-[#fcd34d]">
            <span>Out:</span>
            <span className="font-semibold">{format(monthlyExpenses)}</span>
          </div>
        </div>
      </div>

      {/* 3. Monthly Budget Burndown */}
      <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] hover:border-[#2d3449] transition-all flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#86948a] font-semibold">
              Budget Remaining
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#3b82f6]/10 text-[#adc6ff] border border-[#3b82f6]/30 font-semibold">
              {budgetPercent}% Used
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#dae2fd]">
            {format(budgetRemaining)}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#222a3d] space-y-1.5">
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-[#0b1326] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                budgetPercent > 90
                  ? 'bg-[#ff7886]'
                  : budgetPercent > 75
                  ? 'bg-[#fcd34d]'
                  : 'bg-[#4edea3]'
              }`}
              style={{ width: `${Math.min(budgetPercent, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] font-mono text-[#86948a]">
            <span>Spent: {format(budgetSpent)}</span>
            <span>Limit: {format(budgetAllocated)}</span>
          </div>
        </div>
      </div>

      {/* 4. Liquid Emergency Reserve */}
      <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] hover:border-[#2d3449] transition-all flex flex-col justify-between group">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono uppercase tracking-wider text-[#86948a] font-semibold">
              Emergency Runway
            </span>
            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-semibold">
              4.75% High Yield
            </span>
          </div>

          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-[#dae2fd]">
            {runwayMonths} <span className="text-base text-[#86948a] font-normal">Months</span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[#222a3d] flex items-center justify-between text-[11px] font-mono">
          <div className="flex items-center gap-1 text-[#bbcabf]">
            <span>Liquid Cash:</span>
            <span className="font-semibold text-white">{format(liquidCash)}</span>
          </div>
          <span className="text-[10px] text-[#4edea3] font-bold">FDIC Insured</span>
        </div>
      </div>
    </div>
  );
};
