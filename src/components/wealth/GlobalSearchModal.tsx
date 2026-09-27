import React, { useState, useEffect, useRef } from 'react';
import { CompanyEntity, LedgerEvent } from '../../types/wealth';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: CompanyEntity[];
  ledgerEvents: LedgerEvent[];
  onSelectEntity: (id: string | null) => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  companies,
  ledgerEvents,
  onSelectEntity,
}) => {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.industry.toLowerCase().includes(query.toLowerCase())
  );

  const filteredEvents = ledgerEvents.filter(
    (ev) =>
      ev.entityName.toLowerCase().includes(query.toLowerCase()) ||
      ev.referenceId.toLowerCase().includes(query.toLowerCase()) ||
      ev.scopeDetails.toLowerCase().includes(query.toLowerCase()) ||
      ev.classification.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4">
      <div className="bg-[#131b2e] border border-[#2d3449] rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Search Bar Input */}
        <div className="p-3 bg-[#060e20] border-b border-[#222a3d] flex items-center gap-2.5">
          <span className="material-symbols-outlined text-[#4edea3]">search</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search entities, ledger references, cap table members..."
            className="w-full bg-transparent text-sm text-[#dae2fd] outline-none placeholder-[#bbcabf]"
          />
          <kbd className="text-[10px] font-mono bg-[#171f33] px-2 py-0.5 rounded text-[#bbcabf]">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 font-mono text-xs">
          {/* Companies Group */}
          <div>
            <div className="px-3 py-1 text-[10px] text-[#bbcabf] uppercase font-bold">
              Operating Companies ({filteredCompanies.length})
            </div>
            {filteredCompanies.map((c) => (
              <div
                key={c.id}
                onClick={() => {
                  onSelectEntity(c.id);
                  onClose();
                }}
                className="flex items-center justify-between px-3 py-2 rounded hover:bg-[#171f33] cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm text-[#4edea3]">{c.icon}</span>
                  <div>
                    <span className="text-[#dae2fd] font-semibold">{c.name}</span>
                    <span className="text-[10px] text-[#bbcabf] ml-2">({c.industry})</span>
                  </div>
                </div>
                <span className="text-[#4edea3]">{c.legalOwnershipPercent}% equity</span>
              </div>
            ))}
          </div>

          {/* Ledger Group */}
          <div>
            <div className="px-3 py-1 text-[10px] text-[#bbcabf] uppercase font-bold">
              Ledger Events & Capital Activity ({filteredEvents.length})
            </div>
            {filteredEvents.slice(0, 5).map((ev) => (
              <div
                key={ev.id}
                onClick={() => {
                  onSelectEntity(ev.entityId);
                  onClose();
                }}
                className="flex items-center justify-between px-3 py-2 rounded hover:bg-[#171f33] cursor-pointer transition-colors"
              >
                <div>
                  <div className="text-[#dae2fd] font-medium">{ev.entityName} • {ev.referenceId}</div>
                  <div className="text-[10px] text-[#bbcabf] truncate max-w-sm">{ev.scopeDetails}</div>
                </div>
                <span className={ev.cashEffect > 0 ? 'text-[#4edea3] font-bold' : 'text-[#ffb2b7] font-bold'}>
                  {ev.cashEffect > 0 ? `+$${ev.cashEffect.toLocaleString()}` : `-$${Math.abs(ev.cashEffect).toLocaleString()}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
