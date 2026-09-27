import React, { useState } from 'react';
import {
  Receipt,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  Download,
  Plus,
  ArrowUpRight,
  CreditCard,
  Building2,
  Sparkles,
  Percent,
  X,
  FileText,
  Printer,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { CashTransaction } from '../../types';
import {
  calculateStripeFees,
  FINANCIAL_CONSTANTS,
} from '../../utils/financialRulesEngine';
import { FinancialRulesAuditorModal } from '../rules/FinancialRulesAuditorModal';
import { SecretKeysIntegrationsPanel } from '../integrations/SecretKeysIntegrationsPanel';
import { KeyRound } from 'lucide-react';

export interface InvoiceRecord {
  id: string;
  client: string;
  project: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  terms: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  paymentMethod?: 'credit_card' | 'ach_debit' | 'wire_transfer';
  stripeFee?: number;
  netSettlement?: number;
  paidDate?: string;
  glJournalRef?: string;
}

const INITIAL_INVOICES: InvoiceRecord[] = [
  {
    id: 'INV-2024-104',
    client: 'Turner Construction Company',
    project: 'Metro Heights Tower (Phase 2 QTO)',
    issueDate: '2024-08-01',
    dueDate: '2024-08-31',
    amount: 142000,
    terms: 'Net 30',
    status: 'Paid',
    paymentMethod: 'ach_debit',
    stripeFee: 5.00,
    netSettlement: 141995.00,
    paidDate: '2024-08-28',
    glJournalRef: 'GL-2024-8821',
  },
  {
    id: 'INV-2024-105',
    client: 'Clark Construction Group',
    project: 'St. Jude Expansion BIM Modeling',
    issueDate: '2024-08-05',
    dueDate: '2024-09-04',
    amount: 88500,
    terms: 'Net 30',
    status: 'Pending',
  },
  {
    id: 'INV-2024-106',
    client: 'Skanska USA Building Inc.',
    project: 'Biotech Innovation Lab Peer Audit',
    issueDate: '2024-08-10',
    dueDate: '2024-09-09',
    amount: 62000,
    terms: 'Net 30',
    status: 'Pending',
  },
  {
    id: 'INV-2024-107',
    client: 'Balfour Beatty Construction',
    project: 'Harbor Logistics Warehouse Pre-Con',
    issueDate: '2024-07-20',
    dueDate: '2024-08-19',
    amount: 94000,
    terms: 'Net 30',
    status: 'Paid',
    paymentMethod: 'wire_transfer',
    stripeFee: 0.00,
    netSettlement: 94000.00,
    paidDate: '2024-08-17',
    glJournalRef: 'GL-2024-8714',
  },
  {
    id: 'INV-2024-108',
    client: 'Webcor Builders',
    project: 'Mission Bay Life Science Park',
    issueDate: '2024-08-15',
    dueDate: '2024-09-14',
    amount: 55000,
    terms: 'Net 30',
    status: 'Pending',
  },
];

interface InvoicesArViewProps {
  onRecordPaymentInflow?: (txn: CashTransaction) => void;
}

export const InvoicesArView: React.FC<InvoicesArViewProps> = ({
  onRecordPaymentInflow,
}) => {
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isKeysPanelOpen, setIsKeysPanelOpen] = useState(false);

  // Payment Recording Modal State
  const [collectingInvoice, setCollectingInvoice] = useState<InvoiceRecord | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'credit_card' | 'ach_debit' | 'wire_transfer'>('ach_debit');

  // Receipt / Audit Detail Modal State
  const [viewingReceiptInvoice, setViewingReceiptInvoice] = useState<InvoiceRecord | null>(null);

  // New Invoice Modal
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [newClient, setNewClient] = useState('Turner Construction Company');
  const [newProject, setNewProject] = useState('');
  const [newAmount, setNewAmount] = useState<number>(45000);

  const totalOutstanding = invoices
    .filter((inv) => inv.status === 'Pending')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const paidInvoices = invoices.filter((inv) => inv.status === 'Paid');
  const totalPaidGross = paidInvoices.reduce((sum, inv) => sum + inv.amount, 0);
  const totalStripeFees = paidInvoices.reduce((sum, inv) => sum + (inv.stripeFee || 0), 0);
  const totalNetCollected = paidInvoices.reduce((sum, inv) => sum + (inv.netSettlement || inv.amount), 0);

  const filtered = invoices.filter(
    (inv) =>
      inv.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Live fee calculation for modal
  const modalFeeResult = collectingInvoice
    ? calculateStripeFees({
        invoiceAmount: collectingInvoice.amount,
        paymentMethod: selectedMethod,
      })
    : null;

  const handleConfirmPayment = () => {
    if (!collectingInvoice || !modalFeeResult) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const journalRef = `GL-2024-${Math.floor(8900 + Math.random() * 1000)}`;

    const updatedInvoices = invoices.map((inv) => {
      if (inv.id === collectingInvoice.id) {
        return {
          ...inv,
          status: 'Paid' as const,
          paymentMethod: selectedMethod,
          stripeFee: modalFeeResult.stripeFeeDeduction,
          netSettlement: modalFeeResult.netCashDeposited,
          paidDate: todayStr,
          glJournalRef: journalRef,
        };
      }
      return inv;
    });

    setInvoices(updatedInvoices);

    // If caller provided callback, log cash inflow to company treasury
    if (onRecordPaymentInflow) {
      const inflowTxn: CashTransaction = {
        id: `TXN-IN-${Math.floor(3000 + Math.random() * 7000)}`,
        date: todayStr,
        description: `Invoice Settlement: ${collectingInvoice.id} (${collectingInvoice.client}) via ${
          selectedMethod === 'credit_card' ? 'Stripe Credit Card' : selectedMethod === 'ach_debit' ? 'Stripe ACH' : 'Fedwire Wire'
        } (Net of $${modalFeeResult.stripeFeeDeduction.toFixed(2)} fee)`,
        category: 'Client Retainers & Progress Fees',
        counterparty: collectingInvoice.client,
        type: 'inflow',
        amount: modalFeeResult.netCashDeposited,
        status: 'reconciled',
        paymentMethod: selectedMethod === 'wire_transfer' ? 'Fedwire Transfer' : 'Stripe Payments',
        account: 'Operating Checking ••8921',
        referenceNumber: collectingInvoice.id,
      };
      onRecordPaymentInflow(inflowTxn);
    }

    setCollectingInvoice(null);
  };

  const handleCreateNewInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.trim() || newAmount <= 0) return;

    const newInv: InvoiceRecord = {
      id: `INV-2024-${109 + invoices.length}`,
      client: newClient,
      project: newProject.trim(),
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      amount: newAmount,
      terms: 'Net 30',
      status: 'Pending',
    };

    setInvoices([newInv, ...invoices]);
    setIsNewInvoiceModalOpen(false);
    setNewProject('');
    setNewAmount(45000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>BILLING & RECEIVABLES</span>
            <span>/</span>
            <span>ACCOUNTS RECEIVABLE (AR)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Invoices & Accounts Receivable
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Progress billings, Stripe fee deduction logic, automated GL reconciliation, and net settlement tracking
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsKeysPanelOpen((prev) => !prev)}
            className={`h-9 px-3.5 border rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm ${
              isKeysPanelOpen
                ? 'bg-[#4edea3] text-[#003824] border-[#4edea3]'
                : 'bg-[#131b2e] hover:bg-[#171f33] border-[#4edea3]/40 text-[#4edea3]'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>{isKeysPanelOpen ? 'Hide API Keys' : 'Payment API Keys'}</span>
          </button>
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#4edea3] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Rules & Fee Engine</span>
          </button>
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(invoices, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", "bid_exact_invoices_ar.json");
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#86948a]" />
            <span>Export AR Matrix</span>
          </button>
          <button
            onClick={() => setIsNewInvoiceModalOpen(true)}
            className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Issue New Progress Invoice</span>
          </button>
        </div>
      </div>

      {/* Secret Keys Direct Portal Panel */}
      {isKeysPanelOpen && (
        <div className="mb-4">
          <SecretKeysIntegrationsPanel />
        </div>
      )}

      {/* 4 Certified AR KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Total Outstanding (AR)
          </div>
          <div className="text-2xl font-bold font-mono text-[#adc6ff]">
            ${totalOutstanding.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Pending general contractor collection
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Gross Billed (Collected)
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${totalPaidGross.toLocaleString()}
          </div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            100% on-time settlement rate
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Stripe & Merchant Fees
          </div>
          <div className="text-2xl font-bold font-mono text-[#ffb4ab]">
            ${totalStripeFees.toFixed(2)}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Deducted prior to bank settlement
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Net Cash Deposited
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            ${totalNetCollected.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Reconciled in Operating Checking ••8921
          </div>
        </div>
      </div>

      {/* Invoices Table Container */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#222a3d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#86948a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search invoice #, client, or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
            />
          </div>
          <div className="text-xs font-mono text-[#86948a]">
            Showing {filtered.length} Invoices
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] uppercase text-[10px] tracking-wider border-b border-[#222a3d]">
              <tr>
                <th className="p-3">Invoice #</th>
                <th className="p-3">Client / General Contractor</th>
                <th className="p-3">Project Description</th>
                <th className="p-3">Issue Date</th>
                <th className="p-3">Due Date</th>
                <th className="p-3 text-right">Gross Amount</th>
                <th className="p-3 text-right">Stripe Fee</th>
                <th className="p-3 text-right">Net Settlement</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-center">Payment Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d] text-[#dae2fd]">
              {filtered.map((inv) => (
                <tr key={inv.id} className="hover:bg-[#171f33]/70 transition-colors">
                  <td className="p-3 font-semibold text-[#4edea3]">{inv.id}</td>
                  <td className="p-3 font-sans font-medium text-white">{inv.client}</td>
                  <td className="p-3 font-sans text-xs text-[#bbcabf]">{inv.project}</td>
                  <td className="p-3 text-[#86948a]">{inv.issueDate}</td>
                  <td className="p-3 text-white">{inv.dueDate}</td>
                  <td className="p-3 text-right font-bold text-white">
                    ${inv.amount.toLocaleString()}
                  </td>
                  <td className="p-3 text-right font-mono">
                    {inv.status === 'Paid' ? (
                      <span className="text-[#ffb4ab]">-${(inv.stripeFee || 0).toFixed(2)}</span>
                    ) : (
                      <span className="text-[#86948a]">—</span>
                    )}
                  </td>
                  <td className="p-3 text-right font-mono font-bold">
                    {inv.status === 'Paid' ? (
                      <span className="text-[#4edea3]">
                        ${(inv.netSettlement || inv.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    ) : (
                      <span className="text-[#86948a]">—</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        inv.status === 'Paid'
                          ? 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20'
                          : 'bg-[#3b82f6]/10 text-[#adc6ff] border border-[#3b82f6]/20'
                      }`}
                    >
                      {inv.status}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {inv.status === 'Pending' ? (
                      <button
                        onClick={() => {
                          setCollectingInvoice(inv);
                          setSelectedMethod('ach_debit');
                        }}
                        className="px-2.5 py-1 bg-[#4edea3]/10 hover:bg-[#4edea3]/20 border border-[#4edea3]/30 text-[#4edea3] rounded font-semibold text-[11px] transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        <CreditCard className="w-3 h-3" />
                        <span>Record Payment</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setViewingReceiptInvoice(inv)}
                        className="px-2 py-1 text-[#86948a] hover:text-white rounded hover:bg-[#222a3d] text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        <FileText className="w-3 h-3" />
                        <span>GL Receipt</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Record Payment (Stripe / ACH / Wire) Modal */}
      {collectingInvoice && modalFeeResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-[#4edea3]/10 text-[#4edea3]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Record Invoice Payment</h3>
                  <p className="text-[11px] text-[#86948a]">
                    {collectingInvoice.id} • {collectingInvoice.client}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCollectingInvoice(null)}
                className="p-1 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Payment Rail Selector */}
              <div>
                <label className="text-[11px] text-[#86948a] block mb-1.5 font-mono uppercase">
                  Select Settlement Rail
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMethod('ach_debit')}
                    className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                      selectedMethod === 'ach_debit'
                        ? 'bg-[#4edea3]/10 border-[#4edea3] text-white'
                        : 'bg-[#0b1326] border-[#222a3d] text-[#86948a] hover:border-[#4edea3]/40'
                    }`}
                  >
                    <div className="font-bold text-[11px] text-white">Stripe ACH</div>
                    <div className="text-[10px] text-[#4edea3] mt-0.5">0.8% (Capped $5)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('credit_card')}
                    className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                      selectedMethod === 'credit_card'
                        ? 'bg-[#4edea3]/10 border-[#4edea3] text-white'
                        : 'bg-[#0b1326] border-[#222a3d] text-[#86948a] hover:border-[#4edea3]/40'
                    }`}
                  >
                    <div className="font-bold text-[11px] text-white">Stripe CC / Debit</div>
                    <div className="text-[10px] text-[#ffb4ab] mt-0.5">2.9% + $0.30</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedMethod('wire_transfer')}
                    className={`p-2.5 rounded border text-left transition-all cursor-pointer ${
                      selectedMethod === 'wire_transfer'
                        ? 'bg-[#4edea3]/10 border-[#4edea3] text-white'
                        : 'bg-[#0b1326] border-[#222a3d] text-[#86948a] hover:border-[#4edea3]/40'
                    }`}
                  >
                    <div className="font-bold text-[11px] text-white">Direct Wire</div>
                    <div className="text-[10px] text-[#4edea3] mt-0.5">$0.00 Fee</div>
                  </button>
                </div>
              </div>

              {/* Fee Breakdown Card */}
              <div className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded space-y-2 font-mono">
                <div className="flex justify-between font-sans">
                  <span className="text-[#86948a]">Invoice Gross:</span>
                  <span className="text-white font-bold">${collectingInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86948a]">Stripe Processing Fee:</span>
                  <span className="text-[#ffb4ab] font-bold">-${modalFeeResult.stripeFeeDeduction.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-[#222a3d] pt-1.5 font-sans">
                  <span className="text-[#4edea3] font-bold">Net Deposit Settlement:</span>
                  <span className="text-[#4edea3] font-bold font-mono text-sm">
                    ${modalFeeResult.netCashDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* GAAP Double-Entry Preview */}
              <div className="p-3 bg-[#171f33] border border-[#2d3449] rounded font-mono text-[11px] space-y-1">
                <div className="text-[#86948a] font-sans font-bold text-[10px] uppercase">
                  Automated GAAP Double-Entry Journal Entry
                </div>
                <div className="flex justify-between text-[#dae2fd]">
                  <span>DR: 1010 Operating Cash (Net)</span>
                  <span>+${modalFeeResult.netCashDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                {modalFeeResult.stripeFeeDeduction > 0 && (
                  <div className="flex justify-between text-[#ffb4ab]">
                    <span>DR: 5040 Merchant Processing Expense</span>
                    <span>+${modalFeeResult.stripeFeeDeduction.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-[#86948a] border-t border-[#222a3d] pt-1">
                  <span>CR: 1100 Accounts Receivable</span>
                  <span>-${collectingInvoice.amount.toLocaleString()}</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setCollectingInvoice(null)}
                  className="px-3 py-1.5 rounded text-[#86948a] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPayment}
                  className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-semibold cursor-pointer shadow-sm"
                >
                  Confirm & Deposit Settlement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Official Payment Receipt Modal */}
      {viewingReceiptInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-[#4edea3]/10 text-[#4edea3]">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Accounts Receivable Payment Receipt</h3>
                  <p className="text-[11px] text-[#86948a]">Audit Reference: {viewingReceiptInvoice.glJournalRef || 'GL-2024-8821'}</p>
                </div>
              </div>
              <button
                onClick={() => setViewingReceiptInvoice(null)}
                className="p-1 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-[#0b1326] border border-[#222a3d] rounded">
                <div>
                  <div className="text-[10px] text-[#86948a] uppercase font-mono">Invoice Number</div>
                  <div className="font-bold text-white">{viewingReceiptInvoice.id}</div>
                  <div className="text-[11px] text-[#86948a] mt-1">Client: {viewingReceiptInvoice.client}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#86948a] uppercase font-mono">Payment Rail</div>
                  <div className="font-mono text-[#4edea3]">
                    {viewingReceiptInvoice.paymentMethod === 'credit_card'
                      ? 'Stripe Credit Card'
                      : viewingReceiptInvoice.paymentMethod === 'ach_debit'
                      ? 'Stripe ACH Transfer'
                      : 'Fedwire Bank Wire'}
                  </div>
                  <div className="text-[11px] text-[#86948a] mt-1">Settled on {viewingReceiptInvoice.paidDate || viewingReceiptInvoice.dueDate}</div>
                </div>
              </div>

              <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded space-y-2 font-mono">
                <div className="flex justify-between">
                  <span className="text-[#86948a]">Gross Invoice Total:</span>
                  <span className="text-white font-bold">${viewingReceiptInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86948a]">Processing Fee Deducted:</span>
                  <span className="text-[#ffb4ab]">-${(viewingReceiptInvoice.stripeFee || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-[#222a3d] pt-1.5 font-sans">
                  <span className="text-[#4edea3] font-bold">Net Deposited into Treasury:</span>
                  <span className="text-[#4edea3] font-bold font-mono text-sm">
                    ${(viewingReceiptInvoice.netSettlement || viewingReceiptInvoice.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#4edea3]/5 border border-[#4edea3]/20 rounded text-[11px] text-[#dae2fd]">
                Verified against Chase Operating Checking ••8921. Reconciled under GAAP Revenue Recognition ASC 606.
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-[#222a3d]">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#171f33] hover:bg-[#222a3d] text-white rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Receipt</span>
                </button>
                <button
                  type="button"
                  onClick={() => setViewingReceiptInvoice(null)}
                  className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-semibold cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Invoice Modal */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-[#4edea3]/10 text-[#4edea3]">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Issue New Progress Invoice</h3>
                  <p className="text-[11px] text-[#86948a]">Create AIA G702 progress billing</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewInvoiceModalOpen(false)}
                className="p-1 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewInvoice} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-[11px] text-[#86948a] block mb-1">General Contractor / Client</label>
                <select
                  value={newClient}
                  onChange={(e) => setNewClient(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-white"
                >
                  <option value="Turner Construction Company">Turner Construction Company</option>
                  <option value="Clark Construction Group">Clark Construction Group</option>
                  <option value="Skanska USA Building Inc.">Skanska USA Building Inc.</option>
                  <option value="Balfour Beatty Construction">Balfour Beatty Construction</option>
                  <option value="Webcor Builders">Webcor Builders</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-[#86948a] block mb-1">Project Milestone Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phase 3 Structural Steel Takeoff Deliverable"
                  value={newProject}
                  onChange={(e) => setNewProject(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-white"
                />
              </div>

              <div>
                <label className="text-[11px] text-[#86948a] block mb-1">Invoice Amount ($)</label>
                <input
                  type="number"
                  min="1000"
                  step="500"
                  required
                  value={newAmount}
                  onChange={(e) => setNewAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="px-3 py-1.5 rounded text-[#86948a] hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-semibold cursor-pointer"
                >
                  Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Rules & Fee Engine Modal */}
      <FinancialRulesAuditorModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
      />
    </div>
  );
};

