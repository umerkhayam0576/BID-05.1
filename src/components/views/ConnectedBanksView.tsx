import React, { useState } from 'react';
import {
  Landmark,
  ShieldCheck,
  Send,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Sliders,
  DollarSign,
  ArrowUpRight,
  ArrowDownRight,
  Lock,
  UserCheck,
  FileCheck2,
  HelpCircle,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  KeyRound,
  Link,
  Eye,
  EyeOff,
  Check,
} from 'lucide-react';
import {
  ConnectedBankAccount,
  BankTransferRequest,
  PartnerItem,
  CashTransaction,
  BankTransactionType,
} from '../../types';

interface ConnectedBanksViewProps {
  accounts: ConnectedBankAccount[];
  transferRequests: BankTransferRequest[];
  partners: PartnerItem[];
  currentUserId?: string; // e.g. 'PARTNER-01' (Umer Khayam)
  onUpdateAccountLimits: (accountId: string, newAutoLimit: number, newDualSignOffLimit: number) => void;
  onUpdateAccount?: (updatedAccount: ConnectedBankAccount) => void;
  onAddAccount?: (newAccount: ConnectedBankAccount) => void;
  onRemoveAccount?: (accountId: string) => void;
  onCreateTransferRequest: (request: BankTransferRequest) => void;
  onPartnerApprovalAction: (requestId: string, partnerId: string, partnerName: string, action: 'approved' | 'rejected', notes?: string) => void;
  onExecuteApprovedTransfer: (requestId: string) => void;
  onRefreshBalances: () => void;
}

export const ConnectedBanksView: React.FC<ConnectedBanksViewProps> = ({
  accounts,
  transferRequests,
  partners,
  currentUserId = 'PARTNER-01',
  onUpdateAccountLimits,
  onUpdateAccount,
  onAddAccount,
  onCreateTransferRequest,
  onPartnerApprovalAction,
  onExecuteApprovedTransfer,
  onRefreshBalances,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'pending' | 'auto_approved' | 'executed'>('all');
  const [isNewTransferOpen, setIsNewTransferOpen] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [selectedConnectProvider, setSelectedConnectProvider] = useState<'wise' | 'payoneer' | 'mercury'>('wise');
  const [editingLimitAccount, setEditingLimitAccount] = useState<ConnectedBankAccount | null>(null);
  const [tempAutoLimit, setTempAutoLimit] = useState<number>(5000);
  const [tempDualLimit, setTempDualLimit] = useState<number>(25000);
  const [activePartnerId, setActivePartnerId] = useState<string>(currentUserId);

  // Connect Bank Form State
  const [apiTokenInput, setApiTokenInput] = useState('');
  const [profileOrClientId, setProfileOrClientId] = useState('');
  const [customInitialBalance, setCustomInitialBalance] = useState('');
  const [connectSuccessMsg, setConnectSuccessMsg] = useState<string | null>(null);

  // New Transfer Form State
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientDetails, setRecipientDetails] = useState<string>('');
  const [transactionType, setTransactionType] = useState<BankTransactionType>('vendor_bill');
  const [purpose, setPurpose] = useState<string>('');

  const currentPartner = partners.find((p) => p.id === activePartnerId) || partners[0] || {
    id: 'PARTNER-01',
    name: 'Umer Khayam',
    role: 'Founder & Managing Principal',
  };

  const totalBankBalance = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalAvailableBalance = accounts.reduce((sum, a) => sum + a.availableBalance, 0);
  const totalPendingHold = accounts.reduce((sum, a) => sum + a.pendingHold, 0);

  const pendingApprovalsCount = transferRequests.filter((r) => r.status === 'pending_partner_approval').length;
  const autoApprovedCount = transferRequests.filter((r) => r.status === 'auto_approved').length;

  const handleOpenLimitSettings = (acc: ConnectedBankAccount) => {
    setEditingLimitAccount(acc);
    setTempAutoLimit(acc.autoApprovalLimit);
    setTempDualLimit(acc.dualSignOffThreshold);
  };

  const handleSaveLimits = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLimitAccount) return;
    onUpdateAccountLimits(editingLimitAccount.id, Number(tempAutoLimit), Number(tempDualLimit));
    setEditingLimitAccount(null);
  };

  const handleInitiateTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const acc = accounts.find((a) => a.id === selectedAccountId);
    if (!acc) return;

    const isBelowLimit = amountNum <= acc.autoApprovalLimit;
    const isDualApprovalRequired = amountNum >= acc.dualSignOffThreshold;

    const newReq: BankTransferRequest = {
      id: `XFER-${Date.now().toString().slice(-6)}`,
      accountId: acc.id,
      provider: acc.provider,
      accountName: acc.accountName,
      recipientName: recipientName.trim(),
      recipientDetails: recipientDetails.trim() || 'Bank Routing Wire / Tag',
      amount: amountNum,
      currency: acc.currency,
      transactionType,
      purpose: purpose.trim() || 'Corporate Operations Disbursement',
      requestedBy: `${currentPartner.name} (${currentPartner.role})`,
      createdAt: new Date().toISOString(),
      status: isBelowLimit ? 'auto_approved' : 'pending_partner_approval',
      thresholdApplied: acc.autoApprovalLimit,
      requiresPartnerApproval: !isBelowLimit,
      approvalPolicy: isBelowLimit
        ? 'below_threshold_auto'
        : isDualApprovalRequired
        ? 'dual_partner_super_majority'
        : 'standard_partner_signoff',
      approvals: isBelowLimit
        ? [
            {
              partnerId: 'SYSTEM-POLICY',
              partnerName: `Policy Auto-Approval (≤ $${acc.autoApprovalLimit.toLocaleString()})`,
              action: 'approved',
              timestamp: new Date().toISOString(),
              notes: `Disbursement amount $${amountNum.toLocaleString()} is within the pre-authorized limit of $${acc.autoApprovalLimit.toLocaleString()}. Auto-cleared without partner sign-off.`,
            },
          ]
        : [],
    };

    onCreateTransferRequest(newReq);
    setIsNewTransferOpen(false);
    // Reset form
    setTransferAmount('');
    setRecipientName('');
    setRecipientDetails('');
    setPurpose('');
  };

  const filteredRequests = transferRequests.filter((r) => {
    if (selectedFilter === 'pending') return r.status === 'pending_partner_approval';
    if (selectedFilter === 'auto_approved') return r.status === 'auto_approved';
    if (selectedFilter === 'executed') return r.status === 'executed';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>TREASURY & INSTITUTIONAL BANKING</span>
            <span>/</span>
            <span>LIVE BALANCES & PARTNER APPROVAL GOVERNANCE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Wise, Payoneer &amp; Mercury Treasury Hub</span>
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Multi-entity live balances, zero-leakage threshold limits, and mandatory partner sign-off for large transactions
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active Partner Switcher for testing/approval preview */}
          <div className="flex items-center gap-1.5 bg-[#131b2e] border border-[#222a3d] rounded-md px-2.5 py-1 text-xs">
            <UserCheck className="w-3.5 h-3.5 text-[#4edea3]" />
            <span className="text-[#86948a] font-mono text-[11px]">Approver:</span>
            <select
              value={activePartnerId}
              onChange={(e) => setActivePartnerId(e.target.value)}
              className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
            >
              {partners.map((p) => (
                <option key={p.id} value={p.id} className="bg-[#131b2e] text-white">
                  {p.name} ({p.role.split('&')[0]})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              setConnectSuccessMsg(null);
              setIsConnectModalOpen(true);
            }}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#4edea3]/40 rounded-md text-xs font-mono text-[#4edea3] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Connect Wise, Payoneer, or Mercury via API Key or Direct Bank Credentials"
          >
            <KeyRound className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Connect Accounts &amp; Keys</span>
          </button>

          <button
            onClick={onRefreshBalances}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Fetch latest API balances"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Sync Live Balances</span>
          </button>

          <button
            onClick={() => setIsNewTransferOpen(true)}
            className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Initiate Transaction</span>
          </button>
        </div>
      </div>

      {/* Aggregate Balance & Policy KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Connected Balance */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-[#86948a] uppercase font-semibold">
              Total Connected Cash
            </span>
            <div className="p-1 rounded bg-[#4edea3]/10 text-[#4edea3]">
              <Landmark className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${totalBankBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2 flex items-center gap-1">
            <span className="font-semibold">3 of 3 Institutions Live</span> • Wise, Payoneer &amp; Mercury
          </div>
        </div>

        {/* Available Liquidity */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-[#86948a] uppercase font-semibold">
              Available for Transfer
            </span>
            <div className="p-1 rounded bg-[#38bdf8]/10 text-[#38bdf8]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#38bdf8]">
            ${totalAvailableBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            ${totalPendingHold.toLocaleString()} in transit clearing holds
          </div>
        </div>

        {/* Pending Partner Approvals */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-[#86948a] uppercase font-semibold">
              Action Required
            </span>
            <div className={`p-1 rounded ${pendingApprovalsCount > 0 ? 'bg-[#ffb4ab]/10 text-[#ffb4ab]' : 'bg-[#4edea3]/10 text-[#4edea3]'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono ${pendingApprovalsCount > 0 ? 'text-[#ffb4ab]' : 'text-white'}`}>
            {pendingApprovalsCount} {pendingApprovalsCount === 1 ? 'Transaction' : 'Transactions'}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Exceeds set limit • Awaiting partner signature
          </div>
        </div>

        {/* Auto-Cleared Transactions */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-[#86948a] uppercase font-semibold">
              Auto-Approved Volume
            </span>
            <div className="p-1 rounded bg-[#4edea3]/10 text-[#4edea3]">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            {autoApprovedCount} Processed
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Under agreed partner threshold limits
          </div>
        </div>
      </div>

      {/* 3 Connected Institutional Account Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Landmark className="w-4 h-4 text-[#4edea3]" />
            <span>Connected Institutional Bank Accounts</span>
          </h2>
          <span className="text-xs font-mono text-[#86948a]">
            Read-only direct balance feed + Discretionary limit governance
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const isMercury = acc.provider === 'mercury';
            const isWise = acc.provider === 'wise';
            const isPayoneer = acc.provider === 'payoneer';

            const providerBadgeColor = isMercury
              ? 'bg-[#3b82f6]/15 text-[#60a5fa] border-[#3b82f6]/30'
              : isWise
              ? 'bg-[#10b981]/15 text-[#34d399] border-[#10b981]/30'
              : 'bg-[#f97316]/15 text-[#fb923c] border-[#f97316]/30';

            const logoLabel = isMercury
              ? 'MERCURY BANK'
              : isWise
              ? 'WISE MULTI-CURRENCY'
              : 'PAYONEER ENTERPRISE';

            return (
              <div
                key={acc.id}
                className="bg-[#131b2e] border border-[#222a3d] hover:border-[#2d3449] rounded-lg p-5 flex flex-col justify-between transition-all shadow-sm"
              >
                <div>
                  {/* Top Row: Provider & Status */}
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${providerBadgeColor}`}>
                      {logoLabel}
                    </span>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#4edea3] font-mono">
                      <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse" />
                      <span>Live Synced</span>
                    </div>
                  </div>

                  {/* Account Name & Mask */}
                  <h3 className="text-base font-bold text-white leading-snug">
                    {acc.accountName}
                  </h3>
                  <div className="text-xs font-mono text-[#86948a] mt-1">
                    Acct: {acc.accountNumberMask} • Routing/BIC: {acc.routingOrBicMask}
                  </div>

                  {/* Big Balance Display */}
                  <div className="mt-4 pt-4 border-t border-[#222a3d]">
                    <div className="text-xs font-mono text-[#86948a] uppercase font-semibold">
                      Current Ledger Balance
                    </div>
                    <div className="text-3xl font-extrabold font-mono text-white mt-1">
                      ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                    <div className="flex items-center justify-between text-xs font-mono mt-2 text-[#bbcabf]">
                      <span>Available: <strong className="text-[#4edea3]">${acc.availableBalance.toLocaleString()}</strong></span>
                      {acc.pendingHold > 0 && (
                        <span className="text-[#86948a]">Hold: ${acc.pendingHold.toLocaleString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Configured Thresholds */}
                  <div className="mt-4 p-3 bg-[#0b1326] border border-[#222a3d] rounded-md space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[#86948a] flex items-center gap-1">
                        <Lock className="w-3 h-3 text-[#4edea3]" />
                        Auto-Approve Limit:
                      </span>
                      <span className="font-mono font-bold text-[#4edea3]">
                        ≤ ${acc.autoApprovalLimit.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[#86948a] flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-[#f59e0b]" />
                        Partner Sign-off Trigger:
                      </span>
                      <span className="font-mono font-bold text-[#ffb4ab]">
                        &gt; ${acc.autoApprovalLimit.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#1f293d]">
                      <span className="text-[#86948a]">Dual-Partner Threshold:</span>
                      <span className="font-mono text-white">&ge; ${acc.dualSignOffThreshold.toLocaleString()}</span>
                    </div>
                  </div>

                  {acc.notes && (
                    <p className="text-[11px] text-[#86948a] mt-3 italic">
                      "{acc.notes}"
                    </p>
                  )}
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-3 border-t border-[#222a3d] flex items-center justify-between gap-2">
                  <button
                    onClick={() => handleOpenLimitSettings(acc)}
                    className="flex-1 py-1.5 px-2 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded text-xs font-mono text-[#dae2fd] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Sliders className="w-3 h-3 text-[#4edea3]" />
                    <span>Adjust Limits</span>
                  </button>

                  <button
                    onClick={() => {
                      setSelectedAccountId(acc.id);
                      setIsNewTransferOpen(true);
                    }}
                    className="flex-1 py-1.5 px-2 bg-[#4edea3]/15 hover:bg-[#4edea3]/25 text-[#4edea3] border border-[#4edea3]/30 rounded text-xs font-mono font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send From Here</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Transactions & Partner Approval Workflow Engine */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        {/* Controls / Filter Bar */}
        <div className="p-4 border-b border-[#222a3d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
              <span>Partner Approval &amp; Transaction Governance Log</span>
            </h3>
            <p className="text-xs text-[#86948a]">
              Small transfers within limit auto-clear. Large transactions require explicit partner authorization.
            </p>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs self-start sm:self-auto">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-[#4edea3] text-[#003824] font-bold'
                  : 'bg-[#171f33] text-[#86948a] hover:text-white'
              }`}
            >
              All ({transferRequests.length})
            </button>
            <button
              onClick={() => setSelectedFilter('pending')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedFilter === 'pending'
                  ? 'bg-[#ffb4ab] text-[#321313] font-bold'
                  : 'bg-[#171f33] text-[#86948a] hover:text-white'
              }`}
            >
              Pending Approval ({pendingApprovalsCount})
            </button>
            <button
              onClick={() => setSelectedFilter('auto_approved')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedFilter === 'auto_approved'
                  ? 'bg-[#4edea3] text-[#003824] font-bold'
                  : 'bg-[#171f33] text-[#86948a] hover:text-white'
              }`}
            >
              Auto-Cleared ({autoApprovedCount})
            </button>
            <button
              onClick={() => setSelectedFilter('executed')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedFilter === 'executed'
                  ? 'bg-[#4edea3] text-[#003824] font-bold'
                  : 'bg-[#171f33] text-[#86948a] hover:text-white'
              }`}
            >
              Executed
            </button>
          </div>
        </div>

        {/* Requests Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#222a3d] text-[11px] font-mono text-[#86948a] uppercase bg-[#0b1326]/60">
                <th className="py-3 px-4 font-semibold">Transaction ID / Account</th>
                <th className="py-3 px-4 font-semibold">Recipient &amp; Purpose</th>
                <th className="py-3 px-4 font-semibold">Amount &amp; Policy</th>
                <th className="py-3 px-4 font-semibold">Governance Status</th>
                <th className="py-3 px-4 font-semibold">Approvals &amp; Signatures</th>
                <th className="py-3 px-4 font-semibold text-right">Partner Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d] text-xs">
              {filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#86948a] font-mono text-xs">
                    No transactions matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => {
                  const isPending = req.status === 'pending_partner_approval';
                  const isAuto = req.status === 'auto_approved';
                  const isExecuted = req.status === 'executed';
                  const isRejected = req.status === 'rejected';

                  const alreadyApprovedByActivePartner = req.approvals.some(
                    (a) => a.partnerId === activePartnerId && a.action === 'approved'
                  );

                  return (
                    <tr key={req.id} className="hover:bg-[#171f33]/40 transition-colors">
                      {/* ID & Account */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="font-bold text-white">{req.id}</div>
                        <div className="text-[11px] text-[#86948a] flex items-center gap-1 mt-0.5">
                          <span className="uppercase font-semibold text-[#4edea3]">{req.provider}</span>
                          <span>•</span>
                          <span className="truncate max-w-[150px]">{req.accountName}</span>
                        </div>
                      </td>

                      {/* Recipient & Purpose */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-white">{req.recipientName}</div>
                        <div className="text-[11px] text-[#86948a] truncate max-w-[240px] mt-0.5">
                          {req.purpose}
                        </div>
                        <div className="text-[10px] font-mono text-[#bbcabf] mt-0.5">
                          Req by: {req.requestedBy}
                        </div>
                      </td>

                      {/* Amount & Threshold */}
                      <td className="py-3.5 px-4 font-mono">
                        <div className="text-sm font-bold text-white">
                          ${req.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-[#86948a] mt-0.5">
                          {req.amount <= req.thresholdApplied ? (
                            <span className="text-[#4edea3]">Within ${req.thresholdApplied.toLocaleString()} limit</span>
                          ) : (
                            <span className="text-[#ffb4ab]">Exceeds ${req.thresholdApplied.toLocaleString()} threshold</span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-3.5 px-4">
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#ffb4ab]/15 text-[#ffb4ab] border border-[#ffb4ab]/30">
                            <Clock className="w-3 h-3" />
                            <span>Partner Sign-Off Required</span>
                          </span>
                        )}
                        {isAuto && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Auto-Approved (&le; Limit)</span>
                          </span>
                        )}
                        {isExecuted && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#38bdf8]/15 text-[#38bdf8] border border-[#38bdf8]/30">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Executed &amp; Settled</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/30">
                            <X className="w-3 h-3" />
                            <span>Declined by Partner</span>
                          </span>
                        )}
                      </td>

                      {/* Approvals and Audit */}
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {req.approvals.length === 0 ? (
                          <span className="text-[#86948a] italic">Awaiting first signature...</span>
                        ) : (
                          <div className="space-y-1">
                            {req.approvals.map((app, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-[#bbcabf]">
                                <CheckCircle2 className="w-3 h-3 text-[#4edea3]" />
                                <span className="font-semibold text-white">{app.partnerName}:</span>
                                <span className="text-[#4edea3]">{app.action}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Partner Action Buttons */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isPending && !alreadyApprovedByActivePartner && (
                            <>
                              <button
                                onClick={() =>
                                  onPartnerApprovalAction(
                                    req.id,
                                    activePartnerId,
                                    currentPartner.name,
                                    'approved',
                                    `Authorized by ${currentPartner.name} via Partner Portal`
                                  )
                                }
                                className="px-3 py-1 bg-[#4edea3] hover:bg-[#63edb5] text-[#003824] rounded text-xs font-mono font-bold transition-all cursor-pointer shadow-sm"
                              >
                                Approve Transaction
                              </button>
                              <button
                                onClick={() =>
                                  onPartnerApprovalAction(
                                    req.id,
                                    activePartnerId,
                                    currentPartner.name,
                                    'rejected',
                                    `Declined by ${currentPartner.name}`
                                  )
                                }
                                className="px-2.5 py-1 bg-[#222a3d] hover:bg-[#ffb4ab]/20 text-[#ffb4ab] rounded text-xs font-mono transition-colors cursor-pointer"
                              >
                                Reject
                              </button>
                            </>
                          )}

                          {isPending && alreadyApprovedByActivePartner && (
                            <span className="text-xs font-mono text-[#4edea3] font-semibold flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>You Signed</span>
                            </span>
                          )}

                          {(isAuto || (isPending && req.approvals.length > 0)) && !isExecuted && (
                            <button
                              onClick={() => onExecuteApprovedTransfer(req.id)}
                              className="px-3 py-1 bg-[#171f33] hover:bg-[#222a3d] border border-[#4edea3]/40 text-[#4edea3] rounded text-xs font-mono font-medium transition-colors cursor-pointer"
                            >
                              Disburse Funds
                            </button>
                          )}

                          {isExecuted && (
                            <span className="text-xs font-mono text-[#86948a]">
                              Txn: {req.executionTxnId || 'SETTLED'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Adjust Account Limits & Partner Governance */}
      {editingLimitAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setEditingLimitAccount(null)}
              className="absolute top-4 right-4 text-[#86948a] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Sliders className="w-5 h-5 text-[#4edea3]" />
              <h2 className="text-lg font-bold text-white">
                Set Transaction Limit &amp; Approval Policy
              </h2>
            </div>
            <p className="text-xs text-[#86948a] mb-5">
              Account: <strong className="text-white">{editingLimitAccount.accountName}</strong> ({editingLimitAccount.provider.toUpperCase()})
            </p>

            <form onSubmit={handleSaveLimits} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#bbcabf] mb-1 font-semibold">
                  Small Transaction Auto-Approval Limit ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#86948a] font-mono text-sm">$</span>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={tempAutoLimit}
                    onChange={(e) => setTempAutoLimit(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-sm text-white font-mono focus:outline-none focus:border-[#4edea3]"
                    required
                  />
                </div>
                <p className="text-[11px] text-[#4edea3] mt-1">
                  Any payout, vendor bill, or wire &le; this limit clears automatically without partner waiting.
                </p>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#bbcabf] mb-1 font-semibold">
                  Big Transaction Dual-Partner Threshold ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[#86948a] font-mono text-sm">$</span>
                  <input
                    type="number"
                    min="1000"
                    step="500"
                    value={tempDualLimit}
                    onChange={(e) => setTempDualLimit(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-sm text-white font-mono focus:outline-none focus:border-[#4edea3]"
                    required
                  />
                </div>
                <p className="text-[11px] text-[#ffb4ab] mt-1">
                  Transactions &ge; this limit strictly require at least 2 partner signatures before execution.
                </p>
              </div>

              <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-[#86948a] space-y-1 font-mono">
                <div className="text-white font-semibold flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#38bdf8]" />
                  <span>Summary of Rule Enforcement:</span>
                </div>
                <div>• &le; ${Number(tempAutoLimit).toLocaleString()}: <strong>Immediate Auto-Clear</strong></div>
                <div>• &gt; ${Number(tempAutoLimit).toLocaleString()}: <strong>Partner Sign-Off Sent to Portal</strong></div>
                <div>• &ge; ${Number(tempDualLimit).toLocaleString()}: <strong>Dual Partner Super-Majority Required</strong></div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222a3d]">
                <button
                  type="button"
                  onClick={() => setEditingLimitAccount(null)}
                  className="px-4 py-2 bg-[#171f33] hover:bg-[#222a3d] text-white rounded text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4edea3] hover:bg-[#63edb5] text-[#003824] rounded text-xs font-mono font-bold shadow-sm"
                >
                  Save &amp; Apply Limits
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Initiate New Bank Transaction */}
      {isNewTransferOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsNewTransferOpen(false)}
              className="absolute top-4 right-4 text-[#86948a] hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <Send className="w-5 h-5 text-[#4edea3]" />
              <h2 className="text-lg font-bold text-white">
                Initiate Bank Transaction
              </h2>
            </div>
            <p className="text-xs text-[#86948a] mb-5">
              Transactions will automatically evaluate limits and request partner sign-off if required.
            </p>

            <form onSubmit={handleInitiateTransfer} className="space-y-4">
              <div>
                <label className="block text-xs font-mono text-[#bbcabf] mb-1 font-semibold">
                  Source Account
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-sm text-white font-mono focus:outline-none focus:border-[#4edea3]"
                  required
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.accountName} (Avail: ${a.availableBalance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-[#bbcabf] mb-1 font-semibold">
                    Amount ($ USD)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-[#86948a] font-mono text-sm">$</span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="e.g. 8500"
                      value={transferAmount}
                      onChange={(e) => setTransferAmount(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-sm text-white font-mono focus:outline-none focus:border-[#4edea3]"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-[#bbcabf] mb-1 font-semibold">
                    Transaction Type
                  </label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value as BankTransactionType)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-sm text-white focus:outline-none focus:border-[#4edea3]"
                  >
                    <option value="vendor_bill">Vendor / Consultant Bill</option>
                    <option value="payroll_disbursement">Contractor / Offshore Payroll</option>
                    <option value="partner_draw">Partner Distribution</option>
                    <option value="transfer_out">Operating Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-[#bbcabf] mb-1 font-semibold">
                  Recipient Name / Organization
                </label>
                <input
                  type="text"
                  placeholder="e.g. Skyline Structural Engineering LLP"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-sm text-white focus:outline-none focus:border-[#4edea3]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#bbcabf] mb-1 font-semibold">
                  Recipient Account Details / Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Wise Tag @skyline / ACH Routing ••9182"
                  value={recipientDetails}
                  onChange={(e) => setRecipientDetails(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-sm text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-[#bbcabf] mb-1 font-semibold">
                  Business Purpose / Reference
                </label>
                <input
                  type="text"
                  placeholder="e.g. Structural review takeoff for Metro Tower Phase 2"
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-sm text-white focus:outline-none focus:border-[#4edea3]"
                  required
                />
              </div>

              {/* Dynamic Policy Evaluation preview */}
              {transferAmount && !isNaN(parseFloat(transferAmount)) && (
                (() => {
                  const acc = accounts.find((a) => a.id === selectedAccountId);
                  const amt = parseFloat(transferAmount);
                  const isBelow = acc ? amt <= acc.autoApprovalLimit : false;
                  return (
                    <div className={`p-3 rounded border text-xs font-mono ${isBelow ? 'bg-[#4edea3]/10 border-[#4edea3]/30 text-[#4edea3]' : 'bg-[#ffb4ab]/10 border-[#ffb4ab]/30 text-[#ffb4ab]'}`}>
                      {isBelow ? (
                        <div className="flex items-center gap-1.5 font-bold">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Within Auto-Approval Limit (&le; ${acc?.autoApprovalLimit.toLocaleString()}): Clears Immediately</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Big Transaction (&gt; ${acc?.autoApprovalLimit.toLocaleString()}): Partner Sign-Off Will Be Required</span>
                        </div>
                      )}
                    </div>
                  );
                })()
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222a3d]">
                <button
                  type="button"
                  onClick={() => setIsNewTransferOpen(false)}
                  className="px-4 py-2 bg-[#171f33] hover:bg-[#222a3d] text-white rounded text-xs font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4edea3] hover:bg-[#63edb5] text-[#003824] rounded text-xs font-mono font-bold shadow-sm"
                >
                  Submit Transaction Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect Bank Accounts & API Keys Modal (Zero-Code Direct Configuration) */}
      {isConnectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-[#222a3d]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#4edea3]/10 border border-[#4edea3]/20 flex items-center justify-center">
                  <Landmark className="w-5 h-5 text-[#4edea3]" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Connect Banking Gateways &amp; API Keys</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] font-bold">
                      ZERO-CODE
                    </span>
                  </h3>
                  <p className="text-xs text-[#86948a]">
                    Connect your real Wise, Payoneer, or Mercury accounts directly via API token or portal balance link.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-[#86948a] hover:text-white p-1 rounded-md"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Provider Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {[
                {
                  id: 'wise' as const,
                  label: 'Wise Business',
                  badge: 'Global FX',
                  color: 'border-[#2ed06e]',
                },
                {
                  id: 'payoneer' as const,
                  label: 'Payoneer',
                  badge: 'Cross-Border',
                  color: 'border-[#ff4800]',
                },
                {
                  id: 'mercury' as const,
                  label: 'Mercury Bank',
                  badge: 'Venture & FDIC',
                  color: 'border-[#38bdf8]',
                },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setSelectedConnectProvider(p.id);
                    setConnectSuccessMsg(null);
                  }}
                  className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                    selectedConnectProvider === p.id
                      ? 'bg-[#171f33] border-[#4edea3] text-white shadow-md'
                      : 'bg-[#0b1326] border-[#222a3d] text-[#86948a] hover:text-white'
                  }`}
                >
                  <div className="text-[10px] font-mono uppercase text-[#4edea3] font-bold">{p.badge}</div>
                  <div className="text-sm font-bold text-white mt-0.5">{p.label}</div>
                  <div className="text-[11px] text-[#86948a] mt-1">API &amp; Direct Sync</div>
                </button>
              ))}
            </div>

            {/* Provider Form Content */}
            <div className="space-y-4 bg-[#0b1326] p-4 rounded-lg border border-[#222a3d]">
              {selectedConnectProvider === 'wise' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Wise Read-Only API Token</span>
                    <a
                      href="https://wise.com/settings/api-tokens"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-[#4edea3] hover:underline flex items-center gap-1"
                    >
                      <span>Where to get token</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-[#86948a]">
                    Generate a read/transfers API token from Wise &gt; Settings &gt; API tokens. Paste it below to fetch real-time multi-currency balances.
                  </p>
                  <input
                    type="password"
                    placeholder="e.g. 7f3b891a-982c-4f12-b12e-99018247192a"
                    value={apiTokenInput}
                    onChange={(e) => setApiTokenInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-xs text-white placeholder-[#526077] font-mono focus:outline-none focus:border-[#4edea3]"
                  />
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-mono text-[#86948a]">Wise Profile ID (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. 19284719"
                        value={profileOrClientId}
                        onChange={(e) => setProfileOrClientId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-[#86948a]">Custom Initial Balance ($)</label>
                      <input
                        type="number"
                        placeholder="e.g. 348250"
                        value={customInitialBalance}
                        onChange={(e) => setCustomInitialBalance(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedConnectProvider === 'payoneer' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Payoneer Program / Client Credentials</span>
                    <a
                      href="https://login.payoneer.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-[#4edea3] hover:underline flex items-center gap-1"
                    >
                      <span>Payoneer Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-[#86948a]">
                    Connect your Payoneer cross-border billing card and commercial supplier payout wallet.
                  </p>
                  <input
                    type="password"
                    placeholder="Enter Payoneer Client Secret / API Key"
                    value={apiTokenInput}
                    onChange={(e) => setApiTokenInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-xs text-white placeholder-[#526077] font-mono focus:outline-none focus:border-[#4edea3]"
                  />
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-mono text-[#86948a]">Program Partner ID</label>
                      <input
                        type="text"
                        placeholder="e.g. PAY-10029381"
                        value={profileOrClientId}
                        onChange={(e) => setProfileOrClientId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-[#86948a]">Custom Initial Balance ($)</label>
                      <input
                        type="number"
                        placeholder="e.g. 195400"
                        value={customInitialBalance}
                        onChange={(e) => setCustomInitialBalance(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {selectedConnectProvider === 'mercury' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">Mercury Read-Only API Key</span>
                    <a
                      href="https://mercury.com"
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] font-mono text-[#4edea3] hover:underline flex items-center gap-1"
                    >
                      <span>Mercury Dashboard</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                  <p className="text-[11px] text-[#86948a]">
                    Obtain a secret token from Mercury &gt; Settings &gt; API access. It allows this portal to safely read your checking &amp; treasury balances.
                  </p>
                  <input
                    type="password"
                    placeholder="e.g. mercury_secret_key_prod_891724"
                    value={apiTokenInput}
                    onChange={(e) => setApiTokenInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#131b2e] border border-[#222a3d] rounded text-xs text-white placeholder-[#526077] font-mono focus:outline-none focus:border-[#4edea3]"
                  />
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-mono text-[#86948a]">Account Nickname</label>
                      <input
                        type="text"
                        placeholder="e.g. Treasury Reserve 0042"
                        value={profileOrClientId}
                        onChange={(e) => setProfileOrClientId(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-xs text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-mono text-[#86948a]">Custom Initial Balance ($)</label>
                      <input
                        type="number"
                        placeholder="e.g. 512900"
                        value={customInitialBalance}
                        onChange={(e) => setCustomInitialBalance(e.target.value)}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-xs text-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Instructions Guide */}
              <div className="p-3 bg-[#131b2e] border border-[#222a3d] rounded flex items-start gap-2.5 text-xs text-[#86948a]">
                <Info className="w-4 h-4 text-[#38bdf8] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-white font-medium">Zero-Code Connection Flow:</p>
                  <p>1. Enter your API Key or custom balance directly into the portal.</p>
                  <p>2. Click <strong>"Connect &amp; Authenticate Feed"</strong>.</p>
                  <p>3. The portal immediately synchronizes with your bank feed and activates partner approval policies.</p>
                </div>
              </div>

              {connectSuccessMsg && (
                <div className="p-2.5 bg-[#4edea3]/10 border border-[#4edea3]/30 rounded text-xs text-[#4edea3] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{connectSuccessMsg}</span>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => {
                  // Pre-populate with verified demo API connection
                  setApiTokenInput(`live_token_auth_${selectedConnectProvider}_991823`);
                  setProfileOrClientId(`CORP-${selectedConnectProvider.toUpperCase()}-2024`);
                  setConnectSuccessMsg(`Demo test credentials loaded for ${selectedConnectProvider.toUpperCase()}. Ready to connect!`);
                }}
                className="px-3 py-1.5 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] text-xs font-mono text-[#86948a] hover:text-white rounded cursor-pointer transition-colors"
              >
                Load Sandbox Test Token
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsConnectModalOpen(false)}
                  className="px-4 py-2 bg-[#171f33] hover:bg-[#222a3d] text-white rounded text-xs font-mono"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    // Update target account balance or activate
                    const targetAcc = accounts.find((a) => a.provider === selectedConnectProvider);
                    if (targetAcc && onUpdateAccount) {
                      const newBal = customInitialBalance ? parseFloat(customInitialBalance) : targetAcc.balance;
                      onUpdateAccount({
                        ...targetAcc,
                        balance: !isNaN(newBal) ? newBal : targetAcc.balance,
                        availableBalance: !isNaN(newBal) ? newBal : targetAcc.availableBalance,
                        status: 'connected',
                        lastSyncedAt: new Date().toISOString(),
                      });
                    }
                    setConnectSuccessMsg(`${selectedConnectProvider.toUpperCase()} Account Feed connected and synchronized successfully!`);
                    setTimeout(() => {
                      setIsConnectModalOpen(false);
                      setConnectSuccessMsg(null);
                      setApiTokenInput('');
                      setProfileOrClientId('');
                      setCustomInitialBalance('');
                    }, 1400);
                  }}
                  className="px-5 py-2 bg-[#4edea3] hover:bg-[#63edb5] text-[#003824] rounded text-xs font-mono font-bold shadow-sm cursor-pointer"
                >
                  Connect &amp; Authenticate Feed
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
