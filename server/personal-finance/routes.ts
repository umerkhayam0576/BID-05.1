import { and, desc, eq } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db'
import { personalAccounts, personalTransactions, personalAssets, personalLiabilities, personalDebtPayments, personalProperties } from '../db/app-schema'
import { getAuthenticatedUserId } from '../auth/middleware'

const router = Router()

router.get('/summary', async (req, res) => {
  const currentUserId = userId(req)
  await syncAllPropertyRentalIncome(currentUserId)
  const [accounts, transactions, assets, liabilities, properties] = await Promise.all([
    db.select().from(personalAccounts).where(and(eq(personalAccounts.userId, currentUserId), eq(personalAccounts.status, 'active'))),
    db.select().from(personalTransactions).where(eq(personalTransactions.userId, currentUserId)),
    db.select().from(personalAssets).where(and(eq(personalAssets.userId, currentUserId), eq(personalAssets.status, 'active'))),
    db.select().from(personalLiabilities).where(and(eq(personalLiabilities.userId, currentUserId), eq(personalLiabilities.status, 'active'))),
    db.select().from(personalProperties).where(and(eq(personalProperties.userId, currentUserId), eq(personalProperties.status, 'active'))),
  ])
  let openingBalance = 0
  for (const account of accounts) openingBalance += Number(account.openingBalance)
  let income = 0
  let expenses = 0
  for (const transaction of transactions) {
    if (transaction.transactionType === 'income') income += Number(transaction.amount)
    if (transaction.transactionType === 'expense') expenses += Number(transaction.amount)
  }
  const cashBalance = openingBalance + income - expenses
  let assetTotal = 0
  for (const asset of assets) assetTotal += Number(asset.currentValue)
  for (const property of properties) assetTotal += Number(property.currentValue)
  let liabilityTotal = 0
  for (const liability of liabilities) liabilityTotal += Number(liability.currentBalance)
  for (const property of properties) liabilityTotal += Number(property.mortgageBalance)
  res.json({
    cashBalance: cashBalance.toFixed(2), income: income.toFixed(2), expenses: expenses.toFixed(2),
    assetTotal: assetTotal.toFixed(2), liabilityTotal: liabilityTotal.toFixed(2),
    netWorth: (cashBalance + assetTotal - liabilityTotal).toFixed(2),
    accountCount: accounts.length, assetCount: assets.length + properties.length, liabilityCount: liabilities.length + properties .filter((property: typeof personalProperties.$inferSelect) => Number(property.mortgageBalance) > 0).length, propertyCount: properties.length,
  })
})

function userId(req: Parameters<typeof getAuthenticatedUserId>[0]) { return getAuthenticatedUserId(req) }
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

async function syncAllPropertyRentalIncome(currentUserId: string) {
  const properties = await db.select().from(personalProperties).where(and(
    eq(personalProperties.userId, currentUserId),
    eq(personalProperties.status, 'active'),
  ))
  for (const property of properties) await syncPropertyRentalIncome(property)
}

async function syncPropertyRentalIncome(property: typeof personalProperties.$inferSelect) {
  const monthlyAmount = Number(property.rentalIncome)
  const monthStart = new Date().toISOString().slice(0, 7) + '-01'
  const existing = await db.select().from(personalTransactions).where(and(
    eq(personalTransactions.userId, property.userId),
    eq(personalTransactions.sourceType, 'property-rental'),
    eq(personalTransactions.sourceId, property.id),
    eq(personalTransactions.transactionDate, monthStart),
  )).limit(1)

  if (monthlyAmount <= 0) {
    if (existing[0]) await db.delete(personalTransactions).where(eq(personalTransactions.id, existing[0].id))
    return
  }

  const [account] = await db.select().from(personalAccounts).where(and(
    eq(personalAccounts.userId, property.userId),
    eq(personalAccounts.status, 'active'),
  )).orderBy(desc(personalAccounts.createdAt)).limit(1)
  if (!account) return

  if (existing[0]) {
    await db.update(personalTransactions).set({
      accountId: account.id,
      transactionType: 'income',
      category: 'Rental Income',
      description: property.name + ' rental income',
      amount: monthlyAmount.toFixed(2),
    }).where(eq(personalTransactions.id, existing[0].id))
    return
  }

  await db.insert(personalTransactions).values({
    userId: property.userId,
    accountId: account.id,
    transactionType: 'income',
    category: 'Rental Income',
    description: property.name + ' rental income',
    amount: monthlyAmount.toFixed(2),
    transactionDate: monthStart,
    notes: 'Automatically linked to the property rental income setting.',
    sourceType: 'property-rental',
    sourceId: property.id,
  })
}

router.get('/accounts', async (req, res) => {
  const rows = await db.select().from(personalAccounts).where(and(eq(personalAccounts.userId, userId(req)), eq(personalAccounts.status, 'active')))
  res.json(rows)
})
router.post('/accounts', async (req, res) => {
  try {
    const [account] = await db.insert(personalAccounts).values({
      userId: userId(req), name: textValue(req.body?.name, 'name'),
      accountType: typeof req.body?.accountType === 'string' ? req.body.accountType : 'cash',
      currency: typeof req.body?.currency === 'string' ? req.body.currency.trim().toUpperCase() : 'USD',
      openingBalance: amount(req.body?.openingBalance ?? 0, 'openingBalance'),
    }).returning()
    res.status(201).json(account)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create account' }) }
})
router.put('/accounts/:id', async (req, res) => {
  try {
    const currentUserId = userId(req)
    const [account] = await db.update(personalAccounts).set({
      name: textValue(req.body?.name, 'name'),
      accountType: typeof req.body?.accountType === 'string' ? req.body.accountType : 'cash',
      currency: typeof req.body?.currency === 'string' ? req.body.currency.trim().toUpperCase() : 'USD',
      openingBalance: amount(req.body?.openingBalance ?? 0, 'openingBalance'),
    }).where(and(eq(personalAccounts.id, req.params.id), eq(personalAccounts.userId, currentUserId), eq(personalAccounts.status, 'active'))).returning()
    if (!account) return res.status(404).json({ error: 'Personal account not found' })
    res.json(account)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update account' }) }
})
router.delete('/accounts/:id', async (req, res) => {
  const [account] = await db.update(personalAccounts).set({ status: 'inactive' })
    .where(and(eq(personalAccounts.id, req.params.id), eq(personalAccounts.userId, userId(req)), eq(personalAccounts.status, 'active'))).returning({ id: personalAccounts.id })
  if (!account) return res.status(404).json({ error: 'Personal account not found' })
  res.json({ ok: true })
})

router.get('/transactions', async (req, res) => {
  await syncAllPropertyRentalIncome(userId(req))
  const rows = await db.select().from(personalTransactions).where(eq(personalTransactions.userId, userId(req))).orderBy(desc(personalTransactions.transactionDate), desc(personalTransactions.id))
  res.json(rows)
})
async function accountBelongsToUser(accountId: string, currentUserId: string) {
  const [account] = await db.select({ id: personalAccounts.id }).from(personalAccounts)
    .where(and(eq(personalAccounts.id, accountId), eq(personalAccounts.userId, currentUserId), eq(personalAccounts.status, 'active'))).limit(1)
  return Boolean(account)
}
router.post('/transactions', async (req, res) => {
  try {
    const currentUserId = userId(req), accountId = textValue(req.body?.accountId, 'accountId')
    if (!(await accountBelongsToUser(accountId, currentUserId))) return res.status(403).json({ error: 'Personal account access denied' })
    const transactionType = textValue(req.body?.transactionType, 'transactionType')
    if (!['income', 'expense'].includes(transactionType)) return res.status(400).json({ error: 'transactionType must be income or expense' })
    const [transaction] = await db.insert(personalTransactions).values({
      userId: currentUserId, accountId, transactionType,
      category: typeof req.body?.category === 'string' ? req.body.category : null,
      description: typeof req.body?.description === 'string' ? req.body.description : null,
      amount: amount(req.body?.amount, 'amount'), transactionDate: textValue(req.body?.transactionDate, 'transactionDate'),
      notes: typeof req.body?.notes === 'string' ? req.body.notes : null,
    }).returning()
    res.status(201).json(transaction)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create transaction' }) }
})
router.put('/transactions/:id', async (req, res) => {
  try {
    const currentUserId = userId(req), accountId = textValue(req.body?.accountId, 'accountId')
    if (!(await accountBelongsToUser(accountId, currentUserId))) return res.status(403).json({ error: 'Personal account access denied' })
    const transactionType = textValue(req.body?.transactionType, 'transactionType')
    if (!['income', 'expense'].includes(transactionType)) return res.status(400).json({ error: 'transactionType must be income or expense' })
    const [transaction] = await db.update(personalTransactions).set({
      accountId, transactionType,
      category: typeof req.body?.category === 'string' ? req.body.category : null,
      description: typeof req.body?.description === 'string' ? req.body.description : null,
      amount: amount(req.body?.amount, 'amount'), transactionDate: textValue(req.body?.transactionDate, 'transactionDate'),
      notes: typeof req.body?.notes === 'string' ? req.body.notes : null,
    }).where(and(eq(personalTransactions.id, req.params.id), eq(personalTransactions.userId, currentUserId))).returning()
    if (!transaction) return res.status(404).json({ error: 'Personal transaction not found' })
    res.json(transaction)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update transaction' }) }
})
router.delete('/transactions/:id', async (req, res) => {
  const [transaction] = await db.delete(personalTransactions).where(and(eq(personalTransactions.id, req.params.id), eq(personalTransactions.userId, userId(req)))).returning({ id: personalTransactions.id })
  if (!transaction) return res.status(404).json({ error: 'Personal transaction not found' })
  res.json({ ok: true })
})

router.get('/assets', async (req, res) => {
  res.json(await db.select().from(personalAssets).where(and(eq(personalAssets.userId, userId(req)), eq(personalAssets.status, 'active'))))
})
router.post('/assets', async (req, res) => {
  try {
    const [asset] = await db.insert(personalAssets).values({
      userId: userId(req), name: textValue(req.body?.name, 'name'), assetType: textValue(req.body?.assetType, 'assetType'),
      currentValue: amount(req.body?.currentValue ?? 0, 'currentValue'),
      currency: typeof req.body?.currency === 'string' ? req.body.currency.trim().toUpperCase() : 'USD',
      notes: typeof req.body?.notes === 'string' ? req.body.notes : null,
    }).returning()
    res.status(201).json(asset)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create asset' }) }
})
router.put('/assets/:id', async (req, res) => {
  try {
    const [asset] = await db.update(personalAssets).set({
      name: textValue(req.body?.name, 'name'), assetType: textValue(req.body?.assetType, 'assetType'),
      currentValue: amount(req.body?.currentValue ?? 0, 'currentValue'),
      currency: typeof req.body?.currency === 'string' ? req.body.currency.trim().toUpperCase() : 'USD',
      notes: typeof req.body?.notes === 'string' ? req.body.notes : null,
    }).where(and(eq(personalAssets.id, req.params.id), eq(personalAssets.userId, userId(req)), eq(personalAssets.status, 'active'))).returning()
    if (!asset) return res.status(404).json({ error: 'Personal asset not found' })
    res.json(asset)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update asset' }) }
})
router.delete('/assets/:id', async (req, res) => {
  const [asset] = await db.update(personalAssets).set({ status: 'inactive' }).where(and(eq(personalAssets.id, req.params.id), eq(personalAssets.userId, userId(req)), eq(personalAssets.status, 'active'))).returning({ id: personalAssets.id })
  if (!asset) return res.status(404).json({ error: 'Personal asset not found' })
  res.json({ ok: true })
})

router.get('/liabilities', async (req, res) => {
  const currentUserId = userId(req)
  const [liabilities, properties] = await Promise.all([
    db.select().from(personalLiabilities).where(and(eq(personalLiabilities.userId, currentUserId), eq(personalLiabilities.status, 'active'))),
    db.select().from(personalProperties).where(and(eq(personalProperties.userId, currentUserId), eq(personalProperties.status, 'active'))),
  ])
  const propertyMortgages = properties
    .filter((property: typeof personalProperties.$inferSelect) => Number(property.mortgageBalance) > 0)
    .map((property: typeof personalProperties.$inferSelect) => ({
      id: 'property-mortgage:' + property.id,
      userId: currentUserId,
      name: property.name + ' Mortgage',
      liabilityType: 'mortgage',
      currentBalance: property.mortgageBalance,
      currency: property.currency,
      status: 'linked-property',
      notes: 'Automatically linked to Real Estate & Property. Manage this mortgage from the property record.',
      originalBalance: property.mortgageBalance,
      interestRate: '0',
      paymentAmount: property.monthlyPayment,
      paymentFrequency: 'monthly',
      nextPaymentDate: null,
      startDate: property.purchaseDate,
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    }))
  res.json([...propertyMortgages, ...liabilities])
})
router.get('/liabilities/:id/payments', async (req, res) => {
  const currentUserId = userId(req)
  const rows = await db.select().from(personalDebtPayments)
    .where(and(eq(personalDebtPayments.userId, currentUserId), eq(personalDebtPayments.liabilityId, req.params.id)))
    .orderBy(desc(personalDebtPayments.paymentDate), desc(personalDebtPayments.createdAt))
  res.json(rows)
})

router.post('/liabilities/:id/payments', async (req, res) => {
  try {
    const currentUserId = userId(req)
    const paymentAmount = Number(req.body?.amount)
    const paymentDate = typeof req.body?.paymentDate === 'string' && req.body.paymentDate ? req.body.paymentDate : new Date().toISOString().slice(0, 10)
    const principalAmount = Number(req.body?.principalAmount ?? paymentAmount)
    const interestAmount = Number(req.body?.interestAmount ?? 0)
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) throw new Error('Payment amount must be greater than zero')
    if (!Number.isFinite(principalAmount) || principalAmount < 0 || principalAmount > paymentAmount) throw new Error('Principal amount must be between zero and payment amount')
    if (!Number.isFinite(interestAmount) || interestAmount < 0 || principalAmount + interestAmount > paymentAmount + 0.01) throw new Error('Interest amount is invalid')

    const linkedPropertyId = req.params.id.startsWith('property-mortgage:') ? req.params.id.slice('property-mortgage:'.length) : null
    let currentBalance = 0
    if (linkedPropertyId) {
      const [property] = await db.select().from(personalProperties).where(and(
        eq(personalProperties.id, linkedPropertyId),
        eq(personalProperties.userId, currentUserId),
        eq(personalProperties.status, 'active'),
      )).limit(1)
      if (!property) return res.status(404).json({ error: 'Linked property mortgage not found' })
      currentBalance = Number(property.mortgageBalance)
      if (principalAmount > currentBalance) throw new Error('Principal payment cannot exceed the remaining mortgage balance')
      const balanceAfter = Math.max(0, currentBalance - principalAmount)
      await db.update(personalProperties).set({ mortgageBalance: balanceAfter.toFixed(2) })
        .where(and(eq(personalProperties.id, linkedPropertyId), eq(personalProperties.userId, currentUserId)))
      const [payment] = await db.insert(personalDebtPayments).values({
        userId: currentUserId, liabilityId: req.params.id, paymentDate,
        amount: paymentAmount.toFixed(2), principalAmount: principalAmount.toFixed(2),
        interestAmount: interestAmount.toFixed(2), balanceAfter: balanceAfter.toFixed(2),
        notes: typeof req.body?.notes === 'string' ? req.body.notes.trim() || null : null,
      }).returning()
      return res.status(201).json(payment)
    }

    const [liability] = await db.select().from(personalLiabilities).where(and(
      eq(personalLiabilities.id, req.params.id),
      eq(personalLiabilities.userId, currentUserId),
      eq(personalLiabilities.status, 'active'),
    )).limit(1)
    if (!liability) return res.status(404).json({ error: 'Personal liability not found' })
    currentBalance = Number(liability.currentBalance)
    if (principalAmount > currentBalance) throw new Error('Principal payment cannot exceed the remaining balance')
    const balanceAfter = Math.max(0, currentBalance - principalAmount)
    await db.update(personalLiabilities).set({ currentBalance: balanceAfter.toFixed(2) })
      .where(and(eq(personalLiabilities.id, req.params.id), eq(personalLiabilities.userId, currentUserId), eq(personalLiabilities.status, 'active')))
    const [payment] = await db.insert(personalDebtPayments).values({
      userId: currentUserId, liabilityId: req.params.id, paymentDate,
      amount: paymentAmount.toFixed(2), principalAmount: principalAmount.toFixed(2),
      interestAmount: interestAmount.toFixed(2), balanceAfter: balanceAfter.toFixed(2),
      notes: typeof req.body?.notes === 'string' ? req.body.notes.trim() || null : null,
    }).returning()
    res.status(201).json(payment)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to record payment' }) }
})

router.post('/liabilities', async (req, res) => {
  try {
    const [liability] = await db.insert(personalLiabilities).values({
      userId: userId(req), name: textValue(req.body?.name, 'name'), liabilityType: textValue(req.body?.liabilityType, 'liabilityType'),
      currentBalance: amount(req.body?.currentBalance ?? 0, 'currentBalance'),
      originalBalance: amount(req.body?.originalBalance ?? req.body?.currentBalance ?? 0, 'originalBalance'),
      interestRate: amount(req.body?.interestRate ?? 0, 'interestRate'),
      paymentAmount: amount(req.body?.paymentAmount ?? 0, 'paymentAmount'),
      paymentFrequency: typeof req.body?.paymentFrequency === 'string' ? req.body.paymentFrequency : 'monthly',
      nextPaymentDate: typeof req.body?.nextPaymentDate === 'string' && req.body.nextPaymentDate ? req.body.nextPaymentDate : null,
      startDate: typeof req.body?.startDate === 'string' && req.body.startDate ? req.body.startDate : null,
      currency: typeof req.body?.currency === 'string' ? req.body.currency.trim().toUpperCase() : 'USD',
      notes: typeof req.body?.notes === 'string' ? req.body.notes : null,
    }).returning()
    res.status(201).json(liability)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create liability' }) }
})
router.put('/liabilities/:id', async (req, res) => {
  try {
    const [liability] = await db.update(personalLiabilities).set({
      name: textValue(req.body?.name, 'name'), liabilityType: textValue(req.body?.liabilityType, 'liabilityType'),
      currentBalance: amount(req.body?.currentBalance ?? 0, 'currentBalance'),
      originalBalance: amount(req.body?.originalBalance ?? req.body?.currentBalance ?? 0, 'originalBalance'),
      interestRate: amount(req.body?.interestRate ?? 0, 'interestRate'),
      paymentAmount: amount(req.body?.paymentAmount ?? 0, 'paymentAmount'),
      paymentFrequency: typeof req.body?.paymentFrequency === 'string' ? req.body.paymentFrequency : 'monthly',
      nextPaymentDate: typeof req.body?.nextPaymentDate === 'string' && req.body.nextPaymentDate ? req.body.nextPaymentDate : null,
      startDate: typeof req.body?.startDate === 'string' && req.body.startDate ? req.body.startDate : null,
      currency: typeof req.body?.currency === 'string' ? req.body.currency.trim().toUpperCase() : 'USD',
      notes: typeof req.body?.notes === 'string' ? req.body.notes : null,
    }).where(and(eq(personalLiabilities.id, req.params.id), eq(personalLiabilities.userId, userId(req)), eq(personalLiabilities.status, 'active'))).returning()
    if (!liability) return res.status(404).json({ error: 'Personal liability not found' })
    res.json(liability)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update liability' }) }
})
router.delete('/liabilities/:id', async (req, res) => {
  const [liability] = await db.update(personalLiabilities).set({ status: 'inactive' }).where(and(eq(personalLiabilities.id, req.params.id), eq(personalLiabilities.userId, userId(req)), eq(personalLiabilities.status, 'active'))).returning({ id: personalLiabilities.id })
  if (!liability) return res.status(404).json({ error: 'Personal liability not found' })
  res.json({ ok: true })
})


router.get('/properties', async (req, res) => {
  res.json(await db.select().from(personalProperties).where(and(eq(personalProperties.userId, userId(req)), eq(personalProperties.status, 'active'))).orderBy(desc(personalProperties.createdAt)))
})
router.post('/properties', async (req, res) => {
  try {
    const [property] = await db.insert(personalProperties).values({
      userId: userId(req),
      name: textValue(req.body?.name, 'name'),
      propertyType: textValue(req.body?.propertyType, 'propertyType'),
      location: typeof req.body?.location === 'string' ? req.body.location : null,
      purchaseDate: typeof req.body?.purchaseDate === 'string' && req.body.purchaseDate ? req.body.purchaseDate : null,
      purchasePrice: amount(req.body?.purchasePrice ?? 0, 'purchasePrice'),
      currentValue: amount(req.body?.currentValue ?? 0, 'currentValue'),
      currency: typeof req.body?.currency === 'string' ? req.body.currency.trim().toUpperCase() : 'USD',
      mortgageBalance: amount(req.body?.mortgageBalance ?? 0, 'mortgageBalance'),
      monthlyPayment: amount(req.body?.monthlyPayment ?? 0, 'monthlyPayment'),
      rentalIncome: amount(req.body?.rentalIncome ?? 0, 'rentalIncome'),
      notes: typeof req.body?.notes === 'string' ? req.body.notes : null,
    }).returning()
    await syncPropertyRentalIncome(property)
    res.status(201).json(property)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create property' }) }
})
router.put('/properties/:id', async (req, res) => {
  try {
    const [property] = await db.update(personalProperties).set({
      name: textValue(req.body?.name, 'name'),
      propertyType: textValue(req.body?.propertyType, 'propertyType'),
      location: typeof req.body?.location === 'string' ? req.body.location : null,
      purchaseDate: typeof req.body?.purchaseDate === 'string' && req.body.purchaseDate ? req.body.purchaseDate : null,
      purchasePrice: amount(req.body?.purchasePrice ?? 0, 'purchasePrice'),
      currentValue: amount(req.body?.currentValue ?? 0, 'currentValue'),
      currency: typeof req.body?.currency === 'string' ? req.body.currency.trim().toUpperCase() : 'USD',
      mortgageBalance: amount(req.body?.mortgageBalance ?? 0, 'mortgageBalance'),
      monthlyPayment: amount(req.body?.monthlyPayment ?? 0, 'monthlyPayment'),
      rentalIncome: amount(req.body?.rentalIncome ?? 0, 'rentalIncome'),
      notes: typeof req.body?.notes === 'string' ? req.body.notes : null,
    }).where(and(eq(personalProperties.id, req.params.id), eq(personalProperties.userId, userId(req)), eq(personalProperties.status, 'active'))).returning()
    if (!property) return res.status(404).json({ error: 'Personal property not found' })
    await syncPropertyRentalIncome(property)
    res.json(property)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update property' }) }
})
router.delete('/properties/:id', async (req, res) => {
  const [property] = await db.update(personalProperties).set({ status: 'inactive' }).where(and(eq(personalProperties.id, req.params.id), eq(personalProperties.userId, userId(req)), eq(personalProperties.status, 'active'))).returning({ id: personalProperties.id })
  if (!property) return res.status(404).json({ error: 'Personal property not found' })
  res.json({ ok: true })
})

export { router as personalFinanceRoutes }
