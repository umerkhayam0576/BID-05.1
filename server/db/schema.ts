import { bigint, boolean, date, integer, jsonb, numeric, pgTable, serial, text, timestamp, varchar } from 'drizzle-orm/pg-core'

const timestamps = {
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
}

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  fullName: varchar('full_name', { length: 255 }),
  role: varchar('role', { length: 50 }).default('estimator'), // 'admin', 'estimator', 'client'
  defaultWorkspace: varchar('default_workspace', { length: 50 }).default('pre-con'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const financeAccounts = pgTable('finance_accounts', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  userId: text('user_id').notNull(), scope: text('scope').notNull(), name: text('name').notNull(), type: text('type').notNull(),
  currency: text('currency').default('USD').notNull(), openingBalance: numeric('opening_balance', { precision: 14, scale: 2 }).default('0').notNull(),
  currentBalance: numeric('current_balance', { precision: 14, scale: 2 }).default('0').notNull(), isActive: boolean('is_active').default(true).notNull(), ...timestamps,
})

export const financeTransactions = pgTable('finance_transactions', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(), userId: text('user_id').notNull(), accountId: bigint('account_id', { mode: 'number' }).notNull(),
  scope: text('scope').notNull(), type: text('type').notNull(), amount: numeric('amount', { precision: 14, scale: 2 }).notNull(), transactionDate: date('transaction_date').defaultNow().notNull(),
  description: text('description').notNull(), category: text('category'), counterparty: text('counterparty'), transferAccountId: bigint('transfer_account_id', { mode: 'number' }), metadata: jsonb('metadata').default({}).notNull(), ...timestamps,
})

export const financeBudgets = pgTable('finance_budgets', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(), userId: text('user_id').notNull(), scope: text('scope').notNull(), name: text('name').notNull(), categoryId: bigint('category_id', { mode: 'number' }),
  amount: numeric('amount', { precision: 14, scale: 2 }).notNull(), period: text('period').notNull(), startDate: date('start_date').notNull(), endDate: date('end_date'), ...timestamps,
})

export const financeGoals = pgTable('finance_goals', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(), userId: text('user_id').notNull(), scope: text('scope').notNull(), name: text('name').notNull(),
  targetAmount: numeric('target_amount', { precision: 14, scale: 2 }).notNull(), currentAmount: numeric('current_amount', { precision: 14, scale: 2 }).default('0').notNull(), targetDate: date('target_date'), status: text('status').default('active').notNull(), ...timestamps,
})

export const portalEntities = pgTable('portal_entities', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  userId: text('user_id').notNull(),
  entityType: text('entity_type').notNull(),
  name: text('name').notNull(),
  status: text('status').notNull(),
  data: jsonb('data').default({}).notNull(),
  ...timestamps,
})

export const portalAuditEvents = pgTable('portal_audit_events', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(),
  userId: text('user_id').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(),
  beforeData: jsonb('before_data'),
  afterData: jsonb('after_data'),
  ...timestamps,
})

export const financeRecurringRules = pgTable('finance_recurring_rules', {
  id: bigint('id', { mode: 'number' }).primaryKey().generatedByDefaultAsIdentity(), userId: text('user_id').notNull(), scope: text('scope').notNull(), accountId: bigint('account_id', { mode: 'number' }).notNull(),
  type: text('type').notNull(), amount: numeric('amount', { precision: 14, scale: 2 }).notNull(), frequency: text('frequency').notNull(), nextRunDate: date('next_run_date').notNull(), description: text('description').notNull(), category: text('category'), isActive: boolean('is_active').default(true).notNull(), ...timestamps,
})
