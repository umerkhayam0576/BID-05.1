import React from 'react';
import {
  X,
  FileCheck2,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  ShieldCheck,
  Send,
  Download,
  CheckCircle2,
  RotateCcw,
  Clock,
  Layers,
  FileText
} from 'lucide-react';
import { ProjectTrackItem, ArchivedDeliverableItem } from '../types';

interface DeliveryPreviewModalProps {
  isOpen: boolean;
  project: ProjectTrackItem | null;
  archivedItem?: ArchivedDeliverableItem | null;
  isDelivered?: boolean;
  onClose: () => void;
  onConfirmDelivery?: (projectId: string) => void;
  onReverseDelivery?: (archivedId: string) => void;
}

export const DeliveryPreviewModal: React.FC<DeliveryPreviewModalProps> = ({
  isOpen,
  project,
  archivedItem,
  isDelivered = false,
  onClose,
  onConfirmDelivery,
  onReverseDelivery,
}) => {
  if (!isOpen || (!project && !archivedItem)) return null;

  const title = project?.title || archivedItem?.packageName || 'Deliverable Package';
  const gc = project?.gc || archivedItem?.gc || 'General Contractor';
  const code = project?.id || archivedItem?.packageCode || 'PKG-DEL';
  const value = project?.estimateValue ?? archivedItem?.contractValue ?? 0;
  const scope = project?.scopeType || archivedItem?.scopeSummary || 'Commercial Pre-Construction';
  const estimators = project?.leadEstimators || [
    { name: 'Marcus Vance', initials: 'MV' },
    { name: 'David Chen', initials: 'DC' }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#0f172a] border border-[#222a3d] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl my-8 relative flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-[#222a3d] bg-[#131b2e] flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                isDelivered
                  ? 'bg-[#4edea3]/15 border border-[#4edea3]/30 text-[#4edea3]'
                  : 'bg-[#adc6ff]/15 border border-[#adc6ff]/30 text-[#adc6ff]'
              }`}
            >
              {isDelivered ? <CheckCircle2 className="w-5 h-5" /> : <FileCheck2 className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-[#4edea3] px-2 py-0.5 rounded bg-[#4edea3]/10 border border-[#4edea3]/20">
                  {code}
                </span>
                <span
                  className={`text-[11px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                    isDelivered
                      ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30'
                      : 'bg-[#ffb356]/15 text-[#ffb356] border border-[#ffb356]/30'
                  }`}
                >
                  {isDelivered ? 'Delivered & Archived' : 'Pre-Delivery Verification & Review'}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                {isDelivered ? 'Delivered Package Manifest' : 'Confirm Package Submittal & Delivery'}
              </h2>
              <p className="text-xs text-[#86948a] mt-0.5">
                {isDelivered
                  ? 'This package has been released to the General Contractor. You can reverse this action if needed.'
                  : 'Review all package deliverables, sign-offs, and trade schedules before transferring to Delivered status.'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-[#171f33] hover:bg-[#222a3d] text-[#86948a] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Key Facts Card */}
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <span className="font-mono text-[10px] text-[#86948a] uppercase block">General Contractor</span>
              <span className="text-sm font-semibold text-white mt-0.5 block flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-[#adc6ff]" />
                {gc}
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] text-[#86948a] uppercase block">Contract / Scope Value</span>
              <span className="text-sm font-mono font-bold text-[#4edea3] mt-0.5 block">
                ${value.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="font-mono text-[10px] text-[#86948a] uppercase block">Scope Classification</span>
              <span className="text-xs font-medium text-[#dae2fd] mt-0.5 block truncate">
                {scope}
              </span>
            </div>
          </div>

          {/* Package Deliverables Checklist Preview */}
          <div className="bg-[#0b1326] border border-[#222a3d] rounded-lg p-4 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#222a3d] pb-2">
              <span className="text-xs font-mono font-bold uppercase text-[#dae2fd] flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-[#4edea3]" />
                Bundled Deliverables (Ready for GC Transmittal)
              </span>
              <span className="text-[10px] font-mono text-[#4edea3] bg-[#4edea3]/10 px-2 py-0.5 rounded border border-[#4edea3]/20">
                100% Quality Passed
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2 rounded bg-[#131b2e] border border-[#222a3d]/80 text-[#dae2fd]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] shrink-0" />
                <span>Quantity Takeoff (QTO) Excel Sheets</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-[#131b2e] border border-[#222a3d]/80 text-[#dae2fd]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] shrink-0" />
                <span>Revit LOD 350 Coordination Model</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-[#131b2e] border border-[#222a3d]/80 text-[#dae2fd]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] shrink-0" />
                <span>Dual PE Sign-Off & Audit Certificate</span>
              </div>
              <div className="flex items-center gap-2 p-2 rounded bg-[#131b2e] border border-[#222a3d]/80 text-[#dae2fd]">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] shrink-0" />
                <span>RFI Resolution Matrix & Addenda Log</span>
              </div>
            </div>
          </div>

          {/* Signers & Audit Seal */}
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#0b1326] border border-[#4edea3]/40 flex items-center justify-center text-[#4edea3]">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-semibold text-white block">Audit Verification Cleared</span>
                <span className="text-[11px] font-mono text-[#86948a]">
                  Signers: {estimators.map((e) => e.name).join(' & ')}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-mono text-[#86948a] uppercase block">Archive Bundle</span>
              <span className="text-xs font-mono text-[#adc6ff] font-semibold">ZIP Package (~94MB)</span>
            </div>
          </div>

          {/* Reversal / Mistake Explanation Notice */}
          {isDelivered ? (
            <div className="p-3.5 rounded-lg border border-[#e0b44a]/30 bg-[#e0b44a]/10 flex items-start gap-3 text-xs text-[#f6c453]">
              <RotateCcw className="w-4 h-4 text-[#e0b44a] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-white">Need to reverse this delivery?</span>
                <p className="text-[#e2d6b5] mt-0.5">
                  If this package was marked as Delivered by mistake, click <strong>"Reverse Delivery to In-Flight"</strong> below.
                  It will immediately return to your active workspace with its original milestones, estimator assignments, and deadline preserved.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg border border-[#adc6ff]/30 bg-[#adc6ff]/10 flex items-start gap-3 text-xs text-[#dae2fd]">
              <AlertTriangle className="w-4 h-4 text-[#adc6ff] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block text-white">Pre-Delivery Safety Check</span>
                <p className="text-[#86948a] mt-0.5">
                  Marking as delivered moves this project into the <strong>Delivered & Audit-Cleared Archive</strong>.
                  If you click this by mistake at any point, you can reverse it anytime directly from the archive table.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#222a3d] bg-[#131b2e] flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#171f33] hover:bg-[#222a3d] text-xs font-mono text-[#86948a] hover:text-white transition-colors cursor-pointer"
          >
            Cancel / Close
          </button>

          <div className="flex items-center gap-2">
            {isDelivered && onReverseDelivery && archivedItem && (
              <button
                type="button"
                onClick={() => {
                  onReverseDelivery(archivedItem.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-md bg-[#e0b44a]/20 hover:bg-[#e0b44a]/30 border border-[#e0b44a]/40 text-[#ffd18a] hover:text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reverse Delivery to In-Flight</span>
              </button>
            )}

            {!isDelivered && onConfirmDelivery && project && (
              <button
                type="button"
                onClick={() => {
                  onConfirmDelivery(project.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-md bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Confirm & Release to Delivered</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
