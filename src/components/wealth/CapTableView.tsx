import React, { useState } from 'react';
import { CompanyEntity } from '../../types/wealth';

interface CapTableViewProps {
  companies: CompanyEntity[];
  onSelectEntity: (id: string) => void;
  privacyMode: boolean;
}

export const CapTableView: React.FC<CapTableViewProps> = ({
  companies,
  onSelectEntity,
  privacyMode,
}) => {
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '');
  const [newInvestmentAmount, setNewInvestmentAmount] = useState<number>(250000);
  const [newPostMoneyValuation, setNewPostMoneyValuation] = useState<number>(2000000);

  const selectedCompany = companies.find((c) => c.id === selectedCompanyId) || companies[0];

  const mask = (val: number) => {
    if (privacyMode) return '$••••••';
    return `$${val.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  };

  // Simulation: Dilution calculation
  const dilutionFactor = selectedCompany
    ? Math.max(0, 1 - newInvestmentAmount / newPostMoneyValuation)
    : 1;

  return (
    <div className="flex flex-col w-full px-6 py-6 space-y-6 pb-24 font-mono">
      {/* Header */}
      <div className="bg-[#060e20] p-6 rounded-xl border border-[#222a3d] flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#4edea3] text-2xl">pie_chart</span>
            <h1 className="font-['Manrope'] font-bold text-2xl text-[#dae2fd]">
              Consolidated Cap Tables & Ownership Registry
            </h1>
          </div>
          <p className="text-xs text-[#bbcabf] mt-1">
            Formal Schedule A equity ownership, voting rights, and dilution modeling across all corporate entities.
          </p>
        </div>

        {/* Company Picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs text-[#bbcabf]">Select Entity:</label>
          <select
            value={selectedCompanyId}
            onChange={(e) => setSelectedCompanyId(e.target.value)}
            className="bg-[#131b2e] border border-[#2d3449] text-[#dae2fd] text-xs px-3 py-2 rounded focus:border-[#4edea3] outline-none"
          >
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.legalOwnershipPercent}% equity)
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCompany && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          {/* Left 8 Cols: Schedule A Cap Table */}
          <div className="xl:col-span-8 bg-[#131b2e] border border-[#222a3d] rounded-xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-['Manrope'] font-bold text-lg text-[#dae2fd]">
                  {selectedCompany.name} Schedule A Cap Table
                </h2>
                <span className="text-xs text-[#bbcabf]">
                  Legal entity valuation: {mask(selectedCompany.enterpriseValuation)} • Effective Jan 1, 2026
                </span>
              </div>
              <button
                type="button"
                onClick={() => onSelectEntity(selectedCompany.id)}
                className="text-xs text-[#4edea3] hover:underline flex items-center gap-1"
              >
                <span>Open Entity Workspace</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Visual Ownership Bar */}
            <div className="space-y-1.5">
              <span className="text-xs text-[#bbcabf]">Equity Distribution:</span>
              <div className="h-5 w-full bg-[#0b1326] rounded-full overflow-hidden flex p-0.5 border border-[#222a3d]">
                {selectedCompany.capTable.map((member, idx) => (
                  <div
                    key={idx}
                    style={{ width: `${member.percentage}%` }}
                    className={`h-full first:rounded-l-full last:rounded-r-full transition-all ${
                      idx === 0
                        ? 'bg-[#10b981]'
                        : idx === 1
                        ? 'bg-[#0566d9]'
                        : 'bg-[#ff7886]'
                    }`}
                    title={`${member.name}: ${member.percentage}%`}
                  ></div>
                ))}
              </div>
              <div className="flex flex-wrap gap-4 text-xs pt-1 text-[#bbcabf]">
                {selectedCompany.capTable.map((member, idx) => (
                  <div key={idx} className="flex items-center gap-1.5">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        idx === 0
                          ? 'bg-[#10b981]'
                          : idx === 1
                          ? 'bg-[#0566d9]'
                          : 'bg-[#ff7886]'
                      }`}
                    ></span>
                    <span className="text-[#dae2fd]">{member.name}:</span>
                    <span className="font-bold text-[#4edea3]">{member.percentage}%</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0b1326] text-[#bbcabf] uppercase text-[10px]">
                  <tr>
                    <th className="py-2.5 px-3">Shareholder Name</th>
                    <th className="py-2.5 px-3">Governance Role</th>
                    <th className="py-2.5 px-3 text-right">Ownership %</th>
                    <th className="py-2.5 px-3 text-right">Capital Committed</th>
                    <th className="py-2.5 px-3 text-right">Implied Fair Value</th>
                    <th className="py-2.5 px-3 text-center">Voting Rights</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222a3d]">
                  {selectedCompany.capTable.map((member, idx) => (
                    <tr key={idx} className="hover:bg-[#171f33] transition-colors">
                      <td className="py-3 px-3 font-semibold text-[#dae2fd]">{member.name}</td>
                      <td className="py-3 px-3 text-[#bbcabf]">{member.role}</td>
                      <td className="py-3 px-3 text-right font-bold text-[#4edea3]">
                        {member.percentage}%
                      </td>
                      <td className="py-3 px-3 text-right text-[#bbcabf]">
                        {mask(member.initialInvestment)}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold text-[#dae2fd]">
                        {mask((selectedCompany.enterpriseValuation * member.percentage) / 100)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {member.votingRights ? (
                          <span className="text-[#4edea3] font-bold">Yes</span>
                        ) : (
                          <span className="text-[#bbcabf]">No</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right 4 Cols: Dilution & Financing Round Simulator */}
          <div className="xl:col-span-4 bg-[#131b2e] border border-[#222a3d] rounded-xl p-6 space-y-5">
            <div>
              <h2 className="font-['Manrope'] font-bold text-base text-[#dae2fd] flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[#4edea3] text-lg">science</span>
                <span>Financing & Dilution Simulator</span>
              </h2>
              <p className="text-xs text-[#bbcabf] mt-0.5">Model the impact of a capital raise or SAFE notes.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-[#bbcabf] block">New Round Size ($):</label>
                <input
                  type="number"
                  step="25000"
                  value={newInvestmentAmount}
                  onChange={(e) => setNewInvestmentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0b1326] border border-[#2d3449] rounded px-3 py-2 text-[#dae2fd] outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[#bbcabf] block">Target Post-Money Valuation ($):</label>
                <input
                  type="number"
                  step="50000"
                  value={newPostMoneyValuation}
                  onChange={(e) => setNewPostMoneyValuation(parseFloat(e.target.value) || 0)}
                  className="w-full bg-[#0b1326] border border-[#2d3449] rounded px-3 py-2 text-[#dae2fd] outline-none"
                />
              </div>

              {/* Simulation Result */}
              <div className="p-4 bg-[#060e20] border border-[#3c4a42] rounded-lg space-y-3">
                <span className="text-[10px] text-[#4edea3] uppercase font-bold block">
                  Simulated Post-Round Outcome:
                </span>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-[#bbcabf]">Your Pre-Round Ownership:</span>
                    <span className="text-[#dae2fd] font-bold">{selectedCompany.legalOwnershipPercent}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#bbcabf]">Your Post-Round Ownership:</span>
                    <span className="text-[#4edea3] font-bold">
                      {(selectedCompany.legalOwnershipPercent * dilutionFactor).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#bbcabf]">Your Pre-Round Value:</span>
                    <span className="text-[#dae2fd]">{mask(selectedCompany.equityPositionValue)}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-[#222a3d]">
                    <span className="text-[#bbcabf]">Your Post-Round Value:</span>
                    <span className="text-[#4edea3] font-bold">
                      {mask((newPostMoneyValuation * selectedCompany.legalOwnershipPercent * dilutionFactor) / 100)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
