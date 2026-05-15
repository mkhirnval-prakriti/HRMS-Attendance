/**
 * Security Headers — Prakriti Herbs CRM
 * Applied via middleware to all responses
 */

export const SECURITY_HEADERS: Record<string, string> = {
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',

  // Prevent clickjacking
  'X-Frame-Options': 'DENY',

  // XSS filter (legacy browsers)
  'X-XSS-Protection': '1; mode=block',

  // Strict referrer policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',

  // Restrict browser features
  'Permissions-Policy': [
    'geolocation=()',
    'microphone=()',
    'camera=()',
    'payment=()',
    'usb=()',
  ].join(', '),

  // HSTS — 1 year, include subdomains
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',

  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",  // Next.js needs these
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data:",
    `connect-src 'self' https://*.supabase.co wss://*.supabase.co`,
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),

  // Remove server fingerprint
  'X-Powered-By': '',
}

// Rate limit response headers
export function rateLimitHeaders(limit: number, remaining: number, resetAt: number) {
  return {
    'X-RateLimit-Limit': String(limit),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
    'Retry-After': remaining === 0
      ? String(Math.ceil((resetAt - Date.now()) / 1000))
      : undefined,
  }
}
