import React, { useState } from 'react';
import { CompanyEntity, RoleType } from '../../types/wealth';

interface MultiCompanyPortfolioViewProps {
  companies: CompanyEntity[];
  onSelectEntity: (id: string | null) => void;
  onOpenAddCompany: () => void;
  onDeleteCompany: (id: string) => void;
  privacyMode: boolean;
}

export const MultiCompanyPortfolioView: React.FC<MultiCompanyPortfolioViewProps> = ({
  companies,
  onSelectEntity,
  onOpenAddCompany,
  onDeleteCompany,
  privacyMode,
}) => {
  const [roleFilter, setRoleFilter] = useState<'all' | RoleType>('all');

  const mask = (val: number) => {
    if (privacyMode) return '$••••••';
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  const filteredCompanies = companies.filter((c) => {
    if (roleFilter === 'all') return true;
    return c.roleType === roleFilter;
  });

  const totalValuation = companies.reduce((acc, c) => acc + c.enterpriseValuation, 0);
  const totalEquity = companies.reduce((acc, c) => acc + c.equityPositionValue, 0);
  const totalAttributed = companies.reduce((acc, c) => acc + c.attributedProfit, 0);
  const totalContributed = companies.reduce((acc, c) => acc + c.contributedCapital, 0);

  return (
    <div className="flex flex-col w-full px-6 py-6 space-y-6 pb-24">
      {/* Header Banner */}
      <div className="bg-[#060e20] p-6 rounded-xl border border-[#222a3d] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-2xl">domain</span>
            <h1 className="font-['Manrope'] font-bold text-2xl text-[#dae2fd]">
              Multi-Company Operating Portfolio
            </h1>
          </div>
          <p className="text-xs text-[#bbcabf] mt-1 font-mono">
            {companies.length} connected corporate entities with isolated GAAP ledgers and distinct profit-share tiers.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenAddCompany}
          className="px-4 py-2.5 bg-[#10b981] hover:bg-[#059669] text-[#003824] rounded-lg text-xs font-mono font-bold transition-colors flex items-center gap-2 shadow-sm self-start md:self-auto cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm font-bold">add_business</span>
          <span>+ Connect Another Entity</span>
        </button>
      </div>

      {/* Summary Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] p-4 rounded-lg border border-[#222a3d] space-y-1">
          <span className="text-[10px] font-mono text-[#bbcabf] uppercase font-bold">Total Equity Position</span>
          <div className="font-mono text-xl font-bold text-[#4edea3]">{mask(totalEquity)}</div>
          <div className="text-[11px] text-[#bbcabf]">Across {companies.length} active companies</div>
        </div>
        <div className="bg-[#131b2e] p-4 rounded-lg border border-[#222a3d] space-y-1">
          <span className="text-[10px] font-mono text-[#bbcabf] uppercase font-bold">Cumulative Valuation</span>
          <div className="font-mono text-xl font-bold text-[#dae2fd]">{mask(totalValuation)}</div>
          <div className="text-[11px] text-[#bbcabf]">Combined enterprise value</div>
        </div>
        <div className="bg-[#131b2e] p-4 rounded-lg border border-[#222a3d] space-y-1">
          <span className="text-[10px] font-mono text-[#bbcabf] uppercase font-bold">Capital Invested</span>
          <div className="font-mono text-xl font-bold text-[#dae2fd]">{mask(totalContributed)}</div>
          <div className="text-[11px] text-[#bbcabf]">Historical cash principal</div>
        </div>
        <div className="bg-[#131b2e] p-4 rounded-lg border border-[#222a3d] space-y-1">
          <span className="text-[10px] font-mono text-[#bbcabf] uppercase font-bold">Annual Profit Attributed</span>
          <div className="font-mono text-xl font-bold text-[#4edea3]">{mask(totalAttributed)}</div>
          <div className="text-[11px] text-[#bbcabf]">Entitled accounting profit</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between gap-4 border-b border-[#222a3d] pb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-[#bbcabf] mr-1">Governance Role:</span>
          {[
            { id: 'all', label: 'All Entities' },
            { id: 'full-signatory', label: 'Full Signatory (Admin)' },
            { id: 'board-observer', label: 'Board / Observer' },
            { id: 'passive', label: 'Passive LP' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded text-xs font-mono transition-colors ${
                roleFilter === tab.id
                  ? 'bg-[#10b981]/20 text-[#4edea3] border border-[#4edea3]/40 font-bold'
                  : 'text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#171f33]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Companies */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <div
            key={company.id}
            className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-5 flex flex-col justify-between shadow-sm hover:shadow-lg transition-all"
          >
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded bg-[#0b1326] border border-[#222a3d] ${
                    company.color === 'primary' ? 'text-[#4edea3]' : company.color === 'secondary' ? 'text-[#adc6ff]' : 'text-[#ffb2b7]'
                  }`}>
                    <span className="material-symbols-outlined text-xl">{company.icon}</span>
                  </div>
                  <div>
                    <span className="font-mono text-[10px] text-[#4edea3] uppercase font-bold tracking-wider">
                      {company.industry}
                    </span>
                    <h3 className="font-['Manrope'] font-bold text-lg text-[#dae2fd]">
                      {company.name}
                    </h3>
                  </div>
                </div>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-[#222a3d] text-[#dae2fd] font-semibold">
                  {company.statusBadge}
                </span>
              </div>

              <p className="text-xs text-[#bbcabf]">{company.role}</p>

              {/* 2x2 Stats Grid */}
              <div className="grid grid-cols-2 gap-2 pt-1 font-mono">
                <div className="bg-[#0b1326] p-2.5 rounded border border-[#222a3d]">
                  <span className="text-[10px] text-[#bbcabf] uppercase block font-semibold">Legal Ownership</span>
                  <span className="text-base font-bold text-[#dae2fd]">{company.legalOwnershipPercent}%</span>
                  <span className="text-[9px] text-[#bbcabf] block truncate">{company.ownershipType}</span>
                </div>
                <div className="bg-[#0b1326] p-2.5 rounded border border-[#222a3d]">
                  <span className="text-[10px] text-[#bbcabf] uppercase block font-semibold">Profit Share Tier</span>
                  <span className="text-base font-bold text-[#4edea3]">{company.profitSharePercent}%</span>
                  <span className="text-[9px] text-[#bbcabf] block truncate">{company.profitTierDescription}</span>
                </div>
                <div className="bg-[#0b1326] p-2.5 rounded border border-[#222a3d]">
                  <span className="text-[10px] text-[#bbcabf] uppercase block font-semibold">Company Net Profit</span>
                  <span className="text-xs font-semibold text-[#dae2fd]">{mask(company.companyNetProfit)}</span>
                  <span className="text-[9px] text-[#4edea3] block">Attr: {mask(company.attributedProfit)}</span>
                </div>
                <div className="bg-[#0b1326] p-2.5 rounded border border-[#222a3d]">
                  <span className="text-[10px] text-[#bbcabf] uppercase block font-semibold">Distributions Rec'd</span>
                  <span className="text-xs font-semibold text-[#4edea3]">{mask(company.distributionsReceived)}</span>
                  <span className="text-[9px] text-[#ffb2b7] block">
                    {company.distributionsPending > 0 ? `+${mask(company.distributionsPending)} due` : 'Settled'}
                  </span>
                </div>
              </div>

              {/* Position Value */}
              <div className="p-3 bg-[#060e20] rounded-lg border border-[#222a3d] flex justify-between items-center font-mono">
                <div>
                  <span className="text-[10px] text-[#bbcabf] uppercase block">Your Equity Position</span>
                  <span className="text-base font-bold text-[#4edea3]">{mask(company.equityPositionValue)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#bbcabf] uppercase block">Enterprise Valuation</span>
                  <span className="text-xs text-[#dae2fd]">{mask(company.enterpriseValuation)}</span>
                </div>
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-4 mt-3 border-t border-[#222a3d] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => onSelectEntity(company.id)}
                className="flex-1 py-2 px-3 bg-[#171f33] hover:bg-[#222a3d] text-[#4edea3] rounded text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Open {company.name.split(' ')[0]} Workspace</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
              {companies.length > 1 && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Remove ${company.name} from portfolio tracking?`)) {
                      onDeleteCompany(company.id);
                    }
                  }}
                  className="p-2 text-[#bbcabf] hover:text-[#ffb2b7] hover:bg-[#ff7886]/10 rounded transition-colors"
                  title="Remove entity"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
