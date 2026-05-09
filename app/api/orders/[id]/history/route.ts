import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orderHistory } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth()
    const history = await db.select().from(orderHistory)
      .where(eq(orderHistory.orderId, parseInt(params.id)))
      .orderBy(desc(orderHistory.createdAt))
    return NextResponse.json({ success:true, data:history })
  } catch(e:any) { return NextResponse.json({ success:false, error:e.message }, { status:500 }) }
}
