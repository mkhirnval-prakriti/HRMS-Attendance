import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, users, dealers, sources, states, districts } from '@/lib/db/schema'
import { eq, and, ilike, gte, lte, desc, count } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { generateOrderId } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page')??'1')
    const pageSize = parseInt(searchParams.get('pageSize')??'20')
    const offset = (page-1)*pageSize
    const conditions = [eq(orders.isDeleted, false)]
    if (user.role==='User'||user.role==='Field') conditions.push(eq(orders.leadOwnerId, user.id))
    if (user.role==='ZM') conditions.push(eq(orders.zmId, user.id))
    const status = searchParams.get('status')
    if (status && status!=='all') conditions.push(eq(orders.status, status as any))
    const phone = searchParams.get('phone')
    if (phone) conditions.push(ilike(orders.contactNumber, `%${phone}%`))
    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) conditions.push(gte(orders.dateTime, new Date(dateFrom)))
    const dateTo = searchParams.get('dateTo')
    if (dateTo) conditions.push(lte(orders.dateTime, new Date(dateTo+'T23:59:59')))
    const where = and(...conditions)
    const [rows, [{total}]] = await Promise.all([
      db.select({
        id:orders.id,orderId:orders.orderId,dateTime:orders.dateTime,
        customerName:orders.customerName,contactNumber:orders.contactNumber,
        productName:orders.productName,quantity:orders.quantity,price:orders.price,
        paymentStatus:orders.paymentStatus,city:orders.city,pincode:orders.pincode,
        status:orders.status,reason:orders.reason,remark:orders.remark,
        followUpDate:orders.followUpDate,createdAt:orders.createdAt,
        stateName:states.name,districtName:districts.name,
        sourceName:sources.name,ownerName:users.name,dealerName:dealers.name,
      }).from(orders)
        .leftJoin(states,eq(orders.stateId,states.id))
        .leftJoin(districts,eq(orders.districtId,districts.id))
        .leftJoin(sources,eq(orders.sourceId,sources.id))
        .leftJoin(users,eq(orders.leadOwnerId,users.id))
        .leftJoin(dealers,eq(orders.dealerId,dealers.id))
        .where(where).orderBy(desc(orders.dateTime)).limit(pageSize).offset(offset),
      db.select({total:count()}).from(orders).where(where),
    ])
    return NextResponse.json({ success:true, data:rows,
      pagination:{page,pageSize,total:Number(total),totalPages:Math.ceil(Number(total)/pageSize)} })
  } catch(e:any) {
    return NextResponse.json({ success:false, error:e.message }, { status:500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await req.json()
    if (!body.contactNumber) return NextResponse.json({success:false,error:'Phone required'},{status:400})
    const [last] = await db.select({id:orders.id}).from(orders).orderBy(desc(orders.id)).limit(1)
    const [created] = await db.insert(orders).values({
      orderId: generateOrderId(last?.id??0),
      dateTime: new Date(),
      customerName: body.customerName||'UNKNOWN',
      contactNumber: body.contactNumber,
      productName: body.productName||null,
      quantity: body.quantity||1,
      price: body.price||null,
      paymentStatus: body.paymentStatus||'Pending',
      address: body.address||null,
      city: body.city||null,
      tehsil: body.tehsil||null,
      stateId: body.stateId||null,
      districtId: body.districtId||null,
      pincode: body.pincode||null,
      status: body.status||'New',
      reason: body.reason||null,
      remark: body.remark||null,
      followUpDate: body.followUpDate||null,
      sourceId: body.sourceId||null,
      leadOwnerId: body.leadOwnerId||user.id,
      agentAssignDate: new Date().toISOString().split('T')[0],
    }).returning()
    const { orderHistory } = await import('@/lib/db/schema')
    await db.insert(orderHistory).values({
      orderId:created.id, status:created.status,
      remark:created.remark, reason:created.reason,
      addedById:user.id, addedByName:user.name,
    })
    return NextResponse.json({ success:true, data:created }, { status:201 })
  } catch(e:any) {
    return NextResponse.json({ success:false, error:e.message }, { status:500 })
  }
}
