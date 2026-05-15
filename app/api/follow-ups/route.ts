import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, users, states, districts, sources } from '@/lib/db/schema'
import { eq, and, sql, gte, lte, asc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
    const range = searchParams.get('range') || 'today' // today | week | overdue

    const conditions = [eq(orders.isDeleted, false)]

    if (user.role === 'User' || user.role === 'Field') {
      conditions.push(eq(orders.leadOwnerId, user.id))
    } else if (user.role === 'ZM') {
      conditions.push(eq(orders.zmId, user.id))
    }

    if (range === 'today') {
      conditions.push(eq(orders.followUpDate, sql`CURRENT_DATE`))
    } else if (range === 'overdue') {
      conditions.push(sql`${orders.followUpDate} < CURRENT_DATE`)
      conditions.push(sql`${orders.followUpDate} IS NOT NULL`)
    } else if (range === 'week') {
      const today = new Date()
      const weekEnd = new Date()
      weekEnd.setDate(today.getDate() + 7)
      conditions.push(gte(orders.followUpDate, sql`CURRENT_DATE`))
      conditions.push(lte(orders.followUpDate, weekEnd.toISOString().split('T')[0] as any))
    }

    const data = await db
      .select({
        id: orders.id,
        orderId: orders.orderId,
        patientName: orders.customerName,
        mobile: orders.contactNumber,
        city: orders.city,
        status: orders.status,
        amount: orders.price,
        followUpDate: orders.followUpDate,
        notes: orders.remark,
        stateName: states.name,
        districtName: districts.name,
        sourceName: sources.name,
        ownerName: users.name,
      })
      .from(orders)
      .leftJoin(states, eq(orders.stateId, states.id))
      .leftJoin(districts, eq(orders.districtId, districts.id))
      .leftJoin(sources, eq(orders.sourceId, sources.id))
      .leftJoin(users, eq(orders.leadOwnerId, users.id))
      .where(and(...conditions))
      .orderBy(asc(orders.followUpDate))
      .limit(500)

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
