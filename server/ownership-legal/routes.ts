import { Router } from 'express'
import { and, asc, eq } from 'drizzle-orm'
import { db } from '../db'
import { getAuthenticatedUserId, requireWorkspaceMembership, requireWorkspaceRole } from '../auth/middleware'
import {
  agreements,
  agreementApprovals,
  agreementParties,
  agreementSignatures,
  legalDocumentAuditLogs,
  legalDocumentVersions,
  legalDocuments,
  ownershipChangeRequests,
  ownershipHistory,
  entityOwnerships,
  users,
  workspaces,
} from '../db/app-schema'

export const ownershipLegalRoutes = Router()

const ownerRoles = ['owner', 'admin'] as const

function errorStatus(error: any) {
  return error?.status === 403 ? 403 : 500
}

function validPercent(value: unknown) {
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 && n <= 100
}

async function resolveWorkspaceId(workspaceRef: string) {
  const [workspace] = await db.select({ id: workspaces.id }).from(workspaces).where(eq(workspaces.slug, workspaceRef)).limit(1)
  if (workspace) return workspace.id
  return workspaceRef
}

ownershipLegalRoutes.get('/:workspaceId/ownership', async (req, res) => {
  try {
    const workspaceId = await resolveWorkspaceId(req.params.workspaceId)
    await requireWorkspaceRole(req, workspaceId, [...ownerRoles])

    const [owners, history, requests] = await Promise.all([
      db.select({
        userId: entityOwnerships.userId,
        displayName: users.displayName,
        email: users.email,
        ownershipPercent: entityOwnerships.ownershipPercent,
        profitSharePercent: entityOwnerships.profitSharePercent,
        entityRole: entityOwnerships.entityRole,
        status: entityOwnerships.status,
      })
        .from(entityOwnerships)
        .innerJoin(users, eq(users.id, entityOwnerships.userId))
        .where(and(eq(entityOwnerships.workspaceId, workspaceId), eq(entityOwnerships.status, 'active'))),
      db.select().from(ownershipHistory)
        .where(eq(ownershipHistory.workspaceId, workspaceId))
        .orderBy(asc(ownershipHistory.effectiveFrom)),
      db.select().from(ownershipChangeRequests)
        .where(eq(ownershipChangeRequests.workspaceId, workspaceId))
        .orderBy(asc(ownershipChangeRequests.createdAt)),
    ])

    return res.json({ owners, history, changeRequests: requests })
  } catch (error: any) {
    return res.status(errorStatus(error)).json({ error: error.message || 'Failed to fetch ownership' })
  }
})

ownershipLegalRoutes.post('/:workspaceId/ownership/change-requests', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)
    await requireWorkspaceRole(req, req.params.workspaceId, [...ownerRoles])

    const { proposedOwnership, reason, effectiveDate, agreementId } = req.body || {}
    if (!Array.isArray(proposedOwnership) || proposedOwnership.length === 0) {
      return res.status(400).json({ error: 'proposedOwnership must be a non-empty array' })
    }

    const normalized = proposedOwnership.map((item: any) => ({
      userId: String(item.userId || ''),
      ownershipPercent: String(item.ownershipPercent ?? '0'),
      profitSharePercent: String(item.profitSharePercent ?? '0'),
      votingPercent: String(item.votingPercent ?? item.ownershipPercent ?? '0'),
    }))

    if (normalized.some((item: any) => !item.userId || !validPercent(item.ownershipPercent) || !validPercent(item.profitSharePercent) || !validPercent(item.votingPercent))) {
      return res.status(400).json({ error: 'Ownership percentages must be between 0 and 100' })
    }

    const totalOwnership = normalized.reduce((sum: number, item: any) => sum + Number(item.ownershipPercent), 0)
    if (Math.abs(totalOwnership - 100) > 0.0001) {
      return res.status(400).json({ error: 'Proposed ownership must total exactly 100%' })
    }

    const [request] = await db.insert(ownershipChangeRequests).values({
      workspaceId: req.params.workspaceId,
      requestedByUserId: userId,
      status: 'pending',
      reason: typeof reason === 'string' ? reason.trim() || null : null,
      effectiveDate: effectiveDate || null,
      proposedOwnership: normalized,
      agreementId: agreementId || null,
    }).returning()

    return res.status(201).json({ changeRequest: request })
  } catch (error: any) {
    return res.status(errorStatus(error)).json({ error: error.message || 'Failed to create ownership change request' })
  }
})

ownershipLegalRoutes.get('/:workspaceId/legal-documents', async (req, res) => {
  try {
    await requireWorkspaceMembership(req, req.params.workspaceId)

    const documents = await db.select().from(legalDocuments)
      .where(eq(legalDocuments.workspaceId, req.params.workspaceId))
      .orderBy(asc(legalDocuments.createdAt))

    return res.json({ documents })
  } catch (error: any) {
    return res.status(errorStatus(error)).json({ error: error.message || 'Failed to fetch legal documents' })
  }
})

ownershipLegalRoutes.post('/:workspaceId/legal-documents', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)
    await requireWorkspaceRole(req, req.params.workspaceId, [...ownerRoles])

    const { title, documentType, status = 'draft', effectiveDate, expirationDate } = req.body || {}
    if (!title?.trim() || !documentType?.trim()) {
      return res.status(400).json({ error: 'title and documentType are required' })
    }

    const [document] = await db.insert(legalDocuments).values({
      workspaceId: req.params.workspaceId,
      title: title.trim(),
      documentType: documentType.trim(),
      status,
      effectiveDate: effectiveDate || null,
      expirationDate: expirationDate || null,
      createdByUserId: userId,
    }).returning()

    await db.insert(legalDocumentAuditLogs).values({
      workspaceId: req.params.workspaceId,
      documentId: document.id,
      actorUserId: userId,
      action: 'document.created',
      afterData: document,
    })

    return res.status(201).json({ document })
  } catch (error: any) {
    return res.status(errorStatus(error)).json({ error: error.message || 'Failed to create legal document' })
  }
})

ownershipLegalRoutes.get('/:workspaceId/legal-documents/:documentId', async (req, res) => {
  try {
    await requireWorkspaceMembership(req, req.params.workspaceId)

    const [document] = await db.select().from(legalDocuments).where(and(
      eq(legalDocuments.id, req.params.documentId),
      eq(legalDocuments.workspaceId, req.params.workspaceId),
    )).limit(1)
    if (!document) return res.status(404).json({ error: 'Legal document not found' })

    const [versions, audits] = await Promise.all([
      db.select().from(legalDocumentVersions)
        .where(and(eq(legalDocumentVersions.documentId, document.id), eq(legalDocumentVersions.workspaceId, req.params.workspaceId)))
        .orderBy(asc(legalDocumentVersions.createdAt)),
      db.select().from(legalDocumentAuditLogs)
        .where(and(eq(legalDocumentAuditLogs.documentId, document.id), eq(legalDocumentAuditLogs.workspaceId, req.params.workspaceId)))
        .orderBy(asc(legalDocumentAuditLogs.createdAt)),
    ])

    return res.json({ document, versions, auditHistory: audits })
  } catch (error: any) {
    return res.status(errorStatus(error)).json({ error: error.message || 'Failed to fetch legal document' })
  }
})

ownershipLegalRoutes.get('/:workspaceId/agreements', async (req, res) => {
  try {
    await requireWorkspaceMembership(req, req.params.workspaceId)

    const rows = await db.select().from(agreements)
      .where(eq(agreements.workspaceId, req.params.workspaceId))
      .orderBy(asc(agreements.createdAt))

    return res.json({ agreements: rows })
  } catch (error: any) {
    return res.status(errorStatus(error)).json({ error: error.message || 'Failed to fetch agreements' })
  }
})

ownershipLegalRoutes.post('/:workspaceId/agreements', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)
    await requireWorkspaceRole(req, req.params.workspaceId, [...ownerRoles])

    const { title, agreementType, documentId, effectiveDate, expirationDate } = req.body || {}
    if (!title?.trim() || !agreementType?.trim()) {
      return res.status(400).json({ error: 'title and agreementType are required' })
    }

    const result = await db.transaction(async (tx: any) => {
      const [agreement] = await tx.insert(agreements).values({
        workspaceId: req.params.workspaceId,
        documentId: documentId || null,
        title: title.trim(),
        agreementType: agreementType.trim(),
        status: 'draft',
        effectiveDate: effectiveDate || null,
        expirationDate: expirationDate || null,
        createdByUserId: userId,
      }).returning()

      await tx.insert(legalDocumentAuditLogs).values({
        workspaceId: req.params.workspaceId,
        agreementId: agreement.id,
        actorUserId: userId,
        action: 'agreement.created',
        afterData: agreement,
      })

      return agreement
    })

    return res.status(201).json({ agreement: result })
  } catch (error: any) {
    return res.status(errorStatus(error)).json({ error: error.message || 'Failed to create agreement' })
  }
})

ownershipLegalRoutes.get('/:workspaceId/agreements/:agreementId', async (req, res) => {
  try {
    await requireWorkspaceMembership(req, req.params.workspaceId)

    const [agreement] = await db.select().from(agreements).where(and(
      eq(agreements.id, req.params.agreementId),
      eq(agreements.workspaceId, req.params.workspaceId),
    )).limit(1)
    if (!agreement) return res.status(404).json({ error: 'Agreement not found' })

    const [parties, approvals, signatures] = await Promise.all([
      db.select().from(agreementParties).where(and(eq(agreementParties.agreementId, agreement.id), eq(agreementParties.workspaceId, req.params.workspaceId))),
      db.select().from(agreementApprovals).where(and(eq(agreementApprovals.agreementId, agreement.id), eq(agreementApprovals.workspaceId, req.params.workspaceId))),
      db.select().from(agreementSignatures).where(and(eq(agreementSignatures.agreementId, agreement.id), eq(agreementSignatures.workspaceId, req.params.workspaceId))),
    ])

    return res.json({ agreement, parties, approvals, signatures })
  } catch (error: any) {
    return res.status(errorStatus(error)).json({ error: error.message || 'Failed to fetch agreement' })
  }
})
