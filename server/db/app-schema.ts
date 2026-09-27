import { boolean, date, jsonb, numeric, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const workspaces = pgTable('app_workspaces', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
  ...timestamps,
})

export const memberships = pgTable('app_memberships', {
  id: uuid('id').defaultRandom().primaryKey(),
  workspaceId: uuid('workspace_id').notNull(),
  userId: text('user_id').notNull(),
  role: text('role').notNull(),
  status: text('status').default('active').notNull(),
  createdAt: timestamps.createdAt,
})

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

export const appSchema = { workspaces, memberships, clients, employees, projects, reminders, notifications, salesLeads, salesActivities, attendanceRecords, auditLogs }
