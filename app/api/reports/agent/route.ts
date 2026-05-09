import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, users } from '@/lib/db/schema'
import { count, eq, and, gte, lte, sql } from 'drizzle-orm'
import { requireRole } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requireRole(['Admin', 'ZM'])
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')

    const conditions = [eq(orders.isDeleted, false)]
    if (from) conditions.push(gte(orders.dateTime, new Date(from)))
    if (to) conditions.push(lte(orders.dateTime, new Date(to + 'T23:59:59')))

    const rows = await db
      .select({
        agentId: orders.leadOwnerId,
        agentName: users.name,
        total: count(),
        delivered: sql<number>`SUM(CASE WHEN ${orders.status}='Delivered' THEN 1 ELSE 0 END)`,
        confirmed: sql<number>`SUM(CASE WHEN ${orders.status}='Confirmed' THEN 1 ELSE 0 END)`,
        cancelled: sql<number>`SUM(CASE WHEN ${orders.status} IN ('Cancelled','Final Cancel','Confirm Cancel','Dealer Cancel') THEN 1 ELSE 0 END)`,
        pending: sql<number>`SUM(CASE WHEN ${orders.status} IN ('Pending','Callback','UNA','Cancel Pending','Confirm Pending') THEN 1 ELSE 0 END)`,
        revenue: sql<number>`SUM(CAST(${orders.amount} AS NUMERIC))`,
      })
      .from(orders)
      .leftJoin(users, eq(orders.leadOwnerId, users.id))
      .where(and(...conditions))
      .groupBy(orders.leadOwnerId, users.name)
      .orderBy(sql`SUM(CASE WHEN ${orders.status}='Delivered' THEN 1 ELSE 0 END) DESC`)

    const data = rows.map(r => ({
      ...r,
      total: Number(r.total),
      delivered: Number(r.delivered),
      confirmed: Number(r.confirmed),
      cancelled: Number(r.cancelled),
      pending: Number(r.pending),
      revenue: Number(r.revenue ?? 0),
      conversionRate: r.total > 0 ? ((Number(r.delivered) / Number(r.total)) * 100).toFixed(1) : '0.0',
    }))

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
