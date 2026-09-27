import React from 'react';
import { Target, Plus, CheckCircle2, Sparkles } from 'lucide-react';
import { FinanceGoal } from '../../types/finance';

interface FinancialGoalsProps {
  goals: FinanceGoal[];
  privacyMode: boolean;
  onOpenAddGoal: () => void;
  onContributeGoal: (goalId: string, amount: number) => void;
}

export const FinancialGoals: React.FC<FinancialGoalsProps> = ({
  goals,
  privacyMode,
  onOpenAddGoal,
  onContributeGoal,
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
      id="financial-goals-card"
      className="p-4 sm:p-5 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#dae2fd]">
              Financial Goals & Milestones
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-semibold">
              {goals.length} Targets
            </span>
          </div>
          <p className="text-xs text-[#86948a] mt-0.5">
            Dedicated savings buckets, debt freedom milestones, and life plans
          </p>
        </div>

        <button
          onClick={onOpenAddGoal}
          className="h-8 px-2.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-[#4edea3]" />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {goals.map((g) => {
          const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
          const remaining = Math.max(0, g.targetAmount - g.currentAmount);

          return (
            <div
              key={g.id}
              className="p-3.5 rounded-lg bg-[#0b1326] border border-[#222a3d] hover:border-[#2d3449] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#171f33] text-[#bbcabf] border border-[#222a3d]">
                    {g.category}
                  </span>
                  <span className="text-[10px] font-mono text-[#86948a]">
                    Target: {g.targetDate}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-[#dae2fd] group-hover:text-[#4edea3] transition-colors leading-snug">
                  {g.title}
                </h4>

                {g.notes && (
                  <p className="text-[11px] text-[#86948a] mt-1 line-clamp-1">
                    {g.notes}
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-baseline justify-between font-mono text-xs">
                  <span className="font-bold text-[#dae2fd]">
                    {format(g.currentAmount)}
                  </span>
                  <span className="text-[11px] text-[#86948a]">
                    of {format(g.targetAmount)} ({percent}%)
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-[#171f33] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${percent}%`,
                      backgroundColor: g.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between pt-1 font-mono text-[10px]">
                  <span className="text-[#86948a]">
                    {remaining > 0 ? `${format(remaining)} to go` : 'Goal achieved!'}
                  </span>
                  <button
                    onClick={() => onContributeGoal(g.id, 250)}
                    className="px-2 py-0.5 rounded bg-[#171f33] hover:bg-[#222a3d] text-[#4edea3] font-semibold border border-[#2d3449] transition-colors cursor-pointer"
                  >
                    + $250
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
