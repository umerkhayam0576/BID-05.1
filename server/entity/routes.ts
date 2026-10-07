import { Router } from 'express'
import { and, eq, inArray } from 'drizzle-orm'
import { createHash, randomBytes } from 'node:crypto'
import { db } from '../db'
import { getAuthenticatedUserId, getMembership, requireWorkspaceRole } from '../auth/middleware'
import { companyLoanEligibilityPolicies, departments, entityInvitations, entityOwnerships, memberships, permissions, rolePermissions, roles, userRoles, users, workspaces } from '../db/app-schema'

async function initializeWorkspaceRbac(tx: any, workspaceId: string, ownerUserId: string) {
  const defaultDepartments = [
    { name: 'Sales', code: 'SALES', description: 'Sales and business development' },
    { name: 'Services', code: 'SERVICES', description: 'Service delivery and operations' },
    { name: 'HR', code: 'HR', description: 'Human resources and people operations' },
    { name: 'Accounting', code: 'ACCOUNTING', description: 'Accounting and financial operations' },
    { name: 'Management', code: 'MANAGEMENT', description: 'Management and administration' },
  ];

  for (const department of defaultDepartments) {
    await tx.insert(departments).values({
      workspaceId,
      name: department.name,
      code: department.code,
      description: department.description,
      status: 'active',
    }).onConflictDoNothing();
  }

  const defaultRoles = [
    { name: 'Owner', code: 'OWNER' },
    { name: 'Admin', code: 'ADMIN' },
    { name: 'Sales', code: 'SALES' },
    { name: 'Employee', code: 'EMPLOYEE' },
    { name: 'Finance', code: 'FINANCE' },
    { name: 'HR', code: 'HR' },
    { name: 'Client', code: 'CLIENT' },
  ];

  for (const role of defaultRoles) {
    await tx.insert(roles).values({
      workspaceId,
      name: role.name,
      code: role.code,
      scope: 'workspace',
      isSystemRole: true,
      status: 'active',
    }).onConflictDoNothing();
  }

  const permissionRows = await tx.select({
    id: permissions.id,
    code: permissions.code,
  }).from(permissions);

  const permissionByCode = new Map(permissionRows.map((permission: any) => [permission.code, permission.id]));

  const permissionCodesByRole: Record<string, string[]> = {
    OWNER: permissionRows.map((permission: any) => permission.code),
    ADMIN: permissionRows.map((permission: any) => permission.code),
    SALES: ['clients.manage', 'clients.view', 'dashboard.view', 'projects.view', 'reports.view', 'sales.manage', 'sales.view'],
    EMPLOYEE: ['dashboard.view', 'expenses.view', 'projects.view', 'services.view'],
    FINANCE: ['dashboard.view', 'expenses.manage', 'expenses.view', 'finance.manage', 'finance.view', 'payouts.manage', 'payouts.view', 'payroll.manage', 'payroll.view', 'reports.view'],
    HR: ['dashboard.view', 'employees.manage', 'employees.view', 'payroll.manage', 'payroll.view', 'reports.view'],
    CLIENT: ['dashboard.view', 'projects.view', 'services.view'],
  };

  for (const [roleCode, permissionCodes] of Object.entries(permissionCodesByRole)) {
    const roleRows = await tx.select({ id: roles.id }).from(roles).where(and(eq(roles.workspaceId, workspaceId), eq(roles.code, roleCode)));
    const role = roleRows[0];
    if (!role) throw new Error(`RBAC role ${roleCode} was not created`);

    for (const permissionCode of permissionCodes) {
      const permissionId = permissionByCode.get(permissionCode);
      if (!permissionId) throw new Error(`RBAC permission ${permissionCode} is missing`);
      await tx.insert(rolePermissions).values({
        roleId: role.id,
        permissionId,
      }).onConflictDoNothing();
    }

    if (roleCode === 'OWNER') {
      await tx.insert(userRoles).values({
        workspaceId,
        userId: ownerUserId,
        roleId: role.id,
        status: 'active',
      }).onConflictDoNothing();
    }
  }
}

export const entityRoutes = Router()

const allowedIndustries = ['services', 'construction_management', 'agriculture', 'logistics', 'manufacturing', 'other']
const allowedLegalStructures = ['llc', 'corporation', 'partnership', 'sole_proprietorship', 'other']
const allowedRoles = ['owner', 'admin', 'manager', 'member']

function slugify(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
}

function invitationToken() {
  return randomBytes(32).toString('base64url')
}

function hashInvitationToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

entityRoutes.get('/', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)
    const rows = await db.select({
      entity: workspaces,
      membership: memberships,
      ownership: entityOwnerships,
    })
      .from(memberships)
      .innerJoin(workspaces, eq(workspaces.id, memberships.workspaceId))
      .leftJoin(entityOwnerships, and(
        eq(entityOwnerships.workspaceId, memberships.workspaceId),
        eq(entityOwnerships.userId, userId),
        eq(entityOwnerships.status, 'active'),
      ))
      .where(and(eq(memberships.userId, userId), eq(memberships.status, 'active')))

    return res.json({
      entities: rows.map((row: any) => ({
        ...row.entity,
        membershipRole: row.membership.role,
        ownershipPercent: row.ownership?.ownershipPercent || '0',
        profitSharePercent: row.ownership?.profitSharePercent || '0',
        entityRole: row.ownership?.entityRole || row.membership.role,
      })),
    })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch entities' })
  }
})

entityRoutes.post('/', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)
    const {
      name,
      legalStructure = 'other',
      industryType = 'services',
      country,
      currency = 'USD',
      ownershipPercent = '100',
      profitSharePercent = '100',
    } = req.body as Record<string, string | undefined>

    if (!name?.trim()) return res.status(400).json({ error: 'Entity name is required' })
    if (!allowedLegalStructures.includes(legalStructure)) return res.status(400).json({ error: 'Invalid legalStructure' })
    if (!allowedIndustries.includes(industryType)) return res.status(400).json({ error: 'Invalid industryType' })

    const baseSlug = slugify(name)
    if (!baseSlug) return res.status(400).json({ error: 'Entity name must contain letters or numbers' })

    const slug = `${baseSlug}-${randomBytes(4).toString('hex')}`

    const result = await db.transaction(async (tx: any) => {
      const [entity] = await tx.insert(workspaces).values({
        name: name.trim(),
        slug,
        legalStructure,
        industryType,
        country: country?.trim() || null,
        currency: currency?.trim().toUpperCase() || 'USD',
        createdByUserId: userId,
        status: 'active',
      }).returning()

      await tx.insert(memberships).values({
        workspaceId: entity.id,
        userId,
        role: 'owner',
        status: 'active',
      })

      await tx.insert(entityOwnerships).values({
        workspaceId: entity.id,
        userId,
        ownershipPercent: ownershipPercent || '100',
        profitSharePercent: profitSharePercent || '100',
        entityRole: 'owner',
        status: 'active',
      })

      await initializeWorkspaceRbac(tx, entity.id, userId)

      await tx.insert(companyLoanEligibilityPolicies).values([
        {
          workspaceId: entity.id,
          personType: 'employee',
          minimumTenureDays: 180,
          maximumLoanAmount: '3000',
          salaryMultiple: '3',
          maximumActiveLoans: 1,
          minimumGapDays: 90,
          allowProbation: false,
          requireActiveStatus: true,
          allowAdminOverride: true,
          status: 'active',
          metadata: { source: 'workspace-default' },
        },
        {
          workspaceId: entity.id,
          personType: 'partner',
          minimumTenureDays: 90,
          maximumLoanAmount: '10000',
          salaryMultiple: null,
          maximumActiveLoans: 2,
          minimumGapDays: 60,
          allowProbation: true,
          requireActiveStatus: true,
          allowAdminOverride: true,
          status: 'active',
          metadata: { source: 'workspace-default' },
        },
      ])

      return entity
    })

    return res.status(201).json({ entity: result })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to create entity' })
  }
})

entityRoutes.get('/:workspaceId', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)
    const membership = await getMembership(userId, req.params.workspaceId)
    if (!membership) return res.status(403).json({ error: 'Entity access denied' })

    const [entity] = await db.select().from(workspaces).where(eq(workspaces.id, req.params.workspaceId)).limit(1)
    if (!entity) return res.status(404).json({ error: 'Entity not found' })

    return res.json({ entity, membership })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch entity' })
  }
})

entityRoutes.get('/:workspaceId/members', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)
    const membership = await getMembership(userId, req.params.workspaceId)
    if (!membership) return res.status(403).json({ error: 'Entity access denied' })

    const rows = await db.select({
      userId: memberships.userId,
      email: users.email,
      displayName: users.displayName,
      membershipRole: memberships.role,
      ownershipPercent: entityOwnerships.ownershipPercent,
      profitSharePercent: entityOwnerships.profitSharePercent,
      entityRole: entityOwnerships.entityRole,
    })
      .from(memberships)
      .innerJoin(users, eq(users.id, memberships.userId))
      .leftJoin(entityOwnerships, and(
        eq(entityOwnerships.workspaceId, memberships.workspaceId),
        eq(entityOwnerships.userId, memberships.userId),
        eq(entityOwnerships.status, 'active'),
      ))
      .where(and(eq(memberships.workspaceId, req.params.workspaceId), eq(memberships.status, 'active')))

    return res.json({ members: rows })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch entity members' })
  }
})

entityRoutes.post('/:workspaceId/invitations', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)
    await requireWorkspaceRole(req, req.params.workspaceId, ['owner', 'admin'])

    const { email, role = 'member', ownershipPercent = '0', profitSharePercent = '0' } = req.body as Record<string, string | undefined>
    const normalizedEmail = email?.trim().toLowerCase()
    if (!normalizedEmail) return res.status(400).json({ error: 'Email is required' })
    if (!allowedRoles.includes(role || 'member')) return res.status(400).json({ error: 'Invalid role' })

    const token = invitationToken()
    const [invite] = await db.insert(entityInvitations).values({
      workspaceId: req.params.workspaceId,
      invitedByUserId: userId,
      email: normalizedEmail,
      role: role || 'member',
      ownershipPercent: ownershipPercent || '0',
      profitSharePercent: profitSharePercent || '0',
      tokenHash: hashInvitationToken(token),
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    }).returning()

    return res.status(201).json({
      invitation: {
        id: invite.id,
        workspaceId: invite.workspaceId,
        email: invite.email,
        role: invite.role,
        ownershipPercent: invite.ownershipPercent,
        profitSharePercent: invite.profitSharePercent,
        expiresAt: invite.expiresAt,
        token,
      },
    })
  } catch (error: any) {
    const status = error?.status === 403 ? 403 : 500
    return res.status(status).json({ error: error.message || 'Failed to create invitation' })
  }
})

entityRoutes.post('/invitations/:token/accept', async (req, res) => {
  try {
    const userId = getAuthenticatedUserId(req)
    const token = req.params.token
    const [invite] = await db.select().from(entityInvitations).where(and(
      eq(entityInvitations.tokenHash, hashInvitationToken(token)),
      eq(entityInvitations.status, 'pending'),
    )).limit(1)

    if (!invite || invite.expiresAt <= new Date()) return res.status(400).json({ error: 'Invitation is invalid or expired' })

    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1)
    if (!user || user.email !== invite.email) return res.status(403).json({ error: 'Invitation email does not match signed-in user' })

    const existing = await getMembership(userId, invite.workspaceId)
    if (!existing) {
      await db.insert(memberships).values({
        workspaceId: invite.workspaceId,
        userId,
        role: invite.role,
        status: 'active',
      })
    }

    await db.insert(entityOwnerships).values({
      workspaceId: invite.workspaceId,
      userId,
      ownershipPercent: invite.ownershipPercent,
      profitSharePercent: invite.profitSharePercent,
      entityRole: invite.role,
      status: 'active',
    }).onConflictDoUpdate({
      target: [entityOwnerships.workspaceId, entityOwnerships.userId],
      set: {
        ownershipPercent: invite.ownershipPercent,
        profitSharePercent: invite.profitSharePercent,
        entityRole: invite.role,
        status: 'active',
      },
    })

    await db.update(entityInvitations)
      .set({ status: 'accepted', acceptedByUserId: userId, acceptedAt: new Date() })
      .where(eq(entityInvitations.id, invite.id))

    return res.json({ accepted: true, workspaceId: invite.workspaceId })
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to accept invitation' })
  }
})
