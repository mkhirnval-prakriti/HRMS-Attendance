import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { dealers, states, districts } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { generateDealerCode } from '@/lib/utils'

export async function GET() {
  try {
    await requireAuth()
    const data = await db.select({
      id:dealers.id, dealerCode:dealers.dealerCode, name:dealers.name,
      contactPerson:dealers.contactPerson, mobile:dealers.mobile,
      city:dealers.city, isActive:dealers.isActive, balance:dealers.balance,
      stateName:states.name, districtName:districts.name,
    }).from(dealers)
      .leftJoin(states,eq(dealers.stateId,states.id))
      .leftJoin(districts,eq(dealers.districtId,districts.id))
      .orderBy(dealers.dealerCode)
    return NextResponse.json({ success:true, data })
  } catch(e:any) { return NextResponse.json({success:false,error:e.message},{status:500}) }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (!['Admin','ZM'].includes(user.role)) return NextResponse.json({success:false,error:'Forbidden'},{status:403})
    const body = await req.json()
    const [last] = await db.select({id:dealers.id}).from(dealers).orderBy(desc(dealers.id)).limit(1)
    const [created] = await db.insert(dealers).values({
      dealerCode:generateDealerCode(last?.id??0),
      name:body.name, contactPerson:body.contactPerson||null,
      mobile:body.mobile||null, email:body.email||null,
      address:body.address||null, city:body.city||null,
      stateId:body.stateId||null, districtId:body.districtId||null,
      pincode:body.pincode||null, isActive:true, balance:'0',
    }).returning()
    return NextResponse.json({ success:true, data:created },{status:201})
  } catch(e:any) { return NextResponse.json({success:false,error:e.message},{status:500}) }
}
