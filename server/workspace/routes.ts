import { Router } from 'express'
import { randomBytes } from 'crypto'
import { and, desc, eq, isNull, or, inArray } from 'drizzle-orm'
import { db } from '../db'
import { getAuthenticatedUserId, getMembership, requireWorkspaceMembership, requireWorkspaceRole } from '../auth/middleware'
import { hashSessionToken, normalizeEmail } from '../auth/service'
import { attendanceRecords, clients, employees, memberships, notifications, projects, projectAccess, reminders, salesActivities, salesLeads, workspaceInvitations, users } from '../db/app-schema'

export const workspaceRoutes = Router()

function requireUser(req: import('express').Request) {
  return getAuthenticatedUserId(req)
}

workspaceRoutes.use((_req, _res, next) => next())

workspaceRoutes.get('/memberships', async (req, res) => {
  try {
    const userId = requireUser(req)
    const rows = await db.select({
      workspaceId: memberships.workspaceId,
      role: memberships.role,
      status: memberships.status,
      department: employees.department,
      portalRole: employees.portalRole,
    })
      .from(memberships)
      .leftJoin(employees, and(
        eq(employees.workspaceId, memberships.workspaceId),
        eq(employees.userId, memberships.userId),
        eq(employees.status, 'active')
      ))
      .where(and(
        eq(memberships.userId, userId),
        eq(memberships.status, 'active')
      ))

    return res.json({ memberships: rows })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch memberships' })
  }
})

workspaceRoutes.get('/context/:workspaceId', async (req, res) => {
  try {
    const userId = requireUser(req)
    const membership = await getMembership(userId, req.params.workspaceId)
    if (!membership) return res.status(403).json({ error: 'Workspace access denied' })
    res.json({ workspaceId: membership.workspaceId, userId: membership.userId, role: membership.role })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to resolve workspace context' })
  }
})

workspaceRoutes.get('/invitations', async (req, res) => {
  try {
    const workspaceId = typeof req.query.workspaceId === 'string' ? req.query.workspaceId.trim() : ''
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' })

    await requireWorkspaceRole(req, workspaceId, ['owner', 'admin', 'manager', 'hr', 'sales'])

    const rows = await db.select({
      id: workspaceInvitations.id,
      workspaceId: workspaceInvitations.workspaceId,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      department: workspaceInvitations.department,
      portalRole: workspaceInvitations.portalRole,
      name: workspaceInvitations.name,
      status: workspaceInvitations.status,
      expiresAt: workspaceInvitations.expiresAt,
      acceptedByUserId: workspaceInvitations.acceptedByUserId,
      acceptedAt: workspaceInvitations.acceptedAt,
      createdAt: workspaceInvitations.createdAt,
    })
      .from(workspaceInvitations)
      .where(eq(workspaceInvitations.workspaceId, workspaceId))
      .orderBy(desc(workspaceInvitations.createdAt))

    return res.json({ invitations: rows })
  } catch (error: any) {
    const status = error?.status === 403 ? 403 : 500
    return res.status(status).json({ error: error.message || 'Failed to fetch workspace invitations' })
  }
})

workspaceRoutes.post('/invitations', async (req, res) => {
  try {
    const workspaceId = typeof req.body?.workspaceId === 'string' ? req.body.workspaceId.trim() : ''
    const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : ''
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : ''
    const role = typeof req.body?.role === 'string' ? req.body.role.trim().toLowerCase() : ''
    const department = typeof req.body?.department === 'string' ? req.body.department.trim().toLowerCase() : ''
    const portalRole = typeof req.body?.portalRole === 'string' ? req.body.portalRole.trim().toLowerCase() : ''

    if (!workspaceId || !email || !role) {
      return res.status(400).json({ error: 'workspaceId, email, and role are required' })
    }
    if (!['employee', 'client'].includes(role)) {
      return res.status(400).json({ error: 'Invitation role must be employee or client' })
    }
    if (role === 'employee') {
      const validPortalRoles = ['finance', 'hr', 'sales', 'services', 'manager']
      if (!portalRole || !validPortalRoles.includes(portalRole)) {
        return res.status(400).json({ error: 'Employee portalRole must be finance, hr, sales, services, or manager' })
      }
      if (!department) return res.status(400).json({ error: 'Employee department is required' })
    }
    if (!email.includes('@') || email.length > 320) {
      return res.status(400).json({ error: 'A valid email address is required' })
    }

    const allowedRoles = role === 'employee'
      ? ['owner', 'admin', 'manager', 'hr'] as const
      : ['owner', 'admin', 'manager', 'sales'] as const
    await requireWorkspaceRole(req, workspaceId, [...allowedRoles])

    const [existingPending] = await db.select({ id: workspaceInvitations.id })
      .from(workspaceInvitations)
      .where(and(
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.email, email),
        eq(workspaceInvitations.role, role),
        eq(workspaceInvitations.status, 'pending')
      ))
      .limit(1)

    if (existingPending) {
      return res.status(409).json({ error: 'A pending invitation already exists for this email and role' })
    }

    const token = randomBytes(32).toString('hex')
    const tokenHash = hashSessionToken(token)
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    const invitedByUserId = getAuthenticatedUserId(req)

    const [invitation] = await db.insert(workspaceInvitations).values({
      workspaceId,
      invitedByUserId,
      email,
      role,
      department: role === 'employee' ? department : null,
      portalRole: role === 'employee' ? portalRole : null,
      name: name || null,
      tokenHash,
      status: 'pending',
      expiresAt,
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

    return res.status(201).json({
      invitation,
      inviteToken: token,
      note: 'The raw invitation token is returned once for the upcoming email-delivery integration.'
    })
  } catch (error: any) {
    const status = error?.status === 403 ? 403 : 500
    return res.status(status).json({ error: error.message || 'Failed to create workspace invitation' })
  }
})

workspaceRoutes.post('/invitations/:id/withdraw', async (req, res) => {
  try {
    const workspaceId = typeof req.body?.workspaceId === 'string' ? req.body.workspaceId.trim() : ''
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' })

    await requireWorkspaceRole(req, workspaceId, ['owner', 'admin', 'manager', 'hr', 'sales'])

    const [invitation] = await db.select({ id: workspaceInvitations.id })
      .from(workspaceInvitations)
      .where(and(
        eq(workspaceInvitations.id, req.params.id),
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.status, 'pending')
      ))
      .limit(1)

    if (!invitation) return res.status(404).json({ error: 'Pending invitation not found' })

    await db.update(workspaceInvitations)
      .set({ status: 'withdrawn' })
      .where(and(
        eq(workspaceInvitations.id, invitation.id),
        eq(workspaceInvitations.workspaceId, workspaceId),
        eq(workspaceInvitations.status, 'pending')
      ))

    return res.status(204).end()
  } catch (error: any) {
    const status = error?.status === 403 ? 403 : 500
    return res.status(status).json({ error: error.message || 'Failed to withdraw workspace invitation' })
  }
})

workspaceRoutes.post('/invitations/:id/accept', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)
    const token = typeof req.body?.token === 'string' ? req.body.token.trim() : ''
    if (!token) return res.status(400).json({ error: 'Invitation token is required' })

    const tokenHash = hashSessionToken(token)
    const [invitation] = await db.select({
      id: workspaceInvitations.id,
      workspaceId: workspaceInvitations.workspaceId,
      email: workspaceInvitations.email,
      role: workspaceInvitations.role,
      department: workspaceInvitations.department,
      portalRole: workspaceInvitations.portalRole,
      name: workspaceInvitations.name,
      status: workspaceInvitations.status,
      expiresAt: workspaceInvitations.expiresAt,
    })
      .from(workspaceInvitations)
      .where(and(
        eq(workspaceInvitations.id, req.params.id),
        eq(workspaceInvitations.tokenHash, tokenHash)
      ))
      .limit(1)

    if (!invitation) return res.status(404).json({ error: 'Invitation not found' })
    if (invitation.status !== 'pending') {
      return res.status(409).json({ error: `Invitation is already ${invitation.status}` })
    }
    if (invitation.expiresAt <= new Date()) {
      await db.update(workspaceInvitations)
        .set({ status: 'expired' })
        .where(and(eq(workspaceInvitations.id, invitation.id), eq(workspaceInvitations.status, 'pending')))
      return res.status(410).json({ error: 'Invitation has expired' })
    }
    if (!['employee', 'client'].includes(invitation.role)) {
      return res.status(400).json({ error: 'Unsupported invitation role' })
    }

    const [user] = await db.select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      status: users.status,
    })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user) return res.status(404).json({ error: 'User account not found' })
    if (user.status !== 'active') return res.status(403).json({ error: 'User account is inactive' })
    if (normalizeEmail(user.email) !== invitation.email) {
      return res.status(403).json({ error: 'This invitation was issued to a different email address' })
    }

    const [existingMembership] = await db.select({ id: memberships.id, role: memberships.role, status: memberships.status })
      .from(memberships)
      .where(and(
        eq(memberships.workspaceId, invitation.workspaceId),
        eq(memberships.userId, userId)
      ))
      .limit(1)

    if (existingMembership) {
      return res.status(409).json({ error: 'User is already associated with this workspace' })
    }

    await db.transaction(async (tx) => {
      await tx.insert(memberships).values({
        workspaceId: invitation.workspaceId,
        userId,
        role: invitation.role,
        status: 'active',
      })

      if (invitation.role === 'employee') {
        const [existingEmployee] = await tx.select({ id: employees.id })
          .from(employees)
          .where(and(
            eq(employees.workspaceId, invitation.workspaceId),
            eq(employees.email, invitation.email)
          ))
          .limit(1)

        if (existingEmployee) {
          await tx.update(employees)
            .set({
              userId,
              name: invitation.name || user.displayName,
              department: invitation.department,
              portalRole: invitation.portalRole || 'services',
              status: 'active'
            })
            .where(eq(employees.id, existingEmployee.id))
        } else {
          await tx.insert(employees).values({
            workspaceId: invitation.workspaceId,
            userId,
            name: invitation.name || user.displayName,
            department: invitation.department,
            portalRole: invitation.portalRole || 'services',
            email: invitation.email,
            status: 'active',
          })
        }
      } else {
        const [existingClient] = await tx.select({ id: clients.id })
          .from(clients)
          .where(and(
            eq(clients.workspaceId, invitation.workspaceId),
            eq(clients.email, invitation.email)
          ))
          .limit(1)

        if (!existingClient) {
          await tx.insert(clients).values({
            workspaceId: invitation.workspaceId,
            name: invitation.name || user.displayName,
            email: invitation.email,
            status: 'active',
          })
        }
      }

      await tx.update(workspaceInvitations)
        .set({
          status: 'accepted',
          acceptedByUserId: userId,
          acceptedAt: new Date(),
        })
        .where(and(
          eq(workspaceInvitations.id, invitation.id),
          eq(workspaceInvitations.tokenHash, tokenHash),
          eq(workspaceInvitations.status, 'pending')
        ))
    })

    return res.status(201).json({
      accepted: true,
      workspaceId: invitation.workspaceId,
      role: invitation.role,
      message: 'Invitation accepted. Project access must be assigned separately.'
    })
  } catch (error: any) {
    const status = error?.status === 403 ? 403 : 500
    return res.status(status).json({ error: error.message || 'Failed to accept workspace invitation' })
  }
})

workspaceRoutes.get('/notifications', async (req, res) => {
  try {
    const userId = requireUser(req)
    const rows = await db.select({ notification: notifications })
      .from(notifications)
      .innerJoin(memberships, and(
        eq(memberships.workspaceId, notifications.workspaceId),
        eq(memberships.userId, userId),
        eq(memberships.status, 'active')
      ))
      .where(and(eq(notifications.recipientUserId, userId), isNull(notifications.readAt)))
      .orderBy(desc(notifications.createdAt))
      .limit(50)
    res.json({ notifications: rows.map((row: any) => row.notification) })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch notifications' })
  }
})

workspaceRoutes.post('/notifications/:id/read', async (req, res) => {
  try {
    const userId = requireUser(req)
    const [notification] = await db.select({ id: notifications.id })
      .from(notifications)
      .innerJoin(memberships, and(
        eq(memberships.workspaceId, notifications.workspaceId),
        eq(memberships.userId, userId),
        eq(memberships.status, 'active')
      ))
      .where(and(
        eq(notifications.id, req.params.id),
        eq(notifications.recipientUserId, userId)
      ))
      .limit(1)

    if (!notification) return res.status(404).json({ error: 'Notification not found' })

    await db.update(notifications)
      .set({ readAt: new Date() })
      .where(and(
        eq(notifications.id, notification.id),
        eq(notifications.recipientUserId, userId)
      ))

    res.status(204).end()
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update notification' })
  }
})

workspaceRoutes.get('/clients', async (req, res) => {
  try {
    const userId = requireUser(req)
    const workspaceId = req.query.workspaceId
    if (typeof workspaceId !== 'string' || !workspaceId.trim()) return res.status(400).json({ error: 'workspaceId is required' })
    const membership = await getMembership(userId, workspaceId)
    if (!membership) return res.status(403).json({ error: 'Workspace access denied' })

    const privateRoles = ['client', 'employee']
    if (privateRoles.includes(membership.role)) {
      const rows = await db.select({ client: clients })
        .from(clients)
        .innerJoin(projects, eq(projects.clientId, clients.id))
        .innerJoin(projectAccess, eq(projectAccess.projectId, projects.id))
        .where(and(
          eq(clients.workspaceId, membership.workspaceId),
          eq(projects.workspaceId, membership.workspaceId),
          eq(projectAccess.workspaceId, membership.workspaceId),
          eq(projectAccess.userId, userId)
        ))
      const uniqueClients = Array.from(new Map(rows.map((row: any) => [row.client.id, row.client])).values())
      return res.json({
        clients: uniqueClients.map((client: any) => ({
          id: client.id,
          status: client.status,
        }))
      })
    }

    const rows = await db.select({ client: clients })
      .from(clients)
      .where(eq(clients.workspaceId, membership.workspaceId))
    res.json({ clients: rows.map((row: any) => row.client) })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch clients' })
  }
})

workspaceRoutes.get('/projects', async (req, res) => {
  try {
    const userId = requireUser(req)
    const workspaceId = req.query.workspaceId
    if (typeof workspaceId !== 'string' || !workspaceId.trim()) return res.status(400).json({ error: 'workspaceId is required' })
    const membership = await getMembership(userId, workspaceId)
    if (!membership) return res.status(403).json({ error: 'Workspace access denied' })

    const elevatedRoles = ['owner', 'admin', 'manager', 'sales', 'finance', 'hr']
    const isElevated = elevatedRoles.includes(membership.role)

    const rows = isElevated
      ? await db.select({ project: projects })
          .from(projects)
          .where(eq(projects.workspaceId, membership.workspaceId))
      : await db.select({ project: projects })
          .from(projects)
          .innerJoin(projectAccess, eq(projectAccess.projectId, projects.id))
          .where(and(
            eq(projects.workspaceId, membership.workspaceId),
            eq(projectAccess.workspaceId, membership.workspaceId),
            eq(projectAccess.userId, userId)
          ))

    if (membership.role === 'client') {
      return res.json({
        projects: rows.map((row: any) => ({
          id: row.project.id,
          name: row.project.name,
          projectNumber: row.project.projectNumber,
          status: row.project.status,
          startDate: row.project.startDate,
          dueDate: row.project.dueDate,
          metadata: row.project.metadata,
        }))
      })
    }

    if (membership.role === 'employee') {
      return res.json({
        projects: rows.map((row: any) => ({
          id: row.project.id,
          name: row.project.name,
          projectNumber: row.project.projectNumber,
          status: row.project.status,
          startDate: row.project.startDate,
          dueDate: row.project.dueDate,
          metadata: row.project.metadata,
        }))
      })
    }

    res.json({ projects: rows.map((row: any) => row.project) })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch projects' })
  }
})

workspaceRoutes.get('/reminders', async (req, res) => {
  try {
    const userId = requireUser(req)
    const workspaceId = req.query.workspaceId
    if (typeof workspaceId !== 'string' || !workspaceId.trim()) return res.status(400).json({ error: 'workspaceId is required' })

    const membershipRows = await db.select({ role: memberships.role })
      .from(memberships)
      .where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId), eq(memberships.status, 'active')))
      .limit(1)
    if (!membershipRows[0]) return res.status(403).json({ error: 'Workspace access denied' })

    const elevatedRoles = ['owner', 'admin', 'manager', 'sales', 'finance', 'hr']
    const isElevated = elevatedRoles.includes(membershipRows[0].role)

    const rows = isElevated
      ? await db.select({ reminder: reminders })
          .from(reminders)
          .where(eq(reminders.workspaceId, workspaceId))
          .orderBy(reminders.dueAt)
      : await db.select({ reminder: reminders })
          .from(reminders)
          .leftJoin(projectAccess, eq(projectAccess.projectId, reminders.projectId))
          .where(and(
            eq(reminders.workspaceId, workspaceId),
            or(
              eq(reminders.assignedTo, userId),
              and(
                eq(projectAccess.workspaceId, workspaceId),
                eq(projectAccess.userId, userId)
              )
            )
          ))
          .orderBy(reminders.dueAt)
    res.json({ reminders: rows.map((row: any) => row.reminder) })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch reminders' })
  }
})

workspaceRoutes.get('/employees', async (req, res) => {
  try {
    const userId = requireUser(req)
    const workspaceId = req.query.workspaceId
    if (typeof workspaceId !== 'string' || !workspaceId.trim()) {
      return res.status(400).json({ error: 'workspaceId is required' })
    }

    const membership = await getMembership(userId, workspaceId)
    if (!membership) return res.status(403).json({ error: 'Workspace access denied' })

    const elevatedRoles = ['owner', 'admin', 'manager', 'hr']
    if (elevatedRoles.includes(membership.role)) {
      const rows = await db.select({ employee: employees })
        .from(employees)
        .where(and(
          eq(employees.workspaceId, workspaceId),
          eq(employees.status, 'active')
        ))
      return res.json({ employees: rows.map((row: any) => row.employee) })
    }

    const rows = await db.select({ employee: employees })
      .from(employees)
      .innerJoin(projectAccess, eq(projectAccess.userId, employees.userId))
      .innerJoin(projects, eq(projects.id, projectAccess.projectId))
      .where(and(
        eq(employees.workspaceId, workspaceId),
        eq(employees.status, 'active'),
        eq(projects.workspaceId, workspaceId),
        eq(projectAccess.workspaceId, workspaceId),
        eq(projectAccess.userId, userId)
      ))

    const uniqueEmployees = Array.from(new Map(
      rows.map((row: any) => [row.employee.id, row.employee])
    ).values())

    return res.json({
      employees: uniqueEmployees.map((employee: any) => ({
        id: employee.id,
        employeeNumber: employee.employeeNumber,
        displayName: employee.name.trim().split(/\s+/).filter(Boolean).map((part: string) => part[0]).join('').toUpperCase().slice(0, 3) || 'Employee',
        department: employee.department,
        title: employee.title,
        status: employee.status,
      }))
    })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch employees' })
  }
})

workspaceRoutes.get('/sales/leads', async (req, res) => {
  try {
    const userId = requireUser(req)
    const rows = await db.select({ lead: salesLeads }).from(salesLeads).innerJoin(memberships, eq(memberships.workspaceId, salesLeads.workspaceId)).where(and(eq(memberships.userId, userId), eq(salesLeads.ownerUserId, userId))).orderBy(desc(salesLeads.updatedAt))
    res.json({ leads: rows.map((row: any) => row.lead) })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch sales leads' })
  }
})

workspaceRoutes.post('/sales/leads', async (req, res) => {
  try {
    const userId = requireUser(req)
    const { workspaceId, companyName, clientName, companyDescription, scopeOfWork, estimatedValue } = req.body as Record<string, string | undefined>
    if (!workspaceId || !companyName || !clientName || !scopeOfWork) return res.status(400).json({ error: 'workspaceId, companyName, clientName, and scopeOfWork are required' })
    await requireWorkspaceRole(req, workspaceId, ['owner', 'admin', 'manager', 'sales'])
    const [lead] = await db.insert(salesLeads).values({ workspaceId, companyName, clientName, companyDescription, scopeOfWork, estimatedValue: estimatedValue || '0', ownerUserId: userId }).returning()
    res.status(201).json({ lead })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create sales lead' })
  }
})

workspaceRoutes.post('/project-access', async (req, res) => {
  try {
    const { workspaceId, projectId, userId: targetUserId, accessRole } = req.body as Record<string, string | undefined>
    if (!workspaceId || !projectId || !targetUserId || !accessRole) {
      return res.status(400).json({ error: 'workspaceId, projectId, userId, and accessRole are required' })
    }

    await requireWorkspaceRole(req, workspaceId, ['owner', 'admin', 'manager'])

    const [project] = await db.select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.workspaceId, workspaceId)))
      .limit(1)
    if (!project) return res.status(404).json({ error: 'Project not found' })

    const [targetMembership] = await db.select({ userId: memberships.userId })
      .from(memberships)
      .where(and(
        eq(memberships.workspaceId, workspaceId),
        eq(memberships.userId, targetUserId),
        eq(memberships.status, 'active')
      ))
      .limit(1)
    if (!targetMembership) return res.status(404).json({ error: 'Target user is not an active workspace member' })

    const [access] = await db.insert(projectAccess).values({
      workspaceId,
      projectId,
      userId: targetUserId,
      accessRole,
    }).onConflictDoUpdate({
      target: [projectAccess.projectId, projectAccess.userId],
      set: { workspaceId, accessRole },
    }).returning()

    res.status(201).json({ access })
  } catch (error: any) {
    const status = error?.status === 403 ? 403 : 500
    res.status(status).json({ error: error.message || 'Failed to assign project access' })
  }
})

workspaceRoutes.post('/attendance/clock-in', async (req, res) => {
  try {
    const userId = requireUser(req)
    const { workspaceId } = req.body as { workspaceId?: string }
    if (!workspaceId) return res.status(400).json({ error: 'workspaceId is required' })
    const membership = await requireWorkspaceMembership(req, workspaceId)
    if (!['owner', 'admin', 'manager', 'hr', 'employee'].includes(membership.role)) {
      return res.status(403).json({ error: 'Attendance access denied' })
    }
    const employee = await db.select({ id: employees.id })
      .from(employees)
      .where(and(
        eq(employees.workspaceId, workspaceId),
        eq(employees.userId, userId),
        eq(employees.status, 'active')
      ))
      .limit(1)
    if (!employee[0]) return res.status(403).json({ error: 'Employee record required' })

    const today = new Date().toISOString().slice(0, 10)
    const [record] = await db.insert(attendanceRecords).values({ workspaceId, employeeUserId: userId, attendanceDate: today, clockIn: new Date() }).onConflictDoUpdate({ target: [attendanceRecords.workspaceId, attendanceRecords.employeeUserId, attendanceRecords.attendanceDate], set: { clockIn: new Date(), status: 'present' } }).returning()
    res.status(201).json({ attendance: record })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record attendance' })
  }
})

workspaceRoutes.get('/sales/leads/:leadId/activities', async (req, res) => {
  try {
    const userId = requireUser(req)
    const workspaceId = req.query.workspaceId
    if (typeof workspaceId !== 'string' || !workspaceId.trim()) {
      return res.status(400).json({ error: 'workspaceId is required' })
    }

    const membership = await requireWorkspaceRole(req, workspaceId, ['owner', 'admin', 'manager', 'sales'])
    const isElevated = ['owner', 'admin', 'manager'].includes(membership.role)

    const leadConditions = [
      eq(salesLeads.id, req.params.leadId),
      eq(salesLeads.workspaceId, workspaceId),
    ]
    if (!isElevated) leadConditions.push(eq(salesLeads.ownerUserId, userId))

    const [lead] = await db.select({ id: salesLeads.id })
      .from(salesLeads)
      .where(and(...leadConditions))
      .limit(1)

    if (!lead) return res.status(404).json({ error: 'Lead not found' })

    const rows = await db.select({ activity: salesActivities })
      .from(salesActivities)
      .where(and(
        eq(salesActivities.workspaceId, workspaceId),
        eq(salesActivities.leadId, req.params.leadId)
      ))
      .orderBy(desc(salesActivities.createdAt))

    res.json({ activities: rows.map((row: any) => row.activity) })
  } catch (error: any) {
    const status = error?.status === 403 ? 403 : 500
    res.status(status).json({ error: error.message || 'Failed to fetch sales activities' })
  }
})

workspaceRoutes.post('/sales/leads/:leadId/activities', async (req, res) => {
  try {
    const userId = requireUser(req)
    const { workspaceId, activityType, subject, notes, scheduledAt } = req.body as Record<string, string | undefined>
    if (!workspaceId || !activityType || !subject) return res.status(400).json({ error: 'workspaceId, activityType, and subject are required' })
    await requireWorkspaceRole(req, workspaceId, ['owner', 'admin', 'manager', 'sales'])
    const membership = await getMembership(userId, workspaceId)
    if (!membership) return res.status(403).json({ error: 'Workspace access denied' })

    const isElevated = ['owner', 'admin', 'manager'].includes(membership.role)
    const leadConditions = [
      eq(salesLeads.id, req.params.leadId),
      eq(salesLeads.workspaceId, workspaceId),
    ]
    if (!isElevated) leadConditions.push(eq(salesLeads.ownerUserId, userId))

    const [lead] = await db.select({ id: salesLeads.id })
      .from(salesLeads)
      .where(and(...leadConditions))
      .limit(1)
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    const [activity] = await db.insert(salesActivities).values({ workspaceId, leadId: req.params.leadId, ownerUserId: userId, activityType, subject, notes, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined }).returning()
    res.status(201).json({ activity })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record sales activity' })
  }
})
