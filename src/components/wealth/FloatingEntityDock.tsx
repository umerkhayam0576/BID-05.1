import React, { useState } from 'react';
import { CompanyEntity } from '../../types/wealth';

interface FloatingEntityDockProps {
  companies: CompanyEntity[];
  activeEntityId: string | null;
  onSelectEntity: (id: string | null) => void;
  onOpenAddCompany: () => void;
  onOpenRecordCapital: () => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  onSwitchWorkspace?: (ws: 'personal-finance' | 'pre-con-estimating') => void;
  activeWorkspace?: 'personal-finance' | 'pre-con-estimating';
}

export const FloatingEntityDock: React.FC<FloatingEntityDockProps> = ({
  companies,
  activeEntityId,
  onSelectEntity,
  onOpenAddCompany,
  onOpenRecordCapital,
  privacyMode,
  onTogglePrivacy,
  onSwitchWorkspace,
  activeWorkspace,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <aside aria-label="Quick Switcher" className="fixed bottom-5 right-6 z-40 flex items-center gap-2 select-none">
      {/* Floating Speed Dial & Entity Float Dock */}
      {isExpanded ? (
        <div className="flex items-center gap-2 bg-[#060e20]/95 backdrop-blur-xl border border-[#2d3449] p-1.5 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.45)] ring-1 ring-[#4edea3]/20 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Label Pill */}
          <div className="flex items-center gap-1.5 pl-3 pr-2 py-1 text-xs font-mono font-bold text-[#bbcabf] border-r border-[#222a3d]">
            <span className="material-symbols-outlined text-sm text-[#4edea3]">hub</span>
            <span className="hidden sm:inline text-[11px] uppercase tracking-wider">Float Dock</span>
          </div>

          {/* Consolidated Personal Hub Icon */}
          <button
            type="button"
            onClick={() => onSelectEntity(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition-all cursor-pointer ${
              activeEntityId === null
                ? 'bg-[#10b981] text-[#003824] shadow-md ring-2 ring-[#4edea3]/40'
                : 'text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#171f33]'
            }`}
            title="Consolidated Personal Wealth Overview"
          >
            <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
            <span className="truncate max-w-[110px]">Personal Hub</span>
          </button>

          {/* Company Quick-Float Buttons */}
          <div className="flex items-center gap-1 max-w-[340px] overflow-x-auto py-0.5">
            {companies.map((company) => {
              const isSelected = activeEntityId === company.id;
              const shortName = company.name.split(' ')[0];
              return (
                <button
                  key={company.id}
                  type="button"
                  onClick={() => onSelectEntity(company.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer shrink-0 ${
                    isSelected
                      ? 'bg-[#222a3d] text-[#4edea3] border border-[#4edea3] shadow-md font-bold'
                      : 'text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#131b2e]'
                  }`}
                  title={`${company.name} (${company.legalOwnershipPercent}% equity • $${(company.equityPositionValue / 1000).toFixed(0)}k)`}
                >
                  <span className={`material-symbols-outlined text-xs ${
                    company.color === 'primary' ? 'text-[#4edea3]' : company.color === 'secondary' ? 'text-[#adc6ff]' : 'text-[#ffb2b7]'
                  }`}>
                    {company.icon}
                  </span>
                  <span>{shortName}</span>
                  <span className="text-[10px] text-[#bbcabf] opacity-80">
                    {company.legalOwnershipPercent}%
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Add Company Button inside dock */}
          <button
            type="button"
            onClick={onOpenAddCompany}
            className="flex items-center gap-1 p-1.5 rounded-full text-xs font-mono font-bold text-[#4edea3] hover:bg-[#10b981]/20 border border-dashed border-[#4edea3]/40 transition-colors"
            title="Add Another Company Entity"
          >
            <span className="material-symbols-outlined text-sm">add</span>
            <span className="hidden md:inline pr-1 text-[11px]">+ Company</span>
          </button>

          {/* Record Quick Action */}
          <button
            type="button"
            onClick={onOpenRecordCapital}
            className="p-1.5 rounded-full text-[#dae2fd] hover:bg-[#171f33] transition-colors"
            title="Record Capital or Distribution"
          >
            <span className="material-symbols-outlined text-sm text-[#4edea3]">add_card</span>
          </button>

          {/* Privacy Blur Toggle */}
          <button
            type="button"
            onClick={onTogglePrivacy}
            className={`p-1.5 rounded-full transition-colors ${
              privacyMode ? 'text-[#4edea3] bg-[#10b981]/20' : 'text-[#bbcabf] hover:text-[#dae2fd] hover:bg-[#171f33]'
            }`}
            title={privacyMode ? 'Disable Privacy Mode (Show Figures)' : 'Enable Privacy Mode (Mask Balances)'}
          >
            <span className="material-symbols-outlined text-sm">
              {privacyMode ? 'visibility_off' : 'visibility'}
            </span>
          </button>

          {/* Minimize toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(false)}
            className="p-1 text-[#bbcabf] hover:text-[#dae2fd] rounded-full hover:bg-[#171f33] transition-colors"
            title="Minimize Dock"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 bg-[#060e20]/95 backdrop-blur-xl border border-[#2d3449] hover:border-[#4edea3] px-3.5 py-2 rounded-full shadow-2xl text-xs font-mono font-bold text-[#4edea3] transition-all cursor-pointer hover:scale-105"
        >
          <span className="material-symbols-outlined text-sm animate-pulse">hub</span>
          <span>Float Workspace Dock ({companies.length + 1})</span>
        </button>
      )}
    </aside>
  );
};
