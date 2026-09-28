import React, { useState, useEffect } from 'react';
import {
  CompanyEntity,
  KeyWealthMetrics,
  LedgerEvent,
  GovernanceChangeRequest,
  WealthNavTabId,
} from '../../types/wealth';
import {
  INITIAL_COMPANIES,
  INITIAL_WEALTH_METRICS,
  INITIAL_LEDGER_EVENTS,
  INITIAL_GOVERNANCE_REQUESTS,
} from '../../data/wealthData';

// Layout and Views
import { WealthSidebar } from '../wealth/WealthSidebar';
import { WealthTopHeader } from '../wealth/WealthTopHeader';
import { WealthCommandDashboard } from '../wealth/WealthCommandDashboard';
import { CompanyWorkspaceView } from '../wealth/CompanyWorkspaceView';
import { MultiCompanyPortfolioView } from '../wealth/MultiCompanyPortfolioView';
import { CapTableView } from '../wealth/CapTableView';
import { WealthSecondaryViews } from '../wealth/WealthSecondaryViews';

// Modals
import { AddCompanyModal } from '../wealth/AddCompanyModal';
import { RecordCapitalModal } from '../wealth/RecordCapitalModal';
import { ReviewGovernanceModal } from '../wealth/ReviewGovernanceModal';
import { WealthExportPdfModal } from '../wealth/WealthExportPdfModal';
import { WealthAuditLogModal } from '../wealth/WealthAuditLogModal';
import { GlobalSearchModal } from '../wealth/GlobalSearchModal';
import { FinanceWorkflowView } from './FinanceWorkflowView';
import { PersonalAccountsView } from './PersonalAccountsView';
import { PersonalTransactionsView } from './PersonalTransactionsView';
import { PersonalAssetsView } from './PersonalAssetsView';
import { PersonalLiabilitiesView } from './PersonalLiabilitiesView';
import { PersonalPropertiesView } from './PersonalPropertiesView';

interface PersonalFinanceHubProps {
  onSwitchWorkspace: (ws: 'personal-finance' | 'pre-con-estimating') => void;
  onOpenStudio: () => void;
  activeWorkspace: 'personal-finance' | 'pre-con-estimating';
  onLogout: () => void;
}

export const PersonalFinanceHub: React.FC<PersonalFinanceHubProps> = ({
  onSwitchWorkspace,
  onOpenStudio,
  activeWorkspace,
  onLogout,
}) => {
  const [companies, setCompanies] = useState<CompanyEntity[]>(() => {
    const saved = localStorage.getItem('bid_exact_wealth_companies');
    return saved ? JSON.parse(saved) : INITIAL_COMPANIES;
  });

  const [metrics, setMetrics] = useState<KeyWealthMetrics>(() => {
    const saved = localStorage.getItem('bid_exact_wealth_metrics');
    return saved ? JSON.parse(saved) : INITIAL_WEALTH_METRICS;
  });

  const [ledgerEvents, setLedgerEvents] = useState<LedgerEvent[]>(() => {
    const saved = localStorage.getItem('bid_exact_wealth_ledger');
    return saved ? JSON.parse(saved) : INITIAL_LEDGER_EVENTS;
  });

  const [governanceRequests, setGovernanceRequests] = useState<GovernanceChangeRequest[]>(() => {
    const saved = localStorage.getItem('bid_exact_wealth_governance');
    return saved ? JSON.parse(saved) : INITIAL_GOVERNANCE_REQUESTS;
  });

  const [activeEntityId, setActiveEntityId] = useState<string | null>(() => {
    const saved = localStorage.getItem('bid_exact_wealth_active_entity');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<WealthNavTabId>('personal-financial-overview');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('Q3 2026 (Active Closed Period)');
  const [privacyMode, setPrivacyMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('bid_exact_wealth_privacy');
    return saved ? JSON.parse(saved) : false;
  });

  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isRecordCapitalOpen, setIsRecordCapitalOpen] = useState(false);
  const [isReviewGovOpen, setIsReviewGovOpen] = useState(false);
  const [selectedGovRequest, setSelectedGovRequest] = useState<GovernanceChangeRequest | null>(null);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('bid_exact_wealth_companies', JSON.stringify(companies));
  }, [companies]);

  // Tenant source of truth: company workspaces come from the SaaS API.
  // Keep existing local company data only as presentation/finance metadata; never use
  // the legacy UI id as the tenant identity for secured backend requests.
  useEffect(() => {
    let cancelled = false;

    const loadWorkspaceCompanies = async () => {
      try {
        const response = await fetch('/api/entities', { credentials: 'include' });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok || !Array.isArray(payload.entities)) {
          throw new Error(payload.error || 'Unable to load company workspaces');
        }

        const serverEntities = payload.entities as Array<{
          id: string;
          name: string;
          legalStructure?: string;
          industryType?: string;
          ownershipPercent?: string | number;
          profitSharePercent?: string | number;
          membershipRole?: string;
        }>;

        if (cancelled) return;

        setCompanies((currentCompanies) =>
          serverEntities.map((entity, index) => {
            const existing = currentCompanies.find(
              (company) =>
                company.workspaceId === entity.id ||
                company.name.trim().toLowerCase() === entity.name.trim().toLowerCase()
            );

            const ownershipPercent = Number(entity.ownershipPercent ?? existing?.legalOwnershipPercent ?? 0);
            const profitSharePercent = Number(entity.profitSharePercent ?? existing?.profitSharePercent ?? 0);
            const valuation = existing?.enterpriseValuation ?? 0;
            const netProfit = existing?.companyNetProfit ?? 0;

            return {
              ...(existing || INITIAL_COMPANIES[0]),
              id: existing?.id || 'workspace-' + entity.id,
              workspaceId: entity.id,
              name: entity.name,
              industry: entity.industryType || existing?.industry || 'Services',
              role: entity.membershipRole || existing?.role || 'Member',
              legalOwnershipPercent: ownershipPercent,
              profitSharePercent,
              enterpriseValuation: valuation,
              companyNetProfit: netProfit,
              equityPositionValue: (valuation * ownershipPercent) / 100,
              attributedProfit: (netProfit * profitSharePercent) / 100,
              statusBadge: existing?.statusBadge || 'ACTIVE',
              roleBadge: existing?.roleBadge || (entity.membershipRole || 'MEMBER').toUpperCase(),
              ownershipType: existing?.ownershipType || entity.legalStructure || 'Other',
              profitTierDescription: existing?.profitTierDescription || 'Workspace profit share',
              distributionsReceived: existing?.distributionsReceived ?? 0,
              distributionsPending: existing?.distributionsPending ?? 0,
              contributedCapital: existing?.contributedCapital ?? 0,
              icon: existing?.icon || 'building',
              color: existing?.color || (index % 2 === 0 ? 'primary' : 'secondary'),
              capTable: existing?.capTable || [],
            } as CompanyEntity;
          })
        );
      } catch (error) {
        // Keep the last local snapshot visible if the workspace API is temporarily unavailable.
        // Ownership & Legal will still refuse tenant-scoped requests without workspaceId.
        console.error('Unable to load SaaS company workspaces', error);
      }
    };

    loadWorkspaceCompanies();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('bid_exact_wealth_metrics', JSON.stringify(metrics));
  }, [metrics]);

  useEffect(() => {
    localStorage.setItem('bid_exact_wealth_ledger', JSON.stringify(ledgerEvents));
  }, [ledgerEvents]);

  useEffect(() => {
    localStorage.setItem('bid_exact_wealth_governance', JSON.stringify(governanceRequests));
  }, [governanceRequests]);

  useEffect(() => {
    localStorage.setItem('bid_exact_wealth_active_entity', JSON.stringify(activeEntityId));
  }, [activeEntityId]);

  useEffect(() => {
    localStorage.setItem('bid_exact_wealth_privacy', JSON.stringify(privacyMode));
  }, [privacyMode]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectEntity = (id: string | null) => {
    setActiveEntityId(id);
    if (id) {
      setActiveTab('personal-financial-overview');
    }
  };

  const handleAddCompany = (
    newCompanyData: Omit<CompanyEntity, 'id' | 'equityPositionValue' | 'attributedProfit'>
  ) => {
    const equityValue = (newCompanyData.enterpriseValuation * newCompanyData.legalOwnershipPercent) / 100;
    const attrProfit = (newCompanyData.companyNetProfit * newCompanyData.profitSharePercent) / 100;

    const newCompany: CompanyEntity = {
      ...newCompanyData,
      id: `comp-${Date.now()}`,
      equityPositionValue: equityValue,
      attributedProfit: attrProfit,
    };

    setCompanies((prev) => [...prev, newCompany]);
    setMetrics((prev) => ({
      ...prev,
      personalNetWorth: prev.personalNetWorth + equityValue,
      companyInterests: prev.companyInterests + equityValue,
      capitalInvested: prev.capitalInvested + newCompanyData.contributedCapital,
      profitAttributed: prev.profitAttributed + attrProfit,
      distributionsReceived: prev.distributionsReceived + newCompanyData.distributionsReceived,
    }));
    setActiveEntityId(newCompany.id);
  };

  const handleDeleteCompany = (id: string) => {
    const toRemove = companies.find((c) => c.id === id);
    if (!toRemove) return;

    setCompanies((prev) => prev.filter((c) => c.id !== id));
    if (activeEntityId === id) {
      setActiveEntityId(null);
    }
    setMetrics((prev) => ({
      ...prev,
      personalNetWorth: Math.max(0, prev.personalNetWorth - toRemove.equityPositionValue),
      companyInterests: Math.max(0, prev.companyInterests - toRemove.equityPositionValue),
      capitalInvested: Math.max(0, prev.capitalInvested - toRemove.contributedCapital),
      profitAttributed: Math.max(0, prev.profitAttributed - toRemove.attributedProfit),
    }));
  };

  const handleRecordCapital = (eventData: Omit<LedgerEvent, 'id'>) => {
    const newEvent: LedgerEvent = {
      ...eventData,
      id: `evt-${Date.now()}`,
    };
    setLedgerEvents((prev) => [newEvent, ...prev]);

    if (eventData.classification === 'Distribution Payout') {
      const amount = eventData.cashEffect;
      setMetrics((prev) => ({
        ...prev,
        personalCash: prev.personalCash + amount,
        chaseChecking: prev.chaseChecking + amount,
        distributionsReceived: prev.distributionsReceived + amount,
        personalNetWorth: prev.personalNetWorth + amount,
      }));
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === eventData.entityId
            ? {
                ...c,
                distributionsReceived: c.distributionsReceived + amount,
                distributionsPending: Math.max(0, c.distributionsPending - amount),
              }
            : c
        )
      );
    } else if (eventData.classification === 'Capital Contribution') {
      const injectedAmount = Math.abs(eventData.cashEffect);
      setMetrics((prev) => ({
        ...prev,
        personalCash: Math.max(0, prev.personalCash - injectedAmount),
        chaseChecking: Math.max(0, prev.chaseChecking - injectedAmount),
        capitalInvested: prev.capitalInvested + injectedAmount,
      }));
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === eventData.entityId
            ? {
                ...c,
                contributedCapital: c.contributedCapital + injectedAmount,
                enterpriseValuation: c.enterpriseValuation + injectedAmount,
                equityPositionValue:
                  ((c.enterpriseValuation + injectedAmount) * c.legalOwnershipPercent) / 100,
              }
            : c
        )
      );
    } else if (eventData.classification === 'Profit Allocation') {
      const profit = eventData.cashEffect;
      setMetrics((prev) => ({
        ...prev,
        profitAttributed: prev.profitAttributed + profit,
      }));
    }
  };

  const handleResolveGovernance = (reqId: string, approved: boolean) => {
    setGovernanceRequests((prev) =>
      prev.map((r) =>
        r.id === reqId
          ? {
              ...r,
              status: approved ? 'Approved by Board' : 'Rejected by Principal',
            }
          : r
      )
    );

    if (approved) {
      const target = governanceRequests.find((r) => r.id === reqId);
      if (target && target.entityId === 'be-llc') {
        setCompanies((prev) =>
          prev.map((c) =>
            c.id === 'be-llc'
              ? {
                  ...c,
                  legalOwnershipPercent: 40.0,
                  equityPositionValue: (c.enterpriseValuation * 40.0) / 100,
                  capTable: [
                    {
                      name: 'Ahmad Khan',
                      role: 'Co-Founder & CEO',
                      percentage: 60.0,
                      initialInvestment: 50000,
                      votingRights: true,
                    },
                    {
                      name: 'Umer (Principal)',
                      role: 'Co-Founder & Partner',
                      percentage: 40.0,
                      initialInvestment: 50000,
                      votingRights: true,
                    },
                  ],
                }
              : c
          )
        );
      }
    }
  };

  const currentCompany = companies.find((c) => c.id === activeEntityId) || null;

  if (currentCompany) {
    return (
      <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col antialiased selection:bg-[#4edea3]/25 selection:text-[#4edea3] theme-surface">
        <CompanyWorkspaceView
          company={currentCompany}
          onReturnToConsolidated={() => setActiveEntityId(null)}
          onSelectEntity={handleSelectEntity}
          allCompanies={companies}
          ledgerEvents={ledgerEvents}
          onOpenRecordCapital={() => setIsRecordCapitalOpen(true)}
          privacyMode={privacyMode}
          onTogglePrivacy={() => setPrivacyMode(!privacyMode)}
          onSwitchWorkspace={onSwitchWorkspace}
          onLogout={onLogout}
          onOpenStudio={onOpenStudio}
          onUpdateCompany={(updated) => {
            setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          }}
        />

        <RecordCapitalModal
          isOpen={isRecordCapitalOpen}
          onClose={() => setIsRecordCapitalOpen(false)}
          companies={companies}
          activeEntityId={currentCompany.id}
          onRecordEvent={handleRecordCapital}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col antialiased selection:bg-[#4edea3]/25 selection:text-[#4edea3] theme-surface">
      <WealthTopHeader
        onLogout={onLogout}
        activeWorkspace={activeWorkspace}
        onSwitchWorkspace={onSwitchWorkspace}
        selectedPeriod={selectedPeriod}
        onSelectPeriod={setSelectedPeriod}
        onOpenAddCompany={() => setIsAddCompanyOpen(true)}
        onOpenRecordCapital={() => setIsRecordCapitalOpen(true)}
        privacyMode={privacyMode}
        onTogglePrivacy={() => setPrivacyMode(!privacyMode)}
        onOpenSearch={() => setIsSearchOpen(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex-1 flex min-h-0 overflow-hidden pt-14 lg:pl-72">
        <WealthSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeEntityId={activeEntityId}
          onSelectEntity={handleSelectEntity}
          companies={companies}
          onOpenAddCompany={() => setIsAddCompanyOpen(true)}
          onOpenStudio={onOpenStudio}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        <main id="wealth-main-scroll" className="flex-1 overflow-y-auto bg-[#0b1326] relative">
          {activeTab === 'personal-financial-overview' ? (
            <WealthCommandDashboard
              companies={companies}
              metrics={metrics}
              ledgerEvents={ledgerEvents}
              governanceRequests={governanceRequests.filter(
                (r) => r.status.includes('Awaiting') || r.status.includes('Pending')
              )}
              onSelectEntity={handleSelectEntity}
              onOpenAddCompany={() => setIsAddCompanyOpen(true)}
              onOpenRecordCapital={() => setIsRecordCapitalOpen(true)}
              onOpenReviewGovernance={(req) => {
                setSelectedGovRequest(req);
                setIsReviewGovOpen(true);
              }}
              onOpenExportPdf={() => setIsExportPdfOpen(true)}
              onOpenAuditLog={() => setIsAuditLogOpen(true)}
              onOpenCapTable={() => setActiveTab('ownership-and-cap-tables')}
              privacyMode={privacyMode}
            />
          ) : activeTab === 'multi-company-portfolio' ? (
            <MultiCompanyPortfolioView
              companies={companies}
              onSelectEntity={handleSelectEntity}
              onOpenAddCompany={() => setIsAddCompanyOpen(true)}
              onDeleteCompany={handleDeleteCompany}
              privacyMode={privacyMode}
            />
          ) : activeTab === 'ownership-and-cap-tables' ? (
            <CapTableView
              companies={companies}
              onSelectEntity={(id) => {
                setActiveEntityId(id);
              }}
              privacyMode={privacyMode}
            />
          ) : activeTab === 'bank-and-liquid-cash' ? (
            <PersonalAccountsView />
          ) : activeTab === 'real-estate-and-property' ? (
            <PersonalPropertiesView />
          ) : activeTab === 'personal-assets' ? (
            <PersonalAssetsView />
          ) : activeTab === 'personal-liabilities-and-debt' ? (
            <PersonalLiabilitiesView />
          ) : activeTab === 'personal-cash-flow' ? (
            <PersonalTransactionsView />
          ) : (
            <WealthSecondaryViews
              activeTab={activeTab}
              companies={companies}
              metrics={metrics}
              ledgerEvents={ledgerEvents}
              onOpenRecordCapital={() => setIsRecordCapitalOpen(true)}
              privacyMode={privacyMode}
            />
          )}
        </main>
      </div>

      <AddCompanyModal
        isOpen={isAddCompanyOpen}
        onClose={() => setIsAddCompanyOpen(false)}
        onAddCompany={handleAddCompany}
      />

      <RecordCapitalModal
        isOpen={isRecordCapitalOpen}
        onClose={() => setIsRecordCapitalOpen(false)}
        companies={companies}
        activeEntityId={activeEntityId}
        onRecordEvent={handleRecordCapital}
      />

      <ReviewGovernanceModal
        isOpen={isReviewGovOpen}
        onClose={() => {
          setIsReviewGovOpen(false);
          setSelectedGovRequest(null);
        }}
        request={selectedGovRequest}
        onResolve={handleResolveGovernance}
      />

      <WealthExportPdfModal
        isOpen={isExportPdfOpen}
        onClose={() => setIsExportPdfOpen(false)}
        companies={companies}
        metrics={metrics}
        selectedPeriod={selectedPeriod}
      />

      <WealthAuditLogModal
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
      />

      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        companies={companies}
        ledgerEvents={ledgerEvents}
        onSelectEntity={handleSelectEntity}
      />
    </div>
  );
};