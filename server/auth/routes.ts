import { Request, Router } from 'express'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '../db'
import { users, userCredentials, userSessions } from '../db/app-schema'
import {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  normalizeEmail,
  sessionCookieOptions,
  sessionExpiry,
  SESSION_COOKIE_NAME,
  verifyPassword,
} from './service'

function readCookie(req: Request, name: string) {
  const header = req.header('cookie') || ''
  const pair = header.split(';').map((part) => part.trim()).find((part) => part.startsWith(name + '='))
  return pair ? decodeURIComponent(pair.slice(name.length + 1)) : null
}

export const authRoutes = Router()

authRoutes.post('/register', async (req, res) => {
  try {
    const displayName = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : ''
    const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''

    if (!displayName || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' })
    if (displayName.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' })
    if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })

    const [existingUser] = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)
    if (existingUser) return res.status(409).json({ error: 'An account with that email already exists' })

    const passwordHash = await hashPassword(password)
    const [user] = await db.insert(users).values({
      email,
      displayName,
      status: 'active',
    }).returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
    })

    await db.insert(userCredentials).values({
      userId: user.id,
      passwordHash,
    })

    const token = createSessionToken()
    await db.insert(userSessions).values({
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt: sessionExpiry(),
    })

    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions())
    return res.status(201).json({ user })
  } catch {
    return res.status(500).json({ error: 'Unable to create account' })
  }
})

authRoutes.post('/login', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''

    if (!email || !password) return res.status(400).json({ error: 'Email and password are required' })

    const [user] = await db.select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      status: users.status,
    }).from(users).where(eq(users.email, email)).limit(1)

    if (!user || user.status !== 'active') {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const [credential] = await db.select({ passwordHash: userCredentials.passwordHash })
      .from(userCredentials)
      .where(eq(userCredentials.userId, user.id))
      .limit(1)

    if (!credential || !(await verifyPassword(password, credential.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = createSessionToken()
    await db.insert(userSessions).values({
      userId: user.id,
      tokenHash: hashSessionToken(token),
      expiresAt: sessionExpiry(),
    })

    res.cookie(SESSION_COOKIE_NAME, token, sessionCookieOptions())
    return res.json({ user: { id: user.id, email: user.email, displayName: user.displayName } })
  } catch {
    return res.status(500).json({ error: 'Unable to sign in' })
  }
})

authRoutes.post('/logout', async (req, res) => {
  try {
    const token = readCookie(req, SESSION_COOKIE_NAME)
    if (token) {
      await db.update(userSessions)
        .set({ revokedAt: new Date() })
        .where(and(eq(userSessions.tokenHash, hashSessionToken(token)), isNull(userSessions.revokedAt)))
    }
    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieOptions())
    return res.status(204).end()
  } catch {
    return res.status(500).json({ error: 'Unable to sign out' })
  }
})

authRoutes.get('/me', async (req, res) => {
  try {
    const token = readCookie(req, SESSION_COOKIE_NAME)
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    const [session] = await db.select({ userId: userSessions.userId })
      .from(userSessions)
      .where(and(
        eq(userSessions.tokenHash, hashSessionToken(token)),
        isNull(userSessions.revokedAt),
        gt(userSessions.expiresAt, new Date()),
      ))
      .limit(1)

    if (!session) return res.status(401).json({ error: 'Authentication required' })

    const [user] = await db.select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      status: users.status,
    }).from(users).where(eq(users.id, session.userId)).limit(1)

    if (!user || user.status !== 'active') return res.status(401).json({ error: 'Authentication required' })

    return res.json({ user })
  } catch {
    return res.status(500).json({ error: 'Unable to read session' })
  }
})

export { readCookie }
