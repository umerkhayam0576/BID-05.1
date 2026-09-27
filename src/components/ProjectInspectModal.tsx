import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Calendar,
  DollarSign,
  UserCheck,
  FileSpreadsheet,
  ArrowRight,
  ShieldCheck,
  Check,
  Send,
  Layers
} from 'lucide-react';
import { ProjectTrackItem, MilestoneItem } from '../types';

interface ProjectInspectModalProps {
  project: ProjectTrackItem | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateMilestone?: (projectId: string, milestoneId: string, status: MilestoneItem['status']) => void;
  onRelease?: (projectId: string) => void;
  onRequestRelease?: (project: ProjectTrackItem) => void;
  onEscalate?: (projectId: string) => void;
  onExtendDeadline?: (projectId: string, extraDays: number) => void;
}

export const ProjectInspectModal: React.FC<ProjectInspectModalProps> = ({
  project,
  isOpen,
  onClose,
  onUpdateMilestone,
  onRelease,
  onRequestRelease,
  onEscalate,
  onExtendDeadline,
}) => {
  const [activeTab, setActiveTab] = useState<'milestones' | 'qto' | 'audit' | 'activity'>('milestones');
  const [newLogNote, setNewLogNote] = useState('');
  const [activityLogs, setActivityLogs] = useState<Array<{ id: string; time: string; user: string; text: string }>>([
    {
      id: 'log-1',
      time: 'Today at 09:14 AM',
      user: 'Marcus Vance',
      text: 'Rebar schedule validation cross-checked against submittal delta. 100% variance cleared.',
    },
    {
      id: 'log-2',
      time: 'Yesterday at 04:30 PM',
      user: 'David Chen',
      text: 'Extracted structural quantities from Revit LOD 350 model; concrete slab volume matched 42,000 CY target.',
    },
    {
      id: 'log-3',
      time: 'Aug 17, 2024',
      user: 'Elena Rostova',
      text: 'Initial BIM baseline imported. Clashes identified in MEP ceiling return lines.',
    },
  ]);

  if (!isOpen || !project) return null;

  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogNote.trim()) return;
    setActivityLogs((prev) => [
      {
        id: `log-${Date.now()}`,
        time: 'Just now',
        user: 'Marcus Vance (Current Session)',
        text: newLogNote.trim(),
      },
      ...prev,
    ]);
    setNewLogNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="bg-[#0f172a] border border-[#222a3d] rounded-xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-8 animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-[#222a3d] bg-[#131b2e] flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#4edea3]/15 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] mt-0.5">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-xs font-bold text-[#4edea3] px-2 py-0.5 rounded bg-[#4edea3]/10 border border-[#4edea3]/20">
                  {project.id}
                </span>
                <span className="text-xs font-mono text-[#86948a] uppercase tracking-wider">
                  {project.statusLabel}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {project.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#86948a] mt-0.5">
                <span className="text-[#dae2fd] font-medium">{project.gc}</span>
                <span>•</span>
                <span className="text-[#adc6ff] font-mono">{project.scopeType}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-[#86948a] hover:text-white p-1 rounded-md hover:bg-[#222a3d] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* High-Level Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-[#0b1326] border-b border-[#222a3d] text-xs">
          <div>
            <div className="text-[10px] font-mono text-[#86948a] uppercase">Scope Value</div>
            <div className="text-base font-bold font-mono text-white mt-0.5">
              ${project.estimateValue.toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#86948a] uppercase">Completion Pace</div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="text-base font-bold font-mono text-[#4edea3]">
                {project.completionPace}%
              </div>
              <span className="text-[10px] text-[#86948a] font-mono">/ 100%</span>
            </div>
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#86948a] uppercase flex items-center justify-between">
              <span>Target Due</span>
              {project.daysRemaining !== undefined && (
                <span
                  className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded ${
                    project.daysRemaining < 0
                      ? 'bg-[#93000a]/40 text-[#ffb4ab]'
                      : project.daysRemaining === 0
                      ? 'bg-[#ba1a1a]/30 text-[#ffb4ab]'
                      : project.daysRemaining === 1
                      ? 'bg-[#ffb356]/20 text-[#ffb356]'
                      : project.daysRemaining === 2
                      ? 'bg-[#ffc966]/20 text-[#ffc966]'
                      : 'bg-[#adc6ff]/20 text-[#adc6ff]'
                  }`}
                >
                  {project.daysRemaining < 0
                    ? `Overdue (${Math.abs(project.daysRemaining)}d)`
                    : project.daysRemaining === 0
                    ? 'Due Today'
                    : project.daysRemaining === 1
                    ? '1 day left'
                    : `${project.daysRemaining} days left`}
                </span>
              )}
            </div>
            <div className="text-xs font-semibold text-white mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-[#adc6ff]" />
              {project.targetDue}
            </div>
            {onExtendDeadline && (
              <div className="flex items-center gap-1 mt-1.5 font-mono text-[10px]">
                <span className="text-[#86948a]">Extend:</span>
                <button
                  type="button"
                  onClick={() => onExtendDeadline(project.id, 1)}
                  className="px-1.5 py-0.5 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] text-[#dae2fd] hover:text-[#4edea3] cursor-pointer"
                >
                  +1d
                </button>
                <button
                  type="button"
                  onClick={() => onExtendDeadline(project.id, 3)}
                  className="px-1.5 py-0.5 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] text-[#dae2fd] hover:text-[#4edea3] cursor-pointer"
                >
                  +3d
                </button>
                <button
                  type="button"
                  onClick={() => onExtendDeadline(project.id, 7)}
                  className="px-1.5 py-0.5 rounded bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] text-[#dae2fd] hover:text-[#4edea3] cursor-pointer"
                >
                  +7d (Addendum)
                </button>
              </div>
            )}
          </div>
          <div>
            <div className="text-[10px] font-mono text-[#86948a] uppercase">Pace Status</div>
            <div className="text-xs font-semibold text-[#4edea3] mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {project.paceStatus}
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#222a3d] bg-[#131b2e] px-4 gap-2">
          <button
            onClick={() => setActiveTab('milestones')}
            className={`py-3 px-3 text-xs font-mono font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'milestones'
                ? 'border-[#4edea3] text-[#4edea3]'
                : 'border-transparent text-[#86948a] hover:text-[#dae2fd]'
            }`}
          >
            Milestones & Deliverables ({project.milestones.length})
          </button>
          <button
            onClick={() => setActiveTab('qto')}
            className={`py-3 px-3 text-xs font-mono font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'qto'
                ? 'border-[#4edea3] text-[#4edea3]'
                : 'border-transparent text-[#86948a] hover:text-[#dae2fd]'
            }`}
          >
            QTO Specs & Hours
          </button>
          <button
            onClick={() => setActiveTab('activity')}
            className={`py-3 px-3 text-xs font-mono font-medium border-b-2 transition-colors cursor-pointer ${
              activeTab === 'activity'
                ? 'border-[#4edea3] text-[#4edea3]'
                : 'border-transparent text-[#86948a] hover:text-[#dae2fd]'
            }`}
          >
            Audit Log ({activityLogs.length})
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 max-h-[420px] overflow-y-auto space-y-4">
          {activeTab === 'milestones' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#86948a]">
                <span>Click milestone check to update operational status:</span>
                <span className="font-mono text-[11px] text-[#4edea3]">
                  {project.milestones.filter((m) => m.status === 'complete').length} of{' '}
                  {project.milestones.length} Completed
                </span>
              </div>

              <div className="space-y-2">
                {project.milestones.map((m) => (
                  <div
                    key={m.id}
                    className="p-3 bg-[#131b2e] border border-[#222a3d] rounded-lg flex items-center justify-between gap-3 hover:border-[#3c4a42] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (onUpdateMilestone) {
                            const nextStatus =
                              m.status === 'complete'
                                ? 'pending'
                                : m.status === 'pending'
                                ? 'in_progress'
                                : 'complete';
                            onUpdateMilestone(project.id, m.id, nextStatus);
                          }
                        }}
                        className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                          m.status === 'complete'
                            ? 'bg-[#4edea3]/20 border border-[#4edea3] text-[#4edea3]'
                            : m.status === 'in_progress'
                            ? 'bg-[#adc6ff]/20 border border-[#adc6ff] text-[#adc6ff]'
                            : 'bg-[#1e293b] border border-[#334155] text-transparent hover:border-[#86948a]'
                        }`}
                        title="Toggle milestone state"
                      >
                        {m.status === 'complete' ? (
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        ) : m.status === 'in_progress' ? (
                          <Clock className="w-3.5 h-3.5" />
                        ) : null}
                      </button>

                      <div>
                        <div className="text-sm font-medium text-[#dae2fd]">
                          {m.title}
                        </div>
                        {m.note && (
                          <div className="text-xs text-[#86948a] mt-0.5 font-mono">
                            {m.note}
                          </div>
                        )}
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-semibold ${
                        m.status === 'complete'
                          ? 'bg-[#4edea3]/15 text-[#4edea3] border border-[#4edea3]/30'
                          : m.status === 'in_progress'
                          ? 'bg-[#adc6ff]/15 text-[#adc6ff] border border-[#adc6ff]/30'
                          : 'bg-[#ff7886]/15 text-[#ffb4ab] border border-[#ff7886]/30'
                      }`}
                    >
                      {m.status === 'complete'
                        ? 'Completed'
                        : m.status === 'in_progress'
                        ? 'In Progress'
                        : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>

              {/* Notice Banner */}
              {project.notice && (
                <div
                  className={`p-3 rounded-lg border flex items-start gap-3 mt-4 ${
                    project.notice.type === 'critical_hold'
                      ? 'bg-[#93000a]/20 border-[#ff7886]/30 text-[#ffdad6]'
                      : project.notice.type === 'linked_rfi'
                      ? 'bg-[#4edea3]/10 border-[#4edea3]/25 text-[#4edea3]'
                      : 'bg-[#171f33] border-[#222a3d] text-[#dae2fd]'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <div>
                    <div className="font-semibold text-xs">{project.notice.text}</div>
                    {project.notice.subtext && (
                      <p className="text-xs text-[#86948a] mt-0.5">
                        {project.notice.subtext}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'qto' && (
            <div className="space-y-4">
              <div className="bg-[#131b2e] border border-[#222a3d] p-4 rounded-lg space-y-3">
                <div className="text-xs font-mono text-[#86948a] uppercase tracking-wider">
                  Quantity Takeoff Scope Specifications
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.qtoSpecs?.map((spec, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded bg-[#171f33] border border-[#222a3d] text-xs font-mono text-[#dae2fd]"
                    >
                      {spec}
                    </span>
                  )) || (
                    <span className="text-xs text-[#86948a]">Standard CSI MasterFormat 50 Division Scope</span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-[#131b2e] border border-[#222a3d] p-3 rounded-lg">
                  <span className="text-[#86948a] text-[10px] font-mono uppercase">Logged Estimator Hours</span>
                  <div className="text-lg font-bold font-mono text-white mt-1">
                    {project.totalHoursLogged || 120} hrs
                  </div>
                  <span className="text-[10px] text-[#4edea3] mt-0.5 block">Estimated vs Target: 98% efficient</span>
                </div>
                <div className="bg-[#131b2e] border border-[#222a3d] p-3 rounded-lg">
                  <span className="text-[#86948a] text-[10px] font-mono uppercase">Package Creation Date</span>
                  <div className="text-lg font-bold font-mono text-white mt-1">
                    {project.createdDate || '2024-07-15'}
                  </div>
                  <span className="text-[10px] text-[#adc6ff] mt-0.5 block">ISO 9001:2015 Registered</span>
                </div>
              </div>

              <div className="bg-[#131b2e] border border-[#222a3d] p-3 rounded-lg flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Assigned Estimating Team</div>
                  <div className="text-xs text-[#86948a] mt-0.5">
                    {project.leadEstimators.map((e) => e.name).join(', ')} ({project.leadRole})
                  </div>
                </div>
                <div className="flex -space-x-1.5">
                  {project.leadEstimators.map((est, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border border-[#0b1326] flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: est.avatarColor || '#0566d9' }}
                    >
                      {est.initials}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="space-y-4">
              <form onSubmit={handleAddLog} className="flex gap-2">
                <input
                  type="text"
                  value={newLogNote}
                  onChange={(e) => setNewLogNote(e.target.value)}
                  placeholder="Add operational memo or audit note..."
                  className="flex-1 h-9 bg-[#131b2e] border border-[#222a3d] rounded-md px-3 text-xs text-white placeholder:text-[#86948a] focus:outline-none focus:border-[#4edea3]"
                />
                <button
                  type="submit"
                  className="h-9 px-3.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Log Note</span>
                </button>
              </form>

              <div className="space-y-2.5">
                {activityLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-[#131b2e] border border-[#222a3d] rounded-lg text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#dae2fd]">{log.user}</span>
                      <span className="text-[10px] font-mono text-[#86948a]">{log.time}</span>
                    </div>
                    <p className="text-[#86948a]">{log.text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-[#222a3d] bg-[#131b2e] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md bg-[#171f33] hover:bg-[#222a3d] text-xs font-mono text-[#86948a] hover:text-white transition-colors cursor-pointer"
          >
            Close Inspector
          </button>

          <div className="flex items-center gap-2">
            {project.actionType === 'escalate' && onEscalate && (
              <button
                onClick={() => {
                  onEscalate(project.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-md bg-[#ff7886]/20 hover:bg-[#ff7886]/30 border border-[#ff7886]/40 text-[#ffdad6] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#ff7886]" />
                <span>Escalate RFI Gating Hold</span>
              </button>
            )}

            {project.actionType === 'release' && (onRelease || onRequestRelease) && (
              <button
                onClick={() => {
                  if (onRequestRelease) {
                    onRequestRelease(project);
                  } else if (onRelease) {
                    onRelease(project.id);
                  }
                  onClose();
                }}
                className="px-4 py-2 rounded-md bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-md"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Review & Release Package</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
