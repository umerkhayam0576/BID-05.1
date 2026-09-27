import React, { useState } from 'react';
import { TrendingUp, ArrowUpRight, ShieldCheck, Layers } from 'lucide-react';
import { NetWorthPoint } from '../../types/finance';

interface NetWorthChartProps {
  data: NetWorthPoint[];
  privacyMode: boolean;
}

export const NetWorthChart: React.FC<NetWorthChartProps> = ({
  data,
  privacyMode,
}) => {
  const [activeTab, setActiveTab] = useState<'netWorth' | 'assets' | 'liabilities'>('netWorth');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const format = (val: number) => {
    if (privacyMode) return '$••••••';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  // SVG dimensions
  const width = 640;
  const height = 220;
  const paddingX = 40;
  const paddingY = 25;

  const activeValues = data.map((d) =>
    activeTab === 'netWorth' ? d.netWorth : activeTab === 'assets' ? d.assets : d.liabilities
  );

  const minVal = Math.min(...activeValues) * 0.95;
  const maxVal = Math.max(...activeValues) * 1.05;

  const getX = (index: number) => {
    return paddingX + (index / (data.length - 1)) * (width - paddingX * 2);
  };

  const getY = (val: number) => {
    return height - paddingY - ((val - minVal) / (maxVal - minVal)) * (height - paddingY * 2);
  };

  // Build SVG path
  const points = data.map((d, i) => `${getX(i)},${getY(activeValues[i])}`).join(' ');

  // Area path for gradient fill
  const areaPath = `
    M ${getX(0)},${getY(activeValues[0])}
    ${data.map((d, i) => `L ${getX(i)},${getY(activeValues[i])}`).join(' ')}
    L ${getX(data.length - 1)},${height - paddingY}
    L ${getX(0)},${height - paddingY}
    Z
  `;

  const hoveredPoint = hoveredIndex !== null ? data[hoveredIndex] : data[data.length - 1];
  const hoveredValue = hoveredIndex !== null ? activeValues[hoveredIndex] : activeValues[activeValues.length - 1];

  const primaryColor =
    activeTab === 'netWorth' ? '#4edea3' : activeTab === 'assets' ? '#3b82f6' : '#ff7886';

  return (
    <div
      id="net-worth-chart-card"
      className="p-4 sm:p-5 rounded-xl bg-[#131b2e] border border-[#222a3d] flex flex-col justify-between"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#dae2fd]">
              Wealth Trajectory & Asset Growth
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/30 font-semibold">
              6-Month Trend
            </span>
          </div>
          <p className="text-xs text-[#86948a] mt-0.5">
            Consolidated valuation across bank accounts, index funds, and debt amortization
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex items-center bg-[#0b1326] p-1 rounded-lg border border-[#222a3d] self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('netWorth')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
              activeTab === 'netWorth'
                ? 'bg-[#4edea3] text-[#003824] font-bold shadow-sm'
                : 'text-[#86948a] hover:text-[#dae2fd]'
            }`}
          >
            Net Worth
          </button>
          <button
            onClick={() => setActiveTab('assets')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
              activeTab === 'assets'
                ? 'bg-[#3b82f6] text-white font-bold shadow-sm'
                : 'text-[#86948a] hover:text-[#dae2fd]'
            }`}
          >
            Gross Assets
          </button>
          <button
            onClick={() => setActiveTab('liabilities')}
            className={`px-2.5 py-1 rounded text-xs font-mono transition-colors cursor-pointer ${
              activeTab === 'liabilities'
                ? 'bg-[#ff7886] text-[#41000b] font-bold shadow-sm'
                : 'text-[#86948a] hover:text-[#dae2fd]'
            }`}
          >
            Liabilities
          </button>
        </div>
      </div>

      {/* Chart Display Value */}
      <div className="flex items-baseline gap-3 mb-2 font-mono">
        <span className="text-2xl font-bold text-[#dae2fd]">
          {format(hoveredValue)}
        </span>
        <span className="text-xs text-[#86948a]">
          in {hoveredPoint.month} 2026
        </span>
        {hoveredIndex !== null && hoveredIndex > 0 && (
          <span className="text-xs text-[#4edea3] font-semibold">
            (+{format(activeValues[hoveredIndex] - activeValues[hoveredIndex - 1])} MoM)
          </span>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-44 sm:h-52 overflow-visible"
        >
          <defs>
            <linearGradient id="wealthGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={primaryColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line
            x1={paddingX}
            y1={paddingY}
            x2={width - paddingX}
            y2={paddingY}
            stroke="#222a3d"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={height / 2}
            x2={width - paddingX}
            y2={height / 2}
            stroke="#222a3d"
            strokeDasharray="3 3"
          />
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke="#222a3d"
          />

          {/* Area Fill */}
          <path d={areaPath} fill="url(#wealthGradient)" />

          {/* Polyline */}
          <polyline
            fill="none"
            stroke={primaryColor}
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Interactive Data Points */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(activeValues[i]);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={d.month}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {/* Vertical hover guide */}
                {isHovered && (
                  <line
                    x1={cx}
                    y1={paddingY}
                    x2={cx}
                    y2={height - paddingY}
                    stroke={primaryColor}
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                )}

                {/* Point circle */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={isHovered ? 6 : 4}
                  fill="#0b1326"
                  stroke={primaryColor}
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                />

                {/* X-axis Month Label */}
                <text
                  x={cx}
                  y={height - 6}
                  fill={isHovered ? '#dae2fd' : '#86948a'}
                  fontSize="11"
                  fontFamily="monospace"
                  textAnchor="middle"
                  fontWeight={isHovered ? 'bold' : 'normal'}
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Footer stats strip */}
      <div className="mt-2 pt-3 border-t border-[#222a3d] grid grid-cols-3 text-center text-xs font-mono">
        <div>
          <span className="text-[10px] text-[#86948a] uppercase block">Starting (Apr)</span>
          <span className="font-semibold text-[#dae2fd]">{format(activeValues[0])}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#86948a] uppercase block">Current (Sep)</span>
          <span className="font-semibold text-[#4edea3]">{format(activeValues[activeValues.length - 1])}</span>
        </div>
        <div>
          <span className="text-[10px] text-[#86948a] uppercase block">6-Mo Delta</span>
          <span className="font-semibold text-[#adc6ff]">
            +{format(activeValues[activeValues.length - 1] - activeValues[0])}
          </span>
        </div>
      </div>
    </div>
  );
};
