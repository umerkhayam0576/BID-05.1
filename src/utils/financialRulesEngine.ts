import {
  CommissionCalculationResult,
  BonusCalculationResult,
  TaxWithholdingResult,
  StripeFeeResult,
  EmployeeItem,
  FinancialRulesAdjustmentConfig,
  SalesCommissionRuleConfig,
  TeamTargetRule,
  ServiceEarlySubmissionRule,
  SalesCommissionCalculationResult,
  TeamTargetCalculationResult,
  TeamMemberPayout,
  ServiceEarlyBonusCalculationResult,
  CommissionSettingsState,
} from '../types';

// ==========================================
// 1. COMMISSION LOGIC ENGINE
// ==========================================

export interface CommissionInput {
  contractValue: number;
  directCosts: number;
  billableHours?: number;
  totalProjectHours?: number;
  isCashCollected?: boolean;
  daysSinceCollection?: number;
}

export const FINANCIAL_CONSTANTS = {
  // Statutory Tax Thresholds (IRS & Illinois)
  OASDI_WAGE_BASE_CAP: 168600, // 2024/2026 Social Security Cap
  OASDI_RATE: 0.062, // 6.2%
  MEDICARE_RATE: 0.0145, // 1.45%
  ADDITIONAL_MEDICARE_THRESHOLD: 200000, // $200k threshold
  ADDITIONAL_MEDICARE_RATE: 0.009, // 0.9%
  SUPPLEMENTAL_WAGE_TAX_RATE: 0.22, // Flat 22% Federal Supplemental Tax
  STATE_TAX_RATE_IL: 0.0495, // 4.95% Illinois flat income tax
  CONTRACTOR_BACKUP_WITHHOLDING_RATE: 0.24, // 24% IRS Mandatory Backup Withholding

  // Safe Harbor 401(k) Match Limits
  SAFE_HARBOR_MATCH_TIER_1: 0.03, // 100% on first 3%
  SAFE_HARBOR_MATCH_TIER_2: 0.02, // 50% on next 2%
  MAX_SAFE_HARBOR_MATCH_PERCENT: 0.04, // 4% Total Company Match

  // CCPA Consumer Credit Protection Act
  CCPA_DISPOSABLE_EARNINGS_CAP: 0.25, // 25% max payroll garnishment/loan recovery

  // Stripe Processing Fees
  STRIPE_CC_PERCENT: 0.029, // 2.9%
  STRIPE_CC_FIXED: 0.30, // $0.30
  STRIPE_CC_INTERNATIONAL_SURCHARGE: 0.015, // +1.5%
  STRIPE_ACH_PERCENT: 0.008, // 0.8%
  STRIPE_ACH_CAP: 5.00, // Capped at $5.00 max
  WIRE_TRANSFER_FEE: 0.00, // Direct bank wire

  // Commission Gross Margin Hurdle & Tiers
  COMMISSION_MARGIN_HURDLE: 0.20, // 20% minimum gross margin floor
  COMMISSION_TIER_ENTRY: 0.025, // 2.5% for 20% - 34.9% margin
  COMMISSION_TIER_STANDARD: 0.045, // 4.5% for 35% - 44.9% margin
  COMMISSION_TIER_ACCELERATED: 0.070, // 7.0% for >= 45% margin
  COMMISSION_CLAWBACK_WINDOW_DAYS: 90, // 90-day dispute/clawback window
};

/**
 * Calculates estimator commission based on contract gross margin,
 * collaborative billable hours split, and collection status.
 */
export function calculateCommission(input: CommissionInput): CommissionCalculationResult {
  const {
    contractValue,
    directCosts,
    billableHours = 40,
    totalProjectHours = 40,
    isCashCollected = true,
    daysSinceCollection = 14,
  } = input;

  const grossMarginAmount = Math.max(0, contractValue - directCosts);
  const grossMarginPercent = contractValue > 0 ? (grossMarginAmount / contractValue) * 100 : 0;

  let commissionRate = 0;
  let tierApplied = 'Sub-Hurdle (<20% Margin)';
  let notes = 'Project gross margin fell below the 20% corporate profitability floor. No commission accrued.';

  if (grossMarginPercent >= 45) {
    commissionRate = FINANCIAL_CONSTANTS.COMMISSION_TIER_ACCELERATED;
    tierApplied = 'Accelerated Tier (≥45% Margin - 7.0%)';
    notes = 'Exceptional project profitability achieved! Qualified for 7.0% accelerated commission tier.';
  } else if (grossMarginPercent >= 35) {
    commissionRate = FINANCIAL_CONSTANTS.COMMISSION_TIER_STANDARD;
    tierApplied = 'Standard Pre-Con Tier (35%-44.9% Margin - 4.5%)';
    notes = 'Target margin criteria satisfied. 4.5% commission accrued on gross project profit.';
  } else if (grossMarginPercent >= 20) {
    commissionRate = FINANCIAL_CONSTANTS.COMMISSION_TIER_ENTRY;
    tierApplied = 'Entry Margin Tier (20%-34.9% Margin - 2.5%)';
    notes = 'Base profitability met above 20% floor. 2.5% entry tier commission accrued.';
  }

  const totalCommissionPool = Math.round(grossMarginAmount * commissionRate);
  const shareRatio = totalProjectHours > 0 ? Math.min(1, Math.max(0, billableHours / totalProjectHours)) : 1;
  const estimatorCommission = Math.round(totalCommissionPool * shareRatio);

  let collectionStatus: CommissionCalculationResult['collectionStatus'] = 'Accrued (Pending Collection)';
  let clawbackWindowDaysRemaining = undefined;

  if (isCashCollected) {
    collectionStatus = 'Payable (Cash Collected)';
    clawbackWindowDaysRemaining = Math.max(0, FINANCIAL_CONSTANTS.COMMISSION_CLAWBACK_WINDOW_DAYS - daysSinceCollection);
  }

  return {
    contractValue,
    directCosts,
    grossMarginAmount,
    grossMarginPercent: Number(grossMarginPercent.toFixed(1)),
    tierApplied,
    commissionRate,
    totalCommissionPool,
    estimatorSharePercent: Number((shareRatio * 100).toFixed(1)),
    estimatorCommission,
    collectionStatus,
    clawbackWindowDaysRemaining,
    notes,
  };
}

// ==========================================
// 2. BONUS LOGIC ENGINE
// ==========================================

export interface TurnaroundBonusInput {
  leadTimeHoursAheadOfDeadline: number;
  addendaErrorCount: number;
  baseAward?: number;
}

export interface ProfitSharingBonusInput {
  quarterlyNetProfit: number;
  ebitdaTargetHurdle: number;
  employeeSalary: number;
  totalPayrollBase: number;
  performanceRating: number; // 1.0 to 5.0
  daysEmployedInYear?: number;
}

/**
 * Calculates Project Turnaround Speed Bonus
 * Rewards early pre-construction deliverables with zero QA addenda errors.
 */
export function calculateTurnaroundBonus(input: TurnaroundBonusInput): BonusCalculationResult {
  const { leadTimeHoursAheadOfDeadline, addendaErrorCount } = input;

  let baseAmount = 0;
  let criteriaMet = 'Did not qualify for early turnaround bonus.';

  if (addendaErrorCount > 0) {
    criteriaMet = `Ineligible: ${addendaErrorCount} QA addenda errors detected. Turnaround bonus requires 100% zero-defect takeoff deliverables.`;
  } else if (leadTimeHoursAheadOfDeadline >= 72) {
    baseAmount = 1500;
    criteriaMet = 'Delivered ≥72 hours ahead of GC bid deadline with zero addenda defects ($1,500 Tier).';
  } else if (leadTimeHoursAheadOfDeadline >= 48) {
    baseAmount = 1000;
    criteriaMet = 'Delivered ≥48 hours ahead of GC bid deadline with zero addenda defects ($1,000 Tier).';
  } else if (leadTimeHoursAheadOfDeadline >= 24) {
    baseAmount = 500;
    criteriaMet = 'Delivered ≥24 hours ahead of GC bid deadline with zero addenda defects ($500 Tier).';
  } else {
    criteriaMet = 'Delivery completed within standard 24h window. No early delivery bonus awarded.';
  }

  const finalBonusAmount = baseAmount;
  const supplementalTaxWithheld = Math.round(finalBonusAmount * FINANCIAL_CONSTANTS.SUPPLEMENTAL_WAGE_TAX_RATE);
  const netBonus = finalBonusAmount - supplementalTaxWithheld;

  return {
    bonusType: 'turnaround_speed',
    baseAmount,
    performanceMultiplier: 1.0,
    prorationFactor: 1.0,
    finalBonusAmount,
    supplementalTaxRate: FINANCIAL_CONSTANTS.SUPPLEMENTAL_WAGE_TAX_RATE,
    supplementalTaxWithheld,
    netBonus,
    criteriaMet,
  };
}

/**
 * Calculates EBITDA Quarterly Profit Sharing Bonus
 * Allocates 15% of excess profit across staff based on salary weight and performance rating.
 */
export function calculateProfitSharingBonus(input: ProfitSharingBonusInput): BonusCalculationResult {
  const {
    quarterlyNetProfit,
    ebitdaTargetHurdle,
    employeeSalary,
    totalPayrollBase,
    performanceRating,
    daysEmployedInYear = 365,
  } = input;

  const excessProfit = Math.max(0, quarterlyNetProfit - ebitdaTargetHurdle);
  const totalBonusPool = excessProfit * 0.15; // 15% of profit above EBITDA hurdle

  let performanceMultiplier = 1.0;
  if (performanceRating >= 4.8) {
    performanceMultiplier = 1.5; // Top tier performer
  } else if (performanceRating >= 4.5) {
    performanceMultiplier = 1.25;
  } else if (performanceRating < 3.5) {
    performanceMultiplier = 0.5;
  }

  const salaryWeight = totalPayrollBase > 0 ? employeeSalary / totalPayrollBase : 0;
  const prorationFactor = Math.min(1, Math.max(0, daysEmployedInYear / 365));

  const baseAmount = Math.round(totalBonusPool * salaryWeight);
  const finalBonusAmount = Math.round(baseAmount * performanceMultiplier * prorationFactor);

  const supplementalTaxWithheld = Math.round(finalBonusAmount * FINANCIAL_CONSTANTS.SUPPLEMENTAL_WAGE_TAX_RATE);
  const netBonus = finalBonusAmount - supplementalTaxWithheld;

  const criteriaMet = excessProfit > 0
    ? `Quarterly net profit ($${quarterlyNetProfit.toLocaleString()}) exceeded EBITDA hurdle ($${ebitdaTargetHurdle.toLocaleString()}) by $${excessProfit.toLocaleString()}. Allocated from 15% pool at ${performanceMultiplier}x performance rating.`
    : `Quarterly net profit did not exceed EBITDA hurdle of $${ebitdaTargetHurdle.toLocaleString()}. No pool distributed.`;

  return {
    bonusType: 'ebitda_profit_sharing',
    baseAmount,
    performanceMultiplier,
    prorationFactor: Number(prorationFactor.toFixed(2)),
    finalBonusAmount,
    supplementalTaxRate: FINANCIAL_CONSTANTS.SUPPLEMENTAL_WAGE_TAX_RATE,
    supplementalTaxWithheld,
    netBonus,
    criteriaMet,
  };
}

// ==========================================
// 3. STATUTORY TAXATION & WITHHOLDING ENGINE
// ==========================================

export interface TaxWithholdingInput {
  regularWages: number;
  supplementalWages?: number; // Commissions + Bonuses
  ytdGrossWages?: number;
  preTax401kPercent?: number; // e.g. 0.05 for 5%
  preTaxHealthDeduction?: number;
  isContractor1099?: boolean;
  hasUncertifiedW9?: boolean;
}

/**
 * Calculates certified payroll tax withholdings adhering to IRS Pub 15-T,
 * FICA Social Security statutory caps, Additional Medicare, flat 22% Supplemental rate,
 * State Income Tax (IL 4.95%), Safe Harbor 401(k) company match, and CCPA 25% limit.
 */
export function calculateTaxWithholdings(input: TaxWithholdingInput): TaxWithholdingResult {
  const {
    regularWages,
    supplementalWages = 0,
    ytdGrossWages = 60000,
    preTax401kPercent = 0.05,
    preTaxHealthDeduction = 175,
    isContractor1099 = false,
    hasUncertifiedW9 = false,
  } = input;

  const grossWages = regularWages + supplementalWages;

  // If independent 1099 contractor
  if (isContractor1099) {
    const backupRate = hasUncertifiedW9 ? FINANCIAL_CONSTANTS.CONTRACTOR_BACKUP_WITHHOLDING_RATE : 0;
    const backupTax = Math.round(grossWages * backupRate);

    return {
      grossWages,
      regularWages,
      supplementalWages,
      preTax401k: 0,
      preTaxHealth: 0,
      taxableWagesFit: grossWages,
      federalIncomeTax: backupTax,
      supplementalFederalTax: 0,
      totalFederalIncomeTax: backupTax,
      stateIncomeTax: 0,
      socialSecurityTax: 0,
      socialSecurityEmployerMatch: 0,
      medicareTax: 0,
      medicareEmployerMatch: 0,
      additionalMedicareTax: 0,
      totalFicaEmployee: 0,
      totalFicaEmployer: 0,
      employerSafeHarborMatch401k: 0,
      totalEmployeeTaxes: backupTax,
      disposableEarnings: grossWages - backupTax,
      ccpaMaxLoanDeductionAllowed: Math.round((grossWages - backupTax) * FINANCIAL_CONSTANTS.CCPA_DISPOSABLE_EARNINGS_CAP),
    };
  }

  // 1. Pre-Tax Deductions (401k & Section 125 Health)
  const preTax401k = Math.round(regularWages * preTax401kPercent);
  const preTaxHealth = preTaxHealthDeduction;
  const totalPreTaxDeductions = preTax401k + preTaxHealth;

  // 2. Safe Harbor Employer 401(k) Match
  // 100% match on first 3%, 50% match on next 2% (max 4.0% employer contribution)
  let safeHarborMatchPercent = 0;
  if (preTax401kPercent >= 0.05) {
    safeHarborMatchPercent = 0.04; // full 4% match
  } else if (preTax401kPercent >= 0.03) {
    safeHarborMatchPercent = 0.03 + (preTax401kPercent - 0.03) * 0.5;
  } else {
    safeHarborMatchPercent = preTax401kPercent;
  }
  const employerSafeHarborMatch401k = Math.round(regularWages * safeHarborMatchPercent);

  // 3. Taxable Wages for Federal and State Income Tax
  const taxableWagesFit = Math.max(0, grossWages - totalPreTaxDeductions);

  // 4. Federal Income Tax (FIT)
  // Regular wages: Standard effective bracket estimate (~16.5% for pre-con engineering salary range)
  const regularTaxable = Math.max(0, regularWages - totalPreTaxDeductions);
  const federalIncomeTax = Math.round(regularTaxable * 0.165);

  // Supplemental wages (Commissions & Bonuses): IRS flat 22.0% Supplemental Wage Rate
  const supplementalFederalTax = Math.round(supplementalWages * FINANCIAL_CONSTANTS.SUPPLEMENTAL_WAGE_TAX_RATE);
  const totalFederalIncomeTax = federalIncomeTax + supplementalFederalTax;

  // 5. State Income Tax (Illinois flat 4.95%)
  const stateIncomeTax = Math.round(taxableWagesFit * FINANCIAL_CONSTANTS.STATE_TAX_RATE_IL);

  // 6. Social Security Tax (OASDI 6.2% with $168,600 wage base cap)
  const remainingSocialSecurityCap = Math.max(0, FINANCIAL_CONSTANTS.OASDI_WAGE_BASE_CAP - ytdGrossWages);
  const ssTaxableWages = Math.min(grossWages, remainingSocialSecurityCap);
  const socialSecurityTax = Math.round(ssTaxableWages * FINANCIAL_CONSTANTS.OASDI_RATE);
  const socialSecurityEmployerMatch = socialSecurityTax;

  // 7. Medicare Tax (HI 1.45% + Additional 0.9% > $200k)
  const medicareTax = Math.round(grossWages * FINANCIAL_CONSTANTS.MEDICARE_RATE);
  const medicareEmployerMatch = medicareTax;

  // Additional Medicare tax (0.9% employee-only on earnings exceeding $200,000 threshold)
  let additionalMedicareTax = 0;
  if (ytdGrossWages + grossWages > FINANCIAL_CONSTANTS.ADDITIONAL_MEDICARE_THRESHOLD) {
    const excessWages = Math.max(0, (ytdGrossWages + grossWages) - Math.max(FINANCIAL_CONSTANTS.ADDITIONAL_MEDICARE_THRESHOLD, ytdGrossWages));
    additionalMedicareTax = Math.round(excessWages * FINANCIAL_CONSTANTS.ADDITIONAL_MEDICARE_RATE);
  }

  const totalFicaEmployee = socialSecurityTax + medicareTax + additionalMedicareTax;
  const totalFicaEmployer = socialSecurityEmployerMatch + medicareEmployerMatch;

  // Total Statutory Employee Tax
  const totalEmployeeTaxes = totalFederalIncomeTax + stateIncomeTax + totalFicaEmployee;

  // CCPA Disposable Earnings = Gross Wages - Mandatory Statutory Taxes
  const disposableEarnings = Math.max(0, grossWages - totalEmployeeTaxes);
  const ccpaMaxLoanDeductionAllowed = Math.round(disposableEarnings * FINANCIAL_CONSTANTS.CCPA_DISPOSABLE_EARNINGS_CAP);

  return {
    grossWages,
    regularWages,
    supplementalWages,
    preTax401k,
    preTaxHealth,
    taxableWagesFit,
    federalIncomeTax,
    supplementalFederalTax,
    totalFederalIncomeTax,
    stateIncomeTax,
    socialSecurityTax,
    socialSecurityEmployerMatch,
    medicareTax,
    medicareEmployerMatch,
    additionalMedicareTax,
    totalFicaEmployee,
    totalFicaEmployer,
    employerSafeHarborMatch401k,
    totalEmployeeTaxes,
    disposableEarnings,
    ccpaMaxLoanDeductionAllowed,
  };
}

// ==========================================
// 4. STRIPE & PAYMENT GATEWAY FEE ENGINE
// ==========================================

export interface StripeFeeInput {
  invoiceAmount: number;
  paymentMethod: 'credit_card' | 'ach_debit' | 'wire_transfer';
  feePolicy?: 'absorb_by_company' | 'surcharge_to_client';
  isInternationalCard?: boolean;
}

/**
 * Calculates Stripe processing fees, client surcharges, net bank deposit,
 * and double-entry General Ledger booking for client invoice settlements.
 */
export function calculateStripeFees(input: StripeFeeInput): StripeFeeResult {
  const {
    invoiceAmount,
    paymentMethod,
    feePolicy = 'absorb_by_company',
    isInternationalCard = false,
  } = input;

  let percentageFeeRate = 0;
  let fixedFee = 0;

  if (paymentMethod === 'credit_card') {
    percentageFeeRate = FINANCIAL_CONSTANTS.STRIPE_CC_PERCENT + (isInternationalCard ? FINANCIAL_CONSTANTS.STRIPE_CC_INTERNATIONAL_SURCHARGE : 0);
    fixedFee = FINANCIAL_CONSTANTS.STRIPE_CC_FIXED;
  } else if (paymentMethod === 'ach_debit') {
    percentageFeeRate = FINANCIAL_CONSTANTS.STRIPE_ACH_PERCENT;
    fixedFee = 0;
  } else {
    // Direct Bank Wire Transfer
    percentageFeeRate = 0;
    fixedFee = FINANCIAL_CONSTANTS.WIRE_TRANSFER_FEE;
  }

  let grossAmountCharged = invoiceAmount;
  let stripeFeeDeduction = 0;

  if (feePolicy === 'surcharge_to_client') {
    // Surcharge formula: (Target Invoice + Fixed Fee) / (1 - Rate)
    // Ensures company receives exactly invoiceAmount net of Stripe deductions
    if (paymentMethod === 'credit_card') {
      grossAmountCharged = Number(((invoiceAmount + fixedFee) / (1 - percentageFeeRate)).toFixed(2));
      stripeFeeDeduction = Number((grossAmountCharged - invoiceAmount).toFixed(2));
    } else if (paymentMethod === 'ach_debit') {
      const rawFee = invoiceAmount * percentageFeeRate;
      const achFee = Math.min(rawFee, FINANCIAL_CONSTANTS.STRIPE_ACH_CAP);
      grossAmountCharged = invoiceAmount + achFee;
      stripeFeeDeduction = Number(achFee.toFixed(2));
    } else {
      grossAmountCharged = invoiceAmount;
      stripeFeeDeduction = 0;
    }
  } else {
    // Company absorbs the fee
    grossAmountCharged = invoiceAmount;
    if (paymentMethod === 'credit_card') {
      stripeFeeDeduction = Number(((invoiceAmount * percentageFeeRate) + fixedFee).toFixed(2));
    } else if (paymentMethod === 'ach_debit') {
      const rawFee = invoiceAmount * percentageFeeRate;
      stripeFeeDeduction = Number(Math.min(rawFee, FINANCIAL_CONSTANTS.STRIPE_ACH_CAP).toFixed(2));
    } else {
      stripeFeeDeduction = 0;
    }
  }

  const netCashDeposited = Number((grossAmountCharged - stripeFeeDeduction).toFixed(2));
  const effectiveFeePercent = grossAmountCharged > 0 ? Number(((stripeFeeDeduction / grossAmountCharged) * 100).toFixed(2)) : 0;

  // General Ledger Double-Entry Audit Trail
  const glJournalEntries = [
    {
      account: 'Chase Operating ••8491 (Cash Inflow)',
      description: `Net Stripe collection deposit (${paymentMethod.toUpperCase()})`,
      debit: netCashDeposited,
      credit: 0,
    },
    {
      account: 'GL-5040 Payment Processing Fees (Stripe Expense)',
      description: `Payment gateway service fee (${effectiveFeePercent}% effective rate)`,
      debit: stripeFeeDeduction,
      credit: 0,
    },
    {
      account: 'GL-1200 Accounts Receivable (Client Settlement)',
      description: `Full satisfaction of invoice principal receivable`,
      debit: 0,
      credit: invoiceAmount,
    },
  ];

  if (feePolicy === 'surcharge_to_client' && stripeFeeDeduction > 0) {
    glJournalEntries.push({
      account: 'GL-4090 Client Processing Surcharge Income',
      description: 'Convenience fee reimbursed by client',
      debit: 0,
      credit: stripeFeeDeduction,
    });
  }

  return {
    invoiceAmount,
    paymentMethod,
    feePolicy,
    percentageFeeRate,
    fixedFee,
    grossAmountCharged,
    stripeFeeDeduction,
    netCashDeposited,
    effectiveFeePercent,
    glJournalEntries,
  };
}

// ==========================================
// 5. CUSTOMIZABLE COMMISSION & BONUS RULES ENGINE
// ==========================================

export const COMMISSION_SETTINGS_STORAGE_KEY = 'bidexact_commission_rules_state_v1';

export const DEFAULT_COMMISSION_SETTINGS: CommissionSettingsState = {
  globalSalesRate: 5.0, // 5.0% for new client sales acquisition
  globalRecurringRate: 2.5, // 2.5% for recurring client accounts
  globalServiceBonus24h: 1.5, // 1.5% for 24h early turnaround (or $500)
  globalServiceBonus48h: 2.5, // 2.5% for 48h early turnaround (or $1000)
  globalServiceBonus72h: 4.0, // 4.0% for 72h early turnaround (or $1500)
  serviceBonusMode: 'percentage', // percentage mode by default
  deductStripeFees: true, // sales rep commission is calculated strictly after Stripe fee deduction
  defaultPaymentMethod: 'credit_card',
  clawbackWindowDays: 90,
  requireZeroQaErrors: true,
  percentageBasis: 'contract_value',
  teams: [
    {
      id: 'team_a',
      name: 'Team A (Commercial & Institutional)',
      department: 'Pre-Construction',
      useCustomRates: true,
      salesCommissionRatePercent: 5.5,
      recurringClientRatePercent: 3.0,
      serviceBonusRatePercent: 2.5,
      targetAmount: 250000,
      currentAchievedAmount: 268500,
      bonusPoolAmount: 5000,
      splitType: 'equal_split',
      members: [
        { employeeId: 'EMP-103', employeeName: 'Syed Ahmed', role: 'Senior Civil & Structural Estimator', department: 'Pre-Construction' },
        { employeeId: 'EMP-106', employeeName: 'Liam Scott', role: 'Junior MEP Quantity Surveyor', department: 'Pre-Construction' },
        { employeeId: 'EMP-102', employeeName: 'Elena Rostova', role: 'Senior BIM / VDC Specialist & Lead', department: 'VDC & BIM' },
      ],
      notes: 'High-density commercial, institutional, and mixed-use bid deliverables.',
    },
    {
      id: 'team_b',
      name: 'Team B (Civil & Heavy Infrastructure)',
      department: 'Pre-Construction & Engineering',
      useCustomRates: true,
      salesCommissionRatePercent: 6.0,
      recurringClientRatePercent: 2.8,
      serviceBonusRatePercent: 3.0,
      targetAmount: 200000,
      currentAchievedAmount: 215000,
      bonusPoolAmount: 4000,
      splitType: 'equal_split',
      members: [
        { employeeId: 'EMP-101', employeeName: 'Marcus Vance', role: 'Managing Principal & VP Pre-Con', department: 'Executive Leadership' },
        { employeeId: 'EMP-103', employeeName: 'Syed Ahmed', role: 'Senior Civil & Structural Estimator', department: 'Pre-Construction' },
        { employeeId: 'EMP-104', employeeName: 'David Chen', role: 'Senior MEP Systems Quantity Surveyor', department: 'Pre-Construction' },
      ],
      notes: 'Highways, rail, utilities, site civil earthwork, and concrete structures.',
    },
    {
      id: 'team_c',
      name: 'Team C (MEP Systems & Special Projects)',
      department: 'Pre-Construction & Client Relations',
      useCustomRates: false,
      salesCommissionRatePercent: 5.0,
      recurringClientRatePercent: 2.5,
      serviceBonusRatePercent: 2.0,
      targetAmount: 180000,
      currentAchievedAmount: 165000,
      bonusPoolAmount: 3600,
      splitType: 'equal_split',
      members: [
        { employeeId: 'EMP-104', employeeName: 'David Chen', role: 'Senior MEP Systems Quantity Surveyor', department: 'Pre-Construction' },
        { employeeId: 'EMP-106', employeeName: 'Liam Scott', role: 'Junior MEP Quantity Surveyor', department: 'Pre-Construction' },
        { employeeId: 'EMP-105', employeeName: 'Rachel Green', role: 'Operations & Bid Coordinator', department: 'Client Relations' },
      ],
      notes: 'Mechanical, electrical, plumbing, lab cleanrooms, and accelerated packages.',
    },
  ],
  lastUpdated: new Date().toISOString().slice(0, 10),
  updatedBy: 'Umer Khayam (CEO & Managing Partner)',
  version: 1,
};

/**
 * Retrieves the active commission settings configuration from persistent local storage,
 * or returns the corporate default configuration.
 */
export function getCommissionSettings(): CommissionSettingsState {
  if (typeof window === 'undefined') return DEFAULT_COMMISSION_SETTINGS;
  try {
    const raw = localStorage.getItem(COMMISSION_SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_COMMISSION_SETTINGS;
    const parsed = JSON.parse(raw) as CommissionSettingsState;
    if (parsed && typeof parsed.globalSalesRate === 'number' && Array.isArray(parsed.teams)) {
      return parsed;
    }
    return DEFAULT_COMMISSION_SETTINGS;
  } catch (err) {
    console.warn('Failed to load custom commission settings from localStorage:', err);
    return DEFAULT_COMMISSION_SETTINGS;
  }
}

/**
 * Persists updated commission settings into localStorage, dispatches reactive event,
 * and synchronizes with corporate financial rules.
 */
export function saveCommissionSettings(settings: CommissionSettingsState): void {
  if (typeof window === 'undefined') return;
  try {
    const updated: CommissionSettingsState = {
      ...settings,
      lastUpdated: new Date().toISOString().slice(0, 10),
      version: (settings.version || 1) + 1,
    };
    localStorage.setItem(COMMISSION_SETTINGS_STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('bidexact_commission_rules_updated', { detail: updated }));

    // Keep legacy financial rules config synchronized
    saveFinancialRulesConfig({
      salesCommission: {
        newClientRatePercent: updated.globalSalesRate,
        recurringClientRatePercent: updated.globalRecurringRate,
        deductStripeFees: updated.deductStripeFees,
        defaultPaymentMethod: updated.defaultPaymentMethod,
        clawbackWindowDays: updated.clawbackWindowDays,
      },
      teams: updated.teams,
      serviceEarlyDelivery: {
        rewardMode: updated.serviceBonusMode,
        tier24h: updated.globalServiceBonus24h,
        tier48h: updated.globalServiceBonus48h,
        tier72h: updated.globalServiceBonus72h,
        requireZeroQaErrors: updated.requireZeroQaErrors,
        percentageBasis: updated.percentageBasis,
      },
      lastUpdated: updated.lastUpdated,
      updatedBy: updated.updatedBy,
    });
  } catch (err) {
    console.error('Failed to save commission settings:', err);
  }
}

/**
 * Resets commission settings to initial corporate defaults.
 */
export function resetCommissionSettings(): CommissionSettingsState {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(COMMISSION_SETTINGS_STORAGE_KEY);
      resetFinancialRulesConfig();
      window.dispatchEvent(new CustomEvent('bidexact_commission_rules_updated', { detail: DEFAULT_COMMISSION_SETTINGS }));
    } catch (err) {
      console.error('Failed to reset commission settings:', err);
    }
  }
  return DEFAULT_COMMISSION_SETTINGS;
}

export const RULES_STORAGE_KEY = 'bidexact_financial_rules_config_v1';

export const DEFAULT_FINANCIAL_RULES_CONFIG: FinancialRulesAdjustmentConfig = {
  salesCommission: {
    newClientRatePercent: 5.0, // 5.0% of project after Stripe deductions for new client acquisition
    recurringClientRatePercent: 2.5, // 2.5% of project after Stripe deductions for recurring client account
    deductStripeFees: true, // sales rep commission is calculated strictly after Stripe fee deduction
    defaultPaymentMethod: 'credit_card',
    clawbackWindowDays: 90,
  },
  teams: [
    {
      id: 'team_a',
      name: 'Team A (Commercial & Institutional)',
      department: 'Pre-Construction',
      targetAmount: 250000,
      currentAchievedAmount: 268500, // Target met ($268.5k / $250k = 107.4%)
      bonusPoolAmount: 5000, // $5,000 bonus pool divided across 3 members = $1,666.67 each
      splitType: 'equal_split',
      members: [
        { employeeId: 'EMP-103', employeeName: 'Syed Ahmed', role: 'Senior Civil & Structural Estimator', department: 'Pre-Construction' },
        { employeeId: 'EMP-106', employeeName: 'Liam Scott', role: 'Junior MEP Quantity Surveyor', department: 'Pre-Construction' },
        { employeeId: 'EMP-102', employeeName: 'Elena Rostova', role: 'Senior BIM / VDC Specialist & Lead', department: 'VDC & BIM' },
      ],
      notes: 'High-density commercial, institutional, and mixed-use bid deliverables.',
    },
    {
      id: 'team_b',
      name: 'Team B (Civil & Heavy Infrastructure)',
      department: 'Pre-Construction & Engineering',
      targetAmount: 200000,
      currentAchievedAmount: 215000, // Target met ($215k / $200k = 107.5%)
      bonusPoolAmount: 4000, // $4,000 bonus pool divided across 3 members = $1,333.33 each
      splitType: 'equal_split',
      members: [
        { employeeId: 'EMP-101', employeeName: 'Marcus Vance', role: 'Managing Principal & VP Pre-Con', department: 'Executive Leadership' },
        { employeeId: 'EMP-103', employeeName: 'Syed Ahmed', role: 'Senior Civil & Structural Estimator', department: 'Pre-Construction' },
        { employeeId: 'EMP-104', employeeName: 'David Chen', role: 'Senior MEP Systems Quantity Surveyor', department: 'Pre-Construction' },
      ],
      notes: 'Highways, rail, utilities, site civil earthwork, and concrete structures.',
    },
    {
      id: 'team_c',
      name: 'Team C (MEP Systems & Special Projects)',
      department: 'Pre-Construction & Client Relations',
      targetAmount: 180000,
      currentAchievedAmount: 165000, // 91.7% ($15,000 remaining to unlock pool)
      bonusPoolAmount: 3600, // $3,600 bonus pool ($1,200 each once target met)
      splitType: 'equal_split',
      members: [
        { employeeId: 'EMP-104', employeeName: 'David Chen', role: 'Senior MEP Systems Quantity Surveyor', department: 'Pre-Construction' },
        { employeeId: 'EMP-106', employeeName: 'Liam Scott', role: 'Junior MEP Quantity Surveyor', department: 'Pre-Construction' },
        { employeeId: 'EMP-105', employeeName: 'Rachel Green', role: 'Operations & Bid Coordinator', department: 'Client Relations' },
      ],
      notes: 'Mechanical, electrical, plumbing, lab cleanrooms, and accelerated packages.',
    },
  ],
  serviceEarlyDelivery: {
    rewardMode: 'flat_dollar', // 'flat_dollar' ($) or 'percentage' (%)
    tier24h: 500, // $500 or 1.5%
    tier48h: 1000, // $1,000 or 2.5%
    tier72h: 1500, // $1,500 or 4.0%
    requireZeroQaErrors: true, // zero addenda defects required
    percentageBasis: 'contract_value',
  },
  lastUpdated: new Date().toISOString().slice(0, 10),
  updatedBy: 'Umer Khayam (CEO & Managing Partner)',
};

/**
 * Retrieves the active financial rules configuration from persistent local storage,
 * or returns the corporate default configuration.
 */
export function getFinancialRulesConfig(): FinancialRulesAdjustmentConfig {
  if (typeof window === 'undefined') return DEFAULT_FINANCIAL_RULES_CONFIG;
  try {
    const raw = localStorage.getItem(RULES_STORAGE_KEY);
    if (!raw) return DEFAULT_FINANCIAL_RULES_CONFIG;
    const parsed = JSON.parse(raw) as FinancialRulesAdjustmentConfig;
    // Basic schema safety check
    if (parsed && parsed.salesCommission && Array.isArray(parsed.teams) && parsed.serviceEarlyDelivery) {
      return parsed;
    }
    return DEFAULT_FINANCIAL_RULES_CONFIG;
  } catch (err) {
    console.warn('Failed to load custom financial rules from localStorage:', err);
    return DEFAULT_FINANCIAL_RULES_CONFIG;
  }
}

/**
 * Persists updated custom rules into localStorage and dispatches a cross-view update event.
 */
export function saveFinancialRulesConfig(config: FinancialRulesAdjustmentConfig): void {
  if (typeof window === 'undefined') return;
  try {
    const updated = {
      ...config,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
    localStorage.setItem(RULES_STORAGE_KEY, JSON.stringify(updated));
    // Trigger custom event so any active component can re-sync immediately
    window.dispatchEvent(new CustomEvent('bidexact_rules_updated', { detail: updated }));
  } catch (err) {
    console.error('Failed to save financial rules configuration:', err);
  }
}

/**
 * Resets financial rules to initial corporate defaults.
 */
export function resetFinancialRulesConfig(): FinancialRulesAdjustmentConfig {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(RULES_STORAGE_KEY);
      window.dispatchEvent(new CustomEvent('bidexact_rules_updated', { detail: DEFAULT_FINANCIAL_RULES_CONFIG }));
    } catch (err) {
      console.error('Failed to reset financial rules:', err);
    }
  }
  return DEFAULT_FINANCIAL_RULES_CONFIG;
}

/**
 * Calculates sales employee commission:
 * - If client is NEW: applies newClientRatePercent on project value AFTER deducting Stripe fees.
 * - If client is RECURRING: applies recurringClientRatePercent on project value AFTER deducting Stripe fees.
 */
export function calculateSalesCommission(input: {
  contractValue: number;
  clientType: 'new_client' | 'recurring_client';
  paymentMethod?: 'credit_card' | 'ach_debit' | 'wire_transfer';
  isInternationalCard?: boolean;
  customRules?: SalesCommissionRuleConfig;
}): SalesCommissionCalculationResult {
  const {
    contractValue,
    clientType,
    paymentMethod = 'credit_card',
    isInternationalCard = false,
    customRules = getFinancialRulesConfig().salesCommission,
  } = input;

  // 1. Calculate Stripe fee deduction
  let stripeFeeDeduction = 0;
  if (paymentMethod === 'credit_card') {
    const rate = FINANCIAL_CONSTANTS.STRIPE_CC_PERCENT + (isInternationalCard ? FINANCIAL_CONSTANTS.STRIPE_CC_INTERNATIONAL_SURCHARGE : 0);
    stripeFeeDeduction = Number(((contractValue * rate) + FINANCIAL_CONSTANTS.STRIPE_CC_FIXED).toFixed(2));
  } else if (paymentMethod === 'ach_debit') {
    const rawFee = contractValue * FINANCIAL_CONSTANTS.STRIPE_ACH_PERCENT;
    stripeFeeDeduction = Number(Math.min(rawFee, FINANCIAL_CONSTANTS.STRIPE_ACH_CAP).toFixed(2));
  } else {
    // Bank wire - no gateway fee
    stripeFeeDeduction = 0;
  }

  // 2. Net Collected Cash after payment gateway fee
  const netCollectedCash = customRules.deductStripeFees
    ? Math.max(0, Number((contractValue - stripeFeeDeduction).toFixed(2)))
    : contractValue;

  // 3. Commission Rate based on client type
  const commissionRatePercent = clientType === 'new_client'
    ? customRules.newClientRatePercent
    : customRules.recurringClientRatePercent;

  const commissionRateDec = commissionRatePercent / 100;
  const commissionAmount = Math.round((netCollectedCash * commissionRateDec) * 100) / 100;

  const notes = clientType === 'new_client'
    ? `New Client Acquisition Commission: ${commissionRatePercent}% applied to net collected cash ($${netCollectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}) after full deduction of Stripe ${paymentMethod.replace('_', ' ').toUpperCase()} fee ($${stripeFeeDeduction.toFixed(2)}).`
    : `Recurring Account Commission: ${commissionRatePercent}% applied to net collected cash ($${netCollectedCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}) after full deduction of Stripe ${paymentMethod.replace('_', ' ').toUpperCase()} fee ($${stripeFeeDeduction.toFixed(2)}).`;

  return {
    clientType,
    contractValue,
    paymentMethod,
    stripeFeeDeduction,
    netCollectedCash,
    commissionRatePercent,
    commissionAmount,
    clawbackWindowDays: customRules.clawbackWindowDays,
    notes,
  };
}

/**
 * Calculates Team Target Commission / Bonus:
 * If the team hits their target amount, the $ bonus pool is unlocked
 * and divided equally (or proportionally) across all members in that team.
 */
export function calculateTeamTargetBonus(team: TeamTargetRule): TeamTargetCalculationResult {
  const isTargetMet = team.currentAchievedAmount >= team.targetAmount;
  const achievementPercent = team.targetAmount > 0
    ? Number(((team.currentAchievedAmount / team.targetAmount) * 100).toFixed(1))
    : 0;

  const shortfallOrSurplus = team.currentAchievedAmount - team.targetAmount;
  const bonusPoolUnlocked = isTargetMet ? team.bonusPoolAmount : 0;
  const memberCount = Math.max(1, team.members.length);

  const perMemberEqualShare = isTargetMet
    ? Math.round((bonusPoolUnlocked / memberCount) * 100) / 100
    : 0;

  const memberPayouts: TeamMemberPayout[] = team.members.map((m) => ({
    employeeId: m.employeeId,
    employeeName: m.employeeName,
    role: m.role,
    sharePercent: Number((100 / memberCount).toFixed(1)),
    payoutAmount: perMemberEqualShare,
  }));

  return {
    teamId: team.id,
    teamName: team.name,
    department: team.department,
    targetAmount: team.targetAmount,
    currentAchievedAmount: team.currentAchievedAmount,
    isTargetMet,
    achievementPercent,
    shortfallOrSurplus,
    bonusPoolUnlocked,
    perMemberEqualShare,
    memberPayouts,
    splitType: team.splitType,
  };
}

/**
 * Calculates Service / Estimator Early Submission Bonus:
 * If an estimator or service specialist submits the takeoff package early,
 * awards either a configured flat dollar ($) amount or a percentage (%) of the project value or margin.
 */
export function calculateServiceEarlySubmissionBonus(input: {
  contractValue: number;
  directCosts?: number;
  leadTimeHoursAhead: number;
  addendaErrors: number;
  customRules?: ServiceEarlySubmissionRule;
}): ServiceEarlyBonusCalculationResult {
  const {
    contractValue,
    directCosts = 0,
    leadTimeHoursAhead,
    addendaErrors,
    customRules = getFinancialRulesConfig().serviceEarlyDelivery,
  } = input;

  const isEligibleForQuality = !customRules.requireZeroQaErrors || addendaErrors === 0;

  let appliedTier: 'none' | '24h' | '48h' | '72h' = 'none';
  let tierRateOrAmount = 0;

  if (leadTimeHoursAhead >= 72) {
    appliedTier = '72h';
    tierRateOrAmount = customRules.tier72h;
  } else if (leadTimeHoursAhead >= 48) {
    appliedTier = '48h';
    tierRateOrAmount = customRules.tier48h;
  } else if (leadTimeHoursAhead >= 24) {
    appliedTier = '24h';
    tierRateOrAmount = customRules.tier24h;
  }

  const isEligible = isEligibleForQuality && appliedTier !== 'none';

  let basisAmount = contractValue;
  let grossBonusAmount = 0;

  if (!isEligible) {
    grossBonusAmount = 0;
  } else if (customRules.rewardMode === 'flat_dollar') {
    grossBonusAmount = tierRateOrAmount;
    basisAmount = tierRateOrAmount;
  } else {
    // Percentage mode
    basisAmount = customRules.percentageBasis === 'gross_margin'
      ? Math.max(0, contractValue - directCosts)
      : contractValue;
    grossBonusAmount = Math.round((basisAmount * (tierRateOrAmount / 100)) * 100) / 100;
  }

  const supplementalTaxWithheld = Math.round(grossBonusAmount * FINANCIAL_CONSTANTS.SUPPLEMENTAL_WAGE_TAX_RATE);
  const netBonusTakeHome = grossBonusAmount - supplementalTaxWithheld;

  let notes = '';
  if (!isEligibleForQuality) {
    notes = `Ineligible: ${addendaErrors} QA addenda errors detected. Corporate policy requires zero defects for early deliverable bonuses.`;
  } else if (appliedTier === 'none') {
    notes = `Deliverable completed within normal window (<24 hours early). Early delivery bonus not unlocked.`;
  } else if (customRules.rewardMode === 'flat_dollar') {
    notes = `Qualified for ${appliedTier} tier: Flat bonus of $${tierRateOrAmount.toLocaleString()} awarded for submitting takeoff ${leadTimeHoursAhead} hours ahead of bid deadline with zero defects.`;
  } else {
    notes = `Qualified for ${appliedTier} tier: ${tierRateOrAmount}% bonus ($${grossBonusAmount.toLocaleString()}) based on ${customRules.percentageBasis.replace('_', ' ')} ($${basisAmount.toLocaleString()}) for submitting takeoff ${leadTimeHoursAhead} hours ahead of deadline.`;
  }

  return {
    leadTimeHoursAhead,
    addendaErrors,
    isEligible,
    rewardMode: customRules.rewardMode,
    appliedTier,
    tierRateOrAmount,
    basisAmount,
    grossBonusAmount,
    supplementalTaxWithheld,
    netBonusTakeHome,
    notes,
  };
}
