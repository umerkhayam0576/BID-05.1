import React, { useState, useEffect } from 'react';
import {
  Landmark,
  DollarSign,
  TrendingDown,
  Calendar,
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowDownRight,
  ShieldCheck,
  Calculator,
  UserCheck,
  Users,
  User,
  FileCheck2,
  Building2,
  ArrowUpRight,
  Search,
  Filter,
  Check,
  X,
  Sparkles,
  Info,
  PenTool,
  Eraser,
  Volume2,
  VolumeX,
  ExternalLink,
  RefreshCw,
  FileText,
  Settings
} from 'lucide-react';
import { LoanItem, LoanPaymentRecord, CashTransaction, EmployeeItem, LoanPaymentReceiptData } from '../../types';
import { LoanPaymentReceiptModal } from '../loans/LoanPaymentReceiptModal';
import { downloadLoanPaymentPdf } from '../../utils/loanPdfReceiptGenerator';

interface LoanManagementViewProps {
  workspaceId?: string | null;
  loans: LoanItem[];
  payments: LoanPaymentRecord[];
  employees?: EmployeeItem[];
  onRecordPayment: (payment: LoanPaymentRecord, updatedLoan: LoanItem, outflowTxn: CashTransaction) => void;
  onAddLoan: (loan: LoanItem) => void;
  onUpdateLoan?: (loan: LoanItem) => void;
}
interface CompanyLoanApplication {
  id: string;
  workspaceId: string;
  applicantUserId: string;
  personalFinanceId: string;
  applicantName: string;
  applicantRole: string;
  requestedAmount: string | number;
  requestedTermMonths?: number | null;
  purpose: string;
  repaymentMethod?: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'needs_information';
  eligibilityStatus?: string;
  eligibilitySnapshot?: Record<string, unknown>;
  decisionNotes?: string | null;
  decidedByUserId?: string | null;
  decidedAt?: string | null;
  companyLoanId?: string | null;
  metadata?: Record<string, unknown>;
}

export const LoanManagementView: React.FC<LoanManagementViewProps> = ({
  workspaceId,
  loans,
  payments,
  employees = [],
  onRecordPayment,
  onAddLoan,
  onUpdateLoan,
}) => {
  // Navigation sub-tab: 'employee_loans' (people who take loans from company) vs 'commercial_debt' (company bank loans) vs 'all'
  const [activeTab, setActiveTab] = useState<'employee_loans' | 'commercial_debt' | 'all'>('employee_loans');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Active' | 'Pending Approval' | 'Paid Off'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

const [loanApplications, setLoanApplications] = useState<CompanyLoanApplication[]>([]);
const [loanApplicationsLoading, setLoanApplicationsLoading] = useState(false);
const [companyLoans, setCompanyLoans] = useState<LoanItem[]>([]);
const [companyLoansLoading, setCompanyLoansLoading] = useState(false);

// Company loan eligibility rules - editable from the portal.
const [loanEligibilityPolicies, setLoanEligibilityPolicies] = useState<any[]>([]);
const [eligibilityRulesLoading, setEligibilityRulesLoading] = useState(false);
const [eligibilityRulesSaving, setEligibilityRulesSaving] = useState<string | null>(null);
const [eligibilityRulesMessage, setEligibilityRulesMessage] = useState('');
const [showEligibilityRules, setShowEligibilityRules] = useState(false);

// Workspace members available for tenant-scoped approval and governance actions.
type WorkspaceMember = {
  userId: string;
  email: string;
  displayName: string | null;
  membershipRole: string;
  ownershipPercent?: string | null;
  profitSharePercent?: string | null;
  entityRole?: string | null;
};

const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMember[]>([]);
const [workspaceMembersLoading, setWorkspaceMembersLoading] = useState(false);

// Company finance accounts used for loan disbursements and repayments.
type CompanyFinanceAccount = {
  id: string;
  name: string;
  accountType: string;
  currency: string;
  openingBalance: string | number;
  currentBalance: string | number;
  status?: string;
};

const [companyFinanceAccounts, setCompanyFinanceAccounts] = useState<CompanyFinanceAccount[]>([]);
const [companyFinanceAccountsLoading, setCompanyFinanceAccountsLoading] = useState(false);
const [selectedDisbursementAccountId, setSelectedDisbursementAccountId] = useState('');
const [selectedPaymentAccountId, setSelectedPaymentAccountId] = useState('');
const [loanActionLoading, setLoanActionLoading] = useState(false);
const [loanActionMessage, setLoanActionMessage] = useState('');

const [selectedLoanId, setSelectedLoanId] = useState<string>(
  loans.find(l => l.direction === 'company_loaned_out')?.id || loans[0]?.id || ''
);
const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
const [isNewLoanModalOpen, setIsNewLoanModalOpen] = useState(false);
const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
const [loanToApprove, setLoanToApprove] = useState<LoanItem | null>(null);
  const [approvalOfficial, setApprovalOfficial] = useState<string>('');
  const [approvalSignatureType, setApprovalSignatureType] = useState<'typed' | 'drawn'>('typed');
  const [typedSignature, setTypedSignature] = useState<string>('');
  const [drawnSignatureData, setDrawnSignatureData] = useState<string>('');
  const [approvalNotes, setApprovalNotes] = useState<string>('');
  const [denialReason, setDenialReason] = useState<string>('');
  const [isDenialMode, setIsDenialMode] = useState<boolean>(false);
  const [signatureConsent, setSignatureConsent] = useState<boolean>(true);
  const signatureCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);

  // Automatic PDF Receipt Generation State
  const [activeReceiptData, setActiveReceiptData] = useState<LoanPaymentReceiptData | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [autoGeneratePdfReceipt, setAutoGeneratePdfReceipt] = useState(true);

  // Extra Principal Payoff Simulation State
  const [extraPayment, setExtraPayment] = useState<number>(200);

  // Payment Form State (Recording loan repayment)
  const [payLoanId, setPayLoanId] = useState<string>(loans[0]?.id || '');
  const [payAmount, setPayAmount] = useState<string>('');
  const [payMethod, setPayMethod] = useState<string>('Payroll Deduction');

  // New Loan Form State (Company lending to an employee or borrowing)
  const [loanCategory, setLoanCategory] = useState<'company_loaned_out' | 'company_borrowed'>('company_loaned_out');
  const [newBorrowerId, setNewBorrowerId] = useState<string>(employees[0]?.id || 'custom');
  const [newBorrowerName, setNewBorrowerName] = useState<string>(employees[0]?.name || '');
  const [newBorrowerRole, setNewBorrowerRole] = useState<string>(employees[0]?.role || '');
  const [newBorrowerEmail, setNewBorrowerEmail] = useState<string>(employees[0]?.email || '');
  const [newLoanTitle, setNewLoanTitle] = useState('');
  const [newType, setNewType] = useState<LoanItem['type']>('Employee Loan');
  const [newPrincipal, setNewPrincipal] = useState('');
  const [newRate, setNewRate] = useState('0'); // Default 0% for employee welfare loans
  const [newMonthlyPmt, setNewMonthlyPmt] = useState('');
  const [newMaturity, setNewMaturity] = useState('');
  const [newRepaymentMethod, setNewRepaymentMethod] = useState<'Payroll Deduction' | 'Direct Bank ACH' | 'Auto-Debit' | 'Check'>('Payroll Deduction');
  const [newApprovedBy, setNewApprovedBy] = useState('');
  const [newPurpose, setNewPurpose] = useState('');
  const [newLenderName, setNewLenderName] = useState('');
  const [requiresImmediateApproval, setRequiresImmediateApproval] = useState(true);

  // Separate employee loans (company loaned out) and commercial facilities (company borrowed)
  const employeeLoans = loans.filter(l => l.direction === 'company_loaned_out' || (!l.direction && (l.type === 'Employee Loan' || l.type === 'Partner Advance' || l.type === 'Emergency Hardship' || l.type === 'Tool & Equipment Advance')));
  const commercialLoans = loans.filter(l => l.direction === 'company_borrowed' || (!l.direction && (l.type === 'Line of Credit' || l.type === 'SBA 7(a) Term' || l.type === 'Equipment Lease' || l.type === 'Working Capital' || l.type === 'Founder Bridge')));

  // Filtered loans based on tab and search
  const displayedLoans = (activeTab === 'employee_loans'
    ? employeeLoans
    : activeTab === 'commercial_debt'
    ? commercialLoans
    : companyLoans
  ).filter(l => {
    if (statusFilter !== 'ALL' && l.status !== statusFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchName = l.name.toLowerCase().includes(q);
      const matchBorrower = (l.borrowerName || '').toLowerCase().includes(q);
      const matchRole = (l.borrowerRole || '').toLowerCase().includes(q);
      const matchApprover = (l.approvedBy || '').toLowerCase().includes(q);
      const matchLender = (l.lender || '').toLowerCase().includes(q);
      const matchPurpose = (l.purpose || '').toLowerCase().includes(q);
      return matchName || matchBorrower || matchRole || matchApprover || matchLender || matchPurpose;
    }
    return true;
  });

  // Financial Metrics - Employee Loans (Company as Creditor)
  const totalEmployeePrincipal = employeeLoans.reduce((sum, l) => sum + l.principalAmount, 0);
  const totalEmployeeBalance = employeeLoans.reduce((sum, l) => sum + l.currentBalance, 0);
  const totalMonthlyPayrollCollection = employeeLoans
    .filter(l => l.status === 'Active')
    .reduce((sum, l) => sum + l.monthlyPayment, 0);
  const pendingApprovalsCount = employeeLoans.filter(l => l.status === 'Pending Approval').length;

  // Financial Metrics - Commercial Facilities (Company as Debtor)
  const totalCommercialBalance = commercialLoans.reduce((sum, l) => sum + l.currentBalance, 0);
  const totalCommercialMonthlyDebt = commercialLoans.reduce((sum, l) => sum + l.monthlyPayment, 0);

  const activeLoan = loans.find((l) => l.id === selectedLoanId) || displayedLoans[0] || loans[0];
    const loadCompanyLoanApplications = async () => {
    if (!workspaceId) {
      setLoanApplications([]);
      return;
    }

    try {
      setLoanApplicationsLoading(true);

      const response = await fetch(
        `/api/finance/company/loan-applications?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error || 'Unable to load company loan applications.',
        );
      }

      const applications = await response.json();

      setLoanApplications(
        Array.isArray(applications) ? applications : [],
      );
    } catch (error) {
      console.error(
        'Failed to load company loan applications:',
        error,
      );
      setLoanApplications([]);
      setLoanActionMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load company loan applications.',
      );
    } finally {
      setLoanApplicationsLoading(false);
    }
  };


  const loadCompanyLoans = async () => {
    if (!workspaceId) {
      setCompanyLoans([]);
      return;
    }

    try {
      setCompanyLoansLoading(true);

      const response = await fetch(
        `/api/finance/company/loans?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error || 'Unable to load company loans.',
        );
      }

      const rows = await response.json();
      setCompanyLoans(Array.isArray(rows) ? rows : []);
    } catch (error) {
      console.error('Failed to load company loans:', error);
      setCompanyLoans([]);
      setLoanActionMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load company loans.',
      );
    } finally {
      setCompanyLoansLoading(false);
    }
  };

const loadLoanEligibilityPolicies = async () => {
    try {
      if (!workspaceId) {
        setEligibilityRulesMessage('Company workspace is not available.');
        return;
      }

      setEligibilityRulesLoading(true);
      setEligibilityRulesMessage('');

      const response = await fetch(
        `/api/finance/company/loan-eligibility/policies?workspaceId=${encodeURIComponent(workspaceId)}`,
      );

      if (!response.ok) {
        throw new Error('Unable to load loan eligibility rules');
      }

      const policies = await response.json();
      setLoanEligibilityPolicies(Array.isArray(policies) ? policies : []);
    } catch (error) {
      console.error('Failed to load loan eligibility policies:', error);
      setEligibilityRulesMessage('Unable to load eligibility rules.');
    } finally {
      setEligibilityRulesLoading(false);
    }
  };

  const saveLoanEligibilityPolicy = async (policy: any) => {
    try {
      if (!workspaceId) {
        setEligibilityRulesMessage('Company workspace is not available.');
        return;
      }

      setEligibilityRulesSaving(policy.personType);
      setEligibilityRulesMessage('');

      const response = await fetch(
        `/api/finance/company/loan-eligibility/policies/${policy.personType}?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(policy),
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData?.error || 'Unable to save eligibility rules',
        );
      }

      const savedPolicy = await response.json();

      setLoanEligibilityPolicies((current) =>
        current.map((item) =>
          item.personType === savedPolicy.personType
            ? savedPolicy
            : item,
        ),
      );

      setEligibilityRulesMessage(
        `${policy.personType === 'employee' ? 'Employee' : 'Partner'} rules saved successfully.`,
      );
    } catch (error) {
      console.error('Failed to save loan eligibility policy:', error);
      setEligibilityRulesMessage(
        error instanceof Error
          ? error.message
          : 'Unable to save eligibility rules.',
      );
    } finally {
      setEligibilityRulesSaving(null);
    }
  };

  useEffect(() => {
    if (showEligibilityRules) {
      loadLoanEligibilityPolicies();
    }
  }, [showEligibilityRules]);

useEffect(() => {
  if (!workspaceId) {
    setCompanyFinanceAccounts([]);
    setSelectedDisbursementAccountId('');
    setSelectedPaymentAccountId('');
    return;
  }

  let cancelled = false;

  const loadCompanyFinanceAccounts = async () => {
    setCompanyFinanceAccountsLoading(true);

    try {
      const response = await fetch(
        `/api/finance/company/accounts?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        throw new Error(
          `Failed to load company finance accounts (${response.status})`,
        );
      }

      const accounts = await response.json();

      if (cancelled) return;

      const accountRows = Array.isArray(accounts) ? accounts : [];
      setCompanyFinanceAccounts(accountRows);

      const firstAccountId = accountRows[0]?.id || '';
      setSelectedDisbursementAccountId((current) =>
        current || firstAccountId,
      );
      setSelectedPaymentAccountId((current) =>
        current || firstAccountId,
      );
    } catch (error) {
      if (cancelled) return;

      console.error('Failed to load company finance accounts:', error);
      setCompanyFinanceAccounts([]);
      setLoanActionMessage(
        error instanceof Error
          ? error.message
          : 'Unable to load company finance accounts.',
      );
    } finally {
      if (!cancelled) {
        setCompanyFinanceAccountsLoading(false);
      }
    }
  };

  loadCompanyFinanceAccounts();

  return () => {
    cancelled = true;
  };
}, [workspaceId]);

  useEffect(() => {
    if (!workspaceId) {
      setWorkspaceMembers([]);
      return;
    }

    let cancelled = false;

    const loadWorkspaceMembers = async () => {
      setWorkspaceMembersLoading(true);
      try {
        const response = await fetch(
          `/api/entity/${encodeURIComponent(workspaceId)}/members`,
          { credentials: 'include' },
        );

        if (!response.ok) {
          throw new Error(`Failed to load workspace members (${response.status})`);
        }

        const data = await response.json();
        if (cancelled) return;

        setWorkspaceMembers(Array.isArray(data?.members) ? data.members : []);
      } catch (error) {
        if (!cancelled) {
          setWorkspaceMembers([]);
          console.error('Failed to load workspace members:', error);
        }
      } finally {
        if (!cancelled) {
          setWorkspaceMembersLoading(false);
        }
      }
    };

    loadWorkspaceMembers();

    return () => {
      cancelled = true;
    };
  }, [workspaceId]);

  useEffect(() => {
    loadCompanyLoanApplications();
    loadCompanyLoans();
  }, [workspaceId]);

  // Payoff calculation simulation for selected loan
  const simBalance = activeLoan ? activeLoan.currentBalance : 0;
  const simRate = activeLoan ? (activeLoan.interestRate || 0) / 100 / 12 : 0;
  const simBasePmt = activeLoan ? (activeLoan.monthlyPayment || 1) : 500;
  const simTotalPmt = simBasePmt + extraPayment;

  // Approximate remaining months
  const standardMonths =
    simRate > 0 && simBasePmt > simBalance * simRate
      ? Math.ceil(
          Math.log(simBasePmt / (simBasePmt - simBalance * simRate)) / Math.log(1 + simRate)
        )
      : simBasePmt > 0 ? Math.ceil(simBalance / simBasePmt) : 12;

  const acceleratedMonths =
    simRate > 0 && simTotalPmt > simBalance * simRate
      ? Math.ceil(
          Math.log(simTotalPmt / (simTotalPmt - simBalance * simRate)) / Math.log(1 + simRate)
        )
      : simTotalPmt > 0 ? Math.ceil(simBalance / simTotalPmt) : 8;

  const monthsSaved = Math.max(0, standardMonths - acceleratedMonths);
  const interestSaved = Math.round(
    Math.max(0, standardMonths * simBasePmt - acceleratedMonths * simTotalPmt)
  );

  // Helper to open approval modal and reset state
  const openApprovalModal = (loan: LoanItem) => {
    setLoanToApprove(loan);
    const defaultApprover = loan.approvedBy || '';
    setApprovalOfficial(defaultApprover);
    setTypedSignature(defaultApprover ? `s/ ${defaultApprover.split(' (')[0]}` : '');
    setDrawnSignatureData('');
    setApprovalSignatureType('typed');
    setApprovalNotes('');
    setDenialReason('');
    setIsDenialMode(false);
    setSignatureConsent(true);
    setIsApprovalModalOpen(true);
  };

  // Clear signature canvas
  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setDrawnSignatureData('');
  };

  // Canvas drawing handlers
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = signatureCanvasRef.current;
    if (canvas) {
      setDrawnSignatureData(canvas.toDataURL('image/png'));
    }
  };

  // Touch support for canvas
  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = signatureCanvasRef.current;
    if (!canvas || !e.touches[0]) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(touch.clientX - rect.left, touch.clientY - rect.top);
    setIsDrawing(true);
  };

  const handleCanvasTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !e.touches[0]) return;
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineTo(touch.clientX - rect.left, touch.clientY - rect.top);
    ctx.stroke();
  };

  // Execute approval of a loan application
  const handleApproveLoan = async (loan: LoanItem) => {
    if (!workspaceId) {
      setLoanActionMessage('Workspace is required to approve a loan.');
      return;
    }

    const applicationId = loan.applicationId;
    if (!applicationId) {
      setLoanActionMessage(
        'This loan is not linked to a loan application and cannot be approved from this workflow.',
      );
      return;
    }

    if (!selectedDisbursementAccountId) {
      setLoanActionMessage('Please select a company account for disbursement.');
      return;
    }

    const decisionNotes = approvalNotes.trim();

    try {
      setLoanActionLoading(true);
      setLoanActionMessage('');

      const response = await fetch(
        `/api/finance/company/loan-applications/${encodeURIComponent(applicationId)}/decision?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            decision: 'approved',
            disbursementAccountId: selectedDisbursementAccountId,
            notes: decisionNotes || undefined,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to approve the loan application.',
        );
      }

      setLoanActionMessage('Loan approved and disbursed successfully.');

      await loadCompanyLoanApplications();
      await loadCompanyLoans();

      setIsApprovalModalOpen(false);
      setLoanToApprove(null);
    } catch (error) {
      console.error('Failed to approve company loan:', error);

      setLoanActionMessage(
        error instanceof Error
          ? error.message
          : 'Unable to approve the loan application.',
      );
    } finally {
      setLoanActionLoading(false);
    }
  };

  const handleDeclineLoan = async (loan: LoanItem) => {
    if (!workspaceId) {
      setLoanActionMessage('Workspace is required to decline a loan.');
      return;
    }

    const applicationId = loan.applicationId;
    if (!applicationId) {
      setLoanActionMessage(
        'This loan is not linked to a loan application and cannot be declined from this workflow.',
      );
      return;
    }

    const decisionNotes =
      denialReason.trim() || 'Governance criteria not met.';

    try {
      setLoanActionLoading(true);
      setLoanActionMessage('');

      const response = await fetch(
        `/api/finance/company/loan-applications/${encodeURIComponent(applicationId)}/decision?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            decision: 'rejected',
            decisionNotes,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to decline the loan application.',
        );
      }

      setLoanActionMessage('Loan application declined.');

      await loadCompanyLoanApplications();

      setIsApprovalModalOpen(false);
      setLoanToApprove(null);
    } catch (error) {
      console.error('Failed to decline company loan:', error);

      setLoanActionMessage(
        error instanceof Error
          ? error.message
          : 'Unable to decline the loan application.',
      );
    } finally {
      setLoanActionLoading(false);
    }
  };
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amountNum = parseFloat(payAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setLoanActionMessage('Enter a valid payment amount.');
      return;
    }

    if (!workspaceId) {
      setLoanActionMessage('Workspace is required to record a payment.');
      return;
    }

    if (!selectedPaymentAccountId) {
      setLoanActionMessage('Please select the company account receiving the payment.');
      return;
    }

    const targetLoan = companyLoans.find((l) => l.id === payLoanId);
    if (!targetLoan) {
      setLoanActionMessage('Loan not found.');
      return;
    }

    const isCompanyLoanedOut =
      targetLoan.direction === 'company_loaned_out' ||
      targetLoan.type === 'Employee Loan' ||
      targetLoan.type === 'Partner Advance' ||
      targetLoan.type === 'Emergency Hardship' ||
      targetLoan.type === 'Tool & Equipment Advance';

    if (!isCompanyLoanedOut) {
      setLoanActionMessage(
        'Commercial debt payments are not handled by the company employee-loan repayment workflow yet.',
      );
      return;
    }

    try {
      setLoanActionLoading(true);
      setLoanActionMessage('');

      const paymentDate = new Date().toISOString().slice(0, 10);

      const response = await fetch(
        `/api/finance/company/loans/${encodeURIComponent(targetLoan.id)}/payments?workspaceId=${encodeURIComponent(workspaceId)}`,
        {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            paymentAmount: amountNum,
            principalAmount: amountNum,
            interestAmount: 0,
            paymentDate,
            paymentMethod: payMethod,
            accountId: selectedPaymentAccountId,
            notes: targetLoan.notes || undefined,
          }),
        },
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          data?.error || 'Unable to record the company loan payment.',
        );
      }

      const payment = data?.payment;
      const transaction = data?.transaction;
      const balances = data?.balances;

      const previousBalance = Number(
        balances?.previousLoanBalance ??
          targetLoan.currentBalance ??
          0,
      );

      const remainingBalance = Number(
        balances?.loanBalance ??
          Math.max(0, previousBalance - amountNum),
      );

      const principalPaid = Number(
        payment?.principalAmount ?? amountNum,
      );

      const interestPaid = Number(
        payment?.interestAmount ?? 0,
      );

      const paymentId =
        payment?.id ||
        `LPMT-EMP-${Date.now()}`;

      const transactionId =
        transaction?.id ||
        `TXN-${Date.now()}`;

      const paymentRecord: LoanPaymentRecord = {
        id: paymentId,
        loanId: targetLoan.id,
        loanName: targetLoan.name,
        date: paymentDate,
        amount: amountNum,
        principalPaid: Math.round(principalPaid),
        interestPaid: Math.round(interestPaid),
        remainingBalance: Math.round(remainingBalance),
        method: payMethod,
        transactionId,
        borrowerName: targetLoan.borrowerName,
      };

      const updatedLoan: LoanItem = {
        ...targetLoan,
        currentBalance: Math.round(remainingBalance),
        status: remainingBalance === 0 ? 'Paid Off' : targetLoan.status,
      };

      const accountName =
        companyFinanceAccounts.find(
          (account) => account.id === selectedPaymentAccountId,
        )?.name || 'Company Finance Account';

      const txn: CashTransaction = {
        id: transactionId,
        date: paymentDate,
        description: `Employee Loan Repayment Received - ${
          targetLoan.borrowerName || targetLoan.name
        } (${payMethod})`,
        category: 'Employee Loan Recovery',
        counterparty: targetLoan.borrowerName || 'Staff Member',
        type: 'inflow',
        amount: amountNum,
        status: 'reconciled',
        paymentMethod: payMethod,
        account: accountName,
        referenceNumber: paymentId,
      };

      const receiptNumber =
        payment?.receiptNumber || `RCP-${paymentId}`;

      const receiptData: LoanPaymentReceiptData = {
        receiptNumber,
        paymentId,
        transactionId,
        paymentDate,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        }),
        loanId: targetLoan.id,
        loanName: targetLoan.name,
        loanType: targetLoan.type,
        direction: 'company_loaned_out',
        borrowerName: targetLoan.borrowerName || 'Staff Member',
        borrowerRole:
          targetLoan.borrowerRole || 'Employee / Specialist',
        borrowerEmail:
          targetLoan.borrowerEmail || '',
        borrowerId:
          targetLoan.borrowerId || '',
        lender: targetLoan.lender || '',
        amount: amountNum,
        principalPaid: Math.round(principalPaid),
        interestPaid: Math.round(interestPaid),
        previousBalance: Math.round(previousBalance),
        remainingBalance: Math.round(remainingBalance),
        paymentMethod: payMethod,
        disbursementAccount: accountName,
        reconciledStatus: 'POSTED & RECONCILED',
        notes: targetLoan.notes,
        authorizedOfficer: approvalOfficial || '',
      };

      onRecordPayment(paymentRecord, updatedLoan, txn);

      setLoanActionMessage('Loan payment recorded successfully.');
      setIsPaymentModalOpen(false);
      setPayAmount('');

      if (autoGeneratePdfReceipt) {
        setActiveReceiptData(receiptData);
        setIsReceiptModalOpen(true);

        try {
          downloadLoanPaymentPdf(receiptData);
        } catch (pdfErr) {
          console.warn(
            'PDF automatic download trigger error:',
            pdfErr,
          );
        }
      }
    } catch (error) {
      console.error(
        'Failed to record company loan payment:',
        error,
      );

      setLoanActionMessage(
        error instanceof Error
          ? error.message
          : 'Unable to record the company loan payment.',
      );
    } finally {
      setLoanActionLoading(false);
    }
  };

  const handleViewReceiptForPayment = (pmt: LoanPaymentRecord) => {
    const targetLoan = companyLoans.find((l) => l.id === pmt.loanId) || loans.find((l) => l.id === pmt.loanId);
    const receiptNum = pmt.receiptNumber || `RCP-${pmt.id}`;
    const prevBal = pmt.remainingBalance + pmt.principalPaid;
    const isCompanyLoanedOut = targetLoan?.direction === 'company_loaned_out' || 
      targetLoan?.type === 'Employee Loan' || 
      targetLoan?.type === 'Partner Advance' || 
      targetLoan?.type === 'Emergency Hardship' || 
      targetLoan?.type === 'Tool & Equipment Advance';

    const receipt: LoanPaymentReceiptData = {
      receiptNumber: receiptNum,
      paymentId: pmt.id,
      transactionId: pmt.transactionId || `TXN-2024-${Math.abs(pmt.id.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)) % 8000 + 1000}`,
      paymentDate: pmt.date,
      timestamp: `${pmt.date} 10:00:00 AM CST`,
      loanId: pmt.loanId,
      loanName: pmt.loanName,
      loanType: targetLoan?.type || 'Employee Loan',
      direction: targetLoan?.direction || (isCompanyLoanedOut ? 'company_loaned_out' : 'company_borrowed'),
      borrowerName: pmt.borrowerName || targetLoan?.borrowerName || (isCompanyLoanedOut ? 'Staff Member' : 'Company'),
      borrowerRole: targetLoan?.borrowerRole || (isCompanyLoanedOut ? 'Employee / Specialist' : 'Commercial Borrower'),
      borrowerEmail: targetLoan?.borrowerEmail || '',
      borrowerId: targetLoan?.borrowerId || '',
      lender: targetLoan?.lender || '',
      amount: pmt.amount,
      principalPaid: pmt.principalPaid,
      interestPaid: pmt.interestPaid,
      previousBalance: prevBal,
      remainingBalance: pmt.remainingBalance,
      paymentMethod: pmt.method,
      disbursementAccount: '',
      reconciledStatus: 'POSTED & RECONCILED',
      notes: targetLoan?.notes,
      authorizedOfficer: approvalOfficial || '',
    };

    setActiveReceiptData(receipt);
    setIsReceiptModalOpen(true);
  };

  const handleNewLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const principalNum = parseFloat(newPrincipal);
    const rateNum = parseFloat(newRate) || 0;
    const pmtNum = parseFloat(newMonthlyPmt);
    if (isNaN(principalNum) || isNaN(pmtNum)) return;

    const isCompanyLoaned = loanCategory === 'company_loaned_out';

    let resolvedBorrowerName = newBorrowerName;
    let resolvedBorrowerRole = newBorrowerRole;
    let resolvedBorrowerEmail = newBorrowerEmail;
    let resolvedBorrowerId = newBorrowerId;

    if (isCompanyLoaned && newBorrowerId !== 'custom') {
      const emp = employees.find(e => e.id === newBorrowerId);
      if (emp) {
        resolvedBorrowerName = emp.name;
        resolvedBorrowerRole = emp.role;
        resolvedBorrowerEmail = emp.email;
        resolvedBorrowerId = emp.id;
      }
    }

    const title = isCompanyLoaned
      ? `${resolvedBorrowerName} - ${newLoanTitle || newType}`
      : newLoanTitle || `${newLenderName} Facility`;

    const prefix = isCompanyLoaned ? 'LOAN-EMP-' : 'LOAN-';
    let maxLoanNum = 0;
    for (const l of loans) {
      if (l.id.startsWith(prefix)) {
        const numPart = l.id.slice(prefix.length);
        const parsed = parseInt(numPart, 10);
        if (!isNaN(parsed) && parsed > maxLoanNum) {
          maxLoanNum = parsed;
        }
      }
    }
    const nextLoanId = `${prefix}${String(maxLoanNum + 1).padStart(2, '0')}`;

    const newLoanObj: LoanItem = {
      id: nextLoanId,
      name: title,
      lender: newLenderName,
      direction: loanCategory,
      borrowerName: isCompanyLoaned ? resolvedBorrowerName : 'Company',
      borrowerRole: isCompanyLoaned ? resolvedBorrowerRole : 'Enterprise Borrower',
      borrowerEmail: isCompanyLoaned ? resolvedBorrowerEmail : undefined,
      borrowerId: isCompanyLoaned ? resolvedBorrowerId : undefined,
      type: newType,
      principalAmount: principalNum,
      currentBalance: principalNum,
      interestRate: rateNum,
      monthlyPayment: pmtNum,
      originationDate: new Date().toISOString().slice(0, 10),
      maturityDate: newMaturity,
      nextPaymentDue: newMaturity,
      autoPay: true,
      repaymentMethod: newRepaymentMethod,
      approvedBy: requiresImmediateApproval ? newApprovedBy : undefined,
      approvedDate: requiresImmediateApproval ? new Date().toISOString().slice(0, 10) : undefined,
      approvalStatus: requiresImmediateApproval ? 'Approved' : 'Pending Approval',
      disbursementAccount: '',
      purpose: newPurpose || (isCompanyLoaned ? 'Employee personal or professional hardship advance' : 'Commercial working capital'),
      status: requiresImmediateApproval ? 'Active' : 'Pending Approval',
      notes: isCompanyLoaned
        ? `Company-issued loan to ${resolvedBorrowerName} at $${pmtNum}/month through ${newRepaymentMethod}. Approved by ${newApprovedBy}.`
        : `Commercial debt facility approved by ${newApprovedBy}.`,
    };

    onAddLoan(newLoanObj);
    setIsNewLoanModalOpen(false);

    // Reset Form
    setNewLoanTitle('');
    setNewPrincipal('');
    setNewMonthlyPmt('');
    setNewPurpose('');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>FINANCING & LIABILITIES</span>
            <span>/</span>
            <span>COMPANY & EMPLOYEE LOAN MANAGEMENT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>Loan Management System</span>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
              Dual-Sided: Employee Loans &amp; Bank Facilities
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Track personnel taking loans from the company, monthly salary deductions, designated approvers, and corporate credit facilities.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => {
              setLoanCategory('company_loaned_out');
              setIsNewLoanModalOpen(true);
            }}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#38bdf8]/40 text-[#38bdf8] rounded-md text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
          >
            <UserCheck className="w-4 h-4 text-[#38bdf8]" />
            <span>Issue Loan to Person / Employee</span>
          </button>
          <button
            onClick={() => setShowEligibilityRules((current) => !current)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            <Settings className="h-4 w-4" />
            <span>Eligibility Rules</span>
          </button>

          <button
            onClick={() => {
              if (activeLoan) {
                setPayLoanId(activeLoan.id);
                setPayAmount(activeLoan.monthlyPayment.toString());
                setPayMethod(activeLoan.repaymentMethod || 'Payroll Deduction');
              }
              setIsPaymentModalOpen(true);
            }}
            className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer font-mono"
          >
            <CreditCard className="w-4 h-4 stroke-[2.5]" />
            <span>Record Monthly Payment</span>
          </button>
        </div>
            </div>

      {/* LOAN ELIGIBILITY RULES PANEL */}
      {showEligibilityRules && (
        <div className="mb-4 rounded-xl border border-[#222a3d] bg-[#131b2e] p-5 space-y-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-white">
                Loan Eligibility Rules
              </h3>
              <p className="text-xs text-[#86948a] mt-1">
                Configure eligibility limits for employees and partners.
              </p>
            </div>

            {eligibilityRulesLoading && (
              <span className="text-xs text-[#86948a]">
                Loading...
              </span>
            )}
          </div>

          {eligibilityRulesMessage && (
            <div className="rounded-lg border border-[#38bdf8]/30 bg-[#38bdf8]/10 px-3 py-2 text-xs text-[#b9e9ff]">
              {eligibilityRulesMessage}
            </div>
          )}

          {!eligibilityRulesLoading &&
            loanEligibilityPolicies.length === 0 && (
              <div className="rounded-lg border border-[#222a3d] bg-[#0f1627] p-4 text-sm text-[#86948a]">
                No eligibility rules were returned for this company.
              </div>
            )}

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
            {loanEligibilityPolicies.map((policy) => (
              <div
                key={policy.personType}
                className="rounded-lg border border-[#222a3d] bg-[#0f1627] p-4 space-y-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {policy.personType === 'employee'
                        ? 'Employee Rules'
                        : 'Partner Rules'}
                    </h4>

                    <p className="text-[11px] text-[#86948a] mt-1">
                      {policy.personType === 'employee'
                        ? 'Rules for company employees.'
                        : 'Rules for company partners.'}
                    </p>
                  </div>

                  <span className="rounded-full border border-[#4edea3]/30 bg-[#4edea3]/10 px-2 py-1 text-[10px] text-[#4edea3]">
                    {policy.status || 'active'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-xs text-[#aeb8c8]">
                    Minimum tenure (days)
                    <input
                      type="number"
                      min="0"
                      value={policy.minimumTenureDays ?? 0}
                      onChange={(e) =>
                        setLoanEligibilityPolicies((items) =>
                          items.map((item) =>
                            item.personType === policy.personType
                              ? {
                                  ...item,
                                  minimumTenureDays: Number(
                                    e.target.value,
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                      className="mt-1 w-full rounded-md border border-[#30394f] bg-[#171f33] px-3 py-2 text-sm text-white outline-none focus:border-[#38bdf8]"
                    />
                  </label>

                  <label className="text-xs text-[#aeb8c8]">
                    Maximum loan amount
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={policy.maximumLoanAmount ?? 0}
                      onChange={(e) =>
                        setLoanEligibilityPolicies((items) =>
                          items.map((item) =>
                            item.personType === policy.personType
                              ? {
                                  ...item,
                                  maximumLoanAmount: e.target.value,
                                }
                              : item,
                          ),
                        )
                      }
                      className="mt-1 w-full rounded-md border border-[#30394f] bg-[#171f33] px-3 py-2 text-sm text-white outline-none focus:border-[#38bdf8]"
                    />
                  </label>

                  <label className="text-xs text-[#aeb8c8]">
                    Salary / income multiple
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={policy.salaryMultiple ?? ''}
                      placeholder="Not required"
                      onChange={(e) =>
                        setLoanEligibilityPolicies((items) =>
                          items.map((item) =>
                            item.personType === policy.personType
                              ? {
                                  ...item,
                                  salaryMultiple:
                                    e.target.value === ''
                                      ? null
                                      : e.target.value,
                                }
                              : item,
                          ),
                        )
                      }
                      className="mt-1 w-full rounded-md border border-[#30394f] bg-[#171f33] px-3 py-2 text-sm text-white outline-none focus:border-[#38bdf8]"
                    />
                  </label>

                  <label className="text-xs text-[#aeb8c8]">
                    Maximum active loans
                    <input
                      type="number"
                      min="1"
                      value={policy.maximumActiveLoans ?? 1}
                      onChange={(e) =>
                        setLoanEligibilityPolicies((items) =>
                          items.map((item) =>
                            item.personType === policy.personType
                              ? {
                                  ...item,
                                  maximumActiveLoans: Math.max(
                                    1,
                                    Number(e.target.value),
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                      className="mt-1 w-full rounded-md border border-[#30394f] bg-[#171f33] px-3 py-2 text-sm text-white outline-none focus:border-[#38bdf8]"
                    />
                  </label>

                  <label className="text-xs text-[#aeb8c8] sm:col-span-2">
                    Minimum gap between loans (days)
                    <input
                      type="number"
                      min="0"
                      value={policy.minimumGapDays ?? 0}
                      onChange={(e) =>
                        setLoanEligibilityPolicies((items) =>
                          items.map((item) =>
                            item.personType === policy.personType
                              ? {
                                  ...item,
                                  minimumGapDays: Math.max(
                                    0,
                                    Number(e.target.value),
                                  ),
                                }
                              : item,
                          ),
                        )
                      }
                      className="mt-1 w-full rounded-md border border-[#30394f] bg-[#171f33] px-3 py-2 text-sm text-white outline-none focus:border-[#38bdf8]"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <label className="flex items-center gap-2 rounded-md border border-[#30394f] bg-[#171f33] px-3 py-2 text-xs text-[#dbe3ef]">
                    <input
                      type="checkbox"
                      checked={Boolean(policy.allowProbation)}
                      onChange={(e) =>
                        setLoanEligibilityPolicies((items) =>
                          items.map((item) =>
                            item.personType === policy.personType
                              ? {
                                  ...item,
                                  allowProbation: e.target.checked,
                                }
                              : item,
                          ),
                        )
                      }
                      className="h-4 w-4"
                    />
                    Allow probation
                  </label>

                  <label className="flex items-center gap-2 rounded-md border border-[#30394f] bg-[#171f33] px-3 py-2 text-xs text-[#dbe3ef]">
                    <input
                      type="checkbox"
                      checked={Boolean(policy.requireActiveStatus)}
                      onChange={(e) =>
                        setLoanEligibilityPolicies((items) =>
                          items.map((item) =>
                            item.personType === policy.personType
                              ? {
                                  ...item,
                                  requireActiveStatus:
                                    e.target.checked,
                                }
                              : item,
                          ),
                        )
                      }
                      className="h-4 w-4"
                    />
                    Require active status
                  </label>

                  <label className="flex items-center gap-2 rounded-md border border-[#30394f] bg-[#171f33] px-3 py-2 text-xs text-[#dbe3ef]">
                    <input
                      type="checkbox"
                      checked={Boolean(policy.allowAdminOverride)}
                      onChange={(e) =>
                        setLoanEligibilityPolicies((items) =>
                          items.map((item) =>
                            item.personType === policy.personType
                              ? {
                                  ...item,
                                  allowAdminOverride:
                                    e.target.checked,
                                }
                              : item,
                          ),
                        )
                      }
                      className="h-4 w-4"
                    />
                    Allow admin override
                  </label>
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      saveLoanEligibilityPolicy(policy)
                    }
                    disabled={
                      eligibilityRulesSaving === policy.personType
                    }
                    className="rounded-md bg-[#38bdf8] px-4 py-2 text-xs font-semibold text-[#062033] hover:bg-[#67ccfa] disabled:opacity-50"
                  >
                    {eligibilityRulesSaving === policy.personType
                      ? 'Saving...'
                      : 'Save Rules'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPI Cards: Tailored for Company Loans to People vs Corporate Bank Debt */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Card 1: Employee Loans Outstanding */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1 flex items-center justify-between">
            <span>Employee Loans Receivable</span>
            <Users className="w-4 h-4 text-[#38bdf8]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#38bdf8]">
            ${totalEmployeeBalance.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2 flex items-center justify-between">
            <span>{employeeLoans.length} Loans to Team Members</span>
            <span className="text-[#4edea3] font-semibold">${(totalEmployeePrincipal - totalEmployeeBalance).toLocaleString()} Recovered</span>
          </div>
        </div>

        {/* Card 2: Monthly Inflow from Paycheck Deductions */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1 flex items-center justify-between">
            <span>Monthly Repayment Inflow</span>
            <ArrowDownRight className="w-4 h-4 text-[#4edea3]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            ${totalMonthlyPayrollCollection.toLocaleString()} / mo
          </div>
          <div className="text-[11px] text-[#86948a] mt-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Auto-deducted directly via Payroll</span>
          </div>
        </div>

        {/* Card 3: Approver & Pending Workflow */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1 flex items-center justify-between">
            <span>Approval & Governance</span>
            <FileCheck2 className="w-4 h-4 text-[#ffb356]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white flex items-center gap-2">
            <span>{pendingApprovalsCount}</span>
            <span className="text-xs font-normal text-[#ffb356] bg-[#ffb356]/15 px-2 py-0.5 rounded border border-[#ffb356]/30">
              {pendingApprovalsCount === 1 ? '1 Pending' : `${pendingApprovalsCount} Pending`}
            </span>
          </div>
          <div className="text-[11px] text-[#86948a] mt-2 truncate">
            Authorized Approvers: <strong>{workspaceMembers.length ? workspaceMembers.map((member) => member.displayName?.trim() || member.email).join(', ') : (workspaceMembersLoading ? 'Loading...' : 'None configured')}</strong>
          </div>
        </div>

        {/* Card 4: Corporate Credit Facilities */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1 flex items-center justify-between">
            <span>Bank Lines &amp; Leases</span>
            <Landmark className="w-4 h-4 text-[#86948a]" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${totalCommercialBalance.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#ffb4ab] mt-2 font-mono">
            ${totalCommercialMonthlyDebt.toLocaleString()} / mo bank debt service
          </div>
        </div>
      </div>

      {/* Main View Filter & Tabs Bar */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tab switcher */}
        <div className="flex items-center gap-1.5 p-1 bg-[#0b1326] border border-[#222a3d] rounded-lg font-mono text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('employee_loans')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'employee_loans'
                ? 'bg-[#38bdf8] text-[#0b1326] font-bold shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>People / Employee Loans ({employeeLoans.length})</span>
            {pendingApprovalsCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-[#ffb356]" />
            )}
          </button>

          <button
            onClick={() => setActiveTab('commercial_debt')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'commercial_debt'
                ? 'bg-[#38bdf8] text-[#0b1326] font-bold shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Bank &amp; Commercial Facilities ({commercialLoans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-md transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'all'
                ? 'bg-[#38bdf8] text-[#0b1326] font-bold shadow'
                : 'text-[#94a3b8] hover:text-white'
            }`}
          >
            <span>All Loans ({loans.length})</span>
          </button>
        </div>

        {/* Search & Status Filter */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-[#86948a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search person, loan, approver..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-white placeholder:text-[#64748b] focus:outline-none focus:border-[#38bdf8]"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-white font-mono focus:outline-none focus:border-[#38bdf8]"
          >
            <option value="ALL">Status: All</option>
            <option value="Active">Status: Active</option>
            <option value="Pending Approval">Status: Pending Approval</option>
            <option value="Paid Off">Status: Paid Off</option>
          </select>
        </div>
      </div>

      {/* Facilities / Employee Loans Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayedLoans.length === 0 ? (
          <div className="col-span-2 p-8 text-center bg-[#131b2e] border border-[#222a3d] rounded-lg text-[#86948a]">
            <Info className="w-8 h-8 text-[#38bdf8] mx-auto mb-2 opacity-50" />
            <div className="font-semibold text-white">No loan records match the current filter</div>
            <div className="text-xs mt-1">Try changing the status filter or click "Issue Loan to Person / Employee" to create one.</div>
          </div>
        ) : (
          displayedLoans.map((loan) => {
            const isEmployeeLoan = loan.direction === 'company_loaned_out' || 
              loan.type === 'Employee Loan' || 
              loan.type === 'Partner Advance' || 
              loan.type === 'Emergency Hardship' || 
              loan.type === 'Tool & Equipment Advance';

            const paidRatio =
              loan.principalAmount > 0
                ? ((loan.principalAmount - loan.currentBalance) / loan.principalAmount) * 100
                : 0;

            const isPending = loan.status === 'Pending Approval';

            return (
              <div
                key={loan.id}
                onClick={() => setSelectedLoanId(loan.id)}
                className={`p-5 rounded-lg border transition-all cursor-pointer flex flex-col justify-between ${
                  selectedLoanId === loan.id
                    ? 'bg-[#171f33] border-[#38bdf8]/60 shadow-md ring-1 ring-[#38bdf8]/30'
                    : 'bg-[#131b2e] border-[#222a3d] hover:border-[#334155]'
                }`}
              >
                <div>
                  {/* Top Bar: Borrower & Status Badge */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        {isEmployeeLoan ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-[#38bdf8]/20 border border-[#38bdf8]/40 flex items-center justify-center text-[#38bdf8] text-[10px] font-bold">
                              {loan.borrowerName ? loan.borrowerName.slice(0, 2).toUpperCase() : 'EM'}
                            </div>
                            <span className="font-mono text-sm font-bold text-white">
                              {loan.borrowerName || loan.name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <Landmark className="w-4 h-4 text-[#4edea3]" />
                            <span className="font-mono text-sm font-bold text-white">
                              {loan.name}
                            </span>
                          </div>
                        )}

                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          loan.type === 'Employee Loan' || loan.type === 'Emergency Hardship'
                            ? 'bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30'
                            : 'bg-[#4edea3]/10 text-[#4edea3] border-[#4edea3]/30'
                        }`}>
                          {loan.type}
                        </span>

                        {isPending && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ffb356]/20 text-[#ffb356] border border-[#ffb356]/40 animate-pulse font-bold">
                            PENDING APPROVAL
                          </span>
                        )}

                        {loan.approvalStatus === 'Declined' && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ffb4ab]/20 text-[#ffb4ab] border border-[#ffb4ab]/40 font-bold">
                            DECLINED
                          </span>
                        )}

                        {loan.status === 'Paid Off' && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] border border-[#4edea3]/40 font-bold">
                            PAID OFF
                          </span>
                        )}

                        {loan.digitalSignature && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30 flex items-center gap-1 font-semibold" title={`Digitally signed: ${loan.digitalSignatureTimestamp || ''}`}>
                            <PenTool className="w-2.5 h-2.5" />
                            <span>Signed</span>
                          </span>
                        )}
                      </div>

                      {/* Borrower Role or Creditor details */}
                      <div className="text-xs text-[#86948a] mt-1 flex items-center gap-2">
                        {isEmployeeLoan ? (
                          <>
                            <span className="text-[#dae2fd]">{loan.borrowerRole || 'Staff Member'}</span>
                            <span>&bull;</span>
                            <span className="text-[#94a3b8]">{loan.borrowerEmail || 'Company Payroll'}</span>
                          </>
                        ) : (
                          <>
                            <span>Lender: <strong className="text-white">{loan.lender}</strong></span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Balance */}
                    <div className="text-right font-mono">
                      <div className="text-lg font-bold text-white">
                        ${loan.currentBalance.toLocaleString()}
                      </div>
                      <div className="text-[10px] text-[#86948a]">
                        of ${loan.principalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Purpose / Notes */}
                  {loan.purpose && (
                    <div className="text-xs text-[#bbcabf] bg-[#0b1326] p-2 rounded border border-[#222a3d] my-2.5">
                      <strong className="text-white text-[11px] font-mono">Loan Purpose:</strong> {loan.purpose}
                    </div>
                  )}

                  {/* Progress bar */}
                  <div className="space-y-1 my-2">
                    <div className="flex justify-between text-[11px] font-mono">
                      <span className="text-[#86948a]">
                        {isEmployeeLoan ? 'Recovered via Salary' : 'Principal Repaid'}
                      </span>
                      <span className="text-[#4edea3] font-semibold">{paidRatio.toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-[#0b1326] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#4edea3] rounded-full transition-all duration-300"
                        style={{ width: `${paidRatio}%` }}
                      />
                    </div>
                  </div>

                  {/* Crucial Details Grid: Monthly Pay, Approver, Method */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-3 border-t border-[#222a3d] text-xs font-mono">
                    {/* Monthly Pay */}
                    <div>
                      <div className="text-[10px] text-[#86948a]">Monthly Deduction</div>
                      <div className="font-bold text-[#ffb4ab]">
                        ${loan.monthlyPayment.toLocaleString()} / mo
                      </div>
                      <div className="text-[9px] text-[#64748b]">
                        {loan.repaymentMethod || (isEmployeeLoan ? 'Payroll Deduction' : 'Auto-Debit')}
                      </div>
                    </div>

                    {/* Interest APR */}
                    <div>
                      <div className="text-[10px] text-[#86948a]">Interest Rate</div>
                      <div className="font-bold text-white">
                        {loan.interestRate === 0 ? (
                          <span className="text-[#4edea3]">0.0% (Company Perk)</span>
                        ) : (
                          `${loan.interestRate}% APR`
                        )}
                      </div>
                      <div className="text-[9px] text-[#64748b]">
                        Term to {loan.maturityDate}
                      </div>
                    </div>

                    {/* Person Who Approved */}
                    <div className="col-span-2 sm:col-span-1 sm:text-right">
                      <div className="text-[10px] text-[#86948a]">
                        {loan.approvalStatus === 'Declined' ? 'Status' : 'Approved By'}
                      </div>
                      {loan.approvalStatus === 'Declined' ? (
                        <div className="font-bold text-[#ffb4ab] truncate">
                          Governance Declined
                        </div>
                      ) : (
                        <div className="font-bold text-[#38bdf8] truncate flex items-center sm:justify-end gap-1">
                          {loan.digitalSignature && <PenTool className="w-3 h-3 text-[#38bdf8]" />}
                          <span>{loan.approvedBy || (isPending ? 'Action Required' : 'Not specified')}</span>
                        </div>
                      )}
                      <div className="text-[9px] text-[#64748b]">
                        {loan.approvalStatus === 'Declined'
                          ? (loan.denialReason || 'Declined upon review')
                          : loan.approvedDate ? `Approved on ${loan.approvedDate}` : 'Pending review'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 mt-3 border-t border-[#222a3d] flex items-center justify-between gap-2 flex-wrap">
                  <span className="text-[11px] font-mono text-[#86948a]">
                    Next Due: <strong className="text-white">{loan.nextPaymentDue}</strong>
                  </span>

                  <div className="flex items-center gap-2">
                    {isPending && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openApprovalModal(loan);
                        }}
                        className="px-2.5 py-1 bg-[#ffb356] hover:bg-[#ffa033] text-[#0b1326] font-bold font-mono text-xs rounded flex items-center gap-1 cursor-pointer transition-all shadow"
                      >
                        <FileCheck2 className="w-3.5 h-3.5" />
                        <span>Review &amp; Approve</span>
                      </button>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPayLoanId(loan.id);
                        setPayAmount(loan.monthlyPayment.toString());
                        setPayMethod(loan.repaymentMethod || (isEmployeeLoan ? 'Payroll Deduction' : 'Direct Bank ACH'));
                        setIsPaymentModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-[#1e293b] hover:bg-[#334155] text-white font-mono text-xs rounded flex items-center gap-1 cursor-pointer transition-all"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-[#4edea3]" />
                      <span>Record Payment</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Payoff Simulation & Amortization Calculator for Selected Loan */}
      {activeLoan && (
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Calculator className="w-4 h-4 text-[#4edea3]" />
                Early Payoff &amp; Salary Recovery Acceleration Simulator
              </h3>
              <p className="text-[11px] text-[#86948a]">
                Simulating extra monthly repayment for: <strong>{activeLoan.name}</strong> ({activeLoan.borrowerName || activeLoan.lender})
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs font-mono">
              <span className="text-[#86948a]">Extra Monthly Principal Deduction:</span>
              <div className="flex items-center gap-1 bg-[#0b1326] border border-[#222a3d] rounded px-2 py-1">
                <span className="text-[#4edea3]">$</span>
                <input
                  type="number"
                  step="50"
                  value={extraPayment}
                  onChange={(e) => setExtraPayment(Math.max(0, parseFloat(e.target.value) || 0))}
                  className="w-20 bg-transparent text-white font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg">
            <div>
              <div className="text-[11px] font-mono text-[#86948a]">Standard Payoff Term</div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                {standardMonths} Months ({ (standardMonths / 12).toFixed(1) } yrs)
              </div>
              <div className="text-[11px] text-[#86948a] mt-1">
                At base ${activeLoan.monthlyPayment}/mo via {activeLoan.repaymentMethod || 'Payroll'}
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-[#86948a]">Accelerated Payoff Term</div>
              <div className="text-xl font-bold font-mono text-[#4edea3] mt-1">
                {acceleratedMonths} Months ({ (acceleratedMonths / 12).toFixed(1) } yrs)
              </div>
              <div className="text-[11px] text-[#4edea3] mt-1 font-semibold">
                Loan cleared {monthsSaved} months sooner!
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-[#86948a]">
                {activeLoan.interestRate > 0 ? 'Estimated Interest Saved' : 'Total Capital Recovered Sooner'}
              </div>
              <div className="text-xl font-bold font-mono text-white mt-1">
                ${activeLoan.interestRate > 0 ? interestSaved.toLocaleString() : activeLoan.currentBalance.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#86948a] mt-1">
                {activeLoan.interestRate > 0 ? 'Retained corporate/employee capital' : 'Returned to corporate liquidity pool'}
              </div>
            </div>
          </div>

          {/* Loan Governance & Digital Signature Audit Banner */}
          <div className="mt-4 p-3.5 rounded-lg bg-[#0b1326] border border-[#222a3d] flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-start gap-2.5">
              <div className="p-1.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[#86948a] text-[10px] uppercase">Corporate Governance &amp; Authorization</div>
                <div className="text-white font-bold flex items-center gap-1.5 mt-0.5">
                  <span>Approver:</span>
                  <span className="text-[#38bdf8]">{activeLoan.approvedBy || 'Pending Executive Review'}</span>
                  {activeLoan.approvedDate && (
                    <span className="text-[#86948a] font-normal text-[11px]">({activeLoan.approvedDate})</span>
                  )}
                </div>
                {activeLoan.approvalNotes && (
                  <div className="text-[11px] text-[#dae2fd] mt-1 italic">
                    Notes: &ldquo;{activeLoan.approvalNotes}&rdquo;
                  </div>
                )}
                {activeLoan.denialReason && (
                  <div className="text-[11px] text-[#ffb4ab] mt-1">
                    Declined: {activeLoan.denialReason}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 self-start md:self-center">
              {activeLoan.digitalSignature ? (
                <div className="p-2 px-3 rounded bg-[#171f33] border border-[#38bdf8]/30 flex items-center gap-2">
                  <PenTool className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <div className="text-left">
                    <div className="text-[9px] text-[#86948a] uppercase">Digital Signature on Record</div>
                    {activeLoan.digitalSignature.startsWith('data:image') ? (
                      <img
                        src={activeLoan.digitalSignature}
                        alt="Digital signature"
                        referrerPolicy="no-referrer"
                        className="h-6 max-w-[140px] object-contain invert hue-rotate-180"
                      />
                    ) : (
                      <div className="text-[#38bdf8] font-mono font-bold italic text-xs">
                        {activeLoan.digitalSignature}
                      </div>
                    )}
                    {activeLoan.digitalSignatureTimestamp && (
                      <div className="text-[9px] text-[#64748b]">{activeLoan.digitalSignatureTimestamp}</div>
                    )}
                  </div>
                </div>
              ) : activeLoan.status === 'Pending Approval' ? (
                <button
                  type="button"
                  onClick={() => openApprovalModal(activeLoan)}
                  className="px-3 py-1.5 bg-[#ffb356] hover:bg-[#ffa033] text-[#0b1326] font-bold rounded flex items-center gap-1.5 shadow transition-all cursor-pointer"
                >
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>Execute Sign-Off</span>
                </button>
              ) : (
                <div className="text-[11px] text-[#86948a] flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3]" />
                  <span>Approved under Standard Charter</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Disbursed Debt & Employee Loan Repayment Ledger */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white mb-0.5 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#4edea3]" />
              Disbursed Loan &amp; Salary Recovery Ledger
            </h3>
            <p className="text-[11px] text-[#86948a]">
              Audit trail of employee payroll deductions and corporate debt service installments
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] font-mono border-b border-[#222a3d]">
              <tr>
                <th className="py-2.5 px-4">Payment ID / Date</th>
                <th className="py-2.5 px-4">Borrower / Loan Facility</th>
                <th className="py-2.5 px-4">Repayment Channel</th>
                <th className="py-2.5 px-4">Principal Credited</th>
                <th className="py-2.5 px-4">Interest Portion</th>
                <th className="py-2.5 px-4 text-right">Amount Collected</th>
                <th className="py-2.5 px-4 text-right">Balance Remaining</th>
                <th className="py-2.5 px-4 text-center">PDF Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d]">
              {payments.map((pmt) => (
                <tr key={pmt.id} className="hover:bg-[#171f33]/60 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <div className="font-semibold text-white">{pmt.id}</div>
                    <div className="text-[11px] text-[#86948a]">{pmt.date}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-medium text-white">{pmt.loanName}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px] text-[#dae2fd]">
                    <span className="px-2 py-0.5 rounded bg-[#1e293b] border border-[#334155]">
                      {pmt.method}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[#4edea3]">
                    ${pmt.principalPaid.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 font-mono text-[#ffb4ab]">
                    ${pmt.interestPaid.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white">
                    ${pmt.amount.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-[#86948a]">
                    ${pmt.remainingBalance.toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => handleViewReceiptForPayment(pmt)}
                      className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-[#334155] border border-[#4edea3]/30 text-[#4edea3] text-[11px] font-mono flex items-center gap-1.5 transition-colors cursor-pointer mx-auto shadow-sm"
                      title="View, print, or download official PDF receipt"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>PDF Receipt</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD LOAN REPAYMENT (Payroll Deduction or Bank Debit) */}
      {/* ========================================================================= */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#4edea3]/10 text-[#4edea3]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Record Loan Repayment</h3>
                  <p className="text-[11px] text-[#86948a]">Collect payroll deduction or disburse debt installment</p>
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(false)}
                className="p-1 rounded hover:bg-[#171f33] text-[#86948a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Select Loan / Person*</label>
                <select
                  value={payLoanId}
                  onChange={(e) => {
                    setPayLoanId(e.target.value);
                    const l = loans.find((item) => item.id === e.target.value);
                    if (l) {
                      setPayAmount(l.monthlyPayment.toString());
                      setPayMethod(l.repaymentMethod || 'Payroll Deduction');
                    }
                  }}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                >
                  {companyLoans.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.borrowerName || l.name} - Balance: ${l.currentBalance.toLocaleString()} ({l.type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Repayment Amount ($ USD)*</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white font-mono focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Repayment Collection Method</label>
                <select
                  value={payMethod}
                  onChange={(e) => setPayMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                >
                  <option value="Payroll Deduction">Payroll Deduction (Bi-weekly auto-withholding)</option>
                  <option value="Direct Bank ACH">Direct Bank ACH</option>

                  <option value="Check / Wire Transfer">Check / Wire Transfer</option>
                </select>
              </div>

              {/* Automatic PDF Receipt Generation Setting */}
              <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded bg-[#4edea3]/10 text-[#4edea3]">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-white">Auto-generate PDF Receipt</div>
                    <div className="text-[10px] text-[#86948a]">
                      Immediately create and open official printable payment receipt upon submission
                    </div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  id="auto-generate-pdf-receipt-toggle"
                  checked={autoGeneratePdfReceipt}
                  onChange={(e) => setAutoGeneratePdfReceipt(e.target.checked)}
                  className="w-4 h-4 rounded border-[#2d3449] bg-[#131b2e] text-[#4edea3] focus:ring-[#4edea3] cursor-pointer"
                />
              </div>

              <div className="pt-3 border-t border-[#222a3d] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-3 py-1.5 rounded text-[#86948a] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-semibold shadow-sm transition-all cursor-pointer font-mono"
                >
                  Process &amp; Reconcile Repayment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ISSUE LOAN (TO PERSON OR ENTERPRISE FACILITY) */}
      {/* ========================================================================= */}
      {isNewLoanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-xl max-h-[90vh] shadow-2xl overflow-y-auto animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326] sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#38bdf8]/15 text-[#38bdf8]">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Create &amp; Issue Loan</h3>
                  <p className="text-[11px] text-[#86948a]">Define borrower, monthly repayment amount, and designated approver</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewLoanModalOpen(false)}
                className="p-1 rounded hover:bg-[#171f33] text-[#86948a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleNewLoanSubmit} className="p-5 space-y-4 text-xs">
              {/* Type Switcher: Person vs Commercial */}
              <div className="p-3 bg-[#0b1326] rounded-lg border border-[#222a3d]">
                <label className="block text-[11px] font-mono text-[#86948a] mb-1.5 font-semibold uppercase">
                  Loan Recipient Type
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLoanCategory('company_loaned_out');
                      setNewType('Employee Loan');
                      setNewRate('0');
                    }}
                    className={`py-2 px-3 rounded text-xs font-mono font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      loanCategory === 'company_loaned_out'
                        ? 'bg-[#38bdf8] text-[#0b1326] font-bold shadow'
                        : 'bg-[#131b2e] text-[#94a3b8] hover:text-white border border-[#222a3d]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Person / Employee Loan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoanCategory('company_borrowed');
                      setNewType('Line of Credit');
                      setNewRate('6.5');
                    }}
                    className={`py-2 px-3 rounded text-xs font-mono font-medium flex items-center justify-center gap-2 cursor-pointer transition-all ${
                      loanCategory === 'company_borrowed'
                        ? 'bg-[#38bdf8] text-[#0b1326] font-bold shadow'
                        : 'bg-[#131b2e] text-[#94a3b8] hover:text-white border border-[#222a3d]'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Company Bank Facility</span>
                  </button>
                </div>
              </div>

              {/* PERSON / EMPLOYEE BORROWER SECTION */}
              {loanCategory === 'company_loaned_out' ? (
                <div className="space-y-3 p-3.5 rounded-lg bg-[#0b1326]/60 border border-[#222a3d]">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono text-[#38bdf8]">
                    <Users className="w-3.5 h-3.5" />
                    <span>1. Person Taking the Loan from Company</span>
                  </h4>

                  <div>
                    <label className="block text-[11px] font-mono text-[#86948a] mb-1">Select Employee / Team Member</label>
                    <select
                      value={newBorrowerId}
                      onChange={(e) => {
                        setNewBorrowerId(e.target.value);
                        if (e.target.value !== 'custom') {
                          const emp = employees.find(item => item.id === e.target.value);
                          if (emp) {
                            setNewBorrowerName(emp.name);
                            setNewBorrowerRole(emp.role);
                            setNewBorrowerEmail(emp.email);
                          }
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#38bdf8]"
                    >
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} - {emp.role} ({emp.department})
                        </option>
                      ))}
                      <option value="custom">Other Person / Contractor...</option>
                    </select>
                  </div>

                  {newBorrowerId === 'custom' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-mono text-[#86948a] mb-1">Borrower Full Name*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Rachel Adams"
                          value={newBorrowerName}
                          onChange={(e) => setNewBorrowerName(e.target.value)}
                          className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#38bdf8]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-mono text-[#86948a] mb-1">Role / Department*</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Lead Concrete Takeoff"
                          value={newBorrowerRole}
                          onChange={(e) => setNewBorrowerRole(e.target.value)}
                          className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#38bdf8]"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-mono text-[#86948a] mb-1">Loan Title / Agreement Reference</label>
                    <input
                      type="text"
                      placeholder="e.g. Emergency Hardship Advance &amp; Travel Assistance"
                      value={newLoanTitle}
                      onChange={(e) => setNewLoanTitle(e.target.value)}
                      className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#38bdf8]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-[#86948a] mb-1">Loan Classification</label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#38bdf8]"
                    >
                      <option value="Employee Loan">Employee Loan (General Assistance)</option>
                      <option value="Emergency Hardship">Emergency Hardship Advance (Benevolent)</option>
                      <option value="Tool & Equipment Advance">Tool & Equipment / Workstation Advance</option>
                      <option value="Partner Advance">Partner Draw Advance</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 p-3.5 rounded-lg bg-[#0b1326]/60 border border-[#222a3d]">
                  <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono text-[#4edea3]">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>Commercial Lending Institution</span>
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-mono text-[#86948a] mb-1">Bank / Lender Name*</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Bank or lender name"
                        value={newLenderName}
                        onChange={(e) => setNewLenderName(e.target.value)}
                        className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#86948a] mb-1">Facility Type</label>
                      <select
                        value={newType}
                        onChange={(e) => setNewType(e.target.value as any)}
                        className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                      >
                        <option value="Line of Credit">Line of Credit</option>
                        <option value="SBA 7(a) Term">SBA 7(a) Term</option>
                        <option value="Equipment Lease">Equipment Lease</option>
                        <option value="Working Capital">Working Capital</option>
                        <option value="Founder Bridge">Founder Bridge</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* LOAN FINANCIAL TERMS: PRINCIPAL, MONTHLY PAYMENT, INTEREST, DURATION */}
              <div className="p-3.5 rounded-lg bg-[#0b1326]/60 border border-[#222a3d] space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono text-[#4edea3]">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>2. Financial Terms &amp; Monthly Payment Schedule</span>
                </h4>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#86948a] mb-1">Total Loan Amount ($)*</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 5000"
                      value={newPrincipal}
                      onChange={(e) => {
                        setNewPrincipal(e.target.value);
                        const val = parseFloat(e.target.value);
                        if (!isNaN(val) && val > 0 && !newMonthlyPmt) {
                          // Suggest a 12-month repayment default
                          setNewMonthlyPmt((Math.round(val / 12)).toString());
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white font-mono focus:outline-none focus:border-[#4edea3]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-[#ffb4ab] mb-1 font-bold">Monthly Payment ($ / mo)*</label>
                    <input
                      type="number"
                      required
                      placeholder="e.g. 400"
                      value={newMonthlyPmt}
                      onChange={(e) => setNewMonthlyPmt(e.target.value)}
                      className="w-full px-3 py-2 bg-[#131b2e] border border-[#ffb4ab]/50 rounded text-white font-mono font-bold focus:outline-none focus:border-[#ffb4ab]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-[#86948a] mb-1">Interest Rate (% APR)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={newRate}
                      onChange={(e) => setNewRate(e.target.value)}
                      className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white font-mono focus:outline-none focus:border-[#4edea3]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-mono text-[#86948a] mb-1">Maturity / Target Payoff Date</label>
                    <input
                      type="date"
                      value={newMaturity}
                      onChange={(e) => setNewMaturity(e.target.value)}
                      className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white font-mono focus:outline-none focus:border-[#4edea3]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-[#86948a] mb-1">Repayment Method</label>
                    <select
                      value={newRepaymentMethod}
                      onChange={(e) => setNewRepaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                    >
                      <option value="Payroll Deduction">Payroll Deduction (Salary auto-withheld)</option>
                      <option value="Direct Bank ACH">Direct Bank ACH</option>
                      <option value="Auto-Debit">Auto-Debit from Account</option>
                      <option value="Check">Check / Cash</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* APPROVER & GOVERNANCE SECTION */}
              <div className="p-3.5 rounded-lg bg-[#0b1326]/60 border border-[#222a3d] space-y-3">
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5 font-mono text-[#ffb356]">
                  <FileCheck2 className="w-3.5 h-3.5" />
                  <span>3. Designated Approver &amp; Reason</span>
                </h4>

                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Person Who Approves the Loan*</label>
                  <select
                    value={newApprovedBy}
                    onChange={(e) => setNewApprovedBy(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#ffb356]"
                  >
                      {workspaceMembers.length === 0 ? (
                        <option value="">{workspaceMembersLoading ? "Loading workspace members..." : "No workspace members available"}</option>
                      ) : (
                        workspaceMembers.map((member) => {
                          const name = member.displayName?.trim() || member.email;
                          const role = member.entityRole || member.membershipRole;
                          const label = role ? `${name} (${role})` : name;
                          return (
                            <option key={member.userId} value={label}>
                              {label}
                            </option>
                          );
                        })
                      )}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Loan Purpose &amp; Justification</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Housing relocation deposit for Dallas office expansion; repaid across 12 monthly paycheck deductions."
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#ffb356]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="immediateApproval"
                    checked={requiresImmediateApproval}
                    onChange={(e) => setRequiresImmediateApproval(e.target.checked)}
                    className="rounded text-[#4edea3] focus:ring-0 cursor-pointer"
                  />
                  <label htmlFor="immediateApproval" className="text-xs text-[#dae2fd] cursor-pointer">
                    Authorize and activate loan immediately (Disbursement cleared)
                  </label>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-[#222a3d] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewLoanModalOpen(false)}
                  className="px-3 py-1.5 rounded text-[#86948a] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#38bdf8] hover:bg-[#0284c7] text-[#0b1326] rounded font-bold font-mono shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Enroll &amp; Authorize Loan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REVIEW & APPROVE PENDING LOAN WITH DIGITAL SIGNATURE */}
      {/* ========================================================================= */}
      {isApprovalModalOpen && loanToApprove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#131b2e] border border-[#ffb356]/40 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-6">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#ffb356]/15 text-[#ffb356]">
                  <FileCheck2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Loan Governance &amp; Approval Sign-Off</h3>
                  <p className="text-[11px] text-[#86948a]">Formal review, verification, and digital sign-off execution</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsApprovalModalOpen(false);
                  setLoanToApprove(null);
                }}
                className="p-1 rounded hover:bg-[#171f33] text-[#86948a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Summary of loan terms */}
              <div className="p-4 rounded-lg bg-[#0b1326] border border-[#222a3d] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#86948a] font-mono">Borrower Name:</span>
                  <strong className="text-white text-sm">{loanToApprove.borrowerName || loanToApprove.name}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#86948a] font-mono">Role / Position:</span>
                  <span className="text-[#dae2fd]">{loanToApprove.borrowerRole || 'Staff'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#86948a] font-mono">Loan Direction / Type:</span>
                  <span className="text-[#38bdf8] font-mono">{loanToApprove.type}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#86948a] font-mono">Total Loan Requested:</span>
                  <strong className="text-[#4edea3] font-mono text-sm">${loanToApprove.principalAmount.toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#86948a] font-mono">Monthly Repayment:</span>
                  <strong className="text-[#ffb4ab] font-mono text-sm">${loanToApprove.monthlyPayment.toLocaleString()} / mo</strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#86948a] font-mono">Repayment Channel:</span>
                  <span className="text-[#dae2fd] font-mono">{loanToApprove.repaymentMethod || 'Payroll Deduction'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[#86948a] font-mono">Target Payoff Date:</span>
                  <span className="text-white font-mono">{loanToApprove.maturityDate}</span>
                </div>
              </div>

              {loanToApprove.purpose && (
                <div className="p-3 rounded bg-[#0b1326] border border-[#222a3d]">
                  <div className="text-[10px] font-mono text-[#86948a] uppercase mb-1">Stated Purpose:</div>
                  <div className="text-[#dae2fd]">{loanToApprove.purpose}</div>
                </div>
              )}

              {/* Toggle Decline or Approve view */}
              {isDenialMode ? (
                /* Denial Form */
                <div className="p-4 rounded-lg bg-[#241315] border border-[#ffb4ab]/40 space-y-3">
                  <div className="flex items-center gap-2 text-[#ffb4ab] font-bold">
                    <AlertCircle className="w-4 h-4" />
                    <span>Decline Loan Application</span>
                  </div>
                  <p className="text-[11px] text-[#ffb4ab]/80">
                    Provide the governance or financial reason for declining this request. This reason will be logged on the record.
                  </p>
                  <div>
                    <label className="block text-[10px] font-mono text-[#ffb4ab] uppercase mb-1">
                      Reason for Denial:
                    </label>
                    <textarea
                      rows={3}
                      value={denialReason}
                      onChange={(e) => setDenialReason(e.target.value)}
                      placeholder="e.g., Requested amount exceeds 30% monthly disposable compensation limit, or insufficient tenure..."
                      className="w-full bg-[#0b1326] border border-[#ffb4ab]/30 rounded p-2 text-white placeholder-[#86948a] focus:outline-none focus:border-[#ffb4ab] font-mono text-xs"
                    />
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsDenialMode(false)}
                      className="px-3 py-1.5 rounded border border-[#222a3d] text-[#86948a] hover:text-white"
                    >
                      Back to Approval
                    </button>
                   <button
  type="button"
  disabled={loanActionLoading}
  onClick={() => handleDeclineLoan(loanToApprove)}
  className={`px-4 py-1.5 rounded text-white font-bold font-mono transition-colors ${
    loanActionLoading
      ? 'bg-[#222a3d] text-[#64748b] cursor-not-allowed'
      : 'bg-[#93000a] hover:bg-[#ba1a1a]'
  }`}
>
  {loanActionLoading ? 'Processing...' : 'Confirm Rejection'}
</button>
                  </div>
                </div>
              ) : (
                /* Standard Approval & Digital Signature Block */
                <div className="space-y-4">
                  {/* Approving Official Field */}
                  <div className="bg-[#171f33] p-3.5 rounded border border-[#38bdf8]/30">
                    <label className="block text-[11px] font-mono text-[#38bdf8] mb-1 font-bold">
                      Signing Approver Official:
                    </label>
                    <div className="w-full bg-[#0b1326] border border-[#222a3d] rounded px-3 py-2 text-white font-mono text-xs">Authenticated finance-authorized user</div>
                    <div className="text-[10px] text-[#86948a] mt-1">
                      Authorized under Corporate Benevolent Assistance &amp; Executive Lending Governance.
                    </div>
                  </div>
{/* Company Disbursement Account */}
<div className="bg-[#171f33] p-3.5 rounded border border-[#4edea3]/30">
  <label className="block text-[11px] font-mono text-[#4edea3] mb-1 font-bold">
    Disbursement Account:
  </label>

  {companyFinanceAccountsLoading ? (
    <div className="text-[11px] text-[#86948a] font-mono py-2">
      Loading company finance accounts...
    </div>
  ) : companyFinanceAccounts.length === 0 ? (
    <div className="text-[11px] text-[#ffb4ab] font-mono py-2">
      No company finance accounts are available. Create a company finance account before approving this loan.
    </div>
  ) : (
    <>
      <select
        value={selectedDisbursementAccountId}
        onChange={(e) => setSelectedDisbursementAccountId(e.target.value)}
        className="w-full bg-[#0b1326] border border-[#222a3d] rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#4edea3]"
      >
        <option value="">Select company account...</option>
        {companyFinanceAccounts.map((account) => (
          <option key={account.id} value={account.id}>
            {account.name} - {account.currency} {Number(account.currentBalance || 0).toLocaleString()}
          </option>
        ))}
      </select>

      <div className="text-[10px] text-[#86948a] mt-1">
        The approved loan amount will be deducted from this company account.
      </div>
    </>
  )}
</div>

                  {/* Optional Digital Signature Section */}
                  <div className="p-3.5 rounded bg-[#0b1326] border border-[#222a3d] space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <PenTool className="w-3.5 h-3.5 text-[#38bdf8]" />
                        <span className="font-mono font-bold text-white text-xs">Optional Digital Signature:</span>
                      </div>
                      {/* Tabs: Type Signature vs Draw Signature */}
                      <div className="flex items-center gap-1 bg-[#131b2e] p-0.5 rounded border border-[#222a3d]">
                        <button
                          type="button"
                          onClick={() => setApprovalSignatureType('typed')}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all ${
                            approvalSignatureType === 'typed'
                              ? 'bg-[#38bdf8] text-[#0b1326] font-bold shadow'
                              : 'text-[#86948a] hover:text-white'
                          }`}
                        >
                          Type Signature
                        </button>
                        <button
                          type="button"
                          onClick={() => setApprovalSignatureType('drawn')}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-mono cursor-pointer transition-all ${
                            approvalSignatureType === 'drawn'
                              ? 'bg-[#38bdf8] text-[#0b1326] font-bold shadow'
                              : 'text-[#86948a] hover:text-white'
                          }`}
                        >
                          Draw Signature
                        </button>
                      </div>
                    </div>

                    {approvalSignatureType === 'typed' ? (
                      <div>
                        <div className="relative">
                          <input
                            type="text"
                            value={typedSignature}
                            onChange={(e) => setTypedSignature(e.target.value)}
                            placeholder="e.g. s/ Firstname Lastname"
                            className="w-full bg-[#131b2e] border border-[#222a3d] rounded px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#38bdf8] italic tracking-wide"
                          />
                        </div>
                        <p className="text-[10px] text-[#86948a] mt-1 font-mono">
                          Format: standard legal e-signature identifier (e.g., <span className="text-[#38bdf8]">s/ Firstname Lastname</span>).
                        </p>
                      </div>
                    ) : (
                      <div>
                        <div className="border border-[#222a3d] rounded-lg bg-[#131b2e] p-2 flex flex-col items-center">
                          <canvas
                            ref={signatureCanvasRef}
                            width={420}
                            height={110}
                            onMouseDown={handleCanvasMouseDown}
                            onMouseMove={handleCanvasMouseMove}
                            onMouseUp={handleCanvasMouseUp}
                            onMouseLeave={handleCanvasMouseUp}
                            onTouchStart={handleCanvasTouchStart}
                            onTouchMove={handleCanvasTouchMove}
                            onTouchEnd={handleCanvasMouseUp}
                            className="border border-dashed border-[#222a3d] rounded bg-[#0b1326] cursor-crosshair w-full max-w-full"
                          />
                          <div className="w-full flex items-center justify-between mt-2 pt-2 border-t border-[#222a3d]/60 text-[10px]">
                            <span className="text-[#86948a] font-mono">Sign on the pad using mouse, pen, or touch</span>
                            <button
                              type="button"
                              onClick={clearSignatureCanvas}
                              className="px-2 py-1 bg-[#222a3d] hover:bg-[#334155] text-[#dae2fd] rounded flex items-center gap-1 font-mono"
                            >
                              <Eraser className="w-3 h-3" />
                              <span>Clear</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Executive Notes */}
                    <div className="pt-1">
                      <label className="block text-[10px] font-mono text-[#86948a] uppercase mb-1">
                        Executive Notes or Conditions (Optional):
                      </label>
                      <input
                        type="text"
                        value={approvalNotes}
                        onChange={(e) => setApprovalNotes(e.target.value)}
                        placeholder="e.g., Subject to payroll deduction verification; disbursement method..."
                        className="w-full bg-[#131b2e] border border-[#222a3d] rounded px-3 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#38bdf8]"
                      />
                    </div>

                    {/* Consent checkbox */}
                    <label className="flex items-start gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={signatureConsent}
                        onChange={(e) => setSignatureConsent(e.target.checked)}
                        className="mt-0.5 accent-[#4edea3]"
                      />
                      <span className="text-[11px] text-[#86948a]">
                        I confirm this loan complies with company treasury policies and authorize disbursement according to the established monthly schedule.
                      </span>
                    </label>
                  </div>

                  {/* Modal Action Buttons */}
                  <div className="pt-3 border-t border-[#222a3d] flex items-center justify-between gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsDenialMode(true)}
                      className="px-3 py-1.5 rounded border border-[#ffb4ab]/30 text-[#ffb4ab] hover:bg-[#ffb4ab]/10 transition-colors cursor-pointer"
                    >
                      Decline Request...
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsApprovalModalOpen(false);
                          setLoanToApprove(null);
                        }}
                        className="px-3 py-1.5 rounded border border-[#222a3d] text-[#86948a] hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={
!signatureConsent ||
!selectedDisbursementAccountId ||
			  companyFinanceAccountsLoading ||
loanActionLoading
			}
                        onClick={() => handleApproveLoan(loanToApprove)}
                        className={`px-4 py-2 font-bold font-mono rounded shadow transition-all cursor-pointer flex items-center gap-1.5 ${
                          signatureConsent
                            ? 'bg-[#4edea3] hover:bg-[#40cf95] text-[#003824]'
                            : 'bg-[#222a3d] text-[#64748b] cursor-not-allowed'
                        }`}
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Sign &amp; Approve Disbursal</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Automatically Generated Official Loan Payment PDF Receipt Modal */}
      {isReceiptModalOpen && activeReceiptData && (
        <LoanPaymentReceiptModal
          receipt={activeReceiptData}
          onClose={() => {
            setIsReceiptModalOpen(false);
            setActiveReceiptData(null);
          }}
          onEmailReceipt={() => {}}
        />
      )}
    </div>
  );
};
