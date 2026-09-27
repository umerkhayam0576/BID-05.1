import React, { useState } from 'react';
import {
  X,
  FileQuestion,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building,
  Paperclip,
  Share2,
  Check,
  Cpu,
} from 'lucide-react';
import { RfiItem, RfiStatus } from '../types';

interface RfiDetailModalProps {
  rfi: RfiItem | null;
  onClose: () => void;
  onUpdateStatus: (rfiId: string, newStatus: RfiStatus, note?: string) => void;
  onOpenDeltaModal?: () => void;
}

export const RfiDetailModal: React.FC<RfiDetailModalProps> = ({
  rfi,
  onClose,
  onUpdateStatus,
  onOpenDeltaModal,
}) => {
  const [resolutionNote, setResolutionNote] = useState('');
  const [copied, setCopied] = useState(false);

  if (!rfi) return null;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#171f33]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-[#131b2e] border border-[#222a3d] flex items-center justify-center text-[#4edea3]">
              <FileQuestion className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-[#4edea3]">
                  {rfi.id}
                </span>
                <span className="text-[11px] font-mono text-[#86948a]">
                  {rfi.submittedTime}
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#dae2fd]">
                {rfi.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyLink}
              className="p-1.5 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] transition-colors"
              title="Copy RFI Link"
            >
              {copied ? <Check className="w-4 h-4 text-[#4edea3]" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#0b1326] p-3 rounded-lg border border-[#222a3d] text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#86948a] uppercase block">Client</span>
              <span className="font-semibold text-[#dae2fd]">{rfi.client}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#86948a] uppercase block">Project</span>
              <span className="font-semibold text-[#dae2fd]">{rfi.project}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#86948a] uppercase block">Lead Estimator</span>
              <span className="font-semibold text-[#4edea3]">{rfi.assignedLead.name}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#86948a] uppercase block">Priority</span>
              <span className={`font-bold ${
                rfi.priority === 'CRITICAL' ? 'text-[#ff7886]' : 'text-[#fcd34d]'
              }`}>
                {rfi.priority}
              </span>
            </div>
          </div>

          {/* CSI Division */}
          {rfi.csiDivision && (
            <div className="flex items-center gap-2 text-xs font-mono bg-[#171f33] px-3 py-2 rounded border border-[#222a3d]">
              <span className="text-[#86948a]">CSI MasterFormat:</span>
              <span className="text-[#adc6ff] font-semibold">{rfi.csiDivision}</span>
            </div>
          )}

          {/* Inquiry Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-mono uppercase text-[#86948a] font-semibold">
              Technical Inquiry & Architectural Conflict
            </label>
            <div className="p-3.5 rounded-lg bg-[#0b1326] border border-[#222a3d] text-xs text-[#dae2fd] leading-relaxed">
              {rfi.fullQuery || rfi.description}
            </div>
          </div>

          {/* Financial Delta & Linked Proposal */}
          {rfi.deltaCost !== undefined && (
            <div className="p-3.5 rounded-lg bg-[#171f33] border border-[#2d3449] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#86948a] block">
                  Estimating Schedule Delta
                </span>
                <span className="font-mono text-sm font-bold text-[#4edea3]">
                  {rfi.deltaCost >= 0 ? `+$${rfi.deltaCost.toLocaleString()}` : `-$${Math.abs(rfi.deltaCost).toLocaleString()}`}
                  {rfi.deltaTonnage ? ` (+${rfi.deltaTonnage} MT Steel)` : ''}
                </span>
              </div>

              {rfi.bimOverlayAvailable && onOpenDeltaModal && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenDeltaModal();
                  }}
                  className="px-3 py-1.5 rounded bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Cpu className="w-3.5 h-3.5" />
                  <span>Inspect BIM Overlay</span>
                </button>
              )}
            </div>
          )}

          {/* Status Changer Actions */}
          <div className="pt-2 border-t border-[#222a3d] space-y-3">
            <span className="text-xs font-mono uppercase text-[#86948a] font-semibold block">
              Update RFI Status & Workflow State
            </span>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => onUpdateStatus(rfi.id, 'AWAITING_RESPONSE')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  rfi.status === 'AWAITING_RESPONSE'
                    ? 'bg-[#ff7886]/20 text-[#ffb4ab] border border-[#ff7886]'
                    : 'bg-[#171f33] text-[#86948a] hover:text-[#dae2fd] border border-[#222a3d]'
                }`}
              >
                Awaiting Response
              </button>

              <button
                onClick={() => onUpdateStatus(rfi.id, 'DRAFT_READY')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  rfi.status === 'DRAFT_READY'
                    ? 'bg-[#3b82f6]/20 text-[#adc6ff] border border-[#3b82f6]'
                    : 'bg-[#171f33] text-[#86948a] hover:text-[#dae2fd] border border-[#222a3d]'
                }`}
              >
                Draft Response Ready
              </button>

              <button
                onClick={() => onUpdateStatus(rfi.id, 'UNDER_REVIEW')}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  rfi.status === 'UNDER_REVIEW'
                    ? 'bg-[#f59e0b]/20 text-[#fcd34d] border border-[#f59e0b]'
                    : 'bg-[#171f33] text-[#86948a] hover:text-[#dae2fd] border border-[#222a3d]'
                }`}
              >
                Under Review
              </button>

              <button
                onClick={() => {
                  onUpdateStatus(rfi.id, 'RESOLVED', 'Resolved & incorporated into takeoff package');
                }}
                className={`px-3 py-1.5 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  rfi.status === 'RESOLVED'
                    ? 'bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]'
                    : 'bg-[#171f33] text-[#86948a] hover:text-[#dae2fd] border border-[#222a3d]'
                }`}
              >
                ✓ Mark Resolved in Bid
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#222a3d] bg-[#171f33] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#222a3d] hover:bg-[#2d3449] text-xs font-mono text-[#dae2fd] transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
