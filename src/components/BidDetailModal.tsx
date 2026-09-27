import React from 'react';
import {
  X,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Percent,
  DollarSign,
  User,
} from 'lucide-react';
import { BidItem } from '../types';

interface BidDetailModalProps {
  bid: BidItem | null;
  onClose: () => void;
  onOpenDeltaModal?: () => void;
}

export const BidDetailModal: React.FC<BidDetailModalProps> = ({
  bid,
  onClose,
  onOpenDeltaModal,
}) => {
  if (!bid) return null;

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
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#131b2e] border border-[#222a3d] flex items-center justify-center text-[#3b82f6]">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#3b82f6]">
                  {bid.id}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30">
                  {bid.dueDate}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#dae2fd]">
                {bid.title}
              </h3>
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
          {/* Key Metric Blocks */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d]">
              <span className="text-[10px] font-mono uppercase text-[#86948a] block">
                Total Estimate
              </span>
              <span className="font-mono text-base font-bold text-[#dae2fd]">
                {formatCurrency(bid.amount)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d]">
              <span className="text-[10px] font-mono uppercase text-[#86948a] block">
                Win Probability
              </span>
              <span className="font-mono text-base font-bold text-[#4edea3]">
                {bid.winProbability.label}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] col-span-2 sm:col-span-1">
              <span className="text-[10px] font-mono uppercase text-[#86948a] block">
                Takeoff Progress
              </span>
              <span className="font-mono text-base font-bold text-[#adc6ff]">
                {bid.takeoffProgress}% DONE
              </span>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 text-xs font-mono bg-[#171f33] p-3 rounded-lg border border-[#222a3d]">
            <div className="flex justify-between">
              <span className="text-[#86948a]">Client GC:</span>
              <span className="text-[#dae2fd] font-semibold">{bid.client}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#86948a]">Lead Estimator:</span>
              <span className="text-[#4edea3] font-semibold">{bid.estimator || 'Marcus Vance'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#86948a]">Submission Deadline:</span>
              <span className="text-[#dae2fd] font-semibold">{bid.dueDate}</span>
            </div>
          </div>

          {/* RFI Blocker Banner */}
          {bid.rfiBlocker && (
            <div className="p-3 rounded-lg bg-[#ff7886]/10 border border-[#ff7886]/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#ff7886]" />
                <span className="text-xs text-[#ffdad6] font-medium font-mono">
                  {bid.rfiBlocker} (Pre-Con Clarification Required)
                </span>
              </div>
              {onOpenDeltaModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenDeltaModal();
                  }}
                  className="px-2.5 py-1 rounded bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] text-[11px] font-semibold cursor-pointer"
                >
                  Review Delta
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#222a3d] bg-[#171f33] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#222a3d] hover:bg-[#2d3449] text-xs font-mono text-[#dae2fd] transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
