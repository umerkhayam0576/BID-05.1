import React from 'react';
import { CompanyEntity, KeyWealthMetrics, LedgerEvent, WealthNavTabId } from '../../types/wealth';

interface WealthSecondaryViewsProps {
  activeTab: WealthNavTabId;
  companies: CompanyEntity[];
  metrics: KeyWealthMetrics;
  ledgerEvents: LedgerEvent[];
  onOpenRecordCapital: () => void;
  privacyMode: boolean;
}

export const WealthSecondaryViews: React.FC<WealthSecondaryViewsProps> = ({
  activeTab,
  companies,
  metrics,
  ledgerEvents,
  onOpenRecordCapital,
  privacyMode,
}) => {
  const mask = (val: number) => {
    if (privacyMode) return '$••••••';
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  // 1. Bank & Liquid Cash View
  if (activeTab === 'bank-and-liquid-cash') {
    return (
      <div className="flex flex-col w-full px-6 py-6 space-y-6 pb-24 font-mono text-xs">
        <div className="bg-[#060e20] p-6 rounded-xl border border-[#222a3d] flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-2xl">payments</span>
              <h1 className="font-['Manrope'] font-bold text-2xl text-[#dae2fd]">
                Personal Bank & Liquid Cash Reserves
              </h1>
            </div>
            <p className="text-[#bbcabf] mt-1">
              Unencumbered personal cash held in segregated high-yield and checking accounts.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#bbcabf] uppercase block font-bold">Total Liquid Cash</span>
            <span className="text-2xl font-bold text-[#4edea3]">{mask(metrics.personalCash)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#131b2e] p-5 rounded-xl border border-[#222a3d] space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-['Manrope'] font-bold text-base text-[#dae2fd]">Chase Premier Checking</span>
              <span className="text-[#4edea3] font-bold">Primary Inflows</span>
            </div>
            <div className="text-2xl font-bold text-[#dae2fd]">{mask(metrics.chaseChecking)}</div>
            <p className="text-[#bbcabf] text-[11px]">
              Direct deposit destination for Bid Exact salary ($14.0k/mo) and member distributions.
            </p>
          </div>

          <div className="bg-[#131b2e] p-5 rounded-xl border border-[#222a3d] space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-['Manrope'] font-bold text-base text-[#dae2fd]">Marcus High-Yield Savings</span>
              <span className="text-[#4edea3] font-bold">5.10% APY</span>
            </div>
            <div className="text-2xl font-bold text-[#4edea3]">{mask(metrics.hysa)}</div>
            <p className="text-[#bbcabf] text-[11px]">
              Dedicated emergency reserve maintaining 6+ months of personal runway.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. Investment Portfolios
  if (activeTab === 'investment-portfolios') {
    return (
      <div className="flex flex-col w-full px-6 py-6 space-y-6 pb-24 font-mono text-xs">
        <div className="bg-[#060e20] p-6 rounded-xl border border-[#222a3d] flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-2xl">trending_up</span>
              <h1 className="font-['Manrope'] font-bold text-2xl text-[#dae2fd]">
                Personal Investment Portfolios
              </h1>
            </div>
            <p className="text-[#bbcabf] mt-1">Liquid index equities, Roth 401(k), and treasury bonds.</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#bbcabf] uppercase block font-bold">Portfolio Value</span>
            <span className="text-2xl font-bold text-[#4edea3]">{mask(metrics.investmentPortfolios)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-[#131b2e] p-5 rounded-xl border border-[#222a3d] space-y-2">
            <span className="text-[#bbcabf] uppercase text-[10px]">Vanguard Total Stock (VTI)</span>
            <div className="text-xl font-bold text-[#dae2fd]">{mask(125000)}</div>
            <span className="text-[#4edea3] font-bold">+18.2% Unrealized Gain</span>
          </div>
          <div className="bg-[#131b2e] p-5 rounded-xl border border-[#222a3d] space-y-2">
            <span className="text-[#bbcabf] uppercase text-[10px]">Roth 401(k) / IRA</span>
            <div className="text-xl font-bold text-[#dae2fd]">{mask(55000)}</div>
            <span className="text-[#4edea3] font-bold">Tax-advantaged retirement</span>
          </div>
          <div className="bg-[#131b2e] p-5 rounded-xl border border-[#222a3d] space-y-2">
            <span className="text-[#bbcabf] uppercase text-[10px]">US Treasury Bills (4-Week)</span>
            <div className="text-xl font-bold text-[#dae2fd]">{mask(20000)}</div>
            <span className="text-[#4edea3] font-bold">5.25% Yield</span>
          </div>
        </div>
      </div>
    );
  }

  // 3. Real Estate & Property
  if (activeTab === 'real-estate-and-property') {
    return (
      <div className="flex flex-col w-full px-6 py-6 space-y-6 pb-24 font-mono text-xs">
        <div className="bg-[#060e20] p-6 rounded-xl border border-[#222a3d] flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-2xl">apartment</span>
              <h1 className="font-['Manrope'] font-bold text-2xl text-[#dae2fd]">
                Real Estate & Property Assets
              </h1>
            </div>
            <p className="text-[#bbcabf] mt-1">Residential and commercial equity holdings.</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#bbcabf] uppercase block font-bold">Net Property Equity</span>
            <span className="text-2xl font-bold text-[#4edea3]">{mask(metrics.realEstateProperty)}</span>
          </div>
        </div>

        <div className="bg-[#131b2e] p-6 rounded-xl border border-[#222a3d] space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-['Manrope'] font-bold text-lg text-[#dae2fd]">Primary Residence (Bay Area)</h3>
              <p className="text-[#bbcabf] text-xs">Appraised Market Value: $850,000.00 • Mortgage Balance: $550,000.00</p>
            </div>
            <span className="text-xl font-bold text-[#4edea3]">{mask(300000)} Equity</span>
          </div>
        </div>
      </div>
    );
  }

  // 4. Profit Share & Attributions
  if (activeTab === 'profit-share-and-attributions') {
    return (
      <div className="flex flex-col w-full px-6 py-6 space-y-6 pb-24 font-mono text-xs">
        <div className="bg-[#060e20] p-6 rounded-xl border border-[#222a3d] flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-2xl">query_stats</span>
              <h1 className="font-['Manrope'] font-bold text-2xl text-[#dae2fd]">
                Entity Profit Share & Attributions Ledger
              </h1>
            </div>
            <p className="text-[#bbcabf] mt-1">
              Entitled corporate net profit allocations based on Schedule K-1 and operating agreements.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#bbcabf] uppercase block font-bold">Total Attributed</span>
            <span className="text-2xl font-bold text-[#4edea3]">{mask(metrics.profitAttributed)}</span>
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#060e20] text-[#bbcabf] uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Entity</th>
                <th className="py-2.5 px-4 text-right">Company Net Income</th>
                <th className="py-2.5 px-4 text-right">Profit Share Tier</th>
                <th className="py-2.5 px-4 text-right">Attributed Profit</th>
                <th className="py-2.5 px-4 text-right">Cash Distributions Realized</th>
                <th className="py-2.5 px-4 text-right">Retained in Corporate Entity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d]">
              {companies.map((c) => (
                <tr key={c.id} className="hover:bg-[#171f33]">
                  <td className="py-3 px-4 font-bold text-[#dae2fd]">{c.name}</td>
                  <td className="py-3 px-4 text-right">{mask(c.companyNetProfit)}</td>
                  <td className="py-3 px-4 text-right text-[#4edea3] font-bold">{c.profitSharePercent}%</td>
                  <td className="py-3 px-4 text-right text-[#4edea3] font-bold">{mask(c.attributedProfit)}</td>
                  <td className="py-3 px-4 text-right text-[#dae2fd]">{mask(c.distributionsReceived)}</td>
                  <td className="py-3 px-4 text-right text-[#ffb2b7] font-bold">
                    {mask(Math.max(0, c.attributedProfit - c.distributionsReceived))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 5. Distribution Ledger
  if (activeTab === 'distribution-ledger') {
    const distEvents = ledgerEvents.filter((e) => e.classification === 'Distribution Payout');
    return (
      <div className="flex flex-col w-full px-6 py-6 space-y-6 pb-24 font-mono text-xs">
        <div className="bg-[#060e20] p-6 rounded-xl border border-[#222a3d] flex justify-between items-center">
          <div>
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#4edea3] text-2xl">receipt_long</span>
              <h1 className="font-['Manrope'] font-bold text-2xl text-[#dae2fd]">
                Realized Distribution Wire Ledger
              </h1>
            </div>
            <p className="text-[#bbcabf] mt-1">
              Physical cash distributions wired from corporate treasury accounts into personal bank accounts.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenRecordCapital}
            className="px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-[#003824] rounded font-bold transition-colors"
          >
            + Record Distribution Wire
          </button>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-[#060e20] text-[#bbcabf] uppercase text-[10px]">
              <tr>
                <th className="py-2.5 px-4">Wire Ref</th>
                <th className="py-2.5 px-4">Disbursing Entity</th>
                <th className="py-2.5 px-4">Description / Receiving Account</th>
                <th className="py-2.5 px-4 text-right">Cleared Date</th>
                <th className="py-2.5 px-4 text-right">Amount Cleared</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d]">
              {distEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-[#171f33]">
                  <td className="py-3 px-4 text-[#4edea3] font-bold">{ev.referenceId}</td>
                  <td className="py-3 px-4 font-bold text-[#dae2fd]">{ev.entityName}</td>
                  <td className="py-3 px-4 text-[#bbcabf]">{ev.scopeDetails}</td>
                  <td className="py-3 px-4 text-right text-[#dae2fd]">{ev.accountingDate}</td>
                  <td className="py-3 px-4 text-right text-[#4edea3] font-bold text-sm">
                    +{mask(ev.cashEffect)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // Fallback for remaining tabs (Capital Contributions, Compliance, etc.)
  return (
    <div className="flex flex-col w-full px-6 py-6 space-y-6 pb-24 font-mono text-xs">
      <div className="bg-[#060e20] p-6 rounded-xl border border-[#222a3d]">
        <h1 className="font-['Manrope'] font-bold text-xl text-[#dae2fd] capitalize">
          {activeTab.replace(/-/g, ' ')}
        </h1>
        <p className="text-[#bbcabf] mt-1">
          Isolated ledger module active and synchronized across all {companies.length} corporate entities.
        </p>
      </div>

      <div className="bg-[#131b2e] p-6 rounded-xl border border-[#222a3d] space-y-4">
        <div className="flex items-center gap-2 text-[#4edea3]">
          <span className="material-symbols-outlined text-lg">verified</span>
          <span className="font-bold uppercase tracking-wider">GAAP Multi-Company Protocol Active</span>
        </div>
        <p className="text-[#bbcabf] leading-relaxed">
          All records under this module maintain strict accounting segregation. Company retained earnings, shareholder equity notes, and tax obligations are tracked independently per operating entity.
        </p>
        <button
          type="button"
          onClick={onOpenRecordCapital}
          className="px-4 py-2 bg-[#171f33] hover:bg-[#222a3d] border border-[#4edea3]/40 text-[#4edea3] rounded font-bold transition-colors"
        >
          + Record Ledger Transaction
        </button>
      </div>
    </div>
  );
};
