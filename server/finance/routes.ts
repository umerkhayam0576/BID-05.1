import { and, desc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db'
import { financeAccounts, financeBudgets, financeGoals, financeRecurringRules, financeTransactions } from '../db/schema'
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

export { router as financeRoutes }
