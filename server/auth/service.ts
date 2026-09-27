import { createHash, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

const scrypt = promisify(scryptCallback)

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7
const SCRYPT_KEY_LENGTH = 64

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export async function hashPassword(password: string) {
  if (password.length < 8) throw new Error('Password must be at least 8 characters')
  const salt = randomBytes(16).toString('hex')
  const derivedKey = await scrypt(password, salt, SCRYPT_KEY_LENGTH) as Buffer
  return `scrypt$${salt}$${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, keyHex] = storedHash.split('$')
  if (algorithm !== 'scrypt' || !salt || !keyHex) return false

  const derivedKey = await scrypt(password, salt, SCRYPT_KEY_LENGTH) as Buffer
  const storedKey = Buffer.from(keyHex, 'hex')
  return storedKey.length === derivedKey.length && timingSafeEqual(storedKey, derivedKey)
}

export function createSessionToken() {
  return randomBytes(32).toString('base64url')
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export function sessionExpiry() {
  return new Date(Date.now() + SESSION_TTL_MS)
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: SESSION_TTL_MS,
  }
}

export const SESSION_COOKIE_NAME = 'bid_exact_session'
