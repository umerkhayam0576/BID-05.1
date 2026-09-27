import React, { useState } from 'react';
import { CompanyEntity, RoleType } from '../../types/wealth';

interface AddCompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCompany: (company: CompanyEntity) => void;
}

export const AddCompanyModal: React.FC<AddCompanyModalProps> = ({
  isOpen,
  onClose,
  onAddCompany,
}) => {
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [roleTitle, setRoleTitle] = useState('Co-Founder & Partner');
  const [roleType, setRoleType] = useState<RoleType>('full-signatory');
  const [legalOwnership, setLegalOwnership] = useState<number>(25);
  const [ownershipType, setOwnershipType] = useState('Common Stock Holding');
  const [profitShare, setProfitShare] = useState<number>(25);
  const [profitTierDesc, setProfitTierDesc] = useState('Standard Pro-Rata Tier');
  const [enterpriseValuation, setEnterpriseValuation] = useState<number>(500000);
  const [contributedCapital, setContributedCapital] = useState<number>(25000);
  const [companyNetProfit, setCompanyNetProfit] = useState<number>(40000);
  const [distributionsReceived, setDistributionsReceived] = useState<number>(5000);
  const [distributionsPending, setDistributionsPending] = useState<number>(0);
  const [icon, setIcon] = useState('corporate_fare');
  const [color, setColor] = useState<'primary' | 'secondary' | 'tertiary'>('primary');
  const [coOwnerName, setCoOwnerName] = useState('Partner / Lead');
  const [coOwnerPercent, setCoOwnerPercent] = useState<number>(75);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const id = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
    const equityVal = (enterpriseValuation * (legalOwnership / 100));
    const attributed = (companyNetProfit * (profitShare / 100));

    const roleBadge = `${legalOwnership}% • ${
      roleType === 'full-signatory' ? 'Admin' : roleType === 'board-observer' ? 'Board' : 'Passive'
    }`;

    const newCompany: CompanyEntity = {
      id,
      name: name.trim(),
      industry: industry.trim() || 'Emerging Technology',
      role: `${roleTitle} • ${roleType === 'full-signatory' ? 'Full Admin & Signatory' : 'Board Access'}`,
      roleType,
      roleBadge,
      statusBadge: 'Active • Real-time Sync',
      legalOwnershipPercent: Number(legalOwnership),
      ownershipType,
      profitSharePercent: Number(profitShare),
      profitTierDescription: profitTierDesc,
      companyNetProfit: Number(companyNetProfit),
      attributedProfit: Math.round(attributed),
      distributionsReceived: Number(distributionsReceived),
      distributionsPending: Number(distributionsPending),
      contributedCapital: Number(contributedCapital),
      enterpriseValuation: Number(enterpriseValuation),
      equityPositionValue: Math.round(equityVal),
      icon,
      color,
      foundedYear: 2024,
      revenueYtd: companyNetProfit * 3.5,
      expensesYtd: companyNetProfit * 2.5,
      operatingCashReserve: contributedCapital * 1.5,
      capTable: [
        {
          name: 'Umer (You)',
          role: roleTitle,
          percentage: Number(legalOwnership),
          initialInvestment: Number(contributedCapital),
          votingRights: roleType === 'full-signatory',
        },
        {
          name: coOwnerName.trim() || 'Co-Founders & Syndicate',
          role: 'Managing Group',
          percentage: Number(coOwnerPercent) || (100 - Number(legalOwnership)),
          initialInvestment: enterpriseValuation - contributedCapital,
          votingRights: true,
        },
      ],
      notes: 'Connected via ExactLedger multi-entity corporate books connector.',
    };

    onAddCompany(newCompany);
    onClose();

    // Reset form
    setName('');
    setIndustry('');
  };

  const icons = [
    { label: 'Corporate', value: 'corporate_fare' },
    { label: 'Domain', value: 'domain' },
    { label: 'Logistics', value: 'local_shipping' },
    { label: 'Biotech', value: 'biotech' },
    { label: 'Manufacturing', value: 'precision_manufacturing' },
    { label: 'Cloud / Tech', value: 'cloud' },
    { label: 'Rocket / Startup', value: 'rocket_launch' },
    { label: 'Retail / Store', value: 'storefront' },
  ];

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#131b2e] border border-[#2d3449] rounded-xl max-w-2xl w-full shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#060e20] border-b border-[#222a3d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#4edea3] text-xl">domain_add</span>
            <div>
              <h2 className="font-['Manrope'] font-bold text-base text-[#dae2fd]">
                Connect New Company Entity
              </h2>
              <p className="text-xs text-[#bbcabf]">
                Add another operating company to your consolidated portfolio with isolated GAAP books.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#bbcabf] hover:text-[#dae2fd] p-1 rounded hover:bg-[#171f33] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Company Name */}
            <div className="space-y-1">
              <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
                Company Legal Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Starlight AI Systems LLC"
                className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none"
              />
            </div>

            {/* Industry */}
            <div className="space-y-1">
              <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
                Industry / Sector
              </label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                placeholder="e.g. Machine Learning Infrastructure"
                className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none"
              />
            </div>

            {/* Role Type */}
            <div className="space-y-1">
              <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
                Your Role & Governance Status
              </label>
              <select
                value={roleType}
                onChange={(e) => setRoleType(e.target.value as RoleType)}
                className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none"
              >
                <option value="full-signatory">Full Signatory & Managing Partner (Admin)</option>
                <option value="board-observer">Board Observer / Advisory Partner</option>
                <option value="passive">Passive Investor / LP</option>
              </select>
            </div>

            {/* Role Title */}
            <div className="space-y-1">
              <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
                Your Role Title
              </label>
              <input
                type="text"
                value={roleTitle}
                onChange={(e) => setRoleTitle(e.target.value)}
                placeholder="e.g. Co-Founder, Angel Investor, Partner"
                className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none"
              />
            </div>

            {/* Legal Ownership % */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-mono text-xs font-semibold text-[#dae2fd]">
                  Legal Equity Ownership %
                </label>
                <span className="font-mono text-xs text-[#4edea3] font-bold">{legalOwnership}%</span>
              </div>
              <input
                type="number"
                min="0.1"
                max="100"
                step="0.1"
                value={legalOwnership}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setLegalOwnership(val);
                  setCoOwnerPercent(Math.max(0, 100 - val));
                }}
                className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none font-mono"
              />
            </div>

            {/* Profit Share % */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="font-mono text-xs font-semibold text-[#dae2fd]">
                  Profit Share Tier %
                </label>
                <span className="font-mono text-xs text-[#4edea3] font-bold">{profitShare}%</span>
              </div>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={profitShare}
                onChange={(e) => setProfitShare(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none font-mono"
              />
            </div>

            {/* Enterprise Valuation */}
            <div className="space-y-1">
              <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
                Enterprise Valuation ($ USD)
              </label>
              <input
                type="number"
                min="0"
                step="5000"
                value={enterpriseValuation}
                onChange={(e) => setEnterpriseValuation(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none font-mono"
              />
            </div>

            {/* Contributed Capital */}
            <div className="space-y-1">
              <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
                Your Contributed Capital ($)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={contributedCapital}
                onChange={(e) => setContributedCapital(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none font-mono"
              />
            </div>

            {/* Company Net Profit */}
            <div className="space-y-1">
              <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
                Annual Company Net Profit ($)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={companyNetProfit}
                onChange={(e) => setCompanyNetProfit(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none font-mono"
              />
            </div>

            {/* Distributions Received */}
            <div className="space-y-1">
              <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
                Distributions Received YTD ($)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                value={distributionsReceived}
                onChange={(e) => setDistributionsReceived(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none font-mono"
              />
            </div>

            {/* Icon Selector */}
            <div className="space-y-1 sm:col-span-2">
              <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
                Entity Visual Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {icons.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setIcon(item.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs transition-colors border ${
                      icon === item.value
                        ? 'bg-[#10b981]/20 border-[#4edea3] text-[#4edea3]'
                        : 'bg-[#0b1326] border-[#2d3449] text-[#bbcabf] hover:bg-[#171f33]'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">{item.value}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Computed Summary Preview */}
          <div className="p-3.5 bg-[#060e20] border border-[#222a3d] rounded-lg flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="font-mono text-[10px] text-[#bbcabf] uppercase font-bold">
                Computed Personal Equity Value
              </span>
              <div className="font-mono text-lg font-bold text-[#4edea3]">
                ${((enterpriseValuation * legalOwnership) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-right space-y-0.5">
              <span className="font-mono text-[10px] text-[#bbcabf] uppercase font-bold">
                Attributed Profit Share
              </span>
              <div className="font-mono text-sm font-semibold text-[#dae2fd]">
                ${((companyNetProfit * profitShare) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-3 border-t border-[#222a3d] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] rounded text-xs font-mono font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-[#003824] rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">check</span>
              <span>Connect Entity</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
