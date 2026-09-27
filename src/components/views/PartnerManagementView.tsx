import React, { useState } from 'react';
import {
  Users,
  PieChart,
  DollarSign,
  TrendingUp,
  CreditCard,
  Plus,
  CheckCircle2,
  Download,
  Calendar,
  ShieldCheck,
  Building2,
  Award,
  ArrowUpRight,
  X,
  FileCheck2,
  Share2,
  Landmark,
  ExternalLink,
} from 'lucide-react';
import { PartnerItem, PartnerPayoutRecord, CashTransaction, ConnectedBankAccount, BankTransferRequest } from '../../types';

interface PartnerManagementViewProps {
  partners: PartnerItem[];
  payouts: PartnerPayoutRecord[];
  onExecutePayout: (payout: PartnerPayoutRecord, updatedPartner: PartnerItem, outflowTxn: CashTransaction) => void;
  onUpdatePartner: (partner: PartnerItem) => void;
  connectedAccounts?: ConnectedBankAccount[];
  transferRequests?: BankTransferRequest[];
  onNavigateTab?: (tab: any) => void;
}

export const PartnerManagementView: React.FC<PartnerManagementViewProps> = ({
  partners,
  payouts,
  onExecutePayout,
  onUpdatePartner,
  connectedAccounts = [],
  transferRequests = [],
  onNavigateTab,
}) => {
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>(partners[0]?.id || '');
  const [payoutAmount, setPayoutAmount] = useState<string>('25000');
  const [payoutType, setPayoutType] = useState<PartnerPayoutRecord['payoutType']>('Quarterly Profit Share');
  const [payoutMethod, setPayoutMethod] = useState<string>('FedWire Direct');
  const [payoutNote, setPayoutNote] = useState<string>('Q3 2024 Partner Distribution');

  // Profit Distribution Calculator State
  const [distributablePool, setDistributablePool] = useState<number>(100000);

  // Metrics
  const totalCapitalContributed = partners.reduce((sum, p) => sum + p.capitalContributed, 0);
  const totalCapitalBalance = partners.reduce((sum, p) => sum + p.currentCapitalBalance, 0);
  const totalPayoutsYtd = partners.reduce((sum, p) => sum + p.totalPayoutsYtd, 0);
  const totalPendingDistributions = partners.reduce((sum, p) => sum + p.pendingDistribution, 0);

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(payoutAmount);
    if (isNaN(amountNum) || amountNum <= 0) return;

    const partner = partners.find((p) => p.id === selectedPartnerId);
    if (!partner) return;

    // Extract highest existing distribution number to prevent collision
    let maxDistNum = 5;
    for (const p of payouts) {
      const match = p.id.match(/DIST-2024-(\d+)/i);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > maxDistNum) {
          maxDistNum = parsed;
        }
      }
    }
    const nextDistNum = maxDistNum + 1;
    const generatedId = `DIST-2024-${String(nextDistNum).padStart(2, '0')}`;

    const payoutRecord: PartnerPayoutRecord = {
      id: generatedId,
      partnerId: partner.id,
      partnerName: partner.name,
      date: new Date().toISOString().slice(0, 10),
      amount: amountNum,
      payoutType,
      paymentMethod: payoutMethod,
      status: 'Completed',
      referenceCode: `FED-WIRE-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: payoutNote,
    };

    const updatedPartner: PartnerItem = {
      ...partner,
      totalPayoutsYtd: partner.totalPayoutsYtd + amountNum,
      pendingDistribution: Math.max(0, partner.pendingDistribution - amountNum),
      currentCapitalBalance: Math.max(0, partner.currentCapitalBalance - amountNum * 0.5),
    };

    const outflowTxn: CashTransaction = {
      id: `TXN-2024-${Math.floor(4000 + Math.random() * 6000)}`,
      date: new Date().toISOString().slice(0, 10),
      description: `Partner Payout (${payoutType}) - ${partner.name}`,
      category: 'Partner Payouts & Draws',
      counterparty: partner.name,
      type: 'outflow',
      amount: amountNum,
      status: 'reconciled',
      paymentMethod: payoutMethod,
      account: 'Chase Operating ••8491',
      referenceNumber: payoutRecord.referenceCode,
    };

    onExecutePayout(payoutRecord, updatedPartner, outflowTxn);
    setIsPayoutModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>GOVERNANCE & EQUITY</span>
            <span>/</span>
            <span>PARTNER MANAGEMENT & PROFIT PAYOUTS</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Partner Management & Distribution Payouts
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Partner equity shares, capital accounts, pro-rata quarterly profit distribution, and wire execution
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('connected-banks')}
              className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#4edea3]/30 rounded-md text-xs font-mono text-[#4edea3] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Landmark className="w-3.5 h-3.5 text-[#4edea3]" />
              <span>Wise, Payoneer &amp; Mercury</span>
              {transferRequests.filter((r) => r.status === 'pending_partner_approval').length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-[#ffb4ab]/20 text-[#ffb4ab] rounded font-bold text-[10px]">
                  {transferRequests.filter((r) => r.status === 'pending_partner_approval').length} SIGN-OFFS
                </span>
              )}
            </button>
          )}

          <button
            onClick={() => {
              const partner = partners[0];
              if (partner) {
                setSelectedPartnerId(partner.id);
                setPayoutAmount(partner.pendingDistribution.toString() || '25000');
              }
              setIsPayoutModalOpen(true);
            }}
            className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <DollarSign className="w-4 h-4 stroke-[2.5]" />
            <span>Execute Partner Payout</span>
          </button>
        </div>
      </div>

      {/* 4 Partner Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Total Partner Capital Balance
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${totalCapitalBalance.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            Contributed: ${totalCapitalContributed.toLocaleString()} initial seed
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Total Distributions Paid YTD
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            ${totalPayoutsYtd.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Across {payouts.length} completed distributions
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Pending Retained Payout Pool
          </div>
          <div className="text-2xl font-bold font-mono text-[#ffb4ab]">
            ${totalPendingDistributions.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Available for Q3 distribution release
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Active Equity Partners
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {partners.length} Stakeholders
          </div>
          <div className="text-[11px] text-[#adc6ff] mt-2">
            100% Operating Agreement alignment
          </div>
        </div>
      </div>

      {/* Institutional Bank Balances & Partner Approval Banner */}
      {connectedAccounts.length > 0 && (
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#222a3d]">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#4edea3]" />
              <h3 className="text-sm font-bold text-white">
                Institutional Bank Liquidity &amp; Approval Governance
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] font-semibold border border-[#4edea3]/30">
                WISE • PAYONEER • MERCURY
              </span>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('connected-banks')}
                className="text-xs font-mono text-[#4edea3] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Open Approval Hub &amp; Configure Limits</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            {connectedAccounts.map((acc) => (
              <div key={acc.id} className="p-3 bg-[#0b1326] border border-[#222a3d] rounded-md">
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="uppercase font-bold text-[#bbcabf]">{acc.provider}</span>
                  <span className="text-[#4edea3]">Live Feed</span>
                </div>
                <div className="text-xs text-white truncate font-medium">{acc.accountName}</div>
                <div className="text-base font-bold font-mono text-white mt-1">
                  ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[10px] font-mono text-[#86948a] mt-1 pt-1 border-t border-[#1e293b] flex items-center justify-between">
                  <span>Auto-Clear: ≤ ${acc.autoApprovalLimit.toLocaleString()}</span>
                  <span className="text-[#ffb4ab]">Sign-Off: &gt; ${acc.autoApprovalLimit.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partners Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {partners.map((partner) => (
          <div
            key={partner.id}
            className="p-5 bg-[#131b2e] border border-[#222a3d] rounded-lg space-y-4 hover:border-[#334155] transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#4edea3]/15 border border-[#4edea3]/30 flex items-center justify-center font-mono font-bold text-sm text-[#4edea3]">
                  {partner.initials}
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm flex items-center gap-2">
                    {partner.name}
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
                      {partner.equityPercent}% Equity
                    </span>
                  </h3>
                  <p className="text-xs text-[#86948a]">{partner.role}</p>
                </div>
              </div>

              <button
                onClick={() => {
                  setSelectedPartnerId(partner.id);
                  setPayoutAmount(partner.pendingDistribution.toString() || '15000');
                  setIsPayoutModalOpen(true);
                }}
                className="px-2.5 py-1 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded text-[11px] font-mono text-[#4edea3] transition-colors cursor-pointer"
              >
                Send Payout
              </button>
            </div>

            {/* Financial Ledger Data for this Partner */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 bg-[#0b1326] border border-[#222a3d] rounded text-xs">
              <div>
                <div className="text-[10px] text-[#86948a]">Profit Share</div>
                <div className="font-mono font-bold text-white">{partner.profitSharePercent}%</div>
              </div>
              <div>
                <div className="text-[10px] text-[#86948a]">Capital Acct</div>
                <div className="font-mono font-bold text-white">${partner.currentCapitalBalance.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#86948a]">Total Paid YTD</div>
                <div className="font-mono font-bold text-[#4edea3]">${partner.totalPayoutsYtd.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] text-[#86948a]">Pending Pool</div>
                <div className="font-mono font-bold text-[#ffb4ab]">${partner.pendingDistribution.toLocaleString()}</div>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] font-mono text-[#86948a] pt-1">
              <span>Routing: {partner.bankRoutingMask}</span>
              <span>Tax ID: {partner.taxIdMask}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Interactive Live Profit Distribution Simulator */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[#4edea3]" />
              Automated Profit Distribution Waterfall Calculator
            </h3>
            <p className="text-[11px] text-[#86948a]">
              Calculates pro-rata partner distributions based on available distributable cash surplus
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-[#86948a]">Available Distributable Cash:</span>
            <div className="flex items-center gap-1 bg-[#0b1326] border border-[#222a3d] rounded px-2.5 py-1">
              <span className="text-[#4edea3] font-bold">$</span>
              <input
                type="number"
                step="5000"
                value={distributablePool}
                onChange={(e) => setDistributablePool(Math.max(0, parseFloat(e.target.value) || 0))}
                className="w-24 bg-transparent text-white font-bold focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {partners.map((partner) => {
            const calculatedPayout = (distributablePool * partner.profitSharePercent) / 100;
            return (
              <div key={partner.id} className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded-lg">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-white">{partner.name}</span>
                  <span className="font-mono text-[#4edea3] font-bold">{partner.profitSharePercent}%</span>
                </div>
                <div className="text-xl font-bold font-mono text-[#4edea3] mt-2">
                  ${Math.round(calculatedPayout).toLocaleString()}
                </div>
                <div className="text-[10px] text-[#86948a] mt-1">
                  Tax pass-through K-1 distribution
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Historical Payout Ledger Table */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#4edea3]" />
          Executed Partner Payout History
        </h3>
        <p className="text-[11px] text-[#86948a] mb-4">
          Direct FedWire & ACH partner disbursements with banking reference codes
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] font-mono border-b border-[#222a3d]">
              <tr>
                <th className="py-2.5 px-4">Distribution ID / Date</th>
                <th className="py-2.5 px-4">Partner Name</th>
                <th className="py-2.5 px-4">Distribution Type</th>
                <th className="py-2.5 px-4">Reference Code / Method</th>
                <th className="py-2.5 px-4 text-right">Amount Disbursed</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d]">
              {payouts.map((p, idx) => (
                <tr key={`${p.id}-${idx}`} className="hover:bg-[#171f33]/60 transition-colors">
                  <td className="py-3 px-4 font-mono">
                    <div className="font-semibold text-white">{p.id}</div>
                    <div className="text-[11px] text-[#86948a]">{p.date}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white">{p.partnerName}</div>
                    <div className="text-[11px] text-[#86948a]">{p.notes}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded bg-[#171f33] text-[#dae2fd] border border-[#2d3449] text-[10px] font-mono">
                      {p.payoutType}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-mono text-[11px]">
                    <div className="text-[#dae2fd]">{p.referenceCode}</div>
                    <div className="text-[#86948a]">{p.paymentMethod}</div>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-[#4edea3]">
                    ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Execute Payout Modal */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#4edea3]/10 text-[#4edea3]">
                  <DollarSign className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Execute Partner Distribution</h3>
                  <p className="text-[11px] text-[#86948a]">Authorize direct wire/ACH profit payout</p>
                </div>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-1 rounded hover:bg-[#171f33] text-[#86948a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handlePayoutSubmit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Select Partner*</label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => {
                    setSelectedPartnerId(e.target.value);
                    const p = partners.find((item) => item.id === e.target.value);
                    if (p) setPayoutAmount(p.pendingDistribution.toString() || '25000');
                  }}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                >
                  {partners.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.profitSharePercent}% Share • Pending: ${p.pendingDistribution.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Payout Amount ($ USD)*</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="25000"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white font-mono focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Distribution Classification</label>
                <select
                  value={payoutType}
                  onChange={(e) => setPayoutType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                >
                  <option value="Quarterly Profit Share">Quarterly Profit Share</option>
                  <option value="Tax Distribution">Tax Distribution (Pass-Through Safe Harbor)</option>
                  <option value="Guaranteed Payment">Guaranteed Payment</option>
                  <option value="Partner Draw">Discretionary Partner Draw</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Disbursement Rail</label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                >
                  <option value="FedWire Direct">FedWire Direct (Same-Day Settlement)</option>
                  <option value="ACH Direct Credit">ACH Direct Credit (1 Business Day)</option>
                  <option value="Direct Account Transfer">Internal Commercial Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Memo / Authorization Note</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 2024 operating profit distribution"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              <div className="p-3 bg-[#4edea3]/5 border border-[#4edea3]/20 rounded text-[11px] text-[#dae2fd]">
                This action debits the company operating treasury and immediately updates the partner's capital account and distribution ledger.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="px-3 py-1.5 rounded text-[#86948a] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Authorize Payout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
