import React from 'react';
import { CompanyEntity, WealthNavTabId } from '../../types/wealth';

interface WealthSidebarProps {
  activeTab: WealthNavTabId;
  onSelectTab: (tab: WealthNavTabId) => void;
  activeEntityId: string | null; // null = Consolidated Hub, or company id
  onSelectEntity: (entityId: string | null) => void;
  companies: CompanyEntity[];
  onOpenAddCompany: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const WealthSidebar: React.FC<WealthSidebarProps> = ({
  activeTab,
  onSelectTab,
  activeEntityId,
  onSelectEntity,
  companies,
  onOpenAddCompany,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const handleSelectTab = (tab: WealthNavTabId) => {
    onSelectTab(tab);
    onCloseMobile?.();
  };

  const handleSelectEntity = (entityId: string | null) => {
    onSelectEntity(entityId);
    onCloseMobile?.();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#131b2e] border-r border-[#222a3d] select-none justify-between">
      <div className="flex flex-col h-full overflow-hidden">
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between shrink-0 bg-[#060e20]">
          <div 
            onClick={() => {
              handleSelectEntity(null);
              handleSelectTab('personal-financial-overview');
            }}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity"
          >
            <div className="h-8 w-8 rounded bg-gradient-to-br from-[#10b981] to-[#047857] flex items-center justify-center text-[#002113] shadow-sm font-bold">
              <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
            </div>
            <div className="flex flex-col">
              <span className="font-['Manrope'] font-semibold text-base text-[#dae2fd] leading-tight tracking-tight">
                ExactLedger
              </span>
              <span className="font-mono text-[10px] font-bold text-[#4edea3] tracking-widest uppercase">
                WealthCommand OS
              </span>
            </div>
          </div>

          {onCloseMobile && (
            <button
              type="button"
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 text-[#bbcabf] hover:text-white rounded hover:bg-[#171f33] transition-colors"
              aria-label="Close navigation"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>
          )}
        </div>

        {/* Navigation Sections */}
        <div className="overflow-y-auto flex-1 py-3 px-2 space-y-3">
          {/* Section 1: Consolidated Hub */}
          <div className="space-y-0.5">
            <div className="px-2 py-1 font-mono text-[10px] font-bold text-[#bbcabf] uppercase tracking-wider">
              Consolidated Hub
            </div>
            <nav className="flex flex-col space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('personal-financial-overview');
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'personal-financial-overview'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                <span className="truncate">Personal Financial Overview</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('multi-company-portfolio');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'multi-company-portfolio'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-sm">domain</span>
                  <span className="truncate">Multi-Company Portfolio</span>
                </div>
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-bold ${
                  activeEntityId === null && activeTab === 'multi-company-portfolio'
                    ? 'bg-[#003824]/20 text-[#003824]'
                    : 'bg-[#222a3d] text-[#dae2fd]'
                }`}>
                  {companies.length} Entities
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('ownership-and-cap-tables');
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'ownership-and-cap-tables'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">pie_chart</span>
                <span className="truncate">Ownership & Cap Tables</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('profit-share-and-attributions');
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'profit-share-and-attributions'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">query_stats</span>
                <span className="truncate">Profit Share & Attributions</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('distribution-ledger');
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'distribution-ledger'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">receipt_long</span>
                <span className="truncate">Distribution Ledger</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('capital-contributions-and-loans');
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'capital-contributions-and-loans'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">swap_horizontal_circle</span>
                <span className="truncate">Capital Contributions & Loans</span>
              </button>
            </nav>
          </div>

          {/* Section 2: Personal Wealth */}
          <div className="space-y-0.5">
            <div className="px-2 py-1 font-mono text-[10px] font-bold text-[#bbcabf] uppercase tracking-wider">
              Personal Wealth
            </div>
            <nav className="flex flex-col space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('bank-and-liquid-cash');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'bank-and-liquid-cash'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-sm">payments</span>
                  <span className="truncate">Bank & Liquid Cash</span>
                </div>
                <span className="font-mono text-xs text-[#dae2fd]">$100k</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('investment-portfolios');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'investment-portfolios'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-sm">trending_up</span>
                  <span className="truncate">Investment Portfolios</span>
                </div>
                <span className="font-mono text-xs text-[#dae2fd]">$200k</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('real-estate-and-property');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'real-estate-and-property'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="material-symbols-outlined text-sm">apartment</span>
                  <span className="truncate">Real Estate & Property</span>
                </div>
                <span className="font-mono text-xs text-[#dae2fd]">$300k</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('personal-liabilities-and-debt');
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'personal-liabilities-and-debt'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">credit_card</span>
                <span className="truncate">Personal Liabilities & Debt</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('personal-cash-flow');
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'personal-cash-flow'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">waterfall_chart</span>
                <span className="truncate">Personal Cash Flow</span>
              </button>
            </nav>
          </div>

          {/* Section 3: Connected Companies (Dynamic list + Add Company) */}
          <div className="space-y-0.5">
            <div className="px-2 py-1 flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-[#bbcabf] uppercase tracking-wider">
                Connected Companies
              </span>
              <button
                type="button"
                onClick={() => {
                  onOpenAddCompany();
                  onCloseMobile?.();
                }}
                className="text-[10px] font-mono font-bold text-[#4edea3] hover:text-[#6ffbbe] flex items-center gap-0.5 hover:underline"
                title="Add New Entity"
              >
                <span className="material-symbols-outlined text-xs">add</span>
                <span>ADD</span>
              </button>
            </div>
            <nav className="flex flex-col space-y-0.5">
              {companies.map((company) => {
                const isSelected = activeEntityId === company.id;
                return (
                  <button
                    key={company.id}
                    type="button"
                    onClick={() => handleSelectEntity(company.id)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-colors text-left text-sm group ${
                      isSelected
                        ? 'bg-[#222a3d] text-[#dae2fd] border-l-2 border-[#4edea3]'
                        : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className={`material-symbols-outlined text-sm ${
                        company.color === 'primary' ? 'text-[#4edea3]' : company.color === 'secondary' ? 'text-[#adc6ff]' : 'text-[#ffb2b7]'
                      }`}>
                        {company.icon}
                      </span>
                      <span className="truncate">{company.name}</span>
                    </div>
                    <span className={`font-mono text-[10px] font-medium shrink-0 ${
                      company.roleType === 'full-signatory'
                        ? 'text-[#4edea3]'
                        : company.roleType === 'board-observer'
                        ? 'text-[#adc6ff]'
                        : 'text-[#bbcabf]'
                    }`}>
                      {company.roleBadge}
                    </span>
                  </button>
                );
              })}

              {/* Quick Add Company Button inside list */}
              <button
                type="button"
                onClick={() => {
                  onOpenAddCompany();
                  onCloseMobile?.();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-left text-xs font-mono text-[#4edea3] hover:bg-[#171f33] border border-dashed border-[#4edea3]/30 hover:border-[#4edea3]/60 transition-colors mt-1"
              >
                <span className="material-symbols-outlined text-xs">add_business</span>
                <span className="font-semibold">+ Add Company Entity</span>
              </button>
            </nav>
          </div>

          {/* Section 4: Compliance & Legal */}
          <div className="space-y-0.5">
            <div className="px-2 py-1 font-mono text-[10px] font-bold text-[#bbcabf] uppercase tracking-wider">
              Compliance & Legal
            </div>
            <nav className="flex flex-col space-y-0.5">
              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('ownership-agreements-and-docs');
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'ownership-agreements-and-docs'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">description</span>
                <span className="truncate">Ownership Agreements & Docs</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('valuations-and-cap-history');
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'valuations-and-cap-history'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">history_edu</span>
                <span className="truncate">Valuations & Cap History</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('audit-trail-and-change-logs');
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'audit-trail-and-change-logs'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">fingerprint</span>
                <span className="truncate">Audit Trail & Change Logs</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  handleSelectEntity(null);
                  handleSelectTab('settings-and-rbac-permissions');
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded transition-colors text-left text-sm ${
                  activeEntityId === null && activeTab === 'settings-and-rbac-permissions'
                    ? 'bg-[#10b981] text-[#003824] font-semibold'
                    : 'text-[#bbcabf] hover:bg-[#171f33] hover:text-[#dae2fd]'
                }`}
              >
                <span className="material-symbols-outlined text-sm">admin_panel_settings</span>
                <span className="truncate">Settings & RBAC Permissions</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Bottom Status Footer */}
        <div className="p-2 bg-[#060e20] shrink-0 border-t border-[#222a3d]">
          <div className="flex items-center justify-between px-2 py-1.5 rounded bg-[#131b2e]">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#4edea3]"></span>
              <span className="font-mono text-[10px] text-[#bbcabf] uppercase font-semibold">
                Accounting Books Isolated
              </span>
            </div>
            <span className="font-mono text-[10px] font-bold text-[#4edea3]">100% GAAP</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-full w-72 bg-[#131b2e] z-50 flex-col justify-between shadow-[0_1px_8px_rgba(0,0,0,0.25)] border-r border-[#222a3d] select-none">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer with Backdrop */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          {/* Drawer */}
          <div className="relative z-10 w-72 max-w-[85vw] h-full shadow-2xl animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
