import React from 'react';
import {
  PieChart,
  ShieldCheck,
  TrendingUp,
  DollarSign,
  Users,
  Award,
  Download,
  Building2,
  FileCheck
} from 'lucide-react';

interface Shareholder {
  id: string;
  name: string;
  role: string;
  shareClass: 'Class A Voting Common' | 'Class B Non-Voting' | 'Option Pool (ESOP)';
  shares: number;
  percentage: number;
  costBasis: number;
  currentValue: number;
}

const SHAREHOLDERS: Shareholder[] = [
  {
    id: 'SH-01',
    name: 'Umer Khayam',
    role: 'Founder & Managing Principal',
    shareClass: 'Class A Voting Common',
    shares: 6000000,
    percentage: 60.0,
    costBasis: 50000,
    currentValue: 2880000,
  },
  {
    id: 'SH-02',
    name: 'Elena Rostova',
    role: 'VP Virtual Design & BIM Ops',
    shareClass: 'Class B Non-Voting',
    shares: 1500000,
    percentage: 15.0,
    costBasis: 25000,
    currentValue: 720000,
  },
  {
    id: 'SH-03',
    name: 'Marcus Vance',
    role: 'Principal Chief Estimator',
    shareClass: 'Class B Non-Voting',
    shares: 1500000,
    percentage: 15.0,
    costBasis: 25000,
    currentValue: 720000,
  },
  {
    id: 'SH-04',
    name: 'Employee Incentive Pool (ESOP)',
    role: 'Unallocated Talent Reserve',
    shareClass: 'Option Pool (ESOP)',
    shares: 1000000,
    percentage: 10.0,
    costBasis: 0,
    currentValue: 480000,
  },
];

export const CapTableView: React.FC = () => {
  const totalShares = 10000000;
  const companyValuation = 4800000;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>CORPORATE GOVERNANCE</span>
            <span>/</span>
            <span>EQUITY & CAP TABLE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Capitalization Table & Equity Ledger
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Bid Exact LLC ownership distribution, share class rights, and 409A enterprise valuation
          </p>
        </div>

        <button
          onClick={() => {
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(SHAREHOLDERS, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", "bid_exact_cap_table.json");
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
          }}
          className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-[#86948a]" />
          <span>Export Cap Table</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Enterprise Valuation (409A)
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${(companyValuation / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            Share Price: $0.48 / share
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Total Authorized Shares
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            10,000,000
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Delaware Registered LLC / C-Corp conversion ready
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Founder Ownership
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            60.0%
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            Majority Voting Control Retained
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            ESOP Reserve Pool
          </div>
          <div className="text-2xl font-bold font-mono text-[#adc6ff]">
            10.0% (1.0M Shares)
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Reserved for key estimators & developers
          </div>
        </div>
      </div>

      {/* Visual Ownership Bar */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-white font-semibold uppercase">Equity Allocation Visualizer</span>
          <span className="text-[#86948a]">100% Fully Diluted</span>
        </div>

        <div className="w-full h-4 bg-[#0b1326] rounded-full overflow-hidden flex border border-[#222a3d]">
          <div style={{ width: '60%' }} className="bg-[#4edea3] h-full" title="Umer Khayam (60%)" />
          <div style={{ width: '15%' }} className="bg-[#3b82f6] h-full" title="Elena Rostova (15%)" />
          <div style={{ width: '15%' }} className="bg-[#9747ff] h-full" title="Marcus Vance (15%)" />
          <div style={{ width: '10%' }} className="bg-[#e0b44a] h-full" title="ESOP Pool (10%)" />
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#4edea3]" />
            <span className="text-[#dae2fd]">Umer Khayam (60%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#3b82f6]" />
            <span className="text-[#dae2fd]">Elena Rostova (15%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#9747ff]" />
            <span className="text-[#dae2fd]">Marcus Vance (15%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-[#e0b44a]" />
            <span className="text-[#dae2fd]">ESOP Pool (10%)</span>
          </div>
        </div>
      </div>

      {/* Shareholder Table */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] uppercase text-[10px] tracking-wider border-b border-[#222a3d]">
              <tr>
                <th className="p-3">Shareholder</th>
                <th className="p-3">Corporate Title</th>
                <th className="p-3">Share Class</th>
                <th className="p-3 text-right">Shares Held</th>
                <th className="p-3 text-right">Ownership %</th>
                <th className="p-3 text-right">Current Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d] text-[#dae2fd]">
              {SHAREHOLDERS.map((sh) => (
                <tr key={sh.id} className="hover:bg-[#171f33]/70 transition-colors">
                  <td className="p-3 font-sans font-semibold text-white">{sh.name}</td>
                  <td className="p-3 text-[#bbcabf] font-sans">{sh.role}</td>
                  <td className="p-3">
                    <span className="px-1.5 py-0.5 rounded bg-[#0b1326] text-[10px] text-[#adc6ff] border border-[#222a3d]">
                      {sh.shareClass}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-white">
                    {sh.shares.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-bold text-[#4edea3]">
                    {sh.percentage.toFixed(1)}%
                  </td>
                  <td className="p-3 text-right font-bold text-white">
                    ${sh.currentValue.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
