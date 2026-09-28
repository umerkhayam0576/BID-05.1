import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Wallet } from 'lucide-react';
import {
  INITIAL_METRICS,
  INITIAL_RFIS,
  INITIAL_BIDS,
  INITIAL_CLIENTS,
} from './data/initialData';
import { RfiItem, BidItem, ClientItem, MetricSummary, RfiStatus } from './types';
import { TopNav } from './components/TopNav';
import { Sidebar, NavTabId } from './components/Sidebar';
import { KpiMetricsRow } from './components/KpiMetricsRow';
import { RfiResolutionMatrix } from './components/RfiResolutionMatrix';
import { UpcomingBidsList } from './components/UpcomingBidsList';
import { EnterpriseClientsGrid } from './components/EnterpriseClientsGrid';
import { AccuracyGuaranteeStrip } from './components/AccuracyGuaranteeStrip';
import { PersonalFinanceHub } from './components/finance/PersonalFinanceHub';
import { ProjectTrackingOperations } from './components/ProjectTrackingOperations';
import type { OutsourcedProjectAssignment } from './components/OutsourcedProjectModal';
import { WorkflowAutomationHub } from './components/workflow/WorkflowAutomationHub';
import { LoginScreen } from './components/auth/LoginScreen';

// Dedicated Module Views
import { OperationsOverviewView } from './components/views/OperationsOverviewView';
import { CompanyFinanceGlView } from './components/views/CompanyFinanceGlView';
import { InflowOutflowView } from './components/views/InflowOutflowView';
import { EmployeeHrView } from './components/views/EmployeeHrView';
import { SalaryPayrollView } from './components/views/SalaryPayrollView';
import { CommissionSettingsView } from './components/views/CommissionSettingsView';
import { LoanManagementView } from './components/views/LoanManagementView';
import { PartnerManagementView } from './components/views/PartnerManagementView';
import { EmergencyFundView } from './components/views/EmergencyFundView';
import { PayrollView } from './components/views/PayrollView';
import { ContractorsView } from './components/views/ContractorsView';
import { TimeAttendanceView } from './components/views/TimeAttendanceView';
import { ClientsAccountsView } from './components/views/ClientsAccountsView';
import { ProposalsEstimatesView } from './components/views/ProposalsEstimatesView';
import { InvoicesArView } from './components/views/InvoicesArView';
import { MessagesChannelsView } from './components/views/MessagesChannelsView';
import { DocumentsContractsView } from './components/views/DocumentsContractsView';
import { CapTableView } from './components/views/CapTableView';
import { AuditSettingsView } from './components/views/AuditSettingsView';
import { CompanyDetailView } from './components/views/CompanyDetailView';
import { ClientPortalView } from './components/views/ClientPortalView';
import { CompanyRemindersView } from './components/views/CompanyRemindersView';
import { EmployeePortalView } from './components/views/EmployeePortalView';
import { ConnectedBanksView } from './components/views/ConnectedBanksView';
import { StudioView } from './components/StudioView';

// Enterprise ERP Initial System Data
import {
  INITIAL_CASH_TRANSACTIONS,
  INITIAL_EMPLOYEES,
  INITIAL_PAYROLL_RUNS,
  INITIAL_LOANS,
  INITIAL_LOAN_PAYMENTS,
  INITIAL_PARTNERS,
  INITIAL_PARTNER_PAYOUTS,
  INITIAL_EMERGENCY_FUND,
  INITIAL_CONNECTED_ACCOUNTS,
  INITIAL_TRANSFER_REQUESTS,
} from './data/systemData';
import { INITIAL_COMPANY_REMINDERS } from './data/reminderData';
import {
  CashTransaction,
  EmployeeItem,
  PayrollRunItem,
  LoanItem,
  LoanPaymentRecord,
  PartnerItem,
  PartnerPayoutRecord,
  EmergencyFundState,
  CommissionSettingsState,
  CompanyReminderItem,
  ConnectedBankAccount,
  BankTransferRequest,
} from './types';
import {
  getCommissionSettings,
  saveCommissionSettings,
} from './utils/financialRulesEngine';

// Modals
import { DeltaTakeoffModal } from './components/DeltaTakeoffModal';
import { NewRfiModal } from './components/NewRfiModal';
import { NewBidModal } from './components/NewBidModal';
import { NewClientModal } from './components/NewClientModal';
import { RfiDetailModal } from './components/RfiDetailModal';
import { BidDetailModal } from './components/BidDetailModal';
import { ClientDetailModal } from './components/ClientDetailModal';
import { ExportPdfModal } from './components/ExportPdfModal';
import { AuditLogModal } from './components/AuditLogModal';
import { CommandPaletteModal } from './components/CommandPaletteModal';

type AuthUser = { id: string; email: string; displayName: string | null };

function AuthenticatedApp({ onLogout }: { onLogout: () => void }) {
  // Workspace state: personal finance is the default landing workspace for authenticated users.
  const [activeWorkspace, setActiveWorkspace] = useState<'personal-finance' | 'pre-con-estimating'>(() => {
    const saved = localStorage.getItem('bid_exact_active_workspace');
    return saved === 'pre-con-estimating' ? 'pre-con-estimating' : 'personal-finance';
  });

  // State
  const [activeTab, setActiveTab] = useState<NavTabId>('workflow-automation');
  const [metrics, setMetrics] = useState<MetricSummary>(INITIAL_METRICS);
  const [rfis, setRfis] = useState<RfiItem[]>(INITIAL_RFIS);
  const [bids, setBids] = useState<BidItem[]>(INITIAL_BIDS);
  const [clients, setClients] = useState<ClientItem[]>(INITIAL_CLIENTS);
  const [deltaApplied, setDeltaApplied] = useState(false);

  // Complete Enterprise ERP States
  const [transactions, setTransactions] = useState<CashTransaction[]>(INITIAL_CASH_TRANSACTIONS);
  const [employees, setEmployees] = useState<EmployeeItem[]>(INITIAL_EMPLOYEES);
  const [payrollRuns, setPayrollRuns] = useState<PayrollRunItem[]>(INITIAL_PAYROLL_RUNS);
  const [outsourcedAssignments, setOutsourcedAssignments] = useState<OutsourcedProjectAssignment[]>([]);
  const [loans, setLoans] = useState<LoanItem[]>(INITIAL_LOANS);
  const [loanPayments, setLoanPayments] = useState<LoanPaymentRecord[]>(INITIAL_LOAN_PAYMENTS);
  const [partners, setPartners] = useState<PartnerItem[]>(INITIAL_PARTNERS);
  const [partnerPayouts, setPartnerPayouts] = useState<PartnerPayoutRecord[]>(INITIAL_PARTNER_PAYOUTS);
  const [emergencyFund, setEmergencyFund] = useState<EmergencyFundState>(INITIAL_EMERGENCY_FUND);

  // Connected Institutional Accounts (Wise, Payoneer, Mercury) & Approval State
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedBankAccount[]>(() => {
    const saved = localStorage.getItem('bid_exact_connected_bank_accounts');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_CONNECTED_ACCOUNTS;
  });

  const [transferRequests, setTransferRequests] = useState<BankTransferRequest[]>(() => {
    const saved = localStorage.getItem('bid_exact_bank_transfer_requests');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // fallback
      }
    }
    return INITIAL_TRANSFER_REQUESTS;
  });

  // Persist bank accounts
  useEffect(() => {
    localStorage.setItem('bid_exact_connected_bank_accounts', JSON.stringify(connectedAccounts));
  }, [connectedAccounts]);

  // Persist transfer requests
  useEffect(() => {
    localStorage.setItem('bid_exact_bank_transfer_requests', JSON.stringify(transferRequests));
  }, [transferRequests]);

  const handleUpdateAccountLimits = (accountId: string, newAutoLimit: number, newDualSignOffLimit: number) => {
    setConnectedAccounts((prev) =>
      prev.map((acc) =>
        acc.id === accountId
          ? {
            ...acc,
            autoApprovalLimit: newAutoLimit,
            dualSignOffThreshold: newDualSignOffLimit,
          }
          : acc
      )
    );
  };

  const handleAddAccount = (newAccount: ConnectedBankAccount) => {
    setConnectedAccounts((prev) => {
      const exists = prev.some((a) => a.id === newAccount.id || a.provider === newAccount.provider);
      if (exists) {
        return prev.map((a) =>
          a.id === newAccount.id || a.provider === newAccount.provider ? newAccount : a
        );
      }
      return [...prev, newAccount];
    });
  };

  const handleRemoveAccount = (accountId: string) => {
    setConnectedAccounts((prev) => prev.filter((acc) => acc.id !== accountId));
  };

  const handleCreateTransferRequest = (newRequest: BankTransferRequest) => {
    setTransferRequests((prev) => [newRequest, ...prev]);

    // If auto_approved, immediately deduct pending hold or update available balance
    if (newRequest.status === 'auto_approved') {
      setConnectedAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === newRequest.accountId) {
            return {
              ...acc,
              availableBalance: Math.max(0, acc.availableBalance - newRequest.amount),
              pendingHold: acc.pendingHold + newRequest.amount,
            };
          }
          return acc;
        })
      );
    }
  };

  const handlePartnerApprovalAction = (
    requestId: string,
    partnerId: string,
    partnerName: string,
    action: 'approved' | 'rejected',
    notes?: string
  ) => {
    setTransferRequests((prev) =>
      prev.map((req) => {
        if (req.id === requestId) {
          const newApprovals = [
            ...req.approvals.filter((a) => a.partnerId !== partnerId),
            {
              partnerId,
              partnerName,
              action,
              timestamp: new Date().toISOString(),
              notes,
            },
          ];

          let newStatus = req.status;
          if (action === 'rejected') {
            newStatus = 'rejected';
          } else {
            // Check if approval requirements met
            const targetAcc = connectedAccounts.find((a) => a.id === req.accountId);
            const reqApprovalsCount = targetAcc ? targetAcc.requiredPartnerApprovals : 1;
            const approvedCount = newApprovals.filter((a) => a.action === 'approved').length;

            if (approvedCount >= reqApprovalsCount) {
              newStatus = 'approved';
            }
          }

          return {
            ...req,
            status: newStatus,
            approvals: newApprovals,
          };
        }
        return req;
      })
    );
  };

  const handleExecuteApprovedTransfer = (requestId: string) => {
    const req = transferRequests.find((r) => r.id === requestId);
    if (!req) return;

    const executionTxnId = `TXN-BANK-${Date.now().toString().slice(-6)}`;

    // 1. Mark request executed
    setTransferRequests((prev) =>
      prev.map((r) =>
        r.id === requestId
          ? {
            ...r,
            status: 'executed',
            executionTxnId,
            executedAt: new Date().toISOString(),
          }
          : r
      )
    );

    // 2. Deduct ledger balance from bank account
    setConnectedAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === req.accountId) {
          const newBalance = Math.max(0, acc.balance - req.amount);
          const newAvail = Math.max(0, acc.availableBalance - req.amount);
          const newHold = Math.max(0, acc.pendingHold - req.amount);
          return {
            ...acc,
            balance: newBalance,
            availableBalance: newAvail,
            pendingHold: newHold,
            lastSyncedAt: new Date().toISOString(),
          };
        }
        return acc;
      })
    );

    // 3. Mirror as corporate Cash Transaction outflow in Treasury
    const newTxn: CashTransaction = {
      id: executionTxnId,
      date: new Date().toISOString().slice(0, 10),
      description: `${req.accountName}: ${req.purpose}`,
      category: req.transactionType === 'partner_draw' ? 'Partner Distribution' : 'Operating Overhead',
      counterparty: req.recipientName,
      type: 'outflow',
      amount: req.amount,
      status: 'cleared',
      paymentMethod: `${req.provider.toUpperCase()} Transfer (${req.recipientDetails})`,
      account: req.accountName,
      referenceNumber: `AUTH-${req.id}`,
    };

    setTransactions((prev) => [newTxn, ...prev]);
  };

  const handleRefreshBalances = () => {
    // Simulate real-time API sync refresh from Wise, Payoneer & Mercury
    setConnectedAccounts((prev) =>
      prev.map((acc) => ({
        ...acc,
        lastSyncedAt: new Date().toISOString(),
        status: 'connected',
      }))
    );
  };

  // Company Reminders & Compliance State
  const [reminders, setReminders] = useState<CompanyReminderItem[]>(INITIAL_COMPANY_REMINDERS);

  const handleUpdateReminder = (updated: CompanyReminderItem) => {
    setReminders((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
  };

  const handleAddReminder = (newReminder: CompanyReminderItem) => {
    setReminders((prev) => [newReminder, ...prev]);
  };

  const urgentReminderCount = useMemo(() => {
    return reminders.filter((r) => r.priority === 'URGENT' && r.status !== 'completed').length;
  }, [reminders]);

  // Commission & Incentive Rules State (Persisted)
  const [commissionRules, setCommissionRules] = useState<CommissionSettingsState>(() => getCommissionSettings());

  const handleSaveCommissionRules = (updatedRules: CommissionSettingsState) => {
    setCommissionRules(updatedRules);
    saveCommissionSettings(updatedRules);
  };

  // Modals state
  const [isDeltaModalOpen, setIsDeltaModalOpen] = useState(false);
  const [isNewRfiOpen, setIsNewRfiOpen] = useState(false);
  const [isNewBidOpen, setIsNewBidOpen] = useState(false);
  const [isNewClientOpen, setIsNewClientOpen] = useState(false);
  const [isExportPdfOpen, setIsExportPdfOpen] = useState(false);
  const [isAuditLogOpen, setIsAuditLogOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Detail drawer states
  const [selectedRfi, setSelectedRfi] = useState<RfiItem | null>(null);
  const [selectedBid, setSelectedBid] = useState<BidItem | null>(null);
  const [selectedClient, setSelectedClient] = useState<ClientItem | null>(null);

  // Toast / notification count
  const [notificationCount, setNotificationCount] = useState(2);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Handlers
  const handleApplyDelta = (bidId: string, deltaAmount: number, deltaTons: number) => {
    setDeltaApplied(true);

    // Update bid
    setBids((prev) =>
      prev.map((b) => {
        if (b.id === bidId) {
          return {
            ...b,
            amount: b.amount + deltaAmount,
            rfiBlocker: undefined,
            specValidated: true,
            takeoffProgress: 100,
            winProbability: {
              ...b.winProbability,
              percent: 65,
              label: '65% Strong',
              level: 'Strong',
            },
          };
        }
        return b;
      })
    );

    // Update metrics
    setMetrics((prev) => ({
      ...prev,
      pipelineTotal: prev.pipelineTotal + deltaAmount,
      openRfiCount: Math.max(0, prev.openRfiCount - 1),
    }));

    // Update RFI state
    setRfis((prev) =>
      prev.map((r) => {
        if (r.id === 'RFI-2024-089') {
          return {
            ...r,
            status: 'RESOLVED',
            statusLabel: 'RESOLVED IN BID',
            resolvedNote: 'Schedule revision applied to #BID-8849',
          };
        }
        return r;
      })
    );
  };

  const handleCreateRfi = (newRfi: RfiItem) => {
    setRfis((prev) => [newRfi, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      openRfiCount: prev.openRfiCount + 1,
    }));
  };

  const handleCreateBid = (newBid: BidItem) => {
    setBids((prev) => [newBid, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      pipelineTotal: prev.pipelineTotal + newBid.amount,
      submittedEstimatesCount: prev.submittedEstimatesCount + 1,
      bidsTrackedCount: prev.bidsTrackedCount + 1,
    }));
  };

  const handleCreateClient = (newClient: ClientItem) => {
    setClients((prev) => [newClient, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      activeClientsCount: prev.activeClientsCount + 1,
      tier1Count: prev.tier1Count + 1,
    }));
  };

  const handleUpdateRfiStatus = (rfiId: string, newStatus: RfiStatus, note?: string) => {
    setRfis((prev) =>
      prev.map((r) => {
        if (r.id === rfiId) {
          let label = 'AWAITING RESPONSE';
          if (newStatus === 'DRAFT_READY') label = 'DRAFT RESPONSE READY';
          if (newStatus === 'UNDER_REVIEW') label = 'UNDER REVIEW';
          if (newStatus === 'RESOLVED') label = 'RESOLVED IN BID';
          return {
            ...r,
            status: newStatus,
            statusLabel: label,
            resolvedNote: note || r.resolvedNote,
          };
        }
        return r;
      })
    );

    if (selectedRfi?.id === rfiId) {
      setSelectedRfi((prev) =>
        prev
          ? {
            ...prev,
            status: newStatus,
            statusLabel:
              newStatus === 'RESOLVED'
                ? 'RESOLVED IN BID'
                : newStatus === 'DRAFT_READY'
                  ? 'DRAFT RESPONSE READY'
                  : newStatus === 'UNDER_REVIEW'
                    ? 'UNDER REVIEW'
                    : 'AWAITING RESPONSE',
            resolvedNote: note || prev.resolvedNote,
          }
          : null
      );
    }
  };

  const handleExportCsv = () => {
    const headers = 'RFI ID,Subject,Client,Project,Priority,Status,CSI Division,Delta Cost ($)\n';
    const rows = rfis
      .map(
        (r) =>
          `"${r.id}","${r.title.replace(/"/g, '""')}","${r.client}","${r.project}","${r.priority}","${r.statusLabel}","${r.csiDivision || ''}",${r.deltaCost || 0}`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BidExact_RFI_Matrix_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Enterprise ERP Handlers
  const handleCreateTransaction = (newTxn: CashTransaction) => {
    setTransactions((prev) => [newTxn, ...prev]);
  };

  const handleAddEmployee = (newEmp: EmployeeItem) => {
    setEmployees((prev) => [newEmp, ...prev]);
  };

  const handleRunPayroll = (newRun: PayrollRunItem, outflowTxn: CashTransaction) => {
    setPayrollRuns((prev) => prev.some((run) => run.id === newRun.id || (run.period === newRun.period && run.payDate === newRun.payDate)) ? prev : [newRun, ...prev]);
    setTransactions((prev) => prev.some((transaction) => transaction.id === outflowTxn.id || transaction.referenceNumber === outflowTxn.referenceNumber) ? prev : [outflowTxn, ...prev]);
  };

  const handleRecordLoanPayment = (
    payment: LoanPaymentRecord,
    updatedLoan: LoanItem,
    outflowTxn: CashTransaction
  ) => {
    setLoanPayments((prev) => [payment, ...prev]);
    setLoans((prev) => prev.map((l) => (l.id === updatedLoan.id ? updatedLoan : l)));
    setTransactions((prev) => [outflowTxn, ...prev]);
  };

  const handleAddLoan = (newLoan: LoanItem) => {
    setLoans((prev) => [newLoan, ...prev]);
  };

  const handleExecutePartnerPayout = (
    payout: PartnerPayoutRecord,
    updatedPartner: PartnerItem,
    outflowTxn: CashTransaction
  ) => {
    setPartnerPayouts((prev) => {
      let uniqueId = payout.id;
      if (prev.some((p) => p.id === uniqueId)) {
        let maxNum = 5;
        for (const p of prev) {
          const match = p.id.match(/DIST-2024-(\d+)/i);
          if (match) {
            const parsed = parseInt(match[1], 10);
            if (!isNaN(parsed) && parsed > maxNum) {
              maxNum = parsed;
            }
          }
        }
        uniqueId = `DIST-2024-${String(maxNum + 1).padStart(2, '0')}`;
      }
      const record = uniqueId === payout.id ? payout : { ...payout, id: uniqueId };
      return [record, ...prev];
    });
    setPartners((prev) => prev.map((p) => (p.id === updatedPartner.id ? updatedPartner : p)));
    setTransactions((prev) => [outflowTxn, ...prev]);
  };

  const handleUpdatePartner = (updatedPartner: PartnerItem) => {
    setPartners((prev) => prev.map((p) => (p.id === updatedPartner.id ? updatedPartner : p)));
  };

  const handleUpdateEmergencyFund = (
    updatedFund: EmergencyFundState,
    txn: CashTransaction
  ) => {
    setEmergencyFund(updatedFund);
    setTransactions((prev) => [txn, ...prev]);
  };

  // Handle tab change
  const handleSelectTab = (tab: NavTabId) => {
    setSelectedClient(null);
    setActiveTab(tab);
    setIsMobileSidebarOpen(false);
  };

  if (activeWorkspace === 'personal-finance') {
    return (
      <PersonalFinanceHub
        onLogout={onLogout}
        activeWorkspace={activeWorkspace}
        onOpenStudio={() => {
          setActiveTab('studio');
          setActiveWorkspace('pre-con-estimating');
          localStorage.setItem('bid_exact_active_workspace', 'pre-con-estimating');
        }}
        onSwitchWorkspace={(ws) => {
          setActiveWorkspace(ws);
          localStorage.setItem('bid_exact_active_workspace', ws);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#0b1326] text-[#dae2fd] flex flex-col antialiased selection:bg-[#4edea3]/25 selection:text-[#4edea3] theme-surface">
      {/* Top Application Bar */}
      <TopNav

        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}

        notificationCount={notificationCount}
        onToggleMobileMenu={() => setIsMobileSidebarOpen((prev) => !prev)}
        onNavigateToReminders={() => handleSelectTab('company-reminders')}
        urgentReminderCount={urgentReminderCount}
      />

      {/* Main Body Layout (Sidebar + Content Workspace) */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Nav Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={handleSelectTab}
          openRfiCount={metrics.openRfiCount}
          urgentReminderCount={urgentReminderCount}
          onSwitchWorkspace={(ws) => {
            setActiveWorkspace(ws);
            localStorage.setItem('bid_exact_active_workspace', ws);
          }}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
        />

        {/* Scrollable Main Operations Surface */}
        <main
          id="main-content-scroll"
          className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-[#0b1326] p-3 sm:p-6 space-y-4 sm:space-y-6"
        >
          {selectedClient ? (
            /* ISOLATED COMPANY INTERFACE: When user clicks any company name, only this company's details appear */
            <CompanyDetailView
              client={selectedClient}
              rfis={rfis}
              bids={bids}
              onBack={() => setSelectedClient(null)}
              onOpenNewRfi={() => setIsNewRfiOpen(true)}
              onOpenNewBid={() => setIsNewBidOpen(true)}
              onSelectRfi={(rfi) => setSelectedRfi(rfi)}
              onSelectBid={(bid) => setSelectedBid(bid)}
            />
          ) : activeTab === 'company-reminders' ? (
            <CompanyRemindersView
              reminders={reminders}
              onUpdateReminder={handleUpdateReminder}
              onAddReminder={handleAddReminder}
              onNavigateTab={handleSelectTab}
              onRecordCashOutflow={handleCreateTransaction}
            />
          ) : activeTab === 'employee-portal' ? (
            <EmployeePortalView />
          ) : activeTab === 'studio' ? (
            <StudioView />
          ) : activeTab === 'workflow-automation' ? (
            <WorkflowAutomationHub />
          ) : activeTab === 'client-portal' ? (
            <ClientPortalView
              rfis={rfis}
              bids={bids}
              clients={clients}
              onUpdateRfiStatus={handleUpdateRfiStatus}
              onCreateRfi={handleCreateRfi}
              onExitPortal={() => handleSelectTab('overview')}
            />
          ) : activeTab === 'overview' ? (
            <OperationsOverviewView
              onNavigateTab={handleSelectTab}
              onOpenNewRfi={() => setIsNewRfiOpen(true)}
              onOpenNewBid={() => setIsNewBidOpen(true)}
              onOpenNewClient={() => setIsNewClientOpen(true)}
            />
          ) : activeTab === 'inflow-outflow' ? (
            <InflowOutflowView
              transactions={transactions}
              onAddTransaction={handleCreateTransaction}
              onNavigateTab={handleSelectTab}
              connectedAccounts={connectedAccounts}
            />
          ) : activeTab === 'projects' ? (
            <ProjectTrackingOperations
              onOpenNewTakeoff={() => setIsNewBidOpen(true)}
              onNavigateTab={handleSelectTab}
              onOutsourcedAssignment={(assignment) => setOutsourcedAssignments((current) => current.some((item) => item.id === assignment.id) ? current : [assignment, ...current])}
            />
          ) : activeTab === 'finance' ? (
            <CompanyFinanceGlView
              outsourcedAssignments={outsourcedAssignments}
              payrollRuns={payrollRuns}
              connectedAccounts={connectedAccounts}
              onNavigateTab={handleSelectTab}
              onSwitchToPersonalFinance={() => {
                setActiveWorkspace('personal-finance');
                localStorage.setItem('bid_exact_active_workspace', 'personal-finance');
              }}
            />
          ) : activeTab === 'connected-banks' ? (
            <ConnectedBanksView
              accounts={connectedAccounts}
              transferRequests={transferRequests}
              partners={partners}
              currentUserId="PARTNER-01"
              onUpdateAccountLimits={handleUpdateAccountLimits}
              onUpdateAccount={(updatedAcc) => {
                setConnectedAccounts((prev) =>
                  prev.map((acc) => (acc.id === updatedAcc.id ? updatedAcc : acc))
                );
              }}
              onAddAccount={handleAddAccount}
              onRemoveAccount={handleRemoveAccount}
              onCreateTransferRequest={handleCreateTransferRequest}
              onPartnerApprovalAction={handlePartnerApprovalAction}
              onExecuteApprovedTransfer={handleExecuteApprovedTransfer}
              onRefreshBalances={handleRefreshBalances}
            />
          ) : activeTab === 'hr-directory' ? (
            <EmployeeHrView
              employees={employees}
              onAddEmployee={handleAddEmployee}
              onNavigateToPayroll={() => handleSelectTab('payroll')}
            />
          ) : activeTab === 'payroll' ? (
            <SalaryPayrollView
              employees={employees}
              payrollRuns={payrollRuns}
              onRunPayroll={handleRunPayroll}
              onNavigateToHr={() => handleSelectTab('hr-directory')}
              onNavigateToCommissionSettings={() => handleSelectTab('commission-settings')}
            />
          ) : activeTab === 'commission-settings' ? (
            <CommissionSettingsView
              rules={commissionRules}
              onSaveRules={handleSaveCommissionRules}
              employees={employees}
              onNavigateTab={handleSelectTab}
            />
          ) : activeTab === 'loans' ? (
            <LoanManagementView
              loans={loans}
              payments={loanPayments}
              employees={employees}
              onRecordPayment={handleRecordLoanPayment}
              onAddLoan={handleAddLoan}
              onUpdateLoan={(updatedLoan) => {
                setLoans((prev) => prev.map((l) => (l.id === updatedLoan.id ? updatedLoan : l)));
              }}
            />
          ) : activeTab === 'partners' ? (
            <PartnerManagementView
              partners={partners}
              payouts={partnerPayouts}
              onExecutePayout={handleExecutePartnerPayout}
              onUpdatePartner={handleUpdatePartner}
              connectedAccounts={connectedAccounts}
              transferRequests={transferRequests}
              onNavigateTab={handleSelectTab}
            />
          ) : activeTab === 'emergency-fund' ? (
            <EmergencyFundView
              fundState={emergencyFund}
              onUpdateFundState={handleUpdateEmergencyFund}
            />
          ) : activeTab === 'contractors' ? (
            <ContractorsView />
          ) : activeTab === 'time' ? (
            <TimeAttendanceView />
          ) : activeTab === 'clients' ? (
            <ClientsAccountsView
              clients={clients}
              onSelectClient={(client) => setSelectedClient(client)}
              onOpenNewClient={() => setIsNewClientOpen(true)}
            />
          ) : activeTab === 'proposals' ? (
            <ProposalsEstimatesView
              bids={bids}
              onSelectBid={(bid) => setSelectedBid(bid)}
              onOpenNewBid={() => setIsNewBidOpen(true)}
            />
          ) : activeTab === 'invoices' ? (
            <InvoicesArView onRecordPaymentInflow={handleCreateTransaction} />
          ) : activeTab === 'messages' ? (
            <MessagesChannelsView />
          ) : activeTab === 'documents' ? (
            <DocumentsContractsView />
          ) : activeTab === 'cap-table' ? (
            <CapTableView />
          ) : activeTab === 'audit' ? (
            <AuditSettingsView />
          ) : (
            <>
              {/* Breadcrumb & Screen Header */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  {/* Breadcrumb Tag */}
                  <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
                    <span>OPERATIONS CORE</span>
                    <span>/</span>
                    <span>BID EXACT LLC ENTERPRISE</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
                  </div>

                  {/* Title & Subtitle */}
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                    Clients, Bids & RFI Tracking Center
                  </h1>
                  <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
                    Active General Contractor Accounts, Pre-Construction RFIs, and Proposal Estimates
                  </p>
                </div>

                {/* Top Right Actions Row */}
                <div className="flex items-center gap-2.5 flex-wrap">
                  <button
                    id="btn-switch-to-finance"
                    onClick={() => {
                      setActiveWorkspace('personal-finance');
                      localStorage.setItem('bid_exact_active_workspace', 'personal-finance');
                    }}
                    className="h-9 px-3.5 bg-[#131b2e] hover:bg-[#171f33] border border-[#4edea3]/40 text-[#4edea3] rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Personal Finance Hub</span>
                  </button>

                  <button
                    id="btn-action-new-rfi"
                    onClick={() => setIsNewRfiOpen(true)}
                    className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#ff7886]" />
                    <span>New RFI</span>
                  </button>

                  <button
                    id="btn-action-add-client"
                    onClick={() => setIsNewClientOpen(true)}
                    className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#adc6ff]" />
                    <span>Add Client Account</span>
                  </button>

                  <button
                    id="btn-action-new-bid"
                    onClick={() => setIsNewBidOpen(true)}
                    className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>New Proposal / Bid</span>
                  </button>
                </div>
              </div>

              {/* Top KPI Metrics Row (4 Cards) */}
              <KpiMetricsRow
                metrics={metrics}
                onFilterRfiOpen={() => setIsCommandPaletteOpen(true)}
                onViewPipeline={() => setIsNewBidOpen(true)}
              />

              {/* Mid Section: Two Column Split */}
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-start">
                {/* Left (8 Cols): Pre-Con RFI Resolution Matrix & CAD Delta Card */}
                <div className="xl:col-span-8 space-y-5">
                  <RfiResolutionMatrix
                    rfis={rfis}
                    onSelectRfi={(rfi) => setSelectedRfi(rfi)}
                    onOpenDeltaModal={() => setIsDeltaModalOpen(true)}
                    onExportPdf={() => setIsExportPdfOpen(true)}
                    onExportCsv={handleExportCsv}
                    onUpdateStatus={handleUpdateRfiStatus}
                    onOpenNewRfi={() => setIsNewRfiOpen(true)}
                  />
                </div>

                {/* Right (4 Cols): Upcoming Bids & Estimates */}
                <div className="xl:col-span-4 space-y-5">
                  <UpcomingBidsList
                    bids={bids}
                    onSelectBid={(bid) => setSelectedBid(bid)}
                    onOpenSubmissionDeck={() => setIsCommandPaletteOpen(true)}
                  />
                </div>
              </div>

              {/* Lower Section: Enterprise Client Portfolio (4 Cards) */}
              <EnterpriseClientsGrid
                clients={clients}
                onSelectClient={(client) => setSelectedClient(client)}
              />

              {/* Bottom Accuracy Guarantee Strip */}
              <AccuracyGuaranteeStrip
                onOpenAuditLog={() => setIsAuditLogOpen(true)}
              />
            </>
          )}
        </main>
      </div>

      {/* MODALS & DRAWERS */}
      {/* 1. CAD Rebar Delta Takeoff Inspector Modal */}
      <DeltaTakeoffModal
        isOpen={isDeltaModalOpen}
        onClose={() => setIsDeltaModalOpen(false)}
        onApplyDelta={handleApplyDelta}
        isApplied={deltaApplied}
      />

      {/* 2. New Architectural RFI Modal */}
      <NewRfiModal
        isOpen={isNewRfiOpen}
        onClose={() => setIsNewRfiOpen(false)}
        onSubmit={handleCreateRfi}
      />

      {/* 3. New Proposal / Bid Modal */}
      <NewBidModal
        isOpen={isNewBidOpen}
        onClose={() => setIsNewBidOpen(false)}
        onSubmit={handleCreateBid}
      />

      {/* 4. New Client Account Modal */}
      <NewClientModal
        isOpen={isNewClientOpen}
        onClose={() => setIsNewClientOpen(false)}
        onSubmit={handleCreateClient}
      />

      {/* 5. RFI Detail Drawer */}
      <RfiDetailModal
        rfi={selectedRfi}
        onClose={() => setSelectedRfi(null)}
        onUpdateStatus={handleUpdateRfiStatus}
        onOpenDeltaModal={() => setIsDeltaModalOpen(true)}
      />

      {/* 6. Bid Detail Drawer */}
      <BidDetailModal
        bid={selectedBid}
        onClose={() => setSelectedBid(null)}
        onOpenDeltaModal={() => setIsDeltaModalOpen(true)}
      />

      {/* 7. Client Detail Interface - Handled in main canvas via CompanyDetailView */}

      {/* 8. Export PDF Transmittal Log */}
      <ExportPdfModal
        isOpen={isExportPdfOpen}
        onClose={() => setIsExportPdfOpen(false)}
        rfis={rfis}
      />

      {/* 9. Accuracy Engine Audit Log */}
      <AuditLogModal
        isOpen={isAuditLogOpen}
        onClose={() => setIsAuditLogOpen(false)}
      />

      {/* 10. Command Palette (Cmd+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        rfis={rfis}
        bids={bids}
        clients={clients}
        onSelectRfi={(rfi) => setSelectedRfi(rfi)}
        onSelectBid={(bid) => setSelectedBid(bid)}
        onSelectClient={(client) => setSelectedClient(client)}
        onOpenNewRfi={() => setIsNewRfiOpen(true)}
        onOpenNewBid={() => setIsNewBidOpen(true)}
        onOpenDeltaModal={() => setIsDeltaModalOpen(true)}
      />
    </div>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } finally {
      setAuthUser(null);
    }
  };

  if (!authUser) {
    return <LoginScreen onAuthenticated={setAuthUser} />;
  }

  return <AuthenticatedApp onLogout={handleLogout} />;
}
