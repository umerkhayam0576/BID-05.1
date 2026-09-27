import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as financeSchema from './schema'
import { appSchema } from './app-schema'

export const schema = { ...financeSchema, ...appSchema }

// Initialize PostgreSQL pool if DATABASE_URL is configured with non-placeholder credentials
let realPool: Pool | null = null
let realDb: any = null

const rawDbUrl = process.env.DATABASE_URL?.trim() || ''
const isPlaceholderDb = !rawDbUrl ||
  rawDbUrl.includes('your_password') ||
  rawDbUrl.includes('your_username') ||
  rawDbUrl.includes('example.com')

if (!isPlaceholderDb) {
  try {
    const testPool = new Pool({ connectionString: rawDbUrl, connectionTimeoutMillis: 2000 })
    testPool.on('error', (err) => {
      console.error('[db] PostgreSQL pool error:', err.message)
      // Never switch an authenticated production application to the mock store.
      if (process.env.NODE_ENV === 'production') {
        process.exitCode = 1
      }
    })
    realPool = testPool
    realDb = drizzle(realPool, { schema })
  } catch (err) {
    console.error('[db] PostgreSQL initialization failed:', err)
  }
} else {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL must be configured in production')
  }
  console.log('[db] Development mock store enabled because DATABASE_URL is not configured')
}

export const pool = realPool || (new Proxy({} as Pool, {
  get: () => async () => ({ rows: [] }),
}))

// --- IN-MEMORY MOCK STORE FOR RESILIENT RUNTIME ---
interface StoreState {
  [table: string]: any[]
}

const mockStore: StoreState = {
  finance_accounts: [
    {
      id: 1,
      userId: 'preview-user',
      scope: 'company',
      name: 'Commercial Operating Account',
      type: 'checking',
      currency: 'USD',
      openingBalance: '142500.00',
      currentBalance: '142500.00',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 2,
      userId: 'preview-user',
      scope: 'company',
      name: 'Payroll Reserve Account',
      type: 'savings',
      currency: 'USD',
      openingBalance: '65000.00',
      currentBalance: '65000.00',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 3,
      userId: 'preview-user',
      scope: 'company',
      name: 'Tax & Compliance Reserve',
      type: 'savings',
      currency: 'USD',
      openingBalance: '38200.00',
      currentBalance: '38200.00',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 4,
      userId: 'preview-user',
      scope: 'personal',
      name: 'Executive Personal Checking',
      type: 'checking',
      currency: 'USD',
      openingBalance: '24800.00',
      currentBalance: '24800.00',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  finance_transactions: [
    {
      id: 101,
      userId: 'preview-user',
      accountId: 1,
      scope: 'company',
      type: 'income',
      amount: '34500.00',
      transactionDate: '2026-09-18',
      description: 'Progress billing deposit - Turner Commercial Project #8849',
      category: 'Estimating Fee',
      counterparty: 'Turner Construction Co.',
      createdAt: new Date().toISOString(),
    },
    {
      id: 102,
      userId: 'preview-user',
      accountId: 1,
      scope: 'company',
      type: 'expense',
      amount: '4200.00',
      transactionDate: '2026-09-15',
      description: 'Planswift & Procore enterprise licenses renewal',
      category: 'Software & Tools',
      counterparty: 'Trimble Construction',
      createdAt: new Date().toISOString(),
    },
  ],
  finance_goals: [
    {
      id: 1,
      userId: 'preview-user',
      scope: 'company',
      name: 'Q4 Cash Flow Buffer',
      targetAmount: '100000.00',
      currentAmount: '75000.00',
      targetDate: '2026-12-31',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
    {
      id: 2,
      userId: 'preview-user',
      scope: 'company',
      name: 'Takeoff Hardware & Server Upgrades',
      targetAmount: '25000.00',
      currentAmount: '18500.00',
      targetDate: '2026-11-15',
      status: 'active',
      createdAt: new Date().toISOString(),
    },
  ],
  finance_budgets: [
    {
      id: 1,
      userId: 'preview-user',
      scope: 'company',
      name: 'Monthly Software & Takeoff Tools',
      amount: '5000.00',
      period: 'monthly',
      startDate: '2026-09-01',
      createdAt: new Date().toISOString(),
    },
  ],
  finance_recurring_rules: [
    {
      id: 1,
      userId: 'preview-user',
      scope: 'company',
      accountId: 1,
      type: 'expense',
      amount: '1250.00',
      frequency: 'monthly',
      nextRunDate: '2026-10-01',
      description: 'Cloud Estimating Server & Storage',
      category: 'Infrastructure',
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ],
  portal_entities: [
    {
      id: 1,
      userId: 'demo-client',
      entityType: 'project_quote',
      name: 'Metropolitan High School Takeoff Package',
      status: 'in_review',
      data: { budget: 14500, deadline: '2026-10-15', trades: ['Structural Steel', 'Concrete', 'Drywall'] },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  portal_audit_events: [],
  app_memberships: [
    { id: 'mem-1', workspaceId: 'ws-default', userId: 'preview-user', role: 'owner', status: 'active' },
    { id: 'mem-2', workspaceId: 'ws-default', userId: 'demo-client', role: 'client', status: 'active' },
  ],
  app_clients: [
    {
      id: 'cli-1',
      workspaceId: 'ws-default',
      name: 'Apex General Contractors',
      company: 'Apex GC',
      email: 'bids@apexgc.com',
      phone: '(555) 234-8901',
      status: 'active',
      metadata: {},
      createdAt: new Date().toISOString(),
    },
    {
      id: 'cli-2',
      workspaceId: 'ws-default',
      name: 'Turner Construction Co.',
      company: 'Turner',
      email: 'commercial@turner.com',
      phone: '(555) 876-5432',
      status: 'active',
      metadata: {},
      createdAt: new Date().toISOString(),
    },
  ],
  app_projects: [
    {
      id: 'proj-1',
      workspaceId: 'ws-default',
      name: 'Metropolitan High School Expansion',
      projectNumber: 'BID-8849',
      status: 'active',
      startDate: '2026-09-01',
      dueDate: '2026-10-15',
      metadata: {},
      createdAt: new Date().toISOString(),
    },
    {
      id: 'proj-2',
      workspaceId: 'ws-default',
      name: 'St. Jude Medical Pavilion Phase II',
      projectNumber: 'BID-9012',
      status: 'planning',
      startDate: '2026-09-20',
      dueDate: '2026-11-05',
      metadata: {},
      createdAt: new Date().toISOString(),
    },
  ],
  app_employees: [
    {
      id: 'emp-1',
      workspaceId: 'ws-default',
      name: 'Marcus Vance',
      department: 'Estimating',
      title: 'Senior Pre-Con Estimator',
      email: 'marcus.vance@bidexact.internal',
      status: 'active',
      metadata: {},
      createdAt: new Date().toISOString(),
    },
    {
      id: 'emp-2',
      workspaceId: 'ws-default',
      name: 'Elena Rostova',
      department: 'Engineering',
      title: 'Lead Structural Engineer',
      email: 'elena.rostova@bidexact.internal',
      status: 'active',
      metadata: {},
      createdAt: new Date().toISOString(),
    },
  ],
  app_reminders: [
    {
      id: 'rem-1',
      workspaceId: 'ws-default',
      title: 'Q3 Estimated Corporate Tax Filing',
      dueAt: new Date(Date.now() + 10 * 86400000).toISOString(),
      status: 'pending',
      metadata: {},
      createdAt: new Date().toISOString(),
    },
    {
      id: 'rem-2',
      workspaceId: 'ws-default',
      title: 'Professional Liability & E&O Insurance Policy Renewal',
      dueAt: new Date(Date.now() + 25 * 86400000).toISOString(),
      status: 'pending',
      metadata: {},
      createdAt: new Date().toISOString(),
    },
  ],
  app_notifications: [
    {
      id: 'notif-1',
      recipientUserId: 'preview-user',
      title: 'RFI-2024-089 Addendum Released',
      message: 'Addendum 2 released for Metropolitan High School project.',
      readAt: null,
      createdAt: new Date().toISOString(),
    },
  ],
  app_sales_leads: [],
  app_sales_activities: [],
  app_attendance: [],
  app_attendance_records: [],
}

function resolveTableName(table: any): string {
  if (!table) return 'unknown'
  if (typeof table === 'string') return table
  const rawName = table._?.name || table[Symbol.for('drizzle:Name')] || table[Symbol.for('drizzle:BaseName')] || table.name
  if (rawName && mockStore[rawName]) return rawName
  if (rawName) {
    if (mockStore[`app_${rawName}`]) return `app_${rawName}`
    if (mockStore[`finance_${rawName}`]) return `finance_${rawName}`
    return rawName
  }
  return 'unknown'
}

function getTableRows(table: any): any[] {
  const name = resolveTableName(table)
  if (!mockStore[name]) {
    mockStore[name] = []
  }
  return mockStore[name]
}

function createMockDb(): any {
  const mockDbInstance: any = {
    select: (fields?: any) => {
      let currentTable: any = null
      let currentLimit: number | null = null

      const qb: any = {
        from: (table: any) => {
          currentTable = table
          return qb
        },
        where: () => qb,
        orderBy: () => qb,
        limit: (limit: number) => {
          currentLimit = limit
          return qb
        },
        innerJoin: () => qb,
        leftJoin: () => qb,
        then: (onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) => {
          try {
            const rows = getTableRows(currentTable)
            let result = [...rows]
            if (fields && typeof fields === 'object') {
              const fieldKeys = Object.keys(fields)
              if (fieldKeys.length === 1) {
                const key = fieldKeys[0]
                result = result.map((row) => ({ [key]: row }))
              }
            }
            if (currentLimit !== null) {
              result = result.slice(0, currentLimit)
            }
            return Promise.resolve(result).then(onFulfilled, onRejected)
          } catch (err) {
            return Promise.reject(err).catch(onRejected)
          }
        },
      }
      return qb
    },

    insert: (table: any) => {
      let insertedValues: any = null
      const tableName = resolveTableName(table)
      const list = getTableRows(table)

      const insertQb: any = {
        values: (vals: any) => {
          insertedValues = vals
          return insertQb
        },
        returning: () => {
          const item = {
            id: insertedValues?.id || Date.now(),
            ...insertedValues,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          list.push(item)
          return Promise.resolve([item])
        },
        onConflictDoUpdate: () => insertQb,
        then: (onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) => {
          const item = {
            id: insertedValues?.id || Date.now(),
            ...insertedValues,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }
          list.push(item)
          return Promise.resolve([item]).then(onFulfilled, onRejected)
        },
      }
      return insertQb
    },

    update: (table: any) => {
      let updateValues: any = null
      const list = getTableRows(table)

      const updateQb: any = {
        set: (vals: any) => {
          updateValues = vals
          return updateQb
        },
        where: () => {
          if (list.length > 0 && updateValues) {
            Object.assign(list[0], updateValues, { updatedAt: new Date().toISOString() })
          }
          return Promise.resolve([list[0] || updateValues])
        },
        then: (onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) => {
          return Promise.resolve([updateValues]).then(onFulfilled, onRejected)
        },
      }
      return updateQb
    },

    delete: (table: any) => {
      const list = getTableRows(table)
      const deleteQb: any = {
        where: () => {
          list.length = 0
          return Promise.resolve([])
        },
        then: (onFulfilled?: (value: any) => any, onRejected?: (reason: any) => any) => {
          return Promise.resolve([]).then(onFulfilled, onRejected)
        },
      }
      return deleteQb
    },

    transaction: async (callback: (tx: any) => Promise<any>) => {
      return await callback(mockDbInstance)
    },
  }

  return mockDbInstance
}

const mockDb = createMockDb()

// Production must use PostgreSQL. The in-memory store is intentionally development-only.
// This prevents an unavailable/misconfigured database from silently serving stale or cross-user mock data.
if (process.env.NODE_ENV === 'production' && !realDb) {
  throw new Error('DATABASE_URL must be configured and reachable in production')
}

export const db = new Proxy(mockDb, {
  get(target, prop, receiver) {
    if (realDb && typeof realDb[prop] === 'function') {
      return (...args: any[]) => realDb[prop](...args)
    }
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Database is unavailable')
    }
    return Reflect.get(target, prop, receiver)
  },
})
