import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Check basic environment variables
    const requiredEnv = [
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'DATABASE_URL'
    ]

    const missingEnv = requiredEnv.filter(
      (env) => !process.env[env]
    )

    const status = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      checks: {
        supabase: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        database: !!process.env.DATABASE_URL,
        secrets: !!process.env.APP_SECRET,
      },
      warnings: missingEnv.length > 0 ? missingEnv : undefined,
    }

    return NextResponse.json(status, {
      status: missingEnv.length > 0 ? 503 : 200,
      headers: {
        'Cache-Control': 'no-store',
        'Content-Type': 'application/json',
      },
    })
  } catch (error) {
    console.error('Health check error:', error)
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
