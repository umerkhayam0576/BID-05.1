import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileQuestion,
  Smartphone,
  FileText,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ArrowRight,
  Layers,
  ChevronRight,
  Eye,
  Plus,
} from 'lucide-react';
import { RfiItem, RfiStatus } from '../types';

interface RfiResolutionMatrixProps {
  rfis: RfiItem[];
  onSelectRfi: (rfi: RfiItem) => void;
  onOpenDeltaModal: () => void;
  onExportPdf: () => void;
  onExportCsv: () => void;
  onUpdateStatus?: (rfiId: string, newStatus: RfiStatus, note?: string) => void;
  onOpenNewRfi?: () => void;
}

export const RfiResolutionMatrix: React.FC<RfiResolutionMatrixProps> = ({
  rfis,
  onSelectRfi,
  onOpenDeltaModal,
  onExportPdf,
  onExportCsv,
  onUpdateStatus,
  onOpenNewRfi,
}) => {
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'AWAITING_GC'>('ALL');

  const filteredRfis = rfis.filter((r) => {
    if (filter === 'CRITICAL') {
      return r.priority === 'CRITICAL' || r.priority === 'HIGH';
    }
    if (filter === 'AWAITING_GC') {
      return r.status === 'AWAITING_RESPONSE';
    }
    return true;
  });

  const getStatusBadge = (rfi: RfiItem) => {
    let badgeContent;
    switch (rfi.status) {
      case 'AWAITING_RESPONSE':
        badgeContent = (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#ff7886]/15 text-[#ffb4ab] border border-[#ff7886]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7886] animate-pulse" />
            <span>AWAITING RESPONSE</span>
          </div>
        );
        break;
      case 'DRAFT_READY':
        badgeContent = (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#3b82f6]/20 text-[#adc6ff] border border-[#3b82f6]/30">
            <span className="text-xs">↳</span>
            <span>DRAFT RESPONSE READY</span>
          </div>
        );
        break;
      case 'UNDER_REVIEW':
        badgeContent = (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#f59e0b]/15 text-[#fcd34d] border border-[#f59e0b]/30">
            <Clock className="w-3 h-3" />
            <span>UNDER REVIEW</span>
          </div>
        );
        break;
      case 'RESOLVED':
        badgeContent = (
          <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30">
            <CheckCircle2 className="w-3 h-3" />
            <span>RESOLVED IN BID</span>
          </div>
        );
        break;
      default:
        return null;
    }

    return (
      <motion.div
        key={rfi.status}
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        {badgeContent}
      </motion.div>
    );
  };

  const getPriorityBadge = (priority: RfiItem['priority']) => {
    switch (priority) {
      case 'CRITICAL':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#93000a] text-[#ffdad6] uppercase tracking-wider">
            CRITICAL PRIORITY
          </span>
        );
      case 'HIGH':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#67001b] text-[#ffb2b7] uppercase tracking-wider">
            HIGH PRIORITY
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#1e293b] text-[#94a3b8] uppercase tracking-wider border border-[#334155]">
            MEDIUM PRIORITY
          </span>
        );
      case 'LOW':
        return null;
    }
  };

  return (
    <div className="bg-[#171f33] border border-[#222a3d] rounded-lg overflow-hidden flex flex-col">
      {/* Header Bar with Filters */}
      <div className="p-4 sm:p-5 border-b border-[#222a3d] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded bg-[#131b2e] border border-[#222a3d] flex items-center justify-center text-[#adc6ff]">
              <FileQuestion className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-base font-bold text-[#dae2fd] tracking-tight">
              Active Pre-Con RFI Resolution Matrix
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30 font-bold">
              {rfis.filter((r) => r.status !== 'RESOLVED').length} active
            </span>
          </div>
          <p className="text-xs text-[#86948a] mt-1 pl-8">
            Critical architectural clarifications directly gating estimate submission accuracy
          </p>
        </div>

        {/* Filter Tabs & Add Action */}
        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <div className="flex items-center gap-1.5 bg-[#131b2e] p-1 rounded-md border border-[#222a3d]">
            <button
              onClick={() => setFilter('ALL')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                filter === 'ALL'
                  ? 'bg-[#222a3d] text-[#dae2fd] font-bold shadow-sm'
                  : 'text-[#86948a] hover:text-[#dae2fd]'
              }`}
            >
              ALL ({rfis.length})
            </button>
            <button
              onClick={() => setFilter('CRITICAL')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                filter === 'CRITICAL'
                  ? 'bg-[#ff7886]/20 text-[#ffdad6] font-bold border border-[#ff7886]/30'
                  : 'text-[#86948a] hover:text-[#dae2fd]'
              }`}
            >
              CRITICAL ({rfis.filter((r) => r.priority === 'CRITICAL' || r.priority === 'HIGH').length})
            </button>
            <button
              onClick={() => setFilter('AWAITING_GC')}
              className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
                filter === 'AWAITING_GC'
                  ? 'bg-[#222a3d] text-[#dae2fd] font-bold shadow-sm'
                  : 'text-[#86948a] hover:text-[#dae2fd]'
              }`}
            >
              AWAITING GC ({rfis.filter((r) => r.status === 'AWAITING_RESPONSE').length})
            </button>
          </div>

          {onOpenNewRfi && (
            <button
              onClick={onOpenNewRfi}
              id="btn-matrix-new-rfi"
              className="px-2.5 py-1.5 rounded bg-[#4edea3]/15 hover:bg-[#4edea3]/25 border border-[#4edea3]/30 text-[#4edea3] text-xs font-mono font-medium flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add RFI</span>
            </button>
          )}
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#222a3d] bg-[#131b2e]/60 text-[10px] font-mono uppercase tracking-wider text-[#86948a]">
              <th className="py-2.5 px-4 font-semibold">RFI Reference & Subject</th>
              <th className="py-2.5 px-4 font-semibold">Client / Project</th>
              <th className="py-2.5 px-4 font-semibold">Assigned Lead</th>
              <th className="py-2.5 px-4 font-semibold text-right">Status & Priority</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#222a3d]/70 text-xs">
            <AnimatePresence initial={false}>
              {filteredRfis.map((rfi) => (
                <motion.tr
                  key={`${rfi.id}-${rfi.status}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, transition: { duration: 0 } }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  onClick={() => onSelectRfi(rfi)}
                  className="hover:bg-[#1f2942]/60 cursor-pointer transition-colors group"
                >
                  {/* Reference & Subject */}
                  <td className="py-3.5 px-4 max-w-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs font-bold text-[#4edea3] tracking-wide">
                        {rfi.id}
                      </span>
                      <span className="text-[11px] text-[#86948a]">
                        {rfi.submittedTime}
                      </span>
                    </div>
                    <div className="font-semibold text-sm text-[#dae2fd] group-hover:text-white transition-colors">
                      {rfi.title}
                    </div>
                    <div className="text-[11px] text-[#86948a] line-clamp-1 mt-0.5">
                      {rfi.description}
                    </div>
                  </td>

                  {/* Client / Project */}
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-xs text-[#dae2fd]">
                      {rfi.client}
                    </div>
                    <div className="text-[11px] text-[#86948a] mt-0.5">
                      {rfi.project}
                    </div>
                  </td>

                  {/* Assigned Lead */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center font-mono text-[10px] font-bold text-white border border-white/20"
                        style={{ backgroundColor: rfi.assignedLead.avatarColor || '#1e293b' }}
                      >
                        {rfi.assignedLead.initials}
                      </div>
                      <span className="text-xs text-[#dae2fd] font-medium">
                        {rfi.assignedLead.name}
                      </span>
                    </div>
                  </td>

                  {/* Status & Priority */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="flex items-center gap-1.5">
                        {getStatusBadge(rfi)}
                        {onUpdateStatus && (
                          <div
                            className="relative inline-flex items-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <select
                              value={rfi.status}
                              onChange={(e) => {
                                const val = e.target.value as RfiStatus;
                                onUpdateStatus(
                                  rfi.id,
                                  val,
                                  val === 'RESOLVED' ? 'Resolved & incorporated into takeoff package' : undefined
                                );
                              }}
                              title="Quick update status"
                              aria-label={`Change status for ${rfi.id}`}
                              className="bg-[#131b2e] hover:bg-[#1a243b] text-[#86948a] hover:text-[#dae2fd] border border-[#222a3d] text-[10px] font-mono rounded px-1.5 py-0.5 cursor-pointer outline-none transition-colors"
                            >
                              <option value="AWAITING_RESPONSE">Awaiting</option>
                              <option value="DRAFT_READY">Draft</option>
                              <option value="UNDER_REVIEW">Review</option>
                              <option value="RESOLVED">Resolved</option>
                            </select>
                          </div>
                        )}
                      </div>
                      {getPriorityBadge(rfi.priority)}
                      {rfi.resolvedNote && (
                        <span className="text-[10px] text-[#86948a] italic">
                          {rfi.resolvedNote}
                        </span>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
            {filteredRfis.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#86948a] font-mono text-xs">
                  No RFIs matching the selected filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Table Footer: Real-time Sync & Export Actions */}
      <div className="p-3.5 bg-[#131b2e] border-t border-[#222a3d] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-[#86948a]">
          <Smartphone className="w-3.5 h-3.5 text-[#4edea3]" />
          <span>All changes sync directly to estimating takeoff sheets in real-time</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[#86948a] text-[11px]">Export RFI Package:</span>
          <button
            id="btn-export-pdf-log"
            onClick={onExportPdf}
            className="px-2.5 py-1 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] text-[#dae2fd] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileText className="w-3 h-3 text-[#adc6ff]" />
            <span>PDF Log</span>
          </button>
          <button
            id="btn-export-csv-table"
            onClick={onExportCsv}
            className="px-2.5 py-1 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] text-[#dae2fd] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3 h-3 text-[#4edea3]" />
            <span>CSV Table</span>
          </button>
        </div>
      </div>

      {/* CAD Link & Automated Takeoff Delta Card (from screenshot) */}
      <div className="m-3 sm:m-4 p-4 rounded-lg bg-[#131b2e] border border-[#222a3d] hover:border-[#3c4a42] transition-colors relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
          {/* BIM Wireframe Graphic / Preview */}
          <div className="relative w-full lg:w-48 h-28 rounded-md bg-[#0b1326] border border-[#222a3d] overflow-hidden flex items-center justify-center shrink-0">
            {/* Architectural Grid Background with Rebar Overlay */}
            <svg className="w-full h-full opacity-60" viewBox="0 0 200 120">
              <defs>
                <pattern id="cadGrid" width="16" height="16" patternUnits="userSpaceOnUse">
                  <path d="M 16 0 L 0 0 0 16" fill="none" stroke="#222a3d" strokeWidth="0.8" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#cadGrid)" />
              {/* Foundation footprint */}
              <rect x="25" y="20" width="150" height="80" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeDasharray="3 2" />
              {/* Sector B highlighted rebar cage in glowing emerald */}
              <rect x="65" y="35" width="70" height="50" fill="rgba(78,222,163,0.15)" stroke="#4edea3" strokeWidth="2" />
              {/* Rebar crosshatch */}
              <line x1="75" y1="35" x2="75" y2="85" stroke="#4edea3" strokeWidth="1" />
              <line x1="85" y1="35" x2="85" y2="85" stroke="#4edea3" strokeWidth="1" />
              <line x1="95" y1="35" x2="95" y2="85" stroke="#4edea3" strokeWidth="1" />
              <line x1="105" y1="35" x2="105" y2="85" stroke="#4edea3" strokeWidth="1" />
              <line x1="115" y1="35" x2="115" y2="85" stroke="#4edea3" strokeWidth="1" />
              <line x1="125" y1="35" x2="125" y2="85" stroke="#4edea3" strokeWidth="1" />

              <line x1="65" y1="45" x2="135" y2="45" stroke="#4edea3" strokeWidth="1" />
              <line x1="65" y1="55" x2="135" y2="55" stroke="#4edea3" strokeWidth="1" />
              <line x1="65" y1="65" x2="135" y2="65" stroke="#4edea3" strokeWidth="1" />
              <line x1="65" y1="75" x2="135" y2="75" stroke="#4edea3" strokeWidth="1" />

              {/* Node callout */}
              <circle cx="100" cy="60" r="3" fill="#ff7886" />
              <line x1="100" y1="60" x2="150" y2="40" stroke="#ff7886" strokeWidth="1" />
            </svg>

            {/* Overlay label */}
            <div className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#0b1326]/90 border border-[#222a3d] text-[9px] font-mono text-[#4edea3] font-semibold tracking-wider">
              SECTOR B REBAR BIM OVERLAY
            </div>
          </div>

          {/* Description Text */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#3b82f6]/20 text-[#adc6ff] border border-[#3b82f6]/30 uppercase">
                Estimator Insight
              </span>
              <span className="text-[10px] font-mono text-[#4edea3] flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
                CAD Link Active
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#dae2fd] mb-1">
              Automated Quantity Takeoff Revision Ready
            </h3>
            <p className="text-xs text-[#86948a] leading-relaxed">
              <span className="text-[#dae2fd] font-mono">RFI-2024-089</span> has generated a delta model. Accepting the structural schedule revision will automatically update steel tons by <strong className="text-[#4edea3] font-mono font-bold">+31.2 metric tons</strong> in Proposal <span className="text-[#dae2fd] font-mono font-bold">#BID-8849</span>.
            </p>
          </div>

          {/* Action Button & Value */}
          <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-[#222a3d]">
            <button
              id="btn-review-delta-takeoff"
              onClick={onOpenDeltaModal}
              className="px-3.5 py-2 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <span>Review Delta Takeoff</span>
              <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
            <div className="text-[11px] font-mono text-[#4edea3] font-medium">
              Delta Value: +$48,150.00
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
