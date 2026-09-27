export type RfiStatus = 'AWAITING_RESPONSE' | 'DRAFT_READY' | 'UNDER_REVIEW' | 'RESOLVED';
export type RfiPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface RfiItem {
  id: string; // e.g. RFI-2024-089
  submittedTime: string; // e.g. "Submitted 2d ago"
  title: string;
  description: string;
  fullQuery?: string;
  client: string;
  project: string;
  assignedLead: {
    name: string;
    initials: string;
    avatarColor?: string;
    role?: string;
  };
  status: RfiStatus;
  statusLabel: string;
  priority: RfiPriority;
  csiDivision?: string;
  deltaCost?: number;
  deltaTonnage?: number;
  resolvedNote?: string;
  linkedBidId?: string;
  bimOverlayAvailable?: boolean;
}

export interface BidItem {
  id: string; // e.g. BID-8849
  title: string;
  divisionScope?: string;
  client: string;
  amount: number;
  dueDate: string;
  winProbability: {
    percent: number;
    label: string;
    level: 'High' | 'Moderate' | 'Strong' | 'Low';
  };
  takeoffProgress: number;
  rfiBlocker?: string;
  specValidated?: boolean;
  estimator?: string;
  status: 'active' | 'submitted' | 'under_review' | 'awarded';
}

export interface ClientItem {
  id: string;
  initials: string;
  name: string;
  agreementTier: string;
  division: string;
  lifetimeValue: number;
  activeProjectsCount: number;
  activeProjectsLabel: string;
  invoicedAmount: number;
  paidAmount: number;
  paidPercent: number;
  contact: {
    initials: string;
    name: string;
    title: string;
    phone?: string;
    email?: string;
  };
}

export interface MetricSummary {
  pipelineTotal: number;
  pipelineMom: number;
  submittedEstimatesCount: number;
  activeClientsCount: number;
  tier1Count: number;
  masterContractsCount: number;
  retainedPercent: number;
  openRfiCount: number;
  slaMaxHours: number;
  avgTurnHours: number;
  overdueRiskCount: number;
  winRatePercent: number;
  winRateBenchmarkDelta: number;
  bidsTrackedCount: number;
}

export type ProjectTrackStatus =
  | 'ACTIVE_TAKEOFF'
  | 'BIM_MODELING'
  | 'CRITICAL_RFI_BLOCK'
  | 'QUALITY_AUDIT'
  | 'DELIVERED';

export interface MilestoneItem {
  id: string;
  title: string;
  status: 'complete' | 'in_progress' | 'pending';
  note?: string;
}

export interface ProjectTrackItem {
  id: string; // e.g. BID-2024-884
  title: string;
  gc: string;
  scopeType: string;
  status: ProjectTrackStatus;
  statusLabel: string;
  statusColor?: string;
  estimateValue: number;
  completionPace: number;
  targetDue: string;
  daysRemaining?: number; // e.g. -3 (overdue), 0 (today), 1 (1 day left), 2 (2 days left), etc.
  budgetedHours?: number; // e.g. 160
  priority?: 'CRITICAL' | 'HIGH' | 'NORMAL';
  paceStatus: string;
  paceStatusType: 'success' | 'info' | 'warning' | 'audit';
  milestones: MilestoneItem[];
  notice?: {
    type: 'linked_rfi' | 'info' | 'critical_hold' | 'audit_signoff';
    text: string;
    subtext?: string;
    highlightAmount?: string;
    rfiCode?: string;
  };
  leadEstimators: Array<{
    name: string;
    initials: string;
    avatarUrl?: string;
    avatarColor?: string;
  }>;
  leadRole: string;
  actionType: 'inspect' | 'escalate' | 'release';
  actionLabel: string;
  qtoSpecs?: string[];
  totalHoursLogged?: number;
  createdDate?: string;
}

export interface CashTransaction {
  id: string;
  date: string;
  description: string;
  category: string;
  counterparty: string;
  type: 'inflow' | 'outflow';
  amount: number;
  status: 'reconciled' | 'pending' | 'cleared';
  paymentMethod: string;
  account: string;
  referenceNumber?: string;
}

export interface EmployeeItem {
  id: string;
  name: string;
  initials: string;
  role: string;
  department: 'Pre-Construction' | 'VDC & BIM' | 'Estimating Operations' | 'Finance & Legal' | 'Executive Leadership' | 'Client Relations';
  type: 'Full-Time W-2' | 'Part-Time W-2' | 'Contractor 1099';
  annualSalary: number;
  monthlyGross: number;
  deductions: {
    federalTax: number;
    stateTax: number;
    ficaMedicare: number;
    retirement401k: number;
    healthInsurance: number;
  };
  netPay: number;
  hireDate: string;
  email: string;
  phone: string;
  status: 'Active' | 'On Leave' | 'Probation';
  directDeposit: string;
  ptoDaysRemaining: number;
  performanceRating: number;
  manager: string;
}

export interface PayrollRunItem {
  id: string;
  period: string;
  payDate: string;
  totalGross: number;
  totalTaxesWithheld: number;
  totalDeductions: number;
  totalNetPaid: number;
  employeeCount: number;
  status: 'Paid' | 'Processing' | 'Scheduled';
}

export type LoanDirection = 'company_loaned_out' | 'company_borrowed';

export interface LoanItem {
  id: string;
  name: string;
  lender: string; // Institution/Lender or "Bid Exact LLC" when loaned out
  type: 'Employee Loan' | 'Partner Advance' | 'Emergency Hardship' | 'Tool & Equipment Advance' | 'Line of Credit' | 'SBA 7(a) Term' | 'Equipment Lease' | 'Founder Bridge' | 'Working Capital';
  principalAmount: number;
  currentBalance: number;
  interestRate: number; // in percentage, e.g. 0% or 3.5%
  monthlyPayment: number; // monthly deduction / EMI
  originationDate: string;
  maturityDate: string;
  nextPaymentDue: string;
  autoPay: boolean; // e.g. Payroll Auto-Deduction
  status: 'Active' | 'Paid Off' | 'Pending Approval' | 'Rejected';
  notes?: string;
  
  // Person/People who take the loan from the company
  direction?: LoanDirection; // 'company_loaned_out' (default for company-issued loans) or 'company_borrowed'
  borrowerName?: string; // e.g. "Liam Scott", "Elena Rostova", "Syed Ahmed"
  borrowerRole?: string; // e.g. "Junior MEP Quantity Surveyor"
  borrowerEmail?: string;
  borrowerId?: string; // EMP-106, etc.
  repaymentMethod?: 'Payroll Deduction' | 'Direct Bank ACH' | 'Auto-Debit' | 'Check';
  
  // Approval metadata
  approvedBy?: string; // e.g. "Umer Khayam (CEO & Founder)" or "Sarah Jenkins (Financial Controller)"
  approvedDate?: string;
  approvalStatus?: 'Approved' | 'Pending Approval' | 'Under Review' | 'Declined';
  digitalSignature?: string; // e.g. "s/ Umer Khayam" or Drawn signature data URL
  digitalSignatureTimestamp?: string;
  approvalNotes?: string;
  denialReason?: string;
  disbursementAccount?: string; // e.g. "Chase Operating ••8491"
  purpose?: string; // e.g. "Family Relocation & Housing Deposit", "Professional PE License & Continuing Ed"
  
  // Automated Overdue Notification Tracking
  lastOverdueAlertSent?: string; // ISO date of last notification
  overdueAlertDismissed?: boolean;
  daysOverdue?: number;
}

export interface LoanPaymentRecord {
  id: string;
  loanId: string;
  loanName: string;
  date: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  remainingBalance: number;
  method: string;
  receiptNumber?: string;
  transactionId?: string;
  borrowerName?: string;
}

export interface LoanPaymentReceiptData {
  receiptNumber: string;
  paymentId: string;
  transactionId: string;
  paymentDate: string;
  timestamp: string;
  loanId: string;
  loanName: string;
  loanType?: string;
  direction?: LoanDirection;
  borrowerName: string;
  borrowerRole?: string;
  borrowerEmail?: string;
  borrowerId?: string;
  lender: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  previousBalance: number;
  remainingBalance: number;
  paymentMethod: string;
  disbursementAccount: string;
  reconciledStatus: string;
  notes?: string;
  authorizedOfficer: string;
}

// ==========================================
// FINANCIAL RULES ENGINE TYPES
// ==========================================

export interface SalesCommissionRuleConfig {
  newClientRatePercent: number; // e.g. 5.0%
  recurringClientRatePercent: number; // e.g. 2.5%
  deductStripeFees: boolean; // default true (sales commission based on net collected after Stripe fee)
  defaultPaymentMethod: 'credit_card' | 'ach_debit' | 'wire_transfer';
  clawbackWindowDays: number; // e.g. 90
}

export interface TeamMemberShare {
  employeeId: string;
  employeeName: string;
  role: string;
  department?: string;
}

export interface TeamTargetRule {
  id: string; // 'team_a' | 'team_b' | 'team_c' | custom
  name: string; // e.g. "Team A (Commercial & Institutional)"
  department: string;
  targetAmount: number; // Target in dollars, e.g. $250,000
  currentAchievedAmount: number; // Current progress in dollars, e.g. $268,500
  bonusPoolAmount: number; // Bonus pool in dollars, e.g. $5,000
  splitType: 'equal_split' | 'hours_weighted';
  members: TeamMemberShare[];
  notes?: string;
  useCustomRates?: boolean;
  salesCommissionRatePercent?: number;
  recurringClientRatePercent?: number;
  serviceBonusRatePercent?: number;
}

export interface CommissionSettingsState {
  globalSalesRate: number; // e.g. 5.0%
  globalRecurringRate: number; // e.g. 2.5%
  globalServiceBonus24h: number; // e.g. 1.5% or $500
  globalServiceBonus48h: number; // e.g. 2.5% or $1000
  globalServiceBonus72h: number; // e.g. 4.0% or $1500
  serviceBonusMode: 'percentage' | 'flat_dollar';
  deductStripeFees: boolean;
  defaultPaymentMethod: 'credit_card' | 'ach_debit' | 'wire_transfer';
  clawbackWindowDays: number;
  requireZeroQaErrors: boolean;
  percentageBasis: 'contract_value' | 'gross_margin';
  teams: TeamTargetRule[];
  lastUpdated: string;
  updatedBy: string;
  version: number;
}

export interface ServiceEarlySubmissionRule {
  rewardMode: 'flat_dollar' | 'percentage'; // '$' flat dollar or '%' percentage of project
  tier24h: number; // e.g. $500 or 1.5%
  tier48h: number; // e.g. $1,000 or 2.5%
  tier72h: number; // e.g. $1,500 or 4.0%
  requireZeroQaErrors: boolean; // QA zero-defect floor
  percentageBasis: 'contract_value' | 'gross_margin';
}

export interface FinancialRulesAdjustmentConfig {
  salesCommission: SalesCommissionRuleConfig;
  teams: TeamTargetRule[];
  serviceEarlyDelivery: ServiceEarlySubmissionRule;
  lastUpdated: string;
  updatedBy: string;
}

export interface SalesCommissionCalculationResult {
  clientType: 'new_client' | 'recurring_client';
  contractValue: number;
  paymentMethod: 'credit_card' | 'ach_debit' | 'wire_transfer';
  stripeFeeDeduction: number;
  netCollectedCash: number;
  commissionRatePercent: number;
  commissionAmount: number;
  clawbackWindowDays: number;
  notes: string;
}

export interface TeamMemberPayout {
  employeeId: string;
  employeeName: string;
  role: string;
  sharePercent: number;
  payoutAmount: number;
}

export interface TeamTargetCalculationResult {
  teamId: string;
  teamName: string;
  department: string;
  targetAmount: number;
  currentAchievedAmount: number;
  isTargetMet: boolean;
  achievementPercent: number;
  shortfallOrSurplus: number;
  bonusPoolUnlocked: number;
  perMemberEqualShare: number;
  memberPayouts: TeamMemberPayout[];
  splitType: 'equal_split' | 'hours_weighted';
}

export interface ServiceEarlyBonusCalculationResult {
  leadTimeHoursAhead: number;
  addendaErrors: number;
  isEligible: boolean;
  rewardMode: 'flat_dollar' | 'percentage';
  appliedTier: 'none' | '24h' | '48h' | '72h';
  tierRateOrAmount: number;
  basisAmount: number;
  grossBonusAmount: number;
  supplementalTaxWithheld: number;
  netBonusTakeHome: number;
  notes: string;
}

export interface CommissionCalculationResult {
  contractValue: number;
  directCosts: number;
  grossMarginAmount: number;
  grossMarginPercent: number;
  tierApplied: string;
  commissionRate: number; // e.g. 0.04 for 4%
  totalCommissionPool: number;
  estimatorSharePercent: number;
  estimatorCommission: number;
  collectionStatus: 'Accrued (Pending Collection)' | 'Payable (Cash Collected)' | 'Disbursed';
  clawbackWindowDaysRemaining?: number;
  notes: string;
}

export interface BonusCalculationResult {
  bonusType: 'turnaround_speed' | 'ebitda_profit_sharing' | 'discretionary_spot';
  baseAmount: number;
  performanceMultiplier: number;
  prorationFactor: number;
  finalBonusAmount: number;
  supplementalTaxRate: number; // 0.22 flat IRS rate
  supplementalTaxWithheld: number;
  netBonus: number;
  criteriaMet: string;
}

export interface TaxWithholdingResult {
  grossWages: number;
  regularWages: number;
  supplementalWages: number; // commissions + bonuses
  preTax401k: number;
  preTaxHealth: number;
  taxableWagesFit: number;
  federalIncomeTax: number;
  supplementalFederalTax: number;
  totalFederalIncomeTax: number;
  stateIncomeTax: number; // 4.95% IL
  socialSecurityTax: number; // 6.2% up to $168,600
  socialSecurityEmployerMatch: number;
  medicareTax: number; // 1.45%
  medicareEmployerMatch: number;
  additionalMedicareTax: number; // 0.9% > $200k
  totalFicaEmployee: number;
  totalFicaEmployer: number;
  employerSafeHarborMatch401k: number; // Up to 4%
  totalEmployeeTaxes: number;
  disposableEarnings: number;
  ccpaMaxLoanDeductionAllowed: number; // 25% of disposable
}

export interface StripeFeeResult {
  invoiceAmount: number;
  paymentMethod: 'credit_card' | 'ach_debit' | 'wire_transfer';
  feePolicy: 'absorb_by_company' | 'surcharge_to_client';
  percentageFeeRate: number;
  fixedFee: number;
  grossAmountCharged: number;
  stripeFeeDeduction: number;
  netCashDeposited: number;
  effectiveFeePercent: number;
  glJournalEntries: Array<{
    account: string;
    description: string;
    debit: number;
    credit: number;
  }>;
}

export interface PartnerItem {
  id: string;
  name: string;
  initials: string;
  role: string;
  equityPercent: number;
  profitSharePercent: number;
  capitalContributed: number;
  currentCapitalBalance: number;
  totalPayoutsYtd: number;
  pendingDistribution: number;
  taxIdMask: string;
  bankRoutingMask: string;
  email: string;
}

export interface PartnerPayoutRecord {
  id: string;
  partnerId: string;
  partnerName: string;
  date: string;
  amount: number;
  payoutType: 'Quarterly Profit Share' | 'Tax Distribution' | 'Guaranteed Payment' | 'Partner Draw';
  paymentMethod: string;
  status: 'Completed' | 'Pending Approval' | 'Processing';
  referenceCode: string;
  notes?: string;
}

export interface EmergencyFundAllocation {
  asset: string;
  amount: number;
  share: number;
  apy: string;
  institution: string;
}

export interface EmergencyFundHistoryItem {
  id: string;
  date: string;
  type: 'Deposit' | 'Drawdown' | 'Yield' | 'Sweep';
  amount: number;
  description: string;
  balanceAfter: number;
}

export interface EmergencyFundState {
  currentBalance: number;
  targetBalance: number;
  targetAmount: number;
  monthlyBurnRate: number;
  runwayMonths: number;
  apyRate: number; // e.g. 4.85
  autoSweepPercent: number; // e.g. 10%
  monthlyAccruedInterest: number;
  vaultInstitution: string;
  accountNumberMask: string;
  allocations: EmergencyFundAllocation[];
  history: EmergencyFundHistoryItem[];
}

export interface EmergencyFundTransaction {
  id: string;
  date: string;
  type: 'deposit' | 'sweep' | 'yield' | 'emergency_drawdown';
  amount: number;
  description: string;
  authorizedBy: string;
  balanceAfter: number;
}

export interface EstimatorWorkloadItem {
  id: string;
  name: string;
  title: string;
  avatarUrl?: string;
  initials: string;
  avatarColor?: string;
  activeAssignments: string[];
  committedHours: number;
  maxWeeklyHours?: number; // Standard is 40h/week
  capacityLoadPercent: number; // Utilization rate %
  roleCategory?: 'principal' | 'senior' | 'bim_vdc' | 'structural' | 'mep' | 'general';
  projectAllocations?: Array<{
    projectId: string;
    projectTitle: string;
    hoursPerWeek: number;
    roleOnProject?: string;
  }>;
  signOffStatus: {
    text: string;
    type: 'cleared' | 'progress' | 'blocked';
    note?: string;
  };
}

export interface ArchivedDeliverableItem {
  id: string;
  packageCode: string;
  packageName: string;
  scopeSummary: string;
  gc: string;
  deliveredDate: string;
  contractValue: number;
  budgetStatus: string;
  auditVerification: {
    status: string;
    signers: string;
  };
  fileSize: string;
  originalProject?: ProjectTrackItem;
}

// ==========================================
// COMPANY REMINDERS & COMPLIANCE COMMAND TYPES
// ==========================================
export type ReminderCategory =
  | 'tax_compliance' // Corporate tax, 941, sales tax, 1099, franchise filings
  | 'client_calls' // Follow-ups with General Contractors, AR billing calls, milestone reviews
  | 'bids_rfis' // Bid deadlines, RFI expirations, addenda cutoffs, pre-bid walk
  | 'payroll_hr' // Payroll cutoffs, subcontractor COI renewals, commissions, benefits
  | 'finance_legal'; // Debt installment, insurance policy renewals, licenses, reserve health check

export type ReminderPriority = 'URGENT' | 'HIGH' | 'NORMAL' | 'LOW';
export type ReminderStatus = 'pending' | 'in_progress' | 'completed' | 'snoozed';
export type ReminderFrequency = 'one_time' | 'daily' | 'weekly' | 'bi_weekly' | 'monthly' | 'quarterly' | 'annual';

export interface CompanyReminderItem {
  id: string;
  title: string;
  category: ReminderCategory;
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // e.g. "2:00 PM EST"
  priority: ReminderPriority;
  status: ReminderStatus;
  description: string;
  assignee: {
    name: string;
    role: string;
    avatarColor?: string;
    initials?: string;
  };
  relatedEntity?: {
    type: 'client' | 'bid' | 'rfi' | 'tax_agency' | 'vendor' | 'partner';
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    referenceId?: string;
  };
  statutoryAgency?: string; // e.g. 'IRS EFTPS', 'State Comptroller / Dept of Revenue', 'Secretary of State'
  taxFormNumber?: string; // e.g. 'Form 1120-S', 'Form 941', '1099-NEC', 'Form 940'
  monetaryAmount?: number; // Estimated liability, invoice amount, or bid value
  frequency: ReminderFrequency;
  completedAt?: string;
  completedBy?: string;
  filingConfirmationNumber?: string;
  callOutcomeNote?: string;
  snoozedUntil?: string;
  actionUrlOrTab?: string;
  actionLabel?: string;
  tags: string[];
}

// ==========================================
// CONNECTED BANK ACCOUNTS & PARTNER APPROVAL TYPES
// ==========================================

export type ConnectedBankProvider = 'wise' | 'payoneer' | 'mercury';

export interface ConnectedBankAccount {
  id: string;
  provider: ConnectedBankProvider;
  accountName: string;
  accountNumberMask: string;
  routingOrBicMask: string;
  currency: string;
  balance: number;
  availableBalance: number;
  pendingHold: number;
  lastSyncedAt: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  autoApprovalLimit: number; // e.g. $5,000 threshold below which transactions auto-clear
  dualSignOffThreshold: number; // e.g. $25,000 for mandatory dual-partner signoff
  requiredPartnerApprovals: number; // 1 or 2 partners
  designatedApprovers: string[]; // Partner IDs, e.g. ['PARTNER-01', 'PARTNER-02']
  notes?: string;
}

export type BankTransactionType = 'transfer_out' | 'payroll_disbursement' | 'vendor_bill' | 'partner_draw' | 'fx_conversion' | 'deposit';

export type BankTransactionApprovalStatus =
  | 'auto_approved' // Below limit, cleared automatically
  | 'pending_partner_approval' // Big transaction, requires partner approval
  | 'approved' // Partner approved, ready to execute
  | 'rejected' // Partner rejected
  | 'executed'; // Disbursed/settled

export interface PartnerApprovalAction {
  partnerId: string;
  partnerName: string;
  action: 'approved' | 'rejected';
  timestamp: string;
  notes?: string;
  ipAddress?: string;
}

export interface BankTransferRequest {
  id: string;
  accountId: string;
  provider: ConnectedBankProvider;
  accountName: string;
  recipientName: string;
  recipientDetails: string;
  amount: number;
  currency: string;
  transactionType: BankTransactionType;
  purpose: string;
  requestedBy: string;
  createdAt: string;
  status: BankTransactionApprovalStatus;
  thresholdApplied: number;
  requiresPartnerApproval: boolean;
  approvalPolicy: 'below_threshold_auto' | 'standard_partner_signoff' | 'dual_partner_super_majority';
  approvals: PartnerApprovalAction[];
  executionTxnId?: string;
  executedAt?: string;
}

