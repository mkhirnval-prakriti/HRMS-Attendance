import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Security headers for all responses
const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
}

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  // Add security headers to response
  Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Handle CORS for API routes
  if (request.method === 'OPTIONS') {
    response = new NextResponse(null, { status: 200 })
  }

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (n: string) => request.cookies.get(n)?.value,
          set: (n: string, v: string, o: any) => {
            request.cookies.set({ name: n, value: v, ...o })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name: n, value: v, ...o })
          },
          remove: (n: string, o: any) => {
            request.cookies.set({ name: n, value: '', ...o })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name: n, value: '', ...o })
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    const { pathname } = request.nextUrl

    // Public routes
    const publicRoutes = ['/login', '/api/health']
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

    if (pathname.startsWith('/login')) {
      if (user) return NextResponse.redirect(new URL('/dashboard', request.url))
      return response
    }

    if (pathname === '/') {
      return NextResponse.redirect(new URL(user ? '/dashboard' : '/login', request.url))
    }

    if (!user && !isPublicRoute && !pathname.startsWith('/api/auth')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    // Add security headers to auth response
    Object.entries(SECURITY_HEADERS).forEach(([key, value]) => {
      response.headers.set(key, value)
    })

    return response
  } catch (error) {
    console.error('Middleware error:', error)
    // Redirect to login on auth error
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|icon.png).*)'],
}
