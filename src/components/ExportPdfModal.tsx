import React from 'react';
import { X, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import { RfiItem } from '../types';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  rfis: RfiItem[];
}

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  rfis,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#222a3d] flex items-center justify-between bg-[#171f33]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#4edea3]" />
            <h3 className="text-sm font-bold text-[#dae2fd]">
              Pre-Construction RFI Transmittal & Resolution Log (PDF Package)
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-[#dae2fd] flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* PDF Simulated Sheet Preview */}
        <div className="p-6 overflow-y-auto bg-[#0b1326] text-[#dae2fd] font-mono text-xs space-y-4">
          {/* Document Letterhead */}
          <div className="border-b-2 border-[#4edea3] pb-4 flex justify-between items-start">
            <div>
              <div className="text-lg font-bold tracking-tight text-white">
                BID EXACT LLC
              </div>
              <div className="text-[10px] text-[#4edea3] font-semibold tracking-widest uppercase">
                Pre-Construction Estimating Tech & Quantity Reconciliation
              </div>
              <div className="text-[11px] text-[#86948a] mt-1">
                Transmittal Log #RFI-LOG-2024-Q3
              </div>
            </div>
            <div className="text-right text-[11px] text-[#86948a]">
              <div>Date: {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
              <div>Period: Q3 2024 Active Cycle</div>
              <div className="text-[#4edea3] font-bold">CSI MasterFormat Compliant</div>
            </div>
          </div>

          {/* Table */}
          <table className="w-full text-left border border-[#222a3d] text-[11px]">
            <thead className="bg-[#171f33] text-[#86948a] border-b border-[#222a3d]">
              <tr>
                <th className="p-2">RFI ID</th>
                <th className="p-2">Subject / Scope</th>
                <th className="p-2">Client / Project</th>
                <th className="p-2">CSI Division</th>
                <th className="p-2">Status</th>
                <th className="p-2 text-right">Delta ($)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d]">
              {rfis.map((r) => (
                <tr key={r.id}>
                  <td className="p-2 text-[#4edea3] font-bold">{r.id}</td>
                  <td className="p-2 font-medium text-white">{r.title}</td>
                  <td className="p-2 text-[#bbcabf]">{r.client}</td>
                  <td className="p-2 text-[#adc6ff]">{r.csiDivision?.split(' ')[0]}</td>
                  <td className="p-2">
                    <span className="px-1.5 py-0.5 rounded bg-[#171f33] text-[10px] border border-[#2d3449]">
                      {r.statusLabel}
                    </span>
                  </td>
                  <td className="p-2 text-right font-bold text-[#4edea3]">
                    {r.deltaCost ? `+$${r.deltaCost.toLocaleString()}` : '$0'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Signoff block */}
          <div className="pt-4 border-t border-[#222a3d] flex justify-between text-[10px] text-[#86948a]">
            <div>
              Certified by: <strong className="text-white">Marcus Vance</strong>, Managing Principal
            </div>
            <div>
              Generated via Bid Exact Accuracy Guarantee Engine
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
