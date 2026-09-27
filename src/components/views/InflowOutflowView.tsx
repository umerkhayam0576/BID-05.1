import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  DollarSign,
  Plus,
  Search,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  Building2,
  Calendar,
  X,
  CreditCard,
  ShieldCheck,
  Zap,
  Landmark,
  Sliders,
  ExternalLink,
} from 'lucide-react';
import { CashTransaction, ConnectedBankAccount } from '../../types';

interface InflowOutflowViewProps {
  transactions: CashTransaction[];
  onAddTransaction: (txn: CashTransaction) => void;
  onNavigateTab: (tab: any) => void;
  connectedAccounts?: ConnectedBankAccount[];
}

export const InflowOutflowView: React.FC<InflowOutflowViewProps> = ({
  transactions,
  onAddTransaction,
  onNavigateTab,
  connectedAccounts = [],
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'inflow' | 'outflow'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // New Transaction Form State
  const [formType, setFormType] = useState<'inflow' | 'outflow'>('inflow');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState('Client Milestone Revenue');
  const [formCounterparty, setFormCounterparty] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formAccount, setFormAccount] = useState('Chase Operating ••8491');
  const [formPaymentMethod, setFormPaymentMethod] = useState('ACH Credit');
  const [formReference, setFormReference] = useState('');

  // Calculations
  const totalInflows = transactions
    .filter((t) => t.type === 'inflow')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalOutflows = transactions
    .filter((t) => t.type === 'outflow')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalInflows - totalOutflows;

  const filteredTransactions = transactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.counterparty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = selectedFilter === 'all' ? true : t.type === selectedFilter;
    return matchesSearch && matchesFilter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(formAmount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const newTxn: CashTransaction = {
      id: `TXN-2024-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString().slice(0, 10),
      description: formDescription || (formType === 'inflow' ? 'General Cash Inflow' : 'Operational Expense'),
      category: formCategory,
      counterparty: formCounterparty || 'General Counterparty',
      type: formType,
      amount: parsedAmount,
      status: 'reconciled',
      paymentMethod: formPaymentMethod,
      account: formAccount,
      referenceNumber: formReference || `REF-${Math.floor(100000 + Math.random() * 900000)}`,
    };

    onAddTransaction(newTxn);
    setIsModalOpen(false);
    // Reset form
    setFormDescription('');
    setFormCounterparty('');
    setFormAmount('');
    setFormReference('');
  };

  const exportCsv = () => {
    const headers = 'Transaction ID,Date,Description,Type,Category,Counterparty,Amount,Account,Status\n';
    const rows = transactions
      .map(
        (t) =>
          `"${t.id}","${t.date}","${t.description.replace(/"/g, '""')}","${t.type.toUpperCase()}","${t.category}","${t.counterparty}",${t.amount},"${t.account}","${t.status}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BidExact_CashFlow_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>TREASURY & CASH MANAGEMENT</span>
            <span>/</span>
            <span>INFLOW & OUTFLOW ENGINE</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Cash Inflow & Outflow Treasury
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Real-time liquid cash inflows, operational disbursements, burn velocity, and net cash generation
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={exportCsv}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#86948a]" />
            <span>Export Cash Flow CSV</span>
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Record Inflow / Outflow</span>
          </button>
        </div>
      </div>

      {/* 4 Key Treasury Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* Total Inflows */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-[#86948a] uppercase font-semibold">
              Total Cash Inflows
            </span>
            <div className="p-1 rounded bg-[#4edea3]/10 text-[#4edea3]">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            ${totalInflows.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2 flex items-center gap-1">
            <span className="text-[#4edea3] font-semibold">100% Collected</span> • Client retainers & milestones
          </div>
        </div>

        {/* Total Outflows */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-[#86948a] uppercase font-semibold">
              Total Cash Outflows
            </span>
            <div className="p-1 rounded bg-[#ff7886]/10 text-[#ffb4ab]">
              <ArrowDownRight className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-[#ffb4ab]">
            ${totalOutflows.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2 flex items-center gap-1">
            <span>Salaries, debt servicing & partner draws</span>
          </div>
        </div>

        {/* Net Cash Flow Surplus */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-[#86948a] uppercase font-semibold">
              Net Cash Flow
            </span>
            <div className={`p-1 rounded ${netCashFlow >= 0 ? 'bg-[#4edea3]/10 text-[#4edea3]' : 'bg-[#ff7886]/10 text-[#ffb4ab]'}`}>
              <TrendingUp className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className={`text-2xl font-bold font-mono ${netCashFlow >= 0 ? 'text-white' : 'text-[#ffb4ab]'}`}>
            {netCashFlow >= 0 ? '+' : '-'}${Math.abs(netCashFlow).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2 font-medium">
            {netCashFlow >= 0 ? 'Positive Net Cash Surplus' : 'Operating Deficit'}
          </div>
        </div>

        {/* Cash Health & Coverage Ratio */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-mono text-[#86948a] uppercase font-semibold">
              Inflow-to-Outflow Ratio
            </span>
            <div className="p-1 rounded bg-[#adc6ff]/10 text-[#adc6ff]">
              <Zap className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {totalOutflows > 0 ? (totalInflows / totalOutflows).toFixed(2) : '0.00'}x
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Target benchmark: &gt;1.50x coverage
          </div>
        </div>
      </div>

      {/* Connected Fintech Accounts (Wise, Payoneer, Mercury) Live Balances Banner */}
      {connectedAccounts.length > 0 && (
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 pb-3 border-b border-[#222a3d]">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#4edea3]" />
              <h3 className="text-sm font-bold text-white">
                Connected Institutional Accounts (Wise, Payoneer &amp; Mercury)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] font-semibold border border-[#4edea3]/30">
                LIVE BALANCES
              </span>
            </div>
            <button
              onClick={() => onNavigateTab('connected-banks')}
              className="text-xs font-mono text-[#4edea3] hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
            >
              <span>Manage Approvals &amp; Transfer Limits</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {connectedAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-[#0b1326] border border-[#222a3d] hover:border-[#4edea3]/40 rounded-md p-3 transition-colors"
              >
                <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                  <span className="uppercase font-bold text-[#bbcabf]">{acc.provider}</span>
                  <span className="text-[#4edea3] font-semibold">Active Feed</span>
                </div>
                <div className="text-xs font-medium text-white truncate">{acc.accountName}</div>
                <div className="text-lg font-bold font-mono text-white mt-1">
                  ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono text-[#86948a] mt-1 pt-1 border-t border-[#1b253b]">
                  <span>Avail: ${acc.availableBalance.toLocaleString()}</span>
                  <span>Limit: ≤ ${acc.autoApprovalLimit.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Breakdown Panels (Inflow Sources vs Outflow Categories) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inflows Breakdown */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                Cash Inflow Streams
              </h2>
              <p className="text-[11px] text-[#86948a]">Active revenue lines & incoming liquidity</p>
            </div>
            <span className="font-mono text-xs font-bold text-[#4edea3]">
              ${totalInflows.toLocaleString()}
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Client Milestone Progress Billings', amount: 204000, color: 'bg-[#4edea3]' },
              { label: 'General Contractor Advance Retainers', amount: 163500, color: 'bg-[#4edea3]/80' },
              { label: 'BIM & VDC Consulting Peer Reviews', amount: 62000, color: 'bg-[#4edea3]/60' },
              { label: 'High-Yield Treasury Yield Accrual', amount: 1293, color: 'bg-[#4edea3]/40' },
            ].map((item, idx) => {
              const pct = totalInflows > 0 ? (item.amount / totalInflows) * 100 : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#dae2fd]">{item.label}</span>
                    <span className="font-mono font-semibold text-white">
                      ${item.amount.toLocaleString()} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0b1326] rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Outflows Breakdown */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#ff7886]" />
                Cash Outflow Allocations
              </h2>
              <p className="text-[11px] text-[#86948a]">Operating expenses, debt service, payroll & reserve</p>
            </div>
            <span className="font-mono text-xs font-bold text-[#ffb4ab]">
              ${totalOutflows.toLocaleString()}
            </span>
          </div>

          <div className="space-y-3">
            {[
              { label: 'Employee Salaries & Direct Deposit Payroll', amount: 68420, color: 'bg-[#ff7886]' },
              { label: 'Partner Profit Distributions & Draws', amount: 40000, color: 'bg-[#ff7886]/80' },
              { label: 'Emergency Reserve Fund Auto-Sweep (10%)', amount: 23050, color: 'bg-[#ffb4ab]' },
              { label: 'Software Infrastructure & Autodesk Licenses', amount: 14500, color: 'bg-[#ff7886]/60' },
              { label: 'Loan Principal & Interest Debt Service', amount: 9800, color: 'bg-[#ff7886]/40' },
            ].map((item, idx) => {
              const pct = totalOutflows > 0 ? (item.amount / totalOutflows) * 100 : 0;
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#dae2fd]">{item.label}</span>
                    <span className="font-mono font-semibold text-white">
                      ${item.amount.toLocaleString()} ({pct.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0b1326] rounded-full overflow-hidden">
                    <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Transaction Ledger Table */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        {/* Controls Bar */}
        <div className="p-4 border-b border-[#222a3d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#86948a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search counterparty, description, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer ${
                selectedFilter === 'all'
                  ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              All ({transactions.length})
            </button>
            <button
              onClick={() => setSelectedFilter('inflow')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'inflow'
                  ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              <ArrowUpRight className="w-3 h-3" />
              Inflow
            </button>
            <button
              onClick={() => setSelectedFilter('outflow')}
              className={`px-3 py-1 rounded transition-colors cursor-pointer flex items-center gap-1 ${
                selectedFilter === 'outflow'
                  ? 'bg-[#ff7886]/20 text-[#ffb4ab] font-bold border border-[#ff7886]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              <ArrowDownRight className="w-3 h-3" />
              Outflow
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] font-mono border-b border-[#222a3d]">
              <tr>
                <th className="py-2.5 px-4">TXN ID / Date</th>
                <th className="py-2.5 px-4">Counterparty / Description</th>
                <th className="py-2.5 px-4">Category</th>
                <th className="py-2.5 px-4">Account / Method</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
                <th className="py-2.5 px-4 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d]">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#86948a]">
                    No transactions match your search criteria.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#171f33]/60 transition-colors">
                    <td className="py-3 px-4 font-mono">
                      <div className="text-white font-semibold">{t.id}</div>
                      <div className="text-[11px] text-[#86948a]">{t.date}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{t.counterparty}</div>
                      <div className="text-[11px] text-[#86948a] truncate max-w-xs">{t.description}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-[#171f33] text-[#dae2fd] border border-[#2d3449] text-[10px] font-mono">
                        {t.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px]">
                      <div className="text-[#dae2fd]">{t.account}</div>
                      <div className="text-[#86948a]">{t.paymentMethod}</div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold">
                      <span className={t.type === 'inflow' ? 'text-[#4edea3]' : 'text-[#ffb4ab]'}>
                        {t.type === 'inflow' ? '+' : '-'}${t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        Reconciled
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Inflow / Outflow Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${formType === 'inflow' ? 'bg-[#4edea3]/10 text-[#4edea3]' : 'bg-[#ff7886]/10 text-[#ffb4ab]'}`}>
                  {formType === 'inflow' ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Record Cash Movement</h3>
                  <p className="text-[11px] text-[#86948a]">Create new treasury transaction entry</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded hover:bg-[#171f33] text-[#86948a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
              {/* Type Switcher */}
              <div>
                <label className="block text-[11px] font-mono uppercase text-[#86948a] mb-1">
                  Transaction Nature
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('inflow');
                      setFormCategory('Client Milestone Revenue');
                    }}
                    className={`py-2 rounded font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formType === 'inflow'
                        ? 'bg-[#4edea3] text-[#003824] shadow-sm'
                        : 'bg-[#0b1326] text-[#86948a] border border-[#222a3d]'
                    }`}
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    Cash Inflow (Credit)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormType('outflow');
                      setFormCategory('Operating Overhead Expense');
                    }}
                    className={`py-2 rounded font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      formType === 'outflow'
                        ? 'bg-[#ff7886] text-[#4a000d] shadow-sm'
                        : 'bg-[#0b1326] text-[#86948a] border border-[#222a3d]'
                    }`}
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    Cash Outflow (Debit)
                  </button>
                </div>
              </div>

              {/* Amount & Counterparty */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Amount ($ USD)*</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 50000"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white font-mono focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Counterparty / Entity*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Turner Construction"
                    value={formCounterparty}
                    onChange={(e) => setFormCounterparty(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Accounting Category</label>
                <select
                  value={formCategory}
                  onChange={(e) => setFormCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                >
                  {formType === 'inflow' ? (
                    <>
                      <option value="Client Milestone Revenue">Client Milestone Revenue</option>
                      <option value="Client Retainer Inflow">Client Retainer Inflow</option>
                      <option value="Client Consulting Inflow">Client Consulting Inflow</option>
                      <option value="Interest & Treasury Yield">Interest & Treasury Yield</option>
                      <option value="Partner Capital Contribution">Partner Capital Contribution</option>
                      <option value="Bank Loan Disbursement">Bank Loan Disbursement</option>
                    </>
                  ) : (
                    <>
                      <option value="Payroll & Salaries (W-2)">Payroll & Salaries (W-2)</option>
                      <option value="Contractor 1099 Disbursement">Contractor 1099 Disbursement</option>
                      <option value="Debt Service & Loans">Debt Service & Loans</option>
                      <option value="Equipment Financing">Equipment Financing</option>
                      <option value="Partner Payouts & Draws">Partner Payouts & Draws</option>
                      <option value="Emergency Reserve Allocation">Emergency Reserve Allocation</option>
                      <option value="Software & Technology">Software & Technology</option>
                      <option value="Operating Overhead Expense">Operating Overhead Expense</option>
                    </>
                  )}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-[11px] font-mono text-[#86948a] mb-1">Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Progress invoice payment for Phase 2"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                />
              </div>

              {/* Account & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Company Account</label>
                  <select
                    value={formAccount}
                    onChange={(e) => setFormAccount(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                  >
                    <option value="Chase Operating ••8491">Chase Operating ••8491</option>
                    <option value="Chase Payroll Reserve ••2041">Chase Payroll Reserve ••2041</option>
                    <option value="Ally Emergency Vault ••9021">Ally Emergency Vault ••9021</option>
                    <option value="Corporate Amex ••4102">Corporate Amex ••4102</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-[#86948a] mb-1">Payment Method</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0b1326] border border-[#222a3d] rounded text-white focus:outline-none focus:border-[#4edea3]"
                  >
                    <option value="ACH Credit">ACH Credit</option>
                    <option value="Wire Transfer">Wire Transfer</option>
                    <option value="Direct Debit ACH">Direct Debit ACH</option>
                    <option value="Internal Transfer">Internal Transfer</option>
                    <option value="Corporate Card">Corporate Card</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#222a3d] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded text-[#86948a] hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-semibold shadow-sm transition-all"
                >
                  Post Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
