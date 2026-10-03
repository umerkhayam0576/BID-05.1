import { Router } from 'express'
import { randomBytes } from 'crypto'
import { and, desc, eq, isNull, or, inArray } from 'drizzle-orm'
import { db } from '../db'
import { getAuthenticatedUserId, getMembership, requireWorkspaceMembership, requireWorkspaceRole } from '../auth/middleware'
import { hashSessionToken, normalizeEmail } from '../auth/service'
import { attendanceRecords, clients, departments, employees, memberships, notifications, projects, projectAccess, reminders, salesActivities, salesLeads, workspaceInvitations, users } from '../db/app-schema'

export const workspaceRoutes = Router()

function requireUser(req: import('express').Request) {
  return getAuthenticatedUserId(req)
}

workspaceRoutes.use((_req, _res, next) => next())

workspaceRoutes.get('/memberships', async (req, res) => {
  try {
    const userId = requireUser(req)
    const rows = await db
      .select({
        id: memberships.id,
        workspaceId: memberships.workspaceId,
        userId: memberships.userId,
        role: memberships.role,
        status: memberships.status,
      })
      .from(memberships)
      .where(eq(memberships.userId, userId))
    return res.json({ memberships: rows })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch memberships' })
  }
})

workspaceRoutes.get('/departments', async (req, res) => {
  try {
    const userId = requireUser(req)
    const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : ''

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' })
    }

    const membership = await getMembership(userId, workspaceId)
    if (!membership) {
      return res.status(403).json({ error: 'Workspace access denied' })
    }

    let rows = await db
      .select({
        id: departments.id,
        workspaceId: departments.workspaceId,
        name: departments.name,
        code: departments.code,
        description: departments.description,
        managerUserId: departments.managerUserId,
        status: departments.status,
      })
      .from(departments)
      .where(eq(departments.workspaceId, workspaceId))
      .orderBy(departments.name)

    if (rows.length === 0) {
      const defaults = [
        { id: 'dept-precon-' + workspaceId.slice(0, 8), workspaceId, name: 'Pre-Construction', code: 'PRE', description: 'Pre-construction & bidding', status: 'active' },
        { id: 'dept-est-' + workspaceId.slice(0, 8), workspaceId, name: 'Estimating', code: 'EST', description: 'Quantity takeoff & cost estimation', status: 'active' },
        { id: 'dept-vdc-' + workspaceId.slice(0, 8), workspaceId, name: 'Virtual Design & Construction', code: 'VDC', description: 'BIM & 3D modeling', status: 'active' },
        { id: 'dept-cr-' + workspaceId.slice(0, 8), workspaceId, name: 'Client Relations', code: 'CR', description: 'Sales & business development', status: 'active' },
      ]
      await db.insert(departments).values(defaults).onConflictDoNothing()
      rows = await db
        .select({
          id: departments.id,
          workspaceId: departments.workspaceId,
          name: departments.name,
          code: departments.code,
          description: departments.description,
          managerUserId: departments.managerUserId,
          status: departments.status,
        })
        .from(departments)
        .where(eq(departments.workspaceId, workspaceId))
        .orderBy(departments.name)
    }

    return res.json({ departments: rows })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch workspace departments' })
  }
})

workspaceRoutes.post('/departments', async (req, res) => {
try {
    const userId = requireUser(req)

    const workspaceId =
      typeof req.body?.workspaceId === 'string'
        ? req.body.workspaceId.trim()
        : ''

    const name =
      typeof req.body?.name === 'string'
        ? req.body.name.trim()
        : ''

    const code =
      typeof req.body?.code === 'string'
        ? req.body.code.trim()
        : ''

    const description =
      typeof req.body?.description === 'string'
        ? req.body.description.trim()
        : ''

    const managerUserId =
      typeof req.body?.managerUserId === 'string'
        ? req.body.managerUserId.trim()
        : ''

    const status =
      typeof req.body?.status === 'string'
        ? req.body.status.trim()
        : 'active'

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' })
    }

    if (!name) {
      return res.status(400).json({ error: 'Department name is required' })
    }

    if (!['active', 'inactive'].includes(status)) {
      return res.status(400).json({ error: 'Invalid department status' })
    }

    const membership = await getMembership(userId, workspaceId)

    if (!membership) {
      return res.status(403).json({ error: 'Workspace access denied' })
    }

   if (!['owner', 'admin'].includes(membership.role)) {
  return res.status(403).json({
    error: 'Only workspace owners and admins can create departments',
  })
}

const [department] = await db
  .insert(departments)
  .values({
    workspaceId,
    name,
    code: code || null,
    description: description || null,
    managerUserId: managerUserId || null,
    status,
  })
  .returning({
    id: departments.id,
    workspaceId: departments.workspaceId,
    name: departments.name,
    code: departments.code,
    description: departments.description,
    managerUserId: departments.managerUserId,
    status: departments.status,
  })

return res.status(201).json({ department })
} catch (error: any) {
  if (error?.code === '23505') {
    return res.status(409).json({
      error: 'A department with this name already exists in this workspace',
    })
  }

  return res.status(500).json({
    error: error?.message || 'Failed to create department',
  })
}
})
workspaceRoutes.patch('/departments/:id', async (req, res) => {
  try {
    const userId = requireUser(req)

    const departmentId =
      typeof req.params.id === 'string' ? req.params.id.trim() : ''

    const workspaceId =
      typeof req.body?.workspaceId === 'string'
        ? req.body.workspaceId.trim()
        : ''

    if (!departmentId || !workspaceId) {
      return res.status(400).json({
        error: 'department id and workspaceId are required',
      })
    }

    const membership = await getMembership(userId, workspaceId)

    if (!membership) {
      return res.status(403).json({ error: 'Workspace access denied' })
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({
        error: 'Only workspace owners and admins can manage departments',
      })
    }

    const existing = await db
      .select({
        id: departments.id,
        workspaceId: departments.workspaceId,
      })
      .from(departments)
      .where(
        and(
          eq(departments.id, departmentId),
          eq(departments.workspaceId, workspaceId),
        ),
      )
      .limit(1)

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Department not found' })
    }

    const updates: Record<string, unknown> = {}

    if (typeof req.body?.name === 'string') {
      const name = req.body.name.trim()

      if (!name) {
        return res.status(400).json({
          error: 'Department name cannot be empty',
        })
      }

      updates.name = name
    }

    if (typeof req.body?.code === 'string') {
      updates.code = req.body.code.trim() || null
    }

    if (typeof req.body?.description === 'string') {
      updates.description = req.body.description.trim() || null
    }

    if (typeof req.body?.managerUserId === 'string') {
      updates.managerUserId = req.body.managerUserId.trim() || null
    }

    if (typeof req.body?.status === 'string') {
      const status = req.body.status.trim()

      if (!['active', 'inactive'].includes(status)) {
        return res.status(400).json({
          error: 'Invalid department status',
        })
      }

      updates.status = status
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No department changes were provided',
      })
    }

    const [department] = await db
      .update(departments)
      .set(updates)
      .where(
        and(
          eq(departments.id, departmentId),
          eq(departments.workspaceId, workspaceId),
        ),
      )
      .returning({
        id: departments.id,
        workspaceId: departments.workspaceId,
        name: departments.name,
        code: departments.code,
        description: departments.description,
        managerUserId: departments.managerUserId,
        status: departments.status,
      })

    return res.json({ department })
  } catch (error: any) {
    if (error?.code === '23505') {
      return res.status(409).json({
        error: 'A department with this name already exists in this workspace',
      })
    }

    return res.status(500).json({
      error: error?.message || 'Failed to update department',
    })
  }
})

workspaceRoutes.delete('/departments/:id', async (req, res) => {
try {
    const userId = requireUser(req)

    const departmentId =
      typeof req.params.id === 'string' ? req.params.id.trim() : ''

    const workspaceId =
      typeof req.query.workspaceId === 'string'
        ? req.query.workspaceId.trim()
        : ''

    if (!departmentId || !workspaceId) {
      return res.status(400).json({
        error: 'department id and workspaceId are required',
      })
    }

    const membership = await getMembership(userId, workspaceId)

    if (!membership) {
      return res.status(403).json({ error: 'Workspace access denied' })
    }

    if (!['owner', 'admin'].includes(membership.role)) {
      return res.status(403).json({
        error: 'Only workspace owners and admins can remove departments',
      })
    }

    const existing = await db
      .select({
        id: departments.id,
      })
      .from(departments)
      .where(
        and(
          eq(departments.id, departmentId),
          eq(departments.workspaceId, workspaceId),
        ),
      )
      .limit(1)

    if (existing.length === 0) {
      return res.status(404).json({ error: 'Department not found' })
    }

    await db
      .update(departments)
      .set({ status: 'inactive' })
      .where(
        and(
          eq(departments.id, departmentId),
          eq(departments.workspaceId, workspaceId),
        ),
      )

    return res.json({
      ok: true,
      message: 'Department deactivated',
    })
  } catch (error: any) {
    return res.status(500).json({
      error: error?.message || 'Failed to remove department',
    })
  }
})
