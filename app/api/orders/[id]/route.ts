import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderHistory } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth()
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, parseInt(params.id)),
      with: { state:true, district:true, source:true, leadOwner:true, dealer:true,
        history:{ orderBy:(h,{desc})=>[desc(h.createdAt)] } },
    })
    if (!order) return NextResponse.json({ success:false, error:'Not found' }, { status:404 })
    return NextResponse.json({ success:true, data:order })
  } catch(e:any) { return NextResponse.json({ success:false, error:e.message }, { status:500 }) }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    const id = parseInt(params.id)
    const [updated] = await db.update(orders).set({
      customerName:body.customerName, contactNumber:body.contactNumber,
      productName:body.productName, quantity:body.quantity,
      price:body.price, paymentStatus:body.paymentStatus,
      address:body.address, city:body.city, tehsil:body.tehsil,
      stateId:body.stateId||null, districtId:body.districtId||null,
      pincode:body.pincode, status:body.status,
      reason:body.reason, remark:body.remark,
      followUpDate:body.followUpDate||null,
      sourceId:body.sourceId||null, leadOwnerId:body.leadOwnerId||null,
      zmId:body.zmId||null, dealerId:body.dealerId||null,
      agentAssignDate:body.leadOwnerId?(body.agentAssignDate||new Date().toISOString().split('T')[0]):undefined,
      dealerAssignDate:body.dealerId?(body.dealerAssignDate||new Date().toISOString().split('T')[0]):undefined,
      updatedAt:new Date(),
    }).where(eq(orders.id, id)).returning()
    await db.insert(orderHistory).values({
      orderId:id, status:body.status, remark:body.remark, reason:body.reason,
      followUpDate:body.followUpDate||null, addedById:user.id, addedByName:user.name,
    })
    return NextResponse.json({ success:true, data:updated })
  } catch(e:any) { return NextResponse.json({ success:false, error:e.message }, { status:500 }) }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    if (user.role!=='Admin') return NextResponse.json({ success:false, error:'Forbidden' }, { status:403 })
    await db.update(orders).set({ isDeleted:true, updatedAt:new Date() }).where(eq(orders.id, parseInt(params.id)))
    return NextResponse.json({ success:true })
  } catch(e:any) { return NextResponse.json({ success:false, error:e.message }, { status:500 }) }
}
