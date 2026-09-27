import React, { useState } from 'react';
import { GovernanceChangeRequest } from '../../types/wealth';

interface ReviewGovernanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: GovernanceChangeRequest | null;
  onApprove?: (requestId: string) => void;
  onReject?: (requestId: string) => void;
  onResolve?: (requestId: string, approved: boolean) => void;
}

export const ReviewGovernanceModal: React.FC<ReviewGovernanceModalProps> = ({
  isOpen,
  onClose,
  request,
  onApprove,
  onReject,
  onResolve,
}) => {
  const [notes, setNotes] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  if (!isOpen || !request) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#131b2e] border border-[#ff7886]/40 rounded-xl max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#060e20] border-b border-[#222a3d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-[#ff7886]/20 text-[#ffb2b7] rounded">
              <span className="material-symbols-outlined text-lg">gavel</span>
            </div>
            <div>
              <h2 className="font-['Manrope'] font-bold text-base text-[#dae2fd]">
                Board Governance Review: Cap Table Shift
              </h2>
              <span className="font-mono text-[10px] text-[#ffb2b7] uppercase font-bold tracking-wider">
                {request.entityName} • Legal Amendment #AM-2026-02
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#bbcabf] hover:text-[#dae2fd] p-1 rounded hover:bg-[#171f33] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Proposal Summary */}
          <div className="bg-[#171f33] border border-[#2d3449] p-4 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-[#bbcabf] uppercase font-semibold">
                Proposed Reallocation
              </span>
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#ff7886]/20 text-[#ffb2b7] font-bold">
                {request.proposedChange}
              </span>
            </div>
            <p className="text-xs text-[#dae2fd] leading-relaxed">
              {request.summary}
            </p>
            <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-[#bbcabf]">
              <span>Effective Date:</span>
              <strong className="text-[#dae2fd]">{request.effectiveDate}</strong>
            </div>
          </div>

          {/* Comparison Matrix */}
          <div className="space-y-2">
            <span className="font-mono text-xs font-semibold text-[#dae2fd] uppercase tracking-wider block">
              Cap Table Delta Analysis
            </span>
            <div className="grid grid-cols-2 gap-3">
              {/* Prior */}
              <div className="bg-[#0b1326] border border-[#222a3d] p-3 rounded-lg space-y-2">
                <span className="font-mono text-[10px] text-[#bbcabf] uppercase font-bold block">
                  Current Holdings (50 / 50)
                </span>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-[#dae2fd]">
                    <span>Umer (You):</span>
                    <span className="font-bold text-[#4edea3]">50.0% ($500k)</span>
                  </div>
                  <div className="flex justify-between text-[#dae2fd]">
                    <span>Ahmad Khan:</span>
                    <span>50.0% ($500k)</span>
                  </div>
                </div>
              </div>

              {/* Proposed */}
              <div className="bg-[#0b1326] border border-[#ff7886]/30 p-3 rounded-lg space-y-2">
                <span className="font-mono text-[10px] text-[#ffb2b7] uppercase font-bold block">
                  Proposed Post-Shift (60 / 40)
                </span>
                <div className="space-y-1 text-xs font-mono">
                  <div className="flex justify-between text-[#dae2fd]">
                    <span>Umer (You):</span>
                    <span className="font-bold text-[#ffb2b7]">40.0% ($400k)</span>
                  </div>
                  <div className="flex justify-between text-[#dae2fd]">
                    <span>Ahmad Khan:</span>
                    <span className="font-bold text-[#4edea3]">60.0% ($600k)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Reciprocity Clause */}
          <div className="p-3 bg-[#060e20] border border-[#3c4a42] rounded-lg text-xs space-y-1">
            <span className="font-mono text-[10px] text-[#4edea3] uppercase font-bold flex items-center gap-1">
              <span className="material-symbols-outlined text-xs">verified</span>
              Financial Consideration & Protection Clause
            </span>
            <p className="text-[#bbcabf] text-[11px] leading-relaxed">
              If approved, Umer retains a 40% permanent non-dilution floor through Series A, and receives priority liquidation preference of $50,000 on subsequent exits or capital recaps.
            </p>
          </div>

          {/* Feedback Notes */}
          <div className="space-y-1">
            <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
              Partner Response Notes / Counter-Conditions (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Approved subject to executed liquidation rider and cash distribution catch-up."
              className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-xs text-[#dae2fd] outline-none resize-none"
            />
          </div>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-2 cursor-pointer text-xs text-[#dae2fd]">
            <input
              type="checkbox"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="mt-0.5 rounded border-[#2d3449] text-[#10b981] focus:ring-0"
            />
            <span>
              I have reviewed the corporate resolution and acknowledge this formal modification to the company's Schedule A cap table.
            </span>
          </label>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-[#060e20] border-t border-[#222a3d] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              if (onReject) onReject(request.id);
              if (onResolve) onResolve(request.id, false);
              onClose();
            }}
            className="px-4 py-2 bg-[#222a3d] hover:bg-[#ff7886]/20 text-[#ffb2b7] hover:text-[#ffdadb] rounded text-xs font-mono font-semibold transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">cancel</span>
            <span>Decline / Reject</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] rounded text-xs font-mono font-semibold transition-colors"
            >
              Close
            </button>
            <button
              type="button"
              disabled={!agreedToTerms}
              onClick={() => {
                if (onApprove) onApprove(request.id);
                if (onResolve) onResolve(request.id, true);
                onClose();
              }}
              className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] disabled:opacity-50 disabled:cursor-not-allowed text-[#003824] rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm font-bold">check_circle</span>
              <span>Approve & Sign Amendment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
