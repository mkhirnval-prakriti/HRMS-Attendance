/**
 * Leave Requests API — Prakriti Herbs CRM
 * GET  /api/leaves
 * POST /api/leaves
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leaveRequests, users } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { requireAuth, handleApiError } from '@/lib/auth'
import { rateLimit, LIMITS } from '@/lib/security/rate-limit'
import { z } from 'zod'

const leaveSchema = z.object({
  leaveType: z.enum(['Casual','Sick','Earned','Unpaid','Maternity','Paternity']),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  reason:    z.string().max(1000).optional(),
})

export async function GET(req: NextRequest) {
  const rl = rateLimit(req.headers.get('x-forwarded-for') ?? '127.0.0.1', LIMITS.read)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const user = await requireAuth()

    const data = await db
      .select({
        id:         leaveRequests.id,
        userId:     leaveRequests.userId,
        leaveType:  leaveRequests.leaveType,
        startDate:  leaveRequests.startDate,
        endDate:    leaveRequests.endDate,
        days:       leaveRequests.days,
        reason:     leaveRequests.reason,
        status:     leaveRequests.status,
        approvedBy: leaveRequests.approvedBy,
        approvedAt: leaveRequests.approvedAt,
        remarks:    leaveRequests.remarks,
        createdAt:  leaveRequests.createdAt,
        userName:   users.name,
      })
      .from(leaveRequests)
      .leftJoin(users, eq(leaveRequests.userId, users.id))
      .where(
        user.role === 'Admin' || user.role === 'ZM'
          ? undefined
          : eq(leaveRequests.userId, parseInt(user.id))
      )
      .orderBy(desc(leaveRequests.createdAt))
      .limit(100)

    return NextResponse.json({ success: true, data })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function POST(req: NextRequest) {
  const rl = rateLimit(req.headers.get('x-forwarded-for') ?? '127.0.0.1', LIMITS.api)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const user = await requireAuth()
    const body = await req.json()
    const parsed = leaveSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid input', details: parsed.error.errors },
        { status: 400 }
      )
    }

    const { leaveType, startDate, endDate, reason } = parsed.data

    // Calculate days
    const start = new Date(startDate)
    const end   = new Date(endDate)
    const days  = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (days <= 0) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      )
    }

    const [record] = await db
      .insert(leaveRequests)
      .values({
        userId: parseInt(user.id),
        leaveType, startDate, endDate, days,
        reason: reason ?? null,
        status: 'Pending',
      })
      .returning()

    return NextResponse.json({ success: true, data: record }, { status: 201 })
  } catch (err) {
    return handleApiError(err)
  }
}
