import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { count, eq, and, gte, lte, sql } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(req.url)
    const conditions = [eq(orders.isDeleted,false)]
    if (user.role==='User'||user.role==='Field') conditions.push(eq(orders.leadOwnerId,user.id))
    if (user.role==='ZM') conditions.push(eq(orders.zmId,user.id))
    const from = searchParams.get('from')
    if (from) conditions.push(gte(orders.dateTime, new Date(from)))
    const to = searchParams.get('to')
    if (to) conditions.push(lte(orders.dateTime, new Date(to+'T23:59:59')))
    const [statusCounts, [todayRow], [followRow]] = await Promise.all([
      db.select({status:orders.status,count:count()}).from(orders).where(and(...conditions)).groupBy(orders.status),
      db.select({count:count()}).from(orders).where(and(...conditions,gte(orders.dateTime,new Date(new Date().toDateString())))),
      db.select({count:count()}).from(orders).where(and(eq(orders.isDeleted,false),eq(orders.followUpDate,sql`CURRENT_DATE`))),
    ])
    const total = statusCounts.reduce((s,r)=>s+Number(r.count),0)
    return NextResponse.json({ success:true, data:{ statusCounts, total, todayOrders:Number(todayRow?.count??0), followUps:Number(followRow?.count??0) }})
  } catch(e:any) { return NextResponse.json({success:false,error:e.message},{status:401}) }
}
