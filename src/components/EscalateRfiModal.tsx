import React, { useState } from 'react';
import { X, AlertTriangle, Send, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ProjectTrackItem } from '../types';

interface EscalateRfiModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectTrackItem | null;
  onConfirmEscalation: (projectId: string, memo: string) => void;
}

export const EscalateRfiModal: React.FC<EscalateRfiModalProps> = ({
  isOpen,
  onClose,
  project,
  onConfirmEscalation,
}) => {
  const [urgencyLevel, setUrgencyLevel] = useState<'CRITICAL_STOPPAGE' | 'HIGH_HOLD'>('CRITICAL_STOPPAGE');
  const [memo, setMemo] = useState(
    'URGENT NOTICE: ASTM A992 Structural Steel grade clarification gating 340 tons fabrication schedule. Pre-construction procurement milestone in jeopardy. Direct response requested within 24 hours.'
  );
  const [isSent, setIsSent] = useState(false);

  if (!isOpen || !project) return null;

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSent(true);
    setTimeout(() => {
      onConfirmEscalation(project.id, memo);
      setIsSent(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="bg-[#0f172a] border border-[#ff7886]/40 rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#222a3d] bg-[#1a1420] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff7886]/20 border border-[#ff7886]/40 flex items-center justify-center text-[#ff7886]">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Escalate Gating RFI to General Contractor
              </h2>
              <p className="text-xs text-[#ffb4ab] font-mono">
                {project.id} • {project.title} ({project.gc})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#86948a] hover:text-white p-1 rounded hover:bg-[#222a3d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="p-5 space-y-4 text-xs">
          <div className="bg-[#93000a]/20 border border-[#ff7886]/30 p-3 rounded-lg flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-[#ff7886] shrink-0 mt-0.5" />
            <div className="text-xs text-[#ffdad6]">
              <span className="font-bold">Hold Point Alert: </span>
              {project.notice?.text || 'Critical RFI blocker delaying submittals.'}
              {project.notice?.subtext && (
                <div className="text-[11px] text-[#ffb4ab] mt-1">
                  {project.notice.subtext}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] text-[#86948a] uppercase mb-1">
              Escalation Priority Band
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setUrgencyLevel('CRITICAL_STOPPAGE')}
                className={`py-2 px-3 rounded-md text-xs font-mono font-medium border text-left transition-colors ${
                  urgencyLevel === 'CRITICAL_STOPPAGE'
                    ? 'bg-[#ff7886]/20 border-[#ff7886] text-[#ffdad6]'
                    : 'bg-[#131b2e] border-[#222a3d] text-[#86948a]'
                }`}
              >
                Critical Hold (24h SLA)
              </button>
              <button
                type="button"
                onClick={() => setUrgencyLevel('HIGH_HOLD')}
                className={`py-2 px-3 rounded-md text-xs font-mono font-medium border text-left transition-colors ${
                  urgencyLevel === 'HIGH_HOLD'
                    ? 'bg-[#f59e0b]/20 border-[#f59e0b] text-[#fcd34d]'
                    : 'bg-[#131b2e] border-[#222a3d] text-[#86948a]'
                }`}
              >
                High Priority (48h SLA)
              </button>
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] text-[#86948a] uppercase mb-1">
              Escalation Directive to Chief Structural Engineer
            </label>
            <textarea
              rows={4}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              className="w-full bg-[#131b2e] border border-[#222a3d] rounded-md p-3 text-white placeholder:text-[#86948a] focus:outline-none focus:border-[#ff7886]"
            />
          </div>

          <div className="pt-3 border-t border-[#222a3d] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md bg-[#171f33] hover:bg-[#222a3d] text-xs font-mono text-[#86948a] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSent}
              className="px-4 py-2 bg-[#ff7886] hover:bg-[#ff5266] text-[#690005] rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
            >
              {isSent ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-spin" />
                  <span>Transmitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  <span>Transmit Escalation Notice</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
