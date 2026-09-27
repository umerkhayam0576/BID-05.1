import React, { useState, useMemo } from 'react';
import {
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  Sliders,
  Search,
  Filter,
  Plus,
  BarChart3,
  Activity,
  Layers,
  Briefcase,
  X,
  Zap,
  ChevronDown,
  Info,
  Check,
  Copy,
} from 'lucide-react';
import { ProjectTrackItem, EstimatorWorkloadItem } from '../types';

interface ResourceCapacityPlanningModuleProps {
  projects: ProjectTrackItem[];
  estimators: EstimatorWorkloadItem[];
  onUpdateEstimators: (updated: EstimatorWorkloadItem[]) => void;
  onInspectProject?: (project: ProjectTrackItem) => void;
  onShowToast: (msg: string) => void;
}

type TimelineHorizon = '2_WEEK_SPRINT' | '4_WEEK_HORIZON';
type RoleFilter = 'ALL' | 'principal' | 'senior' | 'bim_vdc' | 'structural' | 'general';
type UtilizationFilter = 'ALL' | 'OVERALLOCATED' | 'OPTIMAL' | 'AVAILABLE';

export const ResourceCapacityPlanningModule: React.FC<ResourceCapacityPlanningModuleProps> = ({
  projects,
  estimators,
  onUpdateEstimators,
  onInspectProject,
  onShowToast,
}) => {
  // Horizon and Filter states
  const [horizon, setHorizon] = useState<TimelineHorizon>('2_WEEK_SPRINT');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [utilizationFilter, setUtilizationFilter] = useState<UtilizationFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Rebalance modal state
  const [rebalanceEstimator, setRebalanceEstimator] = useState<EstimatorWorkloadItem | null>(null);
  const [rebalanceAllocations, setRebalanceAllocations] = useState<
    Array<{ projectId: string; projectTitle: string; hoursPerWeek: number; roleOnProject?: string }>
  >([]);
  const [transferTargetEstimatorId, setTransferTargetEstimatorId] = useState<string>('');
  const [transferSelectedProjectId, setTransferSelectedProjectId] = useState<string>('');
  const [transferHours, setTransferHours] = useState<number>(5);

  // Quick coverage modal state
  const [showAddCoverageModal, setShowAddCoverageModal] = useState(false);
  const [coverageEstimatorId, setCoverageEstimatorId] = useState<string>('');
  const [coverageProjectId, setCoverageProjectId] = useState<string>('');
  const [coverageHours, setCoverageHours] = useState<number>(10);

  // Auto-level smart suggestion state
  const [showAutoLevelBanner, setShowAutoLevelBanner] = useState(true);

  // Summary Metrics calculations
  const totalStandardHours = useMemo(() => {
    return estimators.reduce((acc, e) => acc + (e.maxWeeklyHours || 40), 0);
  }, [estimators]);

  const totalCommittedHours = useMemo(() => {
    return estimators.reduce((acc, e) => acc + e.committedHours, 0);
  }, [estimators]);

  const teamUtilizationPercent = useMemo(() => {
    if (totalStandardHours === 0) return 0;
    return Math.round((totalCommittedHours / totalStandardHours) * 100);
  }, [totalCommittedHours, totalStandardHours]);

  const overallocatedCount = useMemo(() => {
    return estimators.filter((e) => e.capacityLoadPercent > 100).length;
  }, [estimators]);

  const optimalCount = useMemo(() => {
    return estimators.filter((e) => e.capacityLoadPercent >= 80 && e.capacityLoadPercent <= 100).length;
  }, [estimators]);

  const availableCount = useMemo(() => {
    return estimators.filter((e) => e.capacityLoadPercent < 80).length;
  }, [estimators]);

  const availableBandwidthHours = useMemo(() => {
    return Math.max(0, totalStandardHours - totalCommittedHours);
  }, [totalStandardHours, totalCommittedHours]);

  // Filtered Estimator List
  const filteredEstimators = useMemo(() => {
    return estimators.filter((est) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = est.name.toLowerCase().includes(q);
        const matchesTitle = est.title.toLowerCase().includes(q);
        const matchesProjects = est.activeAssignments.some((p) => p.toLowerCase().includes(q));
        if (!matchesName && !matchesTitle && !matchesProjects) return false;
      }

      // Role filter
      if (roleFilter !== 'ALL') {
        if (est.roleCategory !== roleFilter) return false;
      }

      // Utilization filter
      if (utilizationFilter === 'OVERALLOCATED' && est.capacityLoadPercent <= 100) return false;
      if (utilizationFilter === 'OPTIMAL' && (est.capacityLoadPercent < 80 || est.capacityLoadPercent > 100))
        return false;
      if (utilizationFilter === 'AVAILABLE' && est.capacityLoadPercent >= 80) return false;

      return true;
    });
  }, [estimators, searchQuery, roleFilter, utilizationFilter]);

  // Helper: Open Rebalance Modal for an Estimator
  const handleOpenRebalance = (est: EstimatorWorkloadItem) => {
    setRebalanceEstimator(est);
    setRebalanceAllocations(
      est.projectAllocations && est.projectAllocations.length > 0
        ? JSON.parse(JSON.stringify(est.projectAllocations))
        : est.activeAssignments.map((title) => {
            const p = projects.find((x) => x.title.toLowerCase().includes(title.toLowerCase()));
            return {
              projectId: p ? p.id : 'BID-GEN',
              projectTitle: title,
              hoursPerWeek: Math.round(est.committedHours / (est.activeAssignments.length || 1)),
            };
          })
    );
    // Default transfer target: first other estimator with available capacity
    const other = estimators.find((e) => e.id !== est.id && e.capacityLoadPercent < 100);
    setTransferTargetEstimatorId(other ? other.id : '');
    setTransferSelectedProjectId(
      est.projectAllocations && est.projectAllocations.length > 0
        ? est.projectAllocations[0].projectId
        : ''
    );
    setTransferHours(5);
  };

  // Helper: Save Rebalance Hours
  const handleSaveRebalance = () => {
    if (!rebalanceEstimator) return;
    const newCommitted = rebalanceAllocations.reduce((acc, a) => acc + (Number(a.hoursPerWeek) || 0), 0);
    const maxH = rebalanceEstimator.maxWeeklyHours || 40;
    const newPercent = Math.round((newCommitted / maxH) * 100);

    const updated = estimators.map((e) => {
      if (e.id === rebalanceEstimator.id) {
        return {
          ...e,
          committedHours: newCommitted,
          capacityLoadPercent: newPercent,
          projectAllocations: rebalanceAllocations,
          activeAssignments: rebalanceAllocations.map((a) => a.projectTitle),
          signOffStatus: {
            ...e.signOffStatus,
            text: newPercent > 100 ? 'Over-capacity Warning' : 'Capacity Balanced',
            type: (newPercent > 100 ? 'blocked' : 'cleared') as 'blocked' | 'cleared',
          },
        };
      }
      return e;
    });

    onUpdateEstimators(updated);
    setRebalanceEstimator(null);
    onShowToast(`Adjusted workload for ${rebalanceEstimator.name} to ${newCommitted}h/wk (${newPercent}%)`);
  };

  // Helper: Transfer Project/Hours from one Estimator to another
  const handleExecuteTransfer = () => {
    if (!rebalanceEstimator || !transferTargetEstimatorId || !transferSelectedProjectId) {
      onShowToast('Please select a target estimator and project to transfer');
      return;
    }

    const targetEst = estimators.find((e) => e.id === transferTargetEstimatorId);
    if (!targetEst) return;

    const projToTransfer = rebalanceAllocations.find((a) => a.projectId === transferSelectedProjectId);
    if (!projToTransfer) return;

    const transferAmount = Math.min(projToTransfer.hoursPerWeek, Number(transferHours) || 5);

    // Update Source Estimator
    const updatedSourceAllocations = rebalanceAllocations
      .map((a) => {
        if (a.projectId === transferSelectedProjectId) {
          const rem = a.hoursPerWeek - transferAmount;
          return rem > 0 ? { ...a, hoursPerWeek: rem } : null;
        }
        return a;
      })
      .filter(Boolean) as typeof rebalanceAllocations;

    const sourceNewCommitted = updatedSourceAllocations.reduce((acc, a) => acc + a.hoursPerWeek, 0);
    const sourceMax = rebalanceEstimator.maxWeeklyHours || 40;
    const sourcePercent = Math.round((sourceNewCommitted / sourceMax) * 100);

    // Update Target Estimator
    const targetAllocations = targetEst.projectAllocations ? [...targetEst.projectAllocations] : [];
    const existingIdx = targetAllocations.findIndex((a) => a.projectId === transferSelectedProjectId);
    if (existingIdx >= 0) {
      targetAllocations[existingIdx].hoursPerWeek += transferAmount;
    } else {
      targetAllocations.push({
        projectId: transferSelectedProjectId,
        projectTitle: projToTransfer.projectTitle,
        hoursPerWeek: transferAmount,
        roleOnProject: 'Coverage Estimator',
      });
    }

    const targetNewCommitted = targetAllocations.reduce((acc, a) => acc + a.hoursPerWeek, 0);
    const targetMax = targetEst.maxWeeklyHours || 40;
    const targetPercent = Math.round((targetNewCommitted / targetMax) * 100);

    const updated = estimators.map((e) => {
      if (e.id === rebalanceEstimator.id) {
        return {
          ...e,
          committedHours: sourceNewCommitted,
          capacityLoadPercent: sourcePercent,
          projectAllocations: updatedSourceAllocations,
          activeAssignments: updatedSourceAllocations.map((a) => a.projectTitle),
        };
      }
      if (e.id === targetEst.id) {
        return {
          ...e,
          committedHours: targetNewCommitted,
          capacityLoadPercent: targetPercent,
          projectAllocations: targetAllocations,
          activeAssignments: Array.from(
            new Set([...e.activeAssignments, projToTransfer.projectTitle])
          ),
        };
      }
      return e;
    });

    onUpdateEstimators(updated);
    setRebalanceEstimator(null);
    onShowToast(
      `Transferred ${transferAmount}h of ${projToTransfer.projectTitle} from ${rebalanceEstimator.name} to ${targetEst.name}`
    );
  };

  // Helper: Auto-level recommendation
  const handleAutoLevel = () => {
    // Identify most overallocated estimator
    const overEst = estimators.find((e) => e.capacityLoadPercent > 100);
    const underEst = estimators.find((e) => e.capacityLoadPercent < 80);

    if (!overEst || !underEst) {
      onShowToast('Team capacity is already balanced within optimal tolerances.');
      return;
    }

    // Shift 5.0 hours from overEst's largest commitment to underEst
    const overAllocations = overEst.projectAllocations || [];
    if (overAllocations.length === 0) return;
    const targetProj = overAllocations.reduce((prev, curr) =>
      curr.hoursPerWeek > prev.hoursPerWeek ? curr : prev
    );

    const shiftAmount = 5.0;

    const updated = estimators.map((e) => {
      if (e.id === overEst.id) {
        const newAlloc = (e.projectAllocations || []).map((a) =>
          a.projectId === targetProj.projectId
            ? { ...a, hoursPerWeek: Math.max(1, a.hoursPerWeek - shiftAmount) }
            : a
        );
        const newHours = newAlloc.reduce((acc, a) => acc + a.hoursPerWeek, 0);
        return {
          ...e,
          projectAllocations: newAlloc,
          committedHours: newHours,
          capacityLoadPercent: Math.round((newHours / (e.maxWeeklyHours || 40)) * 100),
        };
      }
      if (e.id === underEst.id) {
        const underAlloc = e.projectAllocations ? [...e.projectAllocations] : [];
        const existing = underAlloc.find((a) => a.projectId === targetProj.projectId);
        if (existing) {
          existing.hoursPerWeek += shiftAmount;
        } else {
          underAlloc.push({
            projectId: targetProj.projectId,
            projectTitle: targetProj.projectTitle,
            hoursPerWeek: shiftAmount,
            roleOnProject: 'Takeoff Support',
          });
        }
        const newHours = underAlloc.reduce((acc, a) => acc + a.hoursPerWeek, 0);
        return {
          ...e,
          projectAllocations: underAlloc,
          activeAssignments: Array.from(new Set([...e.activeAssignments, targetProj.projectTitle])),
          committedHours: newHours,
          capacityLoadPercent: Math.round((newHours / (e.maxWeeklyHours || 40)) * 100),
        };
      }
      return e;
    });

    onUpdateEstimators(updated);
    onShowToast(
      `Auto-balanced: Shifted ${shiftAmount}h on "${targetProj.projectTitle}" from ${overEst.name} to ${underEst.name}`
    );
  };

  // Helper: Copy Capacity Manifest
  const handleExportManifest = () => {
    const lines = [
      '# RESOURCE CAPACITY & UTILIZATION MANIFEST',
      `Date: ${new Date().toLocaleDateString()} | Horizon: ${horizon}`,
      `Total Capacity: ${totalStandardHours}h | Committed: ${totalCommittedHours}h | Team Utilization: ${teamUtilizationPercent}%`,
      '--------------------------------------------------',
      'Estimator | Role | Committed / Max | Utilization % | Active Bids',
    ];
    estimators.forEach((e) => {
      lines.push(
        `${e.name} | ${e.title} | ${e.committedHours}h / ${e.maxWeeklyHours || 40}h | ${e.capacityLoadPercent}% | ${e.activeAssignments.join(', ')}`
      );
    });
    navigator.clipboard.writeText(lines.join('\n'));
    onShowToast('Resource Capacity Manifest copied to clipboard');
  };

  // Timeline columns definition based on horizon
  const sprintDays = [
    { label: 'Mon Sep 22', day: 'M', date: '22', isToday: false, isSprintStart: true },
    { label: 'Tue Sep 23', day: 'T', date: '23', isToday: true, isSprintStart: false }, // Today
    { label: 'Wed Sep 24', day: 'W', date: '24', isToday: false, isSprintStart: false },
    { label: 'Thu Sep 25', day: 'T', date: '25', isToday: false, isSprintStart: false },
    { label: 'Fri Sep 26', day: 'F', date: '26', isToday: false, isSprintStart: false },
    { label: 'Mon Sep 29', day: 'M', date: '29', isToday: false, isSprintStart: false },
    { label: 'Tue Sep 30', day: 'T', date: '30', isToday: false, isSprintStart: false },
    { label: 'Wed Oct 01', day: 'W', date: '01', isToday: false, isSprintStart: false },
    { label: 'Thu Oct 02', day: 'T', date: '02', isToday: false, isSprintStart: false },
    { label: 'Fri Oct 03', day: 'F', date: '03', isToday: false, isSprintStart: false },
  ];

  const horizonWeeks = [
    { label: 'Wk 38 (Sep 22-26)', short: 'W38 Current', days: 'Closing Bids: Biotech, Metro Hts' },
    { label: 'Wk 39 (Sep 29-Oct 03)', short: 'W39 Closing', days: 'Closing Bids: Civic Center, St. Jude' },
    { label: 'Wk 40 (Oct 06-10)', short: 'W40 Mid-Sprint', days: 'BIM Review: Pacific Bay' },
    { label: 'Wk 41 (Oct 13-17)', short: 'W41 Runway', days: 'New RFP Intake: Terminal Concourse' },
  ];

  return (
    <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl p-5 shadow-sm space-y-6 text-[#dae2fd]">
      {/* 1. Header & Executive Utilization KPIs */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#222a3d]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 bg-[#4edea3]/20 text-[#4edea3] font-mono text-[10px] font-bold rounded uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3 h-3" />
              Resource Capacity Planning
            </span>
            <span className="text-[#86948a] font-mono text-[10px]">• Preconstruction Estimating Desk</span>
            <span className="px-1.5 py-0.2 bg-[#222a3d] text-[#86948a] font-mono text-[10px] rounded">
              Standard 40h/wk Basis
            </span>
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            Estimator Utilization & Active Project Timelines
          </h2>
          <p className="text-xs text-[#86948a] mt-0.5">
            Monitor real-time employee commitment rates against bid closeout deadlines, rebalance workloads, and prevent preconstruction burn.
          </p>
        </div>

        {/* Action Buttons: Auto-level, Add Coverage, Export */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleAutoLevel}
            title="Auto-level workloads from over-allocated staff to staff with available capacity"
            className="px-3 py-1.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] hover:border-[#4edea3]/50 text-[#dae2fd] hover:text-[#4edea3] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Zap className="w-3.5 h-3.5 text-[#ffb356]" />
            <span>Auto-Level Workload</span>
          </button>

          <button
            onClick={() => setShowAddCoverageModal(true)}
            className="px-3 py-1.5 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#adc6ff]/50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#adc6ff]" />
            <span>Assign Coverage</span>
          </button>

          <button
            onClick={handleExportManifest}
            title="Copy capacity manifest to clipboard"
            className="px-3 py-1.5 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] text-[#86948a] hover:text-white rounded-lg text-xs font-mono flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Export Manifest</span>
          </button>
        </div>
      </div>

      {/* 2. Key Utilization Gauges & Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Metric 1: Team Utilization Rate */}
        <div className="bg-[#0b1326] border border-[#222a3d] rounded-lg p-3.5 relative overflow-hidden">
          <div
            className={`absolute top-0 left-0 right-0 h-0.5 ${
              teamUtilizationPercent > 100
                ? 'bg-[#ff7886]'
                : teamUtilizationPercent >= 85
                ? 'bg-[#4edea3]'
                : 'bg-[#adc6ff]'
            }`}
          />
          <div className="flex items-center justify-between text-[11px] font-mono text-[#86948a] mb-1">
            <span>TEAM UTILIZATION RATE</span>
            <span
              className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                teamUtilizationPercent > 100
                  ? 'bg-[#93000a]/30 text-[#ffb4ab]'
                  : 'bg-[#4edea3]/20 text-[#4edea3]'
              }`}
            >
              {teamUtilizationPercent > 100 ? 'OVER CAPACITY' : 'OPTIMAL LOAD'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-2xl font-bold font-mono text-white">
              {teamUtilizationPercent}%
            </span>
            <span className="text-xs font-mono text-[#86948a]">
              ({totalCommittedHours.toFixed(1)}h / {totalStandardHours}h)
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full h-1.5 bg-[#171f33] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                teamUtilizationPercent > 100
                  ? 'bg-[#ff7886]'
                  : teamUtilizationPercent >= 85
                  ? 'bg-[#4edea3]'
                  : 'bg-[#adc6ff]'
              }`}
              style={{ width: `${Math.min(100, teamUtilizationPercent)}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Over-Allocated Staff */}
        <div
          onClick={() => setUtilizationFilter(utilizationFilter === 'OVERALLOCATED' ? 'ALL' : 'OVERALLOCATED')}
          className={`bg-[#0b1326] border rounded-lg p-3.5 relative overflow-hidden transition-all cursor-pointer ${
            utilizationFilter === 'OVERALLOCATED'
              ? 'border-[#ff7886] bg-[#171f33]'
              : 'border-[#222a3d] hover:border-[#ff7886]/50'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#ff7886]" />
          <div className="flex items-center justify-between text-[11px] font-mono text-[#86948a] mb-1">
            <span className="flex items-center gap-1 text-[#ffb4ab]">
              <AlertTriangle className="w-3.5 h-3.5 text-[#ff7886]" />
              OVER-ALLOCATED (&gt;100%)
            </span>
            <span className="text-[10px] text-[#86948a] font-mono">Filter</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-[#ffb4ab]">
              {overallocatedCount} Staff
            </span>
            <span className="text-xs text-[#86948a] font-mono">
              Burnout Risk
            </span>
          </div>
          <p className="text-[11px] text-[#86948a] truncate">
            {estimators
              .filter((e) => e.capacityLoadPercent > 100)
              .map((e) => `${e.name} (${e.capacityLoadPercent}%)`)
              .join(', ') || 'No staff currently over-allocated'}
          </p>
        </div>

        {/* Metric 3: Optimal Band Staff */}
        <div
          onClick={() => setUtilizationFilter(utilizationFilter === 'OPTIMAL' ? 'ALL' : 'OPTIMAL')}
          className={`bg-[#0b1326] border rounded-lg p-3.5 relative overflow-hidden transition-all cursor-pointer ${
            utilizationFilter === 'OPTIMAL'
              ? 'border-[#4edea3] bg-[#171f33]'
              : 'border-[#222a3d] hover:border-[#4edea3]/50'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#4edea3]" />
          <div className="flex items-center justify-between text-[11px] font-mono text-[#86948a] mb-1">
            <span className="flex items-center gap-1 text-[#4edea3]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3]" />
              OPTIMAL BAND (80-100%)
            </span>
            <span className="text-[10px] text-[#86948a] font-mono">Filter</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-[#4edea3]">
              {optimalCount} Staff
            </span>
            <span className="text-xs text-[#86948a] font-mono">
              Target Pacing
            </span>
          </div>
          <p className="text-[11px] text-[#86948a] truncate">
            {estimators
              .filter((e) => e.capacityLoadPercent >= 80 && e.capacityLoadPercent <= 100)
              .map((e) => e.name)
              .join(', ')}
          </p>
        </div>

        {/* Metric 4: Free Bandwidth Buffer */}
        <div
          onClick={() => setUtilizationFilter(utilizationFilter === 'AVAILABLE' ? 'ALL' : 'AVAILABLE')}
          className={`bg-[#0b1326] border rounded-lg p-3.5 relative overflow-hidden transition-all cursor-pointer ${
            utilizationFilter === 'AVAILABLE'
              ? 'border-[#adc6ff] bg-[#171f33]'
              : 'border-[#222a3d] hover:border-[#adc6ff]/50'
          }`}
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#adc6ff]" />
          <div className="flex items-center justify-between text-[11px] font-mono text-[#86948a] mb-1">
            <span className="flex items-center gap-1 text-[#adc6ff]">
              <Clock className="w-3.5 h-3.5 text-[#adc6ff]" />
              FREE BANDWIDTH BUFFER
            </span>
            <span className="text-[10px] text-[#86948a] font-mono">Filter</span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-[#adc6ff]">
              {availableBandwidthHours.toFixed(1)} hrs
            </span>
            <span className="text-xs text-[#86948a] font-mono">
              ({availableCount} staff &lt;80%)
            </span>
          </div>
          <p className="text-[11px] text-[#86948a] truncate">
            Ready to absorb addendums or new bid takeoffs
          </p>
        </div>
      </div>

      {/* 3. Smart Capacity Alert Banner (if overallocated > 0) */}
      {showAutoLevelBanner && overallocatedCount > 0 && (
        <div className="bg-[#93000a]/20 border border-[#ff7886]/40 rounded-lg p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-[#ff7886] shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-[#ffdad6]">
                Capacity Bottleneck Detected ({overallocatedCount} Estimators Over-Committed):
              </span>{' '}
              <span className="text-[#ffb4ab]">
                Marcus Vance is allocated at 106% across 3 concurrent bids closing this week. Free bandwidth is available with Takeoff Specialist Umer (14.0h buffer).
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
            <button
              onClick={handleAutoLevel}
              className="px-2.5 py-1 bg-[#ff7886] hover:bg-[#ffb4ab] text-[#0b1326] font-bold rounded text-xs transition-colors cursor-pointer"
            >
              Rebalance 5.0h
            </button>
            <button
              onClick={() => setShowAutoLevelBanner(false)}
              className="text-[#86948a] hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 4. Controls: Horizon Selector, Role Filters & Search */}
      <div className="bg-[#0b1326] border border-[#222a3d] p-2.5 rounded-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        {/* Horizon Toggle */}
        <div className="flex items-center gap-1">
          <span className="font-mono text-[10px] text-[#86948a] uppercase tracking-wider mr-1">
            Timeline Horizon:
          </span>
          <button
            onClick={() => setHorizon('2_WEEK_SPRINT')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              horizon === '2_WEEK_SPRINT'
                ? 'bg-[#222a3d] text-[#4edea3] shadow-sm'
                : 'text-[#86948a] hover:text-white'
            }`}
          >
            2-Week Sprint (Daily)
          </button>
          <button
            onClick={() => setHorizon('4_WEEK_HORIZON')}
            className={`px-3 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
              horizon === '4_WEEK_HORIZON'
                ? 'bg-[#222a3d] text-[#4edea3] shadow-sm'
                : 'text-[#86948a] hover:text-white'
            }`}
          >
            4-Week Strategic (Weekly)
          </button>
        </div>

        {/* Role and Search Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Filter */}
          <div className="flex items-center gap-1 font-mono text-[11px]">
            <span className="text-[#86948a]">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="bg-[#171f33] text-white border border-[#222a3d] rounded px-2 py-1 text-xs focus:outline-none focus:border-[#4edea3] cursor-pointer"
            >
              <option value="ALL">All Roles ({estimators.length})</option>
              <option value="principal">Principals</option>
              <option value="senior">Senior Cost Analysts</option>
              <option value="bim_vdc">BIM / VDC Modelers</option>
              <option value="structural">Structural Specialists</option>
              <option value="general">Takeoff Engineers</option>
            </select>
          </div>

          {/* Active Utilization Filter Pill */}
          {utilizationFilter !== 'ALL' && (
            <button
              onClick={() => setUtilizationFilter('ALL')}
              className="px-2 py-1 bg-[#171f33] border border-[#222a3d] text-xs text-[#dae2fd] rounded flex items-center gap-1 hover:text-[#ff7886]"
            >
              <span>Filter: {utilizationFilter}</span>
              <X className="w-3 h-3" />
            </button>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-[#86948a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search estimator or project..."
              className="bg-[#171f33] h-7 pl-7 pr-3 text-xs text-white rounded placeholder:text-[#86948a] border border-[#222a3d] focus:outline-none focus:border-[#4edea3] w-48"
            />
          </div>
        </div>
      </div>

      {/* 5. Main Gantt / Timeline Matrix: Employee Utilization against Active Project Timelines */}
      <div className="border border-[#222a3d] rounded-lg overflow-hidden bg-[#0b1326]">
        {/* Timeline Header Row */}
        <div className="grid grid-cols-12 bg-[#131b2e] border-b border-[#222a3d] text-[10px] font-mono text-[#86948a] uppercase tracking-wider py-2.5 px-4 items-center">
          <div className="col-span-12 md:col-span-4 font-semibold text-white flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Estimator & Utilization Rate</span>
          </div>

          <div className="hidden md:grid md:col-span-8 grid-cols-10 gap-1 text-center">
            {horizon === '2_WEEK_SPRINT' ? (
              sprintDays.map((col, idx) => (
                <div
                  key={idx}
                  className={`py-1 rounded flex flex-col items-center justify-center ${
                    col.isToday
                      ? 'bg-[#4edea3]/10 border border-[#4edea3]/40 text-[#4edea3] font-bold'
                      : 'text-[#86948a]'
                  }`}
                >
                  <span className="text-[9px]">{col.day}</span>
                  <span className="text-[11px] font-bold">{col.date}</span>
                  {col.isToday && (
                    <span className="text-[8px] uppercase tracking-tighter text-[#4edea3]">Today</span>
                  )}
                </div>
              ))
            ) : (
              horizonWeeks.map((wk, idx) => (
                <div
                  key={idx}
                  className="col-span-2 py-1 px-1.5 bg-[#171f33] rounded border border-[#222a3d] text-center"
                >
                  <div className="font-bold text-white text-[10px] truncate">{wk.short}</div>
                  <div className="text-[8px] text-[#86948a] truncate">{wk.days}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Matrix Rows: One per Estimator */}
        <div className="divide-y divide-[#222a3d]">
          {filteredEstimators.length === 0 ? (
            <div className="py-12 text-center text-[#86948a] text-xs font-mono">
              No estimators match the selected filters.
            </div>
          ) : (
            filteredEstimators.map((est) => {
              const maxH = est.maxWeeklyHours || 40;
              const loadPercent = est.capacityLoadPercent;
              const isOverallocated = loadPercent > 100;
              const isOptimal = loadPercent >= 80 && loadPercent <= 100;

              // Color classes
              const badgeClass = isOverallocated
                ? 'bg-[#93000a]/30 text-[#ffb4ab] border-[#ff7886]/40'
                : isOptimal
                ? 'bg-[#4edea3]/20 text-[#4edea3] border-[#4edea3]/40'
                : 'bg-[#adc6ff]/20 text-[#adc6ff] border-[#adc6ff]/40';

              const barColor = isOverallocated
                ? 'bg-[#ff7886]'
                : isOptimal
                ? 'bg-[#4edea3]'
                : 'bg-[#adc6ff]';

              // Estimator's project allocations
              const allocations: Array<{
                projectId: string;
                projectTitle: string;
                hoursPerWeek: number;
                roleOnProject?: string;
              }> =
                est.projectAllocations && est.projectAllocations.length > 0
                  ? est.projectAllocations
                  : est.activeAssignments.map((title) => {
                      const p = projects.find((x) => x.title.toLowerCase().includes(title.toLowerCase()));
                      return {
                        projectId: p ? p.id : 'BID-GEN',
                        projectTitle: title,
                        hoursPerWeek: Math.round(est.committedHours / (est.activeAssignments.length || 1)),
                      };
                    });

              return (
                <div
                  key={est.id}
                  className="grid grid-cols-12 p-3 sm:p-4 gap-3 items-center hover:bg-[#131b2e]/60 transition-colors"
                >
                  {/* Left Column: Estimator Profile, Capacity Load & Rebalance Trigger */}
                  <div className="col-span-12 md:col-span-4 flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {est.avatarUrl ? (
                          <img
                            src={est.avatarUrl}
                            alt={est.name}
                            className="w-9 h-9 rounded-full object-cover border border-[#222a3d] shrink-0"
                          />
                        ) : (
                          <div
                            className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-white text-xs border border-[#222a3d] shrink-0"
                            style={{ backgroundColor: est.avatarColor || '#0566d9' }}
                          >
                            {est.initials}
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-white text-sm truncate">{est.name}</span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-mono text-[9px] font-bold border ${badgeClass}`}
                            >
                              {loadPercent}% LOAD
                            </span>
                          </div>
                          <div className="text-[11px] text-[#86948a] font-mono truncate">{est.title}</div>
                        </div>
                      </div>

                      {/* Rebalance Button */}
                      <button
                        onClick={() => handleOpenRebalance(est)}
                        title={`Rebalance workload or reassign projects for ${est.name}`}
                        className="px-2 py-1 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] hover:border-[#4edea3]/40 text-[#dae2fd] hover:text-[#4edea3] text-[11px] font-mono flex items-center gap-1 shrink-0 transition-all cursor-pointer"
                      >
                        <Sliders className="w-3 h-3 text-[#4edea3]" />
                        <span>Rebalance</span>
                      </button>
                    </div>

                    {/* Capacity Progress Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-[#86948a]">
                        <span>
                          {est.committedHours.toFixed(1)}h / {maxH}h allocated
                        </span>
                        <span
                          className={
                            isOverallocated
                              ? 'text-[#ffb4ab] font-bold'
                              : isOptimal
                              ? 'text-[#4edea3]'
                              : 'text-[#adc6ff]'
                          }
                        >
                          {isOverallocated
                            ? `+${(est.committedHours - maxH).toFixed(1)}h OVER`
                            : isOptimal
                            ? 'Optimal pacing'
                            : `${(maxH - est.committedHours).toFixed(1)}h buffer`}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#171f33] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${barColor}`}
                          style={{ width: `${Math.min(100, loadPercent)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Active Project Timeline Bars */}
                  <div className="col-span-12 md:col-span-8 flex flex-col gap-1.5">
                    {allocations.map((alloc, aIdx) => {
                      const matchedProject = projects.find(
                        (p) =>
                          p.id === alloc.projectId ||
                          p.title.toLowerCase().includes(alloc.projectTitle.toLowerCase())
                      );

                      // Project status styling
                      const statusColor =
                        matchedProject?.status === 'CRITICAL_RFI_BLOCK'
                          ? 'border-[#ff7886]/40 bg-[#93000a]/20 text-[#ffdad6]'
                          : matchedProject?.status === 'BIM_MODELING'
                          ? 'border-[#adc6ff]/40 bg-[#172554]/30 text-[#dae2fd]'
                          : matchedProject?.status === 'QUALITY_AUDIT'
                          ? 'border-[#4edea3]/40 bg-[#064e3b]/30 text-[#4edea3]'
                          : 'border-[#4edea3]/30 bg-[#0f291e]/40 text-[#dae2fd]';

                      // Project urgency badge
                      const isDueSoon =
                        matchedProject &&
                        (matchedProject.daysRemaining === 0 ||
                          matchedProject.daysRemaining === 1 ||
                          matchedProject.daysRemaining === 2 ||
                          (matchedProject.daysRemaining && matchedProject.daysRemaining < 0));

                      return (
                        <div
                          key={aIdx}
                          onClick={() => matchedProject && onInspectProject?.(matchedProject)}
                          title={`Click to inspect ${alloc.projectTitle} (${alloc.hoursPerWeek}h/wk commitment)`}
                          className={`p-2 rounded-md border flex items-center justify-between gap-2 text-xs transition-all cursor-pointer group hover:scale-[1.008] ${statusColor}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 rounded bg-[#0b1326]/60 border border-[#222a3d] shrink-0 text-white">
                              {alloc.projectId}
                            </span>
                            <span className="font-semibold text-white group-hover:text-[#4edea3] transition-colors truncate">
                              {alloc.projectTitle}
                            </span>
                            {alloc.roleOnProject && (
                              <span className="hidden sm:inline text-[10px] text-[#86948a] font-mono shrink-0">
                                • {alloc.roleOnProject}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                            {/* Target due tag */}
                            {matchedProject && (
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  matchedProject.daysRemaining && matchedProject.daysRemaining < 0
                                    ? 'bg-[#93000a]/60 text-[#ffb4ab]'
                                    : isDueSoon
                                    ? 'bg-[#ffb356]/20 text-[#ffb356]'
                                    : 'bg-[#0b1326]/50 text-[#86948a]'
                                }`}
                              >
                                {matchedProject.targetDue}
                              </span>
                            )}

                            {/* Hours commitment pill */}
                            <span className="px-2 py-0.5 rounded bg-[#0b1326] border border-[#222a3d] font-bold text-white">
                              {alloc.hoursPerWeek}h / wk
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* 6. Rebalance & Workload Adjustment Modal */}
      {rebalanceEstimator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
              <div className="flex items-center gap-3">
                {rebalanceEstimator.avatarUrl ? (
                  <img
                    src={rebalanceEstimator.avatarUrl}
                    alt={rebalanceEstimator.name}
                    className="w-10 h-10 rounded-full object-cover border border-[#222a3d]"
                  />
                ) : (
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white text-xs border border-[#222a3d]"
                    style={{ backgroundColor: rebalanceEstimator.avatarColor || '#0566d9' }}
                  >
                    {rebalanceEstimator.initials}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Workload Capacity Rebalance
                  </h3>
                  <p className="text-xs text-[#86948a] font-mono">
                    {rebalanceEstimator.name} • {rebalanceEstimator.title} (Cap: {rebalanceEstimator.maxWeeklyHours || 40}h/wk)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setRebalanceEstimator(null)}
                className="text-[#86948a] hover:text-white p-1 rounded-md hover:bg-[#222a3d] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-6 text-xs text-[#dae2fd]">
              {/* Current Committed Hours Summary */}
              <div className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-[#86948a] font-mono block text-[10px] uppercase">
                    Calculated Weekly Commitment
                  </span>
                  <span className="text-xl font-bold font-mono text-white">
                    {rebalanceAllocations.reduce((acc, a) => acc + (Number(a.hoursPerWeek) || 0), 0)} hrs
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#86948a] font-mono block text-[10px] uppercase">
                    Projected Utilization Rate
                  </span>
                  <span
                    className={`text-xl font-bold font-mono ${
                      Math.round(
                        (rebalanceAllocations.reduce((acc, a) => acc + (Number(a.hoursPerWeek) || 0), 0) /
                          (rebalanceEstimator.maxWeeklyHours || 40)) *
                          100
                      ) > 100
                        ? 'text-[#ffb4ab]'
                        : 'text-[#4edea3]'
                    }`}
                  >
                    {Math.round(
                      (rebalanceAllocations.reduce((acc, a) => acc + (Number(a.hoursPerWeek) || 0), 0) /
                        (rebalanceEstimator.maxWeeklyHours || 40)) *
                        100
                    )}
                    %
                  </span>
                </div>
              </div>

              {/* Section A: Fine-tune Hours per Project */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-white text-sm flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#4edea3]" />
                    Adjust Hours by Active Project
                  </h4>
                  <span className="text-[10px] text-[#86948a] font-mono">
                    Slide or type weekly hours committed
                  </span>
                </div>

                <div className="space-y-2.5">
                  {rebalanceAllocations.map((alloc, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#0b1326] border border-[#222a3d] rounded-lg flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] text-[#4edea3] font-bold">
                            {alloc.projectId}
                          </span>
                          <span className="font-semibold text-white truncate">
                            {alloc.projectTitle}
                          </span>
                        </div>
                        <span className="text-[10px] text-[#86948a] font-mono">
                          {alloc.roleOnProject || 'Estimating Lead'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <input
                          type="range"
                          min="0"
                          max="40"
                          step="1"
                          value={alloc.hoursPerWeek}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...rebalanceAllocations];
                            updated[idx].hoursPerWeek = val;
                            setRebalanceAllocations(updated);
                          }}
                          className="w-28 accent-[#4edea3] cursor-pointer"
                        />
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            min="0"
                            max="60"
                            step="0.5"
                            value={alloc.hoursPerWeek}
                            onChange={(e) => {
                              const val = parseFloat(e.target.value) || 0;
                              const updated = [...rebalanceAllocations];
                              updated[idx].hoursPerWeek = val;
                              setRebalanceAllocations(updated);
                            }}
                            className="w-16 bg-[#171f33] border border-[#222a3d] text-white font-mono text-center py-1 rounded text-xs focus:outline-none focus:border-[#4edea3]"
                          />
                          <span className="text-[10px] font-mono text-[#86948a]">h/wk</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section B: Transfer Project / Hours to Another Colleague */}
              <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                <div className="flex items-center gap-2 text-white font-semibold">
                  <ArrowRight className="w-4 h-4 text-[#adc6ff]" />
                  <span>Transfer Project Workload to Team Member</span>
                </div>
                <p className="text-[#86948a] text-xs">
                  Offload hours or reassign project takeoff scope to an available estimator to prevent submittal delays.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  {/* Select Project */}
                  <div>
                    <label className="block text-[10px] font-mono text-[#86948a] uppercase mb-1">
                      Project to Offload
                    </label>
                    <select
                      value={transferSelectedProjectId}
                      onChange={(e) => setTransferSelectedProjectId(e.target.value)}
                      className="w-full bg-[#171f33] border border-[#222a3d] rounded p-2 text-xs text-white focus:outline-none focus:border-[#adc6ff] cursor-pointer"
                    >
                      {rebalanceAllocations.map((a) => (
                        <option key={a.projectId} value={a.projectId}>
                          {a.projectTitle} ({a.hoursPerWeek}h)
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Select Target Estimator */}
                  <div>
                    <label className="block text-[10px] font-mono text-[#86948a] uppercase mb-1">
                      Target Colleague
                    </label>
                    <select
                      value={transferTargetEstimatorId}
                      onChange={(e) => setTransferTargetEstimatorId(e.target.value)}
                      className="w-full bg-[#171f33] border border-[#222a3d] rounded p-2 text-xs text-white focus:outline-none focus:border-[#adc6ff] cursor-pointer"
                    >
                      {estimators
                        .filter((e) => e.id !== rebalanceEstimator.id)
                        .map((e) => (
                          <option key={e.id} value={e.id}>
                            {e.name} ({e.capacityLoadPercent}% Load • {e.maxWeeklyHours || 40 - e.committedHours}h free)
                          </option>
                        ))}
                    </select>
                  </div>

                  {/* Hours to Transfer */}
                  <div>
                    <label className="block text-[10px] font-mono text-[#86948a] uppercase mb-1">
                      Hours to Shift
                    </label>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="1"
                        max="40"
                        value={transferHours}
                        onChange={(e) => setTransferHours(parseFloat(e.target.value) || 1)}
                        className="w-20 bg-[#171f33] border border-[#222a3d] text-white font-mono text-center p-2 rounded text-xs focus:outline-none focus:border-[#adc6ff]"
                      />
                      <button
                        type="button"
                        onClick={handleExecuteTransfer}
                        className="px-3 py-2 bg-[#adc6ff] hover:bg-[#dae2fd] text-[#0b1326] font-bold rounded text-xs flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Shift</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
              <button
                onClick={() => setRebalanceEstimator(null)}
                className="px-4 py-2 bg-[#171f33] hover:bg-[#222a3d] border border-[#222a3d] text-[#dae2fd] rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveRebalance}
                className="px-5 py-2 bg-[#4edea3] hover:bg-[#4edea3]/90 text-[#0b1326] font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              >
                <Check className="w-4 h-4" />
                <span>Save Allocation Adjustments</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Quick Coverage Assignment Modal */}
      {showAddCoverageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#4edea3]" />
                Assign Estimator to Active Project
              </h3>
              <button
                onClick={() => setShowAddCoverageModal(false)}
                className="text-[#86948a] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              {/* Select Estimator */}
              <div>
                <label className="block text-[10px] font-mono text-[#86948a] uppercase mb-1">
                  Select Available Estimator
                </label>
                <select
                  value={coverageEstimatorId}
                  onChange={(e) => setCoverageEstimatorId(e.target.value)}
                  className="w-full bg-[#0b1326] border border-[#222a3d] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#4edea3] cursor-pointer"
                >
                  <option value="">-- Choose Estimator --</option>
                  {estimators.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.capacityLoadPercent}% Load • {e.maxWeeklyHours || 40 - e.committedHours}h buffer)
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Project */}
              <div>
                <label className="block text-[10px] font-mono text-[#86948a] uppercase mb-1">
                  Select Active Project
                </label>
                <select
                  value={coverageProjectId}
                  onChange={(e) => setCoverageProjectId(e.target.value)}
                  className="w-full bg-[#0b1326] border border-[#222a3d] rounded p-2.5 text-xs text-white focus:outline-none focus:border-[#4edea3] cursor-pointer"
                >
                  <option value="">-- Choose Project --</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.id}: {p.title} (Due {p.targetDue})
                    </option>
                  ))}
                </select>
              </div>

              {/* Hours per Week */}
              <div>
                <label className="block text-[10px] font-mono text-[#86948a] uppercase mb-1">
                  Weekly Allocated Hours
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={coverageHours}
                    onChange={(e) => setCoverageHours(parseFloat(e.target.value) || 5)}
                    className="w-24 bg-[#0b1326] border border-[#222a3d] text-white font-mono text-center p-2 rounded text-xs focus:outline-none focus:border-[#4edea3]"
                  />
                  <span className="text-xs text-[#86948a] font-mono">hours / week commitment</span>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-[#222a3d] flex items-center justify-end gap-2 bg-[#0b1326]">
              <button
                onClick={() => setShowAddCoverageModal(false)}
                className="px-3 py-1.5 bg-[#171f33] hover:bg-[#222a3d] text-white rounded text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (!coverageEstimatorId || !coverageProjectId) {
                    onShowToast('Please select both an estimator and an active project.');
                    return;
                  }
                  const est = estimators.find((e) => e.id === coverageEstimatorId);
                  const prj = projects.find((p) => p.id === coverageProjectId);
                  if (!est || !prj) return;

                  const allocs = est.projectAllocations ? [...est.projectAllocations] : [];
                  const existingIdx = allocs.findIndex((a) => a.projectId === prj.id);
                  if (existingIdx >= 0) {
                    allocs[existingIdx].hoursPerWeek += coverageHours;
                  } else {
                    allocs.push({
                      projectId: prj.id,
                      projectTitle: prj.title,
                      hoursPerWeek: coverageHours,
                      roleOnProject: 'Coverage Estimator',
                    });
                  }
                  const newCommitted = allocs.reduce((acc, a) => acc + a.hoursPerWeek, 0);
                  const newPercent = Math.round((newCommitted / (est.maxWeeklyHours || 40)) * 100);

                  const updated = estimators.map((e) => {
                    if (e.id === est.id) {
                      return {
                        ...e,
                        committedHours: newCommitted,
                        capacityLoadPercent: newPercent,
                        projectAllocations: allocs,
                        activeAssignments: Array.from(new Set([...e.activeAssignments, prj.title])),
                      };
                    }
                    return e;
                  });

                  onUpdateEstimators(updated);
                  setShowAddCoverageModal(false);
                  onShowToast(`Assigned ${est.name} to ${prj.title} (${coverageHours}h/wk)`);
                }}
                className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#4edea3]/90 text-[#0b1326] font-bold rounded text-xs cursor-pointer"
              >
                Confirm Assignment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
