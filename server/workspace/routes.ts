import { requireWorkspaceAccess } from '../middleware/tenantAuth';
﻿import { Router } from 'express'
import { randomBytes } from 'crypto'
import { and, desc, eq, isNull, or, inArray } from 'drizzle-orm'
import { db } from '../db'
import { getAuthenticatedUserId, getMembership, requireWorkspaceMembership, requireWorkspaceRole } from '../auth/middleware'
import { hashSessionToken, normalizeEmail } from '../auth/service'
import { resolveAuthorizationContext, assertPermission } from '../auth/authorization'
import { attendanceRecords, clients, departments, employees, memberships, notifications, projects, projectAccess, reminders, salesActivities, salesLeads, workspaceInvitations, users, roles, permissions, rolePermissions } from '../db/app-schema'

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

workspaceRoutes.get('/roles', async (req, res) => { try { const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : ''; if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' }); const context = await resolveAuthorizationContext(req, workspaceId); assertPermission(context, 'people.manage'); const roleRows = await db.select({ id: roles.id, workspaceId: roles.workspaceId, name: roles.name, code: roles.code, description: roles.description, scope: roles.scope, isSystemRole: roles.isSystemRole, status: roles.status }).from(roles).where(eq(roles.status, 'active')); const workspaceRoles = roleRows.filter((role: any) => role.workspaceId === workspaceId || role.workspaceId === null); const permissionRows = await db.select({ roleId: rolePermissions.roleId, permissionId: rolePermissions.permissionId }).from(rolePermissions); const allPermissions = await db.select({ id: permissions.id, code: permissions.code, name: permissions.name, module: permissions.module, description: permissions.description }).from(permissions); const permissionMap = new Map(allPermissions.map((permission: any) => [permission.id, permission])); const result = workspaceRoles.map((role: any) => ({ ...role, permissions: permissionRows.filter((link: any) => link.roleId === role.id).map((link: any) => permissionMap.get(link.permissionId)).filter(Boolean) })); return res.json({ roles: result, authorization: { realRole: context.realRole, simulation: context.simulation } }); } catch (error: any) { const status = error?.message?.startsWith('Permission denied') ? 403 : 500; return res.status(status).json({ error: error?.message || 'Failed to fetch workspace roles' }); } })

workspaceRoutes.post('/invitations', async (req, res) => {
  try {
    const userId = requireUser(req)
    const workspaceId = typeof req.body?.workspaceId === 'string' ? req.body.workspaceId.trim() : ''
    const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : ''
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const role = typeof req.body?.role === 'string' ? req.body.role.trim().toLowerCase() : ''
    const department = typeof req.body?.department === 'string' ? req.body.department.trim() : ''
    const portalRole = typeof req.body?.portalRole === 'string' ? req.body.portalRole.trim() : ''

    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' })
    await requireWorkspaceRole(req, workspaceId, ['owner', 'admin', 'manager'])

    if (!email) return res.status(400).json({ error: 'Email is required' })
    if (!['employee', 'client'].includes(role)) return res.status(400).json({ error: 'Invalid invitation role' })

    if (role === 'client' && (department || portalRole)) {
      return res.status(400).json({ error: 'Department and portalRole are only valid for employee invitations' })
    }

    const token = randomBytes(32).toString('base64url')
    const [invite] = await db.insert(workspaceInvitations).values({
      workspaceId,
      invitedByUserId: userId,
      email,
      role,
      department: role === 'employee' && department ? department : null,
      portalRole: role === 'employee' && portalRole ? portalRole : null,
      name: name || null,
      tokenHash: hashSessionToken(token),
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }).returning({
      id: workspaceInvitations.id,
      workspaceId: workspaceInvitations.workspaceId,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      department: workspaceInvitations.department,
      portalRole: workspaceInvitations.portalRole,
      name: workspaceInvitations.name,
      status: workspaceInvitations.status,
      expiresAt: workspaceInvitations.expiresAt,
      createdAt: workspaceInvitations.createdAt,
    })

    return res.status(201).json({ invitation: invite, inviteToken: token })
  } catch (error: any) {
    const status = error?.status === 403 ? 403 : 500
    return res.status(status).json({ error: error?.message || 'Failed to create invitation' })
  }
})

workspaceRoutes.get('/invitations', async (req, res) => {
  try {
    const userId = requireUser(req)
    const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : ''
    if (!workspaceId) return res.status(400).json( { error: 'workspaceId is required' })
    const membership = await getMembership(userId, workspaceId)
    if (!membership) return res.status(403).json({ error: 'Workspace access denied' })
    const rows = await db.select({ id: workspaceInvitations.id, workspaceId: workspaceInvitations.workspaceId, invitedByUserId: workspaceInvitations.invitedByUserId, email: workspaceInvitations.email, role: workspaceInvitations.role, department: workspaceInvitations.department, portalRole: workspaceInvitations.portalRole, name: workspaceInvitations.name, status: workspaceInvitations.status, expiresAt: workspaceInvitations.expiresAt, acceptedByUserId: workspaceInvitations.acceptedByUserId, acceptedAt: workspaceInvitations.acceptedAt, createdAt: workspaceInvitations.createdAt }).from(workspaceInvitations).where(eq(workspaceInvitations.workspaceId, workspaceId)).orderBy(desc(workspaceInvitations.createdAt))
    return res.json( { invitations: rows })
  } catch (error: any) {
    return res.status(500).json( { error: error?.message || 'Failed to fetch invitations' })
  }
})

