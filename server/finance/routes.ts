import { randomBytes } from 'node:crypto'
import { and, desc, eq, or } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db'
import { financeAccounts, financeBudgets, financeGoals, financeRecurringRules, financeTransactions } from '../db/schema'
import {
  employees,
  users,
  userProfiles,
  entityOwnerships,
  financeAccounts as companyFinanceAccounts,
  financeTransactions as companyFinanceTransactions,
  financeExpenses,
  financeInvoices,
  financePayments,
  financeReconciliations,
  financeTasks,
  companyLoans,
  companyLoanPayments,
  personalLiabilities,
  personalDebtPayments,
  companyLoanEligibilityPolicies,
  companyLoanApplications,
} from '../db/app-schema'
import { getAuthenticatedUserId, getMembership } from '../auth/middleware'
import { getScope, getUserId, handleRouteError, money, positiveInteger, requiredText } from './validation'
const router = Router()

function generatePersonalFinanceId() {
  return `PF-${randomBytes(6).toString('hex').toUpperCase()}`
}
// ============================================================
// PERSONAL FINANCE
// ============================================================
router.get('/accounts', async (req, res) => {
  try {
    res.json(
      await db
        .select()
        .from(financeAccounts)
        .where(eq(financeAccounts.userId, getUserId(req))),
    )
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.post('/accounts', async (req, res) => {
  try {
    const userId = getUserId(req)
    const name = requiredText(req.body.name, 'name')
    const openingBalance = money(req.body.openingBalance || 0, 'openingBalance')
    const [account] = await db
      .insert(financeAccounts)
      .values({
        userId,
        scope: getScope(req.body.scope),
        name,
        type: String(req.body.type || 'checking'),
        currency: String(req.body.currency || 'USD'),
        openingBalance,
        currentBalance: openingBalance,
      })
      .returning()
    res.status(201).json(account)
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.get('/transactions', async (req, res) => {
  try {
    res.json(
      await db
        .select()
        .from(financeTransactions)
        .where(eq(financeTransactions.userId, getUserId(req)))
        .orderBy(
          desc(financeTransactions.transactionDate),
          desc(financeTransactions.id),
        ),
    )
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.post('/transactions', async (req, res) => {
  try {
    const userId = getUserId(req)
    const accountId = positiveInteger(req.body.accountId, 'accountId')
    const amount = money(req.body.amount, 'amount')
    const type = requiredText(req.body.type, 'type')
    const allowedTypes = [
      'income',
      'expense',
      'transfer',
      'deposit',
      'withdrawal',
      'adjustment',
    ]
    if (!allowedTypes.includes(type)) {
      throw new Error('Invalid transaction type')
    }
    const scope = getScope(req.body.scope)
    const description = requiredText(req.body.description, 'description')
    const transaction = await db.transaction(async (tx: any) => {
      const [account] = await tx
        .select()
        .from(financeAccounts)
        .where(
          and(
            eq(financeAccounts.id, accountId),
            eq(financeAccounts.userId, userId),
          ),
        )
        .limit(1)
      if (!account) {
        throw new Error('Account not found')
      }
      const transferAccountId =
        type === 'transfer'
          ? positiveInteger(req.body.transferAccountId, 'transferAccountId')
          : undefined
      if (transferAccountId === accountId) {
        throw new Error('Transfer accounts must be different')
      }
      const destination = transferAccountId
        ? (
            await tx
              .select()
              .from(financeAccounts)
              .where(
                and(
                  eq(financeAccounts.id, transferAccountId),
                  eq(financeAccounts.userId, userId),
                ),
              )
              .limit(1)
          )[0]
        : undefined
      if (transferAccountId && !destination) {
        throw new Error('Transfer destination account not found')
      }
      const [created] = await tx
        .insert(financeTransactions)
        .values({
          userId,
          accountId,
          scope,
          type,
          amount,
          description,
          transactionDate: req.body.transactionDate
            ? String(req.body.transactionDate)
            : undefined,
          category: req.body.category
            ? String(req.body.category)
            : null,
          counterparty: req.body.counterparty
            ? String(req.body.counterparty)
            : null,
          transferAccountId: transferAccountId ?? null,
        })
        .returning()
      const direction =
        type === 'income' || type === 'deposit'
          ? 1
          : type === 'expense' || type === 'withdrawal'
            ? -1
            : 0
      if (direction) {
        await tx
          .update(financeAccounts)
          .set({
            currentBalance: String(
              Number(account.currentBalance) + direction * Number(amount),
            ),
          })
          .where(
            and(
              eq(financeAccounts.id, accountId),
              eq(financeAccounts.userId, userId),
            ),
          )
      }
      if (destination && transferAccountId) {
        await tx
          .update(financeAccounts)
          .set({
            currentBalance: String(
              Number(account.currentBalance) - Number(amount),
            ),
          })
          .where(
            and(
              eq(financeAccounts.id, accountId),
              eq(financeAccounts.userId, userId),
            ),
          )
        await tx
          .update(financeAccounts)
          .set({
            currentBalance: String(
              Number(destination.currentBalance) + Number(amount),
            ),
          })
          .where(
            and(
              eq(financeAccounts.id, transferAccountId),
              eq(financeAccounts.userId, userId),
            ),
          )
      }
      return created
    })
    res.status(201).json(transaction)
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.delete('/transactions/:id', async (req, res) => {
  try {
    const userId = getUserId(req)
    const transactionId = positiveInteger(
      req.params.id,
      'transaction id',
    )
    await db.transaction(async (tx: any) => {
      const [transaction] = await tx
        .select()
        .from(financeTransactions)
        .where(
          and(
            eq(financeTransactions.id, transactionId),
            eq(financeTransactions.userId, userId),
          ),
        )
        .limit(1)
      if (!transaction) {
        throw new Error('Transaction not found')
      }
      const direction =
        transaction.type === 'income' || transaction.type === 'deposit'
          ? -1
          : transaction.type === 'expense' ||
              transaction.type === 'withdrawal'
            ? 1
            : 0
      if (direction) {
        const [account] = await tx
          .select()
          .from(financeAccounts)
          .where(
            and(
              eq(financeAccounts.id, transaction.accountId),
              eq(financeAccounts.userId, userId),
            ),
          )
          .limit(1)
        if (account) {
          await tx
            .update(financeAccounts)
            .set({
              currentBalance: String(
                Number(account.currentBalance) +
                  direction * Number(transaction.amount),
              ),
            })
            .where(
              and(
                eq(financeAccounts.id, transaction.accountId),
                eq(financeAccounts.userId, userId),
              ),
            )
        }
      }
      await tx
        .delete(financeTransactions)
        .where(
          and(
            eq(financeTransactions.id, transactionId),
            eq(financeTransactions.userId, userId),
          ),
        )
    })
    res.status(204).send()
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.get('/budgets', async (req, res) => {
  try {
    res.json(
      await db
        .select()
        .from(financeBudgets)
        .where(eq(financeBudgets.userId, getUserId(req))),
    )
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.get('/goals', async (req, res) => {
  try {
    res.json(
      await db
        .select()
        .from(financeGoals)
        .where(eq(financeGoals.userId, getUserId(req))),
    )
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.post('/goals', async (req, res) => {
  try {
    const body = req.body as Record<string, unknown>
    const name = requiredText(body.name, 'name')
    const targetAmount = money(body.targetAmount, 'targetAmount')
    const currentAmount = money(
      body.currentAmount || 0,
      'currentAmount',
    )
    const [goal] = await db
      .insert(financeGoals)
      .values({
        userId: getUserId(req),
        scope: getScope(body.scope),
        name,
        targetAmount,
        currentAmount,
        targetDate: body.targetDate
          ? String(body.targetDate)
          : null,
      })
      .returning()
    res.status(201).json(goal)
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.get('/recurring', async (req, res) => {
  try {
    res.json(
      await db
        .select()
        .from(financeRecurringRules)
        .where(
          and(
            eq(financeRecurringRules.userId, getUserId(req)),
            eq(financeRecurringRules.isActive, true),
          ),
        ),
    )
  } catch (error) {
    handleRouteError(res, error)
  }
})
// ============================================================
// COMPANY FINANCE HELPERS
// ============================================================
function workspaceIdFromRequest(
  req: import('express').Request,
) {
  const value =
    typeof req.query.workspaceId === 'string'
      ? req.query.workspaceId.trim()
      : typeof req.body?.workspaceId === 'string'
        ? req.body.workspaceId.trim()
        : ''
  if (!value) {
    throw new Error('workspaceId is required')
  }
  return value
}
/**
 * Company Finance authorization.
 *
 * IMPORTANT:
 * Employee portalRole is stored on the employees table.
 * It is NOT read from membership.portalRole.
 *
 * Therefore:
 *   owner/admin/manager -> company finance access
 *   employee + employees.portalRole === finance -> finance access
 *   everything else -> denied
 */
async function requireCompanyFinanceAccess(
  req: import('express').Request,
  workspaceId: string,
) {
  const userId = getAuthenticatedUserId(req)
  const membership = await getMembership(
    userId,
    workspaceId,
  )
  if (!membership) {
    const error = new Error('Workspace access denied')
    ;(error as Error & { status?: number }).status = 403
    throw error
  }
  // Company-level management access
  if (
    ['owner', 'admin', 'manager'].includes(
      membership.role,
    )
  ) {
    return {
      userId,
      membership,
    }
  }
  // Employee Finance Portal access
  //
  // DO NOT check membership.portalRole here.
  // portalRole is stored in the employees table.
  if (membership.role === 'employee') {
    const [employee] = await db
      .select({
        id: employees.id,
        portalRole: employees.portalRole,
        status: employees.status,
      })
      .from(employees)
      .where(
        and(
          eq(employees.workspaceId, workspaceId),
          eq(employees.userId, userId),
          eq(employees.status, 'active'),
        ),
      )
      .limit(1)
    if (employee?.portalRole === 'finance') {
      return {
        userId,
        membership,
      }
    }
  }
  const error = new Error('Finance access denied')
  ;(error as Error & { status?: number }).status = 403
  throw error
}
// ============================================================
// COMPANY FINANCE DASHBOARD
// ============================================================
router.get('/company/dashboard', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(
      req,
      workspaceId,
    )
    const [
      accounts,
      invoices,
      expenses,
      payments,
    ] = await Promise.all([
      db
        .select()
        .from(companyFinanceAccounts)
        .where(
          and(
            eq(
              companyFinanceAccounts.workspaceId,
              workspaceId,
            ),
            eq(
              companyFinanceAccounts.status,
              'active',
            ),
          ),
        ),
      db
        .select()
        .from(financeInvoices)
        .where(
          eq(
            financeInvoices.workspaceId,
            workspaceId,
          ),
        ),
      db
        .select()
        .from(financeExpenses)
        .where(
          eq(
            financeExpenses.workspaceId,
            workspaceId,
          ),
        ),
      db
        .select()
        .from(financePayments)
        .where(
          eq(
            financePayments.workspaceId,
            workspaceId,
          ),
        ),
    ])
    const totalCash = accounts.reduce(
      (sum: number, row: any) =>
        sum + Number(row.currentBalance),
      0,
    )
    const totalReceivables = invoices.reduce(
      (sum: number, row: any) =>
        sum +
        Math.max(
          0,
          Number(row.totalAmount) -
            Number(row.paidAmount),
        ),
      0,
    )
    const totalExpenses = expenses
      .filter(
        (row: any) => row.status !== 'rejected',
      )
      .reduce(
        (sum: number, row: any) =>
          sum + Number(row.amount),
        0,
      )
    const totalPayments = payments
      .filter(
        (row: any) => row.status === 'completed' ||
          row.status === 'posted',
      )
      .reduce(
        (sum: number, row: any) =>
          sum + Number(row.amount),
        0,
      )
    res.json({
      workspaceId,
      metrics: {
        totalCash: totalCash.toFixed(2),
        accountsCount: accounts.length,
        accountsReceivable:
          totalReceivables.toFixed(2),
        totalExpenses:
          totalExpenses.toFixed(2),
        totalPayments:
          totalPayments.toFixed(2),
        outstandingInvoices:
          invoices.filter(
            (row: any) =>
              Number(row.totalAmount) >
              Number(row.paidAmount),
          ).length,
      },
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})
// ============================================================
// COMPANY FINANCE ACCOUNTS
// ============================================================
router.get('/company/accounts', async (req, res) => {
  try {
    const workspaceId =
      workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(
      req,
      workspaceId,
    )
    res.json(
      await db
        .select()
        .from(companyFinanceAccounts)
        .where(
          eq(
            companyFinanceAccounts.workspaceId,
            workspaceId,
          ),
        )
        .orderBy(
          desc(
            companyFinanceAccounts.createdAt,
          ),
        ),
    )
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.post('/company/accounts', async (req, res) => {
  try {
    const workspaceId =
      workspaceIdFromRequest(req)
    const { userId } =
      await requireCompanyFinanceAccess(
        req,
        workspaceId,
      )
    const name = requiredText(
      req.body.name,
      'name',
    )
    const openingBalance = money(
      req.body.openingBalance || 0,
      'openingBalance',
    )
    const [account] = await db
      .insert(companyFinanceAccounts)
      .values({
        workspaceId,
        name,
        accountType: String(
          req.body.accountType || 'bank',
        ),
        currency: String(
          req.body.currency || 'USD',
        ),
        openingBalance,
        currentBalance: openingBalance,
        metadata: {
          createdByUserId: userId,
        },
      })
      .returning()
    res.status(201).json(account)
  } catch (error) {
    handleRouteError(res, error)
  }
})
// ============================================================
// ============================================================
// COMPANY LOAN ELIGIBILITY + APPLICATIONS
// ============================================================
const DEFAULT_LOAN_POLICIES = {
  employee: { minimumTenureDays: 180, maximumLoanAmount: '3000', salaryMultiple: '3', maximumActiveLoans: 1, minimumGapDays: 90, allowProbation: false, requireActiveStatus: true, allowAdminOverride: true },
  partner: { minimumTenureDays: 90, maximumLoanAmount: '10000', salaryMultiple: null, maximumActiveLoans: 2, minimumGapDays: 60, allowProbation: true, requireActiveStatus: true, allowAdminOverride: true },
} as const
function normalizePersonType(value: unknown) {
  const type = String(value || '').trim().toLowerCase()
  if (type !== 'employee' && type !== 'partner') throw new Error('personType must be employee or partner')
  return type as 'employee' | 'partner'
}
async function getLoanPolicy(workspaceId: string, personType: 'employee' | 'partner') {
  const [policy] = await db.select().from(companyLoanEligibilityPolicies).where(and(eq(companyLoanEligibilityPolicies.workspaceId, workspaceId), eq(companyLoanEligibilityPolicies.personType, personType), eq(companyLoanEligibilityPolicies.status, 'active'))).limit(1)
  return policy || { workspaceId, personType, ...DEFAULT_LOAN_POLICIES[personType] }
}
async function getActiveLoanCount(workspaceId: string, applicantUserId: string) {
  const rows = await db.select({ id: companyLoans.id, currentBalance: companyLoans.currentBalance }).from(companyLoans).where(and(eq(companyLoans.workspaceId, workspaceId), eq(companyLoans.borrowerUserId, applicantUserId), eq(companyLoans.status, 'active')))
  return rows.filter((row) => Number(row.currentBalance) > 0.009).length
}
async function resolveLoanPerson(workspaceId: string, applicantUserId: string) {
  const [user] = await db.select({ id: users.id, email: users.email, displayName: users.displayName, status: users.status }).from(users).where(eq(users.id, applicantUserId)).limit(1)
  if (!user) throw new Error('Person not found')
  const [employee] = await db.select().from(employees).where(and(eq(employees.workspaceId, workspaceId), eq(employees.userId, applicantUserId), eq(employees.status, 'active'))).limit(1)
  if (employee) {
    const metadata = (employee.metadata || {}) as Record<string, unknown>
    const hireDateValue = metadata.hireDate || metadata.hire_date
    const monthlyIncome = Number(metadata.monthlyGross || metadata.monthly_gross || 0)
    const probationStatus = String(metadata.probationStatus || metadata.probation_status || '').trim().toLowerCase()
    return { user, personType: 'employee' as const, name: employee.name, email: employee.email || user.email, role: employee.title || employee.portalRole || 'Employee', status: employee.status, startDate: hireDateValue ? String(hireDateValue) : null, monthlyIncome, probationStatus, employeeId: employee.id }
  }
  const [partner] = await db.select().from(entityOwnerships).where(and(eq(entityOwnerships.workspaceId, workspaceId), eq(entityOwnerships.userId, applicantUserId), eq(entityOwnerships.status, 'active'))).limit(1)
  if (partner) return { user, personType: 'partner' as const, name: user.displayName, email: user.email, role: partner.entityRole || 'Partner', status: partner.status, startDate: partner.createdAt ? new Date(partner.createdAt).toISOString().slice(0, 10) : null, monthlyIncome: 0, probationStatus: '', employeeId: null }
  throw new Error('Person is not an active employee or partner of this company')
}
function daysSince(dateValue: string | null) {
  if (!dateValue) return 0
  const start = new Date(dateValue + 'T00:00:00Z').getTime()
  if (!Number.isFinite(start)) return 0
  return Math.max(0, Math.floor((Date.now() - start) / 86400000))
}
async function evaluateLoanEligibility(workspaceId: string, applicantUserId: string, requestedAmount: number) {
  const person = await resolveLoanPerson(workspaceId, applicantUserId)
  const policy = await getLoanPolicy(workspaceId, person.personType)
  const activeLoanCount = await getActiveLoanCount(workspaceId, applicantUserId)
  const tenureDays = daysSince(person.startDate)
  const reasons: string[] = []

  if (policy.requireActiveStatus && person.status !== 'active') {
    reasons.push('Person is not active')
  }

  if (tenureDays < Number(policy.minimumTenureDays)) {
    reasons.push('Minimum tenure is ' + policy.minimumTenureDays + ' days')
  }

  if (
    person.personType === 'employee' &&
    person.probationStatus === 'probation' &&
    !policy.allowProbation
  ) {
    reasons.push('Employees on probation are not eligible for this loan')
  }

  if (activeLoanCount >= Number(policy.maximumActiveLoans)) {
    reasons.push('Maximum active loans allowed is ' + policy.maximumActiveLoans)
  }
  const [lastLoan] = await db
    .select({
      id: companyLoans.id,
      status: companyLoans.status,
      originationDate: companyLoans.originationDate,
    })
    .from(companyLoans)
    .where(
      and(
        eq(companyLoans.workspaceId, workspaceId),
        eq(companyLoans.borrowerUserId, applicantUserId),
      ),
    )
    .orderBy(desc(companyLoans.originationDate))
    .limit(1)

  if (
    lastLoan &&
    lastLoan.status !== 'active' &&
    Number(policy.minimumGapDays) > 0
  ) {
    const [lastPayment] = await db
      .select({
        paymentDate: companyLoanPayments.paymentDate,
      })
      .from(companyLoanPayments)
      .where(
        and(
          eq(companyLoanPayments.workspaceId, workspaceId),
          eq(companyLoanPayments.loanId, lastLoan.id),
        ),
      )
      .orderBy(desc(companyLoanPayments.paymentDate))
      .limit(1)

    if (lastPayment?.paymentDate) {
      const daysSinceLastPayment = daysSince(
        String(lastPayment.paymentDate),
      )

      if (daysSinceLastPayment < Number(policy.minimumGapDays)) {
        const remainingGapDays =
          Number(policy.minimumGapDays) - daysSinceLastPayment

        reasons.push(
          'Minimum gap between loans is ' +
            policy.minimumGapDays +
            ' days. ' +
            remainingGapDays +
            ' days remaining.',
        )
      }
    }
  }

  let maximumEligibleAmount = Number(policy.maximumLoanAmount)

  if (policy.salaryMultiple != null && person.monthlyIncome > 0) {
    maximumEligibleAmount = Math.min(
      maximumEligibleAmount,
      person.monthlyIncome * Number(policy.salaryMultiple),
    )
  } else if (
    policy.salaryMultiple != null &&
    person.personType === 'employee'
  ) {
    reasons.push(
      'Monthly income is not available for salary-multiple eligibility',
    )
  }

  if (
    requestedAmount > Number(policy.maximumLoanAmount)
  ) {
    reasons.push(
      'Requested amount exceeds the maximum loan amount of ' +
        Number(policy.maximumLoanAmount).toFixed(2),
    )
  }

  if (requestedAmount > maximumEligibleAmount) {
    reasons.push(
      'Requested amount exceeds the calculated eligible amount of ' +
        maximumEligibleAmount.toFixed(2),
    )
  }

  return {
    eligible: reasons.length === 0,
    reasons,
    maximumEligibleAmount: maximumEligibleAmount.toFixed(2),
    activeLoanCount,
    tenureDays,
    policy,
    person,
  }
}
router.get('/company/loan-people', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req); await requireCompanyFinanceAccess(req, workspaceId)
    const [employeeRows, partnerRows] = await Promise.all([
      db.select().from(employees).where(and(eq(employees.workspaceId, workspaceId), eq(employees.status, 'active'))),
      db.select().from(entityOwnerships).where(and(eq(entityOwnerships.workspaceId, workspaceId), eq(entityOwnerships.status, 'active'))),
    ])
    const ids = Array.from(new Set([...employeeRows.map((r) => r.userId).filter(Boolean) as string[], ...partnerRows.map((r) => r.userId)]))
    const people = []
    for (const applicantUserId of ids) {
      try {
        const person = await resolveLoanPerson(workspaceId, applicantUserId)
        const [profile] = await db.select({ personalFinanceId: userProfiles.personalFinanceId }).from(userProfiles).where(eq(userProfiles.userId, applicantUserId)).limit(1)
        const eligibility = await evaluateLoanEligibility(workspaceId, applicantUserId, 0)
        people.push({ userId: applicantUserId, personalFinanceId: profile?.personalFinanceId || null, name: person.name, email: person.email, personType: person.personType, role: person.role, status: person.status, startDate: person.startDate, activeLoanCount: eligibility.activeLoanCount, maximumEligibleAmount: eligibility.maximumEligibleAmount, eligible: eligibility.reasons.length === 0, eligibilityReasons: eligibility.reasons })
      } catch { /* Ignore members who are not valid loan people. */ }
    }
    res.json(people)
  } catch (error) { handleRouteError(res, error) }
})
router.get('/company/loan-eligibility/policies', async (req, res) => {
  try { const workspaceId = workspaceIdFromRequest(req); await requireCompanyFinanceAccess(req, workspaceId); res.json(await Promise.all([getLoanPolicy(workspaceId, 'employee'), getLoanPolicy(workspaceId, 'partner')])) } catch (error) { handleRouteError(res, error) }
})
router.put('/company/loan-eligibility/policies/:personType', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req); const { userId } = await requireCompanyFinanceAccess(req, workspaceId); const personType = normalizePersonType(req.params.personType)
    const values = { workspaceId, personType, minimumTenureDays: Math.max(0, Number(req.body.minimumTenureDays ?? 0)), maximumLoanAmount: money(req.body.maximumLoanAmount ?? 0, 'maximumLoanAmount'), salaryMultiple: req.body.salaryMultiple == null || req.body.salaryMultiple === '' ? null : money(req.body.salaryMultiple, 'salaryMultiple'), maximumActiveLoans: Math.max(1, Number(req.body.maximumActiveLoans ?? 1)), minimumGapDays: Math.max(0, Number(req.body.minimumGapDays ?? 0)), allowProbation: Boolean(req.body.allowProbation), requireActiveStatus: req.body.requireActiveStatus !== false, allowAdminOverride: req.body.allowAdminOverride !== false, status: 'active', metadata: { updatedByUserId: userId } }
    const [policy] = await db.insert(companyLoanEligibilityPolicies).values(values).onConflictDoUpdate({ target: [companyLoanEligibilityPolicies.workspaceId, companyLoanEligibilityPolicies.personType], set: { ...values, updatedAt: new Date() } }).returning()
    res.json(policy)
  } catch (error) { handleRouteError(res, error) }
})
router.get('/company/loan-applications', async (req, res) => {
  try { const workspaceId = workspaceIdFromRequest(req); await requireCompanyFinanceAccess(req, workspaceId); res.json(await db.select().from(companyLoanApplications).where(eq(companyLoanApplications.workspaceId, workspaceId)).orderBy(desc(companyLoanApplications.createdAt))) } catch (error) { handleRouteError(res, error) }
})
router.post('/company/loan-applications', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req); const authenticatedUserId = getAuthenticatedUserId(req); const applicantUserId = String(req.body.applicantUserId || authenticatedUserId).trim()
    if (applicantUserId !== authenticatedUserId) throw new Error('You can only submit a loan application for your own Personal Finance ID')
    const requestedAmount = money(req.body.requestedAmount, 'requestedAmount'); const purpose = requiredText(req.body.purpose, 'purpose')
    const requestedTermMonths = req.body.requestedTermMonths == null ? null : positiveInteger(req.body.requestedTermMonths, 'requestedTermMonths')
    const eligibility = await evaluateLoanEligibility(workspaceId, applicantUserId, Number(requestedAmount))
    const [profile] = await db.select({ personalFinanceId: userProfiles.personalFinanceId }).from(userProfiles).where(eq(userProfiles.userId, applicantUserId)).limit(1)
    let personalFinanceId = profile?.personalFinanceId || null

    if (!personalFinanceId) {
      personalFinanceId = generatePersonalFinanceId()
      await db
        .update(userProfiles)
        .set({ personalFinanceId })
        .where(eq(userProfiles.userId, applicantUserId))
    }
    const [application] = await db.insert(companyLoanApplications).values({ workspaceId, applicantUserId, personalFinanceId, applicantName: eligibility.person.name, applicantRole: eligibility.person.role, requestedAmount, requestedTermMonths, purpose, repaymentMethod: req.body.repaymentMethod ? String(req.body.repaymentMethod) : null, status: 'pending', eligibilityStatus: eligibility.eligible ? 'eligible' : 'ineligible', eligibilitySnapshot: { checkedAt: new Date().toISOString(), reasons: eligibility.reasons, maximumEligibleAmount: eligibility.maximumEligibleAmount, activeLoanCount: eligibility.activeLoanCount, tenureDays: eligibility.tenureDays, personType: eligibility.person.personType } }).returning()
    res.status(201).json({ application, eligibility })
  } catch (error) { handleRouteError(res, error) }
})
async function createCompanyLoanFromApplication(
  tx: any,
  workspaceId: string,
  application: any,
  userId: string,
  disbursementAccountId: string,
) {
  const accountId = String(disbursementAccountId || '').trim()
  if (!accountId) {
    throw new Error('disbursementAccountId is required for approval')
  }

  const [account] = await tx
    .select()
    .from(companyFinanceAccounts)
    .where(
      and(
        eq(companyFinanceAccounts.id, accountId),
        eq(companyFinanceAccounts.workspaceId, workspaceId),
      ),
    )
    .limit(1)

  if (!account) {
    throw new Error('Disbursement company finance account not found')
  }

  const principalAmount = Number(application.requestedAmount)
  const requestedTermMonths = Number(application.requestedTermMonths || 0)

  if (!Number.isInteger(requestedTermMonths) || requestedTermMonths <= 0) {
    throw new Error('A valid requestedTermMonths is required before loan approval')
  }

  const originationDate = new Date()

  const maturityDate = new Date(originationDate)
  maturityDate.setMonth(maturityDate.getMonth() + requestedTermMonths)

  const nextPaymentDue = new Date(originationDate)
  nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1)

  const monthlyPayment = principalAmount / requestedTermMonths

  const originationDateText = originationDate.toISOString().slice(0, 10)
  const maturityDateText = maturityDate.toISOString().slice(0, 10)
  const nextPaymentDueText = nextPaymentDue.toISOString().slice(0, 10)

  if (Number(account.currentBalance) < principalAmount) {
    throw new Error('Insufficient company account balance for this loan')
  }

  const loanNumber =
    `CL-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${application.id.slice(0, 8).toUpperCase()}`

  const existing = await tx
    .select({ id: companyLoans.id })
    .from(companyLoans)
    .where(
      and(
        eq(companyLoans.workspaceId, workspaceId),
        eq(companyLoans.loanNumber, loanNumber),
      ),
    )
    .limit(1)

  if (existing.length) {
    throw new Error('A company loan already exists for this application')
  }

  const [loan] = await tx
    .insert(companyLoans)
    .values({
      workspaceId,
      loanNumber,
      borrowerUserId: application.applicantUserId,
      borrowerName: application.applicantName,
      borrowerEmail: null,
      borrowerRole: application.applicantRole,
      name: 'Company Loan',
      loanType:
        application.applicantRole === 'partner'
          ? 'Partner Advance'
          : 'Employee Loan',
      principalAmount: principalAmount.toFixed(2),
      currentBalance: principalAmount.toFixed(2),
      interestRate: '0',
      monthlyPayment: monthlyPayment.toFixed(2),
      originationDate: originationDateText,
      maturityDate: maturityDateText,
      nextPaymentDue: nextPaymentDueText,
      repaymentMethod: application.repaymentMethod,
      status: 'active',
      approvalStatus: 'approved',
      approvedByUserId: userId,
      approvedAt: new Date(),
      purpose: application.purpose,
      notes: application.decisionNotes,
      metadata: {
        disbursementAccountId: accountId,
        applicationId: application.id,
      },
    })
    .returning()

  const [liability] = await tx
    .insert(personalLiabilities)
    .values({
      userId: application.applicantUserId,
      name: 'Company Loan',
      liabilityType: 'Company Loan',
      currentBalance: principalAmount.toFixed(2),
      originalBalance: principalAmount.toFixed(2),
      interestRate: '0',
      paymentAmount: monthlyPayment.toFixed(2),
      paymentFrequency: 'monthly',
      nextPaymentDate: nextPaymentDueText,
      startDate: originationDateText,
      currency: 'USD',
      status: 'active',
      notes: `Linked to company loan ${loanNumber} (${loan.id})`,
      linkedCompanyLoanId: loan.id,
    })
    .returning()

  const [transaction] = await tx
    .insert(companyFinanceTransactions)
    .values({
      workspaceId,
      accountId,
      transactionType: 'adjustment',
      category: 'company_loan_disbursement',
      description:
        `Loan disbursement - ${loanNumber} - ${application.applicantName}`,
      amount: (-principalAmount).toFixed(2),
      transactionDate: new Date().toISOString().slice(0, 10),
      reference: loanNumber,
      createdByUserId: userId,
      status: 'posted',
      metadata: {
        loanId: loan.id,
        applicationId: application.id,
        borrowerUserId: application.applicantUserId,
        direction: 'company_to_borrower',
      },
    })
    .returning()

  await tx
    .update(companyFinanceAccounts)
    .set({
      currentBalance: (
        Number(account.currentBalance) - principalAmount
      ).toFixed(2),
    })
    .where(
      and(
        eq(companyFinanceAccounts.id, accountId),
        eq(companyFinanceAccounts.workspaceId, workspaceId),
      ),
    )

  const [updatedLoan] = await tx
    .update(companyLoans)
    .set({
      personalLiabilityId: liability.id,
      metadata: {
        disbursementAccountId: accountId,
        disbursementTransactionId: transaction.id,
        applicationId: application.id,
      },
    })
    .where(
      and(
        eq(companyLoans.id, loan.id),
        eq(companyLoans.workspaceId, workspaceId),
      ),
    )
    .returning()

  return {
    loan: updatedLoan,
    liability,
    transaction,
  }
}

router.patch('/company/loan-applications/:id/decision', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    const { userId } = await requireCompanyFinanceAccess(req, workspaceId)
    const decision = String(req.body.decision || '').trim().toLowerCase()

    if (!['approved', 'rejected', 'needs_information'].includes(decision)) {
      throw new Error(
        'decision must be approved, rejected, or needs_information',
      )
    }

    const [application] = await db
      .select()
      .from(companyLoanApplications)
      .where(
        and(
          eq(companyLoanApplications.id, req.params.id),
          eq(companyLoanApplications.workspaceId, workspaceId),
        ),
      )
      .limit(1)

    if (!application) {
      throw new Error('Loan application not found')
    }

    if (application.status !== 'pending') {
      throw new Error('Only pending applications can be decided')
    }

    if (application.applicantUserId === userId) {
      throw new Error('You cannot approve or reject your own loan application')
    }

    const eligibility = await evaluateLoanEligibility(
      workspaceId,
      application.applicantUserId,
      Number(application.requestedAmount),
    )

    const override = Boolean(req.body.overrideEligibility)
    const overrideReason = String(req.body.overrideReason || '').trim()

    if (
      decision === 'approved' &&
      !eligibility.eligible &&
      !(override && overrideReason)
    ) {
      throw new Error(
        'Application is not eligible. An eligibility override reason is required.',
      )
    }

    if (decision === 'approved') {
      const disbursementAccountId = String(
        req.body.disbursementAccountId || '',
      ).trim()

      if (!disbursementAccountId) {
        throw new Error(
          'disbursementAccountId is required when approving a loan',
        )
      }

      const result = await db.transaction(async (tx: any) => {
        const loanResult = await createCompanyLoanFromApplication(
          tx,
          workspaceId,
          application,
          userId,
          disbursementAccountId,
        )

        const [updatedApplication] = await tx
          .update(companyLoanApplications)
          .set({
            status: 'approved',
            eligibilityStatus: eligibility.eligible
              ? 'eligible'
              : 'ineligible',
            eligibilitySnapshot: {
              ...((application.eligibilitySnapshot || {}) as Record<
                string,
                unknown
              >),
              finalCheckAt: new Date().toISOString(),
              finalReasons: eligibility.reasons,
              overrideEligibility: override,
              overrideReason: override ? overrideReason : null,
              activeLoanCount: eligibility.activeLoanCount,
              maximumEligibleAmount: eligibility.maximumEligibleAmount,
            },
            decisionNotes: req.body.notes
              ? String(req.body.notes)
              : null,
            decidedByUserId: userId,
            decidedAt: new Date(),
            companyLoanId: loanResult.loan.id,
          })
          .where(
            and(
              eq(companyLoanApplications.id, application.id),
              eq(companyLoanApplications.workspaceId, workspaceId),
            ),
          )
          .returning()

        return {
          application: updatedApplication,
          loan: loanResult.loan,
          liability: loanResult.liability,
          transaction: loanResult.transaction,
          eligibility,
        }
      })

      return res.json(result)
    }

    const [updated] = await db
      .update(companyLoanApplications)
      .set({
        status: decision,
        eligibilityStatus: eligibility.eligible
          ? 'eligible'
          : 'ineligible',
        eligibilitySnapshot: {
          ...((application.eligibilitySnapshot || {}) as Record<
            string,
            unknown
          >),
          finalCheckAt: new Date().toISOString(),
          finalReasons: eligibility.reasons,
          overrideEligibility: false,
          overrideReason: null,
          activeLoanCount: eligibility.activeLoanCount,
          maximumEligibleAmount: eligibility.maximumEligibleAmount,
        },
        decisionNotes: req.body.notes
          ? String(req.body.notes)
          : null,
        decidedByUserId: userId,
        decidedAt: new Date(),
      })
      .where(
        and(
          eq(companyLoanApplications.id, application.id),
          eq(companyLoanApplications.workspaceId, workspaceId),
        ),
      )
      .returning()

    return res.json({
      application: updated,
      eligibility,
    })
  } catch (error) {
    handleRouteError(res, error)
  }
})

// ============================================================
// COMPANY LOANS
// ============================================================
router.get('/company/loans', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(req, workspaceId)
    const rows = await db.select().from(companyLoans).where(
      eq(companyLoans.workspaceId, workspaceId),
    ).orderBy(desc(companyLoans.createdAt))
    res.json(rows)
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.post('/company/loans', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    const { userId } = await requireCompanyFinanceAccess(req, workspaceId)
    const borrowerUserId = String(req.body.borrowerUserId || '').trim()
    if (!borrowerUserId) throw new Error('borrowerUserId is required')
    const borrowerMembership = await getMembership(
      borrowerUserId,
      workspaceId,
    )
    if (!borrowerMembership) {
      throw new Error('Borrower is not a member of this company')
    }
    const loanNumber = requiredText(req.body.loanNumber, 'loanNumber')
    const name = requiredText(req.body.name || 'Company Loan', 'name')
    const loanType = requiredText(
      req.body.loanType || 'Partner Advance',
      'loanType',
    )
    const principalAmount = money(
      req.body.principalAmount,
      'principalAmount',
    )
    const originationDate = req.body.originationDate
      ? String(req.body.originationDate)
      : new Date().toISOString().slice(0, 10)
    const maturityDate = req.body.maturityDate
      ? String(req.body.maturityDate)
      : null
    const nextPaymentDue = req.body.nextPaymentDue
      ? String(req.body.nextPaymentDue)
      : null
    const interestRate =
      req.body.interestRate == null
        ? '0'
        : money(req.body.interestRate, 'interestRate')
    const monthlyPayment =
      req.body.monthlyPayment == null
        ? '0'
        : money(req.body.monthlyPayment, 'monthlyPayment')
    const repaymentMethod = req.body.repaymentMethod
      ? String(req.body.repaymentMethod)
      : null
    const purpose = req.body.purpose
      ? String(req.body.purpose)
      : null
    const notes = req.body.notes
      ? String(req.body.notes)
      : null
    const borrowerName = String(
      req.body.borrowerName || borrowerUserId,
    )
    const borrowerEmail = req.body.borrowerEmail
      ? String(req.body.borrowerEmail)
      : null
    const borrowerRole = req.body.borrowerRole
      ? String(req.body.borrowerRole)
      : null
    const accountId = String(
      req.body.disbursementAccountId || '',
    ).trim()
    if (!accountId) {
      throw new Error('disbursementAccountId is required')
    }
    const result = await db.transaction(async (tx: any) => {
      const [existing] = await tx
        .select({ id: companyLoans.id })
        .from(companyLoans)
        .where(
          and(
            eq(companyLoans.workspaceId, workspaceId),
            eq(companyLoans.loanNumber, loanNumber),
          ),
        )
        .limit(1)
      if (existing) {
        throw new Error(
          'A loan with this loanNumber already exists in this company',
        )
      }
      const [account] = await tx
        .select()
        .from(companyFinanceAccounts)
        .where(
          and(
            eq(companyFinanceAccounts.id, accountId),
            eq(companyFinanceAccounts.workspaceId, workspaceId),
          ),
        )
        .limit(1)
      if (!account) {
        throw new Error(
          'Disbursement company finance account not found',
        )
      }
      if (
        Number(account.currentBalance) <
        Number(principalAmount)
      ) {
        throw new Error(
          'Insufficient company account balance for this loan',
        )
      }
      const [loan] = await tx
        .insert(companyLoans)
        .values({
          workspaceId,
          loanNumber,
          borrowerUserId,
          borrowerName,
          borrowerEmail,
          borrowerRole,
          name,
          loanType,
          principalAmount,
          currentBalance: principalAmount,
          interestRate,
          monthlyPayment,
          originationDate,
          maturityDate,
          nextPaymentDue,
          repaymentMethod,
          status: 'active',
          approvalStatus: 'approved',
          approvedByUserId: userId,
          approvedAt: new Date(),
          purpose,
          notes,
          metadata: {
            disbursementAccountId: accountId,
          },
        })
        .returning()
      const [liability] = await tx
        .insert(personalLiabilities)
        .values({
          userId: borrowerUserId,
          name,
          liabilityType: 'Company Loan',
          currentBalance: principalAmount,
          originalBalance: principalAmount,
          interestRate,
          paymentAmount: monthlyPayment,
          paymentFrequency: 'monthly',
          nextPaymentDate: nextPaymentDue,
          startDate: originationDate,
          currency: 'USD',
          status: 'active',
          notes: `Linked to company loan ${loanNumber} (${loan.id})`,
          linkedCompanyLoanId: loan.id,
        })
        .returning()
      const [transaction] = await tx
        .insert(companyFinanceTransactions)
        .values({
          workspaceId,
          accountId,
          transactionType: 'adjustment',
          category: 'company_loan_disbursement',
          description:
            `Loan disbursement - ${loanNumber} - ${borrowerName}`,
          amount: String(
            -Number(principalAmount).toFixed(2),
          ),
          transactionDate: originationDate,
          reference: loanNumber,
          createdByUserId: userId,
          status: 'posted',
          metadata: {
            loanId: loan.id,
            borrowerUserId,
            direction: 'company_to_borrower',
          },
        })
        .returning()


      await tx
        .update(companyFinanceAccounts)
        .set({
          currentBalance: String(
            (
              Number(account.currentBalance) -
              Number(principalAmount)
            ).toFixed(2),
          ),
        })
        .where(
          and(
            eq(companyFinanceAccounts.id, accountId),
            eq(companyFinanceAccounts.workspaceId, workspaceId),
          ),
        )
      const [updatedLoan] = await tx
        .update(companyLoans)
        .set({
          personalLiabilityId: liability.id,
          metadata: {
            disbursementAccountId: accountId,
            disbursementTransactionId: transaction.id,
          },
        })
        .where(
          and(
            eq(companyLoans.id, loan.id),
            eq(companyLoans.workspaceId, workspaceId),
          ),
        )
        .returning()
      return {
        loan: updatedLoan,
        liability,
        transaction,
      }
    })
    res.status(201).json(result)
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.get('/company/loans/:id/payments', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(req, workspaceId)
    const rows = await db
      .select()
      .from(companyLoanPayments)
      .where(
        and(
          eq(companyLoanPayments.workspaceId, workspaceId),
          eq(companyLoanPayments.loanId, req.params.id),
        ),
      )
      .orderBy(
        desc(companyLoanPayments.paymentDate),
        desc(companyLoanPayments.createdAt),
      )
    res.json(rows)
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.post('/company/loans/:id/payments', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    const { userId } =
      await requireCompanyFinanceAccess(req, workspaceId)
    const paymentAmount = money(req.body.amount, 'amount')
    const principalAmount =
      req.body.principalAmount == null
        ? Number(paymentAmount)
        : money(req.body.principalAmount, 'principalAmount')
    const interestAmount =
      req.body.interestAmount == null
        ? 0
        : money(req.body.interestAmount, 'interestAmount')
    if (
      Number(principalAmount) +
        Number(interestAmount) >
      Number(paymentAmount) + 0.01
    ) {
      throw new Error(
        'Principal plus interest cannot exceed payment amount',
      )
    }
    const paymentDate = req.body.paymentDate
      ? String(req.body.paymentDate)
      : new Date().toISOString().slice(0, 10)
    const accountId = String(
      req.body.accountId || '',
    ).trim()
    if (!accountId) {
      throw new Error('accountId is required')
    }
    const result = await db.transaction(async (tx: any) => {
      const [loan] = await tx
        .select()
        .from(companyLoans)
        .where(
          and(
            eq(companyLoans.id, req.params.id),
            eq(companyLoans.workspaceId, workspaceId),
          ),
        )
        .limit(1)
      if (!loan) {
        throw new Error('Company loan not found')
      }
      if (!loan.personalLiabilityId) {
        throw new Error(
          'Company loan is not linked to a Personal Finance liability',
        )
      }
      if (loan.status !== 'active') {
        throw new Error('Loan is not open for repayment')
      }
      if (
        Number(principalAmount) >
        Number(loan.currentBalance)
      ) {
        throw new Error(
          'Principal payment cannot exceed the remaining loan balance',
        )
      }
      const [account] = await tx
        .select()
        .from(companyFinanceAccounts)
        .where(
          and(
            eq(companyFinanceAccounts.id, accountId),
            eq(companyFinanceAccounts.workspaceId, workspaceId),
          ),
        )
        .limit(1)
      if (!account) {
        throw new Error('Company finance account not found')
      }
      const [liability] = await tx
        .select()
        .from(personalLiabilities)
        .where(
          and(
            eq(personalLiabilities.id, loan.personalLiabilityId),
            eq(
              personalLiabilities.userId,
              loan.borrowerUserId,
            ),
          ),
        )
        .limit(1)
      if (!liability) {
        throw new Error(
          'Linked Personal Finance liability not found',
        )
      }
      if (
        Number(principalAmount) >
        Number(liability.currentBalance)
      ) {
        throw new Error(
          'Principal payment exceeds the linked Personal Finance balance',
        )
      }
      const balanceAfter = Math.max(
        0,
        Number(loan.currentBalance) -
          Number(principalAmount),
      )
      const liabilityBalanceAfter = Math.max(
        0,
        Number(liability.currentBalance) -
          Number(principalAmount),
      )
      const newStatus =
        balanceAfter <= 0.009
          ? 'paid_off'
          : 'active'
      const newLiabilityStatus =
        liabilityBalanceAfter <= 0.009
          ? 'inactive'
          : 'active'
      const [payment] = await tx
        .insert(companyLoanPayments)
        .values({
          workspaceId,
          loanId: loan.id,
          borrowerUserId: loan.borrowerUserId,
          paymentDate,
          amount: paymentAmount,
          principalAmount: String(
            Number(principalAmount).toFixed(2),
          ),
          interestAmount: String(
            Number(interestAmount).toFixed(2),
          ),
          balanceAfter: balanceAfter.toFixed(2),
          paymentMethod: req.body.paymentMethod
            ? String(req.body.paymentMethod)
            : null,
          reference: req.body.reference
            ? String(req.body.reference)
            : null,
          notes: req.body.notes
            ? String(req.body.notes)
            : null,
          recordedByUserId: userId,
        })
        .returning()
      const [transaction] = await tx
        .insert(companyFinanceTransactions)
        .values({
          workspaceId,
          accountId,
          transactionType: 'income',
          category: 'company_loan_repayment',
          description:
            `Loan repayment - ${loan.loanNumber} - ${loan.borrowerName}`,
          amount: paymentAmount,
          transactionDate: paymentDate,
          reference: loan.loanNumber,
          createdByUserId: userId,
          status: 'posted',
          metadata: {
            loanId: loan.id,
            loanPaymentId: payment.id,
            borrowerUserId: loan.borrowerUserId,
          },
        })
        .returning()
      await tx
        .update(companyFinanceAccounts)
        .set({
          currentBalance: String(
            (
              Number(account.currentBalance) +
              Number(paymentAmount)
            ).toFixed(2),
          ),
        })
        .where(
          and(
            eq(companyFinanceAccounts.id, accountId),
            eq(companyFinanceAccounts.workspaceId, workspaceId),
          ),
        )
      await tx
        .update(companyLoans)
        .set({
          currentBalance: balanceAfter.toFixed(2),
          status: newStatus,
        })
        .where(
          and(
            eq(companyLoans.id, loan.id),
            eq(companyLoans.workspaceId, workspaceId),
          ),
        )
      await tx
        .update(personalLiabilities)
        .set({
          currentBalance: liabilityBalanceAfter.toFixed(2),
          status: newLiabilityStatus,
        })
        .where(
          and(
            eq(personalLiabilities.id, liability.id),
            eq(
              personalLiabilities.userId,
              loan.borrowerUserId,
            ),
          ),
        )
      await tx.insert(personalDebtPayments).values({
        userId: loan.borrowerUserId,
        liabilityId: liability.id,
        paymentDate,
        amount: paymentAmount,
        principalAmount: String(
          Number(principalAmount).toFixed(2),
        ),
        interestAmount: String(
          Number(interestAmount).toFixed(2),
        ),
        balanceAfter: liabilityBalanceAfter.toFixed(2),
        notes: `Company loan payment ${payment.id}`,
      })
      return {
        payment,
        loanBalance: balanceAfter.toFixed(2),
        personalLiabilityBalance:
          liabilityBalanceAfter.toFixed(2),
        loanStatus: newStatus,
        personalLiabilityStatus:
          newLiabilityStatus,
        transaction,
      }
    })
    res.status(201).json(result)
  } catch (error) {
    handleRouteError(res, error)
  }
})
// COMPANY TRANSACTIONS
// ============================================================
router.post('/company/transactions', async (req, res) => {
  try {
    const workspaceId = workspaceIdFromRequest(req)
    const { userId } =
      await requireCompanyFinanceAccess(
        req,
        workspaceId,
      )
    const accountId = String(req.body.accountId || '').trim()
    if (!accountId) {
      throw new Error('accountId is required')
    }
    const amount = money(req.body.amount, 'amount')
    const transactionType = requiredText(req.body.transactionType, 'transactionType')
    if (!['income', 'adjustment'].includes(transactionType)) {
      throw new Error('Invalid company transaction type')
    }
    const description = requiredText(req.body.description, 'description')
    const transactionDate =
      req.body.transactionDate
        ? String(req.body.transactionDate)
        : new Date().toISOString().slice(0, 10)
    const category =
      req.body.category
        ? String(req.body.category)
        : null
    const reference =
      req.body.reference
        ? String(req.body.reference)
        : null
    const projectId =
      req.body.projectId
        ? String(req.body.projectId)
        : null
    const clientId =
      req.body.clientId
        ? String(req.body.clientId)
        : null
    const result =
      await db.transaction(async (tx: any) => {
        const [account] =
          await tx
            .select()
            .from(companyFinanceAccounts)
            .where(
              and(
                eq(
                  companyFinanceAccounts.id,
                  accountId,
                ),
                eq(
                  companyFinanceAccounts.workspaceId,
                  workspaceId,
                ),
              ),
            )
            .limit(1)
        if (!account) {
          throw new Error('Company finance account not found')
        }
        const [transaction] =
          await tx
            .insert(companyFinanceTransactions)
            .values({
              workspaceId,
              accountId,
              transactionType,
              category,
              description,
              amount,
              transactionDate,
              reference,
              projectId,
              clientId,
              createdByUserId: userId,
              status: 'posted',
              metadata: {},
            })
            .returning()
        if (transactionType === 'income') {
          await tx
            .update(companyFinanceAccounts)
            .set({
              currentBalance:
                String(
                  Number(account.currentBalance) +
                    Number(amount),
                ),
            })
            .where(
              and(
                eq(
                  companyFinanceAccounts.id,
                  accountId,
                ),
                eq(
                  companyFinanceAccounts.workspaceId,
                  workspaceId,
                ),
              ),
            )
        }
        return transaction
      })
    res.status(201).json(result)
  } catch (error) {
    handleRouteError(res, error)
  }
})
// COMPANY EXPENSES
// ============================================================
router.get('/company/expenses', async (req, res) => {
  try {
    const workspaceId =
      workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(
      req,
      workspaceId,
    )
    res.json(
      await db
        .select()
        .from(financeExpenses)
        .where(
          eq(
            financeExpenses.workspaceId,
            workspaceId,
          ),
        )
        .orderBy(
          desc(financeExpenses.expenseDate),
          desc(financeExpenses.createdAt),
        ),
    )
  } catch (error) {
    handleRouteError(res, error)
  }
})
router.post('/company/expenses', async (req, res) => {
  try {
    const workspaceId =
      workspaceIdFromRequest(req)
    const { userId } =
      await requireCompanyFinanceAccess(
        req,
        workspaceId,
      )
    const [expense] = await db
      .insert(financeExpenses)
      .values({
        workspaceId,
        employeeUserId: userId,
        projectId: req.body.projectId
          ? String(req.body.projectId)
          : null,
        category: requiredText(
          req.body.category,
          'category',
        ),
        description: requiredText(
          req.body.description,
          'description',
        ),
        amount: money(
          req.body.amount,
          'amount',
        ),
        currency: String(
          req.body.currency || 'USD',
        ),
        expenseDate: String(
          req.body.expenseDate ||
            new Date()
              .toISOString()
              .slice(0, 10),
        ),
        receiptFilePath:
          req.body.receiptFilePath
            ? String(
                req.body.receiptFilePath,
              )
            : null,
        status: 'submitted',
        notes: req.body.notes
          ? String(req.body.notes)
          : null,
      })
      .returning()
    res.status(201).json(expense)
  } catch (error) {
    handleRouteError(res, error)
  }
})
// ============================================================
// COMPANY INVOICES
// ============================================================
router.get('/company/invoices', async (req, res) => {
  try {
    const workspaceId =
      workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(
      req,
      workspaceId,
    )
    res.json(
      await db
        .select()
        .from(financeInvoices)
        .where(
          eq(
            financeInvoices.workspaceId,
            workspaceId,
          ),
        )
        .orderBy(
          desc(financeInvoices.issueDate),
          desc(financeInvoices.createdAt),
        ),
    )
  } catch (error) {
    handleRouteError(res, error)
  }
})
// ============================================================
// COMPANY PAYMENTS
// ============================================================
router.get('/company/payments', async (req, res) => {
  try {
    const workspaceId =
      workspaceIdFromRequest(req)
    await requireCompanyFinanceAccess(
      req,
      workspaceId,
    )
    res.json(
      await db
        .select()
        .from(financePayments)
        .where(
          eq(
            financePayments.workspaceId,
            workspaceId,
          ),
        )
        .orderBy(
          desc(financePayments.paymentDate),
          desc(financePayments.createdAt),
        ),
    )
  } catch (error) {
    handleRouteError(res, error)
  }
})
// ============================================================
// COMPANY RECONCILIATIONS
// ============================================================
router.get(
  '/company/reconciliations',
  async (req, res) => {
    try {
      const workspaceId =
        workspaceIdFromRequest(req)
      await requireCompanyFinanceAccess(
        req,
        workspaceId,
      )
      res.json(
        await db
          .select()
          .from(financeReconciliations)
          .where(
            eq(
              financeReconciliations.workspaceId,
              workspaceId,
            ),
          )
          .orderBy(
            desc(
              financeReconciliations.periodEnd,
            ),
            desc(
              financeReconciliations.createdAt,
            ),
          ),
      )
    } catch (error) {
      handleRouteError(res, error)
    }
  },
)
// ============================================================
// COMPANY FINANCE TASKS
// ============================================================
router.get('/company/tasks', async (req, res) => {
  try {
    const workspaceId =
      workspaceIdFromRequest(req)
    const { userId } =
      await requireCompanyFinanceAccess(
        req,
        workspaceId,
      )
    const rows = await db
      .select()
      .from(financeTasks)
      .where(
        and(
          eq(
            financeTasks.workspaceId,
            workspaceId,
          ),
          or(
            eq(
              financeTasks.assignedToUserId,
              userId,
            ),
            eq(
              financeTasks.assignedToUserId,
              '',
            ),
          ),
        ),
      )
      .orderBy(
        desc(financeTasks.createdAt),
      )
    res.json(rows)
  } catch (error) {
    handleRouteError(res, error)
  }
})
export { router as financeRoutes }
