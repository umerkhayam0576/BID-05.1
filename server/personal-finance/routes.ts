import { and, desc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db'
import { personalAccounts, personalTransactions, personalAssets, personalLiabilities } from '../db/app-schema'
import { getAuthenticatedUserId } from '../auth/middleware'

const router = Router()

router.get('/summary', async (req, res) => {
  const currentUserId = userId(req)
  const [accounts, transactions, assets, liabilities] = await Promise.all([
    db.select().from(personalAccounts).where(and(eq(personalAccounts.userId, currentUserId), eq(personalAccounts.status, 'active'))),
    db.select().from(personalTransactions).where(eq(personalTransactions.userId, currentUserId)),
    db.select().from(personalAssets).where(and(eq(personalAssets.userId, currentUserId), eq(personalAssets.status, 'active'))),
    db.select().from(personalLiabilities).where(and(eq(personalLiabilities.userId, currentUserId), eq(personalLiabilities.status, 'active'))),
  ])

  const openingBalance = accounts.reduce((total, account) => total + Number(account.openingBalance), 0)
  const income = transactions
    .filter((transaction) => transaction.transactionType === 'income')
    .reduce((total, transaction) => total + Number(transaction.amount), 0)
  const expenses = transactions
    .filter((transaction) => transaction.transactionType === 'expense')
    .reduce((total, transaction) => total + Number(transaction.amount), 0)
  const cashBalance = openingBalance + income - expenses
  const assetTotal = assets.reduce((total, asset) => total + Number(asset.currentValue), 0)
  const liabilityTotal = liabilities.reduce((total, liability) => total + Number(liability.currentBalance), 0)

  res.json({
    cashBalance: cashBalance.toFixed(2),
    income: income.toFixed(2),
    expenses: expenses.toFixed(2),
    assetTotal: assetTotal.toFixed(2),
    liabilityTotal: liabilityTotal.toFixed(2),
    netWorth: (cashBalance + assetTotal - liabilityTotal).toFixed(2),
    accountCount: accounts.length,
    assetCount: assets.length,
    liabilityCount: liabilities.length,
  })
})

function userId(req: Parameters<typeof getAuthenticatedUserId>[0]) {
  return getAuthenticatedUserId(req)
}

function textValue(value: unknown, field: string) {
  const valueText = typeof value === 'string' ? value.trim() : ''
  if (!valueText) throw new Error(field + ' is required')
  return valueText
}

function amount(value: unknown, field: string) {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue < 0) throw new Error(field + ' must be a valid non-negative amount')
  return numberValue.toFixed(2)
}

router.get('/accounts', async (req, res) => {
  const rows = await db.select().from(personalAccounts).where(and(eq(personalAccounts.userId, userId(req)), eq(personalAccounts.status, 'active')))
  res.json(rows)
})

router.post('/accounts', async (req, res) => {
  try {
    const [account] = await db.insert(personalAccounts).values({
      userId: userId(req),
      name: textValue(req.body?.name, 'name'),
      accountType: typeof req.body?.accountType === 'string' ? req.body.accountType : 'cash',
      currency: typeof req.body?.currency === 'string' ? req.body.currency : 'USD',
      openingBalance: amount(req.body?.openingBalance ?? 0, 'openingBalance'),
    }).returning()
    res.status(201).json(account)
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create account' })
  }
})

router.get('/transactions', async (req, res) => {
  const rows = await db.select().from(personalTransactions)
    .where(eq(personalTransactions.userId, userId(req)))
    .orderBy(desc(personalTransactions.transactionDate), desc(personalTransactions.id))
  res.json(rows)
})

router.post('/transactions', async (req, res) => {
  try {
    const currentUserId = userId(req)
    const accountId = textValue(req.body?.accountId, 'accountId')
    const [account] = await db.select({ id: personalAccounts.id })
      .from(personalAccounts)
      .where(and(
        eq(personalAccounts.id, accountId),
        eq(personalAccounts.userId, currentUserId),
        eq(personalAccounts.status, 'active'),
      ))
      .limit(1)

    if (!account) {
      return res.status(403).json({ error: 'Personal account access denied' })
    }

    const [transaction] = await db.insert(personalTransactions).values({
      userId: currentUserId,
      accountId,
      transactionType: textValue(req.body?.transactionType, 'transactionType'),
      category: typeof req.body?.category === 'string' ? req.body.category : null,
      description: typeof req.body?.description === 'string' ? req.body.description : null,
      amount: amount(req.body?.amount, 'amount'),
      transactionDate: textValue(req.body?.transactionDate, 'transactionDate'),
      notes: typeof req.body?.notes === 'string' ? req.body.notes : null,
    }).returning()
    res.status(201).json(transaction)
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create transaction' })
  }
})

router.get('/assets', async (req, res) => {
  res.json(await db.select().from(personalAssets).where(and(eq(personalAssets.userId, userId(req)), eq(personalAssets.status, 'active'))))
})

router.post('/assets', async (req, res) => {
  try {
    const [asset] = await db.insert(personalAssets).values({
      userId: userId(req),
      name: textValue(req.body?.name, 'name'),
      assetType: textValue(req.body?.assetType, 'assetType'),
      currentValue: amount(req.body?.currentValue ?? 0, 'currentValue'),
      currency: typeof req.body?.currency === 'string' ? req.body.currency : 'USD',
      notes: typeof req.body?.notes === 'string' ? req.body.notes : null,
    }).returning()
    res.status(201).json(asset)
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create asset' })
  }
})

router.get('/liabilities', async (req, res) => {
  res.json(await db.select().from(personalLiabilities).where(and(eq(personalLiabilities.userId, userId(req)), eq(personalLiabilities.status, 'active'))))
})

router.post('/liabilities', async (req, res) => {
  try {
    const [liability] = await db.insert(personalLiabilities).values({
      userId: userId(req),
      name: textValue(req.body?.name, 'name'),
      liabilityType: textValue(req.body?.liabilityType, 'liabilityType'),
      currentBalance: amount(req.body?.currentBalance ?? 0, 'currentBalance'),
      currency: typeof req.body?.currency === 'string' ? req.body.currency : 'USD',
      notes: typeof req.body?.notes === 'string' ? req.body.notes : null,
    }).returning()
    res.status(201).json(liability)
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create liability' })
  }
})

export { router as personalFinanceRoutes }
