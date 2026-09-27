import React, { useState } from 'react';
import { CompanyEntity, LedgerClassification, LedgerEvent } from '../../types/wealth';

interface RecordCapitalModalProps {
  isOpen: boolean;
  onClose: () => void;
  companies: CompanyEntity[];
  activeEntityId?: string | null;
  onAddEvent?: (event: LedgerEvent) => void;
  onRecordEvent?: (event: Omit<LedgerEvent, 'id'>) => void;
}

export const RecordCapitalModal: React.FC<RecordCapitalModalProps> = ({
  isOpen,
  onClose,
  companies,
  activeEntityId,
  onAddEvent,
  onRecordEvent,
}) => {
  const [classification, setClassification] = useState<LedgerClassification>('Distribution Payout');
  const [entityId, setEntityId] = useState(activeEntityId || companies[0]?.id || '');
  const [amount, setAmount] = useState<number>(10000);
  const [scopeDetails, setScopeDetails] = useState('');
  const [date, setDate] = useState('Sep 19, 2026');
  const [account, setAccount] = useState('Chase Personal Checking (#3391)');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const entity = companies.find((c) => c.id === entityId);
    const entityName = entity ? entity.name : 'Personal Holding';

    const refPrefix =
      classification === 'Distribution Payout'
        ? '#DIST'
        : classification === 'Capital Contribution'
        ? '#CAP'
        : classification === 'Profit Allocation'
        ? '#ALLOC'
        : '#LOAN';

    const refId = `${refPrefix}-${Math.floor(1000 + Math.random() * 9000)}`;

    let effect = Number(amount);
    if (classification === 'Capital Contribution') {
      effect = -Math.abs(effect);
    } else {
      effect = Math.abs(effect);
    }

    const newEvent: LedgerEvent = {
      id: `ev-${Date.now()}`,
      classification,
      entityName,
      entityId,
      referenceId: refId,
      scopeDetails: scopeDetails.trim() || `Cleared transaction via ${account}`,
      accountingDate: date,
      cashEffect: effect,
      isAccruedNonCash: classification === 'Profit Allocation',
    };

    if (onAddEvent) {
      onAddEvent(newEvent);
    }
    if (onRecordEvent) {
      onRecordEvent(newEvent);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#131b2e] border border-[#2d3449] rounded-xl max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 bg-[#060e20] border-b border-[#222a3d] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined text-[#4edea3] text-xl">payments</span>
            <div>
              <h2 className="font-['Manrope'] font-bold text-base text-[#dae2fd]">
                Record Capital or Distribution Action
              </h2>
              <p className="text-xs text-[#bbcabf]">
                Log cleared distributions, equity injections, or loan transactions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#bbcabf] hover:text-[#dae2fd] p-1 rounded hover:bg-[#171f33] transition-colors"
          >
            <span className="material-symbols-outlined text-lg">close</span>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Classification */}
          <div className="space-y-1">
            <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
              Action Classification *
            </label>
            <select
              value={classification}
              onChange={(e) => setClassification(e.target.value as LedgerClassification)}
              className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none"
            >
              <option value="Distribution Payout">Distribution Payout (+ Cash Inflow to Personal)</option>
              <option value="Capital Contribution">Capital Contribution (- Cash Outflow from Personal)</option>
              <option value="Profit Allocation">Profit Allocation (Accrued / Non-Cash Book Entry)</option>
              <option value="Loan Repayment">Loan Repayment (+ Principal Return to Personal)</option>
            </select>
          </div>

          {/* Connected Entity */}
          <div className="space-y-1">
            <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
              Connected Company Entity *
            </label>
            <select
              value={entityId}
              onChange={(e) => setEntityId(e.target.value)}
              className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none"
            >
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.roleBadge})
                </option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="space-y-1">
            <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
              Amount ($ USD) *
            </label>
            <input
              type="number"
              min="1"
              step="100"
              required
              value={amount}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none font-mono"
            />
          </div>

          {/* Account */}
          <div className="space-y-1">
            <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
              Target / Origin Bank Account
            </label>
            <input
              type="text"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              placeholder="e.g. Chase Personal Checking (#3391)"
              className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none"
            />
          </div>

          {/* Notes / Details */}
          <div className="space-y-1">
            <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
              Ledger Scope & Notes
            </label>
            <textarea
              rows={2}
              value={scopeDetails}
              onChange={(e) => setScopeDetails(e.target.value)}
              placeholder="e.g. Q3 Member distribution approved by board resolution #BR-2026-04"
              className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none resize-none"
            />
          </div>

          {/* Accounting Date */}
          <div className="space-y-1">
            <label className="block font-mono text-xs font-semibold text-[#dae2fd]">
              Accounting Date
            </label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-[#0b1326] border border-[#2d3449] focus:border-[#4edea3] rounded px-3 py-2 text-sm text-[#dae2fd] outline-none font-mono"
            />
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-[#222a3d] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] rounded text-xs font-mono font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#10b981] hover:bg-[#059669] text-[#003824] rounded text-xs font-mono font-bold transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <span className="material-symbols-outlined text-sm">save</span>
              <span>Post to Ledger</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
