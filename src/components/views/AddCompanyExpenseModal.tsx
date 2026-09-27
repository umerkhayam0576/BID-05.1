'use client';

import { useState } from 'react';
import { X, Upload, ReceiptText, CheckCircle2 } from 'lucide-react';

type CompanyExpense = {
  id: string;
  date: string;
  vendor: string;
  description: string;
  category: string;
  department: string;
  project: string;
  amount: number;
  currency: string;
  account: string;
  taxTreatment: string;
  approval: string;
  paymentStatus: string;
  receiptName?: string;
};

type Props = { isOpen: boolean; onClose: () => void; onAdd: (expense: CompanyExpense) => void };

export function AddCompanyExpenseModal({ isOpen, onClose, onAdd }: Props) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), vendor: '', description: '', category: 'Software & Technology', department: 'Services', project: '', amount: '', currency: 'PKR', account: 'Operating Checking ••8491', taxTreatment: 'Business expense - deductible', approval: 'Pending Approval', paymentStatus: 'Unpaid' });
  const [receiptName, setReceiptName] = useState('');
  if (!isOpen) return null;
  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!form.vendor || !form.description || !Number.isFinite(amount) || amount <= 0) return;
    onAdd({ ...form, id: `EXP-${Date.now().toString().slice(-6)}`, amount, receiptName });
    onClose();
  };
  const field = (label: string, key: keyof typeof form, options?: string[]) => options ? <label className="space-y-1"><span className="text-[10px] uppercase tracking-wider text-[#86948a]">{label}</span><select value={form[key]} onChange={(e) => update(key, e.target.value)} className="w-full rounded border border-[#2d3449] bg-[#0b1326] px-3 py-2 text-xs text-white">{options.map((option) => <option key={option}>{option}</option>)}</select></label> : <label className="space-y-1"><span className="text-[10px] uppercase tracking-wider text-[#86948a]">{label}</span><input required={key === 'vendor' || key === 'description'} type={key === 'amount' ? 'number' : key === 'date' ? 'date' : 'text'} value={form[key]} onChange={(e) => update(key, e.target.value)} className="w-full rounded border border-[#2d3449] bg-[#0b1326] px-3 py-2 text-xs text-white placeholder-[#667085]" /></label>;
  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"><form onSubmit={submit} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-[#2d3449] bg-[#131b2e] p-6 shadow-2xl"><div className="mb-5 flex items-start justify-between"><div><div className="flex items-center gap-2 text-[#4edea3]"><ReceiptText className="h-4 w-4" /><span className="font-mono text-[10px] uppercase tracking-widest">Accounts Payable</span></div><h2 className="mt-1 text-xl font-bold text-white">Add Company Expense</h2><p className="mt-1 text-xs text-[#86948a]">Capture the expense, route approval, and keep the receipt attached.</p></div><button type="button" onClick={onClose} className="text-[#86948a] hover:text-white"><X className="h-5 w-5" /></button></div><div className="grid gap-4 sm:grid-cols-2">{field('Expense date', 'date')}{field('Vendor / payee', 'vendor')}{field('Description', 'description')}{field('Amount', 'amount')}{field('Currency', 'currency', ['PKR · Pakistani Rupee', 'USD · US Dollar', 'CAD · Canadian Dollar', 'EUR · Euro', 'GBP · British Pound', 'AED · UAE Dirham', 'SAR · Saudi Riyal'])}{field('Category', 'category', ['Payroll', 'Contractor 1099 Expense', 'Materials', 'Software & Technology', 'Rent & Facilities', 'Insurance', 'Travel', 'Professional Services', 'Taxes', 'Equipment'])}{field('Department', 'department', ['Sales', 'Services', 'Finance & Legal', 'Executive Leadership'])}{field('Project / cost code', 'project')}{field('Payment account', 'account', ['Operating Checking ••8491', 'Corporate Amex ••4102', 'Payroll Reserve ••2041'])}{field('Tax treatment', 'taxTreatment', ['Business expense - deductible', 'Non-deductible', 'Sales tax recoverable', 'Needs accountant review'])}{field('Approval status', 'approval', ['Pending Approval', 'Approved', 'Rejected'])}{field('Payment status', 'paymentStatus', ['Unpaid', 'Scheduled', 'Paid', 'Reimbursed'])}</div><label className="mt-4 flex cursor-pointer items-center gap-3 rounded border border-dashed border-[#2d3449] bg-[#0b1326] p-3"><Upload className="h-4 w-4 text-[#4edea3]" /><span className="flex-1 text-xs text-[#bbcabf]">{receiptName || 'Attach receipt or invoice (optional)'}</span><input type="file" accept="image/*,.pdf,.csv,.xlsx" className="sr-only" onChange={(e) => setReceiptName(e.target.files?.[0]?.name ?? '')} /></label><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded border border-[#2d3449] px-4 py-2 text-xs text-[#bbcabf]">Cancel</button><button type="submit" className="flex items-center gap-2 rounded bg-[#4edea3] px-4 py-2 text-xs font-bold text-[#06251a]"><CheckCircle2 className="h-4 w-4" />Save Expense</button></div></form></div>;
}

export type { CompanyExpense };
