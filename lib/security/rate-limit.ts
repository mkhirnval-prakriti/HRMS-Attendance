/**
 * Rate Limiter — In-memory (no Redis needed for single-instance)
 * Prakriti Herbs CRM — Phase 4 Security
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
  windowMs: number   // e.g. 60_000 = 1 minute
  max: number        // max requests per window
  identifier?: string
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  resetAt: number
}

export function rateLimit(
  ip: string,
  config: RateLimitConfig
): RateLimitResult {
  const key = `${config.identifier ?? 'default'}:${ip}`
  const now = Date.now()

  let entry = store.get(key)
  if (!entry || entry.resetAt < now) {
    entry = { count: 0, resetAt: now + config.windowMs }
    store.set(key, entry)
  }

  entry.count++

  return {
    success: entry.count <= config.max,
    limit: config.max,
    remaining: Math.max(0, config.max - entry.count),
    resetAt: entry.resetAt,
  }
}

// Preset configs
export const LIMITS = {
  // Auth endpoints — strict
  auth:    { windowMs: 15 * 60_000, max: 10,  identifier: 'auth' },
  // General API — moderate
  api:     { windowMs: 60_000,       max: 120, identifier: 'api' },
  // Export endpoints — loose
  export:  { windowMs: 60_000,       max: 10,  identifier: 'export' },
  // Bulk operations — very strict
  bulk:    { windowMs: 60_000,       max: 5,   identifier: 'bulk' },
  // Dashboard/read — generous
  read:    { windowMs: 60_000,       max: 300, identifier: 'read' },
} satisfies Record<string, RateLimitConfig>
