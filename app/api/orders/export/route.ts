import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, users, dealers, sources, states, districts } from '@/lib/db/schema'
import { eq, and, desc, gte, lte, ilike } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import * as XLSX from 'xlsx'
import { formatDateTime } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const user = await requireAuth()
    const { searchParams } = new URL(req.url)
    const conditions = [eq(orders.isDeleted,false)]
    if (user.role==='User'||user.role==='Field') conditions.push(eq(orders.leadOwnerId,user.id))
    const status = searchParams.get('status')
    if (status&&status!=='all') conditions.push(eq(orders.status,status as any))
    const dateFrom = searchParams.get('dateFrom')
    if (dateFrom) conditions.push(gte(orders.dateTime,new Date(dateFrom)))
    const dateTo = searchParams.get('dateTo')
    if (dateTo) conditions.push(lte(orders.dateTime,new Date(dateTo+'T23:59:59')))
    const phone = searchParams.get('phone')
    if (phone) conditions.push(ilike(orders.contactNumber,`%${phone}%`))

    const rows = await db.select({
      orderId:orders.orderId, dateTime:orders.dateTime,
      customerName:orders.customerName, contactNumber:orders.contactNumber,
      productName:orders.productName, quantity:orders.quantity,
      price:orders.price, paymentStatus:orders.paymentStatus,
      address:orders.address, city:orders.city, pincode:orders.pincode,
      status:orders.status, reason:orders.reason, remark:orders.remark,
      followUpDate:orders.followUpDate, stateName:states.name,
      districtName:districts.name, sourceName:sources.name,
      ownerName:users.name, dealerName:dealers.name,
    }).from(orders)
      .leftJoin(states,eq(orders.stateId,states.id))
      .leftJoin(districts,eq(orders.districtId,districts.id))
      .leftJoin(sources,eq(orders.sourceId,sources.id))
      .leftJoin(users,eq(orders.leadOwnerId,users.id))
      .leftJoin(dealers,eq(orders.dealerId,dealers.id))
      .where(and(...conditions)).orderBy(desc(orders.dateTime)).limit(50000)

    const wsData = rows.map(r=>({
      'Order ID':r.orderId,'Date':formatDateTime(r.dateTime),
      'Customer':r.customerName,'Phone':r.contactNumber,
      'Product':r.productName,'Qty':r.quantity,'Price':r.price,
      'Payment':r.paymentStatus,'Status':r.status,'Reason':r.reason??'',
      'Remark':r.remark??'','City':r.city??'','State':r.stateName??'',
      'District':r.districtName??'','Pincode':r.pincode??'',
      'Source':r.sourceName??'','Agent':r.ownerName??'','Dealer':r.dealerName??'',
      'Follow-up':r.followUpDate??'',
    }))

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(wsData), 'Orders')
    const buf = XLSX.write(wb, { type:'buffer', bookType:'xlsx' })
    return new NextResponse(buf, { headers:{
      'Content-Type':'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition':`attachment; filename="orders-${Date.now()}.xlsx"`,
    }})
  } catch(e:any) { return NextResponse.json({success:false,error:e.message},{status:500}) }
}
