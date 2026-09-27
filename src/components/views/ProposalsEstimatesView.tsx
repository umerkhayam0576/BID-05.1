import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Calendar,
  DollarSign,
  TrendingUp,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Download
} from 'lucide-react';
import { BidItem } from '../../types';

interface ProposalsEstimatesViewProps {
  bids: BidItem[];
  onSelectBid: (bid: BidItem) => void;
  onOpenNewBid: () => void;
}

export const ProposalsEstimatesView: React.FC<ProposalsEstimatesViewProps> = ({
  bids,
  onSelectBid,
  onOpenNewBid,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'under_review' | 'active' | 'awarded' | 'submitted'>('all');

  const totalPipeline = bids.reduce((sum, b) => sum + b.amount, 0);

  const filtered = bids.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' ? true : b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>PRE-CONSTRUCTION</span>
            <span>/</span>
            <span>PROPOSALS & ESTIMATE PACKAGES</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Proposals & Estimates Pipeline
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Quantity takeoff deliverables, CSI division breakdowns, submission deadlines, and bid bond status
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bids, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", "bid_exact_proposals_ledger.json");
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#86948a]" />
            <span>Export Proposals</span>
          </button>
          <button
            onClick={onOpenNewBid}
            className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ New Takeoff / Proposal</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Active Bid Pipeline
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${(totalPipeline / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            {bids.length} Active estimate packages
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Under GC Review
          </div>
          <div className="text-2xl font-bold font-mono text-[#adc6ff]">
            {bids.filter((b) => b.status === 'under_review').length} Packages
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Average decision cycle: 14 days
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Average Win Probability
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            72%
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Based on historical GC relationship score
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Next Delivery Deadline
          </div>
          <div className="text-2xl font-bold font-mono text-[#ffb4ab]">
            In 3 Days
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Metro Heights Concrete Scope
          </div>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#222a3d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#86948a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search proposal, project, or GC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded transition-colors ${
                statusFilter === 'all'
                  ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              All ({bids.length})
            </button>
            <button
              onClick={() => setStatusFilter('under_review')}
              className={`px-3 py-1 rounded transition-colors ${
                statusFilter === 'under_review'
                  ? 'bg-[#3b82f6]/20 text-[#adc6ff] font-bold border border-[#3b82f6]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              Under Review
            </button>
            <button
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded transition-colors ${
                statusFilter === 'active'
                  ? 'bg-[#e0b44a]/20 text-[#e0b44a] font-bold border border-[#e0b44a]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              In Preparation
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] uppercase text-[10px] tracking-wider border-b border-[#222a3d]">
              <tr>
                <th className="p-3">Bid Package</th>
                <th className="p-3">General Contractor</th>
                <th className="p-3">Primary Scope Divisions</th>
                <th className="p-3 text-right">Scope Value</th>
                <th className="p-3">Target Due Date</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d] text-[#dae2fd]">
              {filtered.map((bid) => (
                <tr key={bid.id} className="hover:bg-[#171f33]/70 transition-colors">
                  <td className="p-3 font-sans">
                    <div className="font-semibold text-white">{bid.title}</div>
                    <div className="text-[11px] font-mono text-[#86948a]">{bid.id}</div>
                  </td>
                  <td className="p-3 font-sans text-white font-medium">{bid.client}</td>
                  <td className="p-3 text-[#bbcabf] font-sans">
                    <span className="px-1.5 py-0.5 rounded bg-[#0b1326] text-[10px] font-mono text-[#adc6ff] border border-[#222a3d]">
                      {bid.divisionScope || 'Div 03 Concrete'}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-[#4edea3]">
                    ${bid.amount.toLocaleString()}
                  </td>
                  <td className="p-3 text-[#dae2fd]">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-[#86948a]" />
                      <span>{bid.dueDate}</span>
                    </div>
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                        bid.status === 'under_review'
                          ? 'bg-[#3b82f6]/10 text-[#adc6ff] border border-[#3b82f6]/20'
                          : bid.status === 'active'
                          ? 'bg-[#e0b44a]/10 text-[#e0b44a] border border-[#e0b44a]/20'
                          : 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20'
                      }`}
                    >
                      {bid.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onSelectBid(bid)}
                      className="px-2.5 py-1 rounded bg-[#171f33] hover:bg-[#222a3d] text-xs font-mono text-[#4edea3] border border-[#2d3449] transition-colors cursor-pointer"
                    >
                      Inspect →
                    </button>
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
