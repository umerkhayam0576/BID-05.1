import React from 'react';
import { CompanyEntity, KeyWealthMetrics } from '../../types/wealth';

interface WealthExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: CompanyEntity[];
  metrics: KeyWealthMetrics;
  selectedPeriod: string;
}

export const WealthExportPdfModal: React.FC<WealthExportPdfModalProps> = ({
  isOpen,
  onClose,
  companies,
  metrics,
  selectedPeriod,
}) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const totalEquity = companies.reduce((acc, c) => acc + c.equityPositionValue, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#2d3449] w-full max-w-3xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-[#222a3d] flex items-center justify-between bg-[#060e20]">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3]">picture_as_pdf</span>
            <h3 className="text-sm font-bold text-[#dae2fd] font-['Manrope']">
              Consolidated Personal Wealth & Multi-Company Statement
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-[#10b981] hover:bg-[#059669] text-[#003824] rounded text-xs font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">print</span>
              <span>Print / Download PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#171f33] rounded transition-colors"
            >
              <span className="material-symbols-outlined text-base">close</span>
            </button>
          </div>
        </div>

        {/* Printable Preview Body */}
        <div className="p-8 overflow-y-auto bg-[#0b1326] text-[#dae2fd] space-y-6 font-mono text-xs">
          {/* Document Header */}
          <div className="border-b border-[#222a3d] pb-4 flex justify-between items-start">
            <div>
              <div className="text-base font-bold font-['Manrope'] text-[#4edea3]">ExactLedger WealthCommand OS</div>
              <div className="text-sm font-semibold text-[#dae2fd]">Executive Financial & Entity Audit Statement</div>
              <div className="text-[11px] text-[#bbcabf]">Prepared for: Sarah Jenkins / Umer (Principal)</div>
            </div>
            <div className="text-right text-[11px] text-[#bbcabf]">
              <div>Reporting Period: {selectedPeriod}</div>
              <div>Generated: {new Date().toLocaleDateString()}</div>
              <div className="text-[#4edea3] font-bold">100% GAAP Isolated Books</div>
            </div>
          </div>

          {/* Executive Totals */}
          <div className="grid grid-cols-3 gap-4 p-4 bg-[#131b2e] rounded-lg border border-[#222a3d]">
            <div>
              <span className="text-[10px] text-[#bbcabf] uppercase block">Personal Net Worth</span>
              <span className="text-lg font-bold text-[#dae2fd]">${metrics.personalNetWorth.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#bbcabf] uppercase block">Personal Cash</span>
              <span className="text-lg font-bold text-[#4edea3]">${metrics.personalCash.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#bbcabf] uppercase block">Company Interests</span>
              <span className="text-lg font-bold text-[#4edea3]">${totalEquity.toLocaleString()}</span>
            </div>
          </div>

          {/* Connected Companies Matrix */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-[#dae2fd] uppercase">Connected Operating Companies</span>
            <table className="w-full text-left text-xs">
              <thead className="bg-[#131b2e] text-[#bbcabf] uppercase text-[10px]">
                <tr>
                  <th className="py-2 px-3">Entity</th>
                  <th className="py-2 px-3 text-right">Legal Own %</th>
                  <th className="py-2 px-3 text-right">Profit Tier %</th>
                  <th className="py-2 px-3 text-right">Valuation</th>
                  <th className="py-2 px-3 text-right">Your Equity</th>
                  <th className="py-2 px-3 text-right">Distributions YTD</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222a3d]">
                {companies.map((c) => (
                  <tr key={c.id}>
                    <td className="py-2 px-3 font-semibold text-[#dae2fd]">{c.name}</td>
                    <td className="py-2 px-3 text-right text-[#dae2fd]">{c.legalOwnershipPercent}%</td>
                    <td className="py-2 px-3 text-right text-[#4edea3]">{c.profitSharePercent}%</td>
                    <td className="py-2 px-3 text-right text-[#bbcabf]">${c.enterpriseValuation.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right font-bold text-[#4edea3]">${c.equityPositionValue.toLocaleString()}</td>
                    <td className="py-2 px-3 text-right text-[#dae2fd]">${c.distributionsReceived.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legal Compliance Footer */}
          <div className="text-[10px] text-[#bbcabf] pt-4 border-t border-[#222a3d] leading-relaxed">
            CONFIDENTIAL: This statement consolidates individual personal wealth assets with direct equity interests in distinct operating legal entities. Company revenues and retained corporate cash reserves remain isolated under corporate governance laws and do not constitute personal gross income until formally declared and distributed by board resolution.
          </div>
        </div>
      </div>
    </div>
  );
};
