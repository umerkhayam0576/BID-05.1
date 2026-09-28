import { boolean, date, jsonb, numeric, pgTable, text, timestamp, uuid, unique } from 'drizzle-orm/pg-core'

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
  workspaceId: uuid('workspace_id').notNull(),
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

export const appSchema = { users, userCredentials, userSessions, workspaces, memberships, entityOwnerships, entityInvitations, clients, employees, projects, projectAccess, reminders, notifications, salesLeads, salesActivities, attendanceRecords, auditLogs, personalAccounts, personalTransactions, personalAssets, personalLiabilities, personalProperties }
