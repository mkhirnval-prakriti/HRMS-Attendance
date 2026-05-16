/**
 * Rate Limiter — In-memory (no Redis needed for single-instance)
 * Prakriti Herbs CRM — Phase 4 Security
 */

interface RateLimitEntry {
  count:   number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Auto-cleanup every 5 minutes
if (typeof globalThis !== 'undefined' && typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key)
    }
  }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
  windowMs:    number   // e.g. 60_000 = 1 minute
  max:         number   // max requests per window
  identifier?: string
}

export interface RateLimitResult {
  success:   boolean
  limit:     number
  remaining: number
  resetAt:   number
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
    success:   entry.count <= config.max,
    limit:     config.max,
    remaining: Math.max(0, config.max - entry.count),
    resetAt:   entry.resetAt,
  }
}

// ── Preset rate limit configs ──────────────────────────────
export const LIMITS = {
  auth:   { windowMs: 15 * 60_000, max: 10,  identifier: 'auth'   },  // 10/15min — login
  api:    { windowMs: 60_000,       max: 120, identifier: 'api'    },  // 120/min  — general API
  export: { windowMs: 60_000,       max: 10,  identifier: 'export' },  // 10/min   — exports
  bulk:   { windowMs: 60_000,       max: 5,   identifier: 'bulk'   },  // 5/min    — bulk ops
  read:   { windowMs: 60_000,       max: 300, identifier: 'read'   },  // 300/min  — dashboard
} satisfies Record<string, RateLimitConfig>
