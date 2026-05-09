import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { sql, count, and, eq, gte } from 'drizzle-orm'
import DashboardClient from './client'
import { redirect } from 'next/navigation'

export default async function DashboardPage({ searchParams }: { searchParams: { from?: string; to?: string } }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const conditions = [eq(orders.isDeleted, false)]
  if (user.role === 'User' || user.role === 'Field') conditions.push(eq(orders.leadOwnerId, user.id))
  if (user.role === 'ZM') conditions.push(eq(orders.zmId, user.id))
  if (searchParams.from) conditions.push(gte(orders.dateTime, new Date(searchParams.from)))

  const [statusRows, [todayRow], [followRow]] = await Promise.all([
    db.select({ status: orders.status, count: count() })
      .from(orders).where(and(...conditions)).groupBy(orders.status),
    db.select({ count: count() }).from(orders).where(and(...conditions,
      gte(orders.dateTime, new Date(new Date().toDateString())))),
    db.select({ count: count() }).from(orders).where(and(
      eq(orders.isDeleted, false),
      eq(orders.followUpDate, sql`CURRENT_DATE`),
      ...(user.role==='User'||user.role==='Field' ? [eq(orders.leadOwnerId, user.id)] : [])
    )),
  ])

  const total = statusRows.reduce((s, r) => s + Number(r.count), 0)
  return (
    <DashboardClient
      statusCounts={statusRows}
      total={total}
      todayOrders={Number(todayRow?.count ?? 0)}
      followUps={Number(followRow?.count ?? 0)}
      role={user.role}
    />
  )
}
