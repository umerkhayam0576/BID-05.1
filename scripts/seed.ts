import 'dotenv/config'
import { Pool } from 'pg'
import { drizzle } from 'drizzle-orm/node-postgres'
import { financeAccounts, financeTransactions, financeGoals, financeBudgets, financeRecurringRules, portalEntities } from '../server/db/schema'
import { workspaces, memberships, clients, employees, projects, reminders, notifications } from '../server/db/app-schema'
import { initializeWorkspaceRbac } from '../server/auth/workspaceRbac'

async function seed() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool)

  console.log('[Seed] Seeding PostgreSQL database bidxact_db...')

  // 1. Workspace & Membership
  const wsId = 'a0000000-0000-0000-0000-000000000001'
  await db.insert(workspaces).values({
    id: wsId,
    name: 'BidExact Enterprise',
    slug: 'bidexact-enterprise',
  }).onConflictDoNothing()

  await db.insert(memberships).values([
    { id: 'b0000000-0000-0000-0000-000000000001', workspaceId: wsId, userId: 'preview-user', role: 'owner', status: 'active' },
    { id: 'b0000000-0000-0000-0000-000000000002', workspaceId: wsId, userId: 'demo-client', role: 'client', status: 'active' },
  ]).onConflictDoNothing()

  // Initialize standard workspace RBAC departments, roles, and permissions
  await initializeWorkspaceRbac(db, wsId, 'preview-user')

  // 2. Finance Accounts
  await db.insert(financeAccounts).values([
    { id: 1, userId: 'preview-user', scope: 'company', name: 'Commercial Operating Account', type: 'checking', currency: 'USD', openingBalance: '142500.00', currentBalance: '142500.00', isActive: true },
    { id: 2, userId: 'preview-user', scope: 'company', name: 'Payroll Reserve Account', type: 'savings', currency: 'USD', openingBalance: '65000.00', currentBalance: '65000.00', isActive: true },
    { id: 3, userId: 'preview-user', scope: 'company', name: 'Tax & Compliance Reserve', type: 'savings', currency: 'USD', openingBalance: '38200.00', currentBalance: '38200.00', isActive: true },
    { id: 4, userId: 'preview-user', scope: 'personal', name: 'Executive Personal Checking', type: 'checking', currency: 'USD', openingBalance: '24800.00', currentBalance: '24800.00', isActive: true },
  ]).onConflictDoNothing()

  // 3. Transactions
  await db.insert(financeTransactions).values([
    { id: 101, userId: 'preview-user', accountId: 1, scope: 'company', type: 'income', amount: '34500.00', transactionDate: '2026-09-18', description: 'Progress billing deposit - Turner Commercial Project #8849', category: 'Estimating Fee', counterparty: 'Turner Construction Co.' },
    { id: 102, userId: 'preview-user', accountId: 1, scope: 'company', type: 'expense', amount: '4200.00', transactionDate: '2026-09-15', description: 'Planswift & Procore enterprise licenses renewal', category: 'Software & Tools', counterparty: 'Trimble Construction' },
  ]).onConflictDoNothing()

  // 4. Goals, Budgets, Recurring Rules
  await db.insert(financeGoals).values([
    { id: 1, userId: 'preview-user', scope: 'company', name: 'Q4 Cash Flow Buffer', targetAmount: '100000.00', currentAmount: '75000.00', targetDate: '2026-12-31', status: 'active' },
    { id: 2, userId: 'preview-user', scope: 'company', name: 'Takeoff Hardware & Server Upgrades', targetAmount: '25000.00', currentAmount: '18500.00', targetDate: '2026-11-15', status: 'active' },
  ]).onConflictDoNothing()

  await db.insert(financeBudgets).values([
    { id: 1, userId: 'preview-user', scope: 'company', name: 'Monthly Software & Takeoff Tools', amount: '5000.00', period: 'monthly', startDate: '2026-09-01' },
  ]).onConflictDoNothing()

  await db.insert(financeRecurringRules).values([
    { id: 1, userId: 'preview-user', scope: 'company', accountId: 1, type: 'expense', amount: '1250.00', frequency: 'monthly', nextRunDate: '2026-10-01', description: 'Cloud Estimating Server & Storage', category: 'Infrastructure', isActive: true },
  ]).onConflictDoNothing()

  // 5. Portal Entities
  await db.insert(portalEntities).values([
    { id: 1, userId: 'demo-client', entityType: 'project_quote', name: 'Metropolitan High School Takeoff Package', status: 'in_review', data: { budget: 14500, deadline: '2026-10-15', trades: ['Structural Steel', 'Concrete', 'Drywall'] } },
    { id: 2, userId: 'preview-user', entityType: 'project_quote', name: 'Metropolitan High School Takeoff Package', status: 'in_review', data: { budget: 14500, deadline: '2026-10-15', trades: ['Structural Steel', 'Concrete', 'Drywall'] } },
  ]).onConflictDoNothing()

  // 6. Clients, Projects, Employees, Reminders, Notifications
  await db.insert(clients).values([
    { id: 'c0000000-0000-0000-0000-000000000001', workspaceId: wsId, name: 'Apex General Contractors', company: 'Apex GC', email: 'bids@apexgc.com', phone: '(555) 234-8901', status: 'active' },
    { id: 'c0000000-0000-0000-0000-000000000002', workspaceId: wsId, name: 'Turner Construction Co.', company: 'Turner', email: 'commercial@turner.com', phone: '(555) 876-5432', status: 'active' },
  ]).onConflictDoNothing()

  await db.insert(projects).values([
    { id: 'd0000000-0000-0000-0000-000000000001', workspaceId: wsId, name: 'Metropolitan High School Expansion', projectNumber: 'BID-8849', status: 'active', startDate: '2026-09-01', dueDate: '2026-10-15' },
    { id: 'd0000000-0000-0000-0000-000000000002', workspaceId: wsId, name: 'St. Jude Medical Pavilion Phase II', projectNumber: 'BID-9012', status: 'planning', startDate: '2026-09-20', dueDate: '2026-11-05' },
  ]).onConflictDoNothing()

  await db.insert(employees).values([
    { id: 'e0000000-0000-0000-0000-000000000001', workspaceId: wsId, name: 'Marcus Vance', department: 'Estimating', title: 'Senior Pre-Con Estimator', email: 'marcus.vance@bidexact.internal', status: 'active' },
    { id: 'e0000000-0000-0000-0000-000000000002', workspaceId: wsId, name: 'Elena Rostova', department: 'Engineering', title: 'Lead Structural Engineer', email: 'elena.rostova@bidexact.internal', status: 'active' },
  ]).onConflictDoNothing()

  await db.insert(reminders).values([
    { id: 'f0000000-0000-0000-0000-000000000001', workspaceId: wsId, title: 'Q3 Estimated Corporate Tax Filing', dueAt: new Date(Date.now() + 10 * 86400000), status: 'pending' },
    { id: 'f0000000-0000-0000-0000-000000000002', workspaceId: wsId, title: 'Professional Liability & E&O Insurance Policy Renewal', dueAt: new Date(Date.now() + 25 * 86400000), status: 'pending' },
  ]).onConflictDoNothing()

  await db.insert(notifications).values([
    { id: 'a1000000-0000-0000-0000-000000000001', workspaceId: wsId, recipientUserId: 'preview-user', type: 'alert', title: 'RFI-2024-089 Addendum Released', body: 'Addendum 2 released for Metropolitan High School project.' },
  ]).onConflictDoNothing()

  // Sync identity sequences
  await pool.query(`
    SELECT setval(pg_get_serial_sequence('portal_entities', 'id'), COALESCE((SELECT MAX(id) FROM portal_entities), 0) + 1, false);
    SELECT setval(pg_get_serial_sequence('finance_accounts', 'id'), COALESCE((SELECT MAX(id) FROM finance_accounts), 0) + 1, false);
    SELECT setval(pg_get_serial_sequence('finance_transactions', 'id'), COALESCE((SELECT MAX(id) FROM finance_transactions), 0) + 1, false);
    SELECT setval(pg_get_serial_sequence('finance_goals', 'id'), COALESCE((SELECT MAX(id) FROM finance_goals), 0) + 1, false);
    SELECT setval(pg_get_serial_sequence('finance_budgets', 'id'), COALESCE((SELECT MAX(id) FROM finance_budgets), 0) + 1, false);
    SELECT setval(pg_get_serial_sequence('finance_recurring_rules', 'id'), COALESCE((SELECT MAX(id) FROM finance_recurring_rules), 0) + 1, false);
  `)

  console.log('[Seed] Database successfully seeded!')
  await pool.end()
}

seed().catch((err) => {
  console.error('[Seed] Failed to seed database:', err)
  process.exit(1)
})
