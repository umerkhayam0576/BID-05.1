import 'dotenv/config'
import express from 'express'
import path from 'path'
import { createServer as createViteServer } from 'vite'
import { financeRoutes } from './server/finance/routes'
import { stripeRoutes } from './server/stripe/routes'
import { portalRoutes } from './server/portal/routes'
import { workspaceRoutes } from './server/workspace/routes'

export function createApp() {
  const app = express()
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Headers', 'Content-Type, x-user-id')
    res.header('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS')
    next()
  })

  // Stripe webhook uses raw body parser before json parser
  app.use('/api/stripe', stripeRoutes)

  app.use(express.json({ limit: '1mb' }))
  app.use('/api/portal', portalRoutes)
  app.use('/api/workspace', workspaceRoutes)
  app.use('/api/finance', financeRoutes)
  app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'bid-exact-erp', status: 'online' }))

  return app
}

export async function startServer() {
  const app = createApp()
  const PORT = 3000

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
