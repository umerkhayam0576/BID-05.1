import React from 'react';
import {
  Banknote,
  Building,
  HelpCircle,
  Trophy,
  TrendingUp,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { MetricSummary } from '../types';

interface KpiMetricsRowProps {
  metrics: MetricSummary;
  onFilterRfiOpen?: () => void;
  onViewPipeline?: () => void;
}

export const KpiMetricsRow: React.FC<KpiMetricsRowProps> = ({
  metrics,
  onFilterRfiOpen,
  onViewPipeline,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div
      id="kpi-metrics-row"
      className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3.5"
    >
      {/* 1. ACTIVE BIDDING PIPELINE */}
      <div
        id="card-kpi-pipeline"
        onClick={onViewPipeline}
        className="bg-[#171f33] border border-[#222a3d] hover:border-[#3c4a42] rounded-lg p-4 transition-all hover:bg-[#1a233a] cursor-pointer group flex flex-col justify-between relative overflow-hidden"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono tracking-wider text-[#86948a] uppercase font-bold">
            Active Bidding Pipeline
          </span>
          <div className="w-6 h-6 rounded bg-[#131b2e] border border-[#222a3d] flex items-center justify-center text-[#4edea3]">
            <Banknote className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1.5">
          <div className="text-2xl font-bold font-mono tracking-tight text-[#dae2fd]">
            {formatCurrency(metrics.pipelineTotal)}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#222a3d]/70 text-xs">
          <div className="flex items-center gap-1 text-[#4edea3] font-mono font-medium text-[11px]">
            <TrendingUp className="w-3 h-3" />
            <span>+{metrics.pipelineMom}% MoM</span>
          </div>
          <span className="text-[11px] text-[#86948a]">
            in {metrics.submittedEstimatesCount} submitted estimates
          </span>
        </div>
      </div>

      {/* 2. ACTIVE CLIENT ACCOUNTS */}
      <div
        id="card-kpi-clients"
        className="bg-[#171f33] border border-[#222a3d] hover:border-[#3c4a42] rounded-lg p-4 transition-all hover:bg-[#1a233a] flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono tracking-wider text-[#86948a] uppercase font-bold">
            Active Client Accounts
          </span>
          <div className="w-6 h-6 rounded bg-[#131b2e] border border-[#222a3d] flex items-center justify-center text-[#adc6ff]">
            <Building className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-[#dae2fd]">
            {metrics.activeClientsCount}
          </span>
          <span className="text-xs text-[#bbcabf] font-medium">General Contractors</span>
        </div>

        <div className="space-y-1.5 pt-1.5 border-t border-[#222a3d]/70">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#131b2e] text-[#adc6ff] border border-[#2d3449]">
              Tier-1 GCs & Devs
            </span>
            <span className="text-[10px] text-[#86948a]">
              {metrics.masterContractsCount} under master contract
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#4edea3]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3]" />
            <span className="font-mono">{metrics.retainedPercent}% Retained FY24</span>
          </div>
        </div>
      </div>

      {/* 3. OPEN RFIS IN-FLIGHT */}
      <div
        id="card-kpi-rfis"
        onClick={onFilterRfiOpen}
        className="bg-[#171f33] border border-[#222a3d] hover:border-[#3c4a42] rounded-lg p-4 transition-all hover:bg-[#1a233a] cursor-pointer group flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono tracking-wider text-[#86948a] uppercase font-bold">
            Open RFIs In-Flight
          </span>
          <div className="w-6 h-6 rounded bg-[#131b2e] border border-[#222a3d] flex items-center justify-center text-[#ff7886]">
            <HelpCircle className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-[#dae2fd]">
            {metrics.openRfiCount < 10 ? `0${metrics.openRfiCount}` : metrics.openRfiCount}
          </span>
          <span className="text-xs text-[#bbcabf] font-medium">Urgent Clarifications</span>
        </div>

        <div className="space-y-1 pt-1.5 border-t border-[#222a3d]/70">
          <div className="flex items-center justify-between text-xs">
            <div className="inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#ff7886]/10 text-[#ffb4ab] border border-[#ff7886]/20">
              <Clock className="w-3 h-3 text-[#ff7886]" />
              <span>SLA: {metrics.slaMaxHours}h MAX</span>
            </div>
            <span className="text-[11px] text-[#86948a]">
              Avg turn: {metrics.avgTurnHours} hrs
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] pt-0.5">
            <span className="text-[#86948a]">Overdue risk:</span>
            <span className="text-[#4edea3] font-mono font-medium">
              {metrics.overdueRiskCount} tickets
            </span>
          </div>
        </div>
      </div>

      {/* 4. WIN RATE (Q3 PERIOD) */}
      <div
        id="card-kpi-winrate"
        className="bg-[#171f33] border border-[#222a3d] hover:border-[#3c4a42] rounded-lg p-4 transition-all hover:bg-[#1a233a] flex flex-col justify-between"
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-mono tracking-wider text-[#86948a] uppercase font-bold">
            Win Rate (Q3 Period)
          </span>
          <div className="w-6 h-6 rounded bg-[#131b2e] border border-[#222a3d] flex items-center justify-center text-[#4edea3]">
            <Trophy className="w-3.5 h-3.5" />
          </div>
        </div>

        <div className="my-1.5 flex items-baseline gap-2">
          <span className="text-2xl font-bold font-mono tracking-tight text-[#dae2fd]">
            {metrics.winRatePercent}%
          </span>
          <span className="text-xs text-[#bbcabf] font-medium">Awarded</span>
        </div>

        <div className="space-y-1.5 pt-1.5 border-t border-[#222a3d]/70">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1 text-[#4edea3] font-mono text-[11px]">
              <TrendingUp className="w-3 h-3" />
              <span>+{metrics.winRateBenchmarkDelta}% vs benchmark</span>
            </div>
            <span className="text-[11px] text-[#86948a]">
              {metrics.bidsTrackedCount} bids tracked
            </span>
          </div>

          {/* Progress bar with benchmark marker */}
          <div className="w-full bg-[#131b2e] h-1.5 rounded-full overflow-hidden relative">
            <div
              className="bg-gradient-to-r from-[#3b82f6] to-[#4edea3] h-full rounded-full transition-all duration-500"
              style={{ width: `${metrics.winRatePercent}%` }}
            />
            {/* Benchmark marker at 38% */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white/70"
              style={{ left: '38.2%' }}
              title="Industry Benchmark: 38.2%"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
