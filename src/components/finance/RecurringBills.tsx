import React from 'react';
import { Calendar, CheckCircle2, Clock, Zap, ShieldCheck } from 'lucide-react';
import { RecurringBill } from '../../types/finance';

interface RecurringBillsProps {
  bills: RecurringBill[];
  privacyMode: boolean;
  onTogglePaid?: (id: string) => void;
}

export const RecurringBills: React.FC<RecurringBillsProps> = ({
  bills,
  privacyMode,
  onTogglePaid,
}) => {
  const format = (val: number) => {
    if (privacyMode) return '$••••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(val);
  };

  const totalMonthlyCommitment = bills.reduce((acc, b) => acc + b.amount, 0);

  return (
    <div
      id="recurring-bills-card"
      className="p-4 sm:p-5 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#dae2fd]">
              Upcoming Recurring Charges & Subscriptions
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-semibold">
              {format(totalMonthlyCommitment)} / mo
            </span>
          </div>
          <p className="text-xs text-[#86948a] mt-0.5">
            Automated debits, utility schedules, and recurring memberships
          </p>
        </div>
      </div>

      {/* Bills Grid / List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {bills.map((b) => (
          <div
            key={b.id}
            className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] hover:border-[#2d3449] transition-all flex flex-col justify-between"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h4 className="text-xs font-bold text-[#dae2fd] leading-snug">
                  {b.title}
                </h4>
                <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-[#86948a]">
                  <span>{b.category}</span>
                  <span>•</span>
                  <span>Due: {b.nextDueDate}</span>
                </div>
              </div>

              {b.autoPay && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-semibold uppercase shrink-0">
                  Autopay
                </span>
              )}
            </div>

            <div className="mt-3 pt-2 border-t border-[#171f33] flex items-center justify-between font-mono text-xs">
              <span className="text-[#86948a] text-[10px] uppercase">
                {b.frequency}
              </span>
              <span className="font-bold text-[#dae2fd]">
                {format(b.amount)}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
