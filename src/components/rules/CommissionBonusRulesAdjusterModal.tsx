import React, { useState, useEffect } from 'react';
import {
  X,
  Sliders,
  Percent,
  Users,
  Award,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Save,
  Plus,
  Trash2,
  ArrowRight,
  Info,
  DollarSign,
  ShieldCheck,
  Building2,
  Clock,
  Sparkles,
} from 'lucide-react';
import {
  FinancialRulesAdjustmentConfig,
  SalesCommissionRuleConfig,
  TeamTargetRule,
  ServiceEarlySubmissionRule,
  EmployeeItem,
} from '../../types';
import {
  getFinancialRulesConfig,
  saveFinancialRulesConfig,
  resetFinancialRulesConfig,
  calculateSalesCommission,
  calculateTeamTargetBonus,
  calculateServiceEarlySubmissionBonus,
  FINANCIAL_CONSTANTS,
} from '../../utils/financialRulesEngine';

interface CommissionBonusRulesAdjusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  employees: EmployeeItem[];
  onApplyToPayroll?: (updatedConfig: FinancialRulesAdjustmentConfig) => void;
}

export const CommissionBonusRulesAdjusterModal: React.FC<CommissionBonusRulesAdjusterModalProps> = ({
  isOpen,
  onClose,
  employees,
  onApplyToPayroll,
}) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'teams' | 'services'>('sales');
  const [config, setConfig] = useState<FinancialRulesAdjustmentConfig>(() => getFinancialRulesConfig());
  const [saveSuccessNotice, setSaveSuccessNotice] = useState<string | null>(null);

  // Live Sandbox States
  // 1. Sales Sandbox
  const [simContractValue, setSimContractValue] = useState<number>(75000);
  const [simClientType, setSimClientType] = useState<'new_client' | 'recurring_client'>('new_client');
  const [simPaymentMethod, setSimPaymentMethod] = useState<'credit_card' | 'ach_debit' | 'wire_transfer'>('credit_card');

  // 2. Services Sandbox
  const [simServiceContract, setSimServiceContract] = useState<number>(60000);
  const [simLeadHours, setSimLeadHours] = useState<number>(52);
  const [simAddendaErrors, setSimAddendaErrors] = useState<number>(0);

  // Sync with localStorage on open
  useEffect(() => {
    if (isOpen) {
      setConfig(getFinancialRulesConfig());
      setSaveSuccessNotice(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle Save
  const handleSave = () => {
    saveFinancialRulesConfig(config);
    setSaveSuccessNotice('Rules saved successfully! Active payroll calculations and compensation models updated.');
    if (onApplyToPayroll) {
      onApplyToPayroll(config);
    }
    setTimeout(() => {
      setSaveSuccessNotice(null);
    }, 4000);
  };

  // Handle Reset to Defaults
  const handleReset = () => {
    if (window.confirm('Reset all commission rates, team targets, and service speed bonuses to corporate defaults?')) {
      const def = resetFinancialRulesConfig();
      setConfig(def);
      setSaveSuccessNotice('Rules restored to corporate standard defaults.');
      setTimeout(() => setSaveSuccessNotice(null), 4000);
    }
  };

  // Sales Simulation Calculation
  const salesSimResult = calculateSalesCommission({
    contractValue: simContractValue,
    clientType: simClientType,
    paymentMethod: simPaymentMethod,
    customRules: config.salesCommission,
  });

  // Services Simulation Calculation
  const serviceSimResult = calculateServiceEarlySubmissionBonus({
    contractValue: simServiceContract,
    leadTimeHoursAhead: simLeadHours,
    addendaErrors: simAddendaErrors,
    customRules: config.serviceEarlyDelivery,
  });

  // Team Management Handlers
  const handleUpdateTeam = (teamId: string, updates: Partial<TeamTargetRule>) => {
    setConfig((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => (t.id === teamId ? { ...t, ...updates } : t)),
    }));
  };

  const handleAddTeamMember = (teamId: string, empId: string) => {
    const emp = employees.find((e) => e.id === empId);
    if (!emp) return;

    setConfig((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => {
        if (t.id !== teamId) return t;
        if (t.members.some((m) => m.employeeId === empId)) return t;
        return {
          ...t,
          members: [
            ...t.members,
            {
              employeeId: emp.id,
              employeeName: emp.name,
              role: emp.role,
              department: emp.department,
            },
          ],
        };
      }),
    }));
  };

  const handleRemoveTeamMember = (teamId: string, empId: string) => {
    setConfig((prev) => ({
      ...prev,
      teams: prev.teams.map((t) => {
        if (t.id !== teamId) return t;
        return {
          ...t,
          members: t.members.filter((m) => m.employeeId !== empId),
        };
      }),
    }));
  };

  const handleAddNewTeam = () => {
    const newTeamIndex = config.teams.length + 1;
    const newTeamId = `team_${String.fromCharCode(96 + newTeamIndex)}`;
    const newTeamName = `Team ${String.fromCharCode(64 + newTeamIndex)} (New Department)`;

    const newTeam: TeamTargetRule = {
      id: newTeamId,
      name: newTeamName,
      department: 'Pre-Construction',
      targetAmount: 200000,
      currentAchievedAmount: 0,
      bonusPoolAmount: 4000,
      splitType: 'equal_split',
      members: employees.slice(0, 2).map((e) => ({
        employeeId: e.id,
        employeeName: e.name,
        role: e.role,
        department: e.department,
      })),
      notes: 'New performance team target.',
    };

    setConfig((prev) => ({
      ...prev,
      teams: [...prev.teams, newTeam],
    }));
  };

  const handleDeleteTeam = (teamId: string) => {
    if (config.teams.length <= 1) {
      alert('At least one performance team must be maintained.');
      return;
    }
    setConfig((prev) => ({
      ...prev,
      teams: prev.teams.filter((t) => t.id !== teamId),
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-5xl max-h-[94vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222a3d] bg-[#0b1326] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Adjust Commission & Bonus Rules
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] font-bold">
                  ACTIVE GOVERNANCE
                </span>
              </div>
              <p className="text-xs text-[#86948a]">
                Configure sales rates (net of Stripe fee deductions), team target pools (Team A, B, C), and services early submission bonuses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="h-8 px-2.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded text-xs font-mono text-[#86948a] hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Reset all rates and pools to company defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Defaults</span>
            </button>
            <button
              onClick={handleSave}
              className="h-8 px-3 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Save & Apply</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#222a3d] text-[#86948a] hover:text-white transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Success Banner */}
        {saveSuccessNotice && (
          <div className="bg-[#4edea3]/15 border-b border-[#4edea3]/30 px-5 py-2 flex items-center gap-2 text-xs font-medium text-[#4edea3] animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{saveSuccessNotice}</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center px-5 pt-3 border-b border-[#222a3d] bg-[#0f172a] gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sales')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'sales'
                ? 'border-[#4edea3] text-[#4edea3]'
                : 'border-transparent text-[#86948a] hover:text-white'
            }`}
          >
            <Percent className="w-4 h-4" />
            <span>1. Sales Rep Commission (Net of Stripe)</span>
          </button>

          <button
            onClick={() => setActiveTab('teams')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'teams'
                ? 'border-[#4edea3] text-[#4edea3]'
                : 'border-transparent text-[#86948a] hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>2. Team Target Pools (Team A, B, C)</span>
          </button>

          <button
            onClick={() => setActiveTab('services')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
              activeTab === 'services'
                ? 'border-[#4edea3] text-[#4edea3]'
                : 'border-transparent text-[#86948a] hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>3. Services / Estimator Early Submission ($ or %)</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 text-xs text-[#dae2fd]">
          {/* ========================================================================= */}
          {/* TAB 1: SALES COMMISSION RULES                                            */}
          {/* ========================================================================= */}
          {activeTab === 'sales' && (
            <div className="space-y-6">
              {/* Rule Explanation */}
              <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Percent className="w-4 h-4 text-[#4edea3]" />
                  <span>Sales Representative Client Acquisition & Retention Rules</span>
                </div>
                <p className="text-[#86948a] leading-relaxed">
                  When a sales employee brings a client in, their commission is calculated strictly on the project collection value <strong>after complete deduction of payment processing fees (e.g. Stripe Credit Card 2.9% + $0.30 or ACH 0.8%)</strong>. Different percentage tiers apply for new client acquisition versus recurring client accounts.
                </p>
              </div>

              {/* Editable Form Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 1. New Client Rate */}
                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">New Client Commission Rate</span>
                      <span className="text-[11px] text-[#86948a]">For newly acquired General Contractors or Owners</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#4edea3]/20 font-mono text-[#4edea3] font-bold text-sm">
                      {config.salesCommission.newClientRatePercent}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="15"
                        step="0.5"
                        value={config.salesCommission.newClientRatePercent}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            salesCommission: {
                              ...prev.salesCommission,
                              newClientRatePercent: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-[#4edea3] cursor-pointer"
                      />
                      <div className="relative w-24">
                        <input
                          type="number"
                          min="0"
                          max="25"
                          step="0.1"
                          value={config.salesCommission.newClientRatePercent}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              salesCommission: {
                                ...prev.salesCommission,
                                newClientRatePercent: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-right font-mono text-white text-xs pr-6"
                        />
                        <span className="absolute right-2 top-2 text-[#86948a] font-mono">%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-[#86948a]">Presets:</span>
                      {[3.0, 4.0, 5.0, 6.0, 7.5, 10.0].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              salesCommission: { ...prev.salesCommission, newClientRatePercent: rate },
                            }))
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                            config.salesCommission.newClientRatePercent === rate
                              ? 'bg-[#4edea3] text-[#003824] font-bold'
                              : 'bg-[#171f33] text-[#86948a] hover:text-white'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 2. Recurring Client Rate */}
                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-bold text-white text-xs block">Recurring Client Commission Rate</span>
                      <span className="text-[11px] text-[#86948a]">For repeat engagements from existing client accounts</span>
                    </div>
                    <span className="px-2.5 py-1 rounded bg-[#adc6ff]/20 font-mono text-[#adc6ff] font-bold text-sm">
                      {config.salesCommission.recurringClientRatePercent}%
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min="0"
                        max="10"
                        step="0.5"
                        value={config.salesCommission.recurringClientRatePercent}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            salesCommission: {
                              ...prev.salesCommission,
                              recurringClientRatePercent: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-full accent-[#adc6ff] cursor-pointer"
                      />
                      <div className="relative w-24">
                        <input
                          type="number"
                          min="0"
                          max="20"
                          step="0.1"
                          value={config.salesCommission.recurringClientRatePercent}
                          onChange={(e) =>
                            setConfig((prev) => ({
                              ...prev,
                              salesCommission: {
                                ...prev.salesCommission,
                                recurringClientRatePercent: Number(e.target.value),
                              },
                            }))
                          }
                          className="w-full px-2.5 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded text-right font-mono text-white text-xs pr-6"
                        />
                        <span className="absolute right-2 top-2 text-[#86948a] font-mono">%</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      <span className="text-[10px] text-[#86948a]">Presets:</span>
                      {[1.5, 2.0, 2.5, 3.0, 4.0, 5.0].map((rate) => (
                        <button
                          key={rate}
                          type="button"
                          onClick={() =>
                            setConfig((prev) => ({
                              ...prev,
                              salesCommission: { ...prev.salesCommission, recurringClientRatePercent: rate },
                            }))
                          }
                          className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors cursor-pointer ${
                            config.salesCommission.recurringClientRatePercent === rate
                              ? 'bg-[#adc6ff] text-[#002855] font-bold'
                              : 'bg-[#171f33] text-[#86948a] hover:text-white'
                          }`}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Gateway Deduction Policy */}
              <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#4edea3]" />
                    <span className="font-bold text-white text-xs">Payment Gateway Fee Deduction Standard</span>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.salesCommission.deductStripeFees}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          salesCommission: {
                            ...prev.salesCommission,
                            deductStripeFees: e.target.checked,
                          },
                        }))
                      }
                      className="rounded accent-[#4edea3] w-4 h-4"
                    />
                    <span className="text-white">Deduct Payment Fees Before Commission</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-[11px] pt-1">
                  <div className="p-2.5 bg-[#131b2e] border border-[#222a3d] rounded">
                    <span className="text-[#86948a] block">Credit Card Rate</span>
                    <span className="font-mono text-white font-bold">2.9% + $0.30 per charge</span>
                  </div>
                  <div className="p-2.5 bg-[#131b2e] border border-[#222a3d] rounded">
                    <span className="text-[#86948a] block">ACH Direct Debit</span>
                    <span className="font-mono text-white font-bold">0.8% (Capped at $5.00 Max)</span>
                  </div>
                  <div className="p-2.5 bg-[#131b2e] border border-[#222a3d] rounded">
                    <span className="text-[#86948a] block">Clawback Protection</span>
                    <span className="font-mono text-[#4edea3] font-bold">{config.salesCommission.clawbackWindowDays} Days Window</span>
                  </div>
                </div>
              </div>

              {/* Interactive Live Sales Commission Simulator */}
              <div className="p-4.5 bg-[#171f33] border border-[#2d3449] rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#4edea3]" />
                    <span className="font-bold text-white text-xs">Live Calculation Audit & Simulator</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#86948a]">
                    Verifies real-time deduction formula
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-[#86948a] block mb-1">Project Contract Value ($)</label>
                    <input
                      type="number"
                      value={simContractValue}
                      onChange={(e) => setSimContractValue(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#86948a] block mb-1">Client Classification</label>
                    <select
                      value={simClientType}
                      onChange={(e) => setSimClientType(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white text-xs cursor-pointer"
                    >
                      <option value="new_client">New Client Acquisition ({config.salesCommission.newClientRatePercent}%)</option>
                      <option value="recurring_client">Recurring Client Account ({config.salesCommission.recurringClientRatePercent}%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-[#86948a] block mb-1">Payment Method Rail</label>
                    <select
                      value={simPaymentMethod}
                      onChange={(e) => setSimPaymentMethod(e.target.value as any)}
                      className="w-full px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white text-xs cursor-pointer"
                    >
                      <option value="credit_card">Stripe Credit Card (2.9% + $0.30)</option>
                      <option value="ach_debit">Stripe ACH Transfer (0.8% Capped at $5)</option>
                      <option value="wire_transfer">Direct Bank Wire ($0 Fee)</option>
                    </select>
                  </div>
                </div>

                {/* Calculation Breakdown Result */}
                <div className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded-lg">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <span className="text-[10px] text-[#86948a] uppercase font-mono block">Gross Contract</span>
                      <span className="text-sm font-bold font-mono text-white">
                        ${salesSimResult.contractValue.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#ffb4ab] uppercase font-mono block">Stripe Fee Deducted</span>
                      <span className="text-sm font-bold font-mono text-[#ffb4ab]">
                        -${salesSimResult.stripeFeeDeduction.toFixed(2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#adc6ff] uppercase font-mono block">Net Base for Comm.</span>
                      <span className="text-sm font-bold font-mono text-[#adc6ff]">
                        ${salesSimResult.netCollectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="p-1 rounded bg-[#4edea3]/10 border border-[#4edea3]/30">
                      <span className="text-[10px] text-[#4edea3] uppercase font-mono font-bold block">
                        Sales Commission ({salesSimResult.commissionRatePercent}%)
                      </span>
                      <span className="text-base font-bold font-mono text-[#4edea3]">
                        ${salesSimResult.commissionAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#86948a] mt-3 pt-2.5 border-t border-[#222a3d]">
                    {salesSimResult.notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: TEAM TARGET POOLS (TEAM A, B, C, etc.)                            */}
          {/* ========================================================================= */}
          {activeTab === 'teams' && (
            <div className="space-y-6">
              {/* Rule Explanation */}
              <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-white font-bold text-sm">
                    <Users className="w-4 h-4 text-[#4edea3]" />
                    <span>Team Performance Targets & Collective Commission Pools</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddNewTeam}
                    className="h-7 px-3 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded text-xs text-[#4edea3] font-mono flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Team</span>
                  </button>
                </div>
                <p className="text-[#86948a] leading-relaxed">
                  Teams (Team A, Team B, Team C, etc.) are assigned specific volume or revenue targets. When a team hits or exceeds its target, a designated <strong>pool of commission (--$)</strong> is unlocked and <strong>divided equally across all active members of that team</strong>.
                </p>
              </div>

              {/* Team Cards Grid */}
              <div className="space-y-5">
                {config.teams.map((team, idx) => {
                  const teamCalc = calculateTeamTargetBonus(team);

                  return (
                    <div
                      key={team.id}
                      className="p-4.5 bg-[#0b1326] border border-[#222a3d] rounded-xl space-y-4 shadow-sm"
                    >
                      {/* Team Card Top Bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#222a3d]">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 rounded-full bg-[#4edea3]/15 text-[#4edea3] font-mono font-bold flex items-center justify-center text-xs">
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <div>
                            <input
                              type="text"
                              value={team.name}
                              onChange={(e) => handleUpdateTeam(team.id, { name: e.target.value })}
                              className="text-sm font-bold text-white bg-transparent border-b border-transparent hover:border-[#222a3d] focus:border-[#4edea3] px-1 py-0.5 focus:outline-none"
                            />
                            <div className="text-[11px] text-[#86948a] px-1">{team.department}</div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-mono px-2.5 py-1 rounded font-bold ${
                              teamCalc.isTargetMet
                                ? 'bg-[#4edea3]/20 text-[#4edea3]'
                                : 'bg-[#adc6ff]/20 text-[#adc6ff]'
                            }`}
                          >
                            {teamCalc.isTargetMet
                              ? `TARGET HIT (${teamCalc.achievementPercent}%)`
                              : `IN PROGRESS (${teamCalc.achievementPercent}%)`}
                          </span>

                          <button
                            type="button"
                            onClick={() => handleDeleteTeam(team.id)}
                            className="p-1 text-[#86948a] hover:text-[#ffb4ab] rounded hover:bg-[#131b2e] cursor-pointer"
                            title="Delete this team"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Team Targets & Bonus Inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3 bg-[#131b2e] border border-[#222a3d] rounded">
                          <label className="text-[10px] text-[#86948a] uppercase font-mono block mb-1">
                            Team Revenue Target ($)
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-[#86948a]">$</span>
                            <input
                              type="number"
                              step="5000"
                              value={team.targetAmount}
                              onChange={(e) =>
                                handleUpdateTeam(team.id, { targetAmount: Math.max(0, Number(e.target.value)) })
                              }
                              className="w-full pl-6 pr-2 py-1 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white text-xs font-bold"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-[#131b2e] border border-[#222a3d] rounded">
                          <label className="text-[10px] text-[#86948a] uppercase font-mono block mb-1">
                            Current Volume Achieved ($)
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-[#86948a]">$</span>
                            <input
                              type="number"
                              step="5000"
                              value={team.currentAchievedAmount}
                              onChange={(e) =>
                                handleUpdateTeam(team.id, { currentAchievedAmount: Math.max(0, Number(e.target.value)) })
                              }
                              className="w-full pl-6 pr-2 py-1 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white text-xs font-bold"
                            />
                          </div>
                        </div>

                        <div className="p-3 bg-[#131b2e] border border-[#4edea3]/30 rounded">
                          <label className="text-[10px] text-[#4edea3] uppercase font-mono block mb-1 font-bold">
                            Bonus Pool Award when Hit ($)
                          </label>
                          <div className="relative">
                            <span className="absolute left-2.5 top-1.5 text-[#4edea3] font-bold">$</span>
                            <input
                              type="number"
                              step="500"
                              value={team.bonusPoolAmount}
                              onChange={(e) =>
                                handleUpdateTeam(team.id, { bonusPoolAmount: Math.max(0, Number(e.target.value)) })
                              }
                              className="w-full pl-6 pr-2 py-1 bg-[#0b1326] border border-[#4edea3]/40 rounded font-mono text-[#4edea3] text-xs font-bold"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#86948a]">Target Progress</span>
                          <span className="font-mono text-white">
                            ${team.currentAchievedAmount.toLocaleString()} / ${team.targetAmount.toLocaleString()} ({teamCalc.achievementPercent}%)
                          </span>
                        </div>
                        <div className="w-full bg-[#131b2e] h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 ${
                              teamCalc.isTargetMet ? 'bg-[#4edea3]' : 'bg-[#38bdf8]'
                            }`}
                            style={{ width: `${Math.min(100, teamCalc.achievementPercent)}%` }}
                          />
                        </div>
                      </div>

                      {/* Dividend Allocation Breakdown */}
                      <div className="p-3.5 bg-[#131b2e] border border-[#222a3d] rounded-lg space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white text-xs block">
                              Team Members & Dividend Split ({team.members.length} Members)
                            </span>
                            <span className="text-[10px] text-[#86948a]">
                              Pool is divided equally across active team members
                            </span>
                          </div>

                          <div className="text-right">
                            <span className="text-[10px] uppercase font-mono text-[#86948a] block">Per Member Share</span>
                            <span
                              className={`text-sm font-bold font-mono ${
                                teamCalc.isTargetMet ? 'text-[#4edea3]' : 'text-[#86948a]'
                              }`}
                            >
                              {teamCalc.isTargetMet
                                ? `$${teamCalc.perMemberEqualShare.toLocaleString(undefined, { minimumFractionDigits: 2 })} each`
                                : `($${(team.bonusPoolAmount / Math.max(1, team.members.length)).toLocaleString(undefined, { minimumFractionDigits: 2 })} when hit)`}
                            </span>
                          </div>
                        </div>

                        {/* Member Chips */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {team.members.map((member) => (
                            <div
                              key={member.employeeId}
                              className="p-2 bg-[#0b1326] border border-[#222a3d] rounded flex items-center justify-between"
                            >
                              <div className="min-w-0 pr-1">
                                <div className="font-bold text-white text-[11px] truncate">{member.employeeName}</div>
                                <div className="text-[10px] text-[#86948a] truncate">{member.role}</div>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="font-mono text-[11px] text-[#4edea3] font-bold">
                                  ${teamCalc.isTargetMet ? teamCalc.perMemberEqualShare.toLocaleString() : '0'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveTeamMember(team.id, member.employeeId)}
                                  className="text-[#86948a] hover:text-[#ffb4ab] p-0.5 rounded cursor-pointer"
                                  title="Remove from team"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add Member Dropdown */}
                        <div className="flex items-center gap-2 pt-1">
                          <span className="text-[10px] text-[#86948a]">Assign Employee:</span>
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAddTeamMember(team.id, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            defaultValue=""
                            className="px-2 py-1 bg-[#0b1326] border border-[#222a3d] rounded text-[11px] text-white cursor-pointer"
                          >
                            <option value="" disabled>+ Add employee to team...</option>
                            {employees
                              .filter((emp) => !team.members.some((m) => m.employeeId === emp.id))
                              .map((emp) => (
                                <option key={emp.id} value={emp.id}>
                                  {emp.name} ({emp.role})
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 3: SERVICES EARLY SUBMISSION BONUS ($ OR %)                          */}
          {/* ========================================================================= */}
          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Rule Explanation */}
              <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                <div className="flex items-center gap-2 text-white font-bold text-sm">
                  <Award className="w-4 h-4 text-[#4edea3]" />
                  <span>Services / Estimator Early Delivery Turnaround Speed Incentive</span>
                </div>
                <p className="text-[#86948a] leading-relaxed">
                  For service specialists, quantity surveyors, and pre-con estimators: if they submit a project deliverable early ahead of the General Contractor bid deadline, they receive an incentive. You can configure whether this award is a <strong>flat dollar bonus (--$)</strong> or a <strong>percentage of project value (--%)</strong> across lead-time tiers.
                </p>
              </div>

              {/* Mode Switcher */}
              <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-white text-xs block">Award Mechanism Mode</span>
                    <span className="text-[11px] text-[#86948a]">Select between flat dollar bonus or project percentage</span>
                  </div>

                  <div className="flex items-center gap-2 p-1 bg-[#131b2e] border border-[#222a3d] rounded-lg">
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          serviceEarlyDelivery: {
                            ...prev.serviceEarlyDelivery,
                            rewardMode: 'flat_dollar',
                          },
                        }))
                      }
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        config.serviceEarlyDelivery.rewardMode === 'flat_dollar'
                          ? 'bg-[#4edea3] text-[#003824] shadow-sm'
                          : 'text-[#86948a] hover:text-white'
                      }`}
                    >
                      Flat Dollar Award ($)
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setConfig((prev) => ({
                          ...prev,
                          serviceEarlyDelivery: {
                            ...prev.serviceEarlyDelivery,
                            rewardMode: 'percentage',
                          },
                        }))
                      }
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer ${
                        config.serviceEarlyDelivery.rewardMode === 'percentage'
                          ? 'bg-[#4edea3] text-[#003824] shadow-sm'
                          : 'text-[#86948a] hover:text-white'
                      }`}
                    >
                      Percentage of Project (%)
                    </button>
                  </div>
                </div>

                {config.serviceEarlyDelivery.rewardMode === 'percentage' && (
                  <div className="flex items-center gap-3 pt-2 border-t border-[#222a3d] text-xs">
                    <span className="text-[#86948a]">Percentage Calculated On:</span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="percentBasis"
                        checked={config.serviceEarlyDelivery.percentageBasis === 'contract_value'}
                        onChange={() =>
                          setConfig((prev) => ({
                            ...prev,
                            serviceEarlyDelivery: {
                              ...prev.serviceEarlyDelivery,
                              percentageBasis: 'contract_value',
                            },
                          }))
                        }
                        className="accent-[#4edea3]"
                      />
                      <span className="text-white font-medium">Contract Value</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="radio"
                        name="percentBasis"
                        checked={config.serviceEarlyDelivery.percentageBasis === 'gross_margin'}
                        onChange={() =>
                          setConfig((prev) => ({
                            ...prev,
                            serviceEarlyDelivery: {
                              ...prev.serviceEarlyDelivery,
                              percentageBasis: 'gross_margin',
                            },
                          }))
                        }
                        className="accent-[#4edea3]"
                      />
                      <span className="text-white font-medium">Gross Profit Margin</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Tiers Configuration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* 24h Tier */}
                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Tier 1: ≥24h Early</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131b2e] text-[#86948a]">
                      Standard Speed
                    </span>
                  </div>
                  <label className="text-[10px] text-[#86948a] block">
                    Award Amount ({config.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? '$' : '%'})
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-[#86948a]">
                      {config.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? '$' : '%'}
                    </span>
                    <input
                      type="number"
                      step={config.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? '50' : '0.1'}
                      value={config.serviceEarlyDelivery.tier24h}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          serviceEarlyDelivery: {
                            ...prev.serviceEarlyDelivery,
                            tier24h: Math.max(0, Number(e.target.value)),
                          },
                        }))
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs font-bold"
                    />
                  </div>
                </div>

                {/* 48h Tier */}
                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Tier 2: ≥48h Early</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#131b2e] text-[#4edea3]">
                      Accelerated
                    </span>
                  </div>
                  <label className="text-[10px] text-[#86948a] block">
                    Award Amount ({config.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? '$' : '%'})
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-[#86948a]">
                      {config.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? '$' : '%'}
                    </span>
                    <input
                      type="number"
                      step={config.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? '100' : '0.1'}
                      value={config.serviceEarlyDelivery.tier48h}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          serviceEarlyDelivery: {
                            ...prev.serviceEarlyDelivery,
                            tier48h: Math.max(0, Number(e.target.value)),
                          },
                        }))
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs font-bold"
                    />
                  </div>
                </div>

                {/* 72h Tier */}
                <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">Tier 3: ≥72h Early</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3]">
                      Maximum Speed
                    </span>
                  </div>
                  <label className="text-[10px] text-[#86948a] block">
                    Award Amount ({config.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? '$' : '%'})
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1.5 text-[#86948a]">
                      {config.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? '$' : '%'}
                    </span>
                    <input
                      type="number"
                      step={config.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? '100' : '0.1'}
                      value={config.serviceEarlyDelivery.tier72h}
                      onChange={(e) =>
                        setConfig((prev) => ({
                          ...prev,
                          serviceEarlyDelivery: {
                            ...prev.serviceEarlyDelivery,
                            tier72h: Math.max(0, Number(e.target.value)),
                          },
                        }))
                      }
                      className="w-full pl-6 pr-2 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Zero-Defect QA Floor */}
              <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-xs block">Zero QA Addenda Defect Quality Standard</span>
                  <span className="text-[11px] text-[#86948a]">
                    Requires 100% defect-free deliverable with zero revision addenda to qualify for speed bonuses
                  </span>
                </div>
                <label className="flex items-center gap-2 cursor-pointer font-semibold text-xs text-white">
                  <input
                    type="checkbox"
                    checked={config.serviceEarlyDelivery.requireZeroQaErrors}
                    onChange={(e) =>
                      setConfig((prev) => ({
                        ...prev,
                        serviceEarlyDelivery: {
                          ...prev.serviceEarlyDelivery,
                          requireZeroQaErrors: e.target.checked,
                        },
                      }))
                    }
                    className="rounded accent-[#4edea3] w-4 h-4"
                  />
                  <span>Enforce QA Zero-Defect Rule</span>
                </label>
              </div>

              {/* Interactive Services Simulator */}
              <div className="p-4.5 bg-[#171f33] border border-[#2d3449] rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#4edea3]" />
                    <span className="font-bold text-white text-xs">Services Delivery Speed Simulator</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#86948a]">
                    Tests configured mode ({config.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? 'Flat $' : '% Rate'})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[11px] text-[#86948a] block mb-1">Project Contract Value ($)</label>
                    <input
                      type="number"
                      value={simServiceContract}
                      onChange={(e) => setSimServiceContract(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#86948a] block mb-1">Hours Ahead of Deadline</label>
                    <input
                      type="number"
                      value={simLeadHours}
                      onChange={(e) => setSimLeadHours(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-[#86948a] block mb-1">QA Addenda Errors</label>
                    <input
                      type="number"
                      min="0"
                      value={simAddendaErrors}
                      onChange={(e) => setSimAddendaErrors(Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white text-xs"
                    />
                  </div>
                </div>

                {/* Simulator Output */}
                <div className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded-lg">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                    <div>
                      <span className="text-[10px] text-[#86948a] uppercase font-mono block">Tier Unlocked</span>
                      <span className="text-sm font-bold font-mono text-white">
                        {serviceSimResult.appliedTier.toUpperCase()} ({serviceSimResult.leadTimeHoursAhead}h Early)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#86948a] uppercase font-mono block">Gross Bonus</span>
                      <span className="text-sm font-bold font-mono text-[#4edea3]">
                        ${serviceSimResult.grossBonusAmount.toLocaleString()}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-[#ffb4ab] uppercase font-mono block">IRS 22% Supp. Tax</span>
                      <span className="text-sm font-bold font-mono text-[#ffb4ab]">
                        -${serviceSimResult.supplementalTaxWithheld.toLocaleString()}
                      </span>
                    </div>

                    <div className="p-1 rounded bg-[#4edea3]/10 border border-[#4edea3]/30">
                      <span className="text-[10px] text-[#4edea3] uppercase font-mono font-bold block">
                        Net Take-Home Bonus
                      </span>
                      <span className="text-base font-bold font-mono text-[#4edea3]">
                        ${serviceSimResult.netBonusTakeHome.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-[11px] text-[#86948a] mt-3 pt-2.5 border-t border-[#222a3d]">
                    {serviceSimResult.notes}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222a3d] bg-[#0b1326] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-[#86948a]">
            <ShieldCheck className="w-4 h-4 text-[#4edea3]" />
            <span>Authorized Corporate Policy: {config.updatedBy}</span>
            <span className="text-[#4edea3] font-mono">• Active</span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-[#171f33] hover:bg-[#222a3d] text-[#dae2fd] rounded text-xs font-semibold cursor-pointer"
            >
              Close
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
              <span>Save & Apply Rules</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
