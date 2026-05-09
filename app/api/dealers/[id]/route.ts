import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dealers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    if (!['Admin','ZM'].includes(user.role)) return NextResponse.json({success:false,error:'Forbidden'},{status:403})
    const body = await req.json()
    const [updated] = await db.update(dealers).set({
      name:body.name, contactPerson:body.contactPerson||null,
      mobile:body.mobile||null, email:body.email||null,
      address:body.address||null, city:body.city||null,
      stateId:body.stateId||null, districtId:body.districtId||null,
      pincode:body.pincode||null, isActive:body.isActive,
    }).where(eq(dealers.id,parseInt(params.id))).returning()
    return NextResponse.json({ success:true, data:updated })
  } catch(e:any) { return NextResponse.json({success:false,error:e.message},{status:500}) }
}
