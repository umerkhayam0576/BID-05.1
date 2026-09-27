import React, { useState } from 'react';
import {
  Building2,
  ChevronDown,
  Phone,
  Mail,
  ExternalLink,
} from 'lucide-react';
import { ClientItem } from '../types';

interface EnterpriseClientsGridProps {
  clients: ClientItem[];
  onSelectClient: (client: ClientItem) => void;
}

export const EnterpriseClientsGrid: React.FC<EnterpriseClientsGridProps> = ({
  clients,
  onSelectClient,
}) => {
  const [sortBy, setSortBy] = useState<'value' | 'projects' | 'name'>('value');
  const [showSortMenu, setShowSortMenu] = useState(false);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const sortedClients = [...clients].sort((a, b) => {
    if (sortBy === 'value') return b.lifetimeValue - a.lifetimeValue;
    if (sortBy === 'projects') return b.activeProjectsCount - a.activeProjectsCount;
    return a.name.localeCompare(b.name);
  });

  const getTierBadge = (tier: string) => {
    if (tier.includes('MASTER AGREEMENT')) {
      return (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 uppercase font-bold tracking-wider">
          MASTER AGREEMENT
        </span>
      );
    }
    if (tier.includes('STRATEGIC PARTNER')) {
      return (
        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#3b82f6]/10 text-[#adc6ff] border border-[#3b82f6]/30 uppercase font-bold tracking-wider">
          STRATEGIC PARTNER
        </span>
      );
    }
    return (
      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#222a3d] text-[#dae2fd] border border-[#334155] uppercase font-semibold tracking-wider">
        {tier}
      </span>
    );
  };

  return (
    <div className="space-y-3">
      {/* Header with Sort Dropdown */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#86948a] font-bold">
              Account Directory
            </span>
            <span className="text-[#86948a] text-xs">•</span>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#bbcabf]">
              Tier 1 Relationships
            </span>
          </div>
          <h2 className="text-lg font-bold text-[#dae2fd] tracking-tight">
            Enterprise Client Portfolio
          </h2>
          <p className="text-xs text-[#86948a]">
            Primary General Contractor accounts with running contract values, active packages, and lead PMs
          </p>
        </div>

        {/* Sort Filter Dropdown */}
        <div className="relative self-start sm:self-auto">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="h-8 px-2.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span className="text-[#86948a]">Sort by:</span>
            <span>
              {sortBy === 'value'
                ? 'Contract Value'
                : sortBy === 'projects'
                ? 'Active Projects'
                : 'Client Name'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#86948a]" />
          </button>

          {showSortMenu && (
            <div className="absolute right-0 mt-1 w-44 bg-[#171f33] border border-[#2d3449] rounded-md shadow-2xl py-1 z-20">
              <button
                onClick={() => {
                  setSortBy('value');
                  setShowSortMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-xs font-mono text-[#dae2fd] hover:bg-[#222a3d]"
              >
                Contract Value
              </button>
              <button
                onClick={() => {
                  setSortBy('projects');
                  setShowSortMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-xs font-mono text-[#dae2fd] hover:bg-[#222a3d]"
              >
                Active Projects
              </button>
              <button
                onClick={() => {
                  setSortBy('name');
                  setShowSortMenu(false);
                }}
                className="w-full px-3 py-1.5 text-left text-xs font-mono text-[#dae2fd] hover:bg-[#222a3d]"
              >
                Client Name
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 4 Client Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {sortedClients.map((client) => (
          <div
            key={client.id}
            onClick={() => onSelectClient(client)}
            className="bg-[#171f33] border border-[#222a3d] hover:border-[#3c4a42] rounded-lg p-4 transition-all hover:bg-[#1a233a] cursor-pointer flex flex-col justify-between group"
          >
            <div>
              {/* Header: Initials Badge & Tier Badge */}
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded bg-[#131b2e] border border-[#2d3449] flex items-center justify-center font-mono text-sm font-bold text-[#dae2fd] group-hover:border-[#4edea3]/40 transition-colors">
                  {client.initials}
                </div>
                {getTierBadge(client.agreementTier)}
              </div>

              {/* Client Name & Division */}
              <h3 className="text-sm font-bold text-[#dae2fd] group-hover:text-white transition-colors mb-0.5">
                {client.name}
              </h3>
              <p className="text-[11px] text-[#86948a] mb-3">
                {client.division}
              </p>

              {/* Financial & Project Rollup */}
              <div className="space-y-2 py-2.5 border-y border-[#222a3d]/70 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#86948a] uppercase">Lifetime Value</span>
                  <span className="font-bold text-[#dae2fd]">
                    {formatCurrency(client.lifetimeValue)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#86948a] uppercase">Active Projects</span>
                  <span className="text-[11px] text-[#4edea3] font-medium">
                    {client.activeProjectsLabel}
                  </span>
                </div>

                {/* Invoiced vs Paid */}
                <div className="pt-1">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-[#86948a]">
                      Invoiced: <strong className="text-[#dae2fd]">${Math.round(client.invoicedAmount / 1000)}k</strong>
                    </span>
                    <span className="text-[#4edea3]">
                      Paid: <strong className="font-bold">${Math.round(client.paidAmount / 1000)}k ({client.paidPercent}%)</strong>
                    </span>
                  </div>
                  <div className="w-full bg-[#0b1326] h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        client.paidPercent === 100 ? 'bg-[#4edea3]' : 'bg-[#3b82f6]'
                      }`}
                      style={{ width: `${client.paidPercent}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Contact Row */}
            <div className="pt-3 mt-1 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-[#131b2e] border border-[#2d3449] flex items-center justify-center font-mono text-[9px] font-bold text-[#bbcabf]">
                  {client.contact.initials}
                </div>
                <div className="leading-tight">
                  <div className="text-xs font-semibold text-[#dae2fd]">
                    {client.contact.name}
                  </div>
                  <div className="text-[10px] text-[#86948a]">
                    {client.contact.title}
                  </div>
                </div>
              </div>

              {/* Action icon (Phone or Mail) */}
              <div className="flex items-center gap-1.5">
                {client.contact.phone ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Calling ${client.contact.name}: ${client.contact.phone}`);
                    }}
                    className="w-6 h-6 rounded bg-[#131b2e] hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] flex items-center justify-center transition-colors"
                    title={`Call ${client.contact.phone}`}
                  >
                    <Phone className="w-3 h-3" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Emailing ${client.contact.name}: ${client.contact.email}`);
                    }}
                    className="w-6 h-6 rounded bg-[#131b2e] hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] flex items-center justify-center transition-colors"
                    title={`Email ${client.contact.email}`}
                  >
                    <Mail className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
