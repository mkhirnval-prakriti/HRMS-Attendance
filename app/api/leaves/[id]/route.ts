/**
 * Leave Request — Approve/Reject
 * PATCH /api/leaves/[id]
 * DELETE /api/leaves/[id]
 */
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { leaveRequests } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireRole, requireAuth, handleApiError } from '@/lib/auth'
import { rateLimit, LIMITS } from '@/lib/security/rate-limit'
import { logAudit } from '@/lib/security/audit'
import { z } from 'zod'

const approvalSchema = z.object({
  status:  z.enum(['Approved', 'Rejected']),
  remarks: z.string().max(500).optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rl = rateLimit(req.headers.get('x-forwarded-for') ?? '127.0.0.1', LIMITS.api)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const user = await requireRole('Admin', 'ZM')
    const id = parseInt(params.id)
    const body = await req.json()
    const parsed = approvalSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid input' }, { status: 400 })
    }

    const [record] = await db
      .update(leaveRequests)
      .set({
        status:     parsed.data.status,
        approvedBy: parseInt(user.id),
        approvedAt: new Date(),
        remarks:    parsed.data.remarks ?? null,
      })
      .where(eq(leaveRequests.id, id))
      .returning()

    if (!record) {
      return NextResponse.json({ success: false, error: 'Leave request not found' }, { status: 404 })
    }

    await logAudit({
      userId:     user.id,
      userEmail:  user.email,
      action:     'order_update',
      resource:   'leave_requests',
      resourceId: id,
      details:    { status: parsed.data.status, remarks: parsed.data.remarks },
    })

    return NextResponse.json({ success: true, data: record })
  } catch (err) {
    return handleApiError(err)
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const rl = rateLimit(req.headers.get('x-forwarded-for') ?? '127.0.0.1', LIMITS.api)
  if (!rl.success) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  try {
    const user = await requireAuth()
    const id = parseInt(params.id)

    const leave = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.id, id))
      .limit(1)

    if (!leave[0]) {
      return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    }

    // Only own pending leaves or admin can cancel
    const isOwner = leave[0].userId === parseInt(user.id)
    const isAdmin = user.role === 'Admin'
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Access denied' }, { status: 403 })
    }
    if (leave[0].status !== 'Pending' && !isAdmin) {
      return NextResponse.json({ success: false, error: 'Cannot cancel approved/rejected leave' }, { status: 400 })
    }

    await db
      .update(leaveRequests)
      .set({ status: 'Cancelled' })
      .where(eq(leaveRequests.id, id))

    return NextResponse.json({ success: true })
  } catch (err) {
    return handleApiError(err)
  }
}
