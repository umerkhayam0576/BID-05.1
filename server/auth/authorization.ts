import type { Request } from 'express'
import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { memberships, roles, permissions, rolePermissions, userRoles } from '../db/app-schema'
import { getAuthenticatedUserId } from './middleware'

export interface AuthorizationRole { id: string; name: string; code: string; description: string | null; scope: string; isSystemRole: boolean; status: string }

export interface AuthorizationContext { userId: string; workspaceId: string; membershipId: string; membershipRole: string; role: AuthorizationRole; permissions: string[]; scope: string; simulation: boolean; realRole: AuthorizationRole; previewRoleId: string | null }

export interface AuthorizationCheck { allowed: boolean; permission: string; reason: string; context: AuthorizationContext }

async function loadMembership(userId: string, workspaceId: string) { const rows = await db.select({ id: memberships.id, workspaceId: memberships.workspaceId, userId: memberships.userId, role: memberships.role, status: memberships.status }).from(memberships).where(and(eq(memberships.workspaceId, workspaceId), eq(memberships.userId, userId), eq(memberships.status, 'active'))); return rows.find((row: any) => row.workspaceId === workspaceId && row.userId === userId && row.status === 'active') || null }

async function loadRoleById(roleId: string, workspaceId: string) { const rows = await db.select({ id: roles.id, workspaceId: roles.workspaceId, name: roles.name, code: roles.code, description: roles.description, scope: roles.scope, isSystemRole: roles.isSystemRole, status: roles.status }).from(roles).where(and(eq(roles.id, roleId), eq(roles.status, 'active'))); return rows.find((row: any) => row.id === roleId && row.status === 'active' && (row.workspaceId === workspaceId || row.workspaceId === null)) || null }

async function loadAssignedRole(userId: string, workspaceId: string) { const assignments = await db.select({ id: userRoles.id, workspaceId: userRoles.workspaceId, userId: userRoles.userId, roleId: userRoles.roleId, status: userRoles.status }).from(userRoles).where(and(eq(userRoles.workspaceId, workspaceId), eq(userRoles.userId, userId), eq(userRoles.status, 'active'))); const assignment = assignments.find((row: any) => row.workspaceId === workspaceId && row.userId === userId && row.status === 'active'); if (!assignment) return null; return loadRoleById(assignment.roleId, workspaceId) }

async function loadLegacyRole(membershipRole: string, workspaceId: string) { const roleCodeByMembership: Record<string,string> = { owner: 'OWNER', admin: 'ADMIN', manager: 'ADMIN', sales: 'SALES', finance: 'FINANCE', hr: 'HR', employee: 'EMPLOYEE', member: 'EMPLOYEE', client: 'CLIENT' }; const roleCode = roleCodeByMembership[membershipRole]; if (!roleCode) return null; const rows = await db.select({ id: roles.id, workspaceId: roles.workspaceId, name: roles.name, code: roles.code, description: roles.description, scope: roles.scope, isSystemRole: roles.isSystemRole, status: roles.status }).from(roles).where(and(eq(roles.code, roleCode), eq(roles.status, 'active'))); return rows.find((row: any) => row.code === roleCode && row.status === 'active' && (row.workspaceId === workspaceId || row.workspaceId === null)) || null }

async function loadRolePermissions(roleId: string) { const links = await db.select({ roleId: rolePermissions.roleId, permissionId: rolePermissions.permissionId }).from(rolePermissions).where(eq(rolePermissions.roleId, roleId)); const permissionIds = new Set(links.filter((row:any) => row.roleId === roleId).map((row:any) => row.permissionId)); if (permissionIds.size === 0) return []; const permissionRows = await db.select({ id: permissions.id, code: permissions.code }).from(permissions); return permissionRows.filter((row:any) => permissionIds.has(row.id)).map((row:any) => row.code).filter(Boolean) }

function toAuthorizationRole(row:any): AuthorizationRole { return { id: row.id, name: row.name, code: row.code, description: row.description ?? null, scope: row.scope || 'workspace', isSystemRole: Boolean(row.isSystemRole), status: row.status || 'active' } }

export async function resolveAuthorizationContext(req: Request, workspaceId: string, options?: { previewRoleId?: string | null }): Promise<AuthorizationContext> { const userId = getAuthenticatedUserId(req); if (!workspaceId) throw new Error('Workspace is required'); const membership = await loadMembership(userId, workspaceId); if (!membership) throw new Error('Active workspace membership required'); const assignedRole = await loadAssignedRole(userId, workspaceId) || await loadLegacyRole(membership.role, workspaceId); if (!assignedRole) throw new Error('No active RBAC role is assigned to this workspace membership'); const realRole = toAuthorizationRole(assignedRole); let effectiveRole = realRole; let simulation = false; let previewRoleId: string | null = null; if (options?.previewRoleId) { const realPermissions = await loadRolePermissions(realRole.id); if (!realPermissions.includes('people.manage')) throw new Error('You are not allowed to preview workspace roles'); const previewRole = await loadRoleById(options.previewRoleId, workspaceId); if (!previewRole) throw new Error('Preview role was not found in this workspace'); effectiveRole = toAuthorizationRole(previewRole); simulation = true; previewRoleId = previewRole.id } const effectivePermissions = await loadRolePermissions(effectiveRole.id); return { userId, workspaceId, membershipId: membership.id, membershipRole: membership.role, role: effectiveRole, permissions: effectivePermissions, scope: effectiveRole.scope, simulation, realRole, previewRoleId } }

export function can(context: AuthorizationContext, permission: string): boolean { return context.permissions.includes(permission) }

export function checkPermission(context: AuthorizationContext, permission: string): AuthorizationCheck { const allowed = can(context, permission); return { allowed, permission, reason: allowed ? 'Role has this permission' : 'Role does not have this permission', context } }

export function assertPermission(context: AuthorizationContext, permission: string): void { if (!can(context, permission)) throw new Error(`Permission denied: ${permission}`) }

export function isSimulation(context: AuthorizationContext): boolean { return context.simulation }

export function assertNotSimulation(context: AuthorizationContext): void { if (context.simulation) throw new Error('This action is disabled during role preview') }
