export type RoleType = 'full-signatory' | 'board-observer' | 'passive';

export interface CapTableMember {
  name: string;
  role: string;
  sharesOrUnits?: number;
  percentage: number;
  initialInvestment: number;
  votingRights: boolean;
}

export interface CompanyEntity {
  id: string;
  name: string;
  industry: string;
  role: string;
  roleType: RoleType;
  roleBadge: string;
  statusBadge: string;
  legalOwnershipPercent: number;
  ownershipType: string;
  profitSharePercent: number;
  profitTierDescription: string;
  companyNetProfit: number;
  attributedProfit: number;
  distributionsReceived: number;
  distributionsPending: number;
  contributedCapital: number;
  enterpriseValuation: number;
  equityPositionValue: number;
  icon: string;
  color: 'primary' | 'secondary' | 'tertiary';
  taxId?: string;
  foundedYear?: number;
  revenueYtd?: number;
  expensesYtd?: number;
  operatingCashReserve?: number;
  capTable: CapTableMember[];
  notes?: string;
}

export interface KeyWealthMetrics {
  personalCash: number;
  chaseChecking: number;
  hysa: number;
  companyInterests: number;
  capitalInvested: number;
  profitAttributed: number;
  distributionsReceived: number;
  unpaidDeclaredDistributions: number;
  personalNetWorth: number;
  investmentPortfolios: number;
  realEstateProperty: number;
  personalLiabilities: number;
  personalOperatingInflow: number;
  monthlySalary: number;
  monthlyAdvisory: number;
}

export type LedgerClassification = 
  | 'Distribution Payout'
  | 'Capital Contribution'
  | 'Profit Allocation'
  | 'Loan Repayment';

export interface LedgerEvent {
  id: string;
  classification: LedgerClassification;
  entityName: string;
  entityId: string;
  referenceId: string;
  scopeDetails: string;
  accountingDate: string;
  cashEffect: number;
  isAccruedNonCash?: boolean;
}

export interface GovernanceChangeRequest {
  id: string;
  entityId: string;
  entityName: string;
  title: string;
  proposedChange: string;
  effectiveDate: string;
  status: string;
  summary: string;
  priorOwnership: { name: string; percent: number }[];
  proposedOwnership: { name: string; percent: number }[];
  votingStatus: { approvers: string[]; totalNeeded: number };
}

export type WealthNavTabId =
  | 'personal-financial-overview'
  | 'multi-company-portfolio'
  | 'ownership-and-cap-tables'
  | 'profit-share-and-attributions'
  | 'distribution-ledger'
  | 'capital-contributions-and-loans'
  | 'bank-and-liquid-cash'
  | 'investment-portfolios'
  | 'real-estate-and-property'
  | 'personal-liabilities-and-debt'
  | 'personal-cash-flow'
  | 'ownership-agreements-and-docs'
  | 'valuations-and-cap-history'
  | 'audit-trail-and-change-logs'
  | 'settings-and-rbac-permissions';
