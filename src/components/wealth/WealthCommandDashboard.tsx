import React from 'react';
import {
  CompanyEntity,
  KeyWealthMetrics,
  LedgerEvent,
  GovernanceChangeRequest,
} from '../../types/wealth';

interface WealthCommandDashboardProps {
  companies: CompanyEntity[];
  metrics: KeyWealthMetrics;
  ledgerEvents: LedgerEvent[];
  governanceRequests: GovernanceChangeRequest[];
  onSelectEntity: (id: string) => void;
  onOpenAddCompany: () => void;
  onOpenRecordCapital: () => void;
  onOpenReviewGovernance: (req: GovernanceChangeRequest) => void;
  onOpenExportPdf: () => void;
  onOpenAuditLog: () => void;
  onOpenCapTable: () => void;
  privacyMode: boolean;
}

export const WealthCommandDashboard: React.FC<WealthCommandDashboardProps> = ({
  companies,
  metrics,
  ledgerEvents,
  governanceRequests,
  onSelectEntity,
  onOpenAddCompany,
  onOpenRecordCapital,
  onOpenReviewGovernance,
  onOpenExportPdf,
  onOpenAuditLog,
  onOpenCapTable,
  privacyMode,
}) => {
  const mask = (val: number | string) => {
    if (privacyMode) return '$••••••';
    if (typeof val === 'number') {
      return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    }
    return val;
  };

  const maskRound = (val: number) => {
    if (privacyMode) return '$•••';
    return `$${val.toLocaleString('en-US')}`;
  };

  // Dynamic portfolio totals based on active companies
  const totalContributed = companies.reduce((acc, c) => acc + c.contributedCapital, 0);
  const totalAttributed = companies.reduce((acc, c) => acc + c.attributedProfit, 0);
  const totalDeclared = companies.reduce((acc, c) => acc + (c.distributionsReceived + c.distributionsPending), 0);
  const totalWired = companies.reduce((acc, c) => acc + c.distributionsReceived, 0);
  const totalUnpaid = companies.reduce((acc, c) => acc + c.distributionsPending, 0);
  const totalCompanyInterests = companies.reduce((acc, c) => acc + c.equityPositionValue, 0);

  const pendingGov = governanceRequests[0] || null;

  return (
    <div className="flex flex-col w-full pb-24">
      {/* Top Command Banner */}
      <section className="px-4 sm:px-6 py-5 sm:py-8 bg-[#060e20] border-b border-[#222a3d]">
        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
          <div className="flex flex-1 min-w-0 flex-col space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-['Manrope'] font-bold text-xl sm:text-2xl text-[#dae2fd]">
                Good morning, Umer
              </span>
              <span className="text-xs sm:text-sm text-[#bbcabf] font-mono">
                — Consolidated Personal Wealth & Multi-Company Command
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <div className="inline-flex items-center gap-1.5 bg-[#171f33] px-2.5 py-1 rounded text-xs font-mono">
                <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span>
                <span className="text-[#dae2fd] font-semibold">{companies.length} Connected Entities</span>
              </div>
              <div className="inline-flex items-center gap-1.5 bg-[#171f33] px-2.5 py-1 rounded text-xs font-mono">
                <span className="material-symbols-outlined text-sm text-[#4edea3]">verified_user</span>
                <span className="text-[#bbcabf]">Isolated Books Architecture</span>
              </div>
              <div className="inline-flex items-center gap-1 bg-[#222a3d] px-2.5 py-1 rounded text-xs font-mono">
                <span className="text-[#4edea3] font-bold">GAAP Verified</span>
              </div>
              <span className="font-mono text-xs text-[#bbcabf] ml-1">
                Last reconciliation: 08:42 UTC
              </span>
            </div>
          </div>

          {/* Action Utilities and daily snapshot */}
          <div className="flex w-full flex-col items-stretch gap-3 shrink-0 xl:w-[58%]">
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg border border-[#222a3d] bg-[#131b2e] px-3 py-2.5">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-[#91a0c5]">Liquid cash</span>
                <span className="mt-1 block font-mono text-sm font-bold text-[#4edea3]">{mask(metrics.personalCash)}</span>
                <span className="mt-0.5 block text-[10px] text-[#91a0c5]">Personal only</span>
              </div>
              <div className="rounded-lg border border-[#222a3d] bg-[#131b2e] px-3 py-2.5">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-[#91a0c5]">Net position</span>
                <span className="mt-1 block font-mono text-sm font-bold text-[#dae2fd]">{mask(metrics.personalNetWorth)}</span>
                <span className="mt-0.5 block text-[10px] text-[#91a0c5]">Across all books</span>
              </div>
              <div className="rounded-lg border border-[#222a3d] bg-[#131b2e] px-3 py-2.5">
                <span className="block font-mono text-[9px] uppercase tracking-wider text-[#91a0c5]">Pending</span>
                <span className="mt-1 block font-mono text-sm font-bold text-[#f6c453]">{governanceRequests.length}</span>
                <span className="mt-0.5 block text-[10px] text-[#91a0c5]">Reviews</span>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2.5">

            <button
              type="button"
              onClick={onOpenExportPdf}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] transition-colors rounded text-xs font-mono uppercase tracking-wider shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
              <span>Export Consolidated PDF</span>
            </button>
            <button
              type="button"
              onClick={onOpenAuditLog}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] transition-colors rounded text-xs font-mono uppercase tracking-wider shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">history_edu</span>
              <span>Ownership Audit Log</span>
            </button>
            <button
              type="button"
              onClick={onOpenRecordCapital}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#10b981] hover:bg-[#059669] text-[#003824] transition-colors rounded text-xs font-mono font-bold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">add</span>
              <span>+ Record Capital / Distribution</span>
            </button>
            <button
              type="button"
              onClick={onOpenAddCompany}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#171f33] hover:bg-[#222a3d] border border-[#4edea3]/40 text-[#4edea3] transition-colors rounded text-xs font-mono font-bold shadow-sm cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm font-bold">add_business</span>
              <span>+ Add Company</span>
            </button>
            </div>
          </div>
          </div>
      </section>

      {/* Section 1: Executive Key Metrics */}
      <section className="px-4 sm:px-6 py-4 sm:py-6 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#4edea3] uppercase tracking-wider font-bold">
              01 // Key Financial Verification
            </span>
            <span className="w-8 h-px bg-[#2d3449]"></span>
          </div>
          <span className="font-mono text-xs text-[#bbcabf]">Reporting Currencies: USD ($)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3">
          {/* Metric 1: Personal Cash */}
          <div className="bg-[#131b2e] p-4 rounded-lg flex flex-col justify-between shadow-sm border border-[#222a3d] relative overflow-hidden">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#bbcabf] uppercase font-bold">Personal Cash</span>
                <span className="material-symbols-outlined text-[#4edea3] text-sm">account_balance</span>
              </div>
              <div className="font-mono text-xl text-[#dae2fd] font-bold tracking-tight">
                {mask(metrics.personalCash)}
              </div>
              <p className="text-xs text-[#bbcabf] line-clamp-2">
                Liquid bank accounts & personal reserves (Unencumbered)
              </p>
            </div>
            <div className="mt-3 pt-2 space-y-1 bg-[#060e20]/80 p-2 rounded border border-[#222a3d] text-xs font-mono">
              <div className="flex justify-between items-center text-[#dae2fd]">
                <span className="text-[#bbcabf]">Chase Checking</span>
                <span>{mask(metrics.chaseChecking)}</span>
              </div>
              <div className="flex justify-between items-center text-[#dae2fd]">
                <span className="text-[#bbcabf]">HYSA (5.1% APY)</span>
                <span>{mask(metrics.hysa)}</span>
              </div>
              <div className="pt-1 border-t border-[#222a3d]">
                <span className="font-mono text-[9px] text-[#4edea3] uppercase font-bold block">
                  Actual Liquid Cash • No Company Funds Mixed
                </span>
              </div>
            </div>
          </div>

          {/* Metric 2: Company Interests */}
          <div className="bg-[#131b2e] p-4 rounded-lg flex flex-col justify-between shadow-sm border border-[#222a3d]">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#bbcabf] uppercase font-bold">Company Interests</span>
                <span className="material-symbols-outlined text-[#adc6ff] text-sm">pie_chart</span>
              </div>
              <div className="font-mono text-xl text-[#dae2fd] font-bold tracking-tight">
                {mask(totalCompanyInterests)}
              </div>
              <p className="text-xs text-[#bbcabf]">Across {companies.length} active operating entities</p>
            </div>
            <div className="mt-3 pt-2 bg-[#060e20]/80 p-2 rounded border border-[#222a3d] space-y-1 font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#4edea3] font-bold">+ $65k YTD</span>
                <span className="text-[10px] text-[#4edea3] font-bold">+14.9% Blended</span>
              </div>
              <span className="text-[9px] text-[#adc6ff] uppercase block font-bold">
                Estimated Economic Equity Value
              </span>
            </div>
          </div>

          {/* Metric 3: Capital Invested */}
          <div className="bg-[#131b2e] p-4 rounded-lg flex flex-col justify-between shadow-sm border border-[#222a3d]">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#bbcabf] uppercase font-bold">Capital Invested</span>
                <span className="material-symbols-outlined text-[#bbcabf] text-sm">savings</span>
              </div>
              <div className="font-mono text-xl text-[#dae2fd] font-bold tracking-tight">
                {mask(totalContributed)}
              </div>
              <p className="text-xs text-[#bbcabf]">Cumulative equity capital injected into companies</p>
            </div>
            <div className="mt-3 pt-2 bg-[#060e20]/80 p-2 rounded border border-[#222a3d] space-y-1 font-mono text-xs">
              <div className="flex justify-between text-[11px] text-[#bbcabf]">
                <span>Bid $50k</span>
                <span>Apex $20k</span>
                <span>Kinetix $10k</span>
              </div>
              <span className="text-[9px] text-[#bbcabf] uppercase block font-bold">
                Historical Principal Contributed
              </span>
            </div>
          </div>

          {/* Metric 4: Profit Attributed */}
          <div className="bg-[#131b2e] p-4 rounded-lg flex flex-col justify-between shadow-sm border border-[#222a3d]">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#bbcabf] uppercase font-bold">Profit Attributed</span>
                <span className="material-symbols-outlined text-[#4edea3] text-sm">query_stats</span>
              </div>
              <div className="font-mono text-xl text-[#4edea3] font-bold tracking-tight">
                {mask(totalAttributed)}
              </div>
              <p className="text-xs text-[#bbcabf]">Entitled profit share based on company net incomes</p>
            </div>
            <div className="mt-3 pt-2 bg-[#060e20]/80 p-2 rounded border border-[#222a3d] space-y-1 font-mono text-xs">
              <div className="text-[#bbcabf] text-[11px] flex justify-between">
                <span>BE $40k</span>
                <span>AL $15k</span>
                <span>KB $11k</span>
              </div>
              <span className="text-[9px] text-[#ffb2b7] uppercase block font-bold">
                Accounting Profit (NOT Cash Received)
              </span>
            </div>
          </div>

          {/* Metric 5: Distributions Received */}
          <div className="bg-[#131b2e] p-4 rounded-lg flex flex-col justify-between shadow-sm border border-[#222a3d]">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#bbcabf] uppercase font-bold">Distributions Received</span>
                <span className="material-symbols-outlined text-[#4edea3] text-sm">payments</span>
              </div>
              <div className="font-mono text-xl text-[#4edea3] font-bold tracking-tight">
                {mask(totalWired)}
              </div>
              <p className="text-xs text-[#bbcabf]">Actual realized cash distributions wired to personal accounts</p>
            </div>
            <div className="mt-3 pt-2 bg-[#060e20]/80 p-2 rounded border border-[#222a3d] space-y-1 font-mono text-xs">
              <div className="flex justify-between text-[#bbcabf]">
                <span>Unpaid Declared:</span>
                <span className="text-[#ffb2b7] font-bold">{mask(totalUnpaid)}</span>
              </div>
              <span className="text-[9px] text-[#4edea3] uppercase block font-bold">
                Realized Cashflow YTD
              </span>
            </div>
          </div>

          {/* Metric 6: Personal Net Worth */}
          <div className="bg-[#171f33] p-4 rounded-lg flex flex-col justify-between shadow-md border border-[#4edea3]/30">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-[#4edea3] uppercase font-bold">Personal Net Worth</span>
                <span className="material-symbols-outlined text-[#4edea3] text-sm">diamond</span>
              </div>
              <div className="font-mono text-xl text-[#dae2fd] font-bold tracking-tight">
                {mask(metrics.personalNetWorth)}
              </div>
              <p className="text-xs text-[#bbcabf] line-clamp-2">
                Cash ($100k) + Inv ($200k) + Prop ($300k) + Entities ($500k) - Liab ($100k)
              </p>
            </div>
            <div className="mt-3 pt-2 bg-[#060e20]/80 p-2 rounded border border-[#222a3d] space-y-1 font-mono text-xs">
              <div className="flex items-center justify-between text-[#4edea3]">
                <span>+11.4% YoY</span>
                <span>+$102,500</span>
              </div>
              <span className="text-[9px] text-[#dae2fd] uppercase block font-bold">
                Consolidated Total Wealth Balance
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: "My Companies" Portfolio Grid */}
      <section className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#4edea3] uppercase tracking-wider font-bold">
              02 // Direct Entity Equity Holdings
            </span>
            <span className="w-8 h-px bg-[#2d3449]"></span>
          </div>
          <div className="flex items-center gap-4 text-[#bbcabf] font-mono text-[11px]">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4edea3]"></span> Full Signatory
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#adc6ff]"></span> Observer / Board
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#bbcabf]"></span> Passive LP
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {companies.map((company) => (
            <div
              key={company.id}
              className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-[10px] text-[#4edea3] uppercase font-bold tracking-wider">
                      {company.industry}
                    </span>
                    <h3 className="font-['Manrope'] font-bold text-xl text-[#dae2fd]">
                      {company.name}
                    </h3>
                    <p className="text-xs text-[#bbcabf] mt-1 font-mono">
                      {company.role}
                    </p>
                  </div>
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-[#222a3d] text-[#4edea3] rounded shrink-0 font-semibold">
                    {company.statusBadge}
                  </span>
                </div>

                {/* Key Metrics 2x2 Grid */}
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs">
                  <div className="bg-[#171f33] p-2.5 rounded border border-[#222a3d]">
                    <span className="text-[10px] text-[#bbcabf] uppercase block font-semibold">Legal Ownership</span>
                    <div className="text-base font-bold text-[#dae2fd]">{company.legalOwnershipPercent}%</div>
                    <span className="text-[10px] text-[#bbcabf] block truncate">{company.ownershipType}</span>
                  </div>

                  <div className="bg-[#171f33] p-2.5 rounded border border-[#222a3d]">
                    <span className="text-[10px] text-[#bbcabf] uppercase block font-semibold">Profit Share Tier</span>
                    <div className="text-base font-bold text-[#4edea3]">{company.profitSharePercent}%</div>
                    <span className="text-[10px] text-[#bbcabf] block truncate">{company.profitTierDescription}</span>
                  </div>

                  <div className="bg-[#171f33] p-2.5 rounded border border-[#222a3d]">
                    <span className="text-[10px] text-[#bbcabf] uppercase block font-semibold">Company Net Profit</span>
                    <div className="text-sm font-semibold text-[#dae2fd]">{mask(company.companyNetProfit)}</div>
                    <span className="text-[10px] text-[#4edea3] block">Attributed: {mask(company.attributedProfit)}</span>
                  </div>

                  <div className="bg-[#171f33] p-2.5 rounded border border-[#222a3d]">
                    <span className="text-[10px] text-[#bbcabf] uppercase block font-semibold">Distributions Rec'd</span>
                    <div className="text-sm font-semibold text-[#4edea3]">{mask(company.distributionsReceived)}</div>
                    <span className="text-[10px] text-[#ffb2b7] block">
                      {company.distributionsPending > 0 ? `+${mask(company.distributionsPending)} pending` : 'Settled'}
                    </span>
                  </div>
                </div>

                {/* Secondary Details */}
                <div className="bg-[#060e20] p-3 rounded-lg border border-[#222a3d] space-y-1.5 font-mono text-xs">
                  <div className="flex justify-between items-center text-[#bbcabf]">
                    <span>Contributed Capital:</span>
                    <span className="text-[#dae2fd]">{mask(company.contributedCapital)}</span>
                  </div>
                  <div className="flex justify-between items-center text-[#bbcabf]">
                    <span>Enterprise Valuation:</span>
                    <span className="text-[#dae2fd]">{mask(company.enterpriseValuation)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-[#222a3d]">
                    <span className="font-['Manrope'] font-bold text-sm text-[#dae2fd]">Your Equity Position:</span>
                    <span className="text-base font-bold text-[#4edea3]">
                      {mask(company.equityPositionValue)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="button"
                  onClick={() => onSelectEntity(company.id)}
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-4 bg-[#171f33] hover:bg-[#222a3d] text-[#4edea3] font-['Manrope'] font-semibold text-xs rounded transition-colors shadow-sm cursor-pointer"
                >
                  <span>Open {company.name} Accounting Workspace</span>
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Section 3: Deep Comparative Analytics & Reconciliation Matrix */}
      <section className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-[#4edea3] uppercase tracking-wider font-bold">
            03 // Deep Comparative Analytics & Ledger Reconciliation
          </span>
          <span className="w-8 h-px bg-[#2d3449]"></span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Panel 1: Ownership vs Profit Share vs Cash Matrix (8 Cols) */}
          <div className="xl:col-span-8 bg-[#131b2e] border border-[#222a3d] rounded-xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-['Manrope'] font-bold text-lg text-[#dae2fd]">
                  Ownership vs. Profit Share vs. Cash Distributions Matrix
                </h3>
                <p className="text-xs text-[#bbcabf]">
                  Strict reconciliation verifying separation between accounting rights and physical cash flows
                </p>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 bg-[#10b981]/20 text-[#4edea3] rounded self-start sm:self-auto font-bold uppercase">
                Cross-Reconciled
              </span>
            </div>

            {/* Strict Legal/Accounting Rule Banner */}
            <div className="p-3.5 bg-[#171f33] border border-[#2d3449] rounded-lg flex items-start gap-3">
              <span className="material-symbols-outlined text-[#ff7886] shrink-0 text-xl">gavel</span>
              <div className="space-y-1">
                <span className="font-mono text-[10px] text-[#ffb2b7] uppercase font-bold tracking-wider">
                  Principal Accounting Rule
                </span>
                <p className="text-xs text-[#dae2fd] leading-relaxed">
                  <strong className="text-[#4edea3] font-semibold">Company Revenue is NOT Personal Income.</strong> Distributions require formal board resolution, operating agreement validation, and cleared bank ledger transfers. Entitled profit remains within the corporate entity until declared.
                </p>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto font-mono text-xs">
              <table className="w-full text-left">
                <thead className="bg-[#060e20] text-[#bbcabf] uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Entity Name</th>
                    <th className="py-2.5 px-3 text-right">Legal Own %</th>
                    <th className="py-2.5 px-3 text-right">Profit Tier %</th>
                    <th className="py-2.5 px-3 text-right">Capital Injected</th>
                    <th className="py-2.5 px-3 text-right">Net Attributed</th>
                    <th className="py-2.5 px-3 text-right">Declared Dist.</th>
                    <th className="py-2.5 px-3 text-right">Cash Wired</th>
                    <th className="py-2.5 px-3 text-right">Unpaid Due</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222a3d]">
                  {companies.map((c) => (
                    <tr key={c.id} className="hover:bg-[#171f33] transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-['Manrope'] font-bold text-sm text-[#dae2fd]">{c.name}</span>
                          <span className="text-[10px] text-[#bbcabf]">{c.ownershipType}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#dae2fd]">
                        {c.legalOwnershipPercent}%
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#4edea3]">
                        {c.profitSharePercent}%
                      </td>
                      <td className="py-3 px-3 text-right text-[#bbcabf]">
                        {maskRound(c.contributedCapital)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#4edea3]">
                        {maskRound(c.attributedProfit)}
                      </td>
                      <td className="py-3 px-3 text-right text-[#dae2fd]">
                        {maskRound(c.distributionsReceived + c.distributionsPending)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#4edea3]">
                        +{maskRound(c.distributionsReceived)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-[#ffb2b7]">
                        {maskRound(c.distributionsPending)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-[#060e20] text-[#dae2fd] font-bold border-t-2 border-[#222a3d]">
                  <tr>
                    <td className="py-2.5 px-3 font-['Manrope']">Portfolio Totals</td>
                    <td className="py-2.5 px-3 text-right text-[#bbcabf]">—</td>
                    <td className="py-2.5 px-3 text-right text-[#bbcabf]">—</td>
                    <td className="py-2.5 px-3 text-right">{maskRound(totalContributed)}</td>
                    <td className="py-2.5 px-3 text-right text-[#4edea3]">{maskRound(totalAttributed)}</td>
                    <td className="py-2.5 px-3 text-right">{maskRound(totalDeclared)}</td>
                    <td className="py-2.5 px-3 text-right text-[#4edea3]">+{maskRound(totalWired)}</td>
                    <td className="py-2.5 px-3 text-right text-[#ffb2b7]">{maskRound(totalUnpaid)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Panel 2: Consolidated Personal Cash Flow Dynamics (4 Cols) */}
          <div className="xl:col-span-4 bg-[#131b2e] border border-[#222a3d] rounded-xl p-6 space-y-4 shadow-sm flex flex-col justify-between">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-['Manrope'] font-bold text-lg text-[#dae2fd]">Personal Cash Flow</h3>
                <span className="font-mono text-[10px] px-2 py-0.5 bg-[#171f33] text-[#4edea3] rounded font-semibold">
                  YTD Dynamics
                </span>
              </div>
              <p className="text-xs text-[#bbcabf]">
                Physical cashflow in/out of personal treasury accounts
              </p>
            </div>

            {/* Visual Flow Breakdown */}
            <div className="space-y-3 py-1 font-mono text-xs">
              {/* Operating Inflow */}
              <div className="bg-[#171f33] p-3 rounded-lg space-y-1 border border-[#222a3d]">
                <div className="flex justify-between items-center">
                  <span className="text-[#dae2fd]">Personal Operating Inflow</span>
                  <span className="font-bold text-[#4edea3]">+$18,500/mo</span>
                </div>
                <div className="w-full bg-[#060e20] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#4edea3] h-full w-3/4 rounded-full"></div>
                </div>
                <div className="flex justify-between text-[#bbcabf] text-[10px] pt-1">
                  <span>Salary: $14.0k/mo (Bid Exact)</span>
                  <span>Advisory: $4.5k/mo</span>
                </div>
              </div>

              {/* Company Distributions */}
              <div className="bg-[#171f33] p-3 rounded-lg space-y-1 border border-[#222a3d]">
                <div className="flex justify-between items-center">
                  <span className="text-[#dae2fd]">Company Distributions (Cleared)</span>
                  <span className="font-bold text-[#4edea3]">+{mask(totalWired)}</span>
                </div>
                <div className="w-full bg-[#060e20] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#4edea3] h-full w-1/2 rounded-full"></div>
                </div>
                <div className="flex justify-between text-[#bbcabf] text-[10px] pt-1">
                  <span>BE $25k</span>
                  <span>Apex $5k</span>
                  <span>Kinetix $5k</span>
                </div>
              </div>

              {/* Capital Outflows */}
              <div className="bg-[#171f33] p-3 rounded-lg space-y-1 border border-[#222a3d]">
                <div className="flex justify-between items-center">
                  <span className="text-[#dae2fd]">Capital Injections (Outflow)</span>
                  <span className="font-bold text-[#ffb2b7]">-{mask(totalContributed)}</span>
                </div>
                <div className="w-full bg-[#060e20] h-1.5 rounded-full overflow-hidden">
                  <div className="bg-[#ff7886] h-full w-4/5 rounded-full"></div>
                </div>
                <div className="text-[#bbcabf] text-[10px] pt-1">
                  <span>Cumulative Principal Subscribed to Entities</span>
                </div>
              </div>

              {/* Personal Living */}
              <div className="bg-[#171f33] p-3 rounded-lg space-y-1 border border-[#222a3d]">
                <div className="flex justify-between items-center">
                  <span className="text-[#dae2fd]">Personal Living & Tax Reserve</span>
                  <span className="text-[#bbcabf]">Variable</span>
                </div>
                <div className="text-[#bbcabf] text-[10px]">
                  <span>Primary Mortgage • Q3 Estimated Tax • Private Reserve</span>
                </div>
              </div>
            </div>

            {/* Ending Cash Summary */}
            <div className="bg-[#060e20] p-4 rounded-lg border border-[#222a3d] flex items-center justify-between">
              <div>
                <span className="font-mono text-[10px] text-[#bbcabf] uppercase font-bold block">
                  Ending Liquid Personal Cash
                </span>
                <div className="font-mono text-2xl font-bold text-[#4edea3]">
                  {mask(metrics.personalCash)}
                </div>
              </div>
              <span className="material-symbols-outlined text-[#4edea3] text-4xl">account_balance_wallet</span>
            </div>
          </div>
        </div>
      </section>

      {/* Section 4: Capital Contributions & Distribution Activity */}
      <section className="px-4 sm:px-6 py-4 sm:py-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs text-[#4edea3] uppercase tracking-wider font-bold">
              04 // Ledger Events & Capital Activity
            </span>
            <span className="w-8 h-px bg-[#2d3449]"></span>
          </div>
          <div className="flex items-center gap-2 text-[#bbcabf] font-mono text-xs">
            <span className="inline-block w-2 h-2 rounded-full bg-[#4edea3]"></span>
            <span>Real-time Ledger Sync Live</span>
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl overflow-hidden shadow-sm font-mono text-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#060e20] text-[#bbcabf] uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-4">Classification</th>
                  <th className="py-2.5 px-4">Connected Entity</th>
                  <th className="py-2.5 px-4">Reference ID</th>
                  <th className="py-2.5 px-4">Transaction Scope / Details</th>
                  <th className="py-2.5 px-4 text-right">Accounting Date</th>
                  <th className="py-2.5 px-4 text-right">Cash Effect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222a3d]">
                {ledgerEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-[#171f33] transition-colors">
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded font-bold inline-flex items-center gap-1 ${
                          ev.classification === 'Distribution Payout'
                            ? 'bg-[#10b981]/20 text-[#4edea3]'
                            : ev.classification === 'Capital Contribution'
                            ? 'bg-[#222a3d] text-[#dae2fd]'
                            : ev.classification === 'Profit Allocation'
                            ? 'bg-[#0566d9]/20 text-[#adc6ff]'
                            : 'bg-[#10b981]/20 text-[#4edea3]'
                        }`}
                      >
                        <span className="material-symbols-outlined text-xs">
                          {ev.classification === 'Distribution Payout'
                            ? 'check_circle'
                            : ev.classification === 'Capital Contribution'
                            ? 'arrow_outward'
                            : ev.classification === 'Profit Allocation'
                            ? 'receipt'
                            : 'swap_horiz'}
                        </span>
                        {ev.classification}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-['Manrope'] font-bold text-[#dae2fd]">
                      {ev.entityName}
                    </td>
                    <td className="py-3 px-4 text-[#bbcabf] font-mono text-[11px]">
                      {ev.referenceId}
                    </td>
                    <td className="py-3 px-4 text-[#bbcabf] max-w-sm truncate">
                      {ev.scopeDetails}
                    </td>
                    <td className="py-3 px-4 text-right text-[#dae2fd]">
                      {ev.accountingDate}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-sm">
                      {ev.isAccruedNonCash ? (
                        <span className="text-[#dae2fd]">
                          +{maskRound(ev.cashEffect)}{' '}
                          <span className="text-[10px] text-[#bbcabf] font-normal">(Accrued)</span>
                        </span>
                      ) : ev.cashEffect > 0 ? (
                        <span className="text-[#4edea3]">+{mask(ev.cashEffect)}</span>
                      ) : (
                        <span className="text-[#ffb2b7]">{mask(ev.cashEffect)}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 5: Ownership Governance & Pending Approvals Bar */}
      {pendingGov && (
        <section className="px-4 sm:px-6 py-4 sm:py-6">
          <div className="bg-[#222a3d] border border-[#ff7886]/40 rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg">
            <div className="flex items-start gap-3.5">
              <div className="p-2 bg-[#ff7886]/20 text-[#ffb2b7] rounded-lg shrink-0">
                <span className="material-symbols-outlined text-2xl">warning</span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-['Manrope'] font-bold text-base text-[#dae2fd]">
                    {pendingGov.title}
                  </span>
                  <span className="font-mono text-[10px] px-2 py-0.5 bg-[#ff7886]/20 text-[#ffb2b7] rounded uppercase font-bold">
                    Action Required
                  </span>
                </div>
                <p className="text-xs text-[#bbcabf] font-mono leading-relaxed">
                  <strong className="text-[#dae2fd]">{pendingGov.entityName}:</strong> {pendingGov.proposedChange} (Proposed effective date: {pendingGov.effectiveDate}) — {pendingGov.status}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto font-mono text-xs">
              <button
                type="button"
                onClick={onOpenCapTable}
                className="flex-1 md:flex-none px-4 py-2 bg-[#171f33] hover:bg-[#2d3449] text-[#dae2fd] rounded uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
              >
                Download Cap Table
              </button>
              <button
                type="button"
                onClick={() => onOpenReviewGovernance(pendingGov)}
                className="flex-1 md:flex-none px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-[#003824] font-bold rounded transition-colors shadow-sm cursor-pointer"
              >
                Review Change Request
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
