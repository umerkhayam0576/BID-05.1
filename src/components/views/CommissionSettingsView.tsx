import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Percent,
  Users,
  Award,
  DollarSign,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  Building2,
  Clock,
  ArrowRight,
  Sparkles,
  Calculator,
  Info,
  TrendingUp,
  CreditCard,
  Layers,
  Check,
  Zap,
  Scale,
  BarChart3,
} from 'lucide-react';
import {
  CommissionSettingsState,
  TeamTargetRule,
  TeamMemberShare,
  EmployeeItem,
} from '../../types';
import {
  FINANCIAL_CONSTANTS,
  resetCommissionSettings,
} from '../../utils/financialRulesEngine';
import { NavTabId } from '../Sidebar';

interface CommissionSettingsViewProps {
  rules: CommissionSettingsState;
  onSaveRules: (updatedRules: CommissionSettingsState) => void;
  employees: EmployeeItem[];
  onNavigateTab?: (tab: NavTabId) => void;
}

export const CommissionSettingsView: React.FC<CommissionSettingsViewProps> = ({
  rules,
  onSaveRules,
  employees,
  onNavigateTab,
}) => {
  // Local mutable state initialized from persisted rules prop
  const [formState, setFormState] = useState<CommissionSettingsState>(rules);
  const [activeSubTab, setActiveSubTab] = useState<'global' | 'teams' | 'simulator' | 'matrix'>('global');
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState<boolean>(false);

  // New Team Modal State
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState<boolean>(false);
  const [newTeamName, setNewTeamName] = useState<string>('');
  const [newTeamDept, setNewTeamDept] = useState<string>('Pre-Construction');
  const [newTeamTarget, setNewTeamTarget] = useState<number>(200000);
  const [newTeamBonusPool, setNewTeamBonusPool] = useState<number>(4000);
  const [newTeamSalesRate, setNewTeamSalesRate] = useState<number>(5.5);
  const [newTeamRecurringRate, setNewTeamRecurringRate] = useState<number>(3.0);
  const [newTeamServiceRate, setNewTeamServiceRate] = useState<number>(2.5);

  // Simulation Sandbox State
  const [simContractValue, setSimContractValue] = useState<number>(75000);
  const [simClientType, setSimClientType] = useState<'new_client' | 'recurring_client'>('new_client');
  const [simTeamId, setSimTeamId] = useState<string>('global'); // 'global' or team.id
  const [lastSelectedTeamId, setLastSelectedTeamId] = useState<string>('');
  const [simEarlyHours, setSimEarlyHours] = useState<number>(48);
  const [simPaymentMethod, setSimPaymentMethod] = useState<'credit_card' | 'ach_debit' | 'wire_transfer'>('credit_card');
  const [simQaErrors, setSimQaErrors] = useState<number>(0);

  // Sync state if external rules change
  useEffect(() => {
    setFormState(rules);
    setHasUnsavedChanges(false);
  }, [rules]);

  // Mark changes
  const updateFormState = (updater: (prev: CommissionSettingsState) => CommissionSettingsState) => {
    setFormState((prev) => {
      const next = updater(prev);
      setHasUnsavedChanges(true);
      return next;
    });
  };

  // Save handler
  const handleSave = () => {
    const updated: CommissionSettingsState = {
      ...formState,
      lastUpdated: new Date().toISOString().slice(0, 10),
      version: (formState.version || 1) + 1,
    };
    onSaveRules(updated);
    setHasUnsavedChanges(false);
    setSaveSuccessNotice('Commission & incentive rules persisted successfully! All active project calculations and payroll pipelines updated.');
    setTimeout(() => {
      setSaveSuccessNotice(null);
    }, 4500);
  };

  // Reset handler
  const handleReset = () => {
    if (window.confirm('Reset all global and per-team commission percentages and service bonuses to standard corporate defaults?')) {
      const def = resetCommissionSettings();
      setFormState(def);
      onSaveRules(def);
      setHasUnsavedChanges(false);
      setSaveSuccessNotice('Rules restored to corporate defaults.');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    }
  };

  // Preset Applier
  const applyPreset = (type: 'standard' | 'aggressive' | 'retention') => {
    if (type === 'standard') {
      updateFormState((prev) => ({
        ...prev,
        globalSalesRate: 5.0,
        globalRecurringRate: 2.5,
        globalServiceBonus24h: 1.5,
        globalServiceBonus48h: 2.5,
        globalServiceBonus72h: 4.0,
        serviceBonusMode: 'percentage',
        deductStripeFees: true,
        clawbackWindowDays: 90,
        requireZeroQaErrors: true,
      }));
    } else if (type === 'aggressive') {
      updateFormState((prev) => ({
        ...prev,
        globalSalesRate: 7.0,
        globalRecurringRate: 3.5,
        globalServiceBonus24h: 2.0,
        globalServiceBonus48h: 3.5,
        globalServiceBonus72h: 5.0,
        serviceBonusMode: 'percentage',
        deductStripeFees: true,
        clawbackWindowDays: 60,
        requireZeroQaErrors: false,
      }));
    } else if (type === 'retention') {
      updateFormState((prev) => ({
        ...prev,
        globalSalesRate: 4.0,
        globalRecurringRate: 4.0, // Equal weight for recurring client retention
        globalServiceBonus24h: 1.0,
        globalServiceBonus48h: 2.0,
        globalServiceBonus72h: 3.5,
        serviceBonusMode: 'percentage',
        deductStripeFees: true,
        clawbackWindowDays: 90,
        requireZeroQaErrors: true,
      }));
    }
  };

  // Team Management Handlers
  const handleToggleTeamCustomRates = (teamId: string) => {
    updateFormState((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => {
        if (t.id !== teamId) return t;
        const nextCustom = !t.useCustomRates;
        return {
          ...t,
          useCustomRates: nextCustom,
          salesCommissionRatePercent: t.salesCommissionRatePercent ?? prev.globalSalesRate,
          recurringClientRatePercent: t.recurringClientRatePercent ?? prev.globalRecurringRate,
          serviceBonusRatePercent: t.serviceBonusRatePercent ?? prev.globalServiceBonus24h,
        };
      }),
    }));
  };

  const handleUpdateTeamRate = (
    teamId: string,
    field: 'salesCommissionRatePercent' | 'recurringClientRatePercent' | 'serviceBonusRatePercent' | 'targetAmount' | 'bonusPoolAmount' | 'splitType' | 'notes',
    value: any
  ) => {
    updateFormState((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.id === teamId ? { ...t, [field]: value } : t)),
    }));
  };

  const handleAddMemberToTeam = (teamId: string, employeeId: string) => {
    const emp = employees.find((e) => e.id === employeeId);
    if (!emp) return;

    updateFormState((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => {
        if (t.id !== teamId) return t;
        if (t.members.some((m) => m.employeeId === employeeId)) return t;
        const newMember: TeamMemberShare = {
          employeeId: emp.id,
          employeeName: emp.name,
          role: emp.role,
          department: emp.department,
        };
        return {
          ...t,
          members: [...t.members, newMember],
        };
      }),
    }));
  };

  const handleRemoveMemberFromTeam = (teamId: string, employeeId: string) => {
    updateFormState((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          members: t.members.filter((m) => m.employeeId !== employeeId),
        };
      }),
    }));
  };

  const handleCreateTeam = () => {
    if (!newTeamName.trim()) return;
    const teamId = `team_${Date.now()}`;
    const newTeam: TeamTargetRule = {
      id: teamId,
      name: newTeamName.trim(),
      department: newTeamDept,
      targetAmount: newTeamTarget,
      currentAchievedAmount: 0,
      bonusPoolAmount: newTeamBonusPool,
      splitType: 'equal_split',
      useCustomRates: true,
      salesCommissionRatePercent: newTeamSalesRate,
      recurringClientRatePercent: newTeamRecurringRate,
      serviceBonusRatePercent: newTeamServiceRate,
      members: [],
      notes: 'Custom pre-construction division target team.',
    };

    updateFormState((prev) => ({
      ...prev,
      teams: [...prev.teams, newTeam],
    }));

    setIsAddTeamModalOpen(false);
    setNewTeamName('');
  };

  const handleDeleteTeam = (teamId: string) => {
    if (window.confirm('Delete this team and revert members to global compensation rules?')) {
      updateFormState((prev) => ({
        ...prev,
        teams: prev.teams.filter((t) => t.id !== teamId),
      }));
    }
  };

  // --- Live Sandbox Calculations ---
  const calculateSandbox = () => {
    // 1. Determine rates based on selected team or global
    const selectedTeam = formState.teams.find((t) => t.id === simTeamId);
    const usesTeamOverrides = selectedTeam && selectedTeam.useCustomRates;

    const effectiveSalesRate = usesTeamOverrides && selectedTeam.salesCommissionRatePercent !== undefined
      ? selectedTeam.salesCommissionRatePercent
      : formState.globalSalesRate;

    const effectiveRecurringRate = usesTeamOverrides && selectedTeam.recurringClientRatePercent !== undefined
      ? selectedTeam.recurringClientRatePercent
      : formState.globalRecurringRate;

    const effectiveCommissionRate = simClientType === 'new_client' ? effectiveSalesRate : effectiveRecurringRate;

    // 2. Stripe Fee Deduction
    let stripeFee = 0;
    if (formState.deductStripeFees) {
      if (simPaymentMethod === 'credit_card') {
        stripeFee = Number(((simContractValue * FINANCIAL_CONSTANTS.STRIPE_CC_PERCENT) + FINANCIAL_CONSTANTS.STRIPE_CC_FIXED).toFixed(2));
      } else if (simPaymentMethod === 'ach_debit') {
        const rawFee = simContractValue * FINANCIAL_CONSTANTS.STRIPE_ACH_PERCENT;
        stripeFee = Number(Math.min(rawFee, FINANCIAL_CONSTANTS.STRIPE_ACH_CAP).toFixed(2));
      }
    }

    const netCash = Math.max(0, simContractValue - stripeFee);
    const commissionAccrued = Math.round((netCash * (effectiveCommissionRate / 100)) * 100) / 100;

    // 3. Service Bonus Calculation
    let serviceBonusRateOrAmount = 0;
    let serviceBonusAmount = 0;
    const isQualityPassed = !formState.requireZeroQaErrors || simQaErrors === 0;

    if (isQualityPassed) {
      if (usesTeamOverrides && selectedTeam.serviceBonusRatePercent !== undefined) {
        serviceBonusRateOrAmount = selectedTeam.serviceBonusRatePercent;
        serviceBonusAmount = Math.round((simContractValue * (serviceBonusRateOrAmount / 100)) * 100) / 100;
      } else {
        if (simEarlyHours >= 72) {
          serviceBonusRateOrAmount = formState.globalServiceBonus72h;
        } else if (simEarlyHours >= 48) {
          serviceBonusRateOrAmount = formState.globalServiceBonus48h;
        } else if (simEarlyHours >= 24) {
          serviceBonusRateOrAmount = formState.globalServiceBonus24h;
        }

        if (formState.serviceBonusMode === 'flat_dollar') {
          serviceBonusAmount = serviceBonusRateOrAmount;
        } else {
          serviceBonusAmount = Math.round((simContractValue * (serviceBonusRateOrAmount / 100)) * 100) / 100;
        }
      }
    }

    const totalPayout = commissionAccrued + serviceBonusAmount;
    const supplementalTax = Math.round(totalPayout * FINANCIAL_CONSTANTS.SUPPLEMENTAL_WAGE_TAX_RATE);
    const netTakeHome = totalPayout - supplementalTax;
    const companyRetainedCash = Math.max(0, simContractValue - stripeFee - totalPayout);
    const companyRetainedPercent = simContractValue > 0 ? (companyRetainedCash / simContractValue) * 100 : 0;
    const effectiveIncentivePercent = simContractValue > 0 ? (totalPayout / simContractValue) * 100 : 0;

    // Cross-team live comparison matrix for this hypothetical project
    const allTeamsComparison = [
      {
        id: 'global',
        name: 'Corporate Global Baseline',
        department: 'Organization-Wide',
        isCustom: false,
        salesRate: formState.globalSalesRate,
        recurringRate: formState.globalRecurringRate,
        effectiveRate: simClientType === 'new_client' ? formState.globalSalesRate : formState.globalRecurringRate,
        commission: Math.round((netCash * ((simClientType === 'new_client' ? formState.globalSalesRate : formState.globalRecurringRate) / 100)) * 100) / 100,
        bonus: isQualityPassed
          ? formState.serviceBonusMode === 'flat_dollar'
            ? simEarlyHours >= 72
              ? formState.globalServiceBonus72h
              : simEarlyHours >= 48
              ? formState.globalServiceBonus48h
              : simEarlyHours >= 24
              ? formState.globalServiceBonus24h
              : 0
            : Math.round(
                (simContractValue *
                  ((simEarlyHours >= 72
                    ? formState.globalServiceBonus72h
                    : simEarlyHours >= 48
                    ? formState.globalServiceBonus48h
                    : simEarlyHours >= 24
                    ? formState.globalServiceBonus24h
                    : 0) /
                    100)) *
                  100
              ) / 100
          : 0,
        membersCount: employees.length,
      },
      ...formState.teams.map((t) => {
        const usesCustom = t.useCustomRates;
        const salesRate = usesCustom && t.salesCommissionRatePercent !== undefined ? t.salesCommissionRatePercent : formState.globalSalesRate;
        const recRate = usesCustom && t.recurringClientRatePercent !== undefined ? t.recurringClientRatePercent : formState.globalRecurringRate;
        const effRate = simClientType === 'new_client' ? salesRate : recRate;
        const comm = Math.round((netCash * (effRate / 100)) * 100) / 100;
        let bonus = 0;
        if (isQualityPassed) {
          if (usesCustom && t.serviceBonusRatePercent !== undefined) {
            bonus = Math.round((simContractValue * (t.serviceBonusRatePercent / 100)) * 100) / 100;
          } else {
            const globalBonusRate =
              simEarlyHours >= 72
                ? formState.globalServiceBonus72h
                : simEarlyHours >= 48
                ? formState.globalServiceBonus48h
                : simEarlyHours >= 24
                ? formState.globalServiceBonus24h
                : 0;
            bonus =
              formState.serviceBonusMode === 'flat_dollar'
                ? globalBonusRate
                : Math.round((simContractValue * (globalBonusRate / 100)) * 100) / 100;
          }
        }
        return {
          id: t.id,
          name: t.name,
          department: t.department,
          isCustom: usesCustom,
          salesRate,
          recurringRate: recRate,
          effectiveRate: effRate,
          commission: comm,
          bonus,
          membersCount: t.members.length,
        };
      }),
    ].map((row) => {
      const total = row.commission + row.bonus;
      const effectivePct = simContractValue > 0 ? (total / simContractValue) * 100 : 0;
      const perEstimator = row.membersCount > 0 ? total / row.membersCount : total;
      return {
        ...row,
        total,
        effectivePct,
        perEstimator,
      };
    });

    return {
      selectedTeam,
      usesTeamOverrides,
      effectiveCommissionRate,
      effectiveSalesRate,
      effectiveRecurringRate,
      stripeFee,
      netCash,
      commissionAccrued,
      serviceBonusAmount,
      serviceBonusRateOrAmount,
      isQualityPassed,
      totalPayout,
      supplementalTax,
      netTakeHome,
      companyRetainedCash,
      companyRetainedPercent,
      effectiveIncentivePercent,
      allTeamsComparison,
    };
  };

  const simResult = calculateSandbox();

  return (
    <div className="space-y-6">
      {/* Top Header & Context */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#222a3d] pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#86948a] mb-1">
            <span>Corporate Governance</span>
            <span>/</span>
            <span>Compensation & Incentives</span>
            <span>/</span>
            <span className="text-[#4edea3] font-semibold">Commission Settings</span>
          </div>
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Commission & Incentive Settings</span>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[#4edea3]/10 border border-[#4edea3]/30 text-[#4edea3] font-semibold">
              v{formState.version || 1}.0 Active
            </span>
          </h1>
          <p className="text-xs text-[#86948a] mt-1 max-w-2xl">
            Configure corporate baseline commission percentages, per-team sales and recurring overrides, early service delivery speed incentives, and strict net cash collection rules.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs font-mono text-[#f59e0b] bg-[#f59e0b]/10 border border-[#f59e0b]/30 px-2.5 py-1 rounded-md animate-pulse">
              Unsaved changes
            </span>
          )}

          <button
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md bg-[#131b2e] hover:bg-[#1a233a] border border-[#222a3d] text-[#86948a] hover:text-white transition-colors cursor-pointer"
            title="Revert to corporate baseline defaults"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Defaults</span>
          </button>

          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md bg-[#4edea3] hover:bg-[#43c792] text-[#003824] shadow-[0_0_15px_rgba(78,222,163,0.25)] transition-all cursor-pointer font-sans"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save & Persist Rules</span>
          </button>
        </div>
      </div>

      {/* Success Notification Banner */}
      {saveSuccessNotice && (
        <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#4edea3]/15 border border-[#4edea3]/30 text-[#4edea3] text-xs animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium">{saveSuccessNotice}</span>
        </div>
      )}

      {/* KPI Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-3.5">
          <div className="flex items-center justify-between text-xs text-[#86948a] mb-1">
            <span>Global Sales Rate</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] font-semibold">New Client</span>
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {formState.globalSalesRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#86948a] mt-1">
            Calculated on net collected cash after Stripe fee
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-3.5">
          <div className="flex items-center justify-between text-xs text-[#86948a] mb-1">
            <span>Global Recurring Rate</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#38bdf8]/10 text-[#38bdf8] font-semibold">Existing Client</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#38bdf8]">
            {formState.globalRecurringRate.toFixed(1)}%
          </div>
          <div className="text-[11px] text-[#86948a] mt-1">
            Long-term account management & renewals
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-3.5">
          <div className="flex items-center justify-between text-xs text-[#86948a] mb-1">
            <span>Service Early Bonus</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#a78bfa]/10 text-[#a78bfa] font-semibold">QA Gated</span>
          </div>
          <div className="text-xl font-bold font-mono text-[#a78bfa]">
            {formState.serviceBonusMode === 'percentage'
              ? `${formState.globalServiceBonus24h}% - ${formState.globalServiceBonus72h}%`
              : `$${formState.globalServiceBonus24h} - $${formState.globalServiceBonus72h}`}
          </div>
          <div className="text-[11px] text-[#86948a] mt-1">
            Awarded for 24h-72h ahead of bid deadline
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-3.5">
          <div className="flex items-center justify-between text-xs text-[#86948a] mb-1">
            <span>Governed Teams</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#f59e0b]/10 text-[#f59e0b] font-semibold">Per-Team Rules</span>
          </div>
          <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
            <span>{formState.teams.length} Teams</span>
            <span className="text-xs font-normal text-[#86948a]">
              ({formState.teams.filter((t) => t.useCustomRates).length} custom)
            </span>
          </div>
          <div className="text-[11px] text-[#86948a] mt-1">
            Commercial, Civil & Infrastructure, MEP
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs & Presets */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#222a3d] pb-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('global')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-md text-xs font-medium transition-colors cursor-pointer border-b-2 ${
              activeSubTab === 'global'
                ? 'border-[#4edea3] text-white bg-[#131b2e]'
                : 'border-transparent text-[#86948a] hover:text-white hover:bg-[#131b2e]/50'
            }`}
          >
            <Sliders className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Global Commission Baseline</span>
          </button>

          <button
            onClick={() => setActiveSubTab('teams')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-md text-xs font-medium transition-colors cursor-pointer border-b-2 ${
              activeSubTab === 'teams'
                ? 'border-[#4edea3] text-white bg-[#131b2e]'
                : 'border-transparent text-[#86948a] hover:text-white hover:bg-[#131b2e]/50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#38bdf8]" />
            <span>Per-Team Overrides & Targets</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-bold">
              {formState.teams.length}
            </span>
          </button>

          <button
            id="subtab-simulator"
            onClick={() => setActiveSubTab('simulator')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-md text-xs font-medium transition-colors cursor-pointer border-b-2 ${
              activeSubTab === 'simulator'
                ? 'border-[#4edea3] text-white bg-[#131b2e]'
                : 'border-transparent text-[#86948a] hover:text-white hover:bg-[#131b2e]/50'
            }`}
          >
            <Calculator className="w-3.5 h-3.5 text-[#a78bfa]" />
            <span>Simulator</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#a78bfa]/15 text-[#a78bfa] font-bold">
              Instant
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('matrix')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-t-md text-xs font-medium transition-colors cursor-pointer border-b-2 ${
              activeSubTab === 'matrix'
                ? 'border-[#4edea3] text-white bg-[#131b2e]'
                : 'border-transparent text-[#86948a] hover:text-white hover:bg-[#131b2e]/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-[#f59e0b]" />
            <span>Policy Matrix & Audit Log</span>
          </button>
        </div>

        {/* Quick Preset Selector */}
        <div className="flex items-center gap-1.5 text-xs text-[#86948a]">
          <span className="text-[11px] font-mono">Quick Presets:</span>
          <button
            onClick={() => applyPreset('standard')}
            className="px-2 py-1 rounded bg-[#131b2e] hover:bg-[#1a233a] border border-[#222a3d] text-[#dae2fd] text-[11px] transition-colors cursor-pointer"
          >
            Corporate Standard
          </button>
          <button
            onClick={() => applyPreset('aggressive')}
            className="px-2 py-1 rounded bg-[#131b2e] hover:bg-[#1a233a] border border-[#222a3d] text-[#4edea3] text-[11px] transition-colors cursor-pointer"
          >
            Aggressive Growth (7%)
          </button>
          <button
            onClick={() => applyPreset('retention')}
            className="px-2 py-1 rounded bg-[#131b2e] hover:bg-[#1a233a] border border-[#222a3d] text-[#38bdf8] text-[11px] transition-colors cursor-pointer"
          >
            Client Retention
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* TAB 1: GLOBAL COMMISSION PERCENTAGES                      */}
      {/* ========================================================= */}
      {activeSubTab === 'global' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CARD 1: SALES & RECURRING COMMISSIONS */}
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#4edea3]/10 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3]">
                    <Percent className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Sales & Account Acquisition</h3>
                    <p className="text-[11px] text-[#86948a]">Baseline percentages applied when no team override is present</p>
                  </div>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] font-semibold">
                  Corporate Core
                </span>
              </div>

              {/* New Client Sales Rate */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#dae2fd] flex items-center gap-1.5">
                    <span>New Client Acquisition Commission</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#4edea3]/10 text-[#4edea3]">
                      Standard: 5.0%
                    </span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="20"
                      value={formState.globalSalesRate}
                      onChange={(e) => updateFormState((prev) => ({ ...prev, globalSalesRate: parseFloat(e.target.value) || 0 }))}
                      className="w-16 px-2 py-1 rounded bg-[#0b1326] border border-[#222a3d] text-right font-mono text-xs text-[#4edea3] font-bold focus:border-[#4edea3] focus:outline-none"
                    />
                    <span className="text-xs font-mono text-[#86948a]">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="15"
                  step="0.1"
                  value={formState.globalSalesRate}
                  onChange={(e) => updateFormState((prev) => ({ ...prev, globalSalesRate: parseFloat(e.target.value) }))}
                  className="w-full accent-[#4edea3] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#86948a]">
                  <span>0% (No commission)</span>
                  <span>5.0% (Corporate Target)</span>
                  <span>15.0% (High Growth Cap)</span>
                </div>
              </div>

              {/* Recurring Client Rate */}
              <div className="space-y-2 pt-2 border-t border-[#222a3d]/60">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#dae2fd] flex items-center gap-1.5">
                    <span>Recurring Client Account Commission</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#38bdf8]/10 text-[#38bdf8]">
                      Standard: 2.5%
                    </span>
                  </label>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="15"
                      value={formState.globalRecurringRate}
                      onChange={(e) => updateFormState((prev) => ({ ...prev, globalRecurringRate: parseFloat(e.target.value) || 0 }))}
                      className="w-16 px-2 py-1 rounded bg-[#0b1326] border border-[#222a3d] text-right font-mono text-xs text-[#38bdf8] font-bold focus:border-[#38bdf8] focus:outline-none"
                    />
                    <span className="text-xs font-mono text-[#86948a]">%</span>
                  </div>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10"
                  step="0.1"
                  value={formState.globalRecurringRate}
                  onChange={(e) => updateFormState((prev) => ({ ...prev, globalRecurringRate: parseFloat(e.target.value) }))}
                  className="w-full accent-[#38bdf8] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] font-mono text-[#86948a]">
                  <span>0%</span>
                  <span>2.5% (Retainer Target)</span>
                  <span>10.0%</span>
                </div>
              </div>

              {/* Stripe Deduction Toggle & Governance */}
              <div className="pt-3 border-t border-[#222a3d] space-y-3">
                <div className="flex items-start justify-between gap-3 p-3 rounded-md bg-[#0b1326] border border-[#222a3d]">
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5 text-[#4edea3]" />
                      <span>Deduct Stripe Processing Fees Before Commission</span>
                    </div>
                    <p className="text-[11px] text-[#86948a] mt-0.5">
                      Ensures commission is paid exclusively on actual collected cash into Chase Operating ••8491 (subtracting 2.9% + $0.30 CC or 0.8% ACH).
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={formState.deductStripeFees}
                      onChange={(e) => updateFormState((prev) => ({ ...prev, deductStripeFees: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#222a3d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4edea3]"></div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-[#86948a] block mb-1">Default Payment Method</label>
                    <select
                      value={formState.defaultPaymentMethod}
                      onChange={(e) => updateFormState((prev) => ({ ...prev, defaultPaymentMethod: e.target.value as any }))}
                      className="w-full px-2.5 py-1.5 rounded bg-[#0b1326] border border-[#222a3d] text-xs text-white focus:border-[#4edea3] focus:outline-none"
                    >
                      <option value="credit_card">Stripe Credit Card (2.9% + $0.30)</option>
                      <option value="ach_debit">Stripe ACH Debit (0.8% capped at $5)</option>
                      <option value="wire_transfer">Bank Wire Transfer (0% fee)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-[#86948a] block mb-1">Clawback Protection Window</label>
                    <select
                      value={formState.clawbackWindowDays}
                      onChange={(e) => updateFormState((prev) => ({ ...prev, clawbackWindowDays: parseInt(e.target.value) || 90 }))}
                      className="w-full px-2.5 py-1.5 rounded bg-[#0b1326] border border-[#222a3d] text-xs text-white focus:border-[#4edea3] focus:outline-none"
                    >
                      <option value={30}>30 Days (Accelerated)</option>
                      <option value={60}>60 Days (Standard)</option>
                      <option value={90}>90 Days (Corporate Policy)</option>
                      <option value={120}>120 Days (Strict Contract)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* CARD 2: SERVICE EXPEDITED DELIVERY BONUSES */}
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#a78bfa]/10 border border-[#a78bfa]/30 flex items-center justify-center text-[#a78bfa]">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Service Expedited Delivery Bonuses</h3>
                    <p className="text-[11px] text-[#86948a]">Incentivizing rapid turnaround ahead of client bid submission deadline</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 bg-[#0b1326] p-0.5 rounded border border-[#222a3d]">
                  <button
                    onClick={() => updateFormState((prev) => ({ ...prev, serviceBonusMode: 'percentage' }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      formState.serviceBonusMode === 'percentage'
                        ? 'bg-[#a78bfa] text-[#131b2e]'
                        : 'text-[#86948a] hover:text-white'
                    }`}
                  >
                    % Contract
                  </button>
                  <button
                    onClick={() => updateFormState((prev) => ({ ...prev, serviceBonusMode: 'flat_dollar' }))}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer ${
                      formState.serviceBonusMode === 'flat_dollar'
                        ? 'bg-[#a78bfa] text-[#131b2e]'
                        : 'text-[#86948a] hover:text-white'
                    }`}
                  >
                    $ Flat
                  </button>
                </div>
              </div>

              {/* 24-Hour Tier */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#dae2fd] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#4edea3]" />
                    <span>24-Hour Early Turnaround Tier</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step={formState.serviceBonusMode === 'percentage' ? '0.1' : '50'}
                      value={formState.globalServiceBonus24h}
                      onChange={(e) => updateFormState((prev) => ({ ...prev, globalServiceBonus24h: parseFloat(e.target.value) || 0 }))}
                      className="w-20 px-2 py-1 rounded bg-[#0b1326] border border-[#222a3d] text-right font-mono text-xs text-[#a78bfa] font-bold focus:border-[#a78bfa] focus:outline-none"
                    />
                    <span className="text-xs font-mono text-[#86948a]">
                      {formState.serviceBonusMode === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#86948a]">Delivered & validated 24 to 47 hours ahead of client bid deadline.</p>
              </div>

              {/* 48-Hour Tier */}
              <div className="space-y-1.5 pt-2 border-t border-[#222a3d]/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#dae2fd] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>48-Hour Early Turnaround Tier</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step={formState.serviceBonusMode === 'percentage' ? '0.1' : '50'}
                      value={formState.globalServiceBonus48h}
                      onChange={(e) => updateFormState((prev) => ({ ...prev, globalServiceBonus48h: parseFloat(e.target.value) || 0 }))}
                      className="w-20 px-2 py-1 rounded bg-[#0b1326] border border-[#222a3d] text-right font-mono text-xs text-[#a78bfa] font-bold focus:border-[#a78bfa] focus:outline-none"
                    />
                    <span className="text-xs font-mono text-[#86948a]">
                      {formState.serviceBonusMode === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#86948a]">Delivered & validated 48 to 71 hours ahead of client bid deadline.</p>
              </div>

              {/* 72-Hour Tier */}
              <div className="space-y-1.5 pt-2 border-t border-[#222a3d]/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#dae2fd] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#f59e0b]" />
                    <span>72-Hour Accelerated Turnaround Tier</span>
                  </span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      step={formState.serviceBonusMode === 'percentage' ? '0.1' : '50'}
                      value={formState.globalServiceBonus72h}
                      onChange={(e) => updateFormState((prev) => ({ ...prev, globalServiceBonus72h: parseFloat(e.target.value) || 0 }))}
                      className="w-20 px-2 py-1 rounded bg-[#0b1326] border border-[#222a3d] text-right font-mono text-xs text-[#a78bfa] font-bold focus:border-[#a78bfa] focus:outline-none"
                    />
                    <span className="text-xs font-mono text-[#86948a]">
                      {formState.serviceBonusMode === 'percentage' ? '%' : '$'}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-[#86948a]">Maximum speed bonus for 72+ hours early takeoff release.</p>
              </div>

              {/* QA Quality Assurance Gate */}
              <div className="pt-3 border-t border-[#222a3d] space-y-3">
                <div className="flex items-start justify-between gap-3 p-3 rounded-md bg-[#0b1326] border border-[#222a3d]">
                  <div>
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3]" />
                      <span>Quality Assurance Zero-Defect Floor</span>
                    </div>
                    <p className="text-[11px] text-[#86948a] mt-0.5">
                      Disqualifies speed bonuses if any addenda discrepancies or takeoff errors are detected during 4-point QA review.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer mt-1">
                    <input
                      type="checkbox"
                      checked={formState.requireZeroQaErrors}
                      onChange={(e) => updateFormState((prev) => ({ ...prev, requireZeroQaErrors: e.target.checked }))}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#222a3d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4edea3]"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Workflow Callout Box */}
          <div className="p-4 rounded-lg bg-[#131b2e] border border-[#222a3d] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-md bg-[#4edea3]/10 border border-[#4edea3]/30 flex items-center justify-center text-[#4edea3] flex-shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">How Global Baseline Percentages Propagate</h4>
                <p className="text-[11px] text-[#86948a] mt-0.5 max-w-3xl leading-relaxed">
                  When estimators or sales managers generate bids, the system automatically checks if the assigned team has custom overrides enabled. If disabled, these global baseline rates apply unconditionally. When custom overrides are enabled, the team's rates take legal precedence for project compensation and payroll distribution.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveSubTab('teams')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#1f2b48] hover:bg-[#28375c] border border-[#222a3d] text-xs text-[#dae2fd] font-medium transition-colors cursor-pointer flex-shrink-0"
            >
              <span>Manage Per-Team Overrides</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#38bdf8]" />
            </button>
          </div>

          {/* Quick Simulator Preview Strip */}
          <div className="p-4 rounded-lg bg-gradient-to-r from-[#131b2e] to-[#172036] border border-[#a78bfa]/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#a78bfa]/15 border border-[#a78bfa]/40 flex items-center justify-center text-[#a78bfa] flex-shrink-0">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold text-white">Instant Project Commission Simulator</h4>
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#a78bfa]/20 text-[#a78bfa] font-bold">
                    LIVE PREVIEW
                  </span>
                </div>
                <p className="text-[11px] text-[#86948a] mt-0.5">
                  Test hypothetical contract values instantly against the active baseline ({formState.globalSalesRate}% Sales / {formState.globalRecurringRate}% Recurring).
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 bg-[#0b1326] px-3 py-1.5 rounded border border-[#222a3d]">
                <span className="text-xs text-[#86948a] font-mono">$</span>
                <input
                  type="number"
                  step="5000"
                  value={simContractValue}
                  onChange={(e) => setSimContractValue(parseFloat(e.target.value) || 0)}
                  className="w-24 bg-transparent text-xs font-mono font-bold text-white focus:outline-none"
                  placeholder="100000"
                />
                <span className="text-[10px] text-[#86948a]">project</span>
              </div>

              <div className="flex items-center gap-3 px-3 py-1.5 rounded bg-[#0b1326] border border-[#222a3d] text-xs">
                <div>
                  <span className="text-[10px] text-[#86948a] block">Calculated Commission</span>
                  <span className="font-mono text-xs font-bold text-[#4edea3]">
                    ${Math.round(simContractValue * (formState.globalSalesRate / 100)).toLocaleString()}
                  </span>
                </div>
                <div className="w-[1px] h-6 bg-[#222a3d]" />
                <div>
                  <span className="text-[10px] text-[#86948a] block">Gross Margin</span>
                  <span className="font-mono text-xs font-bold text-white">
                    ${Math.round(simContractValue * (1 - formState.globalSalesRate / 100)).toLocaleString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveSubTab('simulator')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#a78bfa] hover:bg-[#906ef5] text-[#131b2e] text-xs font-bold transition-colors cursor-pointer ml-auto lg:ml-0"
              >
                <span>Open Full Simulator Section</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 2: PER-TEAM COMMISSION PERCENTAGES & TARGETS          */}
      {/* ========================================================= */}
      {activeSubTab === 'teams' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#131b2e] p-4 rounded-lg border border-[#222a3d]">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#38bdf8]" />
                <span>Pre-Construction Team Compensation Roster</span>
              </h3>
              <p className="text-xs text-[#86948a] mt-0.5">
                Define specialized commission percentages and bonus targets for each operational estimating team.
              </p>
            </div>
            <button
              onClick={() => setIsAddTeamModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#38bdf8] hover:bg-[#0284c7] text-[#082f49] font-bold text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Estimating Team</span>
            </button>
          </div>

          {/* Teams Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {formState.teams.map((team) => {
              const progressPct = Math.min(100, Math.round((team.currentAchievedAmount / team.targetAmount) * 100));
              const isTargetMet = team.currentAchievedAmount >= team.targetAmount;

              return (
                <div
                  key={team.id}
                  className={`bg-[#131b2e] border rounded-lg p-5 flex flex-col justify-between space-y-4 transition-all ${
                    team.useCustomRates ? 'border-[#38bdf8]/40 shadow-[0_0_15px_rgba(56,189,248,0.05)]' : 'border-[#222a3d]'
                  }`}
                >
                  <div>
                    {/* Team Header */}
                    <div className="flex items-start justify-between gap-2 border-b border-[#222a3d] pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white">{team.name}</h4>
                        </div>
                        <div className="text-[11px] font-mono text-[#86948a]">{team.department}</div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="p-1 rounded text-[#86948a] hover:text-[#ffb4ab] transition-colors cursor-pointer"
                          title="Delete team"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Custom Rates Toggle Switch */}
                    <div className="flex items-center justify-between p-2.5 rounded bg-[#0b1326] border border-[#222a3d] my-3">
                      <div>
                        <div className="text-xs font-semibold text-white">Custom Commission Rates</div>
                        <div className="text-[10px] text-[#86948a]">
                          {team.useCustomRates ? 'Team overrides active' : 'Inheriting global baseline'}
                        </div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={team.useCustomRates || false}
                          onChange={() => handleToggleTeamCustomRates(team.id)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-[#222a3d] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[1px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-[#38bdf8]"></div>
                      </label>
                    </div>

                    {/* Per-Team Commission Rates Section */}
                    {team.useCustomRates ? (
                      <div className="p-3 rounded bg-[#0b1326]/60 border border-[#38bdf8]/30 space-y-3 mb-4">
                        <div className="text-[11px] font-bold text-[#38bdf8] uppercase tracking-wider font-mono flex items-center justify-between">
                          <span>Team-Specific Percentages</span>
                          <span className="text-[10px] text-[#86948a] lowercase font-normal">override</span>
                        </div>

                        {/* Team Sales Commission % */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#dae2fd]">Sales Commission:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              value={team.salesCommissionRatePercent ?? formState.globalSalesRate}
                              onChange={(e) =>
                                handleUpdateTeamRate(team.id, 'salesCommissionRatePercent', parseFloat(e.target.value) || 0)
                              }
                              className="w-14 px-1.5 py-0.5 rounded bg-[#131b2e] border border-[#222a3d] text-right font-mono text-xs text-[#4edea3] font-bold focus:border-[#4edea3] focus:outline-none"
                            />
                            <span className="text-xs font-mono text-[#86948a]">%</span>
                          </div>
                        </div>

                        {/* Team Recurring Client % */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#dae2fd]">Recurring Client:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              value={team.recurringClientRatePercent ?? formState.globalRecurringRate}
                              onChange={(e) =>
                                handleUpdateTeamRate(team.id, 'recurringClientRatePercent', parseFloat(e.target.value) || 0)
                              }
                              className="w-14 px-1.5 py-0.5 rounded bg-[#131b2e] border border-[#222a3d] text-right font-mono text-xs text-[#38bdf8] font-bold focus:border-[#38bdf8] focus:outline-none"
                            />
                            <span className="text-xs font-mono text-[#86948a]">%</span>
                          </div>
                        </div>

                        {/* Team Service Bonus % */}
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#dae2fd]">Service Speed Bonus:</span>
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              step="0.1"
                              value={team.serviceBonusRatePercent ?? formState.globalServiceBonus24h}
                              onChange={(e) =>
                                handleUpdateTeamRate(team.id, 'serviceBonusRatePercent', parseFloat(e.target.value) || 0)
                              }
                              className="w-14 px-1.5 py-0.5 rounded bg-[#131b2e] border border-[#222a3d] text-right font-mono text-xs text-[#a78bfa] font-bold focus:border-[#a78bfa] focus:outline-none"
                            />
                            <span className="text-xs font-mono text-[#86948a]">%</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 rounded bg-[#0b1326]/30 border border-[#222a3d] text-[11px] text-[#86948a] space-y-1 mb-4">
                        <div className="flex justify-between">
                          <span>Sales Rate:</span>
                          <span className="font-mono text-white">{formState.globalSalesRate}% (Global)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Recurring Rate:</span>
                          <span className="font-mono text-white">{formState.globalRecurringRate}% (Global)</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Service Bonus:</span>
                          <span className="font-mono text-white">
                            {formState.serviceBonusMode === 'percentage'
                              ? `${formState.globalServiceBonus24h}% - ${formState.globalServiceBonus72h}%`
                              : `$${formState.globalServiceBonus24h} - $${formState.globalServiceBonus72h}`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Team Target & Bonus Pool */}
                    <div className="space-y-2 pt-2 border-t border-[#222a3d]">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#86948a]">Target Milestone:</span>
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-white">
                          <span>$</span>
                          <input
                            type="number"
                            step="10000"
                            value={team.targetAmount}
                            onChange={(e) => handleUpdateTeamRate(team.id, 'targetAmount', parseInt(e.target.value) || 0)}
                            className="w-20 px-1 py-0.5 rounded bg-[#0b1326] border border-[#222a3d] text-right font-mono text-xs text-white focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div>
                        <div className="flex justify-between text-[10px] font-mono text-[#86948a] mb-1">
                          <span>Progress: ${team.currentAchievedAmount.toLocaleString()}</span>
                          <span className={isTargetMet ? 'text-[#4edea3] font-bold' : 'text-[#dae2fd]'}>
                            {progressPct}% {isTargetMet ? '(Unlocked)' : ''}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-[#0b1326] overflow-hidden">
                          <div
                            className={`h-full rounded-full ${isTargetMet ? 'bg-[#4edea3]' : 'bg-[#38bdf8]'}`}
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <span className="text-[#86948a]">Bonus Pool:</span>
                        <div className="flex items-center gap-1 font-mono text-xs font-bold text-[#4edea3]">
                          <span>$</span>
                          <input
                            type="number"
                            step="500"
                            value={team.bonusPoolAmount}
                            onChange={(e) => handleUpdateTeamRate(team.id, 'bonusPoolAmount', parseInt(e.target.value) || 0)}
                            className="w-16 px-1 py-0.5 rounded bg-[#0b1326] border border-[#222a3d] text-right font-mono text-xs text-[#4edea3] focus:outline-none"
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs">
                        <span className="text-[#86948a]">Split Mode:</span>
                        <select
                          value={team.splitType}
                          onChange={(e) => handleUpdateTeamRate(team.id, 'splitType', e.target.value as any)}
                          className="px-2 py-0.5 rounded bg-[#0b1326] border border-[#222a3d] text-[11px] text-white focus:outline-none"
                        >
                          <option value="equal_split">Equal Split</option>
                          <option value="hours_weighted">Hours-Weighted</option>
                        </select>
                      </div>
                    </div>

                    {/* Team Members List */}
                    <div className="pt-3 border-t border-[#222a3d] space-y-2">
                      <div className="flex items-center justify-between text-xs font-semibold text-[#dae2fd]">
                        <span>Assigned Estimators ({team.members.length})</span>
                      </div>

                      <div className="space-y-1 max-h-32 overflow-y-auto pr-1">
                        {team.members.map((m) => (
                          <div
                            key={m.employeeId}
                            className="flex items-center justify-between px-2 py-1 rounded bg-[#0b1326] border border-[#222a3d] text-[11px]"
                          >
                            <div className="truncate pr-1">
                              <span className="font-medium text-white">{m.employeeName}</span>
                              <span className="text-[#86948a] ml-1 text-[10px]">({m.role})</span>
                            </div>
                            <button
                              onClick={() => handleRemoveMemberFromTeam(team.id, m.employeeId)}
                              className="text-[#86948a] hover:text-[#ffb4ab] transition-colors flex-shrink-0 cursor-pointer"
                              title="Remove estimator"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Add Member Dropdown */}
                      <div className="pt-1">
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              handleAddMemberToTeam(team.id, e.target.value);
                              e.target.value = '';
                            }
                          }}
                          defaultValue=""
                          className="w-full px-2 py-1 rounded bg-[#0b1326] border border-[#222a3d] text-[11px] text-[#86948a] hover:text-white focus:outline-none cursor-pointer"
                        >
                          <option value="" disabled>
                            + Assign Employee to Team...
                          </option>
                          {employees
                            .filter((emp) => !team.members.some((m) => m.employeeId === emp.id))
                            .map((emp) => (
                              <option key={emp.id} value={emp.id}>
                                {emp.name} — {emp.role}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 3: LIVE COMMISSION & INCENTIVE SIMULATOR              */}
      {/* ========================================================= */}
      {activeSubTab === 'simulator' && (
        <div id="section-simulator" className="space-y-6">
          {/* Executive Top KPI Metric Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
              <div className="flex items-center justify-between text-xs text-[#86948a] mb-1">
                <span>Hypothetical Project</span>
                <DollarSign className="w-3.5 h-3.5 text-[#38bdf8]" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                ${simContractValue.toLocaleString()}
              </div>
              <div className="text-[11px] text-[#86948a] mt-1 flex items-center gap-1">
                <span className="text-[#38bdf8] font-semibold">{simClientType === 'new_client' ? 'New Client' : 'Recurring'}</span>
                <span>•</span>
                <span>{simResult.selectedTeam ? simResult.selectedTeam.name : 'Global Baseline'}</span>
              </div>
            </div>

            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
              <div className="flex items-center justify-between text-xs text-[#86948a] mb-1">
                <span>Net Commissionable Base</span>
                <CreditCard className="w-3.5 h-3.5 text-[#dae2fd]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#dae2fd]">
                ${simResult.netCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-[#86948a] mt-1">
                Less ${simResult.stripeFee.toFixed(2)} gateway fee
              </div>
            </div>

            <div className="bg-[#131b2e] border border-[#4edea3]/30 bg-gradient-to-br from-[#131b2e] to-[#4edea3]/5 rounded-lg p-4">
              <div className="flex items-center justify-between text-xs text-[#86948a] mb-1">
                <span className="text-[#4edea3] font-semibold">Total Calculated Incentive</span>
                <Zap className="w-3.5 h-3.5 text-[#4edea3]" />
              </div>
              <div className="text-xl font-bold font-mono text-[#4edea3]">
                ${simResult.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-[#86948a] mt-1 flex items-center gap-1.5">
                <span className="font-mono font-bold text-[#4edea3]">{simResult.effectiveIncentivePercent.toFixed(2)}%</span>
                <span>effective rate</span>
              </div>
            </div>

            <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
              <div className="flex items-center justify-between text-xs text-[#86948a] mb-1">
                <span>Company Retained Cash</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#a78bfa]" />
              </div>
              <div className="text-xl font-bold font-mono text-white">
                ${simResult.companyRetainedCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-[#86948a] mt-1 flex items-center gap-1.5">
                <span className="font-mono font-bold text-[#a78bfa]">{simResult.companyRetainedPercent.toFixed(1)}%</span>
                <span>gross retained margin</span>
              </div>
            </div>
          </div>

          {/* Main Two-Column Simulator Interactive Sandbox */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* SIMULATOR INPUTS (Left 6 Cols) */}
            <div className="lg:col-span-6 bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 space-y-5">
              <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-[#a78bfa]/10 border border-[#a78bfa]/30 flex items-center justify-center text-[#a78bfa]">
                    <Calculator className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Hypothetical Project Parameters</h3>
                    <p className="text-[11px] text-[#86948a]">Input project value and operational conditions to calculate payouts instantly</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSimContractValue(100000);
                    setSimClientType('new_client');
                    setSimTeamId('global');
                    setSimEarlyHours(48);
                    setSimPaymentMethod('credit_card');
                    setSimQaErrors(0);
                  }}
                  className="text-[10px] font-mono px-2 py-1 rounded bg-[#1f2b48] hover:bg-[#28375c] text-[#86948a] hover:text-white transition-colors cursor-pointer border border-[#222a3d] flex items-center gap-1"
                  title="Reset simulator inputs to standard benchmark"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset $100k Benchmark</span>
                </button>
              </div>

              {/* Hypothetical Project Amount Input */}
              <div className="space-y-3 bg-[#0b1326] p-4 rounded-lg border border-[#222a3d]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-[#4edea3]" />
                    <span>Hypothetical Project Contract Amount</span>
                  </label>
                  <span className="text-[11px] font-mono text-[#4edea3] font-bold">
                    ${simContractValue.toLocaleString()} USD
                  </span>
                </div>

                {/* Primary Number Input & Step Buttons */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3.5 top-2.5 text-sm font-mono text-[#86948a] font-bold">$</span>
                    <input
                      id="hypothetical-project-amount-input"
                      type="number"
                      min="1000"
                      max="5000000"
                      step="5000"
                      value={simContractValue}
                      onChange={(e) => setSimContractValue(Math.max(0, parseFloat(e.target.value) || 0))}
                      className="w-full pl-8 pr-3 py-2 rounded-md bg-[#131b2e] border border-[#222a3d] text-base font-mono font-bold text-white focus:border-[#4edea3] focus:outline-none transition-colors"
                      placeholder="Enter project amount..."
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setSimContractValue((prev) => Math.max(0, prev - 25000))}
                      className="px-2 py-2 rounded bg-[#131b2e] hover:bg-[#1f2b48] border border-[#222a3d] text-xs font-mono text-[#86948a] hover:text-white transition-colors cursor-pointer"
                      title="Decrease by $25,000"
                    >
                      -$25k
                    </button>
                    <button
                      onClick={() => setSimContractValue((prev) => Math.max(0, prev - 5000))}
                      className="px-2 py-2 rounded bg-[#131b2e] hover:bg-[#1f2b48] border border-[#222a3d] text-xs font-mono text-[#86948a] hover:text-white transition-colors cursor-pointer"
                      title="Decrease by $5,000"
                    >
                      -$5k
                    </button>
                    <button
                      onClick={() => setSimContractValue((prev) => prev + 5000)}
                      className="px-2 py-2 rounded bg-[#131b2e] hover:bg-[#1f2b48] border border-[#222a3d] text-xs font-mono text-[#4edea3] hover:text-white transition-colors cursor-pointer"
                      title="Increase by $5,000"
                    >
                      +$5k
                    </button>
                    <button
                      onClick={() => setSimContractValue((prev) => prev + 25000)}
                      className="px-2 py-2 rounded bg-[#131b2e] hover:bg-[#1f2b48] border border-[#222a3d] text-xs font-mono text-[#4edea3] hover:text-white transition-colors cursor-pointer"
                      title="Increase by $25,000"
                    >
                      +$25k
                    </button>
                  </div>
                </div>

                {/* Range Slider for Fluid Tactile Feedback */}
                <div className="space-y-1 pt-1">
                  <input
                    type="range"
                    min="5000"
                    max="1000000"
                    step="5000"
                    value={Math.min(1000000, simContractValue)}
                    onChange={(e) => setSimContractValue(parseFloat(e.target.value) || 5000)}
                    className="w-full accent-[#4edea3] h-1.5 bg-[#131b2e] rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] font-mono text-[#86948a]">
                    <span>$5k</span>
                    <span>$100k</span>
                    <span>$250k</span>
                    <span>$500k</span>
                    <span>$1M+</span>
                  </div>
                </div>

                {/* Quick Preset Badges */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#86948a] mr-1">Quick Benchmarks:</span>
                  {[
                    { label: '$25k Takeoff', val: 25000 },
                    { label: '$50k Commercial', val: 50000 },
                    { label: '$100k Core Bid', val: 100000 },
                    { label: '$250k Enterprise', val: 250000 },
                    { label: '$500k Major Project', val: 500000 },
                    { label: '$1M Mega JV', val: 1000000 },
                  ].map((preset) => (
                    <button
                      key={preset.val}
                      onClick={() => setSimContractValue(preset.val)}
                      className={`px-2 py-1 rounded text-[11px] font-mono transition-colors cursor-pointer border ${
                        simContractValue === preset.val
                          ? 'bg-[#4edea3]/20 border-[#4edea3]/40 text-[#4edea3] font-bold'
                          : 'bg-[#131b2e] border-[#222a3d] text-[#86948a] hover:text-white'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mode Switcher: Global Baseline vs Per-Team Overrides */}
              <div className="space-y-2.5 bg-[#0b1326] p-3.5 rounded-lg border border-[#222a3d]">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[#dae2fd] flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#38bdf8]" />
                    <span>Simulator Calculation Mode</span>
                  </label>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131b2e] border border-[#222a3d] text-[#86948a] transition-colors duration-200">
                    {simTeamId === 'global' ? 'Global Baseline Mode' : 'Per-Team Override Mode'}
                  </span>
                </div>

                {/* Animated Segmented Pill Mode Switcher */}
                <div className="relative flex rounded-lg bg-[#131b2e] p-1 border border-[#222a3d] select-none">
                  {/* Global Baseline Button */}
                  <button
                    type="button"
                    onClick={() => setSimTeamId('global')}
                    className={`relative flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all duration-200 z-10 flex items-center justify-center gap-2 cursor-pointer ${
                      simTeamId === 'global' ? 'text-white font-bold' : 'text-[#86948a] hover:text-[#dae2fd]'
                    }`}
                  >
                    <Building2 className={`w-3.5 h-3.5 transition-colors duration-200 ${simTeamId === 'global' ? 'text-[#4edea3]' : ''}`} />
                    <span>Global Baseline</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-all duration-200 ${
                      simTeamId === 'global' ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold' : 'bg-[#0b1326] text-[#86948a]'
                    }`}>
                      {formState.globalSalesRate}% / {formState.globalRecurringRate}%
                    </span>
                    {simTeamId === 'global' && (
                      <motion.div
                        layoutId="simModeActivePill"
                        className="absolute inset-0 bg-[#1f2b48] border border-[#4edea3]/50 rounded-md shadow-sm -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                  </button>

                  {/* Per-Team Override Button */}
                  <button
                    type="button"
                    onClick={() => {
                      if (simTeamId === 'global') {
                        const targetTeam = lastSelectedTeamId && formState.teams.some((t) => t.id === lastSelectedTeamId)
                          ? lastSelectedTeamId
                          : formState.teams[0]?.id || 'team-1';
                        setSimTeamId(targetTeam);
                      }
                    }}
                    className={`relative flex-1 py-2 px-3 text-xs font-medium rounded-md transition-all duration-200 z-10 flex items-center justify-center gap-2 cursor-pointer ${
                      simTeamId !== 'global' ? 'text-white font-bold' : 'text-[#86948a] hover:text-[#dae2fd]'
                    }`}
                  >
                    <Users className={`w-3.5 h-3.5 transition-colors duration-200 ${simTeamId !== 'global' ? 'text-[#38bdf8]' : ''}`} />
                    <span>Per-Team Overrides</span>
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded transition-all duration-200 ${
                      simTeamId !== 'global' ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold' : 'bg-[#0b1326] text-[#86948a]'
                    }`}>
                      {formState.teams.filter((t) => t.useCustomRates).length} Custom Teams
                    </span>
                    {simTeamId !== 'global' && (
                      <motion.div
                        layoutId="simModeActivePill"
                        className="absolute inset-0 bg-[#1f2b48] border border-[#38bdf8]/50 rounded-md shadow-sm -z-10"
                        transition={{ type: 'spring', stiffness: 450, damping: 35 }}
                      />
                    )}
                  </button>
                </div>

                {/* Smooth Animated Context Card based on active Mode */}
                <AnimatePresence mode="wait">
                  {simTeamId === 'global' ? (
                    <motion.div
                      key="global-mode-details"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="p-2.5 rounded-md bg-[#131b2e]/70 border border-[#4edea3]/20 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#4edea3] animate-pulse flex-shrink-0" />
                        <span className="text-[#dae2fd] text-[11px]">
                          Corporate uniform rates apply to all non-overridden projects: <strong className="text-[#4edea3]">{formState.globalSalesRate}%</strong> (New) / <strong className="text-[#4edea3]">{formState.globalRecurringRate}%</strong> (Recurring).
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-[#4edea3] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-[#4edea3]/10 border border-[#4edea3]/30 flex-shrink-0">
                        Baseline Active
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="per-team-mode-details"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="space-y-2 pt-0.5"
                    >
                      <div className="flex items-center justify-between text-[11px] text-[#86948a]">
                        <span>Select pre-construction estimating team:</span>
                        <span className="text-[#38bdf8] font-mono font-semibold">
                          {simResult.selectedTeam?.useCustomRates ? 'Custom Overrides Active' : 'Inheriting Global Rates'}
                        </span>
                      </div>

                      {/* Interactive Team Quick-Select Badges */}
                      <div className="flex flex-wrap gap-1.5">
                        {formState.teams.map((t) => {
                          const isSelected = simTeamId === t.id;
                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => {
                                setSimTeamId(t.id);
                                setLastSelectedTeamId(t.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-md text-xs transition-all duration-200 cursor-pointer flex items-center gap-1.5 border ${
                                isSelected
                                  ? 'bg-[#38bdf8]/20 border-[#38bdf8]/50 text-white font-bold shadow-sm'
                                  : 'bg-[#131b2e] border-[#222a3d] text-[#86948a] hover:text-[#dae2fd] hover:border-[#38bdf8]/30'
                              }`}
                            >
                              <span className={`w-1.5 h-1.5 rounded-full transition-colors ${isSelected ? 'bg-[#38bdf8]' : 'bg-[#86948a]/40'}`} />
                              <span>{t.name}</span>
                              {t.useCustomRates ? (
                                <span className="text-[10px] font-mono text-[#38bdf8] font-semibold">
                                  ({t.salesCommissionRatePercent}%)
                                </span>
                              ) : (
                                <span className="text-[10px] text-[#86948a] font-mono">
                                  (Global)
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Client Type & Assigned Team */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#dae2fd] block mb-1.5">Client Relationship</label>
                  <div className="grid grid-cols-2 gap-1.5 bg-[#0b1326] p-1 rounded-md border border-[#222a3d]">
                    <button
                      type="button"
                      onClick={() => setSimClientType('new_client')}
                      className={`py-1.5 px-2 rounded text-xs font-medium transition-all duration-200 cursor-pointer text-center ${
                        simClientType === 'new_client'
                          ? 'bg-[#4edea3]/20 text-[#4edea3] font-bold border border-[#4edea3]/30 shadow-xs'
                          : 'text-[#86948a] hover:text-white'
                      }`}
                    >
                      New Client
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimClientType('recurring_client')}
                      className={`py-1.5 px-2 rounded text-xs font-medium transition-all duration-200 cursor-pointer text-center ${
                        simClientType === 'recurring_client'
                          ? 'bg-[#38bdf8]/20 text-[#38bdf8] font-bold border border-[#38bdf8]/30 shadow-xs'
                          : 'text-[#86948a] hover:text-white'
                      }`}
                    >
                      Recurring
                    </button>
                  </div>
                  <p className="text-[10px] text-[#86948a] mt-1">
                    {simClientType === 'new_client'
                      ? `Applies acquisition rate (${simResult.effectiveSalesRate.toFixed(1)}%)`
                      : `Applies recurring retention rate (${simResult.effectiveRecurringRate.toFixed(1)}%)`}
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#dae2fd] block mb-1.5">
                    {simTeamId === 'global' ? 'Baseline Scope' : 'Active Estimating Team'}
                  </label>
                  <select
                    value={simTeamId}
                    onChange={(e) => {
                      setSimTeamId(e.target.value);
                      if (e.target.value !== 'global') {
                        setLastSelectedTeamId(e.target.value);
                      }
                    }}
                    className="w-full px-2.5 py-2 rounded-md bg-[#0b1326] border border-[#222a3d] text-xs text-white focus:border-[#38bdf8] focus:outline-none transition-colors"
                  >
                    <option value="global">Corporate Global Baseline (Default)</option>
                    {formState.teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.useCustomRates ? `Custom: ${t.salesCommissionRatePercent}%` : 'Uses Global'})
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-[#86948a] mt-1 transition-colors duration-200">
                    {simResult.usesTeamOverrides ? 'Using team custom rate overrides' : 'Using global company baseline'}
                  </p>
                </div>
              </div>

              {/* Payment Gateway Channel & Delivery Speed */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#dae2fd] block mb-1.5">Payment Method (Gateway Fee)</label>
                  <select
                    value={simPaymentMethod}
                    onChange={(e) => setSimPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-2 rounded-md bg-[#0b1326] border border-[#222a3d] text-xs text-white focus:border-[#4edea3] focus:outline-none"
                  >
                    <option value="credit_card">Stripe Credit Card (2.9% + $0.30)</option>
                    <option value="ach_debit">Stripe ACH Direct (0.8% cap $5)</option>
                    <option value="wire_transfer">Direct Bank Wire / Check (0% fee)</option>
                  </select>
                  <p className="text-[10px] text-[#86948a] mt-1">
                    Fee deducted: <span className="font-mono text-white font-semibold">${simResult.stripeFee.toFixed(2)}</span>
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#dae2fd] block mb-1.5">Turnaround Speed Ahead of Bid</label>
                  <select
                    value={simEarlyHours}
                    onChange={(e) => setSimEarlyHours(parseInt(e.target.value) || 0)}
                    className="w-full px-2.5 py-2 rounded-md bg-[#0b1326] border border-[#222a3d] text-xs text-white focus:border-[#a78bfa] focus:outline-none"
                  >
                    <option value={0}>Standard On-Time (0h bonus)</option>
                    <option value={24}>24 Hours Early (+Tier 1 Bonus)</option>
                    <option value={48}>48 Hours Early (+Tier 2 Bonus)</option>
                    <option value={72}>72 Hours Early (+Tier 3 Max Bonus)</option>
                  </select>
                  <p className="text-[10px] text-[#86948a] mt-1">
                    Service Bonus: <span className="font-mono text-[#a78bfa] font-semibold">${simResult.serviceBonusAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                  </p>
                </div>
              </div>

              {/* QA Quality Gate */}
              <div className="bg-[#0b1326] p-3.5 rounded-lg border border-[#222a3d] flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#4edea3]" />
                    <span>Quality Assurance Addenda Audit</span>
                  </div>
                  <p className="text-[11px] text-[#86948a] mt-0.5">
                    {formState.requireZeroQaErrors
                      ? 'Corporate rule requires 0 QA defects to unlock expedited service bonus.'
                      : 'Zero-defect gate currently advisory.'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSimQaErrors(0)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer border ${
                      simQaErrors === 0
                        ? 'bg-[#4edea3]/20 border-[#4edea3]/40 text-[#4edea3]'
                        : 'bg-[#131b2e] border-[#222a3d] text-[#86948a] hover:text-white'
                    }`}
                  >
                    0 Defects (Pass)
                  </button>
                  <button
                    onClick={() => setSimQaErrors(1)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer border ${
                      simQaErrors > 0
                        ? 'bg-[#ffb4ab]/20 border-[#ffb4ab]/40 text-[#ffb4ab]'
                        : 'bg-[#131b2e] border-[#222a3d] text-[#86948a] hover:text-white'
                    }`}
                  >
                    Defects Detected
                  </button>
                </div>
              </div>
            </div>

            {/* SIMULATION BREAKDOWN OUTPUT (Right 6 Cols) */}
            <div className="lg:col-span-6 bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 flex flex-col justify-between space-y-5 transition-all duration-300">
              <div>
                <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-[#4edea3]" />
                    <h3 className="text-sm font-bold text-white">Calculated Compensation Waterfall</h3>
                  </div>
                  <AnimatePresence mode="wait">
                    <motion.span
                      key={`${simTeamId}-${simResult.effectiveCommissionRate}`}
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                      className={`text-xs font-mono px-2 py-0.5 rounded font-bold border transition-colors ${
                        simTeamId === 'global'
                          ? 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30'
                          : simResult.usesTeamOverrides
                          ? 'bg-[#38bdf8]/15 text-[#38bdf8] border-[#38bdf8]/30'
                          : 'bg-[#4edea3]/15 text-[#4edea3] border-[#4edea3]/30'
                      }`}
                    >
                      {simResult.effectiveCommissionRate.toFixed(1)}% Applied Rate ({simTeamId === 'global' ? 'Global Baseline' : simResult.selectedTeam?.name})
                    </motion.span>
                  </AnimatePresence>
                </div>

                {/* Waterfall Rows with subtle animated state transition */}
                <motion.div
                  key={`waterfall-${simTeamId}-${simClientType}-${simPaymentMethod}`}
                  initial={{ opacity: 0.7 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.22, ease: 'easeOut' }}
                  className="divide-y divide-[#222a3d] text-xs pt-2"
                >
                  <div className="py-2.5 flex justify-between items-center">
                    <span className="text-[#86948a]">Hypothetical Contract Value:</span>
                    <span className="font-mono text-white font-bold text-sm">
                      ${simContractValue.toLocaleString()}
                    </span>
                  </div>

                  <div className="py-2.5 flex justify-between items-center text-[#ffb4ab]">
                    <span className="flex items-center gap-1.5">
                      <span>Less: Gateway Processing Fee ({simPaymentMethod.replace('_', ' ')}):</span>
                    </span>
                    <span className="font-mono font-semibold">
                      -${simResult.stripeFee.toFixed(2)}
                    </span>
                  </div>

                  <div className="py-2.5 flex justify-between items-center bg-[#0b1326]/60 px-2.5 rounded">
                    <span className="text-[#dae2fd] font-semibold">Net Commissionable Cash Base:</span>
                    <span className="font-mono text-[#4edea3] font-bold">
                      ${simResult.netCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="text-[#dae2fd] font-medium">Sales Commission Accrued:</span>
                      <div className="text-[10px] text-[#86948a]">
                        {simClientType === 'new_client' ? 'New Client Acquisition' : 'Recurring Account'} @ {simResult.effectiveCommissionRate.toFixed(1)}%
                      </div>
                    </div>
                    <span className="font-mono text-[#4edea3] font-bold text-sm">
                      ${simResult.commissionAccrued.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="py-2.5 flex justify-between items-center">
                    <div>
                      <span className="text-[#dae2fd] font-medium">Expedited Service Delivery Bonus:</span>
                      <div className="text-[10px] text-[#86948a]">
                        {simEarlyHours > 0 ? `${simEarlyHours}h lead time` : 'On-time delivery'} • {simResult.isQualityPassed ? 'Eligible' : 'Disqualified by QA defects'}
                      </div>
                    </div>
                    <span className="font-mono text-[#a78bfa] font-bold text-sm">
                      ${simResult.serviceBonusAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  {/* Visual Revenue Proportions Bar */}
                  <div className="py-3 space-y-1.5">
                    <div className="flex justify-between text-[10px] text-[#86948a]">
                      <span>Distribution Breakdown</span>
                      <span>
                        Incentives: {simResult.effectiveIncentivePercent.toFixed(1)}% • Retained: {simResult.companyRetainedPercent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full h-2.5 rounded-full bg-[#0b1326] flex overflow-hidden border border-[#222a3d]">
                      <div
                        style={{ width: `${Math.min(100, (simResult.commissionAccrued / (simContractValue || 1)) * 100)}%` }}
                        className="bg-[#4edea3] transition-all duration-500 ease-out"
                        title="Sales Commission"
                      />
                      <div
                        style={{ width: `${Math.min(100, (simResult.serviceBonusAmount / (simContractValue || 1)) * 100)}%` }}
                        className="bg-[#a78bfa] transition-all duration-500 ease-out"
                        title="Service Bonus"
                      />
                      <div
                        style={{ width: `${Math.min(100, (simResult.stripeFee / (simContractValue || 1)) * 100)}%` }}
                        className="bg-[#ffb4ab] transition-all duration-500 ease-out"
                        title="Payment Gateway Fee"
                      />
                      <div
                        style={{ width: `${Math.max(0, simResult.companyRetainedPercent)}%` }}
                        className="bg-[#1f2b48] transition-all duration-500 ease-out"
                        title="Company Retained Margin"
                      />
                    </div>
                  </div>

                  <div className="py-3 flex justify-between items-center border-t border-[#4edea3]/30 pt-3 bg-[#4edea3]/10 px-3 rounded-md transition-all duration-300">
                    <div>
                      <span className="text-sm font-bold text-white block">Total Calculated Incentive:</span>
                      <span className="text-[10px] text-[#4edea3]">Commission + Service Quality Bonus</span>
                    </div>
                    <span className="font-mono text-lg font-bold text-[#4edea3]">
                      ${simResult.totalPayout.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </motion.div>

                {/* Team Member Allocation Breakdown with Animated Unfold */}
                <AnimatePresence>
                  {simTeamId !== 'global' && simResult.selectedTeam && simResult.selectedTeam.members.length > 0 && (
                    <motion.div
                      key={`team-members-${simResult.selectedTeam.id}`}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-3 rounded-lg bg-[#0b1326] border border-[#222a3d] space-y-2">
                        <div className="text-[11px] font-mono text-[#38bdf8] font-bold uppercase tracking-wider flex justify-between">
                          <span>{simResult.selectedTeam.name} Estimator Allocation</span>
                          <span>{simResult.selectedTeam.splitType === 'equal_split' ? 'Equal Split' : 'Hours Weighted'}</span>
                        </div>
                        <div className="space-y-1">
                          {simResult.selectedTeam.members.map((m) => {
                            const shareAmount = simResult.totalPayout / simResult.selectedTeam!.members.length;
                            return (
                              <div key={m.employeeId} className="flex justify-between text-xs py-0.5">
                                <span className="text-[#dae2fd]">{m.employeeName} ({m.role})</span>
                                <span className="font-mono text-[#4edea3] font-semibold">
                                  ${shareAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Tax & Regulatory Footnote */}
              <div className="p-3 rounded bg-[#0b1326] border border-[#222a3d] text-[11px] text-[#86948a] space-y-1">
                <div className="flex justify-between">
                  <span>IRS 22.0% Supplemental Wage Tax Withholding:</span>
                  <span className="font-mono text-[#ffb4ab]">-${simResult.supplementalTax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-white">
                  <span>Estimated Net Take-Home to Estimator(s):</span>
                  <span className="font-mono text-[#4edea3]">${simResult.netTakeHome.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Cross-Team Comparative Matrix for this Hypothetical Project */}
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#222a3d] pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#38bdf8]" />
                <h3 className="text-sm font-bold text-white">
                  Cross-Team Comparison for ${simContractValue.toLocaleString()} Hypothetical Project
                </h3>
              </div>
              <span className="text-xs text-[#86948a]">
                Simulating across all active organizational units under current rules
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0b1326] text-[#86948a] font-mono border-b border-[#222a3d]">
                  <tr>
                    <th className="py-2.5 px-3">Team / Entity</th>
                    <th className="py-2.5 px-3">Policy Basis</th>
                    <th className="py-2.5 px-3">Applied %</th>
                    <th className="py-2.5 px-3">Sales Commission</th>
                    <th className="py-2.5 px-3">Service Bonus</th>
                    <th className="py-2.5 px-3">Total Calculated Payout</th>
                    <th className="py-2.5 px-3">Effective Rate</th>
                    <th className="py-2.5 px-3">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222a3d]">
                  {simResult.allTeamsComparison.map((teamRow) => {
                    const isSelected = simTeamId === teamRow.id;
                    const isGlobalRow = teamRow.id === 'global';
                    return (
                      <tr
                        key={teamRow.id}
                        className={`transition-all duration-200 ${
                          isSelected
                            ? isGlobalRow
                              ? 'bg-[#4edea3]/10 font-semibold'
                              : 'bg-[#38bdf8]/10 font-semibold'
                            : 'hover:bg-[#1f2b48]/40'
                        }`}
                      >
                        <td className="py-3 px-3 text-white">
                          <div className="flex items-center gap-2">
                            {isSelected && (
                              <span className={`w-2 h-2 rounded-full ${isGlobalRow ? 'bg-[#4edea3]' : 'bg-[#38bdf8]'} animate-pulse`} />
                            )}
                            <span className="font-semibold">{teamRow.name}</span>
                          </div>
                          <div className="text-[10px] text-[#86948a]">{teamRow.department}</div>
                        </td>

                        <td className="py-3 px-3">
                          {teamRow.isCustom ? (
                            <span className="px-1.5 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-mono text-[10px] font-bold border border-[#38bdf8]/30">
                              TEAM OVERRIDE
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/15 text-[#4edea3] font-mono text-[10px] font-bold border border-[#4edea3]/30">
                              GLOBAL BASELINE
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3 font-mono font-semibold text-white">
                          {teamRow.effectiveRate.toFixed(1)}%
                        </td>

                        <td className="py-3 px-3 font-mono text-[#dae2fd]">
                          ${teamRow.commission.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-3 font-mono text-[#a78bfa]">
                          ${teamRow.bonus.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-[#4edea3] text-sm">
                          ${teamRow.total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        <td className="py-3 px-3 font-mono text-xs text-[#86948a]">
                          {teamRow.effectivePct.toFixed(2)}%
                        </td>

                        <td className="py-3 px-3">
                          <button
                            onClick={() => {
                              setSimTeamId(teamRow.id);
                              if (teamRow.id !== 'global') {
                                setLastSelectedTeamId(teamRow.id);
                              }
                            }}
                            className={`px-2.5 py-1 rounded text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                              isSelected
                                ? isGlobalRow
                                  ? 'bg-[#4edea3] text-[#0b1326] border-[#4edea3] shadow-xs'
                                  : 'bg-[#38bdf8] text-[#0b1326] border-[#38bdf8] shadow-xs'
                                : 'bg-[#1f2b48] hover:bg-[#28375c] text-[#dae2fd] border-[#222a3d]'
                            }`}
                          >
                            {isSelected ? (isGlobalRow ? 'Active Baseline' : 'Active Team') : (isGlobalRow ? 'Simulate Baseline' : 'Simulate Team')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* TAB 4: POLICY MATRIX & AUDIT LOG                          */}
      {/* ========================================================= */}
      {activeSubTab === 'matrix' && (
        <div className="space-y-6">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#f59e0b]" />
              <span>Compensation Policy Comparison Matrix</span>
            </h3>
            <p className="text-xs text-[#86948a]">
              Full architectural overview comparing corporate global baselines against active estimating team overrides.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#0b1326] text-[#86948a] font-mono border-b border-[#222a3d]">
                  <tr>
                    <th className="py-2.5 px-3">Scope / Entity</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">Sales Acquisition %</th>
                    <th className="py-2.5 px-3">Recurring Client %</th>
                    <th className="py-2.5 px-3">Service Bonus</th>
                    <th className="py-2.5 px-3">Target Amount</th>
                    <th className="py-2.5 px-3">Bonus Pool</th>
                    <th className="py-2.5 px-3">Members</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222a3d]">
                  <tr className="bg-[#4edea3]/5 font-semibold">
                    <td className="py-3 px-3 text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#4edea3]" />
                      <span>Corporate Global Baseline</span>
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-1.5 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] font-mono text-[10px] font-bold">
                        ACTIVE DEFAULT
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[#4edea3] font-bold">{formState.globalSalesRate.toFixed(1)}%</td>
                    <td className="py-3 px-3 font-mono text-[#38bdf8] font-bold">{formState.globalRecurringRate.toFixed(1)}%</td>
                    <td className="py-3 px-3 font-mono text-[#a78bfa]">
                      {formState.serviceBonusMode === 'percentage'
                        ? `${formState.globalServiceBonus24h}% - ${formState.globalServiceBonus72h}%`
                        : `$${formState.globalServiceBonus24h} - $${formState.globalServiceBonus72h}`}
                    </td>
                    <td className="py-3 px-3 font-mono text-[#86948a]">—</td>
                    <td className="py-3 px-3 font-mono text-[#86948a]">—</td>
                    <td className="py-3 px-3 text-[#86948a]">All Non-Team Estimators</td>
                  </tr>

                  {formState.teams.map((t) => (
                    <tr key={t.id} className="hover:bg-[#1a233a]/40">
                      <td className="py-3 px-3 text-white font-medium">
                        {t.name}
                        <div className="text-[10px] text-[#86948a] font-mono">{t.department}</div>
                      </td>
                      <td className="py-3 px-3">
                        {t.useCustomRates ? (
                          <span className="px-1.5 py-0.5 rounded bg-[#38bdf8]/15 text-[#38bdf8] font-mono text-[10px] font-bold">
                            CUSTOM OVERRIDE
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded bg-[#222a3d] text-[#86948a] font-mono text-[10px]">
                            GLOBAL INHERITED
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 font-mono text-white">
                        {t.useCustomRates && t.salesCommissionRatePercent !== undefined
                          ? `${t.salesCommissionRatePercent.toFixed(1)}%`
                          : `${formState.globalSalesRate.toFixed(1)}% (inherited)`}
                      </td>
                      <td className="py-3 px-3 font-mono text-white">
                        {t.useCustomRates && t.recurringClientRatePercent !== undefined
                          ? `${t.recurringClientRatePercent.toFixed(1)}%`
                          : `${formState.globalRecurringRate.toFixed(1)}% (inherited)`}
                      </td>
                      <td className="py-3 px-3 font-mono text-white">
                        {t.useCustomRates && t.serviceBonusRatePercent !== undefined
                          ? `${t.serviceBonusRatePercent.toFixed(1)}%`
                          : `${formState.globalServiceBonus24h}% (inherited)`}
                      </td>
                      <td className="py-3 px-3 font-mono text-white">${t.targetAmount.toLocaleString()}</td>
                      <td className="py-3 px-3 font-mono text-[#4edea3]">${t.bonusPoolAmount.toLocaleString()}</td>
                      <td className="py-3 px-3 text-[#dae2fd]">{t.members.length} Members</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Audit Trail Details Card */}
          <div className="p-4 rounded-lg bg-[#131b2e] border border-[#222a3d] space-y-2">
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
              <span>Governance & Audit Trail</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded bg-[#0b1326] border border-[#222a3d]">
                <span className="text-[#86948a] text-[11px] block">Last Saved Date:</span>
                <span className="font-mono text-white font-semibold">{formState.lastUpdated}</span>
              </div>
              <div className="p-2.5 rounded bg-[#0b1326] border border-[#222a3d]">
                <span className="text-[#86948a] text-[11px] block">Authorized Officer:</span>
                <span className="font-semibold text-white">{formState.updatedBy}</span>
              </div>
              <div className="p-2.5 rounded bg-[#0b1326] border border-[#222a3d]">
                <span className="text-[#86948a] text-[11px] block">State Persistence:</span>
                <span className="font-mono text-[#4edea3] font-semibold">Local Storage Synchronized</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADD TEAM MODAL                                            */}
      {/* ========================================================= */}
      {isAddTeamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#131b2e] border border-[#222a3d] rounded-xl shadow-2xl p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#222a3d] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#38bdf8]" />
                <span>Create New Estimating Team</span>
              </h3>
              <button
                onClick={() => setIsAddTeamModalOpen(false)}
                className="text-[#86948a] hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-[#dae2fd] font-semibold mb-1">Team Name</label>
                <input
                  type="text"
                  placeholder="e.g. Team D (Renewable & Solar EPC)"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-[#0b1326] border border-[#222a3d] text-white focus:border-[#38bdf8] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[#dae2fd] font-semibold mb-1">Department Scope</label>
                <select
                  value={newTeamDept}
                  onChange={(e) => setNewTeamDept(e.target.value)}
                  className="w-full px-3 py-1.5 rounded bg-[#0b1326] border border-[#222a3d] text-white focus:outline-none"
                >
                  <option value="Sales">Sales</option>
                  <option value="Services">Services</option>
                  <option value="Pre-Construction">Pre-Construction</option>
                  <option value="Civil & Infrastructure">Civil & Infrastructure</option>
                  <option value="VDC & BIM">VDC & BIM</option>
                  <option value="Special Projects">Special Projects</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#dae2fd] font-semibold mb-1">Target Revenue ($)</label>
                  <input
                    type="number"
                    step="10000"
                    value={newTeamTarget}
                    onChange={(e) => setNewTeamTarget(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded bg-[#0b1326] border border-[#222a3d] text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[#dae2fd] font-semibold mb-1">Bonus Pool ($)</label>
                  <input
                    type="number"
                    step="500"
                    value={newTeamBonusPool}
                    onChange={(e) => setNewTeamBonusPool(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded bg-[#0b1326] border border-[#222a3d] text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#222a3d]">
                <div>
                  <label className="block text-[11px] text-[#86948a] mb-1">Sales %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTeamSalesRate}
                    onChange={(e) => setNewTeamSalesRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-[#0b1326] border border-[#222a3d] text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#86948a] mb-1">Recurring %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTeamRecurringRate}
                    onChange={(e) => setNewTeamRecurringRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-[#0b1326] border border-[#222a3d] text-white font-mono focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#86948a] mb-1">Service %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newTeamServiceRate}
                    onChange={(e) => setNewTeamServiceRate(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 rounded bg-[#0b1326] border border-[#222a3d] text-white font-mono focus:outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#222a3d]">
              <button
                onClick={() => setIsAddTeamModalOpen(false)}
                className="px-3 py-1.5 text-xs rounded bg-[#0b1326] hover:bg-[#1a233a] border border-[#222a3d] text-[#86948a] hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim()}
                className="px-4 py-1.5 text-xs font-bold rounded bg-[#38bdf8] hover:bg-[#0284c7] text-[#082f49] disabled:opacity-50"
              >
                Create Team
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
