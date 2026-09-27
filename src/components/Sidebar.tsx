import React from 'react';
import {
  LayoutDashboard,
  Landmark,
  Layers,
  Users,
  Briefcase,
  Clock,
  Building2,
  FileQuestion,
  FileSpreadsheet,
  Receipt,
  MessageSquare,
  FileCheck2,
  PieChart,
  ShieldCheck,
  ArrowUpRight,
  Lock,
  Boxes,
  X,
  ArrowDownUp,
  CreditCard,
  PiggyBank,
  ShieldAlert,
  UserCheck,
  Zap,
  Workflow,
  Percent,
  CalendarClock
} from 'lucide-react';

export type NavTabId =
  | 'overview'
  | 'company-reminders'
  | 'workflow-automation'
  | 'client-portal'
  | 'inflow-outflow'
  | 'finance'
  | 'connected-banks'
  | 'projects'
  | 'hr-directory'
  | 'payroll'
  | 'commission-settings'
  | 'loans'
  | 'partners'
  | 'emergency-fund'
  | 'contractors'
  | 'time'
  | 'clients'
  | 'rfis-bids'
  | 'proposals'
  | 'invoices'
  | 'messages'
  | 'documents'
  | 'cap-table'
  | 'audit'
  | 'employee-portal';

interface SidebarProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
  openRfiCount: number;
  urgentReminderCount?: number;
  onSwitchWorkspace?: (ws: 'personal-finance' | 'pre-con-estimating') => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  openRfiCount,
  urgentReminderCount = 0,
  onSwitchWorkspace,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const handleNav = (tab: NavTabId) => {
    onSelectTab(tab);
    onCloseMobile?.();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0b1326] border-r border-[#222a3d] select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#222a3d] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-[#4edea3]/10 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] shadow-[0_0_12px_rgba(78,222,163,0.15)]">
            <Boxes className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
              Bid Exact LLC
            </div>
            <div className="text-[10px] font-mono tracking-widest text-[#4edea3] uppercase font-semibold">
              Estimating Tech
            </div>
          </div>
        </div>

        {/* Mobile Close Button */}
        {onCloseMobile && (
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 text-[#86948a] hover:text-white rounded-md hover:bg-[#131b2e] transition-colors"
            aria-label="Close navigation"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Context Card */}
      <div className="p-3 border-b border-[#222a3d]/80">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-md p-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-mono tracking-wider text-[#86948a] uppercase font-semibold">
              Context
            </span>
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 rounded bg-[#4edea3]/10 border border-[#4edea3]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-pulse" />
              <span className="text-[9px] font-mono font-bold text-[#4edea3]">LIVE</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-[#dae2fd]">Bid Exact LLC</div>
          <div className="text-[11px] text-[#86948a] mb-2">Active Enterprise Workspace</div>
          <button
            onClick={() => {
              onCloseMobile?.();
              if (onSwitchWorkspace) {
                onSwitchWorkspace('personal-finance');
              } else {
                onSelectTab('finance');
              }
            }}
            className="w-full flex items-center justify-between text-[11px] text-[#86948a] hover:text-[#4edea3] transition-colors group cursor-pointer pt-1 border-t border-[#222a3d]"
          >
            <span className="flex items-center gap-1">
              Switch to Personal Hub
            </span>
            <ArrowUpRight className="w-3 h-3 text-[#86948a] group-hover:text-[#4edea3] transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </button>
        </div>
      </div>

      {/* Navigation Links Scrollable */}
      <nav className="flex-1 overflow-y-auto px-2.5 py-3 space-y-4">
        {/* WORKSPACE & CASH FLOW */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-mono tracking-wider text-[#86948a] uppercase font-semibold">
            Core & Cash Flow
          </div>
          <div className="space-y-0.5">
            <button
              id="nav-overview"
              onClick={() => handleNav('overview')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-3.5 h-3.5 ${activeTab === 'overview' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Overview / Operations</span>
              </div>
            </button>

            <button
              id="nav-company-reminders"
              onClick={() => handleNav('company-reminders')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'company-reminders'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CalendarClock className={`w-3.5 h-3.5 ${activeTab === 'company-reminders' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span className="font-semibold">Company Reminders</span>
              </div>
              {urgentReminderCount > 0 ? (
                <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#f43f5e]/20 text-[#f43f5e] rounded font-bold border border-[#f43f5e]/30 animate-pulse">
                  {urgentReminderCount} DUE
                </span>
              ) : (
                <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#4edea3]/15 text-[#4edea3] rounded font-bold">
                  TAX & CALLS
                </span>
              )}
            </button>

            <button
              id="nav-workflow-automation"
              onClick={() => handleNav('workflow-automation')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'workflow-automation'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Zap className={`w-3.5 h-3.5 ${activeTab === 'workflow-automation' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span className="font-semibold">Workflow Automation</span>
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#4edea3]/20 text-[#4edea3] rounded font-bold border border-[#4edea3]/30">
                E2E AUTO
              </span>
            </button>

            <button
              id="nav-inflow-outflow"
              onClick={() => handleNav('inflow-outflow')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'inflow-outflow'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ArrowDownUp className={`w-3.5 h-3.5 ${activeTab === 'inflow-outflow' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Inflow & Outflow</span>
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#4edea3]/15 text-[#4edea3] rounded font-bold">
                Treasury
              </span>
            </button>

            <button
              id="nav-finance"
              onClick={() => handleNav('finance')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'finance'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Landmark className={`w-3.5 h-3.5 ${activeTab === 'finance' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Company Finance & GL</span>
              </div>
            </button>

            <button
              id="sidebar-nav-projects"
              onClick={() => handleNav('projects')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'projects'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Layers className={`w-3.5 h-3.5 ${activeTab === 'projects' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Project Tracking</span>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#4edea3]/15 text-[#4edea3] rounded font-bold">
                8
              </span>
            </button>
          </div>
        </div>

        {/* PEOPLE & HR */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-mono tracking-wider text-[#86948a] uppercase font-semibold">
            People & HR
          </div>
          <div className="space-y-0.5">
            <button
              id="nav-hr-directory"
              onClick={() => handleNav('hr-directory')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'hr-directory'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-3.5 h-3.5 ${activeTab === 'hr-directory' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Employee Management</span>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#2d3449] text-[#dae2fd] rounded">
                14
              </span>
            </button>
            <button
              id="nav-employee-portal"
              onClick={() => handleNav('employee-portal')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'employee-portal'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5"><UserCheck className={`w-3.5 h-3.5 ${activeTab === 'employee-portal' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} /><span>Employee Portal</span></div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#4edea3]/15 text-[#4edea3] rounded font-bold">NEW</span>
            </button>

            <button
              id="nav-payroll"
              onClick={() => handleNav('payroll')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'payroll'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className={`w-3.5 h-3.5 ${activeTab === 'payroll' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Salary & Payroll</span>
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#4edea3]/15 text-[#4edea3] rounded font-bold">
                ACH
              </span>
            </button>

            <button
              id="nav-commission-settings"
              onClick={() => handleNav('commission-settings')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'commission-settings'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Percent className={`w-3.5 h-3.5 ${activeTab === 'commission-settings' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Commission Settings</span>
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#38bdf8]/15 text-[#38bdf8] rounded font-bold">
                RULES
              </span>
            </button>

            <button
              id="nav-contractors"
              onClick={() => handleNav('contractors')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'contractors'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Briefcase className={`w-3.5 h-3.5 ${activeTab === 'contractors' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Contractors & 1099s</span>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#2d3449] text-[#dae2fd] rounded">
                6
              </span>
            </button>

            <button
              id="nav-time"
              onClick={() => handleNav('time')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'time'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Clock className={`w-3.5 h-3.5 ${activeTab === 'time' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Time & Attendance</span>
              </div>
            </button>
          </div>
        </div>

        {/* DEBT, PARTNERS & RESERVES */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-mono tracking-wider text-[#86948a] uppercase font-semibold">
            Debt, Partners & Reserves
          </div>
          <div className="space-y-0.5">
            <button
              id="nav-loans"
              onClick={() => handleNav('loans')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'loans'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <CreditCard className={`w-3.5 h-3.5 ${activeTab === 'loans' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Loan Management</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#2d3449] text-[#dae2fd] rounded">
                  2
                </span>
              </div>
            </button>

            <button
              id="nav-partners"
              onClick={() => handleNav('partners')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'partners'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PieChart className={`w-3.5 h-3.5 ${activeTab === 'partners' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Partner Payouts</span>
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#4edea3]/15 text-[#4edea3] rounded font-bold">
                K-1
              </span>
            </button>

            <button
              id="nav-connected-banks"
              onClick={() => handleNav('connected-banks')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'connected-banks'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Landmark className={`w-3.5 h-3.5 ${activeTab === 'connected-banks' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Wise, Payoneer &amp; Mercury</span>
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#4edea3]/20 text-[#4edea3] rounded font-bold border border-[#4edea3]/30">
                LIVE
              </span>
            </button>

            <button
              id="nav-emergency-fund"
              onClick={() => handleNav('emergency-fund')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'emergency-fund'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <PiggyBank className={`w-3.5 h-3.5 ${activeTab === 'emergency-fund' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Emergency Fund</span>
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#4edea3]/15 text-[#4edea3] rounded font-bold">
                6 Mo
              </span>
            </button>

            <button
              id="nav-cap-table"
              onClick={() => handleNav('cap-table')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'cap-table'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className={`w-3.5 h-3.5 ${activeTab === 'cap-table' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Ownership & Cap Table</span>
              </div>
            </button>
          </div>
        </div>

        {/* CLIENT & SALES */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-mono tracking-wider text-[#86948a] uppercase font-semibold">
            Client & Sales
          </div>
          <div className="space-y-0.5">
            <button
              id="nav-client-portal"
              onClick={() => handleNav('client-portal')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'client-portal'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#38bdf8]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === 'client-portal' ? 'text-[#38bdf8]' : 'text-[#86948a]'}`} />
                <span>Client Portal (External)</span>
              </div>
              <span className="font-mono text-[9px] px-1.5 py-0.5 bg-[#38bdf8]/20 text-[#38bdf8] rounded font-bold border border-[#38bdf8]/30">
                GATEWAY
              </span>
            </button>

            <button
              id="nav-clients"
              onClick={() => handleNav('clients')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'clients'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Building2 className={`w-3.5 h-3.5 ${activeTab === 'clients' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Clients & Accounts</span>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#2d3449] text-[#dae2fd] rounded">
                4
              </span>
            </button>

            {/* ACTIVE HERO SCREEN: RFIs & Bids */}
            <button
              id="nav-rfis-and-bids"
              onClick={() => handleNav('rfis-bids')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'rfis-bids'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileQuestion className={`w-3.5 h-3.5 ${activeTab === 'rfis-bids' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>RFIs & Bids</span>
              </div>
              {openRfiCount > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded-sm bg-[#4edea3]/20 text-[#4edea3] font-bold">
                  {openRfiCount}
                </span>
              )}
            </button>

            <button
              id="nav-proposals"
              onClick={() => handleNav('proposals')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'proposals'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileSpreadsheet className={`w-3.5 h-3.5 ${activeTab === 'proposals' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Proposals & Estimates</span>
              </div>
              <span className="font-mono text-[10px] px-1.5 py-0.5 bg-[#2d3449] text-[#dae2fd] rounded">
                $12.4M
              </span>
            </button>

            <button
              id="nav-invoices"
              onClick={() => handleNav('invoices')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'invoices'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Receipt className={`w-3.5 h-3.5 ${activeTab === 'invoices' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Invoices & AR</span>
              </div>
            </button>
          </div>
        </div>

        {/* COLLABORATION */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-mono tracking-wider text-[#86948a] uppercase font-semibold">
            Collaboration
          </div>
          <div className="space-y-0.5">
            <button
              id="nav-messages"
              onClick={() => handleNav('messages')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'messages'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MessageSquare className={`w-3.5 h-3.5 ${activeTab === 'messages' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Messages & Channels</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
            </button>

            <button
              id="nav-documents"
              onClick={() => handleNav('documents')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'documents'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileCheck2 className={`w-3.5 h-3.5 ${activeTab === 'documents' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Documents & Contracts</span>
              </div>
            </button>
          </div>
        </div>

        {/* GOVERNANCE */}
        <div>
          <div className="px-2 pb-1.5 text-[10px] font-mono tracking-wider text-[#86948a] uppercase font-semibold">
            Governance & Audit
          </div>
          <div className="space-y-0.5">
            <button
              id="nav-audit"
              onClick={() => handleNav('audit')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-[#171f33] text-white font-medium border-l-2 border-[#4edea3]'
                  : 'text-[#bbcabf] hover:bg-[#131b2e] hover:text-[#dae2fd]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShieldCheck className={`w-3.5 h-3.5 ${activeTab === 'audit' ? 'text-[#4edea3]' : 'text-[#86948a]'}`} />
                <span>Audit Trail &amp; API Keys</span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      {/* Footer Status Pill */}
      <div className="p-3 border-t border-[#222a3d] bg-[#0b1326]">
        <div className="flex items-center justify-between px-2.5 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-[10px] font-mono text-[#86948a]">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
            <span className="tracking-wider uppercase font-semibold text-[#bbcabf]">
              Isolated Books & Ops
            </span>
          </div>
          <Lock className="w-3 h-3 text-[#86948a]" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        id="app-sidebar"
        className="hidden lg:flex w-64 bg-[#0b1326] flex-col shrink-0 min-h-screen select-none"
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
