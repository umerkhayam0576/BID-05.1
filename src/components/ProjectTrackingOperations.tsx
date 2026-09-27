import React, { useState, useMemo } from 'react';
import {
  Download,
  Plus,
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCw,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Send,
  Flag,
  FileCheck2,
  Check,
  MoreVertical,
  ExternalLink,
  ChevronDown,
  Warehouse,
  Sparkles,
  RefreshCw,
  FileDown,
  Zap,
  Users,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ProjectTrackItem,
  EstimatorWorkloadItem,
  ArchivedDeliverableItem,
  MilestoneItem,
} from '../types';
import {
  INITIAL_PROJECT_TRACKS,
  INITIAL_ESTIMATOR_WORKLOAD,
  INITIAL_ARCHIVED_DELIVERABLES,
} from '../data/projectTrackingData';
import { ProjectInspectModal } from './ProjectInspectModal';
import { NewTakeoffPackageModal } from './NewTakeoffPackageModal';
import { EscalateRfiModal } from './EscalateRfiModal';
import { ResourceCapacityPlanningModule } from './ResourceCapacityPlanningModule';
import { NavTabId } from './Sidebar';
import { OutsourcedProjectModal, type OutsourcedProjectAssignment } from './OutsourcedProjectModal';
import { DeliveryPreviewModal } from './DeliveryPreviewModal';

interface ProjectTrackingOperationsProps {
  onOpenNewTakeoff?: () => void;
  onNavigateTab?: (tabId: NavTabId) => void;
  onOutsourcedAssignment?: (assignment: OutsourcedProjectAssignment) => void;
}

// Utility helper to compute deadline urgency badge, colors, and countdown
export const getDeadlineBadge = (project: ProjectTrackItem) => {
  if (project.status === 'DELIVERED') {
    return {
      label: 'Delivered',
      sublabel: 'Package Finalized',
      urgency: 'completed',
      badgeClass: 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30',
      icon: 'check',
      pulse: false,
    };
  }

  const days = project.daysRemaining !== undefined ? project.daysRemaining : 3;

  if (days < 0) {
    const overdueDays = Math.abs(days);
    return {
      label: overdueDays === 1 ? 'Overdue (1 day)' : `Overdue (${overdueDays} days)`,
      sublabel: 'Immediate GC Escalation',
      urgency: 'overdue',
      badgeClass: 'bg-[#93000a]/35 text-[#ffb4ab] border-[#ff7886]/50 shadow-[0_0_12px_rgba(255,120,134,0.25)]',
      icon: 'alert',
      pulse: true,
    };
  }

  if (days === 0) {
    return {
      label: 'Due Today',
      sublabel: 'Final sign-off today 5PM',
      urgency: 'today',
      badgeClass: 'bg-[#ba1a1a]/30 text-[#ffb4ab] border-[#ffb4ab]/50 shadow-[0_0_10px_rgba(255,180,171,0.2)]',
      icon: 'clock',
      pulse: true,
    };
  }

  if (days === 1) {
    return {
      label: '1 day left',
      sublabel: 'Target submittal tomorrow',
      urgency: '1d',
      badgeClass: 'bg-[#ffb356]/20 text-[#ffb356] border-[#ffb356]/40 shadow-[0_0_8px_rgba(255,179,86,0.2)]',
      icon: 'clock',
      pulse: true,
    };
  }

  if (days === 2) {
    return {
      label: '2 days left',
      sublabel: '48h milestone gating',
      urgency: '2d',
      badgeClass: 'bg-[#ffc966]/15 text-[#ffc966] border-[#ffc966]/35',
      icon: 'clock',
      pulse: false,
    };
  }

  if (days <= 5) {
    return {
      label: `${days} days left`,
      sublabel: 'Due this week',
      urgency: 'week',
      badgeClass: 'bg-[#adc6ff]/15 text-[#adc6ff] border-[#adc6ff]/30',
      icon: 'calendar',
      pulse: false,
    };
  }

  return {
    label: `${days} days left`,
    sublabel: 'On Track',
    urgency: 'normal',
    badgeClass: 'bg-[#171f33] text-[#bbcabf] border-[#222a3d]',
    icon: 'calendar',
    pulse: false,
  };
};

export const ProjectTrackingOperations: React.FC<ProjectTrackingOperationsProps> = ({
  onOpenNewTakeoff,
  onNavigateTab,
  onOutsourcedAssignment,
  }) => {
  // State
  const [projects, setProjects] = useState<ProjectTrackItem[]>(INITIAL_PROJECT_TRACKS);
  const [estimators, setEstimators] = useState<EstimatorWorkloadItem[]>(INITIAL_ESTIMATOR_WORKLOAD);
  const [archived, setArchived] = useState<ArchivedDeliverableItem[]>(INITIAL_ARCHIVED_DELIVERABLES);

  // Filters & Views
  const [filterTab, setFilterTab] = useState<
    'ALL' | 'OVERDUE' | 'DUE_48H' | 'THIS_WEEK' | 'TAKEOFF' | 'ARCHIVE' | 'AT_RISK'
  >('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'urgency' | 'due' | 'value' | 'progress' | 'hours' | 'title'>('urgency');
  const [viewMode, setViewMode] = useState<'grid' | 'ledger' | 'capacity'>('grid');

  // Modals & Drawers
  const [inspectingProject, setInspectingProject] = useState<ProjectTrackItem | null>(null);
  const [isNewPackageModalOpen, setIsNewPackageModalOpen] = useState(false);
  const [isOutsourcedModalOpen, setIsOutsourcedModalOpen] = useState(false);
  const [outsourcedAssignments, setOutsourcedAssignments] = useState<OutsourcedProjectAssignment[]>([]);
  const [escalateProject, setEscalateProject] = useState<ProjectTrackItem | null>(null);

  // Delivery Preview & Reversal State
  const [deliveryPreviewProject, setDeliveryPreviewProject] = useState<ProjectTrackItem | null>(null);
  const [deliveryPreviewArchived, setDeliveryPreviewArchived] = useState<ArchivedDeliverableItem | null>(null);
  const [isDeliveryPreviewDelivered, setIsDeliveryPreviewDelivered] = useState(false);

  // Toast / Feedback State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Urgency Counts
  const counts = useMemo(() => {
    const active = projects.filter((p) => p.status !== 'DELIVERED');
    const overdue = active.filter((p) => (p.daysRemaining ?? 0) < 0).length;
    const due48h = active.filter((p) => {
      const d = p.daysRemaining ?? 99;
      return d >= 0 && d <= 2;
    }).length;
    const thisWeek = active.filter((p) => {
      const d = p.daysRemaining ?? 99;
      return d > 2 && d <= 7;
    }).length;
    return { overdue, due48h, thisWeek, totalActive: active.length };
  }, [projects]);

  // Filtered & Sorted Projects
  const filteredProjects = useMemo(() => {
    let result = projects.filter((p) => {
      // Tab filter
      if (filterTab === 'OVERDUE') {
        if (p.status === 'DELIVERED') return false;
        if ((p.daysRemaining ?? 0) >= 0) return false;
      }
      if (filterTab === 'DUE_48H') {
        if (p.status === 'DELIVERED') return false;
        const d = p.daysRemaining ?? 99;
        if (d < 0 || d > 2) return false;
      }
      if (filterTab === 'THIS_WEEK') {
        if (p.status === 'DELIVERED') return false;
        const d = p.daysRemaining ?? 99;
        if (d <= 2 || d > 7) return false;
      }
      if (filterTab === 'TAKEOFF' && p.status !== 'ACTIVE_TAKEOFF') return false;
      if (filterTab === 'AT_RISK' && p.status !== 'CRITICAL_RFI_BLOCK') return false;
      if (filterTab === 'ARCHIVE' && p.status !== 'DELIVERED') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = p.title.toLowerCase().includes(q);
        const matchesGc = p.gc.toLowerCase().includes(q);
        const matchesScope = p.scopeType.toLowerCase().includes(q);
        const matchesId = p.id.toLowerCase().includes(q);
        const matchesTrade = p.qtoSpecs?.some((s) => s.toLowerCase().includes(q));
        const matchesEstimator = p.leadEstimators.some((e) => e.name.toLowerCase().includes(q));
        if (!matchesTitle && !matchesGc && !matchesScope && !matchesId && !matchesEstimator && !matchesTrade) {
          return false;
        }
      }
      return true;
    });

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === 'urgency') {
        // Overdue & lowest daysRemaining first
        const aDays = a.daysRemaining ?? 99;
        const bDays = b.daysRemaining ?? 99;
        return aDays - bDays;
      }
      if (sortBy === 'hours') {
        const aBurn = (a.totalHoursLogged || 0) / (a.budgetedHours || 160);
        const bBurn = (b.totalHoursLogged || 0) / (b.budgetedHours || 160);
        return bBurn - aBurn;
      }
      if (sortBy === 'value') return b.estimateValue - a.estimateValue;
      if (sortBy === 'progress') return b.completionPace - a.completionPace;
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      // default 'due'
      return a.targetDue.localeCompare(b.targetDue);
    });

    return result;
  }, [projects, filterTab, searchQuery, sortBy]);

  // Handlers
  const handleCreatePackage = (newProject: ProjectTrackItem) => {
    setProjects((prev) => [newProject, ...prev]);
    showToast(`Takeoff Package ${newProject.id} (${newProject.title}) successfully created!`);
  };

  const handleCreateOutsourcedAssignment = (assignment: OutsourcedProjectAssignment) => {
    setOutsourcedAssignments((current) => [assignment, ...current]);
    onOutsourcedAssignment?.(assignment);
    showToast(`${assignment.provider} assigned to ${assignment.project}. Approval workflow started.`);
  };

  const handleExtendDeadline = (projectId: string, extraDays: number) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const currentDays = p.daysRemaining ?? 1;
          const newDays = currentDays + extraDays;
          const newTarget =
            newDays < 0
              ? `Overdue (${Math.abs(newDays)} days)`
              : newDays === 0
              ? 'Today, 5:00 PM'
              : newDays === 1
              ? 'Tomorrow, 5:00 PM'
              : `In ${newDays} days (Extended +${extraDays}d)`;
          return {
            ...p,
            daysRemaining: newDays,
            targetDue: newTarget,
          };
        }
        return p;
      })
    );

    if (inspectingProject?.id === projectId) {
      setInspectingProject((prev) => {
        if (!prev) return null;
        const currentDays = prev.daysRemaining ?? 1;
        const newDays = currentDays + extraDays;
        return {
          ...prev,
          daysRemaining: newDays,
          targetDue:
            newDays < 0
              ? `Overdue (${Math.abs(newDays)} days)`
              : newDays === 0
              ? 'Today, 5:00 PM'
              : newDays === 1
              ? 'Tomorrow, 5:00 PM'
              : `In ${newDays} days (Extended +${extraDays}d)`,
        };
      });
    }

    showToast(`Extended deadline for ${projectId} by +${extraDays} day${extraDays > 1 ? 's' : ''} (GC Addendum logged).`);
  };

  const handleToggleMilestone = (projectId: string, milestoneId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;
    const ms = target.milestones.find((m) => m.id === milestoneId);
    if (!ms) return;

    const nextStatus: MilestoneItem['status'] =
      ms.status === 'complete'
        ? 'pending'
        : ms.status === 'in_progress'
        ? 'complete'
        : 'in_progress';

    handleUpdateMilestone(projectId, milestoneId, nextStatus);
  };

  const handleUpdateMilestone = (
    projectId: string,
    milestoneId: string,
    status: MilestoneItem['status']
  ) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          const updatedMilestones = p.milestones.map((m) =>
            m.id === milestoneId ? { ...m, status } : m
          );
          const completedCount = updatedMilestones.filter((m) => m.status === 'complete').length;
          const newPace = Math.min(
            100,
            Math.round((completedCount / updatedMilestones.length) * 100)
          );
          return {
            ...p,
            milestones: updatedMilestones,
            completionPace: newPace,
          };
        }
        return p;
      })
    );

    if (inspectingProject?.id === projectId) {
      setInspectingProject((prev) => {
        if (!prev) return null;
        const updatedMilestones = prev.milestones.map((m) =>
          m.id === milestoneId ? { ...m, status } : m
        );
        const completedCount = updatedMilestones.filter((m) => m.status === 'complete').length;
        const newPace = Math.min(
          100,
          Math.round((completedCount / updatedMilestones.length) * 100)
        );
        return {
          ...prev,
          milestones: updatedMilestones,
          completionPace: newPace,
        };
      });
    }

    showToast('Milestone progress updated in operational ledger.');
  };

  // Open delivery preview before actually delivering
  const handlePromptDeliveryPreview = (project: ProjectTrackItem) => {
    setDeliveryPreviewProject(project);
    setDeliveryPreviewArchived(null);
    setIsDeliveryPreviewDelivered(false);
  };

  const handleReleasePackage = (projectId: string) => {
    const target = projects.find((p) => p.id === projectId);
    if (!target) return;

    // Archive the project and preserve its original representation for seamless reversal
    const newArchived: ArchivedDeliverableItem = {
      id: `arch-${Date.now()}`,
      packageCode: `PKG-${target.id.replace('BID-2024-', 'DEL-')}`,
      packageName: target.title,
      scopeSummary: `Final Deliverable • ${target.scopeType}`,
      gc: target.gc,
      deliveredDate: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      contractValue: target.estimateValue,
      budgetStatus: '100% ON BUDGET',
      auditVerification: {
        status: 'Dual Sign-Off Cleared',
        signers: `Signed: ${target.leadEstimators.map((e) => e.name).join(' & ')}`,
      },
      fileSize: 'ZIP (94MB)',
      originalProject: target,
    };

    setArchived((prev) => [newArchived, ...prev]);
    setProjects((prev) => prev.filter((p) => p.id !== projectId));
    showToast(`Package "${target.title}" delivered & moved to Archive. (Reversible anytime)`);
  };

  // Reverse delivery: restore package back to active in-flight projects
  const handleReverseDelivery = (archivedId: string) => {
    const targetArchived = archived.find((a) => a.id === archivedId);
    if (!targetArchived) return;

    let restoredProject: ProjectTrackItem;

    if (targetArchived.originalProject) {
      restoredProject = { ...targetArchived.originalProject };
    } else {
      // Reconstruct project track item if original was not cached
      const reconstructedId = targetArchived.packageCode.includes('PKG-DEL-')
        ? targetArchived.packageCode.replace('PKG-DEL-', 'BID-2024-')
        : `BID-2024-${targetArchived.id.slice(-3)}`;

      restoredProject = {
        id: reconstructedId,
        title: targetArchived.packageName,
        gc: targetArchived.gc,
        scopeType: targetArchived.scopeSummary.replace('Final Deliverable • ', ''),
        status: 'QUALITY_AUDIT',
        statusLabel: 'Reversed from Delivery (Audit Recheck)',
        statusColor: '#4edea3',
        estimateValue: targetArchived.contractValue,
        completionPace: 98,
        targetDue: 'Reopened Submittal',
        daysRemaining: 1,
        budgetedHours: 160,
        priority: 'HIGH',
        paceStatus: 'Restored from Delivered',
        paceStatusType: 'info',
        milestones: [
          { id: 'm1', title: 'QTO Package Reopened', status: 'complete' },
          { id: 'm2', title: 'Contractor Delivery Hold', status: 'in_progress' },
        ],
        leadEstimators: [
          { name: 'Marcus Vance', initials: 'MV' },
          { name: 'David Chen', initials: 'DC' },
        ],
        leadRole: 'Lead Estimator',
        actionType: 'release',
        actionLabel: 'Release Package',
        totalHoursLogged: 155,
      };
    }

    setProjects((prev) => [restoredProject, ...prev]);
    setArchived((prev) => prev.filter((a) => a.id !== archivedId));
    showToast(`Delivery reversed! "${targetArchived.packageName}" is back in In-Flight projects.`);
  };

  const handlePreviewArchivedDelivery = (item: ArchivedDeliverableItem) => {
    setDeliveryPreviewArchived(item);
    setDeliveryPreviewProject(item.originalProject || null);
    setIsDeliveryPreviewDelivered(true);
  };

  const handleConfirmEscalation = (projectId: string, memo: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projectId) {
          return {
            ...p,
            paceStatus: 'Escalation Transmitted (24h SLA)',
            notice: {
              type: 'critical_hold',
              text: 'Escalation Transmitted to GC Chief Structural Engineer',
              subtext: 'Awaiting urgent clearance. SLA timer active.',
            },
          };
        }
        return p;
      })
    );
    showToast(`Urgent RFI Escalation notice dispatched to General Contractor for ${projectId}.`);
  };

  const handleDownloadZip = (item: ArchivedDeliverableItem) => {
    showToast(`Downloading secure deliverable: ${item.packageCode} (${item.packageName})...`);
    setTimeout(() => {
      showToast(`Download complete: ${item.packageCode} archive verified.`);
    }, 1200);
  };

  const handleExportDeliveryReport = () => {
    const reportData = {
      generatedAt: new Date().toISOString(),
      activeInFlightCount: projects.length,
      totalActiveValue: projects.reduce((acc, p) => acc + p.estimateValue, 0),
      deliveredCount: archived.length,
      deliveredValue: archived.reduce((acc, a) => acc + a.contractValue, 0),
      projects: projects.map((p) => ({
        id: p.id,
        title: p.title,
        gc: p.gc,
        scope: p.scopeType,
        value: p.estimateValue,
        completionPace: p.completionPace,
        targetDue: p.targetDue,
        status: p.statusLabel,
      })),
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BidExact_Delivery_Operations_Report_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Delivery operations report downloaded successfully.');
  };

  return (
    <div className="flex flex-col w-full pb-16 space-y-6">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-18 right-6 z-50 bg-[#131b2e] border border-[#4edea3]/40 text-white px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2.5 text-xs font-mono"
          >
            <CheckCircle2 className="w-4 h-4 text-[#4edea3]" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Page Header & Executive Controls */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-4">
        <div className="flex flex-col gap-1 max-w-3xl">
          <div className="flex items-center gap-2 flex-wrap text-[10px] font-mono tracking-widest uppercase">
            <span className="text-[#4edea3] flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] animate-ping" />
              OPERATIONS LEDGER
            </span>
            <span className="text-[#3c4a42]">•</span>
            <span className="text-[#86948a]">LIVE PRODUCTION QUEUE</span>
            <span className="text-[#3c4a42]">•</span>
            <span className="text-[#adc6ff]">ISO 9001:2015 VERIFIED</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Project Tracking & Delivery Operations
          </h1>
          <p className="text-sm text-[#86948a] mt-0.5">
            Real-time construction takeoff progress, personnel allocation, package delivery lifecycle, and client milestones.
          </p>
        </div>

        {/* Top Header Buttons */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            onClick={handleExportDeliveryReport}
            id="btn-export-delivery-report"
            className="h-10 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] text-[#dae2fd] hover:text-white rounded-lg text-xs font-semibold flex items-center gap-2 transition-all shadow-sm cursor-pointer"
          >
            <FileDown className="w-4 h-4 text-[#adc6ff]" />
            <span>Export Delivery Report</span>
          </button>

          <button
            onClick={() => setIsNewPackageModalOpen(true)}
            id="btn-new-takeoff-package"
            className="h-10 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-lg text-xs font-bold flex items-center gap-2 transition-all shadow-md cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
  <span>+ New Takeoff Package</span>
  </button>
  <button onClick={() => setIsOutsourcedModalOpen(true)} className="h-10 px-4 border border-[#ffb356]/50 bg-[#ffb356]/10 hover:bg-[#ffb356]/20 text-[#ffd18a] rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer">
  <Users className="w-4 h-4" />
  <span>Outsource Project</span>
  </button>
        </div>
      </div>

      {/* KPI / Executive Metric Cards Bar (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active In-Flight */}
        <div
          onClick={() => setFilterTab('ALL')}
          className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4 shadow-sm relative overflow-hidden group hover:border-[#4edea3]/40 transition-colors cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#4edea3]" />
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] text-[#86948a] uppercase tracking-wider font-semibold">
              Active In-Flight
            </span>
            <span className="px-1.5 py-0.5 bg-[#4edea3]/10 text-[#4edea3] font-mono text-[10px] rounded font-bold">
              LIVE PACE
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-white">
              {projects.length} Active
            </span>
            <span className="text-xs font-mono font-bold text-[#4edea3] flex items-center">
              ↑ 91.4%
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#86948a] font-mono">
            <span>$3,420,000 Contract</span>
            <span className="text-[#86948a]">Pace: Stable</span>
          </div>
        </div>

        {/* Card 2: Urgency Radar (Overdue & 48h Submittals) */}
        <div
          onClick={() => setFilterTab(counts.overdue > 0 ? 'OVERDUE' : 'DUE_48H')}
          className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4 shadow-sm relative overflow-hidden group hover:border-[#ffb356]/40 transition-colors cursor-pointer"
        >
          <div className={`absolute top-0 left-0 right-0 h-0.5 ${counts.overdue > 0 ? 'bg-[#ff7886]' : 'bg-[#ffb356]'}`} />
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] text-[#86948a] uppercase tracking-wider font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#ffb356]" />
              Urgency Radar
            </span>
            <span className={`px-1.5 py-0.5 font-mono text-[10px] rounded font-bold ${
              counts.overdue > 0 ? 'bg-[#93000a]/30 text-[#ffb4ab]' : 'bg-[#ffb356]/15 text-[#ffb356]'
            }`}>
              {counts.overdue > 0 ? `${counts.overdue} OVERDUE` : 'ON SCHEDULE'}
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-white">
              {counts.due48h} in 48h
            </span>
            <span className="text-xs font-mono font-bold text-[#ffb356] flex items-center gap-1">
              ⚡ 1-2d Left
            </span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#86948a] font-mono">
            <span className={counts.overdue > 0 ? 'text-[#ffb4ab] font-bold' : ''}>
              {counts.overdue} Overdue Submittals
            </span>
            <span className="text-[#adc6ff]">{counts.thisWeek} This Week</span>
          </div>
        </div>

        {/* Card 3: Personnel Deployed */}
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#10b981]" />
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] text-[#86948a] uppercase tracking-wider font-semibold">
              Personnel Deployed
            </span>
            <span className="px-1.5 py-0.5 bg-[#4edea3]/10 text-[#4edea3] font-mono text-[10px] rounded font-bold">
              100% CAP
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-white">14 / 14</span>
            <span className="text-xs font-mono text-[#4edea3]">Assigned</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#86948a] font-mono">
            <span>Capacity: Saturated</span>
            <span className="text-[#86948a]">0h bench downtime</span>
          </div>
        </div>

        {/* Card 4: Gating RFIs */}
        <div
          onClick={() => setFilterTab('AT_RISK')}
          className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4 shadow-sm relative overflow-hidden group hover:border-[#ff7886]/40 transition-colors cursor-pointer"
        >
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-[#ff7886]" />
          <div className="flex items-center justify-between mb-1.5">
            <span className="font-mono text-[10px] text-[#86948a] uppercase tracking-wider font-semibold">
              Gating RFIs
            </span>
            <span className="px-1.5 py-0.5 bg-[#93000a]/30 text-[#ffb4ab] font-mono text-[10px] rounded flex items-center gap-1 font-bold">
              <Flag className="w-3 h-3 text-[#ff7886]" />
              <span>3 Pending</span>
            </span>
          </div>
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-bold font-mono text-[#ffb4ab]">3 Critical</span>
            <span className="text-xs text-[#86948a]">Hold Points</span>
          </div>
          <div className="flex items-center justify-between text-xs text-[#86948a] font-mono">
            <span>Est. Value Gated</span>
            <span className="text-[#ffb4ab] font-bold">$83,400 Hold</span>
          </div>
        </div>
      </div>

      {/* Filter & Segmentation Bar */}
      <div className="bg-[#131b2e] border border-[#222a3d] p-2 rounded-lg flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 shadow-sm">
        {/* Pipeline & Urgency Filter Tabs */}
        <div className="flex items-center overflow-x-auto gap-1">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-[#222a3d] text-[#4edea3] shadow-sm'
                : 'text-[#86948a] hover:bg-[#171f33] hover:text-[#dae2fd]'
            }`}
          >
            <span>All Active</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 bg-[#4edea3]/20 text-[#4edea3] rounded font-bold">
              {counts.totalActive}
            </span>
          </button>

          {/* Overdue Quick Filter */}
          <button
            onClick={() => setFilterTab('OVERDUE')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              filterTab === 'OVERDUE'
                ? 'bg-[#93000a]/30 border border-[#ff7886]/50 text-[#ffdad6] shadow-sm'
                : 'text-[#86948a] hover:bg-[#171f33] hover:text-[#ffb4ab]'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff7886] animate-pulse" />
            <span>Overdue</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 bg-[#93000a]/40 text-[#ffb4ab] rounded font-bold">
              {counts.overdue}
            </span>
          </button>

          {/* 1-2 Days Left Quick Filter */}
          <button
            onClick={() => setFilterTab('DUE_48H')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              filterTab === 'DUE_48H'
                ? 'bg-[#ffb356]/20 border border-[#ffb356]/50 text-[#ffb356] shadow-sm'
                : 'text-[#86948a] hover:bg-[#171f33] hover:text-[#ffb356]'
            }`}
          >
            <Clock className="w-3 h-3 text-[#ffb356]" />
            <span>1-2 Days Left</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 bg-[#ffb356]/20 text-[#ffb356] rounded font-bold">
              {counts.due48h}
            </span>
          </button>

          {/* This Week Quick Filter */}
          <button
            onClick={() => setFilterTab('THIS_WEEK')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
              filterTab === 'THIS_WEEK'
                ? 'bg-[#adc6ff]/20 border border-[#adc6ff]/40 text-[#adc6ff] shadow-sm'
                : 'text-[#86948a] hover:bg-[#171f33] hover:text-[#adc6ff]'
            }`}
          >
            <Calendar className="w-3 h-3 text-[#adc6ff]" />
            <span>Due This Week</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 bg-[#adc6ff]/20 text-[#adc6ff] rounded font-bold">
              {counts.thisWeek}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('TAKEOFF')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              filterTab === 'TAKEOFF'
                ? 'bg-[#222a3d] text-[#4edea3] shadow-sm'
                : 'text-[#86948a] hover:bg-[#171f33] hover:text-[#dae2fd]'
            }`}
          >
            <span>Takeoff</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 bg-[#2d3449] text-[#dae2fd] rounded">
              {projects.filter((p) => p.status === 'ACTIVE_TAKEOFF').length}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('AT_RISK')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              filterTab === 'AT_RISK'
                ? 'bg-[#93000a]/20 border border-[#ff7886]/40 text-[#ffdad6] shadow-sm'
                : 'text-[#86948a] hover:bg-[#171f33] hover:text-[#ffb4ab]'
            }`}
          >
            <Flag className="w-3 h-3 text-[#ff7886]" />
            <span>At-Risk RFIs</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 bg-[#93000a]/30 text-[#ffb4ab] rounded font-bold">
              {projects.filter((p) => p.status === 'CRITICAL_RFI_BLOCK').length}
            </span>
          </button>

          <button
            onClick={() => setFilterTab('ARCHIVE')}
            className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-2 shrink-0 transition-all cursor-pointer ${
              filterTab === 'ARCHIVE'
                ? 'bg-[#222a3d] text-[#4edea3] shadow-sm'
                : 'text-[#86948a] hover:bg-[#171f33] hover:text-[#dae2fd]'
            }`}
          >
            <span>Delivered Archive</span>
            <span className="font-mono text-[11px] px-1.5 py-0.2 bg-[#2d3449] text-[#dae2fd] rounded">
              {archived.length}
            </span>
          </button>
        </div>

        {/* Right Controls: Search, Sort, View Switches */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-[#86948a]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter project, GC or trade..."
              className="bg-[#0b1326] h-8 pl-8 pr-3 text-xs text-white rounded-md placeholder:text-[#86948a] border border-[#222a3d] focus:outline-none focus:border-[#4edea3] w-44 lg:w-56"
            />
          </div>

          <div className="h-5 w-px bg-[#222a3d] mx-0.5" />

          {/* Sort Selector */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-8 pl-2 pr-6 bg-[#0b1326] text-[#dae2fd] text-xs font-mono rounded-md border border-[#222a3d] focus:outline-none focus:border-[#4edea3] cursor-pointer"
            >
              <option value="urgency">⚡ Sort: Deadline Urgency (Most Urgent)</option>
              <option value="due">📅 Sort: Target Due Date</option>
              <option value="hours">⏱️ Sort: Hours Burn Rate</option>
              <option value="value">💰 Sort: Scope Value</option>
              <option value="progress">📊 Sort: Completion Pace</option>
              <option value="title">🔤 Sort: Project Name</option>
            </select>
          </div>

          {/* View Toggle */}
          <div className="flex bg-[#0b1326] p-0.5 rounded-md border border-[#222a3d] items-center">
            <button
              onClick={() => setViewMode('grid')}
              title="Card View"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#222a3d] text-[#4edea3]'
                  : 'text-[#86948a] hover:text-[#dae2fd]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('ledger')}
              title="Spreadsheet Ledger View"
              className={`p-1.5 rounded transition-colors cursor-pointer ${
                viewMode === 'ledger'
                  ? 'bg-[#222a3d] text-[#4edea3]'
                  : 'text-[#86948a] hover:text-[#dae2fd]'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('capacity')}
              title="Resource Capacity Planning & Timeline Matrix"
              className={`px-2 py-1 flex items-center gap-1.5 rounded transition-colors text-xs font-semibold cursor-pointer ${
                viewMode === 'capacity'
                  ? 'bg-[#222a3d] text-[#4edea3]'
                  : 'text-[#86948a] hover:text-[#dae2fd]'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#4edea3]" />
              <span className="hidden sm:inline">Capacity Plan</span>
            </button>
          </div>
        </div>
      </div>

      {outsourcedAssignments.length > 0 && <div className="mb-5 rounded-lg border border-[#ffb356]/30 bg-[#171f33] p-4">
        <div className="mb-3 flex items-center justify-between"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#ffb356]">External delivery assignments</p><h3 className="mt-1 text-sm font-semibold text-[#f3f5ff]">Projects supported by outsourced teams</h3></div><span className="rounded-full bg-[#ffb356]/15 px-2 py-1 font-mono text-[10px] text-[#ffd18a]">{outsourcedAssignments.length} active</span></div>
        <div className="grid gap-3 lg:grid-cols-2">{outsourcedAssignments.map((assignment) => <div key={assignment.id} className="rounded-md border border-[#29334a] bg-[#10182a] p-3"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-semibold text-[#eef2ff]">{assignment.project}</p><p className="mt-1 text-xs text-[#9da9c5]">{assignment.provider} · {assignment.paymentModel}</p></div><span className="rounded border border-[#ffb356]/30 px-2 py-1 text-[10px] text-[#ffd18a]">{assignment.status}</span></div><p className="mt-3 line-clamp-2 text-xs text-[#b5c0d8]">{assignment.scope}</p><div className="mt-3 flex justify-between font-mono text-[10px] text-[#7785a5]"><span>{assignment.startDate} → {assignment.dueDate}</span><span className="text-[#4edea3]">${assignment.budget.toLocaleString()}</span></div></div>)}</div>
      </div>}

      {/* Active Projects Bento / Grid / Capacity Planning Display */}
      {viewMode === 'capacity' ? (
        <div className="mb-4">
          <ResourceCapacityPlanningModule
            projects={projects}
            estimators={estimators}
            onUpdateEstimators={(updated) => setEstimators(updated)}
            onInspectProject={(p) => setInspectingProject(p)}
            onShowToast={showToast}
          />
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-4">
          <AnimatePresence>
            {filteredProjects.map((project) => {
              const deadline = getDeadlineBadge(project);
              const budgetedHours = project.budgetedHours || 160;
              const loggedHours = project.totalHoursLogged || 0;
              const burnRate = Math.round((loggedHours / budgetedHours) * 100);

              const borderColor =
                project.status === 'CRITICAL_RFI_BLOCK'
                  ? 'bg-[#ff7886]'
                  : project.status === 'BIM_MODELING'
                  ? 'bg-[#adc6ff]'
                  : 'bg-[#4edea3]';

              const barColor =
                project.status === 'CRITICAL_RFI_BLOCK'
                  ? 'bg-[#ff7886]'
                  : project.status === 'BIM_MODELING'
                  ? 'bg-[#adc6ff]'
                  : 'bg-[#4edea3]';

              return (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 shadow-sm flex flex-col justify-between relative overflow-hidden hover:border-[#3c4a42] transition-all group"
                >
                  {/* Left Edge Accent Strip */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1 ${borderColor}`} />

                  <div>
                    {/* Card Top Bar */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="px-2 py-0.5 bg-[#0b1326] font-mono text-[10px] text-[#86948a] uppercase tracking-wider rounded border border-[#222a3d]">
                            {project.id}
                          </span>
                          <span
                            className={`font-mono text-[10px] font-bold flex items-center gap-1 ${
                              project.status === 'CRITICAL_RFI_BLOCK'
                                ? 'text-[#ffb4ab]'
                                : project.status === 'BIM_MODELING'
                                ? 'text-[#adc6ff]'
                                : 'text-[#4edea3]'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                project.status === 'CRITICAL_RFI_BLOCK'
                                  ? 'bg-[#ff7886] animate-pulse'
                                  : project.status === 'BIM_MODELING'
                                  ? 'bg-[#adc6ff]'
                                  : 'bg-[#4edea3]'
                              }`}
                            />
                            {project.statusLabel}
                          </span>

                          {/* Priority Badge */}
                          {project.priority && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase ${
                                project.priority === 'CRITICAL'
                                  ? 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#ff7886]/40'
                                  : project.priority === 'HIGH'
                                  ? 'bg-[#ffb356]/20 text-[#ffb356] border border-[#ffb356]/30'
                                  : 'bg-[#222a3d] text-[#86948a]'
                              }`}
                            >
                              {project.priority} PRIORITY
                            </span>
                          )}
                        </div>

                        <h2 className="text-xl font-semibold tracking-tight text-white group-hover:text-[#4edea3] transition-colors">
                          {project.title}
                        </h2>

                        <div className="flex items-center gap-1.5 text-xs text-[#86948a] mt-0.5">
                          <Building2 className="w-3.5 h-3.5 text-[#86948a]" />
                          <span className="text-[#dae2fd] font-medium">{project.gc}</span>
                          <span>•</span>
                          <span className="font-mono text-[#adc6ff]">{project.scopeType}</span>
                        </div>
                      </div>

                      {/* Right: Estimate Value & Prominent Countdown Pill */}
                      <div className="flex flex-col items-end gap-1.5">
                        <span className="font-mono text-lg font-bold text-white">
                          ${project.estimateValue.toLocaleString()}
                        </span>

                        {/* Prominent Urgency / Countdown Pill */}
                        <div
                          className={`px-2.5 py-1 rounded-md text-xs font-mono font-bold flex items-center gap-1.5 border transition-all ${deadline.badgeClass}`}
                        >
                          {deadline.urgency === 'overdue' ? (
                            <AlertTriangle className="w-3.5 h-3.5 text-[#ff7886] shrink-0" />
                          ) : deadline.urgency === 'today' || deadline.urgency === '1d' || deadline.urgency === '2d' ? (
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                          ) : deadline.urgency === 'completed' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] shrink-0" />
                          ) : (
                            <Calendar className="w-3.5 h-3.5 text-[#adc6ff] shrink-0" />
                          )}
                          <span>{deadline.label}</span>
                        </div>
                      </div>
                    </div>

                    {/* Progress Metrics & Bar */}
                    <div className="bg-[#0b1326] p-3 rounded-lg border border-[#222a3d]/80 mb-3.5">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-mono text-[10px] text-[#86948a] uppercase tracking-wider font-semibold">
                          DELIVERY COMPLETION PACE
                        </span>
                        <div className="flex items-center gap-1 font-mono text-xs">
                          <span
                            className={`font-bold ${
                              project.status === 'CRITICAL_RFI_BLOCK'
                                ? 'text-[#ffb4ab]'
                                : project.status === 'BIM_MODELING'
                                ? 'text-[#adc6ff]'
                                : 'text-[#4edea3]'
                            }`}
                          >
                            {project.completionPace}%
                          </span>
                          <span className="text-[#86948a]">/ 100%</span>
                        </div>
                      </div>

                      <div className="w-full h-2 bg-[#171f33] rounded-full overflow-hidden flex">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${project.completionPace}%` }}
                        />
                      </div>

                      {/* Target Due, Countdown & Quick Extend Buttons */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mt-2.5 pt-2 border-t border-[#222a3d]/50 text-xs text-[#86948a]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="flex items-center gap-1 text-white font-medium">
                            <Calendar className="w-3.5 h-3.5 text-[#adc6ff]" />
                            <span>Target: {project.targetDue}</span>
                          </span>

                          <span className="text-[#3c4a42] hidden sm:inline">•</span>

                          <span
                            className={`font-medium flex items-center gap-1 text-xs ${
                              project.status === 'CRITICAL_RFI_BLOCK'
                                ? 'text-[#ffb4ab]'
                                : project.status === 'BIM_MODELING'
                                ? 'text-[#adc6ff]'
                                : 'text-[#4edea3]'
                            }`}
                          >
                            {project.status === 'CRITICAL_RFI_BLOCK' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-[#ff7886]" />
                            ) : (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            )}
                            {project.paceStatus}
                          </span>
                        </div>

                        {/* Quick Deadline Extend Buttons */}
                        {project.status !== 'DELIVERED' && (
                          <div className="flex items-center gap-1 font-mono text-[10px] self-end sm:self-auto">
                            <span className="text-[#86948a]">Addendum:</span>
                            <button
                              type="button"
                              onClick={() => handleExtendDeadline(project.id, 1)}
                              title="Extend deadline by 1 day"
                              className="px-1.5 py-0.5 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] text-[#dae2fd] hover:text-[#4edea3] transition-colors cursor-pointer"
                            >
                              +1d
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExtendDeadline(project.id, 3)}
                              title="Extend deadline by 3 days"
                              className="px-1.5 py-0.5 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] text-[#dae2fd] hover:text-[#4edea3] transition-colors cursor-pointer"
                            >
                              +3d
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExtendDeadline(project.id, 7)}
                              title="Extend deadline by 7 days (Addendum)"
                              className="px-1.5 py-0.5 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] text-[#dae2fd] hover:text-[#4edea3] transition-colors cursor-pointer"
                            >
                              +7d Addendum
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Estimator Hours Burn Rate Tracker */}
                      <div className="mt-2.5 pt-2 border-t border-[#222a3d]/50 flex flex-col gap-1">
                        <div className="flex items-center justify-between text-[10px] font-mono text-[#86948a]">
                          <span>ESTIMATOR HOURS BURN RATE</span>
                          <span className="text-white font-medium">
                            {loggedHours}h logged / {budgetedHours}h budget
                            <span
                              className={`ml-1.5 font-bold ${
                                burnRate > 100
                                  ? 'text-[#ffb4ab]'
                                  : burnRate > 85
                                  ? 'text-[#ffb356]'
                                  : 'text-[#4edea3]'
                              }`}
                            >
                              ({burnRate}%)
                            </span>
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-[#171f33] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              burnRate > 100
                                ? 'bg-[#ff7886]'
                                : burnRate > 85
                                ? 'bg-[#ffb356]'
                                : 'bg-[#4edea3]'
                            }`}
                            style={{ width: `${Math.min(100, burnRate)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Milestones Breakdown with Click-to-Toggle */}
                    <div className="space-y-1.5 mb-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-[#86948a] uppercase tracking-wider block">
                          Package Milestones
                        </span>
                        <span className="text-[10px] text-[#86948a] font-mono">
                          Click milestone to cycle status
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {project.milestones.map((m) => (
                          <div
                            key={m.id}
                            onClick={() => handleToggleMilestone(project.id, m.id)}
                            title="Click to toggle status: Complete ➔ Pending ➔ In Progress"
                            className="bg-[#0b1326] hover:bg-[#171f33] p-2 rounded border border-[#222a3d] hover:border-[#4edea3]/50 flex items-center gap-2 text-xs transition-all cursor-pointer group/ms"
                          >
                            {m.status === 'complete' ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-[#4edea3] shrink-0 group-hover/ms:scale-110 transition-transform" />
                            ) : m.status === 'in_progress' ? (
                              <RotateCw className="w-3.5 h-3.5 text-[#adc6ff] animate-spin shrink-0" />
                            ) : (
                              <Clock className="w-3.5 h-3.5 text-[#ff7886] shrink-0 group-hover/ms:scale-110 transition-transform" />
                            )}
                            <span
                              className={`truncate text-xs ${
                                m.status === 'complete'
                                  ? 'text-white'
                                  : m.status === 'in_progress'
                                  ? 'text-[#adc6ff]'
                                  : 'text-[#ffb4ab]'
                              }`}
                            >
                              {m.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* CSI MasterFormat Trade Tags */}
                    {project.qtoSpecs && project.qtoSpecs.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        <span className="text-[10px] font-mono text-[#86948a]">Trades:</span>
                        {project.qtoSpecs.map((spec, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => setSearchQuery(spec.split(' ')[1] || spec)}
                            title={`Filter projects for ${spec}`}
                            className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] hover:border-[#adc6ff]/50 text-[#adc6ff] transition-colors cursor-pointer"
                          >
                            #{spec}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Notice or Alert Box */}
                    {project.notice && (
                      <div
                        className={`p-2.5 rounded-lg border flex items-center justify-between mb-3.5 text-xs ${
                          project.notice.type === 'critical_hold'
                            ? 'bg-[#93000a]/20 border-[#ff7886]/30 text-[#ffdad6] flex-col items-start gap-1'
                            : project.notice.type === 'linked_rfi'
                            ? 'bg-[#4edea3]/10 border-[#4edea3]/20 text-white'
                            : 'bg-[#0b1326] border-[#222a3d] text-[#dae2fd]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {project.notice.type === 'critical_hold' ? (
                            <AlertTriangle className="w-4 h-4 text-[#ff7886] shrink-0" />
                          ) : (
                            <ShieldCheck className="w-4 h-4 text-[#4edea3] shrink-0" />
                          )}
                          <span className="font-medium">{project.notice.text}</span>
                        </div>
                        {project.notice.subtext && (
                          <span className="font-mono text-[10px] text-[#86948a] self-end sm:self-auto">
                            {project.notice.subtext}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Card Footer: Estimator Avatars & Call to Action */}
                  <div className="pt-3 border-t border-[#222a3d] flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex -space-x-2 overflow-hidden">
                        {project.leadEstimators.map((est, idx) => (
                          <div key={idx} className="relative">
                            {est.avatarUrl ? (
                              <img
                                src={est.avatarUrl}
                                alt={est.name}
                                className="w-7 h-7 rounded-full object-cover border-2 border-[#131b2e]"
                              />
                            ) : (
                              <div
                                className="w-7 h-7 rounded-full border-2 border-[#131b2e] flex items-center justify-center font-mono text-[10px] font-bold text-white"
                                style={{ backgroundColor: est.avatarColor || '#0566d9' }}
                              >
                                {est.initials}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      <div className="flex flex-col">
                        <span className="text-xs text-white font-medium leading-none">
                          {project.leadEstimators.map((e) => e.name).join(', ')}
                        </span>
                        <span className="font-mono text-[10px] text-[#86948a] mt-0.5">
                          {project.leadRole}
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    {project.actionType === 'escalate' ? (
                      <button
                        onClick={() => setEscalateProject(project)}
                        className="px-3 py-1.5 bg-[#ff7886]/20 hover:bg-[#ff7886]/30 border border-[#ff7886]/40 text-[#ffdad6] rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Escalate RFI !</span>
                        <AlertTriangle className="w-3.5 h-3.5 text-[#ff7886]" />
                      </button>
                    ) : project.actionType === 'release' ? (
                      <button
                        onClick={() => handlePromptDeliveryPreview(project)}
                        title="Review package deliverables before delivering"
                        className="px-3.5 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Review & Release</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setInspectingProject(project)}
                        className="px-3 py-1.5 bg-[#0b1326] hover:bg-[#171f33] border border-[#222a3d] text-[#dae2fd] hover:text-white rounded text-xs font-medium flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <span>Inspect Log</span>
                        <ArrowRight className="w-3.5 h-3.5 text-[#86948a]" />
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {filteredProjects.length === 0 && (
            <div className="col-span-2 p-12 text-center bg-[#131b2e] border border-[#222a3d] rounded-lg">
              <Layers className="w-8 h-8 text-[#86948a] mx-auto mb-2 opacity-50" />
              <p className="text-sm text-white font-medium">No projects found matching filter</p>
              <p className="text-xs text-[#86948a] mt-1">Try resetting the search or filter tab.</p>
              <button
                onClick={() => {
                  setFilterTab('ALL');
                  setSearchQuery('');
                }}
                className="mt-3 px-3 py-1.5 bg-[#222a3d] hover:bg-[#2d3449] text-xs font-mono text-[#4edea3] rounded"
              >
                Reset Filters
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Spreadsheet Ledger View */
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden shadow-sm mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-[#0b1326] border-b border-[#222a3d] font-mono text-[10px] text-[#86948a] uppercase tracking-wider">
                  <th className="py-3 px-4">BID Code & Project</th>
                  <th className="py-3 px-4">General Contractor</th>
                  <th className="py-3 px-4">Scope Value</th>
                  <th className="py-3 px-4">Completion Pace</th>
                  <th className="py-3 px-4">Target Due & Status</th>
                  <th className="py-3 px-4">Assigned Team</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222a3d]">
                {filteredProjects.map((p) => {
                  const deadline = getDeadlineBadge(p);
                  const budgetedHours = p.budgetedHours || 160;
                  const loggedHours = p.totalHoursLogged || 0;
                  const burnRate = Math.round((loggedHours / budgetedHours) * 100);

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setInspectingProject(p)}
                      className="hover:bg-[#171f33] transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="font-mono text-[11px] font-bold text-[#4edea3]">
                            {p.id}
                          </span>
                          {p.priority && (
                            <span
                              className={`px-1.5 py-0.2 rounded text-[9px] font-mono font-bold tracking-wider uppercase ${
                                p.priority === 'CRITICAL'
                                  ? 'bg-[#93000a]/40 text-[#ffb4ab] border border-[#ff7886]/40'
                                  : p.priority === 'HIGH'
                                  ? 'bg-[#ffb356]/20 text-[#ffb356] border border-[#ffb356]/30'
                                  : 'bg-[#222a3d] text-[#86948a]'
                              }`}
                            >
                              {p.priority}
                            </span>
                          )}
                        </div>
                        <div className="font-semibold text-white text-sm">{p.title}</div>
                        <div className="text-[11px] text-[#86948a]">{p.scopeType}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-medium text-white">{p.gc}</div>
                        <span className="text-[10px] font-mono text-[#adc6ff]">
                          {p.statusLabel}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-mono font-bold text-white text-sm">
                          ${p.estimateValue.toLocaleString()}
                        </div>
                        <div className="text-[10px] font-mono text-[#86948a] mt-0.5">
                          {loggedHours}h / {budgetedHours}h ({burnRate}%)
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-1.5 bg-[#0b1326] rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                p.status === 'CRITICAL_RFI_BLOCK'
                                  ? 'bg-[#ff7886]'
                                  : 'bg-[#4edea3]'
                              }`}
                              style={{ width: `${p.completionPace}%` }}
                            />
                          </div>
                          <span className="font-mono font-bold text-white">
                            {p.completionPace}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {/* Prominent Urgency / Countdown Badge */}
                        <div
                          className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold inline-flex items-center gap-1 border mb-1 ${deadline.badgeClass}`}
                        >
                          {deadline.urgency === 'overdue' ? (
                            <AlertTriangle className="w-3 h-3 text-[#ff7886] shrink-0" />
                          ) : deadline.urgency === 'today' || deadline.urgency === '1d' || deadline.urgency === '2d' ? (
                            <Clock className="w-3 h-3 shrink-0" />
                          ) : (
                            <Calendar className="w-3 h-3 text-[#adc6ff] shrink-0" />
                          )}
                          <span>{deadline.label}</span>
                        </div>

                        <div className="font-medium text-white text-xs">{p.targetDue}</div>

                        {/* Quick Extend Buttons in Ledger */}
                        {p.status !== 'DELIVERED' && (
                          <div
                            className="flex items-center gap-1 font-mono text-[9px] mt-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              type="button"
                              onClick={() => handleExtendDeadline(p.id, 1)}
                              title="Extend by 1 day"
                              className="px-1.5 py-0.5 rounded bg-[#0b1326] hover:bg-[#222a3d] border border-[#222a3d] text-[#dae2fd] hover:text-[#4edea3] transition-colors"
                            >
                              +1d
                            </button>
                            <button
                              type="button"
                              onClick={() => handleExtendDeadline(p.id, 7)}
                              title="Extend by 7 days (Addendum)"
                              className="px-1.5 py-0.5 rounded bg-[#0b1326] hover:bg-[#222a3d] border border-[#222a3d] text-[#dae2fd] hover:text-[#4edea3] transition-colors"
                            >
                              +7d
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-white font-medium">
                          {p.leadEstimators.map((e) => e.name).join(', ')}
                        </div>
                        <div className="text-[10px] text-[#86948a] font-mono">{p.leadRole}</div>
                      </td>
                      <td className="py-3 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          {p.actionType === 'release' && (
                            <button
                              onClick={() => handlePromptDeliveryPreview(p)}
                              title="Review & deliver package"
                              className="px-2 py-1 bg-[#4edea3]/20 hover:bg-[#4edea3]/30 border border-[#4edea3]/40 text-[#4edea3] rounded text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Release</span>
                            </button>
                          )}
                          <button
                            onClick={() => setInspectingProject(p)}
                            className="px-2.5 py-1 bg-[#0b1326] hover:bg-[#222a3d] border border-[#222a3d] text-white rounded text-xs cursor-pointer"
                          >
                            Inspect
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Resource Capacity Planning Module (When in grid or ledger mode, displayed inline here) */}
      {viewMode !== 'capacity' && (
        <ResourceCapacityPlanningModule
          projects={projects}
          estimators={estimators}
          onUpdateEstimators={(updated) => setEstimators(updated)}
          onInspectProject={(p) => setInspectingProject(p)}
          onShowToast={showToast}
        />
      )}

      {/* Delivered & Audit-Cleared Packages Archive Section */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#0b1326] text-[#4edea3] border border-[#222a3d]">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] text-[#4edea3] uppercase tracking-wider font-bold">
                  Archived Deliverables
                </span>
                <span className="font-mono text-[10px] text-[#86948a]">
                  • {24 + archived.length - 4} Completed YTD
                </span>
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Delivered & Audit-Cleared Packages
              </h3>
            </div>
          </div>

          <button
            onClick={() => showToast('Connecting to BidExact Cloud Archival Vault (2022-2024)...')}
            className="text-xs font-mono text-[#adc6ff] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View Entire Archival Vault (2022-2024)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Archive Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[#86948a] font-mono text-[10px] uppercase tracking-wider bg-[#0b1326] border-b border-[#222a3d]">
                <th className="py-2.5 px-4 font-semibold">Deliverable Package</th>
                <th className="py-2.5 px-4 font-semibold">General Contractor</th>
                <th className="py-2.5 px-4 font-semibold">Delivered Date</th>
                <th className="py-2.5 px-4 font-semibold text-right">Contract Value</th>
                <th className="py-2.5 px-4 font-semibold">Audit Verification</th>
                <th className="py-2.5 px-4 font-semibold text-right">Actions & Download</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d]">
              {archived.map((arch) => (
                <tr key={arch.id} className="hover:bg-[#171f33] transition-colors">
                  {/* Package Name & Code */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col">
                      <span className="font-semibold text-white text-sm">
                        {arch.packageName}
                      </span>
                      <span className="font-mono text-[11px] text-[#86948a]">
                        {arch.packageCode} • {arch.scopeSummary}
                      </span>
                    </div>
                  </td>

                  {/* General Contractor */}
                  <td className="py-3 px-4 font-medium text-white">
                    {arch.gc}
                  </td>

                  {/* Delivered Date */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#86948a]">
                      <Calendar className="w-3.5 h-3.5 text-[#86948a]" />
                      <span>{arch.deliveredDate}</span>
                    </div>
                  </td>

                  {/* Contract Value */}
                  <td className="py-3 px-4 text-right">
                    <span className="font-mono font-bold text-sm text-[#4edea3]">
                      ${arch.contractValue.toLocaleString()}
                    </span>
                    <span className="block font-mono text-[9px] text-[#86948a] uppercase">
                      {arch.budgetStatus}
                    </span>
                  </td>

                  {/* Audit Verification */}
                  <td className="py-3 px-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20 w-fit font-bold">
                        <CheckCircle2 className="w-3 h-3" />
                        {arch.auditVerification.status}
                      </span>
                      <span className="font-mono text-[10px] text-[#86948a]">
                        {arch.auditVerification.signers}
                      </span>
                    </div>
                  </td>

                  {/* Delivery Actions & Download */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        onClick={() => handlePreviewArchivedDelivery(arch)}
                        title="View deliverable manifest details"
                        className="h-8 px-2.5 bg-[#0b1326] hover:bg-[#222a3d] border border-[#222a3d] hover:border-[#adc6ff]/50 text-[#adc6ff] rounded font-mono text-[10px] uppercase tracking-wider inline-flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>View</span>
                      </button>

                      <button
                        onClick={() => handleReverseDelivery(arch.id)}
                        title="Revert back to in-flight active projects"
                        className="h-8 px-2.5 bg-[#e0b44a]/10 hover:bg-[#e0b44a]/25 border border-[#e0b44a]/30 hover:border-[#e0b44a]/60 text-[#ffd18a] rounded font-mono text-[10px] uppercase tracking-wider inline-flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Reverse</span>
                      </button>

                      <button
                        onClick={() => handleDownloadZip(arch)}
                        className="h-8 px-3 bg-[#0b1326] hover:bg-[#222a3d] border border-[#222a3d] text-white rounded font-mono text-[10px] uppercase tracking-wider inline-flex items-center gap-1.5 transition-all cursor-pointer group"
                      >
                        <Download className="w-3.5 h-3.5 text-[#4edea3] group-hover:translate-y-0.5 transition-transform" />
                        <span>{arch.fileSize}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODALS */}
      {/* 1. Project Detailed Inspect Modal */}
      <ProjectInspectModal
        isOpen={!!inspectingProject}
        onClose={() => setInspectingProject(null)}
        project={inspectingProject}
        onUpdateMilestone={handleUpdateMilestone}
        onExtendDeadline={handleExtendDeadline}
        onRelease={handleReleasePackage}
        onRequestRelease={(p) => handlePromptDeliveryPreview(p)}
        onEscalate={(id) => {
          const p = projects.find((x) => x.id === id);
          if (p) setEscalateProject(p);
        }}
      />

      {/* 2. Delivery Verification, Preview & Reversal Modal */}
      <DeliveryPreviewModal
        isOpen={!!deliveryPreviewProject || !!deliveryPreviewArchived}
        project={deliveryPreviewProject}
        archivedItem={deliveryPreviewArchived}
        isDelivered={isDeliveryPreviewDelivered}
        onClose={() => {
          setDeliveryPreviewProject(null);
          setDeliveryPreviewArchived(null);
        }}
        onConfirmDelivery={handleReleasePackage}
        onReverseDelivery={handleReverseDelivery}
      />

      {/* 2. New Takeoff Package Modal */}
      <NewTakeoffPackageModal
        isOpen={isNewPackageModalOpen}
        onClose={() => setIsNewPackageModalOpen(false)}
        onCreate={handleCreatePackage}
      />

      <OutsourcedProjectModal
    isOpen={isOutsourcedModalOpen}
    projects={projects.map((project) => project.title)}
    onClose={() => setIsOutsourcedModalOpen(false)}
    onCreate={handleCreateOutsourcedAssignment}
  />

  {/* 3. Escalate RFI Modal */}
      <EscalateRfiModal
        isOpen={!!escalateProject}
        onClose={() => setEscalateProject(null)}
        project={escalateProject}
        onConfirmEscalation={handleConfirmEscalation}
      />
    </div>
  );
};
