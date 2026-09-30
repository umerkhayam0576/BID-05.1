import { and, desc, eq, or } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db'
import { financeAccounts, financeBudgets, financeGoals, financeRecurringRules, financeTransactions } from '../db/schema'
import { employees, financeAccounts as companyFinanceAccounts, financeExpenses, financeInvoices, financePayments, financeReconciliations, financeTasks, memberships } from '../db/app-schema'
import { getAuthenticatedUserId, getMembership } from '../auth/middleware'
import { getScope, getUserId, handleRouteError, money, positiveInteger, requiredText } from './validation'

const router = Router()

router.get('/accounts', async (req, res) => {
  try { res.json(await db.select().from(financeAccounts).where(eq(financeAccounts.userId, getUserId(req)))) } catch (error) { handleRouteError(res, error) }
})

router.post('/accounts', async (req, res) => {
  try {
    const userId = getUserId(req)
    const name = requiredText(req.body.name, 'name')
    const openingBalance = money(req.body.openingBalance || 0, 'openingBalance')
    const [account] = await db.insert(financeAccounts).values({ userId, scope: getScope(req.body.scope), name, type: String(req.body.type || 'checking'), currency: String(req.body.currency || 'USD'), openingBalance, currentBalance: openingBalance }).returning()
    res.status(201).json(account)
  } catch (error) { handleRouteError(res, error) }
})

router.get('/transactions', async (req, res) => {
  try { res.json(await db.select().from(financeTransactions).where(eq(financeTransactions.userId, getUserId(req))).orderBy(desc(financeTransactions.transactionDate), desc(financeTransactions.id))) } catch (error) { handleRouteError(res, error) }
})

router.post('/transactions', async (req, res) => {
  try {
    const userId = getUserId(req)
    const accountId = positiveInteger(req.body.accountId, 'accountId')
    const amount = money(req.body.amount, 'amount')
    const type = requiredText(req.body.type, 'type')
    const allowedTypes = ['income', 'expense', 'transfer', 'deposit', 'withdrawal', 'adjustment']
    if (!allowedTypes.includes(type)) throw new Error('Invalid transaction type')
    const scope = getScope(req.body.scope)
    const description = requiredText(req.body.description, 'description')

    const transaction = await db.transaction(async (tx: any) => {
      const [account] = await tx.select().from(financeAccounts).where(and(eq(financeAccounts.id, accountId), eq(financeAccounts.userId, userId))).limit(1)
      if (!account) throw new Error('Account not found')
      const transferAccountId = type === 'transfer' ? positiveInteger(req.body.transferAccountId, 'transferAccountId') : undefined
      if (transferAccountId === accountId) throw new Error('Transfer accounts must be different')
      const destination = transferAccountId ? (await tx.select().from(financeAccounts).where(and(eq(financeAccounts.id, transferAccountId), eq(financeAccounts.userId, userId))).limit(1))[0] : undefined
      if (transferAccountId && !destination) throw new Error('Transfer destination account not found')
      const [created] = await tx.insert(financeTransactions).values({ userId, accountId, scope, type, amount, description, transactionDate: req.body.transactionDate ? String(req.body.transactionDate) : undefined, category: req.body.category ? String(req.body.category) : null, counterparty: req.body.counterparty ? String(req.body.counterparty) : null, transferAccountId: transferAccountId ?? null }).returning()
      const direction = type === 'income' || type === 'deposit' ? 1 : type === 'expense' || type === 'withdrawal' ? -1 : 0
      if (direction) await tx.update(financeAccounts).set({ currentBalance: String(Number(account.currentBalance) + direction * Number(amount)) }).where(and(eq(financeAccounts.id, accountId), eq(financeAccounts.userId, userId)))
      if (destination && transferAccountId) {
        await tx.update(financeAccounts).set({ currentBalance: String(Number(account.currentBalance) - Number(amount)) }).where(and(eq(financeAccounts.id, accountId), eq(financeAccounts.userId, userId)))
        await tx.update(financeAccounts).set({ currentBalance: String(Number(destination.currentBalance) + Number(amount)) }).where(and(eq(financeAccounts.id, transferAccountId), eq(financeAccounts.userId, userId)))
      }
      return created
    })
    res.status(201).json(transaction)
  } catch (error) { handleRouteError(res, error) }
})

router.delete('/transactions/:id', async (req, res) => {
  try {
    const userId = getUserId(req)
    const transactionId = positiveInteger(req.params.id, 'transaction id')
    await db.transaction(async (tx: any) => {
      const [transaction] = await tx.select().from(financeTransactions).where(and(eq(financeTransactions.id, transactionId), eq(financeTransactions.userId, userId))).limit(1)
      if (!transaction) throw new Error('Transaction not found')
      const direction = transaction.type === 'income' || transaction.type === 'deposit' ? -1 : transaction.type === 'expense' || transaction.type === 'withdrawal' ? 1 : 0
      if (direction) {
        const [account] = await tx.select().from(financeAccounts).where(and(eq(financeAccounts.id, transaction.accountId), eq(financeAccounts.userId, userId))).limit(1)
        if (account) await tx.update(financeAccounts).set({ currentBalance: String(Number(account.currentBalance) + direction * Number(transaction.amount)) }).where(and(eq(financeAccounts.id, transaction.accountId), eq(financeAccounts.userId, userId)))
      }
      await tx.delete(financeTransactions).where(and(eq(financeTransactions.id, transactionId), eq(financeTransactions.userId, userId)))
    })
    res.status(204).send()
  } catch (error) { handleRouteError(res, error) }
})

router.get('/budgets', async (req, res) => { try { res.json(await db.select().from(financeBudgets).where(eq(financeBudgets.userId, getUserId(req)))) } catch (error) { handleRouteError(res, error) } })
  router.get('/goals', async (req, res) => { try { res.json(await db.select().from(financeGoals).where(eq(financeGoals.userId, getUserId(req)))) } catch (error) { handleRouteError(res, error) } })
  router.post('/goals', async (req, res) => {
    try {
      const body = req.body as Record<string, unknown>
      const name = requiredText(body.name, 'name')
      const targetAmount = money(body.targetAmount, 'targetAmount')
      const currentAmount = money(body.currentAmount || 0, 'currentAmount')
      const [goal] = await db.insert(financeGoals).values({ userId: getUserId(req), scope: getScope(body.scope), name, targetAmount, currentAmount, targetDate: body.targetDate ? String(body.targetDate) : null }).returning()
      res.status(201).json(goal)
    } catch (error) { handleRouteError(res, error) }
  })
router.get('/recurring', async (req, res) => { try { res.json(await db.select().from(financeRecurringRules).where(and(eq(financeRecurringRules.userId, getUserId(req)), eq(financeRecurringRules.isActive, true)))) } catch (error) { handleRouteError(res, error) } })


function workspaceIdFromRequest(req: import('express').Request) {
  const value = typeof req.query.workspaceId === 'string'
    ? req.query.workspaceId.trim()
    : typeof req.body?.workspaceId === 'string'
      ? req.body.workspaceId.trim()
      : ''
  if (!value) throw new Error('workspaceId is required')
  return value
}

async function requireCompanyFinanceAccess(req: import('express').Request, workspaceId: string) {
  const userId = getAuthenticatedUserId(req)
  const membership = await getMembership(userId, workspaceId)
  if (!membership) {
    const error = new Error('Workspace access denied')
    ;(error as Error & { status?: number }).status = 403
    throw error
  }

  if (['owner', 'admin', 'manager'].includes(membership.role)) return { userId, membership }

  if (membership.role === 'finance') {
    const [employee] = await db.select({ id: employees.id, portalRole: employees.portalRole, status: employees.status })
      .from(employees)
      .where(and(
        eq(employees.workspaceId, workspaceId),
        eq(employees.userId, userId),
        eq(employees.status, 'active'),
      ))
      .limit(1)

    if (employee?.portalRole === 'finance') return { userId, membership }
  }

  const error = new Error('Finance access denied')
  ;(error as Error & { status?: number }).status = 403
  throw error
}

router.get('/company/dashboard', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(req, workspaceId)

    const [accounts, invoices, expenses, payments] = await Promise.all([
      db.select().from(companyFinanceAccounts).where(and(
        eq(companyFinanceAccounts.workspaceId, workspaceId),
        eq(companyFinanceAccounts.status, 'active'),
      )),
      db.select().from(financeInvoices).where(eq(financeInvoices.workspaceId, workspaceId)),
      db.select().from(financeExpenses).where(eq(financeExpenses.workspaceId, workspaceId)),
      db.select().from(financePayments).where(eq(financePayments.workspaceId, workspaceId)),
    ])

    const totalCash = accounts.reduce((sum, row) => sum + Number(row.currentBalance), 0)
    const totalReceivables = invoices.reduce((sum, row) => sum + Math.max(0, Number(row.totalAmount) - Number(row.paidAmount)), 0)
    const totalExpenses = expenses.filter((row) => row.status !== 'rejected').reduce((sum, row) => sum + Number(row.amount), 0)
    const totalPayments = payments.filter((row) => row.status === 'completed' || row.status === 'posted').reduce((sum, row) => sum + Number(row.amount), 0)

    res.json({
      workspaceId,
      metrics: {
        totalCash: totalCash.toFixed(2),
        accountsCount: accounts.length,
        accountsReceivable: totalReceivables.toFixed(2),
        totalExpenses: totalExpenses.toFixed(2),
        totalPayments: totalPayments.toFixed(2),
        outstandingInvoices: invoices.filter((row) => Number(row.totalAmount) > Number(row.paidAmount)).length,
      },
    })
  } catch (error) { handleRouteError(res, error) }
})

router.get('/company/accounts', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(req, workspaceId)
    res.json(await db.select().from(companyFinanceAccounts).where(eq(companyFinanceAccounts.workspaceId, workspaceId)).orderBy(desc(companyFinanceAccounts.createdAt)))
  } catch (error) { handleRouteError(res, error) }
})

router.post('/company/accounts', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    const { userId } = await requireCompanyFinanceAccess(req, workspaceId)
    const name = requiredText(req.body.name, 'name')
    const openingBalance = money(req.body.openingBalance || 0, 'openingBalance')
    const [account] = await db.insert(companyFinanceAccounts).values({
      workspaceId,
      name,
      accountType: String(req.body.accountType || 'bank'),
      currency: String(req.body.currency || 'USD'),
      openingBalance,
      currentBalance: openingBalance,
      metadata: { createdByUserId: userId },
    }).returning()
    res.status(201).json(account)
  } catch (error) { handleRouteError(res, error) }
})

router.get('/company/expenses', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(req, workspaceId)
    res.json(await db.select().from(financeExpenses).where(eq(financeExpenses.workspaceId, workspaceId)).orderBy(desc(financeExpenses.expenseDate), desc(financeExpenses.createdAt)))
  } catch (error) { handleRouteError(res, error) }
})

router.post('/company/expenses', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    const { userId } = await requireCompanyFinanceAccess(req, workspaceId)
    const [expense] = await db.insert(financeExpenses).values({
      workspaceId,
      employeeUserId: userId,
      projectId: req.body.projectId ? String(req.body.projectId) : null,
      category: requiredText(req.body.category, 'category'),
      description: requiredText(req.body.description, 'description'),
      amount: money(req.body.amount, 'amount'),
      currency: String(req.body.currency || 'USD'),
      expenseDate: String(req.body.expenseDate || new Date().toISOString().slice(0, 10)),
      receiptFilePath: req.body.receiptFilePath ? String(req.body.receiptFilePath) : null,
      status: 'submitted',
      notes: req.body.notes ? String(req.body.notes) : null,
    }).returning()
    res.status(201).json(expense)
  } catch (error) { handleRouteError(res, error) }
})

router.get('/company/invoices', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(req, workspaceId)
    res.json(await db.select().from(financeInvoices).where(eq(financeInvoices.workspaceId, workspaceId)).orderBy(desc(financeInvoices.issueDate), desc(financeInvoices.createdAt)))
  } catch (error) { handleRouteError(res, error) }
})

router.get('/company/payments', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(req, workspaceId)
    res.json(await db.select().from(financePayments).where(eq(financePayments.workspaceId, workspaceId)).orderBy(desc(financePayments.paymentDate), desc(financePayments.createdAt)))
  } catch (error) { handleRouteError(res, error) }
})

router.get('/company/reconciliations', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(req, workspaceId)
    res.json(await db.select().from(financeReconciliations).where(eq(financeReconciliations.workspaceId, workspaceId)).orderBy(desc(financeReconciliations.periodEnd), desc(financeReconciliations.createdAt)))
  } catch (error) { handleRouteError(res, error) }
})

router.get('/company/tasks', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    const { userId } = await requireCompanyFinanceAccess(req, workspaceId)
    const rows = await db.select().from(financeTasks).where(and(
      eq(financeTasks.workspaceId, workspaceId),
      or(eq(financeTasks.assignedToUserId, userId), eq(financeTasks.assignedToUserId, '')),
    )).orderBy(desc(financeTasks.createdAt))
    res.json(rows)
  } catch (error) { handleRouteError(res, error) }
})

export { router as financeRoutes }
