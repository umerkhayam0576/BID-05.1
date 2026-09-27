import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '../db'
import { memberships, userSessions } from '../db/app-schema'
import { readCookie } from './routes'
import { hashSessionToken, SESSION_COOKIE_NAME } from './service'

const DEV_HEADER_AUTH = process.env.NODE_ENV !== 'production' && process.env.ALLOW_DEV_HEADER_AUTH !== 'false'

export type AppRole = 'owner' | 'admin' | 'manager' | 'sales' | 'finance' | 'hr' | 'employee' | 'client'

export interface AuthContext {
  userId: string
  role?: AppRole
}

declare global {
  namespace Express {
    interface Request {
      auth?: AuthContext
    }
  }
}

function authSecret() {
  const secret = process.env.AUTH_SECRET
  if (!secret || secret.length < 32) {
    throw new Error('AUTH_SECRET must be configured with at least 32 characters')
  }
  return secret
}

export function getAuthenticatedUserId(req: Request): string {
  const userId = req.auth?.userId
  if (!userId) throw new Error('Authentication required')
  return userId
}

export async function requireAuthentication(req: Request, res: Response, next: NextFunction) {
  try {
    const authorization = req.header('authorization')

    if (authorization?.startsWith('Bearer ')) {
      const token = authorization.slice(7).trim()
      const payload = jwt.verify(token, authSecret())
      if (typeof payload === 'string' || !payload.sub) {
        return res.status(401).json({ error: 'Invalid authentication token' })
      }
      req.auth = { userId: String(payload.sub), role: payload.role as AppRole | undefined }
      return next()
    }

    const sessionToken = readCookie(req, SESSION_COOKIE_NAME)
    if (sessionToken) {
      const [session] = await db.select({ userId: userSessions.userId })
        .from(userSessions)
        .where(and(
          eq(userSessions.tokenHash, hashSessionToken(sessionToken)),
          isNull(userSessions.revokedAt),
          gt(userSessions.expiresAt, new Date()),
        ))
        .limit(1)

      if (session) {
        req.auth = { userId: session.userId }
        return next()
      }
    }

    if (DEV_HEADER_AUTH) {
      const userId = req.header('x-user-id')?.trim()
      if (userId) {
        req.auth = { userId }
        return next()
      }
    }

    return res.status(401).json({ error: 'Authentication required' })
  } catch {
    return res.status(401).json({ error: 'Authentication required' })
  }
}

export async function getMembership(userId: string, workspaceId: string) {
  const rows = await db.select({
    id: memberships.id,
    workspaceId: memberships.workspaceId,
    userId: memberships.userId,
    role: memberships.role,
    status: memberships.status,
  }).from(memberships).where(and(
    eq(memberships.workspaceId, workspaceId),
    eq(memberships.userId, userId),
    eq(memberships.status, 'active'),
  )).limit(1)

  return rows[0] || null
}

export async function requireWorkspaceMembership(req: Request, workspaceId: string) {
  const userId = getAuthenticatedUserId(req)
  const membership = await getMembership(userId, workspaceId)
  if (!membership) {
    const error = new Error('Workspace access denied')
    ;(error as Error & { status?: number }).status = 403
    throw error
  }
  return membership
}

export async function requireWorkspaceRole(req: Request, workspaceId: string, allowedRoles: AppRole[]) {
  const membership = await requireWorkspaceMembership(req, workspaceId)
  if (!allowedRoles.includes(membership.role as AppRole)) {
    const error = new Error('Insufficient workspace permissions')
    ;(error as Error & { status?: number }).status = 403
    throw error
  }
  return membership
}

export function roleAtLeast(role: string, allowed: AppRole[]) {
  return allowed.includes(role as AppRole)
}
