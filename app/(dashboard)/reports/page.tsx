import { db } from '@/lib/db'
import { orders, users, dealers, sources } from '@/lib/db/schema'
import { count, eq, and, desc, sql } from 'drizzle-orm'
import ReportsClient from './client'

export default async function ReportsPage() {
  const [sourceStats, agentStats, dealerStats] = await Promise.all([
    db.select({ sourceName:sources.name, count:count(), status:orders.status })
      .from(orders).leftJoin(sources,eq(orders.sourceId,sources.id))
      .where(eq(orders.isDeleted,false))
      .groupBy(sources.name, orders.status),
    db.select({ agentName:users.name, status:orders.status, count:count() })
      .from(orders).leftJoin(users,eq(orders.leadOwnerId,users.id))
      .where(eq(orders.isDeleted,false))
      .groupBy(users.name, orders.status).orderBy(desc(count())).limit(100),
    db.select({ dealerName:dealers.name, dealerCode:dealers.dealerCode, count:count(), status:orders.status })
      .from(orders).leftJoin(dealers,eq(orders.dealerId,dealers.id))
      .where(and(eq(orders.isDeleted,false),sql`${orders.dealerId} IS NOT NULL`))
      .groupBy(dealers.name, dealers.dealerCode, orders.status).limit(200),
  ])
  return <ReportsClient sourceStats={sourceStats} agentStats={agentStats} dealerStats={dealerStats} />
}
