/**
 * Attendance API — Prakriti Herbs CRM
 * GET  /api/attendance?userId=&date=&month=&year=
 * POST /api/attendance
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { attendance, users } from '@/lib/db/schema'
import { eq, and, gte, lte, desc } from 'drizzle-orm'
import { requireAuth, handleApiError } from '@/lib/auth'
import { rateLimit, LIMITS } from '@/lib/security/rate-limit'
import { logAudit } from '@/lib/security/audit'
import { z } from 'zod'

const markAttendanceSchema = z.object({
  userId:    z.number().int().positive(),
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format'),
  status:    z.enum(['Present', 'Absent', 'Half Day', 'Late', 'Leave', 'Holiday']),
  checkIn:   z.string().optional(),
  checkOut:  z.string().optional(),
  notes:     z.string().max(500).optional(),
})

export async function GET(req: NextRequest) {
  const rl = rateLimit(req.headers.get('x-forwarded-for') ?? '127.0.0.1', LIMITS.read)
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const user = await requireAuth()
    const { searchParams } = new URL(req.url)

    const userId = searchParams.get('userId')
      ? parseInt(searchParams.get('userId')!)
      : null
    const month = searchParams.get('month')
      ? parseInt(searchParams.get('month')!)
      : new Date().getMonth() + 1
    const year  = searchParams.get('year')
      ? parseInt(searchParams.get('year')!)
      : new Date().getFullYear()

    // Date range for month
    const startDate = `${year}-${String(month).padStart(2,'0')}-01`
    const endDate   = new Date(year, month, 0).toISOString().split('T')[0]

    const conditions = [
      gte(attendance.date, startDate),
      lte(attendance.date, endDate),
    ]

    // Non-admin users can only see their own attendance
    const targetUserId = (user.role === 'Admin' || user.role === 'ZM')
      ? (userId ?? parseInt(user.id))
      : parseInt(user.id)

    conditions.push(eq(attendance.userId, targetUserId))

    const records = await db
      .select()
      .from(attendance)
      .where(and(...conditions))
      .orderBy(desc(attendance.date))

    // Summary stats
    const summary = {
      total:    records.length,
      present:  records.filter(r => r.status === 'Present').length,
      absent:   records.filter(r => r.status === 'Absent').length,
      halfDay:  records.filter(r => r.status === 'Half Day').length,
      late:     records.filter(r => r.status === 'Late').length,
      leave:    records.filter(r => r.status === 'Leave').length,
      holiday:  records.filter(r => r.status === 'Holiday').length,
    }

    return NextResponse.json({ success: true, data: records, summary })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req.headers.get('x-forwarded-for') ?? '127.0.0.1', LIMITS.api)
  if (!rl.success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  try {
    const user = await requireAuth()

    // Only Admin/ZM can mark attendance for others
    if (user.role !== 'Admin' && user.role !== 'ZM') {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const parsed = markAttendanceSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const { userId, date, status, checkIn, checkOut, notes } = parsed.data

    // Upsert attendance record
    const existing = await db
      .select()
      .from(attendance)
      .where(and(eq(attendance.userId, userId), eq(attendance.date, date)))
      .limit(1)

    let record
    if (existing[0]) {
      const updated = await db
        .update(attendance)
        .set({ status, checkIn: checkIn ? new Date(checkIn) : null, checkOut: checkOut ? new Date(checkOut) : null, notes: notes ?? null, markedBy: parseInt(user.id), updatedAt: new Date() })
        .where(eq(attendance.id, existing[0].id))
        .returning()
      record = updated[0]
    } else {
      const inserted = await db
        .insert(attendance)
        .values({ userId, date, status, checkIn: checkIn ? new Date(checkIn) : null, checkOut: checkOut ? new Date(checkOut) : null, notes: notes ?? null, markedBy: parseInt(user.id) })
        .returning()
      record = inserted[0]
    }

    await logAudit({
      userId:     user.id,
      userEmail:  user.email,
      action:     'order_update', // reusing enum — should add 'attendance_mark'
      resource:   'attendance',
      resourceId: record?.id,
      details:    { userId, date, status },
      ipAddress:  req.headers.get('x-forwarded-for') ?? undefined,
    })

    return NextResponse.json({ success: true, data: record }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
