import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Phone,
  Mail,
  DollarSign,
  FileCheck,
  TrendingUp,
  Clock,
  Layers,
  FileQuestion,
  Receipt,
  FileText,
  ShieldCheck,
  Download,
  Plus,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  UserCheck
} from 'lucide-react';
import { ClientItem, RfiItem, BidItem } from '../../types';

interface CompanyDetailViewProps {
  client: ClientItem;
  rfis: RfiItem[];
  bids: BidItem[];
  onBack: () => void;
  onOpenNewRfi: () => void;
  onOpenNewBid: () => void;
  onSelectRfi?: (rfi: RfiItem) => void;
  onSelectBid?: (bid: BidItem) => void;
}

export const CompanyDetailView: React.FC<CompanyDetailViewProps> = ({
  client,
  rfis,
  bids,
  onBack,
  onOpenNewRfi,
  onOpenNewBid,
  onSelectRfi,
  onSelectBid,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'projects' | 'rfis' | 'invoices' | 'contracts'>('overview');

  // Filter RFIs and Bids relevant to this specific client
  const clientBids = bids.filter((b) =>
    b.client.toLowerCase().includes(client.name.toLowerCase()) ||
    client.name.toLowerCase().includes(b.client.toLowerCase())
  );

  const clientRfis = rfis.filter((r) =>
    r.client.toLowerCase().includes(client.name.toLowerCase()) ||
    client.name.toLowerCase().includes(r.client.toLowerCase())
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Isolated Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#222a3d]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="h-9 px-3 bg-[#131b2e] hover:bg-[#171f33] text-[#dae2fd] border border-[#2d3449] rounded-md text-xs font-mono font-medium flex items-center gap-1.5 transition-all cursor-pointer shadow-sm group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#4edea3] group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to All Accounts</span>
          </button>

          <div className="h-4 w-px bg-[#222a3d] hidden sm:block" />

          <div className="flex items-center gap-2 font-mono text-[11px] text-[#86948a]">
            <span>ISOLATED COMPANY VIEW</span>
            <span>/</span>
            <span className="text-[#4edea3] font-semibold">{client.name}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(client, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", `${client.name.replace(/[^a-zA-Z0-9]/g, '_')}_dossier.json`);
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="h-8 px-3 bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] border border-[#2d3449] rounded text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#86948a]" />
            <span>Export Company Profile</span>
          </button>
        </div>
      </div>

      {/* Main Company Header Card */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Company Identity */}
          <div className="flex items-start gap-4">
            <div className="w-16 h-16 rounded-xl bg-[#0b1326] border border-[#2d3449] flex items-center justify-center font-mono text-2xl font-bold text-[#4edea3] shrink-0 shadow-inner">
              {client.initials}
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  {client.name}
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 uppercase font-bold tracking-wider">
                  {client.agreementTier}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3b82f6]/10 text-[#adc6ff] border border-[#3b82f6]/30 uppercase font-semibold">
                  Net 30 Verified
                </span>
              </div>
              <p className="text-xs sm:text-sm text-[#86948a]">
                {client.division} • Account ID: {client.id} • Standing: Pristine
              </p>
            </div>
          </div>

          {/* Quick Contact Box */}
          <div className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded-lg flex items-center justify-between gap-6 min-w-[280px]">
            <div>
              <div className="text-[10px] font-mono uppercase text-[#86948a] font-semibold">
                Lead Pre-Con Contact
              </div>
              <div className="text-sm font-bold text-white mt-0.5">
                {client.contact.name}
              </div>
              <div className="text-xs text-[#bbcabf]">
                {client.contact.title}
              </div>
            </div>

            <div className="flex items-center gap-2">
              {client.contact.phone && (
                <a
                  href={`tel:${client.contact.phone}`}
                  className="p-2 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] text-[#4edea3] flex items-center justify-center transition-colors"
                  title={`Call ${client.contact.phone}`}
                >
                  <Phone className="w-4 h-4" />
                </a>
              )}
              {client.contact.email && (
                <a
                  href={`mailto:${client.contact.email}`}
                  className="p-2 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] text-[#adc6ff] flex items-center justify-center transition-colors"
                  title={`Email ${client.contact.email}`}
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* 4 Financial & Project Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-[#222a3d]">
          <div className="bg-[#0b1326] p-3.5 rounded-lg border border-[#222a3d]">
            <div className="text-[10px] font-mono uppercase text-[#86948a] font-semibold">
              Lifetime Contract Value
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {formatCurrency(client.lifetimeValue)}
            </div>
            <div className="text-[11px] text-[#4edea3] mt-1 font-mono">
              Total Invoiced: ${Math.round(client.invoicedAmount / 1000)}k
            </div>
          </div>

          <div className="bg-[#0b1326] p-3.5 rounded-lg border border-[#222a3d]">
            <div className="text-[10px] font-mono uppercase text-[#86948a] font-semibold">
              Paid vs Retention Rate
            </div>
            <div className="text-xl font-bold font-mono text-[#4edea3] mt-1">
              {client.paidPercent}% Collected
            </div>
            <div className="text-[11px] text-[#86948a] mt-1 font-mono">
              ${Math.round(client.paidAmount / 1000)}k Cleared
            </div>
          </div>

          <div className="bg-[#0b1326] p-3.5 rounded-lg border border-[#222a3d]">
            <div className="text-[10px] font-mono uppercase text-[#86948a] font-semibold">
              Active Takeoff Packages
            </div>
            <div className="text-xl font-bold font-mono text-white mt-1">
              {client.activeProjectsLabel}
            </div>
            <div className="text-[11px] text-[#adc6ff] mt-1 font-mono">
              {clientBids.length} in pipeline
            </div>
          </div>

          <div className="bg-[#0b1326] p-3.5 rounded-lg border border-[#222a3d]">
            <div className="text-[10px] font-mono uppercase text-[#86948a] font-semibold">
              Pre-Con RFIs
            </div>
            <div className="text-xl font-bold font-mono text-[#ffb4ab] mt-1">
              {clientRfis.length} Tracked
            </div>
            <div className="text-[11px] text-[#86948a] mt-1 font-mono">
              Avg turnaround: 3.8 hrs
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs for This Company */}
      <div className="flex items-center gap-2 border-b border-[#222a3d] pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSection('overview')}
          className={`px-3.5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
            activeSection === 'overview'
              ? 'bg-[#171f33] text-white font-bold border-b-2 border-[#4edea3]'
              : 'text-[#86948a] hover:text-white'
          }`}
        >
          Company Overview
        </button>

        <button
          onClick={() => setActiveSection('projects')}
          className={`px-3.5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
            activeSection === 'projects'
              ? 'bg-[#171f33] text-white font-bold border-b-2 border-[#4edea3]'
              : 'text-[#86948a] hover:text-white'
          }`}
        >
          Projects & Bids ({clientBids.length})
        </button>

        <button
          onClick={() => setActiveSection('rfis')}
          className={`px-3.5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
            activeSection === 'rfis'
              ? 'bg-[#171f33] text-white font-bold border-b-2 border-[#4edea3]'
              : 'text-[#86948a] hover:text-white'
          }`}
        >
          Active RFIs ({clientRfis.length})
        </button>

        <button
          onClick={() => setActiveSection('invoices')}
          className={`px-3.5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
            activeSection === 'invoices'
              ? 'bg-[#171f33] text-white font-bold border-b-2 border-[#4edea3]'
              : 'text-[#86948a] hover:text-white'
          }`}
        >
          Billing & Invoices
        </button>

        <button
          onClick={() => setActiveSection('contracts')}
          className={`px-3.5 py-1.5 rounded text-xs font-mono transition-colors cursor-pointer ${
            activeSection === 'contracts'
              ? 'bg-[#171f33] text-white font-bold border-b-2 border-[#4edea3]'
              : 'text-[#86948a] hover:text-white'
          }`}
        >
          Contracts & Compliance (MSA)
        </button>
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeSection === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Account Profile & Direct Engagements */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono mb-4 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#4edea3]" />
                Account Profile & Relationship Highlights
              </h2>
              <div className="space-y-3 text-xs text-[#dae2fd] leading-relaxed">
                <p>
                  <strong>{client.name}</strong> is an enterprise Tier-1 partner operating under an executed Master Service Agreement (MSA). Bid Exact LLC delivers comprehensive quantity takeoff modeling, CSI division budget estimates, and real-time clash resolution for their regional commercial pre-construction teams.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="p-3 bg-[#0b1326] rounded border border-[#222a3d]">
                    <span className="text-[10px] font-mono text-[#86948a] block">MSA Term Period</span>
                    <span className="font-semibold text-white">Jan 2024 – Dec 2026 (Active)</span>
                  </div>
                  <div className="p-3 bg-[#0b1326] rounded border border-[#222a3d]">
                    <span className="text-[10px] font-mono text-[#86948a] block">Standard Payment Terms</span>
                    <span className="font-semibold text-[#4edea3]">Net 30 Days (Direct ACH)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* In-Flight Bids Snapshot */}
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#4edea3]" />
                  Active Bidding Packages with {client.name}
                </h2>
                <button
                  onClick={onOpenNewBid}
                  className="text-xs font-mono text-[#4edea3] hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Proposal</span>
                </button>
              </div>

              {clientBids.length > 0 ? (
                <div className="space-y-3">
                  {clientBids.map((bid) => (
                    <div
                      key={bid.id}
                      onClick={() => onSelectBid && onSelectBid(bid)}
                      className="p-3.5 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] rounded-lg transition-colors cursor-pointer flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-white text-xs">{bid.title}</div>
                        <div className="text-[11px] font-mono text-[#86948a] mt-0.5">
                          Package #{bid.id} • Due {bid.dueDate}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold font-mono text-white text-xs">
                          ${bid.amount.toLocaleString()}
                        </div>
                        <span className="inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
                          {bid.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-[#86948a] bg-[#0b1326] rounded-lg border border-[#222a3d]">
                  No bids currently in progress with this client. Click &quot;New Proposal&quot; to draft an estimate package.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Account Team & Quick Actions */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
              <h3 className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold mb-3">
                Assigned Internal Team
              </h3>
              <div className="space-y-3 font-mono text-xs">
                <div className="flex items-center gap-3 p-2 rounded bg-[#0b1326] border border-[#222a3d]">
                  <div className="w-7 h-7 rounded-full bg-[#171f33] text-[#4edea3] flex items-center justify-center font-bold text-[10px]">
                    MV
                  </div>
                  <div>
                    <div className="text-white font-semibold font-sans">Marcus Vance</div>
                    <div className="text-[10px] text-[#86948a]">Lead Pre-Con Estimator</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2 rounded bg-[#0b1326] border border-[#222a3d]">
                  <div className="w-7 h-7 rounded-full bg-[#171f33] text-[#adc6ff] flex items-center justify-center font-bold text-[10px]">
                    ER
                  </div>
                  <div>
                    <div className="text-white font-semibold font-sans">Elena Rostova</div>
                    <div className="text-[10px] text-[#86948a]">VDC / 3D BIM Specialist</div>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#222a3d] space-y-2">
                <button
                  onClick={onOpenNewRfi}
                  className="w-full h-8 px-3 bg-[#171f33] hover:bg-[#222a3d] text-xs font-mono text-[#dae2fd] rounded border border-[#2d3449] flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#ff7886]" />
                  <span>Submit Pre-Con RFI</span>
                </button>
                <button
                  onClick={onOpenNewBid}
                  className="w-full h-8 px-3 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] text-xs font-bold rounded flex items-center justify-center gap-2 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Draft New Takeoff</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROJECTS & BIDS */}
      {activeSection === 'projects' && (
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#222a3d] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase font-mono">
              Bidding & Takeoff Packages for {client.name}
            </h3>
            <button
              onClick={onOpenNewBid}
              className="px-3 py-1.5 bg-[#4edea3] text-[#003824] rounded text-xs font-semibold cursor-pointer"
            >
              + Create Takeoff
            </button>
          </div>

          <div className="p-4">
            {clientBids.length > 0 ? (
              <div className="space-y-3">
                {clientBids.map((b) => (
                  <div
                    key={b.id}
                    onClick={() => onSelectBid && onSelectBid(b)}
                    className="p-4 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] rounded-lg transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="text-sm font-bold text-white">{b.title}</div>
                      <div className="text-xs text-[#86948a] font-mono mt-0.5">
                        Package: {b.id} • Due: {b.dueDate} • Lead: {b.estimator || 'Marcus Vance'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-base font-bold font-mono text-[#4edea3]">
                        ${b.amount.toLocaleString()}
                      </div>
                      <div className="text-xs text-[#bbcabf] mt-1">{b.status}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#86948a]">
                No active bids assigned to this specific company.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ACTIVE RFIS */}
      {activeSection === 'rfis' && (
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
          <div className="p-4 border-b border-[#222a3d] flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase font-mono">
              Pre-Con RFIs for {client.name}
            </h3>
            <button
              onClick={onOpenNewRfi}
              className="px-3 py-1.5 bg-[#171f33] text-white border border-[#2d3449] rounded text-xs font-mono cursor-pointer"
            >
              + New RFI
            </button>
          </div>

          <div className="p-4">
            {clientRfis.length > 0 ? (
              <div className="space-y-3">
                {clientRfis.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => onSelectRfi && onSelectRfi(r)}
                    className="p-4 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] rounded-lg transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-semibold text-[#ffb4ab]">{r.id}</span>
                        <span className="text-xs font-semibold text-white">{r.title}</span>
                      </div>
                      <div className="text-[11px] text-[#86948a] mt-1 font-mono">
                        Project: {r.project} • Priority: {r.priority}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20 self-start sm:self-auto">
                      {r.statusLabel}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-xs text-[#86948a]">
                All RFIs for {client.name} are fully cleared. No outstanding inquiries.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: BILLING & INVOICES */}
      {activeSection === 'invoices' && (
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-mono">
            Accounts Receivable Ledger for {client.name}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 bg-[#0b1326] rounded border border-[#222a3d]">
              <span className="text-[#86948a] block text-[10px] uppercase">Total Invoiced</span>
              <span className="text-lg font-bold text-white">${(client.invoicedAmount / 1000).toFixed(0)}k</span>
            </div>
            <div className="p-3 bg-[#0b1326] rounded border border-[#222a3d]">
              <span className="text-[#86948a] block text-[10px] uppercase">Cleared & Settled</span>
              <span className="text-lg font-bold text-[#4edea3]">${(client.paidAmount / 1000).toFixed(0)}k</span>
            </div>
            <div className="p-3 bg-[#0b1326] rounded border border-[#222a3d]">
              <span className="text-[#86948a] block text-[10px] uppercase">Current Overdue</span>
              <span className="text-lg font-bold text-[#4edea3]">$0.00</span>
            </div>
          </div>
          <p className="text-xs text-[#86948a]">
            All invoices issued under MSA terms Net 30. Payment track record: 100% timely settlement.
          </p>
        </div>
      )}

      {/* TAB 5: CONTRACTS & COMPLIANCE */}
      {activeSection === 'contracts' && (
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase font-mono">
            Legal & Compliance Documents
          </h3>
          <div className="space-y-3 text-xs font-mono">
            <div className="p-3 bg-[#0b1326] rounded border border-[#222a3d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#4edea3]" />
                <span className="text-white font-sans font-medium">Master Service Agreement (MSA) - Executed</span>
              </div>
              <span className="text-[10px] text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded border border-[#4edea3]/20">
                ACTIVE
              </span>
            </div>

            <div className="p-3 bg-[#0b1326] rounded border border-[#222a3d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
                <span className="text-white font-sans font-medium">Commercial Insurance & $5M E&O Endorsement</span>
              </div>
              <span className="text-[10px] text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded border border-[#4edea3]/20">
                VALID 2025
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
