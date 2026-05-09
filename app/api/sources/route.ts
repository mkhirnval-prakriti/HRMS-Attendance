import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    await requireAuth()
    const data = await db.select().from(sources).where(eq(sources.isActive, true))
    return NextResponse.json({ success:true, data })
  } catch(e:any) { return NextResponse.json({success:false,error:e.message},{status:500}) }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user.role!=='Admin') return NextResponse.json({success:false,error:'Forbidden'},{status:403})
    const { name } = await req.json()
    const [created] = await db.insert(sources).values({ name }).returning()
    return NextResponse.json({ success:true, data:created },{status:201})
  } catch(e:any) { return NextResponse.json({success:false,error:e.message},{status:500}) }
}
