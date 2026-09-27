import React from 'react';

interface WealthAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WealthAuditLogModal: React.FC<WealthAuditLogModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const logs = [
    {
      id: 'AUD-902',
      timestamp: 'Sep 19, 2026 - 08:42 UTC',
      actor: 'Sarah Jenkins (CPA Auditor)',
      action: 'GAAP Reconcile & Book Validation',
      entity: 'All Entities Consolidated',
      hash: 'sha256:7f8e...3b1a',
      status: 'VERIFIED',
    },
    {
      id: 'AUD-891',
      timestamp: 'Sep 14, 2026 - 14:15 UTC',
      actor: 'Bid Exact Corporate Treasury',
      action: 'Member Distribution Wire Dispatched ($10,000.00)',
      entity: 'Bid Exact LLC',
      hash: 'sha256:4a12...99f0',
      status: 'CLEARED',
    },
    {
      id: 'AUD-882',
      timestamp: 'Aug 22, 2026 - 11:30 UTC',
      actor: 'Umer (Principal)',
      action: 'Preferred Equity Subscription Wired ($10,000.00)',
      entity: 'Kinetix Bio Ltd',
      hash: 'sha256:88bc...002e',
      status: 'EXECUTED',
    },
    {
      id: 'AUD-867',
      timestamp: 'Aug 15, 2026 - 09:00 UTC',
      actor: 'Apex Corporate Controller',
      action: 'Advisory Profit Share Accrual (30% Tier - $15k)',
      entity: 'Apex Logistics Inc',
      hash: 'sha256:12ef...cd44',
      status: 'ACCRUED',
    },
    {
      id: 'AUD-840',
      timestamp: 'Jul 30, 2026 - 16:45 UTC',
      actor: 'Bid Exact Corporate Treasury',
      action: 'Shareholder Note Tranche Repayment ($5,000.00)',
      entity: 'Bid Exact LLC',
      hash: 'sha256:33de...8811',
      status: 'CLEARED',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150 font-mono">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#060e20]">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#4edea3]">history_edu</span>
            <div>
              <h3 className="text-sm font-bold text-[#dae2fd] font-['Manrope']">
                Ownership & Multi-Entity Audit Trail
              </h3>
              <p className="text-[11px] text-[#bbcabf]">
                Cryptographically hashed audit log for GAAP equity verification
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#bbcabf] hover:text-[#dae2fd] p-1.5 rounded hover:bg-[#171f33] transition-colors"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* List of Audit Entries */}
        <div className="p-5 overflow-y-auto space-y-3 text-xs">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-1.5 hover:border-[#4edea3]/40 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-[#dae2fd]">{log.action}</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#10b981]/20 text-[#4edea3] font-bold">
                  {log.status}
                </span>
              </div>
              <div className="flex flex-wrap items-center justify-between text-[11px] text-[#bbcabf] gap-2 pt-1">
                <span>Entity: <strong className="text-[#dae2fd]">{log.entity}</strong></span>
                <span>Actor: {log.actor}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-[#bbcabf] opacity-80 pt-1 border-t border-[#222a3d]">
                <span>{log.timestamp}</span>
                <span>{log.hash}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#222a3d] bg-[#060e20] flex items-center justify-between text-[11px] text-[#bbcabf]">
          <span>Audit Log Hash Consistency: 100% OK</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
