import React, { useState } from 'react';
import {
  X,
  Sliders,
  ShieldCheck,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Settings2,
  ArrowRight,
  Sparkles,
  Layers,
  Save
} from 'lucide-react';
import { AutomationRulesConfig } from '../../types/workflow';

interface LogicRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: AutomationRulesConfig;
  onSaveRules: (updated: AutomationRulesConfig) => void;
}

export const LogicRulesModal: React.FC<LogicRulesModalProps> = ({
  isOpen,
  onClose,
  rules,
  onSaveRules,
}) => {
  const [localRules, setLocalRules] = useState<AutomationRulesConfig>(rules);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveRules(localRules);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-[#dae2fd]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#e0b44a]/10 border border-[#e0b44a]/30 flex items-center justify-center text-[#e0b44a]">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Business Logic &amp; Technical Rules Engine
                </h2>
                <span className="px-2 py-0.5 rounded bg-[#e0b44a]/15 text-[#e0b44a] text-[10px] font-mono font-semibold">
                  Rule Evaluation v3.1
                </span>
              </div>
              <p className="text-xs text-[#86948a]">
                State machine conditions, automated resource allocation formulas, and QA gating criteria
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#86948a] hover:text-white rounded-md hover:bg-[#1f283d] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 bg-[#0b1326]">
          {/* Section 1: State Machine Transition Conditions */}
          <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-3">
            <div className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
              <span>State Transition Rules &amp; Triggers</span>
            </div>

            <div className="space-y-2.5 text-xs font-mono">
              <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] flex items-start gap-3">
                <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] text-[10px] font-bold">
                  RULE 01
                </span>
                <div>
                  <div className="font-bold text-white">Deposit &rarr; Instant Activation</div>
                  <div className="text-[#86948a] text-[11px] mt-0.5 font-sans">
                    Quote status transitions to <code className="text-[#4edea3]">paid_and_activated</code> immediately upon receiving Stripe webhook <code className="text-[#adc6ff]">payment.deposit_succeeded</code> with amount &ge; {localRules.autoDepositRequiredPercent}% of total quote value.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] flex items-start gap-3">
                <span className="px-1.5 py-0.5 rounded bg-[#3b82f6]/20 text-[#adc6ff] text-[10px] font-bold">
                  RULE 02
                </span>
                <div>
                  <div className="font-bold text-white">Activation &rarr; Project Entity Instantiation</div>
                  <div className="text-[#86948a] text-[11px] mt-0.5 font-sans">
                    Creates an active project record in the PM engine, binds quote line items to milestone schedules, and invokes the smart resource matching algorithm within &lt;200ms.
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] flex items-start gap-3">
                <span className="px-1.5 py-0.5 rounded bg-[#ffb356]/20 text-[#ffb356] text-[10px] font-bold">
                  RULE 03
                </span>
                <div>
                  <div className="font-bold text-white">QA 4-Point Gating &rarr; Deliverables Release</div>
                  <div className="text-[#86948a] text-[11px] mt-0.5 font-sans">
                    Project status cannot transition to <code className="text-[#4edea3]">delivered</code> unless:
                    1) Spec compliance verified; 2) Takeoff recount variance &le; 0.5%; 3) Material rate index matched; 4) Senior Technical Auditor electronic signature logged.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Smart Resource Allocation Algorithm */}
          <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-4">
            <div className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#adc6ff]" />
              <span>Resource Allocation &amp; Overload Fallback Rules</span>
            </div>

            <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] font-mono text-xs space-y-2">
              <div className="text-[#adc6ff] font-bold">Algorithmic Match Score Formula:</div>
              <code className="text-[#4edea3] block text-[11px] bg-[#131b2e] p-2 rounded border border-[#222a3d]">
                Score = (Qualification_Overlap &times; 0.40) + ((40 - Current_Hours)/40 &times; 0.35) + ((Rating/5) &times; 0.25)
              </code>
              <p className="text-[11px] text-[#86948a] font-sans">
                The algorithm automatically selects the estimator with the highest score &ge; {localRules.minQualificationMatchScore}%.
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#ff7886]/10 border border-[#ff7886]/30 text-xs font-mono space-y-1">
              <div className="text-[#ff7886] font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>Deterministic Fallback Rule (Overload Trigger):</span>
              </div>
              <p className="text-[11px] text-[#dae2fd] font-sans">
                If ALL qualified estimators have current weekly committed hours &ge; <strong>{localRules.overloadFallbackThresholdHours} hrs/week</strong> (or if no candidate meets the minimum {localRules.minQualificationMatchScore}% qualification score), the system automatically routes the project to the <strong>"PM Manual Fallback Queue"</strong> with an urgent notification to the Estimating Director to rebalance schedules or engage a 1099 estimating partner.
              </p>
            </div>
          </div>

          {/* Section 3: Interactive Configuration Toggles */}
          <div className="p-4 rounded-xl bg-[#131b2e] border border-[#222a3d] space-y-4 font-mono text-xs">
            <div className="text-xs font-mono uppercase tracking-wider text-[#86948a] font-semibold">
              Configurable Parameter Controls
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] space-y-2">
                <label className="block text-white font-bold">
                  Mobilization Deposit Required (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="10"
                    max="50"
                    step="5"
                    value={localRules.autoDepositRequiredPercent}
                    onChange={(e) =>
                      setLocalRules({ ...localRules, autoDepositRequiredPercent: Number(e.target.value) })
                    }
                    className="flex-1 accent-[#4edea3]"
                  />
                  <span className="font-bold text-[#4edea3] w-12 text-right">
                    {localRules.autoDepositRequiredPercent}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] space-y-2">
                <label className="block text-white font-bold">
                  Overload Fallback Threshold (Hours/Wk)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="30"
                    max="45"
                    step="1"
                    value={localRules.overloadFallbackThresholdHours}
                    onChange={(e) =>
                      setLocalRules({ ...localRules, overloadFallbackThresholdHours: Number(e.target.value) })
                    }
                    className="flex-1 accent-[#ff7886]"
                  />
                  <span className="font-bold text-[#ff7886] w-12 text-right">
                    {localRules.overloadFallbackThresholdHours}h
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] space-y-2">
                <label className="block text-white font-bold">
                  Minimum Qualification Score (%)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={localRules.minQualificationMatchScore}
                    onChange={(e) =>
                      setLocalRules({ ...localRules, minQualificationMatchScore: Number(e.target.value) })
                    }
                    className="flex-1 accent-[#adc6ff]"
                  />
                  <span className="font-bold text-[#adc6ff] w-12 text-right">
                    {localRules.minQualificationMatchScore}%
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">Instant Activation on Payment</div>
                  <div className="text-[10px] text-[#86948a] font-sans">Bypasses manual PM review step</div>
                </div>
                <input
                  type="checkbox"
                  checked={localRules.enableInstantActivationOnPayment}
                  onChange={(e) =>
                    setLocalRules({ ...localRules, enableInstantActivationOnPayment: e.target.checked })
                  }
                  className="w-4 h-4 accent-[#4edea3]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
          <div className="text-xs text-[#86948a]">
            {savedSuccess ? (
              <span className="text-[#4edea3] font-mono flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Parameters saved &amp; active
              </span>
            ) : (
              <span>Modifications take effect on subsequent webhooks</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded bg-[#171f33] hover:bg-[#222a3d] text-xs text-[#86948a] font-medium border border-[#2d3449] cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded bg-[#4edea3] hover:bg-[#3ec490] text-[#0b1326] font-bold text-xs font-mono flex items-center gap-2 cursor-pointer shadow-lg transition-all active:scale-[0.98]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Rules Configuration</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
