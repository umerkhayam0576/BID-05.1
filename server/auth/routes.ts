import { Request, Router } from 'express'
import fs from 'fs/promises'
import path from 'path'
import { and, eq, gt, isNull } from 'drizzle-orm'
import { db } from '../db'
import {
  users,
  userCredentials,
  userSessions,
  passwordResetTokens,
  userProfiles,
  workspaces,
  workspaceInvitations,
} from '../db/app-schema'
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

authRoutes.get('/invitations/preview', async (req, res) => {
  try {
    const token = typeof req.query.token === 'string' ? req.query.token.trim() : ''

    if (!token) return res.status(400).json({ error: 'Invitation token is required' })

    const tokenHash = hashSessionToken(token)
    const [invitation] = await db
      .select({
        id: workspaceInvitations.id,
        companyName: workspaces.name,
        email: workspaceInvitations.email,
        role: workspaceInvitations.role,
        status: workspaceInvitations.status,
        expiresAt: workspaceInvitations.expiresAt,
      })
      .from(workspaceInvitations)
      .innerJoin(workspaces, eq(workspaces.id, workspaceInvitations.workspaceId))
      .where(eq(workspaceInvitations.tokenHash, tokenHash))
      .limit(1)

    if (!invitation) return res.status(404).json({ error: 'Invitation not found or invalid' })

    if (invitation.status !== 'pending') {
      return res.status(409).json({ error: 'This invitation is no longer pending', status: invitation.status })
    }

    if (invitation.expiresAt <= new Date()) {
      await db.update(workspaceInvitations)
        .set({ status: 'expired' })
        .where(and(eq(workspaceInvitations.id, invitation.id), eq(workspaceInvitations.status, 'pending')))
      return res.status(410).json({ error: 'This invitation has expired' })
    }

    return res.json({
      valid: true,
      invitation: {
        id: invitation.id,
        companyName: invitation.companyName,
        email: invitation.email,
        role: invitation.role,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch {
    return res.status(500).json({ error: 'Unable to preview invitation' })
  }
})

authRoutes.post('/register', async (req, res) => {
  try {
    const displayName = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : ''
    const email = typeof req.body?.email === 'string' ? normalizeEmail(req.body.email) : ''
    const password = typeof req.body?.password === 'string' ? req.body.password : ''
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : ''
    const country = typeof req.body?.country === 'string' ? req.body.country.trim() : ''

    if (!displayName || !email || !password || !phone || !country) return res.status(400).json({ error: 'Name, email, phone, country, and password are required' })
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

    const countryCodes: Record<string, string> = {
      Pakistan: '+92', 'United States': '+1', Canada: '+1', 'United Kingdom': '+44',
      'United Arab Emirates': '+971', 'Saudi Arabia': '+966', Qatar: '+974', Kuwait: '+965',
      Australia: '+61', India: '+91', Germany: '+49', France: '+33',
    }
    const phoneCode = countryCodes[country] || ''
    await db.insert(userProfiles).values({
      userId: user.id,
      phone: `${phoneCode} ${phone}`.trim(),
      country,
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
authRoutes.post('/forgot-password', async (req, res) => {
  try {
    const email = typeof req.body?.email === 'string'
      ? normalizeEmail(req.body.email)
      : ''

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    const [user] = await db
      .select({
        id: users.id,
        status: users.status,
      })
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    const genericResponse = {
      message: 'If an account exists for that email, a password reset link has been created.',
    }

    if (!user || user.status !== 'active') {
      return res.json(genericResponse)
    }

    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(and(
        eq(passwordResetTokens.userId, user.id),
        isNull(passwordResetTokens.usedAt),
      ))

    const resetToken = createSessionToken()
    const tokenHash = hashSessionToken(resetToken)

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)

    await db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt,
    })

    if (process.env.NODE_ENV !== 'production') {
      const appUrl = process.env.APP_URL || 'http://localhost:3000'

      return res.json({
        ...genericResponse,
        developmentResetUrl: `${appUrl}/reset-password?token=${encodeURIComponent(resetToken)}`,
      })
    }

    return res.json(genericResponse)
  } catch {
    return res.status(500).json({ error: 'Unable to process password reset request' })
  }
})
authRoutes.post('/reset-password', async (req, res) => {
  try {
    const token = typeof req.body?.token === 'string'
      ? req.body.token.trim()
      : ''

    const newPassword = typeof req.body?.newPassword === 'string'
      ? req.body.newPassword
      : ''

    if (!token || !newPassword) {
      return res.status(400).json({
        error: 'Reset token and new password are required',
      })
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        error: 'Password must be at least 8 characters',
      })
    }

    const tokenHash = hashSessionToken(token)

    const [resetRecord] = await db
      .select({
        id: passwordResetTokens.id,
        userId: passwordResetTokens.userId,
        expiresAt: passwordResetTokens.expiresAt,
      })
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.tokenHash, tokenHash),
        isNull(passwordResetTokens.usedAt),
        gt(passwordResetTokens.expiresAt, new Date()),
      ))
      .limit(1)

    if (!resetRecord) {
      return res.status(400).json({
        error: 'This password reset link is invalid or has expired',
      })
    }

    const [user] = await db
      .select({
        id: users.id,
        status: users.status,
      })
      .from(users)
      .where(eq(users.id, resetRecord.userId))
      .limit(1)

    if (!user || user.status !== 'active') {
      return res.status(400).json({
        error: 'This password reset link is invalid or has expired',
      })
    }

    const passwordHash = await hashPassword(newPassword)

    await db
      .update(userCredentials)
      .set({
        passwordHash,
        passwordUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(userCredentials.userId, user.id))

    // Make the reset token one-time use.
    await db
      .update(passwordResetTokens)
      .set({ usedAt: new Date() })
      .where(eq(passwordResetTokens.id, resetRecord.id))

    // Revoke all existing sessions after a password reset.
    await db
      .update(userSessions)
      .set({ revokedAt: new Date() })
      .where(and(
        eq(userSessions.userId, user.id),
        isNull(userSessions.revokedAt),
      ))

    return res.json({
      message: 'Password reset successfully. Please sign in with your new password.',
    })
  } catch {
    return res.status(500).json({
      error: 'Unable to reset password',
    })
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

authRoutes.get('/profile', async (req, res) => {
  try {
    const token = readCookie(req, SESSION_COOKIE_NAME)
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    const [session] = await db.select({ userId: userSessions.userId })
      .from(userSessions)
      .where(and(eq(userSessions.tokenHash, hashSessionToken(token)), isNull(userSessions.revokedAt), gt(userSessions.expiresAt, new Date())))
      .limit(1)
    if (!session) return res.status(401).json({ error: 'Authentication required' })

    const [user] = await db.select({
      id: users.id, email: users.email, displayName: users.displayName, status: users.status,
    }).from(users).where(eq(users.id, session.userId)).limit(1)
    if (!user || user.status !== 'active') return res.status(401).json({ error: 'Authentication required' })

    let [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1)
    if (!profile) {
      [profile] = await db.insert(userProfiles).values({ userId: user.id }).returning()
    }
    return res.json({ user, profile })
  } catch {
    return res.status(500).json({ error: 'Unable to read profile' })
  }
})

authRoutes.post('/profile/photo', async (req, res) => {
  try {
    const token = readCookie(req, SESSION_COOKIE_NAME)
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    const [session] = await db.select({ userId: userSessions.userId })
      .from(userSessions)
      .where(and(eq(userSessions.tokenHash, hashSessionToken(token)), isNull(userSessions.revokedAt), gt(userSessions.expiresAt, new Date())))
      .limit(1)
    if (!session) return res.status(401).json({ error: 'Authentication required' })

    const photo = typeof req.body?.photo === 'string' ? req.body.photo : ''
    const match = photo.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/)
    if (!match) return res.status(400).json({ error: 'Please upload a JPG, PNG, or WebP image.' })

    const mime = match[1]
    const base64 = match[2]
    const bytes = Buffer.from(base64, 'base64')
    if (!bytes.length || bytes.length > 5 * 1024 * 1024) {
      return res.status(400).json({ error: 'Profile photo must be 5 MB or smaller.' })
    }

    const extension = mime === 'image/jpeg' ? 'jpg' : mime === 'image/png' ? 'png' : 'webp'
    const uploadDir = path.join(process.cwd(), 'uploads', 'profile')
    await fs.mkdir(uploadDir, { recursive: true })

    for (const oldExtension of ['jpg', 'png', 'webp']) {
      if (oldExtension !== extension) {
        await fs.rm(path.join(uploadDir, `${session.userId}.${oldExtension}`), { force: true })
      }
    }

    await fs.writeFile(path.join(uploadDir, `${session.userId}.${extension}`), bytes)
    const avatarUrl = `/uploads/profile/${session.userId}.${extension}`

    await db.update(userProfiles)
      .set({ avatarUrl, updatedAt: new Date() })
      .where(eq(userProfiles.userId, session.userId))

    return res.json({ avatarUrl })
  } catch {
    return res.status(500).json({ error: 'Unable to upload profile photo' })
  }
})

authRoutes.patch('/profile', async (req, res) => {
  try {
    const token = readCookie(req, SESSION_COOKIE_NAME)
    if (!token) return res.status(401).json({ error: 'Authentication required' })

    const [session] = await db.select({ userId: userSessions.userId })
      .from(userSessions)
      .where(and(eq(userSessions.tokenHash, hashSessionToken(token)), isNull(userSessions.revokedAt), gt(userSessions.expiresAt, new Date())))
      .limit(1)
    if (!session) return res.status(401).json({ error: 'Authentication required' })

    const displayName = typeof req.body?.displayName === 'string' ? req.body.displayName.trim() : ''
    if (displayName.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' })

    const fields = {
      phone: typeof req.body?.phone === 'string' ? req.body.phone.trim() || null : null,
      jobTitle: typeof req.body?.jobTitle === 'string' ? req.body.jobTitle.trim() || null : null,
      bio: typeof req.body?.bio === 'string' ? req.body.bio.trim() || null : null,
      avatarUrl: typeof req.body?.avatarUrl === 'string' ? req.body.avatarUrl.trim() || null : null,
      country: typeof req.body?.country === 'string' ? req.body.country.trim() || null : null,
      timezone: typeof req.body?.timezone === 'string' && req.body.timezone.trim() ? req.body.timezone.trim() : 'UTC',
      language: typeof req.body?.language === 'string' && req.body.language.trim() ? req.body.language.trim() : 'en',
      preferredCurrency: typeof req.body?.preferredCurrency === 'string' && req.body.preferredCurrency.trim() ? req.body.preferredCurrency.trim().toUpperCase() : 'USD',
      dateFormat: typeof req.body?.dateFormat === 'string' && req.body.dateFormat.trim() ? req.body.dateFormat.trim() : 'YYYY-MM-DD',
      emailNotifications: req.body?.emailNotifications !== false,
      inAppNotifications: req.body?.inAppNotifications !== false,
    }

    await db.update(users).set({ displayName, updatedAt: new Date() }).where(eq(users.id, session.userId))
    const [existing] = await db.select({ userId: userProfiles.userId }).from(userProfiles).where(eq(userProfiles.userId, session.userId)).limit(1)
    const [profile] = existing
      ? await db.update(userProfiles).set({ ...fields, updatedAt: new Date() }).where(eq(userProfiles.userId, session.userId)).returning()
      : await db.insert(userProfiles).values({ userId: session.userId, ...fields }).returning()

    return res.json({ user: { id: session.userId, displayName }, profile })
  } catch {
    return res.status(500).json({ error: 'Unable to update profile' })
  }
})

authRoutes.post('/change-password', async (req, res) => {
  try {
    const token = readCookie(req, SESSION_COOKIE_NAME)
    if (!token) return res.status(401).json({ error: 'Authentication required' })
    const [session] = await db.select({ userId: userSessions.userId })
      .from(userSessions)
      .where(and(eq(userSessions.tokenHash, hashSessionToken(token)), isNull(userSessions.revokedAt), gt(userSessions.expiresAt, new Date())))
      .limit(1)
    if (!session) return res.status(401).json({ error: 'Authentication required' })

    const currentPassword = typeof req.body?.currentPassword === 'string' ? req.body.currentPassword : ''
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : ''
    if (!currentPassword || newPassword.length < 8) return res.status(400).json({ error: 'Current password and a new password of at least 8 characters are required' })

    const [credential] = await db.select({ passwordHash: userCredentials.passwordHash }).from(userCredentials).where(eq(userCredentials.userId, session.userId)).limit(1)
    if (!credential || !(await verifyPassword(currentPassword, credential.passwordHash))) return res.status(400).json({ error: 'Current password is incorrect' })

    const passwordHash = await hashPassword(newPassword)
    await db.update(userCredentials).set({ passwordHash, passwordUpdatedAt: new Date(), updatedAt: new Date() }).where(eq(userCredentials.userId, session.userId))
    await db.update(userSessions).set({ revokedAt: new Date() }).where(and(eq(userSessions.userId, session.userId), isNull(userSessions.revokedAt)))
    const newToken = createSessionToken()
    await db.insert(userSessions).values({ userId: session.userId, tokenHash: hashSessionToken(newToken), expiresAt: sessionExpiry() })
    res.cookie(SESSION_COOKIE_NAME, newToken, sessionCookieOptions())
    return res.status(204).end()
  } catch {
    return res.status(500).json({ error: 'Unable to change password' })
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
