import React, { useState } from 'react';
import { BriefcaseBusiness, CalendarDays, DollarSign, X } from 'lucide-react';

export interface OutsourcedProjectAssignment {
  id: string;
  project: string;
  provider: string;
  scope: string;
  startDate: string;
  dueDate: string;
  budget: number;
  currency?: string;
  paymentModel: string;
  status: string;
}

interface OutsourcedProjectModalProps {
  isOpen: boolean;
  projects: string[];
  onClose: () => void;
  onCreate: (assignment: OutsourcedProjectAssignment) => void;
}

const inputClass = 'w-full rounded-md border border-[#303a52] bg-[#10182a] px-3 py-2 text-sm text-[#eef2ff] outline-none focus:border-[#4edea3]';

export const OutsourcedProjectModal: React.FC<OutsourcedProjectModalProps> = ({ isOpen, projects, onClose, onCreate }) => {
  const [form, setForm] = useState({ project: projects[0] ?? '', provider: '', scope: '', startDate: new Date().toISOString().slice(0, 10), dueDate: '', budget: '', currency: 'PKR', paymentModel: 'Fixed fee', status: 'Outsourced · active' });
  if (!isOpen) return null;

  const update = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.project || !form.provider || !form.scope || !form.dueDate || Number(form.budget) <= 0) return;
    onCreate({ ...form, id: `OUT-${Date.now()}`, budget: Number(form.budget) });
    setForm((current) => ({ ...current, provider: '', scope: '', dueDate: '', budget: '' }));
    onClose();
  };

  return <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true" aria-labelledby="outsourced-project-title">
    <form onSubmit={submit} className="w-full max-w-2xl overflow-hidden rounded-xl border border-[#303a52] bg-[#151e32] shadow-2xl">
      <div className="flex items-start justify-between border-b border-[#29334a] px-6 py-5">
        <div><div className="mb-1 flex items-center gap-2 text-[#4edea3]"><BriefcaseBusiness className="h-4 w-4" /><span className="font-mono text-[10px] uppercase tracking-[0.2em]">External delivery capacity</span></div><h2 id="outsourced-project-title" className="text-xl font-semibold text-[#f3f5ff]">Assign outsourced project team</h2><p className="mt-1 text-sm text-[#9da9c5]">Use an external firm or freelancer when internal capacity is unavailable.</p></div>
        <button type="button" onClick={onClose} aria-label="Close" className="rounded-md p-2 text-[#9da9c5] hover:bg-[#222d46] hover:text-white"><X className="h-5 w-5" /></button>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-2">
        <label className="text-xs text-[#b5c0d8]">Project<select className={inputClass} value={form.project} onChange={(e) => update('project', e.target.value)}>{projects.map((project) => <option key={project}>{project}</option>)}</select></label>
        <label className="text-xs text-[#b5c0d8]">External provider<input className={inputClass} value={form.provider} onChange={(e) => update('provider', e.target.value)} placeholder="Vendor, agency, or freelancer" /></label>
        <label className="sm:col-span-2 text-xs text-[#b5c0d8]">Scope of work<textarea className={`${inputClass} min-h-20 resize-y`} value={form.scope} onChange={(e) => update('scope', e.target.value)} placeholder="Describe the deliverables and responsibilities" /></label>
        <label className="text-xs text-[#b5c0d8]">Start date<div className="relative"><CalendarDays className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#7785a5]" /><input type="date" className={`${inputClass} pl-9`} value={form.startDate} onChange={(e) => update('startDate', e.target.value)} /></div></label>
        <label className="text-xs text-[#b5c0d8]">Due date<input type="date" className={inputClass} value={form.dueDate} onChange={(e) => update('dueDate', e.target.value)} /></label>
        <label className="text-xs text-[#b5c0d8]">Approved budget<div className="relative"><DollarSign className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-[#7785a5]" /><input type="number" min="1" step="0.01" className={`${inputClass} pl-9`} value={form.budget} onChange={(e) => update('budget', e.target.value)} placeholder="0.00" /></div></label>
        <label className="text-xs text-[#b5c0d8]">Currency<select className={inputClass} value={form.currency} onChange={(e) => update('currency', e.target.value)}><option>PKR</option><option>USD</option><option>CAD</option><option>EUR</option><option>GBP</option><option>AED</option><option>SAR</option></select></label>
        <label className="text-xs text-[#b5c0d8]">Payment model<select className={inputClass} value={form.paymentModel} onChange={(e) => update('paymentModel', e.target.value)}><option>Fixed fee</option><option>Milestone based</option><option>Hourly cap</option><option>Monthly retainer</option></select></label>
        <label className="text-xs text-[#b5c0d8]">Approval status<select className={inputClass} value={form.status} onChange={(e) => update('status', e.target.value)}><option>Pending approval</option><option>Approved</option><option>Contract sent</option></select></label>
      </div>
      <div className="flex justify-end gap-3 border-t border-[#29334a] px-6 py-4"><button type="button" onClick={onClose} className="rounded-md px-4 py-2 text-sm text-[#b5c0d8] hover:bg-[#222d46]">Cancel</button><button type="submit" className="rounded-md bg-[#4edea3] px-4 py-2 text-sm font-semibold text-[#003824] hover:bg-[#6ceeb5]">Create outsourced assignment</button></div>
    </form>
  </div>;
};
