import { boolean, date, integer, jsonb, numeric, pgTable, text, timestamp, uuid, unique } from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const users = pgTable('app_users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull(),
  displayName: text('display_name').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt,
}, (table) => ({
  emailUnique: unique('app_users_email_unique').on(table.email),
}))

export const userProfiles = pgTable('app_user_profiles', {
  userId: uuid('user_id').primaryKey(),
  phone: text('phone'),
  jobTitle: text('job_title'),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  country: text('country'),
  timezone: text('timezone').default('UTC').notNull(),
  language: text('language').default('en').notNull(),
  preferredCurrency: text('preferred_currency').default('USD').notNull(),
  dateFormat: text('date_format').default('YYYY-MM-DD').notNull(),
  emailNotifications: boolean('email_notifications').default(true).notNull(),
  inAppNotifications: boolean('in_app_notifications').default(true).notNull(),
  ...timestamps,
})

export const userCredentials = pgTable('app_user_credentials', {
  userId: uuid('user_id').primaryKey(),
  passwordHash: text('password_hash').notNull(),
  passwordUpdatedAt: timestamp('password_updated_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt,
})

export const userSessions = pgTable('app_user_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  revokedAt: timestamp('revoked_at', { withTimezone: true }),
  createdAt: timestamps.createdAt,
}, (table) => ({
  tokenHashUnique: unique('app_user_sessions_token_hash_unique').on(table.tokenHash),
}))
export const passwordResetTokens = pgTable('app_password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  tokenHash: text('token_hash').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  tokenHashUnique: unique('app_password_reset_tokens_token_hash_unique').on(table.tokenHash),
}))
export const workspaces = pgTable('app_workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  legalStructure: text('legal_structure').default('other').notNull(),
  industryType: text('industry_type').default('services').notNull(),
  country: text('country'),
  currency: text('currency').default('USD').notNull(),
  createdByUserId: text('created_by_user_id'),
  status: text('status').default('active').notNull(),
  ...timestamps,
}, (table) => ({
  slugUnique: unique('app_workspaces_slug_unique').on(table.slug),
}))

export const memberships = pgTable('app_memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  userId: text('user_id').notNull(),
  role: text('role').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamps.createdAt,
}, (table) => ({
  workspaceUserUnique: unique('app_memberships_workspace_user_unique').on(table.workspaceId, table.userId),
}))

export const entityOwnerships = pgTable('app_entity_ownerships', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  userId: text('user_id').notNull(),
  ownershipPercent: numeric('ownership_percent', { precision: 7, scale: 4 }).default('0').notNull(),
  profitSharePercent: numeric('profit_share_percent', { precision: 7, scale: 4 }).default('0').notNull(),
  entityRole: text('entity_role').default('member').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt,
}, (table) => ({
  workspaceUserUnique: unique('app_entity_ownership_workspace_user_unique').on(table.workspaceId, table.userId),
}))

export const entityInvitations = pgTable('app_entity_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  invitedByUserId: text('invited_by_user_id').notNull(),
  email: text('email').notNull(),
  role: text('role').default('member').notNull(),
  ownershipPercent: numeric('ownership_percent', { precision: 7, scale: 4 }).default('0').notNull(),
  profitSharePercent: numeric('profit_share_percent', { precision: 7, scale: 4 }).default('0').notNull(),
  tokenHash: text('token_hash').notNull(),
  status: text('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedByUserId: text('accepted_by_user_id'),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamps.createdAt,
}, (table) => ({
  tokenUnique: unique('app_entity_invitations_token_unique').on(table.tokenHash),
}))

export const workspaceInvitations = pgTable('app_workspace_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  invitedByUserId: text('invited_by_user_id').notNull(),
  email: text('email').notNull(),
  role: text('role').notNull(),
  department: text('department'),
  portalRole: text('portal_role'),
  name: text('name'),
  tokenHash: text('token_hash').notNull(),
  status: text('status').default('pending').notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedByUserId: text('accepted_by_user_id'),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  createdAt: timestamps.createdAt,
}, (table) => ({
  tokenUnique: unique('app_workspace_invitations_token_unique').on(table.tokenHash),
}));
 
export const clients = pgTable('app_clients', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  name: text('name').notNull(),
  company: text('company'),
  email: text('email'),
  phone: text('phone'),
  status: text('status').default('active').notNull(),
  ownerUserId: text('owner_user_id'),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
})

export const employees = pgTable('app_employees', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  userId: text('user_id'),
  employeeNumber: text('employee_number'),
  name: text('name').notNull(),
  department: text('department'),
  portalRole: text('portal_role'),
  title: text('title'),
  email: text('email'),
  status: text('status').default('active').notNull(),
  managerUserId: text('manager_user_id'),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
})

export const projects = pgTable('app_projects', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  clientId: uuid('client_id'),
  name: text('name').notNull(),
  projectNumber: text('project_number'),
  status: text('status').default('planning').notNull(),
  startDate: date('start_date'),
  dueDate: date('due_date'),
  budget: numeric('budget', { precision: 14, scale: 2 }).default('0').notNull(),
  ownerUserId: text('owner_user_id'),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
})

export const projectAccess = pgTable('app_project_access', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  projectId: uuid('project_id').notNull(),
  userId: text('user_id').notNull(),
  accessRole: text('access_role').notNull(),
  createdAt: timestamps.createdAt,
}, (table) => ({
  projectUserUnique: unique('app_project_access_project_user_unique').on(table.projectId, table.userId),
}))

export const reminders = pgTable('app_reminders', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  projectId: uuid('project_id'),
  title: text('title').notNull(),
  description: text('description'),
  dueAt: timestamp('due_at', { withTimezone: true }).notNull(),
  status: text('status').default('pending').notNull(),
  recurrence: text('recurrence'),
  assignedTo: text('assigned_to'),
  createdBy: text('created_by'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  ...timestamps,
})

export const notifications = pgTable('app_notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id'),
  recipientUserId: text('recipient_user_id').notNull(),
  type: text('type').notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  entityType: text('entity_type'),
  entityId: uuid('entity_id'),
  readAt: timestamp('read_at', { withTimezone: true }),
  desktopRequested: boolean('desktop_requested').default(false).notNull(),
  createdAt: timestamps.createdAt,
})

export const salesLeads = pgTable('app_sales_leads', {
  id: uuid('id').defaultRandom().primaryKey(), workspaceId: uuid('workspace_id').notNull(), companyName: text('company_name').notNull(), clientName: text('client_name').notNull(), companyDescription: text('company_description'), scopeOfWork: text('scope_of_work'), source: text('source'), stage: text('stage').default('new').notNull(), temperature: text('temperature').default('warm').notNull(), estimatedValue: numeric('estimated_value', { precision: 14, scale: 2 }).default('0').notNull(), ownerUserId: text('owner_user_id').notNull(), teamLeadUserId: text('team_lead_user_id'), nextFollowUpAt: timestamp('next_follow_up_at', { withTimezone: true }), notes: text('notes'), ...timestamps,
})

export const salesActivities = pgTable('app_sales_activities', {
  id: uuid('id').defaultRandom().primaryKey(), workspaceId: uuid('workspace_id').notNull(), leadId: uuid('lead_id').notNull(), ownerUserId: text('owner_user_id').notNull(), activityType: text('activity_type').notNull(), subject: text('subject').notNull(), notes: text('notes'), scheduledAt: timestamp('scheduled_at', { withTimezone: true }), completedAt: timestamp('completed_at', { withTimezone: true }), outcome: text('outcome'), createdAt: timestamps.createdAt,
})

export const attendanceRecords = pgTable('app_attendance_records', {
  id: uuid('id').defaultRandom().primaryKey(), workspaceId: uuid('workspace_id').notNull(), employeeUserId: text('employee_user_id').notNull(), attendanceDate: date('attendance_date').notNull(), clockIn: timestamp('clock_in', { withTimezone: true }), clockOut: timestamp('clock_out', { withTimezone: true }), status: text('status').default('present').notNull(), notes: text('notes'), createdAt: timestamps.createdAt,
})

export const auditLogs = pgTable('app_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  actorUserId: text('actor_user_id'),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: uuid('entity_id'),
  beforeData: jsonb('before_data'),
  afterData: jsonb('after_data'),
  createdAt: timestamps.createdAt,
})


// Personal finance is owned by the authenticated person, not by a company workspace.
// This keeps personal cash, transactions, assets, and liabilities isolated from entity data.
export const personalAccounts = pgTable('app_personal_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  accountType: text('account_type').default('cash').notNull(),
  currency: text('currency').default('USD').notNull(),
  openingBalance: numeric('opening_balance', { precision: 14, scale: 2 }).default('0').notNull(),
  status: text('status').default('active').notNull(),
  ...timestamps,
})

export const personalTransactions = pgTable('app_personal_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  accountId: uuid('account_id').notNull(),
  transactionType: text('transaction_type').notNull(),
  category: text('category'),
  description: text('description'),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  transactionDate: date('transaction_date').notNull(),
  notes: text('notes'),
  sourceType: text('source_type'),
  sourceId: uuid('source_id'),
  ...timestamps,
}, (table) => ({
  recurringSourceUnique: unique('app_personal_transactions_source_date_unique').on(table.userId, table.sourceType, table.sourceId, table.transactionDate),
}))

export const personalAssets = pgTable('app_personal_assets', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  assetType: text('asset_type').notNull(),
  currentValue: numeric('current_value', { precision: 14, scale: 2 }).default('0').notNull(),
  currency: text('currency').default('USD').notNull(),
  status: text('status').default('active').notNull(),
  notes: text('notes'),
  ...timestamps,
})

export const personalLiabilities = pgTable('app_personal_liabilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  liabilityType: text('liability_type').notNull(),
  currentBalance: numeric('current_balance', { precision: 14, scale: 2 }).default('0').notNull(),
  originalBalance: numeric('original_balance', { precision: 14, scale: 2 }).default('0').notNull(),
  interestRate: numeric('interest_rate', { precision: 7, scale: 4 }).default('0').notNull(),
  paymentAmount: numeric('payment_amount', { precision: 14, scale: 2 }).default('0').notNull(),
  paymentFrequency: text('payment_frequency').default('monthly').notNull(),
  nextPaymentDate: date('next_payment_date'),
  startDate: date('start_date'),
  currency: text('currency').default('USD').notNull(),
  status: text('status').default('active').notNull(),
  notes: text('notes'),
  ...timestamps,
})

export const personalDebtPayments = pgTable('app_personal_debt_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  liabilityId: text('liability_id').notNull(),
  paymentDate: date('payment_date').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  principalAmount: numeric('principal_amount', { precision: 14, scale: 2 }).default('0').notNull(),
  interestAmount: numeric('interest_amount', { precision: 14, scale: 2 }).default('0').notNull(),
  balanceAfter: numeric('balance_after', { precision: 14, scale: 2 }).default('0').notNull(),
  notes: text('notes'),
  ...timestamps,
})

// A relationship is the source of truth for money owed between two people.
// The borrower owes the lender. Each person sees the same relationship from their own side.
export const personalMoneyRelationships = pgTable('app_personal_money_relationships', {
  id: uuid('id').defaultRandom().primaryKey(),
  borrowerUserId: uuid('borrower_user_id').notNull(),
  lenderUserId: uuid('lender_user_id').notNull(),
  relationshipType: text('relationship_type').default('loan').notNull(),
  description: text('description').notNull(),
  originalAmount: numeric('original_amount', { precision: 14, scale: 2 }).default('0').notNull(),
  remainingAmount: numeric('remaining_amount', { precision: 14, scale: 2 }).default('0').notNull(),
  currency: text('currency').default('USD').notNull(),
  interestRate: numeric('interest_rate', { precision: 7, scale: 4 }).default('0').notNull(),
  status: text('status').default('active').notNull(),
  startDate: date('start_date'),
  dueDate: date('due_date'),
  notes: text('notes'),
  ...timestamps,
})

export const personalSettlements = pgTable('app_personal_settlements', {
  id: uuid('id').defaultRandom().primaryKey(),
  payerUserId: uuid('payer_user_id').notNull(),
  payeeUserId: uuid('payee_user_id').notNull(),
  paymentDate: date('payment_date').notNull(),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  notes: text('notes'),
  ...timestamps,
})

export const personalSettlementAllocations = pgTable('app_personal_settlement_allocations', {
  id: uuid('id').defaultRandom().primaryKey(),
  settlementId: uuid('settlement_id').notNull(),
  relationshipId: uuid('relationship_id').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  principalAmount: numeric('principal_amount', { precision: 14, scale: 2 }).default('0').notNull(),
  interestAmount: numeric('interest_amount', { precision: 14, scale: 2 }).default('0').notNull(),
  createdAt: timestamps.createdAt,
})

export const personalProperties = pgTable('app_personal_properties', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  name: text('name').notNull(),
  propertyType: text('property_type').notNull(),
  location: text('location'),
  purchaseDate: date('purchase_date'),
  purchasePrice: numeric('purchase_price', { precision: 14, scale: 2 }).default('0').notNull(),
  currentValue: numeric('current_value', { precision: 14, scale: 2 }).default('0').notNull(),
  currency: text('currency').default('USD').notNull(),
  mortgageBalance: numeric('mortgage_balance', { precision: 14, scale: 2 }).default('0').notNull(),
  monthlyPayment: numeric('monthly_payment', { precision: 14, scale: 2 }).default('0').notNull(),
  rentalIncome: numeric('rental_income', { precision: 14, scale: 2 }).default('0').notNull(),
  status: text('status').default('active').notNull(),
  notes: text('notes'),
  ...timestamps,
})


export const ownershipHistory = pgTable('app_ownership_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  ownerUserId: text('owner_user_id').notNull(),
  ownershipPercent: numeric('ownership_percent', { precision: 7, scale: 4 }).default('0').notNull(),
  profitSharePercent: numeric('profit_share_percent', { precision: 7, scale: 4 }).default('0').notNull(),
  votingPercent: numeric('voting_percent', { precision: 7, scale: 4 }).default('0').notNull(),
  effectiveFrom: date('effective_from').notNull(),
  effectiveTo: date('effective_to'),
  sourceAgreementId: uuid('source_agreement_id'),
  changeReason: text('change_reason'),
  status: text('status').default('active').notNull(),
  createdAt: timestamps.createdAt,
})

export const ownershipChangeRequests = pgTable('app_ownership_change_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  requestedByUserId: text('requested_by_user_id').notNull(),
  status: text('status').default('draft').notNull(),
  reason: text('reason'),
  effectiveDate: date('effective_date'),
  proposedOwnership: jsonb('proposed_ownership').default([]).notNull(),
  agreementId: uuid('agreement_id'),
  createdAt: timestamps.createdAt,
  updatedAt: timestamps.updatedAt,
})

export const legalDocuments = pgTable('app_legal_documents', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  title: text('title').notNull(),
  documentType: text('document_type').notNull(),
  status: text('status').default('draft').notNull(),
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),
  currentVersionId: uuid('current_version_id'),
  createdByUserId: text('created_by_user_id').notNull(),
  ...timestamps,
})

export const legalDocumentVersions = pgTable('app_legal_document_versions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  documentId: uuid('document_id').notNull(),
  versionLabel: text('version_label').notNull(),
  filePath: text('file_path').notNull(),
  fileName: text('file_name').notNull(),
  mimeType: text('mime_type').notNull(),
  fileSize: integer('file_size').default(0).notNull(),
  status: text('status').default('draft').notNull(),
  uploadedByUserId: text('uploaded_by_user_id').notNull(),
  notes: text('notes'),
  createdAt: timestamps.createdAt,
})

export const agreements = pgTable('app_agreements', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  documentId: uuid('document_id'),
  title: text('title').notNull(),
  agreementType: text('agreement_type').notNull(),
  status: text('status').default('draft').notNull(),
  effectiveDate: date('effective_date'),
  expirationDate: date('expiration_date'),
  signedDate: date('signed_date'),
  createdByUserId: text('created_by_user_id').notNull(),
  ...timestamps,
})

export const agreementParties = pgTable('app_agreement_parties', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  agreementId: uuid('agreement_id').notNull(),
  userId: text('user_id'),
  partyName: text('party_name').notNull(),
  role: text('role').notNull(),
  createdAt: timestamps.createdAt,
})

export const agreementApprovals = pgTable('app_agreement_approvals', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  agreementId: uuid('agreement_id').notNull(),
  approverUserId: text('approver_user_id').notNull(),
  status: text('status').default('pending').notNull(),
  comments: text('comments'),
  decidedAt: timestamp('decided_at', { withTimezone: true }),
  createdAt: timestamps.createdAt,
})

export const agreementSignatures = pgTable('app_agreement_signatures', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  agreementId: uuid('agreement_id').notNull(),
  signerUserId: text('signer_user_id'),
  signerName: text('signer_name').notNull(),
  status: text('status').default('pending').notNull(),
  signedAt: timestamp('signed_at', { withTimezone: true }),
  signatureProvider: text('signature_provider'),
  signatureReference: text('signature_reference'),
  createdAt: timestamps.createdAt,
})

export const legalDocumentAuditLogs = pgTable('app_legal_document_audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  documentId: uuid('document_id'),
  agreementId: uuid('agreement_id'),
  actorUserId: text('actor_user_id'),
  action: text('action').notNull(),
  beforeData: jsonb('before_data'),
  afterData: jsonb('after_data'),
  createdAt: timestamps.createdAt,
})

// Company finance is workspace-scoped and separate from personal finance.
export const financeAccounts = pgTable('app_finance_accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  name: text('name').notNull(),
  accountType: text('account_type').default('bank').notNull(),
  currency: text('currency').default('USD').notNull(),
  openingBalance: numeric('opening_balance', { precision: 14, scale: 2 }).default('0').notNull(),
  currentBalance: numeric('current_balance', { precision: 14, scale: 2 }).default('0').notNull(),
  status: text('status').default('active').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
})

export const financeTransactions = pgTable('app_finance_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  accountId: uuid('account_id').notNull(),
  transactionType: text('transaction_type').notNull(),
  category: text('category'),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  transactionDate: date('transaction_date').notNull(),
  reference: text('reference'),
  projectId: uuid('project_id'),
  clientId: uuid('client_id'),
  createdByUserId: text('created_by_user_id').notNull(),
  status: text('status').default('posted').notNull(),
  metadata: jsonb('metadata').default({}).notNull(),
  ...timestamps,
})

export const financeExpenses = pgTable('app_finance_expenses', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  employeeUserId: text('employee_user_id'),
  projectId: uuid('project_id'),
  category: text('category').notNull(),
  description: text('description').notNull(),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  expenseDate: date('expense_date').notNull(),
  receiptFilePath: text('receipt_file_path'),
  status: text('status').default('submitted').notNull(),
  approvedByUserId: text('approved_by_user_id'),
  approvedAt: timestamp('approved_at', { withTimezone: true }),
  rejectionReason: text('rejection_reason'),
  notes: text('notes'),
  ...timestamps,
})

export const financeInvoices = pgTable('app_finance_invoices', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  clientId: uuid('client_id'),
  projectId: uuid('project_id'),
  invoiceNumber: text('invoice_number').notNull(),
  issueDate: date('issue_date').notNull(),
  dueDate: date('due_date'),
  subtotal: numeric('subtotal', { precision: 14, scale: 2 }).default('0').notNull(),
  taxAmount: numeric('tax_amount', { precision: 14, scale: 2 }).default('0').notNull(),
  totalAmount: numeric('total_amount', { precision: 14, scale: 2 }).default('0').notNull(),
  paidAmount: numeric('paid_amount', { precision: 14, scale: 2 }).default('0').notNull(),
  currency: text('currency').default('USD').notNull(),
  status: text('status').default('draft').notNull(),
  notes: text('notes'),
  createdByUserId: text('created_by_user_id').notNull(),
  ...timestamps,
}, (table) => ({
  invoiceNumberUnique: unique('app_finance_invoices_workspace_number_unique').on(table.workspaceId, table.invoiceNumber),
}))

export const financePayments = pgTable('app_finance_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  invoiceId: uuid('invoice_id'),
  accountId: uuid('account_id'),
  clientId: uuid('client_id'),
  projectId: uuid('project_id'),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(),
  currency: text('currency').default('USD').notNull(),
  paymentDate: date('payment_date').notNull(),
  paymentMethod: text('payment_method'),
  reference: text('reference'),
  status: text('status').default('pending').notNull(),
  recordedByUserId: text('recorded_by_user_id').notNull(),
  notes: text('notes'),
  ...timestamps,
})

export const financeReconciliations = pgTable('app_finance_reconciliations', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  accountId: uuid('account_id').notNull(),
  periodStart: date('period_start').notNull(),
  periodEnd: date('period_end').notNull(),
  statementBalance: numeric('statement_balance', { precision: 14, scale: 2 }).default('0').notNull(),
  systemBalance: numeric('system_balance', { precision: 14, scale: 2 }).default('0').notNull(),
  difference: numeric('difference', { precision: 14, scale: 2 }).default('0').notNull(),
  status: text('status').default('open').notNull(),
  reconciledByUserId: text('reconciled_by_user_id'),
  reconciledAt: timestamp('reconciled_at', { withTimezone: true }),
  notes: text('notes'),
  ...timestamps,
})

export const financeTasks = pgTable('app_finance_tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  assignedToUserId: text('assigned_to_user_id'),
  title: text('title').notNull(),
  description: text('description'),
  taskType: text('task_type').notNull(),
  priority: text('priority').default('normal').notNull(),
  status: text('status').default('pending').notNull(),
  dueDate: date('due_date'),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdByUserId: text('created_by_user_id').notNull(),
  ...timestamps,
})

export const departments = pgTable('app_departments', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  name: text('name').notNull(),
  code: text('code'),
  description: text('description'),
  managerUserId: text('manager_user_id'),
  status: text('status').default('active').notNull(),
  ...timestamps,
}, (table) => ({
  workspaceNameUnique: unique('app_departments_workspace_name_unique').on(table.workspaceId, table.name),
}))

export const roles = pgTable('app_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id'),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  scope: text('scope').default('workspace').notNull(),
  isSystemRole: boolean('is_system_role').default(false).notNull(),
  status: text('status').default('active').notNull(),
  ...timestamps,
}, (table) => ({
  workspaceCodeUnique: unique('app_roles_workspace_code_unique').on(table.workspaceId, table.code),
}))

export const permissions = pgTable('app_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  module: text('module').notNull(),
  description: text('description'),
  createdAt: timestamps.createdAt,
}, (table) => ({
  codeUnique: unique('app_permissions_code_unique').on(table.code),
}))

export const rolePermissions = pgTable('app_role_permissions', {
  id: uuid('id').defaultRandom().primaryKey(),
  roleId: uuid('role_id').notNull(),
  permissionId: uuid('permission_id').notNull(),
  createdAt: timestamps.createdAt,
}, (table) => ({
  rolePermissionUnique: unique('app_role_permissions_role_permission_unique').on(
    table.roleId,
    table.permissionId,
  ),
}))

export const userRoles = pgTable('app_user_roles', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  userId: text('user_id').notNull(),
  roleId: uuid('role_id').notNull(),
  status: text('status').default('active').notNull(),
  ...timestamps,
}, (table) => ({
  workspaceUserRoleUnique: unique('app_user_roles_workspace_user_role_unique').on(
    table.workspaceId,
    table.userId,
    table.roleId,
  ),
}))

export const appSchema = {
  users,
  userCredentials,
  userSessions,
  passwordResetTokens,
  workspaces,
  memberships,
  entityOwnerships,
  entityInvitations,
  workspaceInvitations,
  clients,
  employees,
  projects,
  projectAccess,
  reminders,
  notifications,
  salesLeads,
  salesActivities,
  attendanceRecords,
  auditLogs,
  financeAccounts,
  financeTransactions,
  financeExpenses,
  financeInvoices,
  financePayments,
  financeReconciliations,
  financeTasks,
  ownershipHistory,
  ownershipChangeRequests,
  legalDocuments,
  legalDocumentVersions,
  agreements,
  agreementParties,
  agreementApprovals,
  agreementSignatures,
  legalDocumentAuditLogs,
  personalAccounts,
  personalTransactions,
  personalAssets,
  personalLiabilities,
  personalDebtPayments,
  personalMoneyRelationships,
  personalSettlements,
  personalSettlementAllocations,
  personalProperties,
  departments,
  roles,
  permissions,
  rolePermissions,
  userRoles,
}