import React from 'react';
import { FinanceBudget } from '../../types/finance';
import { SlidersHorizontal, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

interface BudgetsProgressProps {
  budgets: FinanceBudget[];
  privacyMode: boolean;
  onEditBudget?: (budget: FinanceBudget) => void;
  onAddNewBudget?: () => void;
}

export const BudgetsProgress: React.FC<BudgetsProgressProps> = ({
  budgets,
  privacyMode,
  onEditBudget,
  onAddNewBudget,
}) => {
  const format = (val: number) => {
    if (privacyMode) return '$••••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      id="category-budgets-card"
      className="p-4 sm:p-5 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#dae2fd]">
              Category Spending & Envelope Targets
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-semibold">
              September
            </span>
          </div>
          <p className="text-xs text-[#86948a] mt-0.5">
            Real-time burn rate against monthly spending caps
          </p>
        </div>

        {onAddNewBudget && (
          <button
            onClick={onAddNewBudget}
            className="h-7 px-2.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-[11px] font-mono text-[#dae2fd] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <Plus className="w-3 h-3 text-[#4edea3]" />
            <span>New Budget</span>
          </button>
        )}
      </div>

      {/* Budget Items */}
      <div className="space-y-3">
        {budgets.map((b) => {
          const percent = Math.round((b.spent / b.allocated) * 100);
          const remaining = b.allocated - b.spent;
          const isOver = b.spent > b.allocated;
          const isClose = percent >= 85 && !isOver;

          return (
            <div
              key={b.id}
              className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] hover:border-[#2d3449] transition-all space-y-2"
            >
              {/* Row Top */}
              <div className="flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: b.color }}
                  />
                  <span className="font-bold text-[#dae2fd] truncate">
                    {b.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[#86948a]">
                    {format(b.spent)} / {format(b.allocated)}
                  </span>
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      isOver
                        ? 'bg-[#ff7886]/15 text-[#ff7886] border border-[#ff7886]/30'
                        : isClose
                        ? 'bg-[#f59e0b]/15 text-[#fcd34d] border border-[#f59e0b]/30'
                        : 'bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30'
                    }`}
                  >
                    {isOver ? `Over ${format(Math.abs(remaining))}` : `${percent}%`}
                  </span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-[#171f33] rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-300 rounded-full"
                  style={{
                    width: `${Math.min(percent, 100)}%`,
                    backgroundColor: isOver ? '#ff7886' : b.color,
                  }}
                />
              </div>

              {/* Footnote */}
              <div className="flex items-center justify-between text-[10px] font-mono text-[#86948a]">
                <span>
                  {isOver
                    ? 'Exceeded budget target for this cycle'
                    : `${format(remaining)} remaining until next cycle`}
                </span>
                {onEditBudget && (
                  <button
                    onClick={() => onEditBudget(b)}
                    className="hover:text-[#dae2fd] text-[#86948a] underline cursor-pointer"
                  >
                    Adjust
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
