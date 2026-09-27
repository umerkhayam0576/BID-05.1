import React, { useState } from 'react';
import { CompanyDataImportPanel } from './CompanyDataImportPanel';
import { AddCompanyExpenseModal, type CompanyExpense } from './AddCompanyExpenseModal';
import type { PayrollRunItem, ConnectedBankAccount } from '../../types';
import type { OutsourcedProjectAssignment } from '../OutsourcedProjectModal';
import { SecretKeysIntegrationsPanel } from '../integrations/SecretKeysIntegrationsPanel';
import {
  Landmark,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  Receipt,
  Clock,
  Download,
  Plus,
  Search,
  Filter,
  Wallet,
  FileSpreadsheet,
  KeyRound,
  ExternalLink,
} from 'lucide-react';

interface CompanyFinanceGlViewProps {
  onSwitchToPersonalFinance: () => void;
  payrollRuns: PayrollRunItem[];
  outsourcedAssignments: OutsourcedProjectAssignment[];
  connectedAccounts?: ConnectedBankAccount[];
  onNavigateTab?: (tab: any) => void;
}

interface GlTransaction {
  id: string;
  date: string;
  description: string;
  category: string;
  account: string;
  type: 'credit' | 'debit';
  amount: number;
  currency: string;
  status: 'Reconciled' | 'Pending';
}

const INITIAL_TRANSACTIONS: GlTransaction[] = [
  {
    id: 'GL-9842',
    date: '2024-08-18',
    description: 'Turner Construction - Metro Heights Progress Billing #3',
    category: 'Revenue - Estimating Takeoff',
    account: 'Operating Checking ••8491',
    type: 'credit',
    amount: 142000,
    currency: 'USD',
    status: 'Reconciled',
  },
  {
    id: 'GL-9841',
    date: '2024-08-16',
    description: 'Clark Construction - St. Jude Expansion Initial Deposit',
    category: 'Revenue - 3D BIM Services',
    account: 'Operating Checking ••8491',
    type: 'credit',
    amount: 88500,
    currency: 'USD',
    status: 'Reconciled',
  },
  {
    id: 'GL-9840',
    date: '2024-08-15',
    description: 'Payroll Run #16 - Bi-weekly Direct Deposits',
    category: 'Operating Expense - Payroll W-2',
    account: 'Payroll Reserve ••2041',
    type: 'debit',
    amount: 64250,
    currency: 'USD',
    status: 'Reconciled',
  },
  {
    id: 'GL-9839',
    date: '2024-08-12',
    description: 'Autodesk Enterprise Flex Tokens - Revit & Navisworks',
    category: 'Software & Technology',
    account: 'Corporate Amex ••4102',
    type: 'debit',
    amount: 14500,
    currency: 'USD',
    status: 'Reconciled',
  },
  {
    id: 'GL-9838',
    date: '2024-08-10',
    description: 'Skanska USA - Biotech Lab Milestone Sign-off',
    category: 'Revenue - Peer Review Audit',
    account: 'Operating Checking ••8491',
    type: 'credit',
    amount: 62000,
    currency: 'USD',
    status: 'Reconciled',
  },
  {
    id: 'GL-9837',
    date: '2024-08-08',
    description: 'Independent Structural Consultant - David Chen P.E.',
    category: 'Contractor 1099 Expense',
    account: 'Operating Checking ••8491',
    type: 'debit',
    amount: 11200,
    currency: 'USD',
    status: 'Pending',
  },
];

export const CompanyFinanceGlView: React.FC<CompanyFinanceGlViewProps> = ({
  onSwitchToPersonalFinance,
  payrollRuns,
  outsourcedAssignments,
  connectedAccounts = [],
  onNavigateTab,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false);
  const [isKeysPanelOpen, setIsKeysPanelOpen] = useState(false);
  const [expenses, setExpenses] = useState<CompanyExpense[]>([]);

  const payrollExpenses = payrollRuns.map((run): GlTransaction => ({
    id: `PAYROLL-EXP-${run.id}`,
    date: run.payDate,
    description: `Payroll batch ${run.period} (${run.employeeCount} employees)`,
    category: 'Payroll Expense',
    account: 'Payroll Reserve ••2041',
    type: 'debit',
    amount: run.totalGross + run.totalTaxesWithheld,
    currency: 'USD',
    status: run.status === 'Paid' ? 'Reconciled' : 'Pending',
  }));

  const outsourcedExpenses = outsourcedAssignments.map((assignment): GlTransaction => ({
    id: `OUTSOURCE-EXP-${assignment.id}`,
    date: assignment.startDate,
    description: `${assignment.provider} - ${assignment.project}`,
    category: 'Outsourced Project Services',
    account: 'Operating Checking ••8491',
    type: 'debit',
    amount: assignment.budget,
    currency: assignment.currency || 'USD',
    status: assignment.status === 'Approved' ? 'Pending' : 'Pending',
  }));

  const ledgerTransactions = [...payrollExpenses, ...outsourcedExpenses, ...expenses.map((expense): GlTransaction => ({ id: expense.id, date: expense.date, description: `${expense.vendor} - ${expense.description}`, category: expense.category, account: expense.account, type: 'debit', amount: expense.amount, currency: expense.currency || 'PKR', status: expense.paymentStatus === 'Paid' ? 'Reconciled' : 'Pending' })), ...INITIAL_TRANSACTIONS];

  const filteredTransactions = ledgerTransactions.filter((t) => {
    const matchesSearch =
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType =
      selectedFilter === 'all' ? true : t.type === selectedFilter;
    return matchesSearch && matchesType;
  });

  return (
    <>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>FINANCE & TREASURY</span>
            <span>/</span>
            <span>GENERAL LEDGER</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Company Financial Ledger & Treasury
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Double-entry book balance, accounts receivable aging, and pre-con cash flow reconciliation
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
            onClick={() => setIsImportOpen(true)}
            className="h-9 px-3.5 bg-[#4edea3] hover:bg-[#63edb5] text-[#06251a] rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Import Company Data</span>
          </button>
          <button
            onClick={() => setIsExpenseOpen(true)}
            className="h-9 px-3.5 bg-[#ffb4ab] hover:bg-[#ffc8c0] text-[#321313] rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </button>
          <button
            onClick={onSwitchToPersonalFinance}
            className="h-9 px-3.5 bg-[#131b2e] hover:bg-[#171f33] border border-[#4edea3]/40 text-[#4edea3] rounded-md text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>Open Consolidated Wealth Hub</span>
          </button>
          <button
            onClick={() => {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(INITIAL_TRANSACTIONS, null, 2));
              const downloadAnchor = document.createElement('a');
              downloadAnchor.setAttribute("href", dataStr);
              downloadAnchor.setAttribute("download", "bid_exact_general_ledger.json");
              document.body.appendChild(downloadAnchor);
              downloadAnchor.click();
              downloadAnchor.remove();
            }}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#86948a]" />
            <span>Export GL (CSV/JSON)</span>
          </button>
        </div>
      </div>

      {/* Secret Keys Direct Portal Panel */}
      {isKeysPanelOpen && (
        <div className="mb-4">
          <SecretKeysIntegrationsPanel />
        </div>
      )}

      {/* Connected Fintech Accounts (Wise, Payoneer, Mercury) Live Balances Bar */}
      {connectedAccounts.length > 0 && (
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-3.5 mb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#4edea3]" />
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                Institutional Bank Feeds (Wise, Payoneer &amp; Mercury)
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#4edea3]/15 text-[#4edea3] rounded font-bold">
                LIVE
              </span>
            </div>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('connected-banks')}
                className="text-xs font-mono text-[#4edea3] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Partner Approvals &amp; Transfer Limits</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {connectedAccounts.map((acc) => (
              <div
                key={acc.id}
                className="bg-[#0b1326] border border-[#222a3d] rounded p-2.5 flex items-center justify-between"
              >
                <div>
                  <div className="text-[10px] font-mono text-[#86948a] uppercase">{acc.provider} Account</div>
                  <div className="text-xs font-semibold text-white truncate max-w-[170px]">{acc.accountName}</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-[#4edea3]">
                    ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                  <div className="text-[10px] font-mono text-[#86948a]">
                    Limit: ≤ ${acc.autoApprovalLimit.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4 Financial KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Operating Treasury Balance
          </div>
          <div className="text-2xl font-bold font-mono text-white">$1,842,500</div>
          <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#4edea3]">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>+$124.8K this month</span>
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Accounts Receivable (AR)
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">$412,000</div>
          <div className="text-[11px] text-[#86948a] mt-2">
            100% current &lt;30 days (0 overdue)
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Q3 Net Operating Income
          </div>
          <div className="text-2xl font-bold font-mono text-white">$486,200</div>
          <div className="text-[11px] text-[#4edea3] mt-2">
            EBITDA Margin: 44.8%
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Next Payroll Liability
          </div>
          <div className="text-2xl font-bold font-mono text-[#ffb4ab]">$64,250</div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Funded in reserve • Due Aug 31
          </div>
        </div>
      </div>

      {/* General Ledger Table Container */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        {/* Filter Controls */}
        <div className="p-4 border-b border-[#222a3d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-[#86948a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, client, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto font-mono text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              All Entries ({ledgerTransactions.length})
            </button>
            <button
              onClick={() => setSelectedFilter('credit')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedFilter === 'credit'
                  ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              Inflows / Revenue
            </button>
            <button
              onClick={() => setSelectedFilter('debit')}
              className={`px-3 py-1 rounded transition-colors ${
                selectedFilter === 'debit'
                  ? 'bg-[#ff7886]/20 text-[#ffb4ab] font-bold border border-[#ff7886]/40'
                  : 'text-[#86948a] hover:text-white'
              }`}
            >
              Outflows / Expenses
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] uppercase text-[10px] tracking-wider border-b border-[#222a3d]">
              <tr>
                <th className="p-3">Ref ID</th>
                <th className="p-3">Date</th>
                <th className="p-3">Description</th>
                <th className="p-3">Category</th>
                <th className="p-3">Account</th>
                <th className="p-3 text-right">Amount / Currency</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d] text-[#dae2fd]">
              {filteredTransactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-[#171f33]/70 transition-colors">
                  <td className="p-3 font-semibold text-[#4edea3]">{tx.id}</td>
                  <td className="p-3 text-[#86948a]">{tx.date}</td>
                  <td className="p-3 font-sans font-medium text-white max-w-xs truncate">
                    {tx.description}
                  </td>
                  <td className="p-3 text-[#bbcabf]">{tx.category}</td>
                  <td className="p-3 text-[#86948a]">{tx.account}</td>
                  <td
                    className={`p-3 text-right font-bold ${
                      tx.type === 'credit' ? 'text-[#4edea3]' : 'text-[#ffb4ab]'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}{new Intl.NumberFormat(undefined, { style: 'currency', currency: tx.currency }).format(tx.amount)}
                  </td>
                  <td className="p-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        tx.status === 'Reconciled'
                          ? 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20'
                          : 'bg-[#e0b44a]/10 text-[#e0b44a] border border-[#e0b44a]/20'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
    <AddCompanyExpenseModal isOpen={isExpenseOpen} onClose={() => setIsExpenseOpen(false)} onAdd={(expense) => setExpenses((current) => [expense, ...current])} />
    {isImportOpen && <CompanyDataImportPanel onClose={() => setIsImportOpen(false)} />}
    </>
  );
};
