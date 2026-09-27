import React, { useState } from 'react';
import { CompanyEntity, LedgerEvent, CapTableMember } from '../../types/wealth';
import { CompanyDataImportPanel } from '../views/CompanyDataImportPanel';

interface CompanyWorkspaceViewProps {
  company: CompanyEntity;
  onReturnToConsolidated: () => void;
  onSelectEntity: (id: string | null) => void;
  allCompanies: CompanyEntity[];
  ledgerEvents: LedgerEvent[];
  onOpenRecordCapital: () => void;
  privacyMode: boolean;
  onTogglePrivacy?: () => void;
  onSwitchWorkspace?: (ws: 'personal-finance' | 'pre-con-estimating') => void;
  onUpdateCompany?: (updated: CompanyEntity) => void;
}

type CompanyTabId =
  | 'overview'
  | 'cap-table'
  | 'p-and-l'
  | 'distributions'
  | 'governance'
  | 'projects'
  | 'documents';

export const CompanyWorkspaceView: React.FC<CompanyWorkspaceViewProps> = ({
  company,
  onReturnToConsolidated,
  onSelectEntity,
  allCompanies,
  ledgerEvents,
  onOpenRecordCapital,
  privacyMode,
  onTogglePrivacy,
  onSwitchWorkspace,
  onUpdateCompany,
}) => {
  const [activeTab, setActiveTab] = useState<CompanyTabId>('overview');
  const [isSwitchMenuOpen, setIsSwitchMenuOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
  const [viewingDoc, setViewingDoc] = useState<string | null>(null);
  const [isCompanyImportOpen, setIsCompanyImportOpen] = useState(false);

  // Dilution Simulator State
  const [raiseAmount, setRaiseAmount] = useState<number>(250000);
  const [preMoneyValuation, setPreMoneyValuation] = useState<number>(company.enterpriseValuation);

  // Add Member State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [newMemberPercent, setNewMemberPercent] = useState<number>(5);
  const [newMemberInvestment, setNewMemberInvestment] = useState<number>(25000);
  const [newMemberVoting, setNewMemberVoting] = useState<boolean>(true);

  const mask = (val: string | number) => {
    if (privacyMode) return '$••••••';
    if (typeof val === 'number') {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    return val;
  };

  const companyEvents = ledgerEvents.filter((ev) => ev.entityId === company.id);

  // Dilution math
  const postMoneyValuation = preMoneyValuation + raiseAmount;
  const newInvestorStake = (raiseAmount / postMoneyValuation) * 100;
  const yourCurrentOwnership = company.legalOwnershipPercent;
  const yourDilutedOwnership = yourCurrentOwnership * (1 - newInvestorStake / 100);
  const yourDilutedValue = (postMoneyValuation * yourDilutedOwnership) / 100;

  // Add Shareholder to Cap Table
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const newMember: CapTableMember = {
      name: newMemberName.trim(),
      role: newMemberRole.trim() || 'Equity Holder',
      percentage: Number(newMemberPercent),
      initialInvestment: Number(newMemberInvestment),
      votingRights: newMemberVoting,
    };

    const updatedCapTable = [...company.capTable, newMember];
    if (onUpdateCompany) {
      onUpdateCompany({
        ...company,
        capTable: updatedCapTable,
      });
    }

    setNewMemberName('');
    setNewMemberRole('');
    setNewMemberPercent(5);
    setNewMemberInvestment(25000);
    setIsAddMemberOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#060e20] text-[#dae2fd] flex flex-col antialiased selection:bg-[#4edea3]/25 selection:text-[#4edea3]">
      {/* 1. DEDICATED CORPORATE TOP HEADER */}
      <header className="sticky top-0 z-40 bg-[#060e20]/95 backdrop-blur-md border-b border-[#222a3d] px-4 lg:px-8 py-4 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Left: Breadcrumbs & Corporate Identity */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onReturnToConsolidated}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#131b2e] hover:bg-[#1a243b] text-[#4edea3] hover:text-[#5ff2b4] text-xs font-mono font-medium border border-[#4edea3]/30 transition-all cursor-pointer group"
                title="Return to Consolidated Personal Finance & Wealth Command"
              >
                <span className="material-symbols-outlined text-sm transition-transform group-hover:-translate-x-0.5">
                  arrow_back
                </span>
                <span>Return to Personal Wealth Hub</span>
              </button>
              <span className="text-[#2d3449]">/</span>
              <span className="text-[11px] font-mono text-[#bbcabf] uppercase tracking-wider font-semibold">
                Dedicated Company Workspace
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2.5 rounded-lg bg-[#131b2e] border border-[#222a3d] shadow-sm ${
                    company.color === 'primary'
                      ? 'text-[#4edea3]'
                      : company.color === 'secondary'
                      ? 'text-[#adc6ff]'
                      : 'text-[#ffb2b7]'
                  }`}
                >
                  <span className="material-symbols-outlined text-3xl">{company.icon}</span>
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="font-['Manrope'] font-extrabold text-2xl lg:text-3xl text-[#dae2fd] tracking-tight">
                      {company.name}
                    </h1>
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded-full bg-[#10b981]/15 text-[#4edea3] border border-[#10b981]/30 font-bold">
                      {company.statusBadge}
                    </span>
                  </div>
                  <p className="text-xs text-[#bbcabf] font-mono mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{company.industry}</span>
                    <span className="text-[#2d3449]">•</span>
                    <span>{company.ownershipType}</span>
                    <span className="text-[#2d3449]">•</span>
                    <span className="text-[#adc6ff]">EIN: {company.taxId || 'XX-XXX9182'}</span>
                    <span className="text-[#2d3449]">•</span>
                    <span>Founded {company.foundedYear || 2023}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions, Switcher, and Privacy Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Quick Switch Company Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSwitchMenuOpen(!isSwitchMenuOpen)}
                className="px-3 py-2 bg-[#131b2e] hover:bg-[#1a243b] border border-[#222a3d] text-[#dae2fd] rounded text-xs font-mono transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Switch directly to another company"
              >
                <span className="material-symbols-outlined text-sm text-[#adc6ff]">swap_horiz</span>
                <span className="font-semibold">Switch Company</span>
                <span className="material-symbols-outlined text-xs">expand_more</span>
              </button>

              {isSwitchMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-[#0b1326] border border-[#222a3d] rounded-lg shadow-2xl py-1.5 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-[#bbcabf] border-b border-[#222a3d]">
                    Operating Corporate Entities
                  </div>
                  {allCompanies.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectEntity(c.id);
                        setIsSwitchMenuOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between transition-colors ${
                        c.id === company.id
                          ? 'bg-[#131b2e] text-[#4edea3] font-bold'
                          : 'text-[#dae2fd] hover:bg-[#131b2e]'
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="material-symbols-outlined text-sm text-[#4edea3]">
                          {c.icon}
                        </span>
                        <span className="truncate">{c.name}</span>
                      </div>
                      <span className="text-[10px] text-[#bbcabf]">{c.legalOwnershipPercent}%</span>
                    </button>
                  ))}
                  <div className="border-t border-[#222a3d] my-1" />
                  <button
                    type="button"
                    onClick={() => {
                      onReturnToConsolidated();
                      setIsSwitchMenuOpen(false);
                    }}
                    className="w-full px-3 py-2 text-left text-xs font-mono text-[#4edea3] hover:bg-[#131b2e] flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">dashboard</span>
                    <span>Consolidated Personal Hub</span>
                  </button>
                </div>
              )}
            </div>

            {/* Privacy Mode Toggle */}
            {onTogglePrivacy && (
              <button
                type="button"
                onClick={onTogglePrivacy}
                className={`p-2 rounded border transition-colors cursor-pointer ${
                  privacyMode
                    ? 'bg-[#10b981]/20 text-[#4edea3] border-[#10b981]/40'
                    : 'bg-[#131b2e] text-[#bbcabf] hover:text-[#dae2fd] border-[#222a3d]'
                }`}
                title={privacyMode ? 'Show Financial Figures' : 'Hide Financial Figures (Privacy Mode)'}
              >
                <span className="material-symbols-outlined text-base">
                  {privacyMode ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            )}

            {/* If Bid Exact: Quick Launch Pre-Con Estimating Studio */}
            {company.id === 'bid-exact' && onSwitchWorkspace && (
              <button
                type="button"
                onClick={() => onSwitchWorkspace('pre-con-estimating')}
                className="px-3.5 py-2 bg-[#132247] hover:bg-[#1b2d5a] border border-[#adc6ff]/40 text-[#adc6ff] hover:text-white rounded text-xs font-mono font-semibold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
                title="Open Bid Exact Pre-Con Estimating & RFI Studio"
              >
                <span className="material-symbols-outlined text-sm">engineering</span>
                <span>Estimating Studio</span>
              </button>
            )}

            {/* Record Wire / Capital Action */}
            <button
              type="button"
              onClick={onOpenRecordCapital}
              className="px-3.5 py-2 bg-[#10b981] hover:bg-[#059669] text-[#003824] rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">payments</span>
              <span>Record Wire / P&L</span>
            </button>
          </div>
        </div>

        {/* 2. DEDICATED CORPORATE TAB NAVIGATION */}
        <div className="flex items-center gap-1 pt-4 border-t border-[#222a3d]/70 mt-4 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Company Overview & KPI Matrix', icon: 'monitoring' },
            { id: 'cap-table', label: 'Ownership & Cap Table', icon: 'pie_chart' },
            { id: 'p-and-l', label: 'Corporate P&L & Treasury', icon: 'account_balance' },
            { id: 'distributions', label: 'Distribution Ledger & Wires', icon: 'payments' },
            { id: 'governance', label: 'Governance & Resolutions', icon: 'gavel' },
            { id: 'projects', label: 'Commercial Pipeline & Contracts', icon: 'work' },
            { id: 'documents', label: 'Corporate Documents & Vault', icon: 'description' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as CompanyTabId)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#131b2e] text-[#4edea3] font-bold border border-[#4edea3]/40 shadow-sm'
                  : 'text-[#bbcabf] hover:bg-[#131b2e]/60 hover:text-[#dae2fd]'
              }`}
            >
              <span className="material-symbols-outlined text-sm">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </header>

      {/* 3. DEDICATED MAIN CONTENT SURFACE (ONLY THIS COMPANY) */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 lg:p-8 space-y-6">
        {/* TAB 1: OVERVIEW & KPI MATRIX */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Primary KPI Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card 1: Your Equity Position */}
              <div className="bg-[#131b2e] p-5 rounded-lg border border-[#222a3d] shadow-sm space-y-2 relative overflow-hidden">
                <div className="flex items-center justify-between text-[#bbcabf] text-xs font-mono uppercase tracking-wider">
                  <span>Your Equity Value</span>
                  <span className="material-symbols-outlined text-[#4edea3] text-base">diamond</span>
                </div>
                <div className="font-mono text-2xl lg:text-3xl font-bold text-[#4edea3]">
                  {mask(company.equityPositionValue)}
                </div>
                <div className="text-xs text-[#bbcabf] font-mono">
                  <strong className="text-[#dae2fd]">{company.legalOwnershipPercent}%</strong> of{' '}
                  {mask(company.enterpriseValuation)} valuation
                </div>
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#10b981]/5 rounded-full blur-2xl pointer-events-none" />
              </div>

              {/* Card 2: Attributed Profit Share */}
              <div className="bg-[#131b2e] p-5 rounded-lg border border-[#222a3d] shadow-sm space-y-2">
                <div className="flex items-center justify-between text-[#bbcabf] text-xs font-mono uppercase tracking-wider">
                  <span>Attributed Profit Share</span>
                  <span className="material-symbols-outlined text-[#4edea3] text-base">query_stats</span>
                </div>
                <div className="font-mono text-2xl lg:text-3xl font-bold text-[#dae2fd]">
                  {mask(company.attributedProfit)}
                </div>
                <div className="text-xs text-[#bbcabf] font-mono">
                  {company.profitSharePercent}% profit tier on {mask(company.companyNetProfit)} net income
                </div>
              </div>

              {/* Card 3: Cleared Cash Distributions */}
              <div className="bg-[#131b2e] p-5 rounded-lg border border-[#222a3d] shadow-sm space-y-2">
                <div className="flex items-center justify-between text-[#bbcabf] text-xs font-mono uppercase tracking-wider">
                  <span>Distributions Wired</span>
                  <span className="material-symbols-outlined text-[#4edea3] text-base">payments</span>
                </div>
                <div className="font-mono text-2xl lg:text-3xl font-bold text-[#4edea3]">
                  {mask(company.distributionsReceived)}
                </div>
                <div className="text-xs text-[#bbcabf] font-mono">
                  {company.distributionsPending > 0 ? (
                    <span className="text-[#ffb2b7]">
                      +{mask(company.distributionsPending)} declared & pending
                    </span>
                  ) : (
                    <span className="text-[#4edea3]">All declared distributions wired</span>
                  )}
                </div>
              </div>

              {/* Card 4: Operating Cash Reserve */}
              <div className="bg-[#131b2e] p-5 rounded-lg border border-[#222a3d] shadow-sm space-y-2">
                <div className="flex items-center justify-between text-[#bbcabf] text-xs font-mono uppercase tracking-wider">
                  <span>Operating Cash Reserve</span>
                  <span className="material-symbols-outlined text-[#adc6ff] text-base">account_balance</span>
                </div>
                <div className="font-mono text-2xl lg:text-3xl font-bold text-[#dae2fd]">
                  {mask(company.operatingCashReserve || 120000)}
                </div>
                <div className="text-xs text-[#bbcabf] font-mono">
                  Dedicated corporate treasury accounts
                </div>
              </div>
            </div>

            {/* Secondary Operational Metrics Bar */}
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div className="space-y-1">
                <span className="text-[#bbcabf]">Gross Revenue YTD</span>
                <div className="text-base font-bold text-[#dae2fd]">{mask(company.revenueYtd || 340000)}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[#bbcabf]">Operating Expenses YTD</span>
                <div className="text-base font-bold text-[#ffb2b7]">{mask(company.expensesYtd || 260000)}</div>
              </div>
              <div className="space-y-1">
                <span className="text-[#bbcabf]">Net Profit Margin</span>
                <div className="text-base font-bold text-[#4edea3]">
                  {company.revenueYtd
                    ? `${((company.companyNetProfit / company.revenueYtd) * 100).toFixed(1)}%`
                    : '23.5%'}
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[#bbcabf]">Estimated Runway</span>
                <div className="text-base font-bold text-[#adc6ff]">
                  ~14.5 Mo (Cash flow positive)
                </div>
              </div>
            </div>

            {/* Two-Column Deep Entity Insight */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left 7 cols: Cap Table Preview */}
              <div className="lg:col-span-7 bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-['Manrope'] font-bold text-base text-[#dae2fd]">
                      Entity Cap Table & Governance Structure
                    </h3>
                    <p className="text-xs text-[#bbcabf]">Current Schedule A members and voting rights</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('cap-table')}
                    className="text-xs font-mono text-[#4edea3] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage Cap Table</span>
                    <span className="material-symbols-outlined text-sm">arrow_forward</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {company.capTable.map((member, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#0b1326] rounded-lg border border-[#222a3d] flex items-center justify-between"
                    >
                      <div className="space-y-0.5">
                        <div className="font-medium text-sm text-[#dae2fd] flex items-center gap-2">
                          <span>{member.name}</span>
                          {member.votingRights ? (
                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-bold uppercase">
                              Voting
                            </span>
                          ) : (
                            <span className="font-mono text-[9px] px-1.5 py-0.5 rounded bg-[#222a3d] text-[#bbcabf] font-bold uppercase">
                              Non-Voting
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[#bbcabf] font-mono">{member.role}</div>
                      </div>
                      <div className="text-right font-mono">
                        <div className="text-base font-bold text-[#4edea3]">{member.percentage}%</div>
                        <div className="text-xs text-[#bbcabf]">
                          {mask(member.initialInvestment)} committed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right 5 cols: Corporate Verification & Banking Isolation */}
              <div className="lg:col-span-5 bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="font-['Manrope'] font-bold text-base text-[#dae2fd]">
                    Corporate Entity Verification
                  </h3>
                  <div className="p-3 bg-[#0b1326] rounded-lg border border-[#222a3d] space-y-2.5 text-xs font-mono">
                    <div className="flex justify-between">
                      <span className="text-[#bbcabf]">Tax ID (EIN):</span>
                      <span className="text-[#dae2fd] font-semibold">{company.taxId || 'XX-XXX9182'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#bbcabf]">Entity Type:</span>
                      <span className="text-[#dae2fd]">{company.ownershipType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#bbcabf]">State of Formation:</span>
                      <span className="text-[#dae2fd]">Delaware, USA</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#bbcabf]">Fiscal Year:</span>
                      <span className="text-[#dae2fd]">Jan 1 – Dec 31 (Calendar)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#bbcabf]">GAAP Isolation:</span>
                      <span className="text-[#4edea3] font-bold flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">verified</span>
                        <span>100% Isolated & Reconciled</span>
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-[#0b1326] rounded-lg border border-[#222a3d] space-y-1.5 text-xs">
                    <div className="font-mono text-[#4edea3] font-semibold flex items-center gap-1">
                      <span className="material-symbols-outlined text-sm">notes</span>
                      <span>Operating Status Notes</span>
                    </div>
                    <p className="text-[#bbcabf] font-mono leading-relaxed">
                      {company.notes || 'Operating Agreement amended. Corporate books synchronized.'}
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={onOpenRecordCapital}
                    className="w-full py-2.5 px-3 bg-[#171f33] hover:bg-[#222a3d] border border-[#4edea3]/40 text-[#4edea3] rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">payments</span>
                    <span>Record Distribution or Capital Wire</span>
                  </button>
                  {company.id === 'bid-exact' && onSwitchWorkspace && (
                    <button
                      type="button"
                      onClick={() => onSwitchWorkspace('pre-con-estimating')}
                      className="w-full py-2 px-3 bg-[#132247] hover:bg-[#1b2d5a] border border-[#adc6ff]/30 text-[#adc6ff] rounded text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">engineering</span>
                      <span>Jump to Pre-Con Estimating Studio</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CAP TABLE & EQUITY STRUCTURE */}
        {activeTab === 'cap-table' && (
          <div className="space-y-6">
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h2 className="font-['Manrope'] font-bold text-xl text-[#dae2fd]">
                    {company.name} Legal Ownership & Cap Table
                  </h2>
                  <p className="text-xs text-[#bbcabf] font-mono mt-0.5">
                    Schedule A membership register with committed equity, voting rights, and market valuation
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="font-mono text-xs text-[#4edea3] bg-[#0b1326] px-3.5 py-2 rounded border border-[#222a3d]">
                    Enterprise Valuation: <strong className="text-[#dae2fd]">{mask(company.enterpriseValuation)}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddMemberOpen(true)}
                    className="px-3.5 py-2 bg-[#10b981] hover:bg-[#059669] text-[#003824] rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">person_add</span>
                    <span>+ Add Shareholder</span>
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0b1326] text-[#bbcabf] uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-3 px-3">Member / Shareholder</th>
                      <th className="py-3 px-3">Role / Capacity</th>
                      <th className="py-3 px-3 text-right">Ownership %</th>
                      <th className="py-3 px-3 text-right">Committed Capital</th>
                      <th className="py-3 px-3 text-right">Fair Market Value</th>
                      <th className="py-3 px-3 text-center">Voting Rights</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222a3d]">
                    {company.capTable.map((member, idx) => (
                      <tr key={idx} className="hover:bg-[#171f33] transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-[#dae2fd]">{member.name}</td>
                        <td className="py-3.5 px-3 text-[#bbcabf]">{member.role}</td>
                        <td className="py-3.5 px-3 text-right font-bold text-[#4edea3]">
                          {member.percentage}%
                        </td>
                        <td className="py-3.5 px-3 text-right text-[#bbcabf]">
                          {mask(member.initialInvestment)}
                        </td>
                        <td className="py-3.5 px-3 text-right font-semibold text-[#dae2fd]">
                          {mask((company.enterpriseValuation * member.percentage) / 100)}
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          {member.votingRights ? (
                            <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-bold text-[10px]">
                              YES (Full Vote)
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-[#222a3d] text-[#bbcabf] text-[10px]">
                              NO (Observer)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Interactive Dilution & Round Modeling */}
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4edea3]">calculate</span>
                <h3 className="font-['Manrope'] font-bold text-base text-[#dae2fd]">
                  {company.name} Dilution & Round Modeling Simulator
                </h3>
              </div>
              <p className="text-xs text-[#bbcabf] font-mono">
                Simulate how a new capital infusion or funding round affects your equity position in this company.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-mono text-[#bbcabf] mb-1">
                    New Capital Raise ($)
                  </label>
                  <input
                    type="number"
                    value={raiseAmount}
                    onChange={(e) => setRaiseAmount(Number(e.target.value))}
                    step={25000}
                    className="w-full bg-[#0b1326] border border-[#222a3d] rounded px-3 py-2 text-xs font-mono text-[#dae2fd] focus:border-[#4edea3] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-mono text-[#bbcabf] mb-1">
                    Pre-Money Valuation ($)
                  </label>
                  <input
                    type="number"
                    value={preMoneyValuation}
                    onChange={(e) => setPreMoneyValuation(Number(e.target.value))}
                    step={50000}
                    className="w-full bg-[#0b1326] border border-[#222a3d] rounded px-3 py-2 text-xs font-mono text-[#dae2fd] focus:border-[#4edea3] outline-none"
                  />
                </div>
                <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded">
                  <div className="text-[10px] font-mono text-[#bbcabf] uppercase">Post-Money Valuation</div>
                  <div className="text-lg font-bold font-mono text-[#dae2fd]">{mask(postMoneyValuation)}</div>
                  <div className="text-[10px] font-mono text-[#adc6ff]">
                    New Investor: {newInvestorStake.toFixed(1)}%
                  </div>
                </div>
                <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded">
                  <div className="text-[10px] font-mono text-[#bbcabf] uppercase">Your Resulting Position</div>
                  <div className="text-lg font-bold font-mono text-[#4edea3]">
                    {yourDilutedOwnership.toFixed(1)}% ({mask(yourDilutedValue)})
                  </div>
                  <div className="text-[10px] font-mono text-[#bbcabf]">
                    Dilution: -{(yourCurrentOwnership - yourDilutedOwnership).toFixed(1)}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: CORPORATE P&L & TREASURY */}
        {activeTab === 'p-and-l' && (
          <div className="space-y-6">
            {/* Income Statement Summary */}
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="font-['Manrope'] font-bold text-xl text-[#dae2fd]">
                    {company.name} Corporate Financial Performance & P&L
                  </h2>
                  <p className="text-xs text-[#bbcabf] font-mono">
                    Official operating statement YTD reconciled under GAAP
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setIsCompanyImportOpen(true)} className="rounded border border-[#4edea3]/40 bg-[#4edea3]/10 px-3 py-1.5 text-xs font-mono font-bold text-[#4edea3] hover:bg-[#4edea3]/20">Import Company Data</button>
                  <div className="text-xs font-mono text-[#4edea3] bg-[#0b1326] px-3 py-1.5 rounded border border-[#222a3d]">
                    Audited Corporate Books
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-1">
                  <span className="text-xs font-mono text-[#bbcabf] uppercase">Gross Revenue YTD</span>
                  <div className="font-mono text-2xl font-bold text-[#dae2fd]">
                    {mask(company.revenueYtd || 340000)}
                  </div>
                  <div className="text-[10px] text-[#4edea3] font-mono">+18.4% YoY Growth</div>
                </div>
                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-1">
                  <span className="text-xs font-mono text-[#bbcabf] uppercase">Total Operating Expenses</span>
                  <div className="font-mono text-2xl font-bold text-[#ffb2b7]">
                    {mask(company.expensesYtd || 260000)}
                  </div>
                  <div className="text-[10px] text-[#bbcabf] font-mono">Payroll, Tech, SG&A</div>
                </div>
                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-1">
                  <span className="text-xs font-mono text-[#4edea3] uppercase font-semibold">
                    Net Operating Profit
                  </span>
                  <div className="font-mono text-2xl font-bold text-[#4edea3]">
                    {mask(company.companyNetProfit)}
                  </div>
                  <div className="text-[10px] text-[#4edea3] font-mono">
                    Your Share: {mask(company.attributedProfit)}
                  </div>
                </div>
              </div>

              {/* OPEX Breakdown */}
              <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                <div className="font-mono text-xs text-[#dae2fd] font-semibold uppercase tracking-wider">
                  Operating Expense Allocation (YTD)
                </div>
                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between items-center py-1 border-b border-[#222a3d]/50">
                    <span className="text-[#bbcabf]">Engineering & Operations Payroll</span>
                    <span className="text-[#dae2fd] font-semibold">{mask((company.expensesYtd || 260000) * 0.58)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#222a3d]/50">
                    <span className="text-[#bbcabf]">Cloud Infrastructure & SaaS Software</span>
                    <span className="text-[#dae2fd] font-semibold">{mask((company.expensesYtd || 260000) * 0.18)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-[#222a3d]/50">
                    <span className="text-[#bbcabf]">Facilities & Commercial Insurance</span>
                    <span className="text-[#dae2fd] font-semibold">{mask((company.expensesYtd || 260000) * 0.12)}</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-[#bbcabf]">Legal, Accounting & Compliance</span>
                    <span className="text-[#dae2fd] font-semibold">{mask((company.expensesYtd || 260000) * 0.12)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Corporate Bank Accounts */}
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-['Manrope'] font-bold text-base text-[#dae2fd]">
                    Dedicated Corporate Treasury & Bank Accounts
                  </h3>
                  <p className="text-xs text-[#bbcabf] font-mono">
                    Strictly isolated commercial accounts for {company.name} (Not personal funds)
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono text-[#4edea3]">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] animate-pulse" />
                  <span>Plaid Bank Feed Active</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                  <div className="text-xs font-mono text-[#bbcabf] flex justify-between">
                    <span>Operating Checking</span>
                    <span className="text-[#adc6ff]">Chase Commercial</span>
                  </div>
                  <div className="font-mono text-xl font-bold text-[#dae2fd]">
                    {mask((company.operatingCashReserve || 120000) * 0.6)}
                  </div>
                  <div className="text-[10px] font-mono text-[#bbcabf]">Account: **** 9812 • Active</div>
                </div>

                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                  <div className="text-xs font-mono text-[#bbcabf] flex justify-between">
                    <span>Treasury Yield Reserve</span>
                    <span className="text-[#4edea3]">4.85% APY</span>
                  </div>
                  <div className="font-mono text-xl font-bold text-[#4edea3]">
                    {mask((company.operatingCashReserve || 120000) * 0.3)}
                  </div>
                  <div className="text-[10px] font-mono text-[#bbcabf]">Account: **** 4410 • Liquid</div>
                </div>

                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                  <div className="text-xs font-mono text-[#bbcabf] flex justify-between">
                    <span>Tax & Payroll Escrow</span>
                    <span className="text-[#ffb2b7]">Segregated</span>
                  </div>
                  <div className="font-mono text-xl font-bold text-[#dae2fd]">
                    {mask((company.operatingCashReserve || 120000) * 0.1)}
                  </div>
                  <div className="text-[10px] font-mono text-[#bbcabf]">Account: **** 2108 • Q3 Set Aside</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: DISTRIBUTION LEDGER & WIRES */}
        {activeTab === 'distributions' && (
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-['Manrope'] font-bold text-xl text-[#dae2fd]">
                  {company.name} Cash Distribution Wire History
                </h2>
                <p className="text-xs text-[#bbcabf] font-mono mt-0.5">
                  Historical and declared corporate disbursements sent to equity holders
                </p>
              </div>
              <button
                type="button"
                onClick={onOpenRecordCapital}
                className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-[#003824] rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">payments</span>
                <span>+ Record New Wire / Distribution</span>
              </button>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-1">
                <span className="text-xs font-mono text-[#bbcabf] uppercase">Total Wired to You</span>
                <div className="font-mono text-xl font-bold text-[#4edea3]">
                  {mask(company.distributionsReceived)}
                </div>
                <div className="text-[10px] text-[#bbcabf] font-mono">Cleared personal funds</div>
              </div>

              <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-1">
                <span className="text-xs font-mono text-[#bbcabf] uppercase">Pending Declared</span>
                <div className="font-mono text-xl font-bold text-[#dae2fd]">
                  {mask(company.distributionsPending)}
                </div>
                <div className="text-[10px] text-[#adc6ff] font-mono">Scheduled next board cycle</div>
              </div>

              <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-1">
                <span className="text-xs font-mono text-[#bbcabf] uppercase">Next Distribution Date</span>
                <div className="font-mono text-xl font-bold text-[#adc6ff]">Nov 15, 2026</div>
                <div className="text-[10px] text-[#bbcabf] font-mono">Q3 Partner Meeting</div>
              </div>
            </div>

            {/* Event Ledger Table */}
            {companyEvents.length === 0 ? (
              <div className="p-8 text-center bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                <span className="material-symbols-outlined text-3xl text-[#bbcabf]">payments</span>
                <div className="text-xs font-mono text-[#bbcabf]">
                  No historical distribution events recorded for {company.name} yet.
                </div>
                <button
                  type="button"
                  onClick={onOpenRecordCapital}
                  className="px-3 py-1.5 bg-[#171f33] hover:bg-[#222a3d] text-[#4edea3] rounded text-xs font-mono border border-[#4edea3]/30 cursor-pointer"
                >
                  Record First Distribution Wire
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#0b1326] text-[#bbcabf] uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-3">Wire Reference</th>
                      <th className="py-2.5 px-3">Classification</th>
                      <th className="py-2.5 px-3">Scope Details</th>
                      <th className="py-2.5 px-3 text-right">Accounting Date</th>
                      <th className="py-2.5 px-3 text-right">Cash Amount</th>
                      <th className="py-2.5 px-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#222a3d]">
                    {companyEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-[#171f33] transition-colors">
                        <td className="py-3 px-3 font-semibold text-[#dae2fd]">{ev.referenceId}</td>
                        <td className="py-3 px-3 text-[#4edea3]">{ev.classification}</td>
                        <td className="py-3 px-3 text-[#bbcabf]">{ev.scopeDetails}</td>
                        <td className="py-3 px-3 text-right text-[#bbcabf]">{ev.accountingDate}</td>
                        <td className="py-3 px-3 text-right font-bold text-[#4edea3]">
                          {mask(ev.cashEffect)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] text-[10px] font-bold">
                            Fedwire Cleared
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: GOVERNANCE & RESOLUTIONS */}
        {activeTab === 'governance' && (
          <div className="space-y-6">
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-6 space-y-6">
              <div>
                <h2 className="font-['Manrope'] font-bold text-xl text-[#dae2fd]">
                  {company.name} Corporate Governance & Board Resolutions
                </h2>
                <p className="text-xs text-[#bbcabf] font-mono mt-0.5">
                  Operating agreement stipulations, signatory powers, and voting thresholds
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2 text-xs font-mono">
                  <div className="text-[#4edea3] font-bold uppercase tracking-wider">
                    Signatory & Authority Matrix
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222a3d]">
                    <span className="text-[#bbcabf]">Your Signing Authority:</span>
                    <span className="text-[#dae2fd] font-semibold">{company.role}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222a3d]">
                    <span className="text-[#bbcabf]">Role Designation:</span>
                    <span className="text-[#4edea3] uppercase font-bold">{company.roleType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222a3d]">
                    <span className="text-[#bbcabf]">Voting Threshold (Major Action):</span>
                    <span className="text-[#dae2fd]">66.7% Supermajority</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#bbcabf]">Banking Sole Discretion:</span>
                    <span className="text-[#dae2fd]">&lt;$50,000 (Dual for &gt;$50k)</span>
                  </div>
                </div>

                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2 text-xs font-mono">
                  <div className="text-[#adc6ff] font-bold uppercase tracking-wider">
                    Operating Agreement Status
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222a3d]">
                    <span className="text-[#bbcabf]">Agreement Form:</span>
                    <span className="text-[#dae2fd]">{company.ownershipType}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222a3d]">
                    <span className="text-[#bbcabf]">Last Amendment:</span>
                    <span className="text-[#dae2fd]">Jan 2026</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-[#222a3d]">
                    <span className="text-[#bbcabf]">Registered Agent:</span>
                    <span className="text-[#dae2fd]">Corporation Service Company</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-[#bbcabf]">Good Standing Status:</span>
                    <span className="text-[#4edea3] font-bold">Valid & Active</span>
                  </div>
                </div>
              </div>

              {/* Resolutions Log */}
              <div className="space-y-3">
                <h3 className="font-['Manrope'] font-bold text-sm text-[#dae2fd] uppercase font-mono">
                  Adopted Corporate Resolutions Log
                </h3>
                <div className="space-y-2">
                  {[
                    {
                      id: 'RES-2026-03',
                      title: 'Q3 Partner Distribution Authorization',
                      date: 'Aug 28, 2026',
                      status: 'Adopted (Unanimous)',
                      summary: `Authorized payout of quarterly operating earnings to Schedule A members according to ownership tiers.`,
                    },
                    {
                      id: 'RES-2026-02',
                      title: 'Corporate Treasury & Reserve Target Ratification',
                      date: 'May 12, 2026',
                      status: 'Adopted (100% Voting)',
                      summary: `Established minimum operating cash reserve of $120,000 in dedicated high-yield treasury account.`,
                    },
                    {
                      id: 'RES-2026-01',
                      title: 'Annual Operating Agreement & Cap Table Recertification',
                      date: 'Jan 15, 2026',
                      status: 'Adopted (Unanimous)',
                      summary: `Recertified Schedule A member register and validated legal equity allocations.`,
                    },
                  ].map((res) => (
                    <div
                      key={res.id}
                      className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-mono"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[#4edea3] font-bold">{res.id}</span>
                          <span className="text-[#2d3449]">•</span>
                          <span className="text-[#dae2fd] font-semibold">{res.title}</span>
                        </div>
                        <p className="text-[#bbcabf]">{res.summary}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[#bbcabf]">{res.date}</span>
                        <span className="px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-bold text-[10px]">
                          {res.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: COMMERCIAL PIPELINE & CONTRACTS */}
        {activeTab === 'projects' && (
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h2 className="font-['Manrope'] font-bold text-xl text-[#dae2fd]">
                  {company.name} Commercial Operations & Pipeline
                </h2>
                <p className="text-xs text-[#bbcabf] font-mono mt-0.5">
                  Live enterprise contracts, client agreements, and operational deliverables
                </p>
              </div>
              {company.id === 'bid-exact' && onSwitchWorkspace && (
                <button
                  type="button"
                  onClick={() => onSwitchWorkspace('pre-con-estimating')}
                  className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-[#003824] rounded text-xs font-mono font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <span className="material-symbols-outlined text-sm">engineering</span>
                  <span>Open Pre-Con Estimating Studio</span>
                </button>
              )}
            </div>

            {/* Entity-specific commercial contracts */}
            {company.id === 'bid-exact' ? (
              <div className="space-y-4">
                <div className="p-4 bg-[#0b1326] border border-[#4edea3]/30 rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="space-y-1">
                    <div className="font-mono text-sm font-bold text-[#4edea3] flex items-center gap-2">
                      <span className="material-symbols-outlined text-base">architecture</span>
                      <span>Bid Exact Construction Estimating Pipeline</span>
                    </div>
                    <p className="text-xs text-[#bbcabf] font-mono">
                      Direct integration with the RFI Resolution Matrix and active Pre-Con bids.
                    </p>
                  </div>
                  {onSwitchWorkspace && (
                    <button
                      type="button"
                      onClick={() => onSwitchWorkspace('pre-con-estimating')}
                      className="px-3.5 py-2 bg-[#132247] hover:bg-[#1b2d5a] border border-[#adc6ff]/40 text-[#adc6ff] rounded text-xs font-mono font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>View All Bids & RFIs</span>
                      <span className="material-symbols-outlined text-sm">arrow_forward</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                    <span className="font-mono text-[10px] text-[#4edea3] uppercase font-bold">
                      Contract #BID-8849
                    </span>
                    <div className="font-['Manrope'] font-bold text-sm text-[#dae2fd]">
                      Metropolitan Hospital Wing
                    </div>
                    <div className="font-mono text-lg font-bold text-[#dae2fd]">{mask(12450000)}</div>
                    <div className="text-xs text-[#bbcabf] font-mono">
                      Status: 65% Win Probability • Schedule Delta Applied
                    </div>
                  </div>

                  <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                    <span className="font-mono text-[10px] text-[#adc6ff] uppercase font-bold">
                      Contract #BID-9102
                    </span>
                    <div className="font-['Manrope'] font-bold text-sm text-[#dae2fd]">
                      Airport Terminal 4 Concourse
                    </div>
                    <div className="font-mono text-lg font-bold text-[#dae2fd]">{mask(8620000)}</div>
                    <div className="text-xs text-[#bbcabf] font-mono">
                      Status: 70% Strong • Structural Spec Validated
                    </div>
                  </div>

                  <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                    <span className="font-mono text-[10px] text-[#ffb2b7] uppercase font-bold">
                      Contract #BID-7404
                    </span>
                    <div className="font-['Manrope'] font-bold text-sm text-[#dae2fd]">
                      St. Jude Medical Research Hub
                    </div>
                    <div className="font-mono text-lg font-bold text-[#dae2fd]">{mask(4200000)}</div>
                    <div className="text-xs text-[#bbcabf] font-mono">
                      Status: Open RFI In Review • MEP Coordination
                    </div>
                  </div>
                </div>
              </div>
            ) : company.id === 'apex-logistics' ? (
              <div className="space-y-3">
                {[
                  {
                    title: 'Midwest Intermodal Freight Contract',
                    client: 'Target Supply Chain Corp',
                    value: 280000,
                    status: 'Active (34 Trucks Dedicated)',
                  },
                  {
                    title: 'Pharmaceutical Cold-Chain Haulage',
                    client: 'McKesson Distribution',
                    value: 195000,
                    status: 'Active (FDA Certified Fleet)',
                  },
                  {
                    title: 'Cross-Border Automotive Parts Run',
                    client: 'Ford Component Logistics',
                    value: 145000,
                    status: 'Renewed for 2027',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="text-[#dae2fd] font-bold text-sm">{item.title}</div>
                      <div className="text-[#bbcabf]">Client: {item.client}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-[#4edea3]">{mask(item.value)}/yr</div>
                        <div className="text-[10px] text-[#bbcabf]">{item.status}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : company.id === 'kinetix-bio' ? (
              <div className="space-y-3">
                {[
                  {
                    title: 'Clinical Trial Phase II: Multi-Target Oncology Marker',
                    client: 'NIH Cooperative Research',
                    value: 450000,
                    status: 'Patient Enrollment 84%',
                  },
                  {
                    title: 'FDA 510(k) Assay Clearance Milestone',
                    client: 'US Food & Drug Administration',
                    value: 180000,
                    status: 'Pre-Submission Filed',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="text-[#dae2fd] font-bold text-sm">{item.title}</div>
                      <div className="text-[#bbcabf]">Collaborator: {item.client}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#4edea3]">{mask(item.value)} Grant</div>
                      <div className="text-[10px] text-[#adc6ff]">{item.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {[
                  {
                    title: 'Aerospace Grade 5 Titanium Turbine Casting',
                    client: 'Raytheon Defense Systems',
                    value: 320000,
                    status: 'Batch In Production',
                  },
                  {
                    title: 'High-Temperature Metallurgy Tooling',
                    client: 'General Electric Aviation',
                    value: 160000,
                    status: 'Delivered & Accepted',
                  },
                ].map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs font-mono"
                  >
                    <div className="space-y-0.5">
                      <div className="text-[#dae2fd] font-bold text-sm">{item.title}</div>
                      <div className="text-[#bbcabf]">Contract Partner: {item.client}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[#4edea3]">{mask(item.value)}</div>
                      <div className="text-[10px] text-[#bbcabf]">{item.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: DOCUMENTS & CORPORATE VAULT */}
        {activeTab === 'documents' && (
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-6 space-y-6">
            <div>
              <h2 className="font-['Manrope'] font-bold text-xl text-[#dae2fd]">
                {company.name} Corporate Documents & Legal Vault
              </h2>
              <p className="text-xs text-[#bbcabf] font-mono mt-0.5">
                Official certificates, tax filings, and legal operating records
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  id: 'doc-1',
                  name: `${company.name} - Certificate of Good Standing`,
                  type: 'State Filing',
                  date: 'Jan 2026',
                  size: '420 KB',
                },
                {
                  id: 'doc-2',
                  name: `Operating Agreement & Schedule A Membership`,
                  type: 'Legal Bylaws',
                  date: 'Jan 2026',
                  size: '1.8 MB',
                },
                {
                  id: 'doc-3',
                  name: `IRS Form SS-4 (EIN Assignment Notice - ${company.taxId || 'XX-XXX9182'})`,
                  type: 'Federal Tax',
                  date: '2023',
                  size: '310 KB',
                },
                {
                  id: 'doc-4',
                  name: `2025 Schedule K-1 Partner Tax Return (Form 1065)`,
                  type: 'IRS Form',
                  date: 'Mar 2026',
                  size: '950 KB',
                },
                {
                  id: 'doc-5',
                  name: `Commercial Bank Wire & ACH Authorization`,
                  type: 'Banking Record',
                  date: 'Feb 2026',
                  size: '280 KB',
                },
                {
                  id: 'doc-6',
                  name: `General Liability & D&O Insurance Policy`,
                  type: 'Insurance Binder',
                  date: 'Jul 2026',
                  size: '2.1 MB',
                },
              ].map((doc) => (
                <div
                  key={doc.id}
                  className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg flex items-center justify-between gap-3 text-xs font-mono"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-2xl text-[#4edea3]">
                      picture_as_pdf
                    </span>
                    <div>
                      <div className="text-[#dae2fd] font-semibold">{doc.name}</div>
                      <div className="text-[11px] text-[#bbcabf]">
                        {doc.type} • {doc.date} • {doc.size}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setViewingDoc(doc.name)}
                    className="px-3 py-1.5 bg-[#171f33] hover:bg-[#222a3d] text-[#4edea3] rounded border border-[#4edea3]/30 transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-xs">visibility</span>
                    <span>View</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* MODAL 1: ADD SHAREHOLDER TO CAP TABLE */}
      {isAddMemberOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0b1326] border border-[#222a3d] rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
              <h3 className="font-['Manrope'] font-bold text-base text-[#dae2fd] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4edea3]">person_add</span>
                <span>Add Shareholder to {company.name}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddMemberOpen(false)}
                className="text-[#bbcabf] hover:text-[#dae2fd] cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <form onSubmit={handleAddMember} className="space-y-3.5 text-xs font-mono">
              <div>
                <label className="block text-[#bbcabf] mb-1">Shareholder / Partner Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sarah Chen"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full bg-[#131b2e] border border-[#222a3d] rounded px-3 py-2 text-[#dae2fd] focus:border-[#4edea3] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#bbcabf] mb-1">Role / Designation</label>
                <input
                  type="text"
                  placeholder="e.g., VP Engineering / Advisory Board"
                  value={newMemberRole}
                  onChange={(e) => setNewMemberRole(e.target.value)}
                  className="w-full bg-[#131b2e] border border-[#222a3d] rounded px-3 py-2 text-[#dae2fd] focus:border-[#4edea3] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#bbcabf] mb-1">Ownership (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="100"
                    required
                    value={newMemberPercent}
                    onChange={(e) => setNewMemberPercent(Number(e.target.value))}
                    className="w-full bg-[#131b2e] border border-[#222a3d] rounded px-3 py-2 text-[#dae2fd] focus:border-[#4edea3] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#bbcabf] mb-1">Committed Capital ($)</label>
                  <input
                    type="number"
                    step="1000"
                    min="0"
                    required
                    value={newMemberInvestment}
                    onChange={(e) => setNewMemberInvestment(Number(e.target.value))}
                    className="w-full bg-[#131b2e] border border-[#222a3d] rounded px-3 py-2 text-[#dae2fd] focus:border-[#4edea3] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="votingCheckbox"
                  checked={newMemberVoting}
                  onChange={(e) => setNewMemberVoting(e.target.checked)}
                  className="rounded border-[#222a3d] accent-[#10b981]"
                />
                <label htmlFor="votingCheckbox" className="text-[#dae2fd] cursor-pointer">
                  Grant Full Voting Rights (Schedule A Member)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222a3d]">
                <button
                  type="button"
                  onClick={() => setIsAddMemberOpen(false)}
                  className="px-3 py-1.5 bg-[#131b2e] text-[#bbcabf] hover:text-[#dae2fd] rounded transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#10b981] hover:bg-[#059669] text-[#003824] font-bold rounded transition-colors cursor-pointer"
                >
                  Confirm & Update Cap Table
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: DOCUMENT PREVIEW MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-[#0b1326] border border-[#222a3d] rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
              <h3 className="font-['Manrope'] font-bold text-base text-[#dae2fd] flex items-center gap-2">
                <span className="material-symbols-outlined text-[#4edea3]">verified</span>
                <span>Official Document Record</span>
              </h3>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="text-[#bbcabf] hover:text-[#dae2fd] cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-4 bg-[#131b2e] border border-[#222a3d] rounded-lg space-y-2">
                <div className="text-sm font-bold text-[#dae2fd]">{viewingDoc}</div>
                <div className="text-[#bbcabf]">
                  Entity: <strong className="text-[#4edea3]">{company.name}</strong> • Tax ID: {company.taxId}
                </div>
                <div className="text-[#bbcabf]">
                  Digital Signature: <span className="text-[#adc6ff]">SHA-256 Verified On-Chain</span>
                </div>
              </div>
              <p className="text-[#bbcabf] leading-relaxed">
                This document is certified and filed with the state register and corporate banking partners. To export an unencrypted PDF copy, please use the corporate export tool.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="px-4 py-2 bg-[#10b981] text-[#003824] font-bold rounded text-xs font-mono cursor-pointer"
              >
                Close Document
              </button>
            </div>
          </div>
        </div>
      )}
      {isCompanyImportOpen && <CompanyDataImportPanel onClose={() => setIsCompanyImportOpen(false)} />}
    </div>
  );
};
