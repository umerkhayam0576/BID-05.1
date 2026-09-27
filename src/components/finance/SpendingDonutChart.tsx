import React, { useState } from 'react';
import { FinanceBudget } from '../../types/finance';
import { PieChart, ArrowUpRight } from 'lucide-react';

interface SpendingDonutChartProps {
  budgets: FinanceBudget[];
  privacyMode: boolean;
}

export const SpendingDonutChart: React.FC<SpendingDonutChartProps> = ({
  budgets,
  privacyMode,
}) => {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const totalSpent = budgets.reduce((acc, b) => acc + b.spent, 0);

  const format = (val: number) => {
    if (privacyMode) return '$••••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // Compute SVG arcs
  let cumulativeAngle = 0;
  const radius = 64;
  const strokeWidth = 20;
  const center = 85;
  const circumference = 2 * Math.PI * radius;

  const slices = budgets.map((b) => {
    const fraction = totalSpent > 0 ? b.spent / totalSpent : 0;
    const strokeDasharray = `${fraction * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle * circumference;
    cumulativeAngle += fraction;
    return {
      ...b,
      fraction,
      percent: Math.round(fraction * 100),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeSlice = slices.find((s) => s.category === hoveredCategory) || slices[0];

  return (
    <div
      id="spending-distribution-card"
      className="p-4 sm:p-5 rounded-xl bg-[#131b2e] border border-[#222a3d] flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#dae2fd]">
              Monthly Outflow Distribution
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3b82f6]/10 text-[#adc6ff] border border-[#3b82f6]/30 font-semibold">
              September
            </span>
          </div>
          <p className="text-xs text-[#86948a] mt-0.5">
            Category allocation across essential and discretionary expenses
          </p>
        </div>
      </div>

      {/* Main Body: Donut + Legend */}
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* SVG Donut */}
        <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
          <svg width="170" height="170" viewBox="0 0 170 170" className="-rotate-90">
            {/* Background ring */}
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              stroke="#0b1326"
              strokeWidth={strokeWidth}
            />

            {/* Slices */}
            {slices.map((slice) => (
              <circle
                key={slice.id}
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={slice.color}
                strokeWidth={hoveredCategory === slice.category ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredCategory(slice.category)}
                onMouseLeave={() => setHoveredCategory(null)}
              />
            ))}
          </svg>

          {/* Center Callout */}
          <div className="absolute flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] font-mono uppercase text-[#86948a]">
              {hoveredCategory ? activeSlice.category.split(' ')[0] : 'Total Spend'}
            </span>
            <span className="text-sm font-bold font-mono text-[#dae2fd]">
              {format(hoveredCategory ? activeSlice.spent : totalSpent)}
            </span>
            <span className="text-[10px] font-mono text-[#4edea3]">
              {hoveredCategory ? `${activeSlice.percent}% of total` : 'Current Cycle'}
            </span>
          </div>
        </div>

        {/* Categories List (Top 6) */}
        <div className="flex-1 w-full space-y-2">
          {slices.slice(0, 6).map((slice) => {
            const isHovered = hoveredCategory === slice.category;
            return (
              <div
                key={slice.id}
                onMouseEnter={() => setHoveredCategory(slice.category)}
                onMouseLeave={() => setHoveredCategory(null)}
                className={`p-1.5 rounded-lg flex items-center justify-between text-xs font-mono transition-colors cursor-pointer ${
                  isHovered ? 'bg-[#171f33]' : 'hover:bg-[#171f33]/60'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="text-[#dae2fd] truncate text-xs">
                    {slice.category}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[#86948a] text-[11px]">{slice.percent}%</span>
                  <span className="font-semibold text-white">
                    {format(slice.spent)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
