import express from 'express'
import { and, desc, eq } from 'drizzle-orm'
import { db } from '../db'
import { portalAuditEvents, portalEntities } from '../db/schema'

export const portalRoutes = express.Router()
const userId = (req: express.Request) => String(req.header('x-user-id') || 'demo-client')

portalRoutes.get('/entities', async (req, res) => {
  try {
    const rows = await db.select().from(portalEntities).where(eq(portalEntities.userId, userId(req))).orderBy(desc(portalEntities.updatedAt))
    res.json(rows)
  } catch (error) {
    console.error('[portal] list failed', error)
    res.status(500).json({ error: 'Unable to load portal data' })
  }
})

portalRoutes.post('/entities', async (req, res) => {
  const body = req.body as { entityType?: unknown; name?: unknown; status?: unknown; data?: unknown }
  const entityType = String(body.entityType || '').slice(0, 80)
  const name = String(body.name || '').slice(0, 160)
  const status = String(body.status || 'active').slice(0, 40)
  if (!entityType || !name) return res.status(400).json({ error: 'entityType and name are required' })
  try {
    const [created] = await db.insert(portalEntities).values({ userId: userId(req), entityType, name, status, data: body.data && typeof body.data === 'object' ? body.data : {} }).returning()
    await db.insert(portalAuditEvents).values({ userId: userId(req), entityType, entityId: String(created.id), action: 'created', afterData: created.data })
    res.status(201).json(created)
  } catch (error) {
    console.error('[portal] create failed', error)
    res.status(500).json({ error: 'Unable to save portal data' })
  }
})

portalRoutes.post('/demo/reset', async (req, res) => {
  try {
    await db.delete(portalEntities).where(eq(portalEntities.userId, userId(req)))
    res.json({ ok: true, mode: 'demo-reset' })
  } catch (error) {
    console.error('[portal] reset failed', error)
    res.status(500).json({ error: 'Unable to reset demo data' })
  }
})
