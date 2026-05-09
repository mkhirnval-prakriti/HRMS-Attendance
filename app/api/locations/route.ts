import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { districts, states } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const stateId = searchParams.get('stateId')
    if (stateId) {
      const data = await db.select().from(districts).where(eq(districts.stateId, parseInt(stateId))).orderBy(districts.name)
      return NextResponse.json({ success:true, data })
    }
    const data = await db.select().from(states).orderBy(states.name)
    return NextResponse.json({ success:true, data })
  } catch(e:any) { return NextResponse.json({success:false,error:e.message},{status:500}) }
}
