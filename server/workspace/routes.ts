import { Router } from 'express'
import { and, desc, eq, isNull, or, inArray } from 'drizzle-orm'
import { db } from '../db'
import { getAuthenticatedUserId, getMembership, requireWorkspaceMembership, requireWorkspaceRole } from '../auth/middleware'
import { attendanceRecords, clients, employees, memberships, notifications, projects, projectAccess, reminders, salesActivities, salesLeads } from '../db/app-schema'

export const workspaceRoutes = Router()

function requireUser(req: import('express').Request) {
  return getAuthenticatedUserId(req)
}

workspaceRoutes.use((_req, _res, next) => next())

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
          .innerJoin(projectAccess, eq(projectAccess.projectId, reminders.projectId))
          .where(and(
            eq(reminders.workspaceId, workspaceId),
            eq(projectAccess.workspaceId, workspaceId),
            eq(projectAccess.userId, userId)
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

workspaceRoutes.post('/sales/leads/:leadId/activities', async (req, res) => {
  try {
    const userId = requireUser(req)
    const { workspaceId, activityType, subject, notes, scheduledAt } = req.body as Record<string, string | undefined>
    if (!workspaceId || !activityType || !subject) return res.status(400).json({ error: 'workspaceId, activityType, and subject are required' })
    await requireWorkspaceRole(req, workspaceId, ['owner', 'admin', 'manager', 'sales'])
    const [lead] = await db.select({ id: salesLeads.id }).from(salesLeads).where(and(eq(salesLeads.id, req.params.leadId), eq(salesLeads.workspaceId, workspaceId), eq(salesLeads.ownerUserId, userId))).limit(1)
    if (!lead) return res.status(404).json({ error: 'Lead not found' })
    const [activity] = await db.insert(salesActivities).values({ workspaceId, leadId: req.params.leadId, ownerUserId: userId, activityType, subject, notes, scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined }).returning()
    res.status(201).json({ activity })
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to record sales activity' })
  }
})
