import React, { useState } from 'react';
import {
  Building2,
  Users,
  Briefcase,
  TrendingUp,
  Search,
  Plus,
  ArrowUpRight,
  ExternalLink,
  ShieldCheck,
  Mail,
  Phone
} from 'lucide-react';
import { ClientItem } from '../../types';

interface ClientsAccountsViewProps {
  clients: ClientItem[];
  onSelectClient: (client: ClientItem) => void;
  onOpenNewClient: () => void;
}

export const ClientsAccountsView: React.FC<ClientsAccountsViewProps> = ({
  clients,
  onSelectClient,
  onOpenNewClient,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.agreementTier.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalLifetimeVolume = clients.reduce((sum, c) => sum + c.lifetimeValue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>COMMERCIAL ACCOUNTS</span>
            <span>/</span>
            <span>GENERAL CONTRACTORS & DEVELOPERS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Clients & General Contractor Accounts
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Enterprise Tier-1 General Contractors, Master Service Agreements (MSAs), and bid win rates
          </p>
        </div>

        <button
          onClick={onOpenNewClient}
          className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
          <span>Add Client Account</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Active Tier-1 GC Accounts
          </div>
          <div className="text-2xl font-bold font-mono text-white">{clients.length} Accounts</div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            100% active MSAs executed
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Combined Bid Pipeline
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            ${(totalLifetimeVolume / 1000000).toFixed(2)}M
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Across active proposals
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Average Win Ratio
          </div>
          <div className="text-2xl font-bold font-mono text-white">68.4%</div>
          <div className="text-[11px] text-[#adc6ff] mt-2">
            Top Performer: Turner Construction (78%)
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Payment Terms Compliance
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">100% Net 30</div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Average settlement: 24.2 days
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#86948a] absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search GC name or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
          />
        </div>
      </div>

      {/* Clients Bento Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((client) => (
          <div
            key={client.id}
            className="bg-[#131b2e] border border-[#222a3d] hover:border-[#4edea3]/40 rounded-lg p-5 transition-all space-y-4"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
                  {client.agreementTier}
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5">{client.name}</h3>
                <p className="text-xs text-[#86948a]">{client.division} • Account: {client.id}</p>
              </div>
              <button
                onClick={() => onSelectClient(client)}
                className="p-2 rounded bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] border border-[#2d3449] transition-colors cursor-pointer"
                title="View Full Client Ledger"
              >
                <ArrowUpRight className="w-4 h-4 text-[#4edea3]" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 p-3 bg-[#0b1326] rounded border border-[#222a3d] text-center font-mono">
              <div>
                <div className="text-[10px] text-[#86948a] uppercase">Active Projects</div>
                <div className="text-sm font-bold text-white">{client.activeProjectsCount}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#86948a] uppercase">Paid Retention</div>
                <div className="text-sm font-bold text-[#4edea3]">{client.paidPercent}%</div>
              </div>
              <div>
                <div className="text-[10px] text-[#86948a] uppercase">Total Volume</div>
                <div className="text-sm font-bold text-white">
                  ${(client.lifetimeValue / 1000000).toFixed(1)}M
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#222a3d] flex items-center justify-between text-xs text-[#bbcabf]">
              <div>
                <span className="text-[#86948a]">Key Contact: </span>
                <span className="text-white font-medium">{client.contact.name}</span>
                <span className="text-[#86948a]"> ({client.contact.title})</span>
              </div>
              <button
                onClick={() => onSelectClient(client)}
                className="text-xs font-mono text-[#4edea3] hover:underline cursor-pointer"
              >
                Inspect Details →
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
