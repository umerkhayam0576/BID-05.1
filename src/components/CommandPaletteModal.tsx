import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  FileQuestion,
  FileSpreadsheet,
  Building2,
  Cpu,
  Plus,
  ArrowRight,
} from 'lucide-react';
import { RfiItem, BidItem, ClientItem } from '../types';

interface CommandPaletteModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfis: RfiItem[];
  bids: BidItem[];
  clients: ClientItem[];
  onSelectRfi: (rfi: RfiItem) => void;
  onSelectBid: (bid: BidItem) => void;
  onSelectClient: (client: ClientItem) => void;
  onOpenNewRfi: () => void;
  onOpenNewBid: () => void;
  onOpenDeltaModal: () => void;
}

export const CommandPaletteModal: React.FC<CommandPaletteModalProps> = ({
  isOpen,
  onClose,
  rfis,
  bids,
  clients,
  onSelectRfi,
  onSelectBid,
  onSelectClient,
  onOpenNewRfi,
  onOpenNewBid,
  onOpenDeltaModal,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (isOpen) setQuery('');
  }, [isOpen]);

  if (!isOpen) return null;

  const q = query.toLowerCase().trim();

  const matchingRfis = rfis.filter(
    (r) =>
      r.id.toLowerCase().includes(q) ||
      r.title.toLowerCase().includes(q) ||
      r.client.toLowerCase().includes(q) ||
      r.project.toLowerCase().includes(q)
  );

  const matchingBids = bids.filter(
    (b) =>
      b.id.toLowerCase().includes(q) ||
      b.title.toLowerCase().includes(q) ||
      b.client.toLowerCase().includes(q)
  );

  const matchingClients = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(q) ||
      c.division.toLowerCase().includes(q) ||
      c.contact.name.toLowerCase().includes(q)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
        {/* Search Input */}
        <div className="p-3.5 border-b border-[#222a3d] flex items-center gap-3 bg-[#171f33]">
          <Search className="w-4 h-4 text-[#4edea3]" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, RFI number, project, or client..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#dae2fd] placeholder:text-[#86948a] outline-none font-mono"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0b1326] text-[#86948a] border border-[#222a3d]">
            ESC
          </kbd>
        </div>

        {/* Results Stream */}
        <div className="p-3 overflow-y-auto space-y-4 max-h-96">
          {/* Quick Actions */}
          <div>
            <div className="px-2 pb-1 text-[10px] font-mono uppercase text-[#86948a] font-bold">
              Quick Actions
            </div>
            <div className="space-y-1">
              <button
                onClick={() => {
                  onClose();
                  onOpenDeltaModal();
                }}
                className="w-full px-2.5 py-2 rounded-md hover:bg-[#222a3d] text-left text-xs font-mono text-[#dae2fd] flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>Launch CAD Rebar BIM Diff Inspector (RFI-089)</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#4edea3]" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenNewRfi();
                }}
                className="w-full px-2.5 py-2 rounded-md hover:bg-[#222a3d] text-left text-xs font-mono text-[#dae2fd] flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-[#ff7886]" />
                  <span>Draft New Architectural RFI Transmittal</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#ff7886]" />
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenNewBid();
                }}
                className="w-full px-2.5 py-2 rounded-md hover:bg-[#222a3d] text-left text-xs font-mono text-[#dae2fd] flex items-center justify-between transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-[#adc6ff]" />
                  <span>Initiate New Proposal & Quantity Takeoff</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-[#86948a] group-hover:text-[#adc6ff]" />
              </button>
            </div>
          </div>

          {/* RFIs */}
          {matchingRfis.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[10px] font-mono uppercase text-[#86948a] font-bold">
                Pre-Con RFIs ({matchingRfis.length})
              </div>
              <div className="space-y-1">
                {matchingRfis.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => {
                      onClose();
                      onSelectRfi(r);
                    }}
                    className="w-full px-2.5 py-2 rounded-md hover:bg-[#222a3d] text-left text-xs text-[#dae2fd] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileQuestion className="w-3.5 h-3.5 text-[#4edea3] shrink-0" />
                      <span className="font-mono font-bold text-[#4edea3] shrink-0">
                        {r.id}
                      </span>
                      <span className="truncate">{r.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#86948a] shrink-0 pl-2">
                      {r.client}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bids */}
          {matchingBids.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[10px] font-mono uppercase text-[#86948a] font-bold">
                Upcoming Bids ({matchingBids.length})
              </div>
              <div className="space-y-1">
                {matchingBids.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => {
                      onClose();
                      onSelectBid(b);
                    }}
                    className="w-full px-2.5 py-2 rounded-md hover:bg-[#222a3d] text-left text-xs text-[#dae2fd] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-[#3b82f6] shrink-0" />
                      <span className="font-mono font-bold text-[#3b82f6] shrink-0">
                        {b.id}
                      </span>
                      <span className="truncate">{b.title}</span>
                    </div>
                    <span className="font-mono text-xs font-semibold text-[#dae2fd] shrink-0 pl-2">
                      ${b.amount.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clients */}
          {matchingClients.length > 0 && (
            <div>
              <div className="px-2 pb-1 text-[10px] font-mono uppercase text-[#86948a] font-bold">
                Client Accounts ({matchingClients.length})
              </div>
              <div className="space-y-1">
                {matchingClients.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => {
                      onClose();
                      onSelectClient(c);
                    }}
                    className="w-full px-2.5 py-2 rounded-md hover:bg-[#222a3d] text-left text-xs text-[#dae2fd] flex items-center justify-between transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-3.5 h-3.5 text-[#adc6ff] shrink-0" />
                      <span className="font-semibold text-white truncate">{c.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-[#4edea3] shrink-0">
                      ${Math.round(c.lifetimeValue / 1000)}k LTV
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
