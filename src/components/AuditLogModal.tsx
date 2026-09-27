import React from 'react';
import { X, ShieldCheck, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface AuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditLogModal: React.FC<AuditLogModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const logs = [
    {
      id: 'log-101',
      time: '14 seconds ago',
      level: 'VALIDATED',
      title: 'Automated CSI MasterFormat Cross-Check Complete',
      desc: 'Reconciled 14 active takeoff packages against Division 03 (Concrete), Division 05 (Metals), and Division 23 (HVAC). 0 conflicts detected.',
    },
    {
      id: 'log-102',
      time: '12 minutes ago',
      level: 'SYNC',
      title: 'CAD Delta Schedule Generated for RFI-2024-089',
      desc: 'BIM overlay recalculation completed: +31.2 MT rebar mapped to Sector B pad matrix F-4 through F-9.',
    },
    {
      id: 'log-103',
      time: '1 hour ago',
      level: 'INGEST',
      title: 'Skanska Addendum #2 Re-Indexing',
      desc: 'Extracted 12 revised MEP detail sheets; matched clash report MEP-CL-04 with RFI-2024-092.',
    },
    {
      id: 'log-104',
      time: '3 hours ago',
      level: 'SECURITY',
      title: 'Isolated Books & Ops Perimeter Check',
      desc: 'Cryptographic ledger hash validated. Zero cross-tenant data leakage detected across enterprise general contractor workspaces.',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#222a3d] flex items-center justify-between bg-[#171f33]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-[#4edea3]/10 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#dae2fd]">
                Accuracy Guarantee Engine Audit Log
              </h3>
              <p className="text-[11px] text-[#86948a]">
                Immutable CSI cross-reference verification stream and takeoff sync events
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Logs */}
        <div className="p-5 space-y-3 overflow-y-auto">
          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-lg bg-[#0b1326] border border-[#222a3d] font-mono text-xs space-y-1"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                  <span className="font-bold text-[#dae2fd]">{log.title}</span>
                </div>
                <span className="text-[10px] text-[#86948a]">{log.time}</span>
              </div>
              <p className="text-[11px] text-[#86948a] pl-3.5 leading-relaxed">
                {log.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#222a3d] bg-[#171f33] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-[#222a3d] hover:bg-[#2d3449] text-xs font-mono text-[#dae2fd] transition-colors cursor-pointer"
          >
            Close Audit Log
          </button>
        </div>
      </div>
    </div>
  );
};
