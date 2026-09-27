export type FinanceScope = 'personal' | 'company'

export function getScope(value: unknown): FinanceScope {
  if (value !== 'personal' && value !== 'company') throw new Error('scope must be personal or company')
  return value
}

export function positiveInteger(value: unknown, name: string) {
  const parsed = Number(value)
  if (!Number.isInteger(parsed) || parsed <= 0) throw new Error(`${name} must be a positive integer`)
  return parsed
}

export function money(value: unknown, name: string) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${name} must be a non-negative number`)
  return parsed.toFixed(2)
}

export function requiredText(value: unknown, name: string) {
  const text = String(value ?? '').trim()
  if (!text) throw new Error(`${name} is required`)
  return text
}

export function getUserId(req: { header: (name: string) => string | undefined }) {
  const value = req.header('x-user-id')
  if (!value) throw new Error('Missing x-user-id')
  return value
}

export function handleRouteError(res: { status: (code: number) => { json: (body: unknown) => unknown } }, error: unknown) {
  return res.status(400).json({ error: error instanceof Error ? error.message : 'Request failed' })
}
