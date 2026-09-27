import React, { useState } from 'react';
import {
  X,
  Calculator,
  Percent,
  Award,
  CreditCard,
  Building2,
  CheckCircle2,
  Info,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Sliders,
  Users,
} from 'lucide-react';
import { EmployeeItem } from '../../types';
import {
  calculateCommission,
  calculateTurnaroundBonus,
  calculateProfitSharingBonus,
  calculateTaxWithholdings,
  calculateStripeFees,
  FINANCIAL_CONSTANTS,
} from '../../utils/financialRulesEngine';
import { CommissionBonusRulesAdjusterModal } from './CommissionBonusRulesAdjusterModal';

interface FinancialRulesAuditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'rules' | 'calculator';
  employees?: EmployeeItem[];
}

export const FinancialRulesAuditorModal: React.FC<FinancialRulesAuditorModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'rules',
  employees = [],
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'calculator'>(defaultTab);
  const [isAdjusterOpen, setIsAdjusterOpen] = useState(false);

  // Simulator States
  const [simType, setSimType] = useState<'commission' | 'bonus' | 'taxation' | 'stripe'>('commission');

  // Commission Sandbox
  const [commContract, setCommContract] = useState<number>(125000);
  const [commCosts, setCommCosts] = useState<number>(75000);
  const [commHours, setCommHours] = useState<number>(32);
  const [commTotalHours, setCommTotalHours] = useState<number>(40);
  const [commCollected, setCommCollected] = useState<boolean>(true);

  // Bonus Sandbox
  const [bonusLeadHours, setBonusLeadHours] = useState<number>(54);
  const [bonusAddendaErrors, setBonusAddendaErrors] = useState<number>(0);
  const [bonusProfitExcess, setBonusProfitExcess] = useState<number>(180000);
  const [bonusHurdle, setBonusHurdle] = useState<number>(120000);
  const [bonusSalary, setBonusSalary] = useState<number>(145000);
  const [bonusRating, setBonusRating] = useState<number>(4.8);

  // Tax & CCPA Sandbox
  const [taxGrossSalary, setTaxGrossSalary] = useState<number>(5500); // bi-weekly
  const [taxSupplemental, setTaxSupplemental] = useState<number>(1500); // commission/bonus
  const [tax401kPercent, setTax401kPercent] = useState<number>(5);
  const [taxLoanMonthlyPayment, setTaxLoanMonthlyPayment] = useState<number>(1200);

  // Stripe Sandbox
  const [stripeInvoiceAmount, setStripeInvoiceAmount] = useState<number>(65000);
  const [stripeMethod, setStripeMethod] = useState<'credit_card' | 'ach_debit' | 'wire_transfer'>('credit_card');
  const [stripePolicy, setStripePolicy] = useState<'absorb_by_company' | 'surcharge_to_client'>('absorb_by_company');

  if (!isOpen) return null;

  // Run Real Calculations
  const commResult = calculateCommission({
    contractValue: commContract,
    directCosts: commCosts,
    billableHours: commHours,
    totalProjectHours: commTotalHours,
    isCashCollected: commCollected,
  });

  const turnaroundResult = calculateTurnaroundBonus({
    leadTimeHoursAheadOfDeadline: bonusLeadHours,
    addendaErrorCount: bonusAddendaErrors,
  });

  const profitResult = calculateProfitSharingBonus({
    quarterlyNetProfit: bonusProfitExcess,
    ebitdaTargetHurdle: bonusHurdle,
    employeeSalary: bonusSalary,
    totalPayrollBase: 1200000,
    performanceRating: bonusRating,
  });

  const taxResult = calculateTaxWithholdings({
    regularWages: taxGrossSalary,
    supplementalWages: taxSupplemental,
    preTax401kPercent: tax401kPercent / 100,
    preTaxHealthDeduction: 175,
  });

  const stripeResult = calculateStripeFees({
    invoiceAmount: stripeInvoiceAmount,
    paymentMethod: stripeMethod,
    feePolicy: stripePolicy,
  });

  // Check CCPA cap against simulated loan payment
  const isLoanCappedByCcpa = taxLoanMonthlyPayment > taxResult.ccpaMaxLoanDeductionAllowed;
  const actualLoanDeducted = Math.min(taxLoanMonthlyPayment, taxResult.ccpaMaxLoanDeductionAllowed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-[#131b2e] border border-[#222a3d] rounded-xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222a3d] bg-[#0b1326] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#4edea3]/10 text-[#4edea3] border border-[#4edea3]/20">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white">
                  Corporate Treasury & Compensation Rules Engine
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/20 text-[#4edea3] font-bold">
                  BID EXACT CERTIFIED
                </span>
              </div>
              <p className="text-xs text-[#86948a]">
                Statutory formulas for Commissions, Bonuses, IRS Tax Withholding, Stripe Deductions & CCPA Caps
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAdjusterOpen(true)}
              className="h-8 px-3 bg-[#4edea3]/10 hover:bg-[#4edea3]/20 border border-[#4edea3]/30 text-[#4edea3] rounded text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Adjust Rules Manually</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-[#222a3d] text-[#86948a] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center px-5 pt-3 border-b border-[#222a3d] bg-[#0f172a] gap-2">
          <button
            onClick={() => setActiveTab('rules')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-[#4edea3] text-[#4edea3]'
                : 'border-transparent text-[#86948a] hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Statutory Policies & Logic Rules</span>
          </button>
          <button
            onClick={() => setActiveTab('calculator')}
            className={`pb-3 px-3 text-xs font-semibold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'calculator'
                ? 'border-[#4edea3] text-[#4edea3]'
                : 'border-transparent text-[#86948a] hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Interactive Rules Sandbox & Auditor</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-6 text-xs text-[#dae2fd]">
          {activeTab === 'rules' ? (
            <div className="space-y-6">
              {/* 1. Commissions */}
              <div className="bg-[#0b1326] border border-[#222a3d] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-[#4edea3]" />
                    <h3 className="font-bold text-sm text-white">1. Estimator Commission Engine</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3]">
                    Gross Margin Tied
                  </span>
                </div>
                <p className="text-[#86948a] leading-relaxed">
                  Commissions are calculated strictly on <strong>Gross Project Margin</strong> (Contract Revenue minus Direct Project Costs), aligning team incentives with profitability rather than uncollected top-line volume.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-[#131b2e] border border-[#222a3d] rounded">
                    <div className="text-[10px] font-mono text-[#86948a] uppercase">Floor / Sub-Hurdle</div>
                    <div className="text-lg font-bold font-mono text-[#ffb4ab]">0.0% Commission</div>
                    <div className="text-[11px] text-[#86948a] mt-1">&lt; 20% Gross Margin</div>
                  </div>
                  <div className="p-3 bg-[#131b2e] border border-[#222a3d] rounded">
                    <div className="text-[10px] font-mono text-[#86948a] uppercase">Standard Tier</div>
                    <div className="text-lg font-bold font-mono text-white">4.5% Commission</div>
                    <div className="text-[11px] text-[#86948a] mt-1">35% - 44.9% Target Margin</div>
                  </div>
                  <div className="p-3 bg-[#131b2e] border border-[#222a3d] rounded">
                    <div className="text-[10px] font-mono text-[#86948a] uppercase">Accelerated Tier</div>
                    <div className="text-lg font-bold font-mono text-[#4edea3]">7.0% Commission</div>
                    <div className="text-[11px] text-[#86948a] mt-1">≥ 45% High-Profit Margin</div>
                  </div>
                </div>
                <div className="p-3 bg-[#171f33] rounded border border-[#222a3d] space-y-1 text-[11px]">
                  <div className="text-white font-medium">Cash Collection & Clawback Protection Rules:</div>
                  <div className="text-[#86948a]">
                    • <strong>Cash Collection Trigger:</strong> Commissions enter <em>Accrued</em> status on invoice generation, but become <em>Payable</em> only when client funds are reconciled in Chase Operating ••8491.
                  </div>
                  <div className="text-[#86948a]">
                    • <strong>90-Day Clawback Rule:</strong> If a client invoice is written off, disputed, or refunded within 90 days, unearned commissions are clawed back against future disbursements.
                  </div>
                  <div className="text-[#86948a]">
                    • <strong>Split Allocation:</strong> Multiple estimators divide the pool based on billable bid hours: <code className="text-[#4edea3]">Share = Pool × (Estimator Hours / Total Bid Hours)</code>.
                  </div>
                </div>
              </div>

              {/* 2. Bonuses */}
              <div className="bg-[#0b1326] border border-[#222a3d] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#adc6ff]" />
                    <h3 className="font-bold text-sm text-white">2. Performance & Turnaround Speed Bonuses</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#3b82f6]/10 text-[#adc6ff]">
                    Zero-Defect Standard
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-[#131b2e] border border-[#222a3d] rounded space-y-1.5">
                    <div className="font-bold text-white text-xs">A. Project Turnaround Speed Bonus</div>
                    <p className="text-[#86948a] text-[11px]">
                      Awarded for early delivery of commercial takeoff packages ahead of General Contractor bid cutoffs with zero addenda defects:
                    </p>
                    <div className="font-mono text-[11px] space-y-1 text-[#dae2fd]">
                      <div>• ≥24 hrs ahead: <strong className="text-white">$500</strong></div>
                      <div>• ≥48 hrs ahead: <strong className="text-white">$1,000</strong></div>
                      <div>• ≥72 hrs ahead: <strong className="text-[#4edea3]">$1,500</strong></div>
                    </div>
                  </div>

                  <div className="p-3 bg-[#131b2e] border border-[#222a3d] rounded space-y-1.5">
                    <div className="font-bold text-white text-xs">B. EBITDA Profit Sharing Pool</div>
                    <p className="text-[#86948a] text-[11px]">
                      Quarterly incentive pool funded by <strong>15% of net profit exceeding the quarterly EBITDA hurdle</strong>:
                    </p>
                    <div className="font-mono text-[11px] space-y-1 text-[#dae2fd]">
                      <div>• Top rating (4.8 - 5.0): <strong className="text-[#4edea3]">1.5x Multiplier</strong></div>
                      <div>• High rating (4.5 - 4.7): <strong className="text-white">1.25x Multiplier</strong></div>
                      <div>• Standard (3.5 - 4.4): <strong className="text-white">1.0x Base Weight</strong></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Taxation */}
              <div className="bg-[#0b1326] border border-[#222a3d] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-[#ffb4ab]" />
                    <h3 className="font-bold text-sm text-white">3. Statutory Payroll Taxation & Supplemental Withholding</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ffb4ab]/10 text-[#ffb4ab]">
                    IRS Pub 15-T & IL Code
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1 text-center font-mono">
                  <div className="p-2.5 bg-[#131b2e] border border-[#222a3d] rounded">
                    <div className="text-[10px] text-[#86948a]">OASDI (SS) Cap</div>
                    <div className="font-bold text-white text-xs mt-0.5">$168,600</div>
                    <div className="text-[10px] text-[#86948a]">6.2% Emp + Match</div>
                  </div>
                  <div className="p-2.5 bg-[#131b2e] border border-[#222a3d] rounded">
                    <div className="text-[10px] text-[#86948a]">Medicare (HI)</div>
                    <div className="font-bold text-white text-xs mt-0.5">1.45% Flat</div>
                    <div className="text-[10px] text-[#86948a]">+0.9% &gt;$200k</div>
                  </div>
                  <div className="p-2.5 bg-[#131b2e] border border-[#222a3d] rounded">
                    <div className="text-[10px] text-[#86948a]">Supplemental Tax</div>
                    <div className="font-bold text-[#4edea3] text-xs mt-0.5">22.0% Flat</div>
                    <div className="text-[10px] text-[#86948a]">Bonuses & Comm</div>
                  </div>
                  <div className="p-2.5 bg-[#131b2e] border border-[#222a3d] rounded">
                    <div className="text-[10px] text-[#86948a]">Illinois SIT</div>
                    <div className="font-bold text-white text-xs mt-0.5">4.95% Flat</div>
                    <div className="text-[10px] text-[#86948a]">State Standard</div>
                  </div>
                </div>
                <div className="p-3 bg-[#171f33] rounded border border-[#222a3d] text-[11px] text-[#86948a] space-y-1">
                  <div>
                    • <strong>Safe Harbor 401(k) Match:</strong> Company matches 100% on first 3% of salary, plus 50% on next 2% (max 4.0% total company contribution).
                  </div>
                  <div>
                    • <strong>1099 Backup Withholding:</strong> Independent contractors without a certified W-9 on file are subject to mandatory 24.0% IRS backup withholding.
                  </div>
                  <div>
                    • <strong>CCPA 25% Disposable Earnings Cap:</strong> Total loan repayments and voluntary deductions cannot exceed 25% of disposable earnings in any single pay cycle.
                  </div>
                </div>
              </div>

              {/* 4. Stripe Fees */}
              <div className="bg-[#0b1326] border border-[#222a3d] rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-[#4edea3]" />
                    <h3 className="font-bold text-sm text-white">4. Stripe Gateway Fee Schedules & General Ledger Booking</h3>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#4edea3]/10 text-[#4edea3]">
                    Direct Bank API
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-[#131b2e] border border-[#222a3d] rounded space-y-1">
                    <div className="font-bold text-white text-xs">Credit Card Processing</div>
                    <div className="font-mono text-sm text-[#4edea3] font-bold">2.9% + $0.30</div>
                    <p className="text-[11px] text-[#86948a]">
                      Domestic Visa/Mastercard/Amex. International cards include +1.5% currency cross-border fee.
                    </p>
                  </div>
                  <div className="p-3 bg-[#131b2e] border border-[#222a3d] rounded space-y-1">
                    <div className="font-bold text-white text-xs">ACH Direct Debit (Recommended for Large Bids)</div>
                    <div className="font-mono text-sm text-[#4edea3] font-bold">0.8% Capped at $5.00 Max</div>
                    <p className="text-[11px] text-[#86948a]">
                      Saves thousands on five-figure and six-figure General Contractor progress invoices.
                    </p>
                  </div>
                </div>
                <div className="p-3 bg-[#171f33] rounded border border-[#222a3d] text-[11px] space-y-1">
                  <div className="text-white font-medium">Double-Entry Journal Balancing:</div>
                  <div className="font-mono text-[#dae2fd] space-y-0.5">
                    <div>DR Chase Operating ••8491 (Net Cash Inflow)</div>
                    <div>DR GL-5040 Payment Processing Fees (Stripe Expense)</div>
                    <div>CR GL-1200 Accounts Receivable (Gross Invoice Principal)</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* INTERACTIVE RULES CALCULATOR / SANDBOX */
            <div className="space-y-5">
              {/* Simulator Type Picker */}
              <div className="flex items-center gap-2 p-1.5 bg-[#0b1326] border border-[#222a3d] rounded-lg">
                <button
                  onClick={() => setSimType('commission')}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                    simType === 'commission' ? 'bg-[#4edea3] text-[#003824] font-bold shadow' : 'text-[#86948a] hover:text-white'
                  }`}
                >
                  Commission Simulator
                </button>
                <button
                  onClick={() => setSimType('bonus')}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                    simType === 'bonus' ? 'bg-[#4edea3] text-[#003824] font-bold shadow' : 'text-[#86948a] hover:text-white'
                  }`}
                >
                  Bonus & Turnaround
                </button>
                <button
                  onClick={() => setSimType('taxation')}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                    simType === 'taxation' ? 'bg-[#4edea3] text-[#003824] font-bold shadow' : 'text-[#86948a] hover:text-white'
                  }`}
                >
                  Taxes & CCPA Cap
                </button>
                <button
                  onClick={() => setSimType('stripe')}
                  className={`flex-1 py-1.5 px-3 rounded text-xs font-medium transition-colors cursor-pointer ${
                    simType === 'stripe' ? 'bg-[#4edea3] text-[#003824] font-bold shadow' : 'text-[#86948a] hover:text-white'
                  }`}
                >
                  Stripe Net Deductions
                </button>
              </div>

              {/* SIMULATOR 1: COMMISSION */}
              {simType === 'commission' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Project Inputs</h4>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">Contract Value ($)</label>
                      <input
                        type="number"
                        value={commContract}
                        onChange={(e) => setCommContract(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">Direct Project Costs ($)</label>
                      <input
                        type="number"
                        value={commCosts}
                        onChange={(e) => setCommCosts(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-[#86948a] block mb-1">Estimator Hours Logged</label>
                        <input
                          type="number"
                          value={commHours}
                          onChange={(e) => setCommHours(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[#86948a] block mb-1">Total Project Bid Hours</label>
                        <input
                          type="number"
                          value={commTotalHours}
                          onChange={(e) => setCommTotalHours(Number(e.target.value))}
                          className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="checkbox"
                        id="commCollected"
                        checked={commCollected}
                        onChange={(e) => setCommCollected(e.target.checked)}
                        className="rounded border-[#222a3d] accent-[#4edea3]"
                      />
                      <label htmlFor="commCollected" className="text-[11px] text-[#dae2fd] cursor-pointer">
                        Client invoice collected in Chase Operating (Reconciled)
                      </label>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                    <h4 className="font-bold text-[#4edea3] text-xs uppercase tracking-wider">Engine Calculation</h4>
                    <div className="p-3 bg-[#131b2e] rounded border border-[#222a3d] space-y-2">
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Gross Profit Margin:</span>
                        <span className="font-mono text-white font-bold">
                          ${commResult.grossMarginAmount.toLocaleString()} ({commResult.grossMarginPercent}%)
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Commission Tier:</span>
                        <span className="font-mono text-[#4edea3] font-bold">{commResult.tierApplied}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Total Project Commission Pool:</span>
                        <span className="font-mono text-white font-bold">
                          ${commResult.totalCommissionPool.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Estimator Split ({commResult.estimatorSharePercent}%):</span>
                        <span className="font-mono text-white font-bold">
                          ${commResult.estimatorCommission.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#222a3d]">
                        <span className="text-[#86948a]">Disbursement Status:</span>
                        <span className={`font-mono font-bold px-1.5 py-0.5 rounded text-[10px] ${
                          commResult.collectionStatus.includes('Payable') ? 'bg-[#4edea3]/20 text-[#4edea3]' : 'bg-[#adc6ff]/20 text-[#adc6ff]'
                        }`}>
                          {commResult.collectionStatus}
                        </span>
                      </div>
                    </div>
                    <div className="text-[11px] text-[#86948a] p-2 bg-[#171f33] rounded border border-[#222a3d]">
                      {commResult.notes}
                    </div>
                  </div>
                </div>
              )}

              {/* SIMULATOR 2: BONUS */}
              {simType === 'bonus' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Turnaround & EBITDA Inputs</h4>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">Lead Time Ahead of GC Deadline (Hours)</label>
                      <input
                        type="number"
                        value={bonusLeadHours}
                        onChange={(e) => setBonusLeadHours(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">Addenda Errors in Deliverable</label>
                      <input
                        type="number"
                        value={bonusAddendaErrors}
                        onChange={(e) => setBonusAddendaErrors(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">Annual Employee Salary ($)</label>
                      <input
                        type="number"
                        value={bonusSalary}
                        onChange={(e) => setBonusSalary(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">Performance Rating (1.0 - 5.0)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={bonusRating}
                        onChange={(e) => setBonusRating(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                    <h4 className="font-bold text-[#4edea3] text-xs uppercase tracking-wider">Calculated Awards</h4>
                    <div className="p-3 bg-[#131b2e] rounded border border-[#222a3d] space-y-2">
                      <div className="text-xs font-bold text-white">Project Turnaround Speed Bonus:</div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Gross Award:</span>
                        <span className="font-mono text-[#4edea3] font-bold">${turnaroundResult.finalBonusAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">IRS Supplemental Tax (22.0%):</span>
                        <span className="font-mono text-[#ffb4ab]">-${turnaroundResult.supplementalTaxWithheld.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[#222a3d]">
                        <span className="text-white font-medium">Net Take-Home Bonus:</span>
                        <span className="font-mono text-white font-bold">${turnaroundResult.netBonus.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-[#86948a] italic pt-1">{turnaroundResult.criteriaMet}</div>
                    </div>

                    <div className="p-3 bg-[#131b2e] rounded border border-[#222a3d] space-y-1.5">
                      <div className="text-xs font-bold text-white">Quarterly EBITDA Profit Share Allocation:</div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Allocated Share:</span>
                        <span className="font-mono text-[#4edea3] font-bold">${profitResult.finalBonusAmount.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Performance Multiplier:</span>
                        <span className="font-mono text-white">{profitResult.performanceMultiplier}x</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SIMULATOR 3: TAXATION & CCPA */}
              {simType === 'taxation' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Payroll & Loan Inputs</h4>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">Bi-Weekly Regular Gross ($)</label>
                      <input
                        type="number"
                        value={taxGrossSalary}
                        onChange={(e) => setTaxGrossSalary(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">Supplemental Pay (Commissions + Bonuses) ($)</label>
                      <input
                        type="number"
                        value={taxSupplemental}
                        onChange={(e) => setTaxSupplemental(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">401(k) Employee Contribution (%)</label>
                      <input
                        type="number"
                        value={tax401kPercent}
                        onChange={(e) => setTax401kPercent(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">Active Loan Repayment Deduction Request ($)</label>
                      <input
                        type="number"
                        value={taxLoanMonthlyPayment}
                        onChange={(e) => setTaxLoanMonthlyPayment(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      />
                    </div>
                  </div>

                  <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                    <h4 className="font-bold text-[#4edea3] text-xs uppercase tracking-wider">Tax & CCPA Compliance Breakdown</h4>
                    <div className="p-3 bg-[#131b2e] rounded border border-[#222a3d] space-y-1.5 font-mono text-[11px]">
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Total Gross Earnings:</span>
                        <span className="text-white font-bold">${taxResult.grossWages.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Pre-Tax 401(k) Deduction:</span>
                        <span className="text-[#dae2fd]">-${taxResult.preTax401k.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Safe Harbor Co. Match (4%):</span>
                        <span className="text-[#4edea3]">+${taxResult.employerSafeHarborMatch401k.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Federal Income Tax (Reg):</span>
                        <span className="text-[#ffb4ab]">-${taxResult.federalIncomeTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Supplemental Tax (22.0% Flat):</span>
                        <span className="text-[#ffb4ab]">-${taxResult.supplementalFederalTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">State Income Tax (4.95%):</span>
                        <span className="text-[#ffb4ab]">-${taxResult.stateIncomeTax.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">FICA (SS 6.2% + Med 1.45%):</span>
                        <span className="text-[#ffb4ab]">-${taxResult.totalFicaEmployee.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between pt-1.5 border-t border-[#222a3d]">
                        <span className="text-white font-bold">CCPA Disposable Earnings:</span>
                        <span className="text-[#4edea3] font-bold">${taxResult.disposableEarnings.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">CCPA 25% Max Loan Cap:</span>
                        <span className="text-white font-bold">${taxResult.ccpaMaxLoanDeductionAllowed.toLocaleString()}</span>
                      </div>
                    </div>

                    {isLoanCappedByCcpa ? (
                      <div className="p-2.5 bg-[#ffb4ab]/10 border border-[#ffb4ab]/30 rounded text-[11px] text-[#ffb4ab] flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 shrink-0" />
                        <span>
                          <strong>CCPA Statutory Protection Triggered:</strong> Requested loan deduction of ${taxLoanMonthlyPayment.toLocaleString()} exceeds 25% of disposable earnings. Capped at ${actualLoanDeducted.toLocaleString()}.
                        </span>
                      </div>
                    ) : (
                      <div className="p-2 bg-[#4edea3]/10 border border-[#4edea3]/20 rounded text-[11px] text-[#4edea3] flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 shrink-0" />
                        <span>Loan deduction is within CCPA 25% disposable earnings limits.</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SIMULATOR 4: STRIPE */}
              {simType === 'stripe' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                    <h4 className="font-bold text-white text-xs uppercase tracking-wider">Payment Parameters</h4>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">Invoice Principal Amount ($)</label>
                      <input
                        type="number"
                        value={stripeInvoiceAmount}
                        onChange={(e) => setStripeInvoiceAmount(Number(e.target.value))}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">Payment Method</label>
                      <select
                        value={stripeMethod}
                        onChange={(e) => setStripeMethod(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      >
                        <option value="credit_card">Credit Card (2.9% + $0.30)</option>
                        <option value="ach_debit">ACH Direct Debit (0.8% Capped at $5.00)</option>
                        <option value="wire_transfer">Direct Bank Wire ($0.00)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-[#86948a] block mb-1">Corporate Fee Policy</label>
                      <select
                        value={stripePolicy}
                        onChange={(e) => setStripePolicy(e.target.value as any)}
                        className="w-full px-3 py-1.5 bg-[#131b2e] border border-[#222a3d] rounded font-mono text-white text-xs"
                      >
                        <option value="absorb_by_company">Absorbed by Bid Exact LLC</option>
                        <option value="surcharge_to_client">Surcharge Client (Pass Convenience Fee)</option>
                      </select>
                    </div>
                  </div>

                  <div className="p-4 bg-[#0b1326] border border-[#222a3d] rounded-lg space-y-3">
                    <h4 className="font-bold text-[#4edea3] text-xs uppercase tracking-wider">Net Settlement & GL Booking</h4>
                    <div className="p-3 bg-[#131b2e] rounded border border-[#222a3d] space-y-2 font-mono text-xs">
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Client Billed / Charged:</span>
                        <span className="font-bold text-white">${stripeResult.grossAmountCharged.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#86948a]">Stripe Fee Deducted:</span>
                        <span className="font-bold text-[#ffb4ab]">-${stripeResult.stripeFeeDeduction.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-[#222a3d]">
                        <span className="text-[#4edea3] font-bold">Net Deposited to Chase:</span>
                        <span className="font-bold text-base text-[#4edea3]">
                          ${stripeResult.netCashDeposited.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>

                    <div className="p-3 bg-[#171f33] rounded border border-[#222a3d] space-y-1">
                      <div className="text-[10px] uppercase font-mono text-[#86948a]">Automated Journal Entries:</div>
                      {stripeResult.glJournalEntries.map((je, idx) => (
                        <div key={idx} className="flex justify-between text-[11px] font-mono">
                          <span className="text-[#dae2fd]">{je.account.split('(')[0]}</span>
                          <span className={je.debit > 0 ? 'text-[#4edea3]' : 'text-[#86948a]'}>
                            {je.debit > 0 ? `DR $${je.debit.toLocaleString()}` : `CR $${je.credit.toLocaleString()}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#222a3d] bg-[#0b1326] flex items-center justify-between">
          <div className="flex items-center gap-2 text-[11px] text-[#86948a]">
            <Info className="w-4 h-4 text-[#4edea3]" />
            <span>All calculations conform to IRS Publication 15-T, Illinois Revenue Code, and Stripe API v2024.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#4edea3] hover:bg-[#40cf95] text-[#003824] rounded font-semibold text-xs transition-colors cursor-pointer"
          >
            Close Rules Engine
          </button>
        </div>
      </div>

      {/* Manual Commission & Bonus Rules Adjuster Modal */}
      <CommissionBonusRulesAdjusterModal
        isOpen={isAdjusterOpen}
        onClose={() => setIsAdjusterOpen(false)}
        employees={employees}
      />
    </div>
  );
};
