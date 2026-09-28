import 'dotenv/config'
import express from 'express'
import path from 'path'
import { createServer as createViteServer } from 'vite'
import { authRoutes } from './server/auth/routes'
import { financeRoutes } from './server/finance/routes'
import { stripeRoutes } from './server/stripe/routes'
import { portalRoutes } from './server/portal/routes'
import { workspaceRoutes } from './server/workspace/routes'
import { requireAuthentication } from './server/auth/middleware'
import { entityRoutes } from './server/entity/routes'
import { personalFinanceRoutes } from './server/personal-finance/routes'
import { ownershipLegalRoutes } from './server/ownership-legal/routes'

export function createApp() {
  const app = express()

  const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.APP_URL || 'http://localhost:3000')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)

  app.use((req, res, next) => {
    const origin = req.header('origin')
    if (origin && allowedOrigins.includes(origin)) {
      res.header('Access-Control-Allow-Origin', origin)
      res.header('Vary', 'Origin')
    }
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-User-Id')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS')
    res.header('Access-Control-Allow-Credentials', 'true')
    res.header('X-Content-Type-Options', 'nosniff')
    res.header('Referrer-Policy', 'strict-origin-when-cross-origin')
    res.header('X-Frame-Options', 'DENY')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
  })

  app.use(express.json({ limit: '8mb' }))
  app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')))

  app.use('/api/auth', authRoutes)
  app.use('/api/stripe', stripeRoutes)
  app.use('/api/entities', requireAuthentication, entityRoutes)
  app.use('/api/personal-finance', requireAuthentication, personalFinanceRoutes)
  app.use('/api/ownership-legal', requireAuthentication, ownershipLegalRoutes)

  // All authenticated application APIs must pass through request authentication.
  // The x-user-id header remains supported only in non-production development when explicitly enabled.
  app.use('/api/portal', requireAuthentication, portalRoutes)
  app.use('/api/workspace', requireAuthentication, workspaceRoutes)
  app.use('/api/finance', requireAuthentication, financeRoutes)

  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'bid-exact-erp', status: 'online' }))

  return app
}

export async function startServer() {
  const app = createApp()
  const PORT = Number(process.env.PORT || 3000)

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    })
    app.use(vite.middlewares)
  } else {
    const distPath = path.join(process.cwd(), 'dist')
    app.use(express.static(distPath))
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'))
    })
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[server] running on http://0.0.0.0:${PORT}`)
  })

  return app
}

if (process.env.NODE_ENV !== 'test') {
  startServer().catch((err) => {
    console.error('[server] failed to start:', err)
  })
}
