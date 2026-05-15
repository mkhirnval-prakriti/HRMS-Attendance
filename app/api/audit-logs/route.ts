import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { auditLogs, users } from '@/lib/db/schema'
import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { requireRole } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['Admin'])
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const conditions = []
    if (from) conditions.push(gte(auditLogs.createdAt, new Date(from)))
    if (to) conditions.push(lte(auditLogs.createdAt, new Date(to + 'T23:59:59')))

    const data = await db
      .select({
        id: auditLogs.id,
        entity: auditLogs.entity,
        entityId: auditLogs.entityId,
        action: auditLogs.action,
        details: auditLogs.details,
        createdAt: auditLogs.createdAt,
        userName: users.name,
      })
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.userId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.createdAt))
      .limit(limit)
      .offset((page - 1) * limit)

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    await db.insert(auditLogs).values({
      userId: body.userId,
      entity: body.entity,
      entityId: body.entityId,
      action: body.action,
      details: body.details ? JSON.stringify(body.details) : null,
    })
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
