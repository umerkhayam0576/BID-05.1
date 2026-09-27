import React, { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import {
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Building2,
  Plus,
  Search,
  Download,
  AlertCircle,
  FileText,
  CreditCard,
  X,
  Printer,
  Sparkles,
  Percent,
  Award,
  Layers,
  Edit3,
  AlertTriangle,
  Sliders,
  Users,
} from 'lucide-react';
import { EmployeeItem, PayrollRunItem, CashTransaction, FinancialRulesAdjustmentConfig } from '../../types';
import {
  calculateTaxWithholdings,
  calculateCommission,
  calculateTurnaroundBonus,
  calculateSalesCommission,
  calculateTeamTargetBonus,
  calculateServiceEarlySubmissionBonus,
  getFinancialRulesConfig,
  FINANCIAL_CONSTANTS,
} from '../../utils/financialRulesEngine';
import { FinancialRulesAuditorModal } from '../rules/FinancialRulesAuditorModal';
import { CommissionBonusRulesAdjusterModal } from '../rules/CommissionBonusRulesAdjusterModal';

interface SalaryPayrollViewProps {
  employees: EmployeeItem[];
  payrollRuns: PayrollRunItem[];
  onRunPayroll: (run: PayrollRunItem, outflowTxn: CashTransaction) => void;
  onNavigateToHr: () => void;
  onNavigateToCommissionSettings?: () => void;
}

export const SalaryPayrollView: React.FC<SalaryPayrollViewProps> = ({
  employees,
  payrollRuns,
  onRunPayroll,
  onNavigateToHr,
  onNavigateToCommissionSettings,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPaystubEmp, setSelectedPaystubEmp] = useState<EmployeeItem | null>(null);
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [isAdjustRulesModalOpen, setIsAdjustRulesModalOpen] = useState(false);
  const [adjustingEmp, setAdjustingEmp] = useState<EmployeeItem | null>(null);
  const [rulesConfig, setRulesConfig] = useState<FinancialRulesAdjustmentConfig>(() => getFinancialRulesConfig());
  const [rulesActionNotice, setRulesActionNotice] = useState<string | null>(null);

  // Quick Rule Calculator Helper State inside adjustingEmp modal
  const [quickHelperTab, setQuickHelperTab] = useState<'none' | 'sales' | 'team' | 'service'>('none');
  const [quickProjectValue, setQuickProjectValue] = useState<number>(50000);
  const [quickClientType, setQuickClientType] = useState<'new_client' | 'recurring_client'>('new_client');
  const [quickPaymentMethod, setQuickPaymentMethod] = useState<'credit_card' | 'ach_debit' | 'wire_transfer'>('credit_card');
  const [quickEarlyHours, setQuickEarlyHours] = useState<number>(48);

  // Synchronize rules configuration with global events
  useEffect(() => {
    const handleRulesUpdated = () => {
      setRulesConfig(getFinancialRulesConfig());
    };
    window.addEventListener('bidexact_rules_updated', handleRulesUpdated);
    return () => window.removeEventListener('bidexact_rules_updated', handleRulesUpdated);
  }, []);

  // Active Supplemental Compensation (Commissions & Bonuses for current cycle)
  const [supplementalMap, setSupplementalMap] = useState<Record<string, { commission: number; bonus: number; note: string }>>({
    'EMP-102': { commission: 2850, bonus: 1000, note: 'Metro Heights Takeoff (4.5% margin) + 48h Turnaround Speed' },
    'EMP-103': { commission: 2200, bonus: 500, note: 'St. Jude Expansion Civil Estimate (4.5% margin) + 24h Early' },
    'EMP-104': { commission: 1950, bonus: 0, note: 'Biotech Innovation Lab MEP Takeoff (4.5% margin)' },
    'EMP-106': { commission: 950, bonus: 500, note: 'Harbor Logistics QTO Assistance + Speed Bonus' },
  });

  // Active bi-weekly employee loan repayments (e.g. Liam Scott has an active company advance)
  const [employeeLoanDeductions] = useState<Record<string, number>>({
    'EMP-106': 225, // $450/month = $225 bi-weekly
  });

  // Disburse Unlocked Team Target Bonuses to active payroll
  const handleDisburseTeamTargetPools = () => {
    let disbursedCount = 0;
    const updated = { ...supplementalMap };

    rulesConfig.teams.forEach((team) => {
      const res = calculateTeamTargetBonus(team);
      if (res.isTargetMet && res.perMemberEqualShare > 0) {
        team.members.forEach((m) => {
          const prev = updated[m.employeeId] || { commission: 0, bonus: 0, note: '' };
          const addedShare = res.perMemberEqualShare;
          const teamLabel = team.name.split('(')[0].trim();
          updated[m.employeeId] = {
            commission: prev.commission,
            bonus: prev.bonus + addedShare,
            note: prev.note
              ? `${prev.note} + ${teamLabel} Target Dividend ($${addedShare.toLocaleString()})`
              : `${teamLabel} Target Dividend ($${addedShare.toLocaleString()})`,
          };
          disbursedCount++;
        });
      }
    });

    setSupplementalMap(updated);
    setRulesActionNotice(
      `Successfully allocated team target dividends to ${disbursedCount} team members across target-qualifying teams.`
    );
    setTimeout(() => setRulesActionNotice(null), 5000);
  };

  // Calculate detailed compensation & tax breakdown for each employee using the certified Rules Engine
  const employeeCalculations = employees.map((emp) => {
    const regularGross = emp.monthlyGross / 2;
    const supp = supplementalMap[emp.id] || { commission: 0, bonus: 0, note: '' };
    const commission = supp.commission;
    const bonus = supp.bonus;
    const supplementalGross = commission + bonus;
    const totalGross = regularGross + supplementalGross;

    const taxResult = calculateTaxWithholdings({
      regularWages: regularGross,
      supplementalWages: supplementalGross,
      preTax401kPercent: 0.05, // Standard 5% 401(k) election
      preTaxHealthDeduction: emp.deductions.healthInsurance / 2,
    });

    const requestedLoanDeduction = employeeLoanDeductions[emp.id] || 0;
    const isLoanCappedByCcpa = requestedLoanDeduction > taxResult.ccpaMaxLoanDeductionAllowed;
    const actualLoanDeduction = Math.min(requestedLoanDeduction, taxResult.ccpaMaxLoanDeductionAllowed);

    const netPay = totalGross - taxResult.totalEmployeeTaxes - taxResult.preTax401k - taxResult.preTaxHealth - actualLoanDeduction;

    return {
      emp,
      regularGross,
      commission,
      bonus,
      supplementalGross,
      totalGross,
      taxResult,
      requestedLoanDeduction,
      actualLoanDeduction,
      isLoanCappedByCcpa,
      netPay,
      note: supp.note,
    };
  });

  // Aggregate Totals for active payroll period
  const periodRegularGrossTotal = employeeCalculations.reduce((sum, c) => sum + c.regularGross, 0);
  const periodCommissionsTotal = employeeCalculations.reduce((sum, c) => sum + c.commission, 0);
  const periodBonusesTotal = employeeCalculations.reduce((sum, c) => sum + c.bonus, 0);
  const periodSupplementalTotal = periodCommissionsTotal + periodBonusesTotal;
  const periodGrossTotal = periodRegularGrossTotal + periodSupplementalTotal;

  const periodTaxesTotal = employeeCalculations.reduce((sum, c) => sum + c.taxResult.totalEmployeeTaxes, 0);
  const period401kTotal = employeeCalculations.reduce((sum, c) => sum + c.taxResult.preTax401k, 0);
  const periodHealthTotal = employeeCalculations.reduce((sum, c) => sum + c.taxResult.preTaxHealth, 0);
  const periodEmployerSafeHarborTotal = employeeCalculations.reduce((sum, c) => sum + c.taxResult.employerSafeHarborMatch401k, 0);
  const periodNetPayTotal = employeeCalculations.reduce((sum, c) => sum + c.netPay, 0);

  const filteredCalculations = employeeCalculations.filter((c) =>
    c.emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.emp.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExecutePayroll = () => {
    let maxRunNum = 18;
    for (const r of payrollRuns) {
      const match = r.id.match(/RUN-2024-(\d+)/i);
      if (match) {
        const parsed = parseInt(match[1], 10);
        if (!isNaN(parsed) && parsed > maxRunNum) {
          maxRunNum = parsed;
        }
      }
    }
    const runId = `RUN-2024-${maxRunNum + 1}`;
    const todayStr = new Date().toISOString().slice(0, 10);

    const newRun: PayrollRunItem = {
      id: runId,
      period: 'Sep 16 - Sep 30, 2024 (Active Cycle)',
      payDate: todayStr,
      totalGross: Math.round(periodGrossTotal),
      totalTaxesWithheld: Math.round(periodTaxesTotal),
      totalDeductions: Math.round(period401kTotal + periodHealthTotal),
      totalNetPaid: Math.round(periodNetPayTotal),
      employeeCount: employees.length,
      status: 'Paid',
    };

    const outflowTxn: CashTransaction = {
      id: `TXN-2024-${Math.floor(2000 + Math.random() * 8000)}`,
      date: todayStr,
      description: `Payroll Run #${payrollRuns.length + 19} Direct Deposits (${employees.length} Staff: Base + Commissions & Bonuses)`,
      category: 'Payroll & Salaries (W-2)',
      counterparty: 'Gusto Direct Deposit ACH',
      type: 'outflow',
      amount: Math.round(periodGrossTotal),
      status: 'reconciled',
      paymentMethod: 'Direct Debit ACH',
      account: 'Chase Payroll Reserve ••2041',
      referenceNumber: runId,
    };

    onRunPayroll(newRun, outflowTxn);

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const generatedAt = new Date().toLocaleDateString();
    const currency = (value: number) => `$${Math.round(value).toLocaleString()}`;

    doc.setFillColor(11, 19, 38);
    doc.rect(0, 0, pageWidth, 86, 'F');
    doc.setTextColor(78, 222, 163);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Bid Exact | Payroll Batch Report', 36, 36);
    doc.setTextColor(218, 226, 253);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Payroll period: ${newRun.period}`, 36, 56);
    doc.text(`Run: ${runId}  |  Generated: ${generatedAt}`, 36, 70);

    doc.setTextColor(35, 45, 66);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Payroll summary', 36, 116);
    doc.setFont('helvetica', 'normal');
    doc.text(`Employees: ${employees.length}`, 36, 134);
    doc.text(`Gross pay: ${currency(periodGrossTotal)}`, 150, 134);
    doc.text(`Taxes withheld: ${currency(periodTaxesTotal)}`, 280, 134);
    doc.text(`Net pay: ${currency(periodNetPayTotal)}`, 450, 134);

    const columns = [36, 150, 300, 400, 500, 590, 690];
    const headers = ['Employee', 'Employee ID', 'Regular Gross', 'Supplemental', 'Taxes', 'Deductions', 'Net Pay'];
    doc.setFillColor(34, 42, 61);
    doc.rect(30, 154, pageWidth - 60, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    headers.forEach((header, index) => doc.text(header, columns[index], 170));

    let y = 196;
    doc.setTextColor(35, 45, 66);
    employeeCalculations.forEach((calculation, index) => {
      if (y > 520) {
        doc.addPage();
        y = 42;
      }
      if (index % 2 === 0) {
        doc.setFillColor(245, 247, 250);
        doc.rect(30, y - 12, pageWidth - 60, 22, 'F');
      }
      const values = [
        calculation.emp.name,
        calculation.emp.id,
        currency(calculation.regularGross),
        currency(calculation.supplementalGross),
        currency(calculation.taxResult.totalEmployeeTaxes),
        currency(calculation.taxResult.preTax401k + calculation.taxResult.preTaxHealth + calculation.actualLoanDeduction),
        currency(calculation.netPay),
      ];
      values.forEach((value, valueIndex) => doc.text(value, columns[valueIndex], y));
      y += 22;
    });

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Generated from the certified payroll calculations shown in Bid Exact.', 36, 560);
    doc.save(`BidExact_Payroll_${todayStr}.pdf`);
    setIsRunModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-[#86948a] mb-1">
            <span>COMPENSATION & PAYROLL</span>
            <span>/</span>
            <span>DIRECT DEPOSIT DISBURSEMENT</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#4edea3] ml-1" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
            Salary Structure & Payroll Processing
          </h1>
          <p className="text-xs sm:text-sm text-[#86948a] mt-0.5">
            Margin-based commissions, speed bonuses, IRS 22% supplemental withholding, CCPA protection & ACH disbursement
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {onNavigateToCommissionSettings && (
            <button
              onClick={onNavigateToCommissionSettings}
              className="h-9 px-3.5 bg-[#38bdf8]/10 hover:bg-[#38bdf8]/20 border border-[#38bdf8]/40 rounded-md text-xs font-mono text-[#38bdf8] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Percent className="w-3.5 h-3.5" />
              <span>Commission Settings</span>
            </button>
          )}
          <button
            onClick={() => setIsAdjustRulesModalOpen(true)}
            className="h-9 px-3.5 bg-[#4edea3]/10 hover:bg-[#4edea3]/20 border border-[#4edea3]/30 rounded-md text-xs font-mono text-[#4edea3] font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Adjust Rules</span>
          </button>
          <button
            onClick={() => setIsRulesModalOpen(true)}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#4edea3]" />
            <span>Rules & Tax Engine</span>
          </button>
          <button
            onClick={onNavigateToHr}
            className="h-9 px-3.5 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded-md text-xs font-mono text-[#dae2fd] font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Building2 className="w-3.5 h-3.5 text-[#86948a]" />
            <span>Workforce Directory</span>
          </button>
          <button
            onClick={() => setIsRunModalOpen(true)}
            className="h-9 px-4 bg-[#4edea3] hover:bg-[#40cf95] active:scale-[0.98] text-[#003824] rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <CreditCard className="w-4 h-4 stroke-[2.5]" />
            <span>Execute Payroll Batch</span>
          </button>
        </div>
      </div>

      {/* Rules Action Toast Notice */}
      {rulesActionNotice && (
        <div className="bg-[#4edea3]/15 border border-[#4edea3]/30 rounded-lg p-3 flex items-center justify-between text-xs text-[#4edea3] font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{rulesActionNotice}</span>
          </div>
          <button
            onClick={() => setRulesActionNotice(null)}
            className="text-[#86948a] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Corporate Commission & Bonus Rules Live Status Panel */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4 space-y-3.5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#222a3d]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-xs sm:text-sm">
                  Active Commission & Bonus Rules Configuration
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] font-bold">
                  LIVE FORMULAS
                </span>
              </div>
              <p className="text-[11px] text-[#86948a]">
                Sales commissions (net of Stripe fee deductions), team target pools (A, B, C), and pre-con early delivery speed bonuses
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDisburseTeamTargetPools}
              className="h-8 px-3 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded text-xs font-mono text-[#dae2fd] hover:text-[#4edea3] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Disburse unlocked team target pools to active team members"
            >
              <Users className="w-3.5 h-3.5 text-[#4edea3]" />
              <span>Disburse Team Pools</span>
            </button>
            <button
              onClick={() => setIsAdjustRulesModalOpen(true)}
              className="h-8 px-3 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Adjust Rules</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
          {/* Rule 1: Sales Commission */}
          <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                <Percent className="w-3.5 h-3.5 text-[#4edea3]" />
                <span>Sales Client Commission</span>
              </div>
              <span className="text-[10px] font-mono text-[#86948a]">Stripe Net</span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#86948a]">New Client Acquisition:</span>
                <span className="text-[#4edea3] font-bold">{rulesConfig.salesCommission.newClientRatePercent}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86948a]">Recurring Client Account:</span>
                <span className="text-[#adc6ff] font-bold">{rulesConfig.salesCommission.recurringClientRatePercent}%</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-[#1a2337] text-[10px]">
                <span className="text-[#86948a]">Fee Deduction:</span>
                <span className="text-white">Stripe CC (2.9%+$0.30) / ACH (0.8%)</span>
              </div>
            </div>
          </div>

          {/* Rule 2: Team Targets */}
          <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                <Users className="w-3.5 h-3.5 text-[#4edea3]" />
                <span>Team Target Pools</span>
              </div>
              <span className="text-[10px] font-mono text-[#4edea3] font-bold">Equal Split</span>
            </div>
            <div className="space-y-1.5">
              {rulesConfig.teams.slice(0, 3).map((team) => {
                const calc = calculateTeamTargetBonus(team);
                return (
                  <div key={team.id} className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-[#86948a] truncate max-w-[120px]">{team.name.split(' ')[0]} {team.name.split(' ')[1]}:</span>
                    <div className="flex items-center gap-1.5">
                      <span className={calc.isTargetMet ? 'text-[#4edea3] font-bold' : 'text-[#86948a]'}>
                        ${team.currentAchievedAmount.toLocaleString()} / ${team.targetAmount.toLocaleString()}
                      </span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                          calc.isTargetMet ? 'bg-[#4edea3]/20 text-[#4edea3]' : 'bg-[#171f33] text-[#86948a]'
                        }`}
                      >
                        {calc.isTargetMet ? `$${team.bonusPoolAmount.toLocaleString()} HIT` : 'PENDING'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rule 3: Services Speed Bonus */}
          <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold text-white text-[11px]">
                <Award className="w-3.5 h-3.5 text-[#4edea3]" />
                <span>Services Early Delivery</span>
              </div>
              <span className="text-[10px] font-mono text-[#4edea3] font-bold">
                {rulesConfig.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? 'Flat Dollar ($)' : 'Project %'}
              </span>
            </div>
            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-[#86948a]">Tier 1 (≥24h Early):</span>
                <span className="text-white font-bold">
                  {rulesConfig.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? `$${rulesConfig.serviceEarlyDelivery.tier24h}` : `${rulesConfig.serviceEarlyDelivery.tier24h}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86948a]">Tier 2 (≥48h Early):</span>
                <span className="text-white font-bold">
                  {rulesConfig.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? `$${rulesConfig.serviceEarlyDelivery.tier48h}` : `${rulesConfig.serviceEarlyDelivery.tier48h}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#86948a]">Tier 3 (≥72h Early):</span>
                <span className="text-[#4edea3] font-bold">
                  {rulesConfig.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? `$${rulesConfig.serviceEarlyDelivery.tier72h}` : `${rulesConfig.serviceEarlyDelivery.tier72h}%`}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4 Certified Payroll KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Current Period Gross Liability
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            ${Math.round(periodGrossTotal).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2 flex items-center justify-between">
            <span>Base: ${Math.round(periodRegularGrossTotal).toLocaleString()}</span>
            <span className="text-[#4edea3] font-mono font-medium">+${Math.round(periodSupplementalTotal).toLocaleString()} Comm/Bon</span>
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Net Direct Deposit Take-Home
          </div>
          <div className="text-2xl font-bold font-mono text-[#4edea3]">
            ${Math.round(periodNetPayTotal).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            Disbursed across {employees.length} employee accounts
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Taxes & Statutory Escrow
          </div>
          <div className="text-2xl font-bold font-mono text-[#ffb4ab]">
            ${Math.round(periodTaxesTotal).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#86948a] mt-2">
            FIT, 22% Supp Tax, SIT (4.95%) & FICA (7.65%)
          </div>
        </div>

        <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-4">
          <div className="text-xs font-mono text-[#86948a] uppercase font-semibold mb-1">
            Company 401(k) Safe Harbor Match
          </div>
          <div className="text-2xl font-bold font-mono text-[#adc6ff]">
            ${Math.round(periodEmployerSafeHarborTotal).toLocaleString()}
          </div>
          <div className="text-[11px] text-[#adc6ff] mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>100% on first 3%, 50% on next 2%</span>
          </div>
        </div>
      </div>

      {/* Salary & Compensation Matrix Table */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#222a3d] flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Certified Compensation Matrix</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] font-semibold">
                IRS PUB 15-T COMPLIANT
              </span>
            </div>
            <p className="text-[11px] text-[#86948a]">
              Includes project margin commissions, turnaround bonuses, 401(k) matches, and CCPA loan limits
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-[#86948a] absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search employee by name, role, ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-xs text-white placeholder-[#86948a] focus:outline-none focus:border-[#4edea3]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0b1326] text-[#86948a] font-mono border-b border-[#222a3d]">
              <tr>
                <th className="py-2.5 px-4">Employee / ID</th>
                <th className="py-2.5 px-4">Base Gross</th>
                <th className="py-2.5 px-4">Commissions & Bonuses</th>
                <th className="py-2.5 px-4">Total Period Gross</th>
                <th className="py-2.5 px-4">FIT + 22% Supp</th>
                <th className="py-2.5 px-4">FICA / SIT</th>
                <th className="py-2.5 px-4">401(k) + Health</th>
                <th className="py-2.5 px-4 text-right">Net Take-Home</th>
                <th className="py-2.5 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222a3d]">
              {filteredCalculations.map((calc) => (
                <tr
                  key={calc.emp.id}
                  className="hover:bg-[#171f33]/60 transition-colors cursor-pointer"
                  onClick={() => setSelectedPaystubEmp(calc.emp)}
                >
                  <td className="py-3 px-4">
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <span>{calc.emp.name}</span>
                      {calc.isLoanCappedByCcpa && (
                        <span className="p-0.5 rounded bg-[#ffb4ab]/20 text-[#ffb4ab]" title="CCPA 25% Disposable Loan Cap Active">
                          <ShieldCheck className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] font-mono text-[#86948a]">
                      {calc.emp.id} • {calc.emp.role}
                    </div>
                  </td>

                  <td className="py-3 px-4 font-mono text-[#dae2fd]">
                    ${Math.round(calc.regularGross).toLocaleString()}
                  </td>

                  <td className="py-3 px-4">
                    {calc.supplementalGross > 0 ? (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] font-mono font-bold text-[11px] border border-[#4edea3]/20">
                          +${Math.round(calc.supplementalGross).toLocaleString()}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setAdjustingEmp(calc.emp);
                          }}
                          className="p-1 hover:bg-[#222a3d] text-[#86948a] hover:text-[#4edea3] rounded transition-colors"
                          title="Adjust Commission & Bonus"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdjustingEmp(calc.emp);
                        }}
                        className="text-[11px] font-mono text-[#86948a] hover:text-[#4edea3] flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        <span>Add Award</span>
                      </button>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono font-bold text-white">
                    ${Math.round(calc.totalGross).toLocaleString()}
                  </td>

                  <td className="py-3 px-4 font-mono text-[#ffb4ab]">
                    -${Math.round(calc.taxResult.totalFederalIncomeTax).toLocaleString()}
                    {calc.taxResult.supplementalFederalTax > 0 && (
                      <span className="block text-[10px] text-[#86948a]">
                        (incl 22% supp: ${calc.taxResult.supplementalFederalTax})
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono text-[#ffb4ab]">
                    -${Math.round(calc.taxResult.totalFicaEmployee + calc.taxResult.stateIncomeTax).toLocaleString()}
                    <span className="block text-[10px] text-[#86948a]">
                      FICA 7.65% + IL 4.95%
                    </span>
                  </td>

                  <td className="py-3 px-4 font-mono text-[#86948a]">
                    -${Math.round(calc.taxResult.preTax401k + calc.taxResult.preTaxHealth).toLocaleString()}
                    <span className="block text-[10px] text-[#4edea3]">
                      +${calc.taxResult.employerSafeHarborMatch401k} Co. Match
                    </span>
                  </td>

                  <td className="py-3 px-4 text-right font-mono font-bold text-[#4edea3]">
                    ${Math.round(calc.netPay).toLocaleString()}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPaystubEmp(calc.emp);
                      }}
                      className="p-1.5 text-[#86948a] hover:text-[#4edea3] rounded hover:bg-[#222a3d] transition-colors"
                      title="View Official Certified Paystub"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Historical Payroll Runs List */}
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-lg p-5">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Clock className="w-4 h-4 text-[#4edea3]" />
          Executed Direct Deposit Batch Runs
        </h3>
        <p className="text-[11px] text-[#86948a] mb-4">
          Audit trail of historical salary settlements with ACH batch reference numbers
        </p>

        <div className="space-y-3">
          {payrollRuns.map((run, idx) => (
            <div
              key={`${run.id}-${idx}`}
              className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-white">{run.id}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
                    {run.status}
                  </span>
                </div>
                <div className="text-xs text-[#dae2fd] mt-1">{run.period}</div>
                <div className="text-[11px] text-[#86948a] mt-0.5">
                  Executed on {run.payDate} for {run.employeeCount} full-time personnel
                </div>
              </div>

              <div className="flex items-center gap-6 font-mono text-xs">
                <div>
                  <div className="text-[10px] text-[#86948a]">Total Gross</div>
                  <div className="font-bold text-white">${run.totalGross.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#86948a]">Tax Escrow</div>
                  <div className="font-bold text-[#ffb4ab]">${run.totalTaxesWithheld.toLocaleString()}</div>
                </div>
                <div>
                  <div className="text-[10px] text-[#86948a]">Net Paid</div>
                  <div className="font-bold text-[#4edea3]">${run.totalNetPaid.toLocaleString()}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adjust Commission & Bonus Modal */}
      {adjustingEmp && (() => {
        // Quick Sales Sim
        const salesHelperResult = calculateSalesCommission({
          contractValue: quickProjectValue,
          clientType: quickClientType,
          paymentMethod: quickPaymentMethod,
          customRules: rulesConfig.salesCommission,
        });

        // Quick Service Sim
        const serviceHelperResult = calculateServiceEarlySubmissionBonus({
          contractValue: quickProjectValue,
          leadTimeHoursAhead: quickEarlyHours,
          addendaErrors: 0,
          customRules: rulesConfig.serviceEarlyDelivery,
        });

        // Find teams this employee belongs to
        const employeeTeams = rulesConfig.teams.filter((t) =>
          t.members.some((m) => m.employeeId === adjustingEmp.id)
        );

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
              <div className="p-4 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded bg-[#4edea3]/10 text-[#4edea3]">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Adjust Supplemental Compensation</h3>
                    <p className="text-[11px] text-[#86948a]">{adjustingEmp.name} • {adjustingEmp.role}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setAdjustingEmp(null);
                      setIsAdjustRulesModalOpen(true);
                    }}
                    className="px-2 py-1 bg-[#171f33] hover:bg-[#222a3d] border border-[#2d3449] rounded text-[10px] font-mono text-[#4edea3] flex items-center gap-1 cursor-pointer"
                    title="Open full rules configuration"
                  >
                    <Sliders className="w-3 h-3" />
                    <span>Config Rules</span>
                  </button>
                  <button
                    onClick={() => setAdjustingEmp(null)}
                    className="p-1 rounded hover:bg-[#222a3d] text-[#86948a] hover:text-white cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="p-5 space-y-4 text-xs overflow-y-auto flex-1">
                {/* Rule Quick Fill Selectors */}
                <div className="p-3 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-white flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-[#4edea3]" />
                      <span>Corporate Rule Quick Calculator</span>
                    </span>
                    <span className="text-[10px] font-mono text-[#86948a]">Auto-fills formula</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-[#131b2e] rounded border border-[#222a3d]">
                    <button
                      type="button"
                      onClick={() => setQuickHelperTab(quickHelperTab === 'sales' ? 'none' : 'sales')}
                      className={`py-1 px-1.5 rounded text-[10px] font-bold transition-colors cursor-pointer truncate ${
                        quickHelperTab === 'sales'
                          ? 'bg-[#4edea3] text-[#003824]'
                          : 'text-[#86948a] hover:text-white'
                      }`}
                    >
                      Sales (Stripe Net)
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickHelperTab(quickHelperTab === 'team' ? 'none' : 'team')}
                      className={`py-1 px-1.5 rounded text-[10px] font-bold transition-colors cursor-pointer truncate ${
                        quickHelperTab === 'team'
                          ? 'bg-[#4edea3] text-[#003824]'
                          : 'text-[#86948a] hover:text-white'
                      }`}
                    >
                      Team Targets
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickHelperTab(quickHelperTab === 'service' ? 'none' : 'service')}
                      className={`py-1 px-1.5 rounded text-[10px] font-bold transition-colors cursor-pointer truncate ${
                        quickHelperTab === 'service'
                          ? 'bg-[#4edea3] text-[#003824]'
                          : 'text-[#86948a] hover:text-white'
                      }`}
                    >
                      Services Speed
                    </button>
                  </div>

                  {/* 1. Sales Helper Drawer */}
                  {quickHelperTab === 'sales' && (
                    <div className="p-2.5 bg-[#171f33] border border-[#2d3449] rounded space-y-2 text-[11px] animate-in fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#86948a] block">Contract Value ($)</label>
                          <input
                            type="number"
                            value={quickProjectValue}
                            onChange={(e) => setQuickProjectValue(Math.max(0, Number(e.target.value)))}
                            className="w-full px-2 py-1 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#86948a] block">Client Classification</label>
                          <select
                            value={quickClientType}
                            onChange={(e) => setQuickClientType(e.target.value as any)}
                            className="w-full px-2 py-1 bg-[#0b1326] border border-[#222a3d] rounded text-white text-xs cursor-pointer"
                          >
                            <option value="new_client">New Client ({rulesConfig.salesCommission.newClientRatePercent}%)</option>
                            <option value="recurring_client">Recurring ({rulesConfig.salesCommission.recurringClientRatePercent}%)</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#222a3d]">
                        <span className="text-[#86948a]">
                          Stripe Fee: <strong className="text-[#ffb4ab]">-${salesHelperResult.stripeFeeDeduction.toFixed(2)}</strong> (Net: ${salesHelperResult.netCollectedCash.toLocaleString()})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSupplementalMap((prev) => ({
                              ...prev,
                              [adjustingEmp.id]: {
                                ...prev[adjustingEmp.id],
                                commission: salesHelperResult.commissionAmount,
                                bonus: prev[adjustingEmp.id]?.bonus || 0,
                                note: `Sales Commission: ${salesHelperResult.commissionRatePercent}% on $${salesHelperResult.netCollectedCash.toLocaleString()} net of Stripe fee`,
                              },
                            }));
                            setQuickHelperTab('none');
                          }}
                          className="px-2.5 py-1 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-bold text-[10px] cursor-pointer"
                        >
                          Apply ${salesHelperResult.commissionAmount.toLocaleString()}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. Team Targets Drawer */}
                  {quickHelperTab === 'team' && (
                    <div className="p-2.5 bg-[#171f33] border border-[#222a3d] rounded space-y-2 text-[11px] animate-in fade-in">
                      <div className="text-[10px] text-[#86948a]">
                        Active Team Memberships for {adjustingEmp.name}:
                      </div>
                      {employeeTeams.length === 0 ? (
                        <div className="text-[#86948a] italic">Employee is not currently assigned to Team A, B, or C.</div>
                      ) : (
                        employeeTeams.map((team) => {
                          const res = calculateTeamTargetBonus(team);
                          return (
                            <div key={team.id} className="flex items-center justify-between p-1.5 bg-[#0b1326] rounded border border-[#222a3d]">
                              <div>
                                <span className="font-bold text-white block">{team.name}</span>
                                <span className="text-[10px] text-[#86948a]">
                                  {res.isTargetMet ? `Target Met (${res.achievementPercent}%) • Pool $${team.bonusPoolAmount.toLocaleString()}` : `Progress ${res.achievementPercent}% (Pending)`}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setSupplementalMap((prev) => ({
                                    ...prev,
                                    [adjustingEmp.id]: {
                                      ...prev[adjustingEmp.id],
                                      commission: prev[adjustingEmp.id]?.commission || 0,
                                      bonus: (prev[adjustingEmp.id]?.bonus || 0) + res.perMemberEqualShare,
                                      note: prev[adjustingEmp.id]?.note
                                        ? `${prev[adjustingEmp.id].note} + ${team.name.split(' ')[0]} Target Share`
                                        : `${team.name.split(' ')[0]} Target Dividend ($${res.perMemberEqualShare.toLocaleString()})`,
                                    },
                                  }));
                                  setQuickHelperTab('none');
                                }}
                                className="px-2 py-0.5 bg-[#4edea3] text-[#003824] rounded font-bold text-[10px] cursor-pointer"
                              >
                                Add +${res.perMemberEqualShare.toLocaleString()}
                              </button>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* 3. Services Speed Drawer */}
                  {quickHelperTab === 'service' && (
                    <div className="p-2.5 bg-[#171f33] border border-[#2d3449] rounded space-y-2 text-[11px] animate-in fade-in">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-[#86948a] block">Hours Ahead of Deadline</label>
                          <input
                            type="number"
                            value={quickEarlyHours}
                            onChange={(e) => setQuickEarlyHours(Math.max(0, Number(e.target.value)))}
                            className="w-full px-2 py-1 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-[#86948a] block">Calculated Tier</label>
                          <div className="px-2 py-1 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-[#4edea3] text-xs font-bold">
                            {serviceHelperResult.appliedTier.toUpperCase()} Tier (${serviceHelperResult.grossBonusAmount.toLocaleString()})
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#222a3d]">
                        <span className="text-[#86948a]">
                          Mode: <strong>{rulesConfig.serviceEarlyDelivery.rewardMode === 'flat_dollar' ? 'Flat Dollar' : 'Project %'}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSupplementalMap((prev) => ({
                              ...prev,
                              [adjustingEmp.id]: {
                                ...prev[adjustingEmp.id],
                                commission: prev[adjustingEmp.id]?.commission || 0,
                                bonus: (prev[adjustingEmp.id]?.bonus || 0) + serviceHelperResult.grossBonusAmount,
                                note: prev[adjustingEmp.id]?.note
                                  ? `${prev[adjustingEmp.id].note} + Speed Bonus (${quickEarlyHours}h early)`
                                  : `Services Early Delivery Speed Bonus (${quickEarlyHours}h early)`,
                              },
                            }));
                            setQuickHelperTab('none');
                          }}
                          className="px-2.5 py-1 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-bold text-[10px] cursor-pointer"
                        >
                          Apply ${serviceHelperResult.grossBonusAmount.toLocaleString()}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[11px] text-[#86948a] block mb-1">
                    Sales / Margin Commission ($)
                  </label>
                  <input
                    type="number"
                    value={supplementalMap[adjustingEmp.id]?.commission || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSupplementalMap((prev) => ({
                        ...prev,
                        [adjustingEmp.id]: {
                          ...prev[adjustingEmp.id],
                          commission: val,
                          bonus: prev[adjustingEmp.id]?.bonus || 0,
                          note: prev[adjustingEmp.id]?.note || 'Sales / project commission allocation',
                        },
                      }));
                    }}
                    className="w-full px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white text-xs font-bold"
                  />
                  <span className="text-[10px] text-[#86948a] mt-1 block">
                    Sales Rep Rule: {rulesConfig.salesCommission.newClientRatePercent}% new client / {rulesConfig.salesCommission.recurringClientRatePercent}% recurring (Net of Stripe CC/ACH fee)
                  </span>
                </div>

                <div>
                  <label className="text-[11px] text-[#86948a] block mb-1">
                    Performance, Team Target & Turnaround Bonus ($)
                  </label>
                  <input
                    type="number"
                    value={supplementalMap[adjustingEmp.id]?.bonus || 0}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setSupplementalMap((prev) => ({
                        ...prev,
                        [adjustingEmp.id]: {
                          ...prev[adjustingEmp.id],
                          commission: prev[adjustingEmp.id]?.commission || 0,
                          bonus: val,
                          note: prev[adjustingEmp.id]?.note || 'Milestone performance bonus',
                        },
                      }));
                    }}
                    className="w-full px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded font-mono text-white text-xs font-bold"
                  />
                  <span className="text-[10px] text-[#86948a] mt-1 block">
                    Includes Team Target equal-dividend pools and early deliverable speed bonuses
                  </span>
                </div>

                <div>
                  <label className="text-[11px] text-[#86948a] block mb-1">Award Notes & Audit Justification</label>
                  <input
                    type="text"
                    value={supplementalMap[adjustingEmp.id]?.note || ''}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSupplementalMap((prev) => ({
                        ...prev,
                        [adjustingEmp.id]: {
                          ...prev[adjustingEmp.id],
                          note: val,
                        },
                      }));
                    }}
                    placeholder="e.g. Team A Target Dividend + Metro Heights Commission"
                    className="w-full px-3 py-1.5 bg-[#0b1326] border border-[#222a3d] rounded text-white text-xs"
                  />
                </div>

                <div className="p-3 bg-[#4edea3]/10 border border-[#4edea3]/20 rounded text-[11px] text-[#dae2fd]">
                  Supplemental earnings are automatically taxed at the <strong>flat 22.0% IRS federal supplemental withholding rate</strong> pursuant to IRS Publication 15-T.
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustingEmp(null)}
                    className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-semibold text-xs cursor-pointer"
                  >
                    Save & Recalculate
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Official Certified Paystub Modal */}
      {selectedPaystubEmp && (() => {
        const empCalc = employeeCalculations.find((c) => c.emp.id === selectedPaystubEmp.id) || employeeCalculations[0];
        const { taxResult } = empCalc;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
              {/* Paystub Header */}
              <div className="p-5 border-b border-[#222a3d] flex items-center justify-between bg-[#0b1326]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">Bid Exact LLC</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] font-bold">
                      CERTIFIED PAYSTUB
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#222a3d] text-[#adc6ff]">
                      IRS PUB 15-T
                    </span>
                  </div>
                  <p className="text-[11px] text-[#86948a] mt-0.5">
                    Pay Period: Sep 16 - Sep 30, 2024 • Direct Deposit ACH Batch
                  </p>
                </div>
                <button
                  onClick={() => setSelectedPaystubEmp(null)}
                  className="p-1.5 rounded-md hover:bg-[#222a3d] text-[#86948a] hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Paystub Body */}
              <div className="p-6 space-y-5 text-xs overflow-y-auto flex-1">
                {/* Employee & Company Metadata */}
                <div className="grid grid-cols-2 gap-4 p-3.5 bg-[#0b1326] border border-[#222a3d] rounded">
                  <div>
                    <div className="text-[10px] text-[#86948a] uppercase font-mono">Employee Name</div>
                    <div className="font-bold text-white text-sm">{selectedPaystubEmp.name}</div>
                    <div className="text-[#86948a]">{selectedPaystubEmp.role}</div>
                    <div className="font-mono text-[11px] text-[#86948a] mt-1">ID: {selectedPaystubEmp.id} • Dept: {selectedPaystubEmp.department}</div>
                  </div>
                  <div>
                    <div className="text-[10px] text-[#86948a] uppercase font-mono">Disbursement Info</div>
                    <div className="text-[#dae2fd]">{selectedPaystubEmp.directDeposit}</div>
                    <div className="text-[11px] text-[#86948a]">Pay Date: Sep 30, 2024</div>
                    <div className="text-[11px] text-[#86948a]">Filing: Single / 0 Allowances (Form W-4)</div>
                  </div>
                </div>

                {/* Earnings & Deductions Tables */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Earnings */}
                  <div className="space-y-2 p-3.5 bg-[#0b1326] border border-[#222a3d] rounded">
                    <div className="font-mono uppercase text-[11px] text-[#4edea3] font-bold flex items-center justify-between">
                      <span>Gross Earnings</span>
                      <span>Rate / Basis</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-[#222a3d]">
                      <span className="text-[#dae2fd]">Regular Bi-Weekly Salary</span>
                      <span className="font-mono text-white font-bold">
                        ${Math.round(empCalc.regularGross).toLocaleString()}
                      </span>
                    </div>
                    {empCalc.commission > 0 && (
                      <div className="flex justify-between py-1 border-b border-[#222a3d]">
                        <span className="text-[#dae2fd]">Project Margin Commission</span>
                        <span className="font-mono text-[#4edea3] font-bold">
                          +${Math.round(empCalc.commission).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {empCalc.bonus > 0 && (
                      <div className="flex justify-between py-1 border-b border-[#222a3d]">
                        <span className="text-[#dae2fd]">Turnaround Speed Bonus</span>
                        <span className="font-mono text-[#4edea3] font-bold">
                          +${Math.round(empCalc.bonus).toLocaleString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between py-1.5 pt-2 border-t border-[#222a3d]">
                      <span className="text-white font-bold">Total Gross Pay</span>
                      <span className="font-mono text-[#4edea3] font-bold text-sm">
                        ${Math.round(empCalc.totalGross).toLocaleString()}
                      </span>
                    </div>

                    {/* Pre-Tax Deductions */}
                    <div className="pt-2 border-t border-[#222a3d] space-y-1 text-[11px]">
                      <div className="font-mono uppercase text-[10px] text-[#adc6ff] font-bold">Pre-Tax Deductions</div>
                      <div className="flex justify-between text-[#86948a]">
                        <span>401(k) Employee (5%):</span>
                        <span className="font-mono text-white">-${taxResult.preTax401k.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[#86948a]">
                        <span>Health & Dental (Sec 125):</span>
                        <span className="font-mono text-white">-${taxResult.preTaxHealth.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[#4edea3] pt-1 border-t border-[#222a3d]">
                        <span>Safe Harbor 401(k) Co. Match (4%):</span>
                        <span className="font-mono font-bold">+${taxResult.employerSafeHarborMatch401k.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Taxes & CCPA Protected Deductions */}
                  <div className="space-y-2 p-3.5 bg-[#0b1326] border border-[#222a3d] rounded">
                    <div className="font-mono uppercase text-[11px] text-[#ffb4ab] font-bold">
                      Statutory Tax Withholdings
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#86948a]">Federal Income Tax (Reg):</span>
                      <span className="font-mono text-white">-${taxResult.federalIncomeTax.toLocaleString()}</span>
                    </div>
                    {taxResult.supplementalFederalTax > 0 && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#86948a]">Supplemental FIT (22% Flat):</span>
                        <span className="font-mono text-[#ffb4ab]">-${taxResult.supplementalFederalTax.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#86948a]">Illinois State Tax (4.95%):</span>
                      <span className="font-mono text-white">-${taxResult.stateIncomeTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#86948a]">Social Security OASDI (6.2%):</span>
                      <span className="font-mono text-white">-${taxResult.socialSecurityTax.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#86948a]">Medicare HI (1.45%):</span>
                      <span className="font-mono text-white">-${taxResult.medicareTax.toLocaleString()}</span>
                    </div>

                    {/* CCPA Loan Recovery Cap Section */}
                    <div className="pt-2 border-t border-[#222a3d] space-y-1 text-[11px]">
                      <div className="flex justify-between text-[#86948a]">
                        <span>CCPA Disposable Earnings:</span>
                        <span className="font-mono text-[#4edea3] font-bold">${taxResult.disposableEarnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-[#86948a]">
                        <span>CCPA 25% Maximum Cap:</span>
                        <span className="font-mono text-white">${taxResult.ccpaMaxLoanDeductionAllowed.toLocaleString()}</span>
                      </div>
                      {empCalc.actualLoanDeduction > 0 && (
                        <div className="flex justify-between text-white font-medium">
                          <span>Company Loan Repayment:</span>
                          <span className="font-mono text-[#ffb4ab]">-${empCalc.actualLoanDeduction.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Net Pay Highlight */}
                <div className="p-4 bg-[#4edea3]/10 border border-[#4edea3]/30 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-[10px] font-mono uppercase tracking-wider text-[#4edea3] font-bold">
                      Net Direct Deposit Take-Home
                    </div>
                    <div className="text-2xl font-bold font-mono text-white mt-0.5">
                      ${Math.round(empCalc.netPay).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                  <div className="text-right text-[11px] text-[#dae2fd]">
                    <div className="text-[#4edea3] font-bold">Status: Ready for ACH Batch</div>
                    <div className="text-[#86948a]">Disbursing from Chase Reserve ••2041</div>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-[#222a3d] bg-[#0b1326] flex items-center justify-between">
                <span className="text-[11px] text-[#86948a]">
                  Certified compliant with IRS Pub 15-T, FICA Statutory Caps & CCPA § 1673
                </span>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-1.5 bg-[#171f33] hover:bg-[#222a3d] text-white rounded font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Paystub</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Execute Payroll Confirmation Modal */}
      {isRunModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
          <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-[#222a3d] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-[#4edea3]/10 text-[#4edea3]">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Execute Payroll Batch Run</h3>
                  <p className="text-[11px] text-[#86948a]">Authorize direct deposit ACH transfers</p>
                </div>
              </div>
              <button
                onClick={() => setIsRunModalOpen(false)}
                className="p-1 rounded hover:bg-[#171f33] text-[#86948a] hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="p-3.5 bg-[#0b1326] border border-[#222a3d] rounded space-y-2 font-mono">
                <div className="flex justify-between font-sans">
                  <span className="text-[#86948a]">Pay Period:</span>
                  <span className="text-white font-medium">Sep 16 - Sep 30, 2024</span>
                </div>
                <div className="flex justify-between font-sans">
                  <span className="text-[#86948a]">Total Staff:</span>
                  <span className="text-white">{employees.length} Full-Time Personnel</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86948a]">Regular Salary Base:</span>
                  <span className="text-white">${Math.round(periodRegularGrossTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86948a]">Commissions & Bonuses:</span>
                  <span className="text-[#4edea3] font-bold">+${Math.round(periodSupplementalTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t border-[#222a3d] pt-1">
                  <span className="text-white font-bold">Total Gross Liability:</span>
                  <span className="text-white font-bold">${Math.round(periodGrossTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#86948a]">Tax Escrow (IRS + IL):</span>
                  <span className="text-[#ffb4ab]">-${Math.round(periodTaxesTotal).toLocaleString()}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-[#222a3d]">
                  <span className="text-[#4edea3] font-bold font-sans">Net ACH Direct Deposit:</span>
                  <span className="text-[#4edea3] font-bold text-sm">
                    ${Math.round(periodNetPayTotal).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-[#4edea3]/5 border border-[#4edea3]/20 rounded text-[11px] text-[#dae2fd]">
                Upon authorization, this transaction will be debited from <strong>Chase Payroll Reserve ••2041</strong> and logged in company treasury with automated payroll tax escrow.
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsRunModalOpen(false)}
                  className="px-3 py-1.5 rounded text-[#86948a] hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecutePayroll}
                  className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-semibold shadow-sm transition-all cursor-pointer"
                >
                  Confirm & Disburse Payroll
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Commission & Bonus Rules Configuration Modal */}
      <CommissionBonusRulesAdjusterModal
        isOpen={isAdjustRulesModalOpen}
        onClose={() => setIsAdjustRulesModalOpen(false)}
        employees={employees}
        onApplyToPayroll={(cfg) => setRulesConfig(cfg)}
      />

      {/* Corporate Treasury Rules Engine Modal */}
      <FinancialRulesAuditorModal
        isOpen={isRulesModalOpen}
        onClose={() => setIsRulesModalOpen(false)}
        employees={employees}
      />
    </div>
  );
};
