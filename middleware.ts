/**
 * Next.js Middleware — Prakriti Herbs CRM
 * Handles: Auth, Rate Limiting, Security Headers
 */
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { rateLimit, LIMITS } from '@/lib/security/rate-limit'
import { SECURITY_HEADERS, rateLimitHeaders } from '@/lib/security/headers'

// Public routes (no auth required)
const PUBLIC_ROUTES = ['/login', '/api/health', '/api/auth']

function isPublic(pathname: string): boolean {
  return PUBLIC_ROUTES.some(r => pathname.startsWith(r))
}

// Get client IP from request
function getIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    req.headers.get('x-real-ip') ??
    '127.0.0.1'
  )
}

// Apply security headers to any response
function applySecurityHeaders(res: NextResponse): NextResponse {
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    if (value) res.headers.set(key, value)
    else res.headers.delete(key)
  }
  return res
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getIp(request)

  // ── Rate limiting ──────────────────────────────────────────
  const limitConfig = pathname.startsWith('/api/auth')
    ? LIMITS.auth
    : pathname.startsWith('/api/')
      ? pathname.includes('export') || pathname.includes('bulk')
        ? LIMITS.bulk
        : LIMITS.api
      : LIMITS.read

  const rl = rateLimit(ip, limitConfig)
  const rlHeaders = rateLimitHeaders(rl.limit, rl.remaining, rl.resetAt)

  if (!rl.success) {
    const res = new NextResponse(
      JSON.stringify({ success: false, error: 'Too many requests', retryAfter: rlHeaders['Retry-After'] }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    )
    applySecurityHeaders(res)
    for (const [k, v] of Object.entries(rlHeaders)) {
      if (v) res.headers.set(k, v)
    }
    return res
  }

  // ── CORS preflight ─────────────────────────────────────────
  if (request.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 200 })
    applySecurityHeaders(res)
    res.headers.set('Access-Control-Allow-Origin',  request.headers.get('origin') ?? '*')
    res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS')
    res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    res.headers.set('Access-Control-Max-Age',       '86400')
    return res
  }

  // ── Public routes — just add headers ──────────────────────
  if (isPublic(pathname)) {
    const res = NextResponse.next({ request: { headers: request.headers } })
    applySecurityHeaders(res)
    for (const [k, v] of Object.entries(rlHeaders)) {
      if (v) res.headers.set(k, v)
    }
    return res
  }

  // ── Auth check ─────────────────────────────────────────────
  let response = NextResponse.next({ request: { headers: request.headers } })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get:    (n)       => request.cookies.get(n)?.value,
          set:    (n, v, o) => {
            request.cookies.set({ name: n, value: v, ...o })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name: n, value: v, ...o })
          },
          remove: (n, o)    => {
            request.cookies.set({ name: n, value: '', ...o })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name: n, value: '', ...o })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    // Root redirect
    if (pathname === '/') {
      const dest = user ? '/dashboard' : '/login'
      const res = NextResponse.redirect(new URL(dest, request.url))
      applySecurityHeaders(res)
      return res
    }

    // Protected route — not authenticated
    if (!user) {
      const res = NextResponse.redirect(new URL('/login', request.url))
      applySecurityHeaders(res)
      return res
    }

    // Authenticated — apply headers and rate limit info
    applySecurityHeaders(response)
    for (const [k, v] of Object.entries(rlHeaders)) {
      if (v) response.headers.set(k, v)
    }
    return response

  } catch {
    const res = NextResponse.redirect(new URL('/login', request.url))
    applySecurityHeaders(res)
    return res
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png).*)'],
}
