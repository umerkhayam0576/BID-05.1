export type IntakeSource = 'email_parsing' | 'client_web_portal' | 'manual_intake';

export type IntakeStatus = 'pending_review' | 'converted_to_quote' | 'archived' | 'rejected';

export type QuoteStatus =
  | 'draft'
  | 'pending_approval'
  | 'sent'
  | 'viewed'
  | 'approved_pending_payment'
  | 'paid_and_activated'
  | 'rejected'
  | 'expired';

export type ProjectLifecycleStatus =
  | 'queued'
  | 'active'
  | 'in_progress'
  | 'qa_review'
  | 'completed'
  | 'delivered'
  | 'on_hold';

export type PaymentStatus =
  | 'unpaid'
  | 'deposit_pending'
  | 'deposit_cleared'
  | 'final_pending'
  | 'fully_paid'
  | 'failed'
  | 'refunded';

export type AssignmentMethod = 'smart_auto' | 'manual_pm' | 'reallocated' | 'fallback_escalation';

export type UserRole = 'client_representative' | 'sales' | 'sales_lead' | 'estimator' | 'senior_auditor' | 'pm_lead' | 'executive';

export type SalesLeadStatus = 'new' | 'reminder_set' | 'quoted' | 'won' | 'lost';

export interface SalesLead {
  id: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  projectTitle: string;
  decision: string;
  scopeOfWork: string;
  recommendedNextStep: string;
  createdBy: string;
  reminderAt: string;
  status: SalesLeadStatus;
  quoteId?: string;
  commissionRate: number;
  commissionPaid: number;
}

// 1. User Entity
export interface UserEntity {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  companyName: string;
  phone?: string;
  avatarUrl?: string;
  avatarColor?: string;
  // Resource allocation attributes (for estimators)
  qualifications?: string[]; // e.g., ['Division 03 Concrete', 'BIM LOD 350', 'Healthcare OSHPD']
  currentWeeklyHours?: number; // Committed hours this week
  maxWeeklyCapacity?: number; // Standard 40h
  performanceRating?: number; // 1-5 scale
  activeProjectIds?: string[];
  createdAt: string;
}

// 2. Intake Request Entity (Email / Portal)
export interface IntakeRequestItem {
  id: string; // e.g. INTAKE-2024-108
  source: IntakeSource;
  submittedAt: string;
  clientName: string;
  clientEmail: string;
  clientCompany: string;
  clientPhone?: string;
  projectTitle: string;
  projectLocation: string;
  scopeSummary: string;
  targetSubmittalDate: string;
  estimatedBudgetRange: string;
  detectedCsiDivisions: string[];
  attachments: Array<{
    fileName: string;
    fileSize: string;
    fileType: 'pdf' | 'dwg' | 'xlsx' | 'zip';
    url?: string;
  }>;
  rawEmailMetadata?: {
    from: string;
    subject: string;
    receivedTimestamp: string;
    dkimValid: boolean;
    spfPass: boolean;
  };
  status: IntakeStatus;
  urgency: 'critical' | 'high' | 'normal';
  convertedQuoteId?: string;
}

// 3. Quote Item Breakdown
export interface QuoteLineItem {
  id: string;
  csiDivision: string; // e.g. "03 - Concrete", "05 - Metals"
  description: string;
  quantity: number;
  unit: string; // "CY", "TN", "SQFT", "HR"
  unitCost: number;
  totalCost: number;
}

// 4. Quote Entity
export interface QuoteEntity {
  id: string; // e.g. QTE-2024-041
  intakeRequestId?: string;
  quoteNumber: string;
  title: string;
  client: {
    id?: string;
    name: string;
    company: string;
    email: string;
    phone: string;
    billingAddress: string;
  };
  scopeSummary: string;
  csiDivisions: string[];
  lineItems: QuoteLineItem[];
  subtotal: number;
  markupPercent: number; // e.g. 15%
  bondingFee: number;
  totalAmount: number;
  currency?: string;
  requiredDepositPercent: number; // e.g. 25% or 30%
  requiredDepositAmount: number;
  paymentTerms: string; // "Net 30 with 25% Mobilization Deposit"
  validUntil: string;
  dynamicApprovalLink: string;
  approvalToken: string;
  status: QuoteStatus;
  generatedBy: {
    userId: string;
    name: string;
    role: string;
  };
  generatedAt: string;
  sentAt?: string;
  viewedAt?: string;
  approvedAt?: string;
  clientSignature?: {
    signerName: string;
    signerTitle: string;
    signedTimestamp: string;
    ipAddress: string;
    signatureDataUrl?: string;
  };
  activatedProjectId?: string;
  linkedPaymentId?: string;
}

// 5. Payment Entity
export interface PaymentEntity {
  id: string; // e.g. PAY-2024-0992
  quoteId: string;
  projectId?: string;
  amount: number;
  currency: string;
  paymentType: 'deposit_mobilization' | 'milestone_progress' | 'final_closeout';
  paymentGateway: 'stripe_elements' | 'stripe_ach' | 'manual_wire';
  gatewayTransactionId: string; // e.g. pi_3NqY5v2eZvKYlo2C19VvP7yR
  status: PaymentStatus;
  paidAt?: string;
  payerName: string;
  payerEmail: string;
  receiptUrl?: string;
  cardLast4?: string;
  cardBrand?: string;
}

// 6. Assignment Entity
export interface AssignmentEntity {
  id: string; // e.g. ASN-2024-771
  projectId: string;
  assignedUserId: string;
  assignedUserName: string;
  assignedUserRole: string;
  roleOnProject: string; // e.g., "Lead Takeoff Specialist", "MEP Auditor"
  allocatedWeeklyHours: number;
  method: AssignmentMethod;
  matchedScorePercent?: number; // e.g., 94% match
  matchReasons?: string[];
  assignedAt: string;
  assignedByUserId?: string; // If manual PM assignment
  notes?: string;
}

// 7. Project Entity (Active PM Tracking)
export interface ProjectEntity {
  id: string; // e.g. PRJ-2024-041
  quoteId: string;
  projectCode: string;
  title: string;
  clientName: string;
  clientCompany: string;
  clientEmail: string;
  scopeSummary: string;
  csiDivisions: string[];
  contractValue: number;
  depositPaid: number;
  status: ProjectLifecycleStatus;
  priority: 'CRITICAL' | 'HIGH' | 'NORMAL';
  startDate: string;
  targetDueDate: string;
  estimatedHours: number;
  loggedHours: number;
  completionPercent: number;
  assignments: AssignmentEntity[];
  milestones: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    status: 'pending' | 'in_progress' | 'qa_review' | 'completed';
    completedAt?: string;
  }>;
  qaReviewProtocol: {
    specComplianceVerified: boolean;
    doubleTakeoffRecountPassed: boolean;
    materialPricingVerified: boolean;
    seniorAuditorSignoff: boolean;
    auditorName?: string;
    auditedAt?: string;
    variancePercentage?: number;
    auditPassed: boolean;
  };
  deliverables: Array<{
    id: string;
    fileName: string;
    fileSize: string;
    fileType: 'xlsx' | 'pdf' | 'ifc' | 'zip';
    downloadUrl: string;
    releasedAt?: string;
  }>;
  clientNotifiedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

// 8. System Webhook Event Entity (for real-time pipeline monitoring)
export interface WorkflowWebhookEvent {
  id: string;
  eventId: string;
  eventType:
    | 'intake.received'
    | 'quote.generated'
    | 'quote.dispatched'
    | 'quote.viewed'
    | 'payment.deposit_succeeded'
    | 'project.activated'
    | 'resource.auto_allocated'
    | 'resource.fallback_escalated'
    | 'milestone.updated'
    | 'qa.protocol_passed'
    | 'deliverables.released'
    | 'client.notified';
  timestamp: string;
  sourceService: 'EmailIngestWorker' | 'QuotationEngine' | 'StripeWebhook' | 'ProjectActivator' | 'SmartAllocator' | 'QAEvaluationService';
  payloadSummary: string;
  entityId: string;
  status: 'delivered' | 'processed' | 'queued' | 'retry';
  rawPayload?: Record<string, unknown>;
}

// 9. Automation Logic & Technical Configuration Rules
export interface AutomationRulesConfig {
  autoDepositRequiredPercent: number; // e.g. 25%
  enableInstantActivationOnPayment: boolean; // Auto-transition to ACTIVE
  enableSmartResourceAllocation: boolean; // Auto-assign to qualified estimator
  maxWeeklyHoursCap: number; // 40h standard
  overloadFallbackThresholdHours: number; // If estimator > 36h, flag or skip
  minQualificationMatchScore: number; // 70% threshold
  requireDualAuditForDelivery: boolean; // Mandatory 4-point QA signoff
  autoNotifyClientOnDelivery: boolean;
}
