import { NextResponse, type NextRequest } from 'next/server'

export class APIError extends Error {
  constructor(
    public statusCode: number = 500,
    public message: string = 'Internal Server Error',
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Standard API response format
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  code?: string
  timestamp: string
}

// Create standardized error response
export function errorResponse(
  error: unknown,
  request?: NextRequest
): NextResponse<APIResponse> {
  console.error('[API Error]', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    path: request?.nextUrl.pathname,
    method: request?.method,
    timestamp: new Date().toISOString(),
  })

  if (error instanceof APIError) {
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: error.message,
        code: error.code,
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    )
  }

  if (error instanceof SyntaxError) {
    return NextResponse.json<APIResponse>(
      {
        success: false,
        error: 'Invalid request format',
        code: 'INVALID_REQUEST',
        timestamp: new Date().toISOString(),
      },
      { status: 400 }
    )
  }

  // Default error response
  return NextResponse.json<APIResponse>(
    {
      success: false,
      error: 'Internal server error',
      code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  )
}

// Create standardized success response
export function successResponse<T>(
  data: T,
  statusCode: number = 200
): NextResponse<APIResponse<T>> {
  return NextResponse.json<APIResponse<T>>(
    {
      success: true,
      data,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  )
}

// Validate required environment variables
export function validateEnvironment() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'DATABASE_URL',
  ]

  const missing = required.filter((env) => !process.env[env])

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}`
    )
  }
}
