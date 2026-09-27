import React from 'react';
import {
  TrendingUp,
  FileQuestion,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building2,
  Layers,
  Sparkles,
  ArrowUpRight,
  AlertTriangle,
  CalendarClock,
  PhoneCall,
  Landmark
} from 'lucide-react';
import { NavTabId } from '../Sidebar';

interface OperationsOverviewViewProps {
  onNavigateTab: (tab: NavTabId) => void;
  onOpenNewRfi: () => void;
  onOpenNewBid: () => void;
  onOpenNewClient: () => void;
}

export const OperationsOverviewView: React.FC<OperationsOverviewViewProps> = ({
  onNavigateTab,
  onOpenNewRfi,
  onOpenNewBid,
  onOpenNewClient,
}) => {
  return (
    <div className="space-y-6">
      {/* Header & Status Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>OPERATIONS CORE</span>
            <span>/</span>
            <span>EXECUTIVE COCKPIT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Operations Command Center
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Real-time pre-construction throughput, RFI clearance velocity, and estimating pipelines
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => onNavigateTab('projects')}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Open Project Tracking</span>
          </button>
          <button
            onClick={onOpenNewBid}
            className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <span>+ New Takeoff / Proposal</span>
          </button>
        </div>
      </div>

      {/* Top 4 Real-Time Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-[#86948a] uppercase font-semibold">Active Bid Pipeline</span>
            <div className="p-1.5 rounded bg-[#4edea3]/10 text-[#4edea3]">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">$12,450,000</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#4edea3]">
            <span>↑ 14.8% vs last month</span>
            <span className="text-[#86948a]">• 7 Bids in play</span>
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-[#86948a] uppercase font-semibold">Open Pre-Con RFIs</span>
            <div className="p-1.5 rounded bg-[#ff7886]/10 text-[#ffb4ab]">
              <FileQuestion className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#ffb4ab]">14 Pending</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#86948a]">
            <span className="text-[#ff7886] font-semibold">3 Critical Holds</span>
            <span>• 4.2h avg turnaround</span>
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-[#86948a] uppercase font-semibold">Historical Win Rate</span>
            <div className="p-1.5 rounded bg-[#3b82f6]/10 text-[#adc6ff]">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">68.4%</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#adc6ff]">
            <span>Verified 99.2% Takeoff Accuracy</span>
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-mono text-[#86948a] uppercase font-semibold">Staffing Utilization</span>
            <div className="p-1.5 rounded bg-[#9747ff]/10 text-[#d0bcff]">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">100% Deployed</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#86948a]">
            <span>14 Senior & Staff Estimators</span>
          </div>
        </div>
      </div>

      {/* Main Operations Split */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left 8 Cols: Quick Action Hub & Active Projects Pulse */}
        <div className="xl:col-span-8 space-y-6">
          {/* Quick Nav Launchpad */}
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#4edea3]" />
                Direct Module Launchpad
              </h2>
              <span className="text-xs text-[#86948a]">14 Integrated Enterprise Modules</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => onNavigateTab('rfis-bids')}
                className="p-3 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#4edea3]/40 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <FileQuestion className="w-4 h-4 text-[#ff7886]" />
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#4edea3] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="text-xs font-semibold text-white">RFIs & Bids</div>
                <div className="text-[10px] text-[#86948a] mt-0.5">RFI Resolution Matrix</div>
              </button>

              <button
                onClick={() => onNavigateTab('projects')}
                className="p-3 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#4edea3]/40 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Layers className="w-4 h-4 text-[#4edea3]" />
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#4edea3] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="text-xs font-semibold text-white">Project Tracking</div>
                <div className="text-[10px] text-[#86948a] mt-0.5">8 In-Flight Takeoffs</div>
              </button>

              <button
                onClick={() => onNavigateTab('proposals')}
                className="p-3 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#4edea3]/40 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#adc6ff]" />
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#4edea3] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="text-xs font-semibold text-white">Proposals</div>
                <div className="text-[10px] text-[#86948a] mt-0.5">$12.4M Estimates</div>
              </button>

              <button
                onClick={() => onNavigateTab('payroll')}
                className="p-3 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#4edea3]/40 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Users className="w-4 h-4 text-[#d0bcff]" />
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#4edea3] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="text-xs font-semibold text-white">Staff Payroll</div>
                <div className="text-[10px] text-[#86948a] mt-0.5">Next run: Aug 31</div>
              </button>

              <button
                onClick={() => onNavigateTab('clients')}
                className="p-3 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#4edea3]/40 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Building2 className="w-4 h-4 text-[#4edea3]" />
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#4edea3] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="text-xs font-semibold text-white">Clients & GCs</div>
                <div className="text-[10px] text-[#86948a] mt-0.5">Turner, Clark, Skanska</div>
              </button>

              <button
                onClick={() => onNavigateTab('company-reminders')}
                className="p-3 bg-[#131b2e] hover:bg-[#1a253d] border border-[#4edea3]/40 rounded-lg text-left transition-all group cursor-pointer shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <CalendarClock className="w-4 h-4 text-[#4edea3]" />
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-[#f43f5e]/20 text-[#f43f5e] font-bold border border-[#f43f5e]/30">
                    URGENT DUE
                  </span>
                </div>
                <div className="text-xs font-semibold text-white">Company Reminders</div>
                <div className="text-[10px] text-[#4edea3] mt-0.5">Taxes, Client Calls & Filings</div>
              </button>

              <button
                onClick={() => onNavigateTab('invoices')}
                className="p-3 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#4edea3]/40 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <Clock className="w-4 h-4 text-[#e0b44a]" />
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#4edea3] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="text-xs font-semibold text-white">Invoices & AR</div>
                <div className="text-[10px] text-[#86948a] mt-0.5">0 Overdue accounts</div>
              </button>

              <button
                onClick={() => onNavigateTab('cap-table')}
                className="p-3 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#4edea3]/40 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <ShieldCheck className="w-4 h-4 text-[#ffb4ab]" />
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#4edea3] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="text-xs font-semibold text-white">Cap Table</div>
                <div className="text-[10px] text-[#86948a] mt-0.5">Ownership breakdown</div>
              </button>

              <button
                onClick={() => onNavigateTab('audit')}
                className="p-3 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#4edea3]/40 rounded-lg text-left transition-all group cursor-pointer"
              >
                <div className="flex items-center justify-between mb-2">
                  <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
                  <ArrowUpRight className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#4edea3] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
                <div className="text-xs font-semibold text-white">Audit Trail</div>
                <div className="text-[10px] text-[#86948a] mt-0.5">ISO 9001 Compliance</div>
              </button>
            </div>
          </div>

          {/* Active Priorities Feed */}
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#e0b44a]" />
                Operations Radar & Live Alerts
              </h2>
              <span className="font-mono text-xs text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded border border-[#4edea3]/20">
                ALL SYSTEMS NOMINAL
              </span>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 bg-[#131b2e] border border-[#f43f5e]/40 rounded-lg flex items-start justify-between gap-4 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#f43f5e]/20 text-[#f43f5e] border border-[#f43f5e]/30 animate-pulse">
                      COMPLIANCE & CALLS DUE
                    </span>
                    <span className="text-xs font-semibold text-white">Q3 Federal Corporate Tax ($42.5k) & Turner Client Call</span>
                  </div>
                  <p className="text-xs text-[#86948a]">
                    IRS Form 1120-S estimated tax deposit due via EFTPS. Scheduled follow-up call with David Miller (Turner Construction) on BID-8849 ($2.45M).
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('company-reminders')}
                  className="px-3 py-1.5 bg-[#f43f5e]/15 hover:bg-[#f43f5e]/25 text-xs font-mono text-[#f43f5e] font-bold rounded border border-[#f43f5e]/40 shrink-0 cursor-pointer"
                >
                  Manage Reminders →
                </button>
              </div>

              <div className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded-lg flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ff7886]/15 text-[#ffb4ab] border border-[#ff7886]/30">
                      RFI HOLD POINT
                    </span>
                    <span className="text-xs font-semibold text-white">RFI-104: Grade Variance on ASTM A992</span>
                  </div>
                  <p className="text-xs text-[#86948a]">
                    Harbor Logistics Warehouse bid delivery delayed until Balfour Beatty architect confirms structural steel spec.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('rfis-bids')}
                  className="px-3 py-1.5 bg-[#171f33] hover:bg-[#222a3d] text-xs font-mono text-[#dae2fd] rounded border border-[#2d3449] shrink-0"
                >
                  View Matrix →
                </button>
              </div>

              <div className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded-lg flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30">
                      TAKEOFF MILESTONE
                    </span>
                    <span className="text-xs font-semibold text-white">Metro Heights Tower: Structural Concrete 100% Cleared</span>
                  </div>
                  <p className="text-xs text-[#86948a]">
                    Lead Estimator Marcus Vance completed dual-model audit. Scope value $1,420,000 ready for submission.
                  </p>
                </div>
                <button
                  onClick={() => onNavigateTab('projects')}
                  className="px-3 py-1.5 bg-[#171f33] hover:bg-[#222a3d] text-xs font-mono text-[#dae2fd] rounded border border-[#2d3449] shrink-0"
                >
                  Inspect →
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Company Snapshot & Quick Stats */}
        <div className="xl:col-span-4 space-y-6">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
            <h3 className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold mb-3">
              Corporate Snapshot
            </h3>
            <div className="space-y-3 font-mono text-xs">
              <div className="flex justify-between py-2 border-b border-[#222a3d]">
                <span className="text-[#86948a]">Legal Entity:</span>
                <span className="text-white font-semibold">Bid Exact LLC (Delaware)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#222a3d]">
                <span className="text-[#86948a]">Active GCs:</span>
                <span className="text-[#4edea3] font-semibold">6 Partner GCs</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#222a3d]">
                <span className="text-[#86948a]">Audited Accuracy:</span>
                <span className="text-white font-semibold">99.2% (ISO 9001)</span>
              </div>
              <div className="flex justify-between py-2 border-b border-[#222a3d]">
                <span className="text-[#86948a]">Active Estimators:</span>
                <span className="text-white font-semibold">14 Headcount</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-[#86948a]">Fiscal Quarter:</span>
                <span className="text-[#4edea3] font-semibold">Q3 2024 (In Progress)</span>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-[#222a3d] space-y-2">
              <button
                onClick={() => onNavigateTab('finance')}
                className="w-full h-9 px-3 bg-[#171f33] hover:bg-[#222a3d] text-xs font-medium text-[#dae2fd] rounded border border-[#2d3449] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <span>View Company Financial GL</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onNavigateTab('audit')}
                className="w-full h-9 px-3 bg-transparent hover:bg-[#171f33] text-xs font-medium text-[#86948a] hover:text-[#dae2fd] rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3]" />
                <span>Security & Audit Logs</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
