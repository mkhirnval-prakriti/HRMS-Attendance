/**
 * Health Check — Prakriti Herbs CRM
 * GET /api/health
 * Public endpoint for load balancers, monitoring
 */
import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sql } from 'drizzle-orm'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const start = Date.now()

  try {
    // Quick DB ping
    await db.execute(sql`SELECT 1`)
    const dbMs = Date.now() - start

    return NextResponse.json({
      status:    'ok',
      timestamp: new Date().toISOString(),
      uptime:    process.uptime(),
      db:        { status: 'ok', latencyMs: dbMs },
      version:   process.env.npm_package_version ?? '1.0.0',
    })
  } catch (err) {
    return NextResponse.json(
      {
        status:    'degraded',
        timestamp: new Date().toISOString(),
        db:        { status: 'error', error: String(err) },
      },
      { status: 503 }
    )
  }
}
