import React from 'react';
import {
  X,
  Building2,
  Phone,
  Mail,
  DollarSign,
  FileCheck,
  TrendingUp,
} from 'lucide-react';
import { ClientItem } from '../types';

interface ClientDetailModalProps {
  client: ClientItem | null;
  onClose: () => void;
}

export const ClientDetailModal: React.FC<ClientDetailModalProps> = ({
  client,
  onClose,
}) => {
  if (!client) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-xl rounded-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#171f33]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-[#0b1326] border border-[#2d3449] flex items-center justify-center font-mono text-base font-bold text-[#4edea3]">
              {client.initials}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#dae2fd]">
                  {client.name}
                </h3>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 uppercase font-bold">
                  {client.agreementTier}
                </span>
              </div>
              <p className="text-xs text-[#86948a]">{client.division}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d]">
              <span className="text-[10px] font-mono uppercase text-[#86948a] block">
                Lifetime Value
              </span>
              <span className="font-mono text-base font-bold text-[#dae2fd]">
                {formatCurrency(client.lifetimeValue)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d]">
              <span className="text-[10px] font-mono uppercase text-[#86948a] block">
                Active Packages
              </span>
              <span className="font-mono text-base font-bold text-[#4edea3]">
                {client.activeProjectsLabel}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase text-[#86948a] block">
                Paid Retention
              </span>
              <span className="font-mono text-base font-bold text-[#adc6ff]">
                {client.paidPercent}% ({formatCurrency(client.paidAmount)})
              </span>
            </div>
          </div>

          {/* Lead Contact Card */}
          <div className="p-4 rounded-lg bg-[#171f33] border border-[#222a3d] space-y-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#86948a] font-bold block">
              Lead Executive & Pre-Con Contact
            </span>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-[#dae2fd]">
                  {client.contact.name}
                </div>
                <div className="text-xs text-[#86948a]">
                  {client.contact.title}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {client.contact.phone && (
                  <a
                    href={`tel:${client.contact.phone}`}
                    className="p-2 rounded bg-[#131b2e] hover:bg-[#222a3d] border border-[#2d3449] text-[#4edea3] flex items-center gap-1.5 text-xs font-mono transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>
                )}
                {client.contact.email && (
                  <a
                    href={`mailto:${client.contact.email}`}
                    className="p-2 rounded bg-[#131b2e] hover:bg-[#222a3d] border border-[#2d3449] text-[#adc6ff] flex items-center gap-1.5 text-xs font-mono transition-colors"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#222a3d] bg-[#171f33] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#222a3d] hover:bg-[#2d3449] text-xs font-mono text-[#dae2fd] transition-colors cursor-pointer"
          >
            Close Profile
          </button>
        </div>
      </div>
    </div>
  );
};
