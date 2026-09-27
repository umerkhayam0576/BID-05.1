import React, { useState } from 'react';
import {
  Wallet,
  Eye,
  EyeOff,
  Plus,
  ArrowLeftRight,
  TrendingUp,
  Search,
  Bell,
  ChevronDown,
  Building,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';

interface FinanceTopNavProps {
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  selectedMonth: string;
  onSelectMonth: (month: string) => void;
  onOpenAddTransaction: () => void;
  onOpenTransfer: () => void;
  onSwitchWorkspace: (ws: 'personal-finance' | 'pre-con-estimating') => void;
  activeWorkspace: 'personal-finance' | 'pre-con-estimating';
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const FinanceTopNav: React.FC<FinanceTopNavProps> = ({
  privacyMode,
  onTogglePrivacy,
  selectedMonth,
  onSelectMonth,
  onOpenAddTransaction,
  onOpenTransfer,
  onSwitchWorkspace,
  activeWorkspace,
  searchQuery,
  onSearchChange,
}) => {
  const [workspaceMenuOpen, setWorkspaceMenuOpen] = useState(false);
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);

  const months = [
    'September 2026 (Current)',
    'August 2026',
    'July 2026',
    'YTD 2026 Overview',
  ];

  return (
    <header
      id="finance-top-nav"
      className="h-16 bg-[#131b2e] border-b border-[#222a3d] px-4 sm:px-6 flex items-center justify-between gap-3 sticky top-0 z-40"
    >
      {/* Left: Brand & Workspace Switcher */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#4edea3]/10 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] shrink-0 shadow-sm">
            <Wallet className="w-4 h-4" />
          </div>
          <div className="hidden sm:block">
            <h2 className="text-sm font-bold text-[#dae2fd] tracking-tight leading-tight">
              Personal Finance Hub
            </h2>
            <span className="text-[10px] font-mono text-[#86948a] uppercase tracking-wider block">
              Wealth, Cashflow & Budgets
            </span>
          </div>
        </div>

        {/* Workspace Switcher Pill */}
        <div className="relative">
          <button
            onClick={() => setWorkspaceMenuOpen(!workspaceMenuOpen)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b1326] border border-[#2d3449] hover:border-[#4edea3]/40 text-xs font-mono text-[#bbcabf] hover:text-[#dae2fd] transition-colors cursor-pointer"
            title="Switch between Personal Finance and Pre-Con Estimating"
          >
            <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
            <span className="truncate max-w-[130px] sm:max-w-none">
              {activeWorkspace === 'personal-finance'
                ? 'Personal Wealth'
                : 'Pre-Con Hub'}
            </span>
            <ChevronDown className="w-3 h-3 text-[#86948a]" />
          </button>

          {workspaceMenuOpen && (
            <div className="absolute left-0 mt-1.5 w-60 rounded-lg bg-[#171f33] border border-[#2d3449] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
              <div className="px-2 py-1 text-[10px] font-mono uppercase text-[#86948a] font-bold">
                Switch Operational Workspace
              </div>
              <button
                onClick={() => {
                  onSwitchWorkspace('personal-finance');
                  setWorkspaceMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded text-xs flex items-center justify-between transition-colors ${
                  activeWorkspace === 'personal-finance'
                    ? 'bg-[#4edea3]/15 text-[#4edea3] font-semibold'
                    : 'text-[#dae2fd] hover:bg-[#222a3d]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Wallet className="w-3.5 h-3.5" />
                  <span>Personal Finance Hub</span>
                </div>
                {activeWorkspace === 'personal-finance' && <span className="text-xs">✓</span>}
              </button>
              <button
                onClick={() => {
                  onSwitchWorkspace('pre-con-estimating');
                  setWorkspaceMenuOpen(false);
                }}
                className={`w-full text-left px-2.5 py-2 rounded text-xs flex items-center justify-between transition-colors ${
                  activeWorkspace === 'pre-con-estimating'
                    ? 'bg-[#4edea3]/15 text-[#4edea3] font-semibold'
                    : 'text-[#dae2fd] hover:bg-[#222a3d]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-[#3b82f6]" />
                  <span>Bid Exact Pre-Con Hub</span>
                </div>
                {activeWorkspace === 'pre-con-estimating' && <span className="text-xs">✓</span>}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Middle: Search bar */}
      <div className="hidden md:flex items-center flex-1 max-w-xs relative">
        <Search className="w-3.5 h-3.5 text-[#86948a] absolute left-3" />
        <input
          type="text"
          placeholder="Search transactions, accounts..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-8 pl-8 pr-3 bg-[#0b1326] border border-[#222a3d] focus:border-[#4edea3]/60 rounded-md text-xs text-[#dae2fd] placeholder:text-[#86948a] outline-none transition-colors"
        />
      </div>

      {/* Right: Controls & Actions */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Privacy Mode Toggle */}
        <button
          onClick={onTogglePrivacy}
          className={`h-8 px-2.5 rounded-md border flex items-center gap-1.5 text-xs font-mono transition-colors cursor-pointer ${
            privacyMode
              ? 'bg-[#f59e0b]/15 border-[#f59e0b]/40 text-[#fcd34d]'
              : 'bg-[#0b1326] border-[#222a3d] hover:bg-[#171f33] text-[#86948a] hover:text-[#dae2fd]'
          }`}
          title={privacyMode ? 'Show dollar balances' : 'Hide sensitive numbers (Privacy Mode)'}
        >
          {privacyMode ? (
            <>
              <EyeOff className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Private</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Balances Visible</span>
            </>
          )}
        </button>

        {/* Period Selector */}
        <div className="relative hidden lg:block">
          <button
            onClick={() => setPeriodMenuOpen(!periodMenuOpen)}
            className="h-8 px-2.5 rounded-md bg-[#0b1326] border border-[#222a3d] hover:border-[#2d3449] flex items-center gap-1.5 text-xs font-mono text-[#dae2fd] cursor-pointer"
          >
            <span>{selectedMonth}</span>
            <ChevronDown className="w-3 h-3 text-[#86948a]" />
          </button>

          {periodMenuOpen && (
            <div className="absolute right-0 mt-1.5 w-56 rounded-lg bg-[#171f33] border border-[#2d3449] shadow-xl p-1 z-50">
              {months.map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    onSelectMonth(m);
                    setPeriodMenuOpen(false);
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded text-xs font-mono text-[#dae2fd] hover:bg-[#222a3d]"
                >
                  {m}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Credit Score Pill */}
        <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#0b1326] border border-[#222a3d] text-xs font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3]" />
          <span className="text-[#86948a]">FICO:</span>
          <span className="font-bold text-[#4edea3]">784</span>
        </div>

        {/* Quick Add Transaction Button */}
        <button
          onClick={onOpenAddTransaction}
          className="h-8 px-3 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-bold font-mono flex items-center gap-1.5 transition-all shadow cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span className="hidden xs:inline">Add Transaction</span>
          <span className="xs:hidden">Add</span>
        </button>
      </div>
    </header>
  );
};
