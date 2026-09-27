import express from 'express'
import crypto from 'node:crypto'
import { stripe, stripeIsConfigured } from './client'

export const stripeRoutes = express.Router()

stripeRoutes.get('/status', (_req, res) => {
  res.json({
    configured: stripeIsConfigured(),
    hasWebhookSecret: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    environment: process.env.STRIPE_SECRET_KEY?.startsWith('sk_live') ? 'live' : 'test',
  })
})

stripeRoutes.post('/checkout', express.json(), async (req, res) => {
  if (!stripeIsConfigured()) return res.status(503).json({ error: 'Stripe is not configured' })

  try {
    const { amount, description, referenceId, customerEmail } = req.body as Record<string, unknown>
    const amountInCents = Number(amount)
    if (!Number.isInteger(amountInCents) || amountInCents <= 0 || amountInCents > 10_000_000) {
      return res.status(400).json({ error: 'amount must be a positive integer in cents' })
    }

    const safeDescription = String(description || 'BidExact payment').slice(0, 200)
    const safeReferenceId = String(referenceId || crypto.randomUUID()).slice(0, 100)
    const session = await stripe.checkout.sessions.create({
      ui_mode: 'hosted_page',
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: safeDescription },
          unit_amount: amountInCents,
        },
        quantity: 1,
      }],
      customer_email: typeof customerEmail === 'string' ? customerEmail : undefined,
      client_reference_id: safeReferenceId,
      metadata: { referenceId: safeReferenceId },
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}?payment=cancelled`,
      integration_identifier: `bidexact_${crypto.randomBytes(4).toString('hex')}`,
    }, { idempotencyKey: `checkout_${safeReferenceId}` })

    return res.status(201).json({ id: session.id, url: session.url })
  } catch (error) {
    console.error('[stripe] checkout session creation failed', error)
    return res.status(500).json({ error: 'Unable to create checkout session' })
  }
})

stripeRoutes.post('/webhook', express.raw({ type: 'application/json' }), (req, res) => {
  if (!stripeIsConfigured()) return res.status(503).send('Stripe is not configured')

  try {
    const signature = req.header('stripe-signature')
    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) return res.status(400).send('Missing webhook signature')
    const event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET)

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object
      if (session.payment_status === 'paid') {
        console.log('[stripe] payment completed', { sessionId: session.id, referenceId: session.metadata?.referenceId })
      }
    }

    return res.json({ received: true })
  } catch (error) {
    console.error('[stripe] webhook verification failed', error)
    return res.status(400).send('Invalid webhook signature')
  }
})
