import { requireWorkspaceAccess } from '../middleware/tenantAuth';
﻿import { Router } from 'express'
import { randomBytes } from 'crypto'
import { and, desc, eq, gt, isNull, or, inArray } from 'drizzle-orm'
import { db } from '../db'
import { initializeWorkspaceRbac } from '../auth/workspaceRbac'
import { getAuthenticatedUserId, getMembership, requireWorkspaceMembership, requireWorkspaceRole } from '../auth/middleware'
import { hashSessionToken, normalizeEmail } from '../auth/service'
import { resolveAuthorizationContext, assertPermission } from '../auth/authorization'
import { attendanceRecords, clients, departments, employees, memberships, notifications, projects, projectAccess, reminders, salesActivities, salesLeads, workspaceInvitations, users, roles, permissions, rolePermissions, userRoles } from '../db/app-schema'

export const workspaceRoutes = Router()

const SYSTEM_ROLE_CODES = new Set(['OWNER', 'ADMIN', 'SALES', 'EMPLOYEE', 'FINANCE', 'HR', 'CLIENT'])

function requireUser(req: import('express').Request) {
  return getAuthenticatedUserId(req)
}

async function requireWorkspaceRoleAccess(req: import('express').Request, workspaceId: string) {
  const context = await resolveAuthorizationContext(req, workspaceId)
  assertPermission(context, 'people.manage')
  return context
}

function normalizeRoleCode(value: string) {
  const normalized = value.trim().replace(/[^a-zA-Z0-9_.-]+/g, '_').replace(/^_+|_+$/g, '')
  if (!normalized) {
    throw new Error('Role code is required')
  }

  if (normalized.length > 64) {
    throw new Error('Role code is too long')
  }

  return normalized.toUpperCase()
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

workspaceRoutes.get('/permissions', async (req, res) => {
  try {
    const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : ''
    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' })
    }

    await requireWorkspaceRoleAccess(req, workspaceId)

    const permissionRows = await db.select({
      id: permissions.id,
      code: permissions.code,
      name: permissions.name,
      module: permissions.module,
      description: permissions.description,
    }).from(permissions).orderBy(permissions.module, permissions.name)

    return res.json({ permissions: permissionRows })
  } catch (error: any) {
    const status = error?.message?.startsWith('Permission denied') ? 403 : 500
    return res.status(status).json({ error: error?.message || 'Failed to fetch permissions' })
  }
})

workspaceRoutes.get('/roles', async (req, res) => { try { const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : ''; if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' }); const context = await resolveAuthorizationContext(req, workspaceId); assertPermission(context, 'people.manage'); const roleRows = await db.select({ id: roles.id, workspaceId: roles.workspaceId, name: roles.name, code: roles.code, description: roles.description, scope: roles.scope, isSystemRole: roles.isSystemRole, status: roles.status }).from(roles).where(eq(roles.status, 'active')); const workspaceRoles = roleRows.filter((role: any) => role.workspaceId === workspaceId || role.workspaceId === null); const permissionRows = await db.select({ roleId: rolePermissions.roleId, permissionId: rolePermissions.permissionId }).from(rolePermissions); const allPermissions = await db.select({ id: permissions.id, code: permissions.code, name: permissions.name, module: permissions.module, description: permissions.description }).from(permissions); const permissionMap = new Map(allPermissions.map((permission: any) => [permission.id, permission])); const result = workspaceRoles.map((role: any) => ({ ...role, permissions: permissionRows.filter((link: any) => link.roleId === role.id).map((link: any) => permissionMap.get(link.permissionId)).filter(Boolean) })); return res.json({ roles: result, authorization: { realRole: context.realRole, simulation: context.simulation } }); } catch (error: any) { const status = error?.message?.startsWith('Permission denied') ? 403 : 500; return res.status(status).json({ error: error?.message || 'Failed to fetch workspace roles' }); } })

workspaceRoutes.post('/roles', async (req, res) => {
  try {
    const workspaceId = typeof req.body?.workspaceId === 'string' ? req.body.workspaceId.trim() : ''
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const code = typeof req.body?.code === 'string' ? req.body.code.trim() : ''
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : ''

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' })
    }

    if (!name) {
      return res.status(400).json({ error: 'Role name is required' })
    }

    const normalizedCode = normalizeRoleCode(code)
    if (SYSTEM_ROLE_CODES.has(normalizedCode)) {
      return res.status(400).json({ error: 'This role code is reserved for a system role' })
    }

    await requireWorkspaceRoleAccess(req, workspaceId)

    const roleExists = await db.select({ id: roles.id }).from(roles).where(and(eq(roles.workspaceId, workspaceId), eq(roles.code, normalizedCode))).limit(1)
    if (roleExists.length > 0) {
      return res.status(409).json({ error: 'A role with this code already exists in this workspace' })
    }

    const [createdRole] = await db.insert(roles).values({
      workspaceId,
      name,
      code: normalizedCode,
      description: description || null,
      scope: 'workspace',
      isSystemRole: false,
      status: 'active',
    }).returning({
      id: roles.id,
      workspaceId: roles.workspaceId,
      name: roles.name,
      code: roles.code,
      description: roles.description,
      scope: roles.scope,
      isSystemRole: roles.isSystemRole,
      status: roles.status,
    })

    return res.status(201).json({ role: createdRole })
  } catch (error: any) {
    const status = error?.message?.startsWith('Permission denied') ? 403 : 500
    return res.status(status).json({ error: error?.message || 'Failed to create workspace role' })
  }
})

workspaceRoutes.patch('/roles/:roleId', async (req, res) => {
  try {
    const workspaceId = typeof req.body?.workspaceId === 'string' ? req.body.workspaceId.trim() : ''
    const roleId = typeof req.params?.roleId === 'string' ? req.params.roleId.trim() : ''

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' })
    }

    if (!roleId) {
      return res.status(400).json({ error: 'roleId is required' })
    }

    await requireWorkspaceRoleAccess(req, workspaceId)

    const existingRoles = await db.select({
      id: roles.id,
      workspaceId: roles.workspaceId,
      name: roles.name,
      code: roles.code,
      description: roles.description,
      scope: roles.scope,
      isSystemRole: roles.isSystemRole,
      status: roles.status,
    }).from(roles).where(and(eq(roles.id, roleId), eq(roles.workspaceId, workspaceId))).limit(1)

    const existingRole = existingRoles[0]
    if (!existingRole) {
      return res.status(404).json({ error: 'Role not found in this workspace' })
    }

    if (existingRole.isSystemRole) {
      return res.status(403).json({ error: 'System roles are protected and cannot be edited' })
    }

    const nextName = typeof req.body?.name === 'string' ? req.body.name.trim() : existingRole.name
    const nextDescription = typeof req.body?.description === 'string' ? req.body.description.trim() : existingRole.description || null
    const nextStatus = typeof req.body?.status === 'string' ? req.body.status.trim().toLowerCase() : existingRole.status
    const nextCode = typeof req.body?.code === 'string' ? req.body.code.trim() : existingRole.code

    if (!nextName) {
      return res.status(400).json({ error: 'Role name is required' })
    }

    if (!['active', 'inactive'].includes(nextStatus)) {
      return res.status(400).json({ error: 'Invalid role status' })
    }

    const normalizedCode = normalizeRoleCode(nextCode)
    if (SYSTEM_ROLE_CODES.has(normalizedCode) && normalizedCode !== existingRole.code) {
      return res.status(400).json({ error: 'This role code is reserved for a system role' })
    }

    if (normalizedCode !== existingRole.code) {
      const roleExists = await db.select({ id: roles.id }).from(roles).where(and(eq(roles.workspaceId, workspaceId), eq(roles.code, normalizedCode))).limit(1)
      if (roleExists.length > 0) {
        return res.status(409).json({ error: 'A role with this code already exists in this workspace' })
      }
    }

    const [updatedRole] = await db.update(roles).set({
      name: nextName,
      code: normalizedCode,
      description: nextDescription,
      status: nextStatus,
    }).where(and(eq(roles.id, roleId), eq(roles.workspaceId, workspaceId))).returning({
      id: roles.id,
      workspaceId: roles.workspaceId,
      name: roles.name,
      code: roles.code,
      description: roles.description,
      scope: roles.scope,
      isSystemRole: roles.isSystemRole,
      status: roles.status,
    })

    return res.json({ role: updatedRole })
  } catch (error: any) {
    const status = error?.message?.startsWith('Permission denied') ? 403 : 500
    return res.status(status).json({ error: error?.message || 'Failed to update workspace role' })
  }
})

workspaceRoutes.post('/roles/:roleId/permissions', async (req, res) => {
  try {
    const workspaceId = typeof req.body?.workspaceId === 'string' ? req.body.workspaceId.trim() : ''
    const roleId = typeof req.params?.roleId === 'string' ? req.params.roleId.trim() : ''
    const permissionCodes = Array.isArray(req.body?.permissionCodes)
      ? req.body.permissionCodes.map((item: unknown) => typeof item === 'string' ? item.trim() : '').filter(Boolean)
      : []
    const permissionIds = Array.isArray(req.body?.permissionIds)
      ? req.body.permissionIds.map((item: unknown) => typeof item === 'string' ? item.trim() : '').filter(Boolean)
      : []

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' })
    }

    if (!roleId) {
      return res.status(400).json({ error: 'roleId is required' })
    }

    if (permissionCodes.length === 0 && permissionIds.length === 0) {
      return res.status(400).json({ error: 'At least one permission is required' })
    }

    await requireWorkspaceRoleAccess(req, workspaceId)

    const existingRoleRows = await db.select({
      id: roles.id,
      workspaceId: roles.workspaceId,
      isSystemRole: roles.isSystemRole,
      status: roles.status,
    }).from(roles).where(and(eq(roles.id, roleId), eq(roles.workspaceId, workspaceId))).limit(1)

    const existingRole = existingRoleRows[0]
    if (!existingRole) {
      return res.status(404).json({ error: 'Role not found in this workspace' })
    }

    if (existingRole.isSystemRole) {
      return res.status(403).json({ error: 'System roles are protected and cannot have their permissions re-assigned' })
    }

    const catalogRows = await db.select({
      id: permissions.id,
      code: permissions.code,
      name: permissions.name,
      module: permissions.module,
      description: permissions.description,
    }).from(permissions)

    const catalogById = new Map<string, any>(catalogRows.map((item: any) => [String(item.id), item]))
    const catalogByCode = new Map<string, any>(catalogRows.map((item: any) => [String(item.code), item]))

    const requestedPermissionIds = new Set<string>()

    for (const permissionCode of permissionCodes) {
      const match = catalogByCode.get(permissionCode)
      if (!match) {
        return res.status(400).json({ error: `Permission code not found: ${permissionCode}` })
      }
      requestedPermissionIds.add(String(match.id))
    }

    for (const permissionId of permissionIds) {
      const match = catalogById.get(String(permissionId))
      if (!match) {
        return res.status(400).json({ error: `Permission not found: ${permissionId}` })
      }
      requestedPermissionIds.add(String(permissionId))
    }

    await db.delete(rolePermissions).where(eq(rolePermissions.roleId, roleId))

    if (requestedPermissionIds.size > 0) {
      await db.insert(rolePermissions).values(Array.from(requestedPermissionIds).map((permissionId) => ({
        roleId,
        permissionId,
      }))).onConflictDoNothing()
    }

    const updatedLinks = await db.select({
      roleId: rolePermissions.roleId,
      permissionId: rolePermissions.permissionId,
    }).from(rolePermissions).where(eq(rolePermissions.roleId, roleId))

    return res.json({
      roleId,
      permissions: updatedLinks.map((link: any) => catalogById.get(link.permissionId)).filter(Boolean),
    })
  } catch (error: any) {
    const status = error?.message?.startsWith('Permission denied') ? 403 : 500
    return res.status(status).json({ error: error?.message || 'Failed to update role permissions' })
  }
})

workspaceRoutes.delete('/roles/:roleId', async (req, res) => {
  try {
    const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : ''
    const roleId = typeof req.params?.roleId === 'string' ? req.params.roleId.trim() : ''

    if (!workspaceId) {
      return res.status(400).json({ error: 'workspaceId is required' })
    }

    if (!roleId) {
      return res.status(400).json({ error: 'roleId is required' })
    }

    await requireWorkspaceRoleAccess(req, workspaceId)

    const row = await db.select({
      id: roles.id,
      workspaceId: roles.workspaceId,
      isSystemRole: roles.isSystemRole,
      status: roles.status,
    }).from(roles).where(and(eq(roles.id, roleId), eq(roles.workspaceId, workspaceId))).limit(1)

    if (!row[0]) {
      return res.status(404).json({ error: 'Role not found in this workspace' })
    }

    if (row[0].isSystemRole) {
      return res.status(403).json({ error: 'System roles are protected and cannot be deleted' })
    }

    await db.update(roles).set({ status: 'inactive' }).where(and(eq(roles.id, roleId), eq(roles.workspaceId, workspaceId)))

    return res.json({ ok: true, status: 'inactive' })
  } catch (error: any) {
    const status = error?.message?.startsWith('Permission denied') ? 403 : 500
    return res.status(status).json({ error: error?.message || 'Failed to deactivate workspace role' })
  }
})

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

workspaceRoutes.post('/invitations/:id/accept', async (req, res) => {
  try {
    const userId = requireUser(req)
    const invitationId = typeof req.params.id === 'string' ? req.params.id.trim() : ''
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : ''

    if (!invitationId || !token) {
      return res.status(400).json({ error: 'Invitation ID and token are required' })
    }

    const tokenHash = hashSessionToken(token)
    const invitationRows = await db.select().from(workspaceInvitations)
      .where(and(
        eq(workspaceInvitations.id, invitationId),
        eq(workspaceInvitations.tokenHash, tokenHash),
      ))
      .limit(1)

    const invitation = invitationRows[0]

    if (!invitation) {
      return res.status(400).json({ error: 'Invalid invitation or token' })
    }

    if (invitation.status !== 'pending') {
      return res.status(409).json({ error: 'Invitation is no longer pending' })
    }

    if (new Date(invitation.expiresAt).getTime() <= Date.now()) {
      await db.update(workspaceInvitations)
        .set({ status: 'expired' })
        .where(and(
          eq(workspaceInvitations.id, invitation.id),
          eq(workspaceInvitations.status, 'pending'),
        ))
      return res.status(410).json({ error: 'Invitation has expired' })
    }

    const userRows = await db.select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      status: users.status,
    }).from(users).where(eq(users.id, userId)).limit(1)

    const user = userRows[0]

    if (!user || user.status !== 'active') {
      return res.status(403).json({ error: 'An active user account is required' })
    }

    if (normalizeEmail(user.email) !== normalizeEmail(invitation.email)) {
      return res.status(403).json({
        error: 'Sign in with the email address that received this invitation',
      })
    }

    const invitedRole = String(invitation.role).toLowerCase()

    if (invitedRole !== 'employee' && invitedRole !== 'client') {
      return res.status(400).json({ error: 'Unsupported invitation role' })
    }

    const result = await db.transaction(async (tx: any) => {
      const claimedRows = await tx.update(workspaceInvitations)
        .set({
          status: 'accepted',
          acceptedByUserId: userId,
          acceptedAt: new Date(),
        })
        .where(and(
          eq(workspaceInvitations.id, invitation.id),
          eq(workspaceInvitations.tokenHash, tokenHash),
          eq(workspaceInvitations.status, 'pending'),
          gt(workspaceInvitations.expiresAt, new Date()),
        ))
        .returning({
          workspaceId: workspaceInvitations.workspaceId,
          role: workspaceInvitations.role,
          department: workspaceInvitations.department,
          portalRole: workspaceInvitations.portalRole,
          name: workspaceInvitations.name,
          email: workspaceInvitations.email,
        })

      const claimed = claimedRows[0]

      if (!claimed) {
        const error: any = new Error('Invitation was already used or has expired')
        error.status = 409
        throw error
      }

      const membershipRows = await tx.select()
        .from(memberships)
        .where(and(
          eq(memberships.workspaceId, claimed.workspaceId),
          eq(memberships.userId, userId),
        ))
        .limit(1)

      const membership = membershipRows[0]

      if (membership && (
        membership.status !== 'active' ||
        String(membership.role).toLowerCase() !== invitedRole
      )) {
        const error: any = new Error(
          'An existing workspace membership conflicts with this invitation'
        )
        error.status = 409
        throw error
      }

      if (!membership) {
        await tx.insert(memberships).values({
          workspaceId: claimed.workspaceId,
          userId,
          role: invitedRole,
          status: 'active',
        })
      }

      await initializeWorkspaceRbac(tx, claimed.workspaceId)

      const roleCode = invitedRole === 'employee' ? 'EMPLOYEE' : 'CLIENT'

      const roleRows = await tx.select({
        id: roles.id,
      }).from(roles).where(and(
        eq(roles.workspaceId, claimed.workspaceId),
        eq(roles.code, roleCode),
        eq(roles.status, 'active'),
      )).limit(1)

      const workspaceRole = roleRows[0]

      if (!workspaceRole) {
        const error: any = new Error(
          'The required workspace role is not configured'
        )
        error.status = 500
        throw error
      }

      await tx.insert(userRoles).values({
        workspaceId: claimed.workspaceId,
        userId,
        roleId: workspaceRole.id,
        status: 'active',
      }).onConflictDoNothing()

      if (invitedRole === 'employee') {
        const employeeRows = await tx.select({
          id: employees.id,
          userId: employees.userId,
        }).from(employees).where(and(
          eq(employees.workspaceId, claimed.workspaceId),
          or(
            eq(employees.userId, userId),
            eq(employees.email, user.email),
          ),
        )).limit(1)

        const employee = employeeRows[0]
        const employeeValues = {
          userId,
          name: claimed.name || user.displayName,
          department: claimed.department || null,
          portalRole: claimed.portalRole || null,
          email: user.email,
          status: 'active',
        }

        if (employee) {
          await tx.update(employees)
            .set(employeeValues)
            .where(and(
              eq(employees.id, employee.id),
              eq(employees.workspaceId, claimed.workspaceId),
            ))
        } else {
          await tx.insert(employees).values({
            workspaceId: claimed.workspaceId,
            ...employeeValues,
          })
        }
      } else {
        const clientRows = await tx.select({
          id: clients.id,
        }).from(clients).where(and(
          eq(clients.workspaceId, claimed.workspaceId),
          eq(clients.email, user.email),
        )).limit(1)

        const client = clientRows[0]
        const clientValues = {
          name: claimed.name || user.displayName,
          email: user.email,
          ownerUserId: userId,
          status: 'active',
        }

        if (client) {
          await tx.update(clients)
            .set(clientValues)
            .where(and(
              eq(clients.id, client.id),
              eq(clients.workspaceId, claimed.workspaceId),
            ))
        } else {
          await tx.insert(clients).values({
            workspaceId: claimed.workspaceId,
            ...clientValues,
          })
        }
      }

      return {
        workspaceId: claimed.workspaceId,
        role: invitedRole,
      }
    })

    return res.json({ accepted: true, ...result })
  } catch (error: any) {
    const status = error?.status ||
      (error?.message === 'Permission denied' ? 403 : 500)

    return res.status(status).json({
      error: error?.message || 'Failed to accept invitation',
    })
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

