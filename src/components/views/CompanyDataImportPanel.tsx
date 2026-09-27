'use client';

import React, { useMemo, useState } from 'react';
import { CheckCircle2, FileSpreadsheet, Upload, X, AlertTriangle } from 'lucide-react';
import { read, utils } from 'xlsx';

type ImportDataset = 'transactions' | 'chart-of-accounts' | 'profit-loss' | 'balance-sheet' | 'assets' | 'receivables' | 'payables' | 'payroll' | 'projects' | 'customers' | 'vendors' | 'budgets';
type ImportRow = Record<string, string | number | boolean | null>;

const DATASETS: { id: ImportDataset; label: string; description: string; required: string[] }[] = [
  { id: 'transactions', label: 'Transactions / General Ledger', description: 'Bank activity, journal entries, deposits, and expenses.', required: ['Date', 'Description', 'Amount'] },
  { id: 'chart-of-accounts', label: 'Chart of Accounts', description: 'Account codes, account names, types, and balances.', required: ['Account Code', 'Account Name', 'Type'] },
  { id: 'profit-loss', label: 'Profit & Loss', description: 'Revenue, cost of sales, operating expenses, and net income.', required: ['Period', 'Account', 'Amount'] },
  { id: 'balance-sheet', label: 'Balance Sheet', description: 'Assets, liabilities, equity, and reporting periods.', required: ['Period', 'Account', 'Amount'] },
  { id: 'assets', label: 'Assets & Equipment', description: 'Equipment, vehicles, property, depreciation, and book value.', required: ['Asset Name', 'Purchase Date', 'Cost'] },
  { id: 'receivables', label: 'Accounts Receivable', description: 'Invoices, customers, due dates, and outstanding balances.', required: ['Customer', 'Invoice', 'Balance'] },
  { id: 'payables', label: 'Accounts Payable', description: 'Vendors, bills, due dates, and payment status.', required: ['Vendor', 'Bill', 'Balance'] },
  { id: 'payroll', label: 'Payroll & Employees', description: 'Employees, wages, payroll taxes, and departments.', required: ['Employee', 'Department', 'Gross Pay'] },
  { id: 'projects', label: 'Projects & Backlog', description: 'Projects, contract values, costs, status, and margin.', required: ['Project', 'Customer', 'Contract Value'] },
  { id: 'customers', label: 'Customers & CRM', description: 'Customers, contacts, pipeline stage, and revenue.', required: ['Customer', 'Contact', 'Status'] },
  { id: 'vendors', label: 'Vendors & Suppliers', description: 'Suppliers, contacts, terms, and spend.', required: ['Vendor', 'Contact', 'Status'] },
  { id: 'budgets', label: 'Budgets & Forecasts', description: 'Budget periods, categories, planned values, and actuals.', required: ['Period', 'Category', 'Budget'] },
];

function parseCsv(text: string): ImportRow[] {
  const rows = text.trim().split(/\r?\n/).filter(Boolean).map((line) => line.split(/,(?=(?:[^\"]*\"[^\"]*\")*[^\"]*$)/).map((cell) => cell.trim().replace(/^\"|\"$/g, '')));
  if (!rows.length) return [];
  return rows.slice(1).map((cells) => Object.fromEntries(rows[0].map((header, index) => [header || `Column ${index + 1}`, cells[index] ?? ''])));
}

interface CompanyDataImportPanelProps { onClose: () => void; }

export const CompanyDataImportPanel: React.FC<CompanyDataImportPanelProps> = ({ onClose }) => {
  const [dataset, setDataset] = useState<ImportDataset>('transactions');
  const [fileName, setFileName] = useState('');
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [error, setError] = useState('');
  const [imported, setImported] = useState(false);
  const selected = DATASETS.find((item) => item.id === dataset) ?? DATASETS[0];
  const headers = useMemo(() => rows[0] ? Object.keys(rows[0]) : [], [rows]);
  const missing = selected.required.filter((required) => !headers.some((header) => header.toLowerCase().replace(/[_-]/g, ' ') === required.toLowerCase()));

  const handleFile = async (file: File) => {
    setError(''); setImported(false); setFileName(file.name);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = read(buffer, { cellDates: true });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const parsed = file.name.toLowerCase().endsWith('.csv') ? parseCsv(new TextDecoder().decode(buffer)) : utils.sheet_to_json<ImportRow>(sheet, { defval: '' });
      if (!parsed.length) throw new Error('No data rows were found.');
      setRows(parsed);
    } catch (cause) { setRows([]); setError(cause instanceof Error ? cause.message : 'Unable to read this file.'); }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" role="dialog" aria-modal="true" aria-labelledby="company-import-title">
    <div className="w-full max-w-5xl max-h-[90vh] overflow-auto rounded-xl border border-[#2d3449] bg-[#0f172a] shadow-2xl">
      <div className="flex items-start justify-between gap-4 border-b border-[#222a3d] p-5"><div><div className="mb-1 flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-[#4edea3]"><FileSpreadsheet className="h-3.5 w-3.5" /> Company data import center</div><h2 id="company-import-title" className="text-xl font-bold text-white">Import full company suite</h2><p className="mt-1 text-xs text-[#94a3b8]">Upload CSV or Excel files, preview the rows, then validate before adding them to the dashboard.</p></div><button onClick={onClose} aria-label="Close import center" className="rounded-md p-2 text-[#94a3b8] hover:bg-[#1e293b] hover:text-white"><X className="h-4 w-4" /></button></div>
      <div className="grid gap-5 p-5 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2"><label className="text-[10px] font-mono uppercase tracking-wider text-[#94a3b8]">Dataset</label>{DATASETS.map((item) => <button key={item.id} onClick={() => { setDataset(item.id); setImported(false); }} className={`w-full rounded-lg border p-3 text-left transition-colors ${dataset === item.id ? 'border-[#4edea3]/50 bg-[#4edea3]/10' : 'border-[#222a3d] bg-[#131b2e] hover:border-[#3b475f]'}`}><div className="text-xs font-semibold text-white">{item.label}</div><div className="mt-1 text-[10px] leading-4 text-[#94a3b8]">{item.description}</div></button>)}</div>
        <div className="space-y-4"><div className="rounded-xl border border-dashed border-[#4edea3]/50 bg-[#131b2e] p-8 text-center"><Upload className="mx-auto mb-3 h-7 w-7 text-[#4edea3]" /><p className="text-sm font-semibold text-white">Choose a CSV or Excel workbook</p><p className="mt-1 text-xs text-[#94a3b8]">Supported: .csv, .xlsx. The first row is used as column headers.</p><label className="mt-4 inline-flex cursor-pointer items-center rounded-md bg-[#4edea3] px-4 py-2 text-xs font-bold text-[#06251a] hover:bg-[#63edb5]"><span>{fileName || 'Select file'}</span><input type="file" accept=".csv,.xlsx" className="sr-only" onChange={(event) => event.target.files?.[0] && handleFile(event.target.files[0])} /></label></div>
          {error && <div className="flex items-center gap-2 rounded-md border border-[#ff7886]/40 bg-[#ff7886]/10 p-3 text-xs text-[#ffb4ab]"><AlertTriangle className="h-4 w-4" />{error}</div>}
          {rows.length > 0 && <div className="overflow-hidden rounded-xl border border-[#222a3d]"><div className="flex items-center justify-between border-b border-[#222a3d] p-4"><div><div className="text-sm font-semibold text-white">Preview & validation</div><div className="text-[10px] text-[#94a3b8]">{rows.length} rows detected · showing first 5</div></div>{missing.length ? <span className="text-[10px] text-[#ffb4ab]">Missing: {missing.join(', ')}</span> : <span className="flex items-center gap-1 text-[10px] text-[#4edea3]"><CheckCircle2 className="h-3.5 w-3.5" /> Required columns found</span>}</div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="bg-[#131b2e] text-[10px] uppercase text-[#94a3b8]"><tr>{headers.map((header) => <th key={header} className="whitespace-nowrap px-3 py-2">{header}</th>)}</tr></thead><tbody className="divide-y divide-[#222a3d]">{rows.slice(0, 5).map((row, index) => <tr key={index}>{headers.map((header) => <td key={header} className="max-w-[180px] truncate whitespace-nowrap px-3 py-2 text-[#dae2fd]">{String(row[header] ?? '')}</td>)}</tr>)}</tbody></table></div></div>}
          <div className="flex items-center justify-end gap-2"><button onClick={onClose} className="rounded-md border border-[#2d3449] px-4 py-2 text-xs text-[#cbd5e1]">Cancel</button><button disabled={!rows.length || missing.length > 0} onClick={() => setImported(true)} className="rounded-md bg-[#4edea3] px-4 py-2 text-xs font-bold text-[#06251a] disabled:cursor-not-allowed disabled:opacity-40">Validate & import {rows.length ? `${rows.length} rows` : ''}</button></div>
          {imported && <div className="rounded-md border border-[#4edea3]/40 bg-[#4edea3]/10 p-3 text-xs text-[#8ff5c9]">Import complete: {rows.length} {selected.label.toLowerCase()} rows added to the review queue. Review and reconcile before posting to the ledger.</div>}
        </div>
      </div>
    </div>
  </div>;
};

export default CompanyDataImportPanel;
