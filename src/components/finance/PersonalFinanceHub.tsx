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

interface PersonalFinanceHubProps {
  onSwitchWorkspace: (ws: 'personal-finance' | 'pre-con-estimating') => void;
  activeWorkspace: 'personal-finance' | 'pre-con-estimating';
}

export const PersonalFinanceHub: React.FC<PersonalFinanceHubProps> = ({
  onSwitchWorkspace,
  activeWorkspace,
}) => {
  // 1. Data State with LocalStorage Persistence
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

  // 2. Navigation & View State
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

  // 3. Modal States
  const [isAddCompanyOpen, setIsAddCompanyOpen] = useState(false);
  const [isRecordCapitalOpen, setIsRecordCapitalOpen] = useState(false);
  const [isReviewGovOpen, setIsReviewGovOpen] = useState(false);
  const [selectedGovRequest, setSelectedGovRequest] = useState<GovernanceChangeRequest | null>(null);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('bid_exact_wealth_companies', JSON.stringify(companies));
  }, [companies]);

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

  // Keyboard shortcut: Cmd+K / Ctrl+K for search
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

  // Handlers
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

    // Automatically adjust personal wealth metrics
    setMetrics((prev) => ({
      ...prev,
      personalNetWorth: prev.personalNetWorth + equityValue,
      companyInterests: prev.companyInterests + equityValue,
      capitalInvested: prev.capitalInvested + newCompanyData.contributedCapital,
      profitAttributed: prev.profitAttributed + attrProfit,
      distributionsReceived: prev.distributionsReceived + newCompanyData.distributionsReceived,
    }));

    // Switch focus to the newly added company
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

  // STRICT ISOLATION: When a specific company is clicked/selected, render ONLY its dedicated corporate interface
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
          onUpdateCompany={(updated) => {
            setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
          }}
        />

        {/* Dedicated Modal for Company Record Action */}
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
      {/* Top Universal Wealth & Entity Switcher Header */}
      <WealthTopHeader
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

      {/* Main Split Layout: Sidebar + Operations Surface */}
      <div className="flex-1 flex min-h-0 overflow-hidden pt-14 lg:pl-72">
        {/* Left Navigation Sidebar */}
        <WealthSidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          activeEntityId={activeEntityId}
          onSelectEntity={handleSelectEntity}
          companies={companies}
          onOpenAddCompany={() => setIsAddCompanyOpen(true)}
          isMobileOpen={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Central Dynamic Content Surface */}
        <main
          id="wealth-main-scroll"
          className="flex-1 overflow-y-auto bg-[#0b1326] relative"
        >
          {activeTab === 'personal-financial-overview' ? (
            /* Master Consolidated Dashboard */
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
            /* C. Multi-Company Operating Portfolio */
            <MultiCompanyPortfolioView
              companies={companies}
              onSelectEntity={handleSelectEntity}
              onOpenAddCompany={() => setIsAddCompanyOpen(true)}
              onDeleteCompany={handleDeleteCompany}
              privacyMode={privacyMode}
            />
          ) : activeTab === 'ownership-and-cap-tables' ? (
            /* D. Ownership & Cap Tables with Dilution Modeling */
            <CapTableView
              companies={companies}
              onSelectEntity={(id) => {
                setActiveEntityId(id);
              }}
              privacyMode={privacyMode}
            />
          ) : activeTab === 'personal-cash-flow' ? (
            <FinanceWorkflowView privacyMode={privacyMode} />
          ) : (
            /* E. Secondary Deep Modules (Cash, Investments, Real Estate, Distributions) */
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


      {/* Interactive Modal Suite */}
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
