/**
 * Auth Helpers — Prakriti Herbs CRM
 * Server-side auth with role-based access control
 */
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export type UserRole = 'Admin' | 'User' | 'ZM' | 'Field'

export interface AuthUser {
  id:       string
  email:    string
  role:     UserRole
  name:     string
  isActive: boolean
}

// Create Supabase server client
export function createSupabaseServerClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get:    (n)    => cookieStore.get(n)?.value,
        set:    (n, v, o) => { try { cookieStore.set({ name: n, value: v, ...o }) } catch {} },
        remove: (n, o)    => { try { cookieStore.set({ name: n, value: '', ...o }) } catch {} },
      },
    }
  )
}

// Require authenticated user — throws APIError if not
export async function requireAuth(): Promise<AuthUser> {
  const supabase = createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new AuthError('Authentication required', 401)
  }

  // Get user details from DB
  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.supabaseId, user.id))
    .limit(1)

  if (!dbUser[0]) {
    throw new AuthError('User not found', 403)
  }

  if (!dbUser[0].isActive) {
    throw new AuthError('Account is deactivated', 403)
  }

  return {
    id:       dbUser[0].id.toString(),
    email:    dbUser[0].email ?? user.email ?? '',
    role:     (dbUser[0].role ?? 'User') as UserRole,
    name:     dbUser[0].name ?? '',
    isActive: dbUser[0].isActive ?? true,
  }
}

// Require specific role(s)
export async function requireRole(...roles: UserRole[]): Promise<AuthUser> {
  const user = await requireAuth()
  if (!roles.includes(user.role)) {
    throw new AuthError(`Access denied. Required: ${roles.join(' or ')}`, 403)
  }
  return user
}

// Role hierarchy check
export function canAccess(userRole: UserRole, requiredRole: UserRole): boolean {
  const hierarchy: Record<UserRole, number> = {
    Admin: 4, ZM: 3, User: 2, Field: 1,
  }
  return hierarchy[userRole] >= hierarchy[requiredRole]
}

// Custom auth error
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message)
    this.name = 'AuthError'
  }
}

// Standard error handler for API routes
export function handleApiError(err: unknown): NextResponse {
  if (err instanceof AuthError) {
    return NextResponse.json(
      { success: false, error: err.message },
      { status: err.statusCode }
    )
  }
  console.error('[API Error]:', err)
  return NextResponse.json(
    { success: false, error: 'Internal server error' },
    { status: 500 }
  )
}

// Wrap API handler with auth + error handling
export function withAuth<T>(
  handler: (user: AuthUser, req: Request) => Promise<NextResponse>
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      const user = await requireAuth()
      return await handler(user, req)
    } catch (err) {
      return handleApiError(err)
    }
  }
}

// Wrap API handler with role check
export function withRole<T>(
  roles: UserRole[],
  handler: (user: AuthUser, req: Request) => Promise<NextResponse>
) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      const user = await requireRole(...roles)
      return await handler(user, req)
    } catch (err) {
      return handleApiError(err)
    }
  }
}

// Alias — some pages use getCurrentUser instead of requireAuth
export const getCurrentUser = requireAuth

// requireAdmin — shortcut for Admin-only routes  
export async function requireAdmin(): Promise<AuthUser> {
  return requireRole('Admin')
}
