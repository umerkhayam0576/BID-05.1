import { and, desc, eq, isNull } from 'drizzle-orm'
import { Router } from 'express'
import { db } from '../db'
import { personalAccounts, personalTransactions, personalAssets, personalLiabilities, personalDebtPayments, personalProperties, personalMoneyRelationships, personalSettlements, personalSettlementAllocations, users, notifications } from '../db/app-schema'
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

async function createPersonalNotification(input: { recipientUserId: string; type: string; title: string; body: string; entityType?: string; entityId?: string }) {
  await db.insert(notifications).values({
    workspaceId: null,
    recipientUserId: input.recipientUserId,
    type: input.type,
    title: input.title,
    body: input.body,
    entityType: input.entityType || null,
    entityId: input.entityId || null,
    desktopRequested: false,
  })
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
    await createPersonalNotification({ recipientUserId: account.userId, type: 'personal_account_created', title: 'Personal account added', body: `Personal account "${account.name}" was added.`, entityType: 'personal_account', entityId: account.id })
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
    await createPersonalNotification({ recipientUserId: account.userId, type: 'personal_account_updated', title: 'Personal account updated', body: `Personal account "${account.name}" was updated.`, entityType: 'personal_account', entityId: account.id })
    res.json(account)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update account' }) }
})
router.delete('/accounts/:id', async (req, res) => {
  const [account] = await db.update(personalAccounts).set({ status: 'inactive' })
    .where(and(eq(personalAccounts.id, req.params.id), eq(personalAccounts.userId, userId(req)), eq(personalAccounts.status, 'active'))).returning({ id: personalAccounts.id })
  if (!account) return res.status(404).json({ error: 'Personal account not found' })
  await createPersonalNotification({ recipientUserId: userId(req), type: 'personal_account_removed', title: 'Personal account removed', body: 'A personal account was removed.', entityType: 'personal_account', entityId: account.id })
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
    await createPersonalNotification({ recipientUserId: transaction.userId, type: 'personal_transaction_created', title: 'Personal transaction added', body: `${transaction.transactionType === 'income' ? 'Income' : 'Expense'} of ${transaction.amount} was added.`, entityType: 'personal_transaction', entityId: transaction.id })
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
    await createPersonalNotification({ recipientUserId: transaction.userId, type: 'personal_transaction_updated', title: 'Personal transaction updated', body: 'A personal transaction was updated.', entityType: 'personal_transaction', entityId: transaction.id })
    res.json(transaction)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update transaction' }) }
})
router.delete('/transactions/:id', async (req, res) => {
  const [transaction] = await db.delete(personalTransactions).where(and(eq(personalTransactions.id, req.params.id), eq(personalTransactions.userId, userId(req)))).returning({ id: personalTransactions.id })
  if (!transaction) return res.status(404).json({ error: 'Personal transaction not found' })
  await createPersonalNotification({ recipientUserId: userId(req), type: 'personal_transaction_removed', title: 'Personal transaction removed', body: 'A personal transaction was removed.', entityType: 'personal_transaction', entityId: transaction.id })
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
    await createPersonalNotification({ recipientUserId: asset.userId, type: 'personal_asset_created', title: 'Personal asset added', body: `Asset "${asset.name}" was added.`, entityType: 'personal_asset', entityId: asset.id })
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
    await createPersonalNotification({ recipientUserId: asset.userId, type: 'personal_asset_updated', title: 'Personal asset updated', body: `Asset "${asset.name}" was updated.`, entityType: 'personal_asset', entityId: asset.id })
    res.json(asset)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update asset' }) }
})
router.delete('/assets/:id', async (req, res) => {
  const [asset] = await db.update(personalAssets).set({ status: 'inactive' }).where(and(eq(personalAssets.id, req.params.id), eq(personalAssets.userId, userId(req)), eq(personalAssets.status, 'active'))).returning({ id: personalAssets.id })
  if (!asset) return res.status(404).json({ error: 'Personal asset not found' })
  await createPersonalNotification({ recipientUserId: userId(req), type: 'personal_asset_removed', title: 'Personal asset removed', body: 'A personal asset was removed.', entityType: 'personal_asset', entityId: asset.id })
  res.json({ ok: true })
})

router.get('/liabilities', async (req, res) => {
  const currentUserId = userId(req)
  const [liabilities, properties] = await Promise.all([
    db.select().from(personalLiabilities).where(and(eq(personalLiabilities.userId, currentUserId), eq(personalLiabilities.status, 'active'))),
    db.select().from(personalProperties).where(and(eq(personalProperties.userId, currentUserId), eq(personalProperties.status, 'active'))),
  ])
  const propertyMortgages = (await Promise.all(properties
    .filter((property: typeof personalProperties.$inferSelect) => Number(property.mortgageBalance) > 0 || Number(property.monthlyPayment) > 0)
    .map(async (property: typeof personalProperties.$inferSelect) => {
      const liabilityId = 'property-mortgage:' + property.id
      const payments = await db.select({ principalAmount: personalDebtPayments.principalAmount })
        .from(personalDebtPayments)
        .where(and(eq(personalDebtPayments.userId, currentUserId), eq(personalDebtPayments.liabilityId, liabilityId)))
      const originalBalance = Number(property.mortgageBalance) + payments.reduce((sum: number, payment: { principalAmount: string }) => sum + Number(payment.principalAmount), 0)
      return {
        id: liabilityId,
        userId: currentUserId,
        name: property.name + ' Mortgage',
        liabilityType: 'mortgage',
        currentBalance: property.mortgageBalance,
        currency: property.currency,
        status: 'linked-property',
        notes: 'Automatically linked to Real Estate & Property. Manage this mortgage from the property record.',
        originalBalance: originalBalance.toFixed(2),
        interestRate: '0',
        paymentAmount: property.monthlyPayment,
        paymentFrequency: 'monthly',
        nextPaymentDate: null,
        startDate: property.purchaseDate,
        createdAt: property.createdAt,
        updatedAt: property.updatedAt,
      }
    })
  ))
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
      await createPersonalNotification({ recipientUserId: currentUserId, type: 'personal_debt_payment_recorded', title: 'Debt payment recorded', body: `A payment of ${payment.amount} was recorded. Remaining balance: ${payment.balanceAfter}.`, entityType: 'personal_debt_payment', entityId: payment.id })
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
    await createPersonalNotification({ recipientUserId: currentUserId, type: 'personal_debt_payment_recorded', title: 'Debt payment recorded', body: `A payment of ${payment.amount} was recorded. Remaining balance: ${payment.balanceAfter}.`, entityType: 'personal_debt_payment', entityId: payment.id })
    res.status(201).json(payment)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to record payment' }) }
})

router.get('/money-relationships', async (req, res) => {
  const currentUserId = userId(req)
  const rows = await db.select().from(personalMoneyRelationships).where(
    and(
      eq(personalMoneyRelationships.status, 'active'),
    )
  )
  const pendingRows = await db.select().from(personalMoneyRelationships).where(eq(personalMoneyRelationships.status, 'pending'))
  rows.push(...pendingRows)
  const mine = rows.filter((row: typeof rows[number]) => row.borrowerUserId === currentUserId || row.lenderUserId === currentUserId)
  const otherIds = [...new Set(mine.map((row: typeof rows[number]) => row.borrowerUserId === currentUserId ? row.lenderUserId : row.borrowerUserId))]
  const people = otherIds.length
    ? await db.select({ id: users.id, displayName: users.displayName, email: users.email })
      .from(users)
      .where(eq(users.status, 'active'))
    : []
  type PersonSummary = { id: string; displayName: string | null; email: string | null }
  const peopleById = new Map((people as PersonSummary[]).filter((person: PersonSummary) => otherIds.includes(person.id)).map((person: PersonSummary) => [person.id, person]))
  res.json(mine.map((row: typeof rows[number]) => {
    const isBorrower = row.borrowerUserId === currentUserId
    const otherId = isBorrower ? row.lenderUserId : row.borrowerUserId
    const other = peopleById.get(otherId)
    return {
      ...row,
      direction: isBorrower ? 'borrowed' : 'lent',
      counterparty: { id: otherId, displayName: other?.displayName || 'Connected person', email: other?.email || '' },
    }
  }))
})

router.post('/money-relationships', async (req, res) => {
  try {
    const currentUserId = userId(req)
    const counterpartyEmail = textValue(req.body?.counterpartyEmail, 'counterpartyEmail').toLowerCase()
    if (counterpartyEmail === '') throw new Error('counterpartyEmail is required')
    const [counterparty] = await db.select().from(users).where(and(eq(users.email, counterpartyEmail), eq(users.status, 'active'))).limit(1)
    if (!counterparty) return res.status(404).json({ error: 'No active user was found with that email' })
    if (counterparty.id === currentUserId) return res.status(400).json({ error: 'You cannot create a money relationship with yourself' })
    const relationshipType = typeof req.body?.relationshipType === 'string' ? req.body.relationshipType : 'loan'
    if (relationshipType !== 'loan') return res.status(400).json({ error: 'Only loan relationships are supported here' })
    const direction = req.body?.direction === 'lent' ? 'lent' : 'borrowed'
    const originalAmount = Number(req.body?.amount)
    if (!Number.isFinite(originalAmount) || originalAmount <= 0) throw new Error('Loan amount must be greater than zero')
    const borrowerUserId = direction === 'borrowed' ? currentUserId : counterparty.id
    const lenderUserId = direction === 'borrowed' ? counterparty.id : currentUserId
    const description = textValue(req.body?.description || 'Personal loan', 'description')
    const currency = typeof req.body?.currency === 'string' ? req.body.currency.trim().toUpperCase() : 'USD'
    const [relationship] = await db.insert(personalMoneyRelationships).values({
      borrowerUserId, lenderUserId, relationshipType, description,
      originalAmount: originalAmount.toFixed(2), remainingAmount: originalAmount.toFixed(2),
      currency, interestRate: Number(req.body?.interestRate || 0).toFixed(4),
      status: 'pending',
      startDate: typeof req.body?.startDate === 'string' && req.body.startDate ? req.body.startDate : null,
      dueDate: typeof req.body?.dueDate === 'string' && req.body.dueDate ? req.body.dueDate : null,
      notes: typeof req.body?.notes === 'string' ? req.body.notes.trim() || null : null,
    }).returning()
    await db.insert(notifications).values({
      workspaceId: null,
      recipientUserId: counterparty.id,
      type: 'personal_loan_request',
      title: 'New personal loan request',
      body: `${(await db.select({ displayName: users.displayName }).from(users).where(eq(users.id, currentUserId)).limit(1))[0]?.displayName || 'A portal user'} sent you a personal loan request for ${currency} ${originalAmount.toFixed(2)}.`,
      entityType: 'personal_money_relationship',
      entityId: relationship.id,
      desktopRequested: false,
    })

    await createPersonalNotification({ recipientUserId: currentUserId, type: 'personal_loan_request_sent', title: 'Loan request sent', body: `Your personal loan request for ${currency} ${originalAmount.toFixed(2)} was sent.`, entityType: 'personal_money_relationship', entityId: relationship.id })
    res.status(201).json({ ...relationship, requestStatus: 'pending' })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to create money relationship' })
  }
})

router.post('/money-relationships/:id/respond', async (req, res) => {
  try {
    const currentUserId = userId(req)
    const decision = req.body?.decision === 'accept' ? 'accept' : req.body?.decision === 'reject' ? 'reject' : ''
    if (!decision) return res.status(400).json({ error: 'Decision must be accept or reject' })
    const [relationship] = await db.select().from(personalMoneyRelationships)
      .where(and(eq(personalMoneyRelationships.id, req.params.id), eq(personalMoneyRelationships.status, 'pending'))).limit(1)
    if (!relationship) return res.status(404).json({ error: 'Pending loan request not found' })
    if (relationship.lenderUserId !== currentUserId && relationship.borrowerUserId !== currentUserId) {
      return res.status(403).json({ error: 'Loan request access denied' })
    }
    const nextStatus = decision === 'accept' ? 'active' : 'cancelled'
    const [updated] = await db.update(personalMoneyRelationships).set({ status: nextStatus, updatedAt: new Date() })
      .where(and(eq(personalMoneyRelationships.id, relationship.id), eq(personalMoneyRelationships.status, 'pending'))).returning()
    await db.insert(notifications).values({
      workspaceId: null,
      recipientUserId: relationship.borrowerUserId === currentUserId ? relationship.lenderUserId : relationship.borrowerUserId,
      type: 'personal_loan_request_response',
      title: decision === 'accept' ? 'Personal loan request accepted' : 'Personal loan request declined',
      body: decision === 'accept' ? 'Your personal loan request was accepted. The shared loan is now active.' : 'Your personal loan request was declined.',
      entityType: 'personal_money_relationship',
      entityId: relationship.id,
      desktopRequested: false,
    })

    await createPersonalNotification({ recipientUserId: currentUserId, type: 'personal_loan_request_response', title: decision === 'accept' ? 'Loan request accepted' : 'Loan request declined', body: decision === 'accept' ? 'The shared loan is now active.' : 'The loan request was declined.', entityType: 'personal_money_relationship', entityId: relationship.id })
    res.json(updated)
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to respond to loan request' })
  }
})

router.get('/notifications', async (req, res) => {
  const currentUserId = userId(req)
  const rows = await db.select().from(notifications)
    .where(eq(notifications.recipientUserId, currentUserId))
    .orderBy(desc(notifications.createdAt))
    .limit(100)
  res.json(rows)
})

router.post('/notifications/:id/read', async (req, res) => {
  const currentUserId = userId(req)
  const [notification] = await db.update(notifications).set({ readAt: new Date() })
    .where(and(eq(notifications.id, req.params.id), eq(notifications.recipientUserId, currentUserId), isNull(notifications.readAt)))
    .returning()
  if (!notification) return res.status(404).json({ error: 'Notification not found' })
  res.json(notification)
})

router.post('/notifications/read-all', async (req, res) => {
  const currentUserId = userId(req)
  await db.update(notifications).set({ readAt: new Date() })
    .where(and(eq(notifications.recipientUserId, currentUserId), isNull(notifications.readAt)))
  res.json({ ok: true })
})

router.get('/money-relationship-notifications', async (req, res) => {
  const currentUserId = userId(req)
  const rows = await db.select().from(notifications)
    .where(eq(notifications.recipientUserId, currentUserId))
    .orderBy(desc(notifications.createdAt))
  res.json(rows.filter((row: typeof rows[number]) => row.type === 'personal_loan_request' || row.type === 'personal_loan_request_response'))
})

router.post('/money-relationships/:id/settlements', async (req, res) => {
  try {
    const currentUserId = userId(req)
    const relationshipId = req.params.id
    const [relationship] = await db.select().from(personalMoneyRelationships)
      .where(and(eq(personalMoneyRelationships.id, relationshipId), eq(personalMoneyRelationships.status, 'active')))
      .limit(1)
    if (!relationship) return res.status(404).json({ error: 'Money relationship not found' })
    if (relationship.borrowerUserId !== currentUserId && relationship.lenderUserId !== currentUserId) {
      return res.status(403).json({ error: 'Money relationship access denied' })
    }

    const paymentAmount = Number(req.body?.amount)
    const paymentDate = typeof req.body?.paymentDate === 'string' && req.body.paymentDate ? req.body.paymentDate : new Date().toISOString().slice(0, 10)
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) throw new Error('Settlement amount must be greater than zero')
    if (paymentAmount > Number(relationship.remainingAmount) + 0.01) throw new Error('Settlement cannot exceed the remaining loan balance')

    const [settlement] = await db.insert(personalSettlements).values({
      payerUserId: relationship.borrowerUserId,
      payeeUserId: relationship.lenderUserId,
      paymentDate,
      totalAmount: paymentAmount.toFixed(2),
      currency: relationship.currency,
      notes: typeof req.body?.notes === 'string' ? req.body.notes.trim() || null : null,
    }).returning()

    const principalAmount = Number(req.body?.principalAmount ?? paymentAmount)
    const interestAmount = Number(req.body?.interestAmount ?? Math.max(0, paymentAmount - principalAmount))
    if (principalAmount < 0 || interestAmount < 0 || principalAmount + interestAmount > paymentAmount + 0.01) {
      throw new Error('Settlement allocation is invalid')
    }
    if (principalAmount > Number(relationship.remainingAmount) + 0.01) throw new Error('Principal cannot exceed the remaining loan balance')

    const remainingAfter = Math.max(0, Number(relationship.remainingAmount) - principalAmount)
    await db.insert(personalSettlementAllocations).values({
      settlementId: settlement.id,
      relationshipId: relationship.id,
      amount: paymentAmount.toFixed(2),
      principalAmount: principalAmount.toFixed(2),
      interestAmount: interestAmount.toFixed(2),
    })
    await db.update(personalMoneyRelationships).set({
      remainingAmount: remainingAfter.toFixed(2),
      status: remainingAfter <= 0.01 ? 'paid_off' : 'partially_paid',
      updatedAt: new Date(),
    }).where(eq(personalMoneyRelationships.id, relationship.id))

    // Keep both personal ledgers synchronized when a personal cash account exists.
    const [payerAccount] = await db.select().from(personalAccounts)
      .where(and(eq(personalAccounts.userId, relationship.borrowerUserId), eq(personalAccounts.status, 'active')))
      .orderBy(desc(personalAccounts.createdAt)).limit(1)
    if (payerAccount) {
      await db.insert(personalTransactions).values({
        userId: relationship.borrowerUserId, accountId: payerAccount.id, transactionType: 'expense',
        category: 'Loan Payment', description: 'Payment to ' + (relationship.lenderUserId === currentUserId ? 'lender' : 'personal lender'),
        amount: paymentAmount.toFixed(2), transactionDate: paymentDate,
        notes: 'Automatically linked to personal loan settlement.', sourceType: 'person-to-person-settlement', sourceId: settlement.id,
      })
    }
    const [payeeAccount] = await db.select().from(personalAccounts)
      .where(and(eq(personalAccounts.userId, relationship.lenderUserId), eq(personalAccounts.status, 'active')))
      .orderBy(desc(personalAccounts.createdAt)).limit(1)
    if (payeeAccount) {
      await db.insert(personalTransactions).values({
        userId: relationship.lenderUserId, accountId: payeeAccount.id, transactionType: 'income',
        category: 'Loan Received', description: 'Payment received from borrower',
        amount: paymentAmount.toFixed(2), transactionDate: paymentDate,
        notes: 'Automatically linked to personal loan settlement.', sourceType: 'person-to-person-settlement', sourceId: settlement.id,
      })
    }

    await createPersonalNotification({ recipientUserId: relationship.borrowerUserId, type: 'personal_loan_payment', title: 'Loan payment recorded', body: `A payment of ${paymentAmount.toFixed(2)} ${relationship.currency} was recorded. Remaining balance: ${remainingAfter.toFixed(2)} ${relationship.currency}.`, entityType: 'personal_money_relationship', entityId: relationship.id })
    await createPersonalNotification({ recipientUserId: relationship.lenderUserId, type: 'personal_loan_payment', title: 'Loan payment received', body: `A payment of ${paymentAmount.toFixed(2)} ${relationship.currency} was recorded. Remaining balance: ${remainingAfter.toFixed(2)} ${relationship.currency}.`, entityType: 'personal_money_relationship', entityId: relationship.id })
    res.status(201).json({ settlement, relationship: { ...relationship, remainingAmount: remainingAfter.toFixed(2), status: remainingAfter <= 0.01 ? 'paid_off' : 'partially_paid' } })
  } catch (error) {
    res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to record settlement' })
  }
})

router.get('/money-relationships/:id/settlements', async (req, res) => {
  const currentUserId = userId(req)
  const [relationship] = await db.select().from(personalMoneyRelationships)
    .where(eq(personalMoneyRelationships.id, req.params.id)).limit(1)
  if (!relationship || (relationship.borrowerUserId !== currentUserId && relationship.lenderUserId !== currentUserId)) {
    return res.status(404).json({ error: 'Money relationship not found' })
  }
  const allocations = await db.select({
    id: personalSettlementAllocations.id,
    settlementId: personalSettlementAllocations.settlementId,
    relationshipId: personalSettlementAllocations.relationshipId,
    amount: personalSettlementAllocations.amount,
    principalAmount: personalSettlementAllocations.principalAmount,
    interestAmount: personalSettlementAllocations.interestAmount,
    paymentDate: personalSettlements.paymentDate,
    notes: personalSettlements.notes,
  }).from(personalSettlementAllocations)
    .innerJoin(personalSettlements, eq(personalSettlements.id, personalSettlementAllocations.settlementId))
    .where(eq(personalSettlementAllocations.relationshipId, req.params.id))
    .orderBy(desc(personalSettlements.paymentDate), desc(personalSettlements.createdAt))
  res.json(allocations)
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
    await createPersonalNotification({ recipientUserId: liability.userId, type: 'personal_liability_created', title: 'Personal liability added', body: `Liability "${liability.name}" was added with balance ${liability.currency} ${liability.currentBalance}.`, entityType: 'personal_liability', entityId: liability.id })
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
    await createPersonalNotification({ recipientUserId: liability.userId, type: 'personal_liability_updated', title: 'Personal liability updated', body: `Liability "${liability.name}" was updated.`, entityType: 'personal_liability', entityId: liability.id })
    res.json(liability)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update liability' }) }
})
router.delete('/liabilities/:id', async (req, res) => {
  const [liability] = await db.update(personalLiabilities).set({ status: 'inactive' }).where(and(eq(personalLiabilities.id, req.params.id), eq(personalLiabilities.userId, userId(req)), eq(personalLiabilities.status, 'active'))).returning({ id: personalLiabilities.id })
  if (!liability) return res.status(404).json({ error: 'Personal liability not found' })
  await createPersonalNotification({ recipientUserId: userId(req), type: 'personal_liability_removed', title: 'Personal liability removed', body: 'A personal liability was removed.', entityType: 'personal_liability', entityId: liability.id })
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
    await createPersonalNotification({ recipientUserId: property.userId, type: 'personal_property_created', title: 'Property added', body: `Property "${property.name}" was added.`, entityType: 'personal_property', entityId: property.id })
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
    await createPersonalNotification({ recipientUserId: property.userId, type: 'personal_property_updated', title: 'Property updated', body: `Property "${property.name}" was updated.`, entityType: 'personal_property', entityId: property.id })
    res.json(property)
  } catch (error) { res.status(400).json({ error: error instanceof Error ? error.message : 'Unable to update property' }) }
})
router.delete('/properties/:id', async (req, res) => {
  const [property] = await db.update(personalProperties).set({ status: 'inactive' }).where(and(eq(personalProperties.id, req.params.id), eq(personalProperties.userId, userId(req)), eq(personalProperties.status, 'active'))).returning({ id: personalProperties.id })
  if (!property) return res.status(404).json({ error: 'Personal property not found' })
  await createPersonalNotification({ recipientUserId: userId(req), type: 'personal_property_removed', title: 'Property removed', body: 'A personal property was removed.', entityType: 'personal_property', entityId: property.id })
  res.json({ ok: true })
})

export { router as personalFinanceRoutes }






