import React, { useState } from 'react';
import { X, Plus, Calendar, DollarSign, Building2, Layers, Check } from 'lucide-react';
import { ProjectTrackItem } from '../types';

interface NewTakeoffPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (newProject: ProjectTrackItem) => void;
}

export const NewTakeoffPackageModal: React.FC<NewTakeoffPackageModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  const [title, setTitle] = useState('');
  const [gc, setGc] = useState('Turner Construction');
  const [scopeType, setScopeType] = useState('Commercial High-Rise');
  const [estimateValue, setEstimateValue] = useState('350000');
  const [targetDue, setTargetDue] = useState('Nov 15, 2024');
  const [milestone1, setMilestone1] = useState('Foundation QTO Model');
  const [milestone2, setMilestone2] = useState('Structural Steel Framing');
  const [leadEstimator, setLeadEstimator] = useState('Marcus Vance');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newId = `BID-2024-${Math.floor(100 + Math.random() * 900)}`;
    const newPkg: ProjectTrackItem = {
      id: newId,
      title: title.trim(),
      gc,
      scopeType,
      status: 'ACTIVE_TAKEOFF',
      statusLabel: 'Active Takeoff',
      statusColor: '#4edea3',
      estimateValue: parseFloat(estimateValue) || 350000,
      completionPace: 15,
      targetDue,
      paceStatus: 'On Track',
      paceStatusType: 'success',
      milestones: [
        { id: `m-${Date.now()}-1`, title: milestone1.trim() || 'Foundation QTO Model', status: 'complete' },
        { id: `m-${Date.now()}-2`, title: milestone2.trim() || 'Structural Framing', status: 'in_progress' },
      ],
      leadEstimators: [
        {
          name: leadEstimator,
          initials: leadEstimator.split(' ').map((n) => n[0]).join(''),
          avatarColor: '#0566d9',
        },
      ],
      leadRole: 'Lead Estimator',
      actionType: 'inspect',
      actionLabel: 'Inspect Log',
      totalHoursLogged: 12,
      createdDate: new Date().toISOString().slice(0, 10),
    };

    onCreate(newPkg);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="bg-[#0f172a] border border-[#222a3d] rounded-xl w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-[#222a3d] bg-[#131b2e] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#4edea3]/15 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                New Takeoff Package
              </h2>
              <p className="text-xs text-[#86948a]">
                Initialize QTO workflow & assign lead estimators
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#86948a] hover:text-white p-1 rounded hover:bg-[#222a3d] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <label className="block font-mono text-[10px] text-[#86948a] uppercase mb-1">
              Project Name
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Skyline Logistics Terminal"
              className="w-full h-9 bg-[#131b2e] border border-[#222a3d] rounded-md px-3 text-white placeholder:text-[#86948a] focus:outline-none focus:border-[#4edea3]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] text-[#86948a] uppercase mb-1">
                General Contractor
              </label>
              <select
                value={gc}
                onChange={(e) => setGc(e.target.value)}
                className="w-full h-9 bg-[#131b2e] border border-[#222a3d] rounded-md px-3 text-white focus:outline-none focus:border-[#4edea3]"
              >
                <option value="Turner Construction">Turner Construction</option>
                <option value="Clark Construction">Clark Construction</option>
                <option value="Balfour Beatty">Balfour Beatty</option>
                <option value="Skanska USA">Skanska USA</option>
                <option value="Webcor Builders">Webcor Builders</option>
                <option value="DPR Construction">DPR Construction</option>
              </select>
            </div>

            <div>
              <label className="block font-mono text-[10px] text-[#86948a] uppercase mb-1">
                Scope / Structure Type
              </label>
              <input
                type="text"
                value={scopeType}
                onChange={(e) => setScopeType(e.target.value)}
                placeholder="Commercial High-Rise"
                className="w-full h-9 bg-[#131b2e] border border-[#222a3d] rounded-md px-3 text-white focus:outline-none focus:border-[#4edea3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] text-[#86948a] uppercase mb-1">
                Estimate Scope Value ($)
              </label>
              <input
                type="number"
                value={estimateValue}
                onChange={(e) => setEstimateValue(e.target.value)}
                placeholder="350000"
                className="w-full h-9 bg-[#131b2e] border border-[#222a3d] rounded-md px-3 text-white focus:outline-none focus:border-[#4edea3]"
              />
            </div>

            <div>
              <label className="block font-mono text-[10px] text-[#86948a] uppercase mb-1">
                Target Due Date
              </label>
              <input
                type="text"
                value={targetDue}
                onChange={(e) => setTargetDue(e.target.value)}
                placeholder="Nov 15, 2024"
                className="w-full h-9 bg-[#131b2e] border border-[#222a3d] rounded-md px-3 text-white focus:outline-none focus:border-[#4edea3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-mono text-[10px] text-[#86948a] uppercase mb-1">
                Primary Milestone
              </label>
              <input
                type="text"
                value={milestone1}
                onChange={(e) => setMilestone1(e.target.value)}
                placeholder="Foundation QTO Model"
                className="w-full h-9 bg-[#131b2e] border border-[#222a3d] rounded-md px-3 text-white focus:outline-none focus:border-[#4edea3]"
              />
            </div>
            <div>
              <label className="block font-mono text-[10px] text-[#86948a] uppercase mb-1">
                Secondary Milestone
              </label>
              <input
                type="text"
                value={milestone2}
                onChange={(e) => setMilestone2(e.target.value)}
                placeholder="Structural Framing"
                className="w-full h-9 bg-[#131b2e] border border-[#222a3d] rounded-md px-3 text-white focus:outline-none focus:border-[#4edea3]"
              />
            </div>
          </div>

          <div>
            <label className="block font-mono text-[10px] text-[#86948a] uppercase mb-1">
              Lead Estimator
            </label>
            <select
              value={leadEstimator}
              onChange={(e) => setLeadEstimator(e.target.value)}
              className="w-full h-9 bg-[#131b2e] border border-[#222a3d] rounded-md px-3 text-white focus:outline-none focus:border-[#4edea3]"
            >
              <option value="Marcus Vance">Marcus Vance (Managing Principal)</option>
              <option value="Elena Rostova">Elena Rostova (Lead BIM Estimator)</option>
              <option value="David Chen">David Chen (Senior Cost Analyst)</option>
              <option value="Syed Ahmed">Syed Ahmed (Senior Estimator & Partner)</option>
              <option value="Kavita Patel">Kavita Patel (Structural Engineer)</option>
            </select>
          </div>

          <div className="pt-3 border-t border-[#222a3d] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-md bg-[#171f33] hover:bg-[#222a3d] text-xs font-mono text-[#86948a] hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded-md text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>Create Package</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
