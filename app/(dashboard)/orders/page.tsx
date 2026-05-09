import { db } from '@/lib/db'
import { orders, users, dealers, sources, states, districts } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { and, eq, ilike, gte, lte, desc, count } from 'drizzle-orm'
import OrdersClient from './client'

export default async function OrdersPage({ searchParams }: { searchParams: Record<string,string> }) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const page = parseInt(searchParams.page??'1')
  const pageSize = parseInt(searchParams.pageSize??'20')
  const offset = (page-1)*pageSize

  const conditions = [eq(orders.isDeleted, false)]
  if (user.role==='User'||user.role==='Field') conditions.push(eq(orders.leadOwnerId, user.id))
  if (user.role==='ZM') conditions.push(eq(orders.zmId, user.id))
  if (searchParams.status && searchParams.status!=='all') conditions.push(eq(orders.status, searchParams.status as any))
  if (searchParams.sourceId) conditions.push(eq(orders.sourceId, parseInt(searchParams.sourceId)))
  if (searchParams.ownerId) conditions.push(eq(orders.leadOwnerId, parseInt(searchParams.ownerId)))
  if (searchParams.dealerId) conditions.push(eq(orders.dealerId, parseInt(searchParams.dealerId)))
  if (searchParams.stateId) conditions.push(eq(orders.stateId, parseInt(searchParams.stateId)))
  if (searchParams.paymentStatus && searchParams.paymentStatus!=='all') conditions.push(eq(orders.paymentStatus, searchParams.paymentStatus as any))
  if (searchParams.phone) conditions.push(ilike(orders.contactNumber, `%${searchParams.phone}%`))
  if (searchParams.orderId) conditions.push(ilike(orders.orderId, `%${searchParams.orderId}%`))
  if (searchParams.dateFrom) conditions.push(gte(orders.dateTime, new Date(searchParams.dateFrom)))
  if (searchParams.dateTo) conditions.push(lte(orders.dateTime, new Date(searchParams.dateTo+'T23:59:59')))
  if (searchParams.followFrom) conditions.push(gte(orders.followUpDate, searchParams.followFrom))
  if (searchParams.followTo) conditions.push(lte(orders.followUpDate, searchParams.followTo))

  const where = and(...conditions)

  const [rows, [{total}], allUsers, allDealers, allSources, allStates] = await Promise.all([
    db.select({
      id:orders.id, orderId:orders.orderId, dateTime:orders.dateTime,
      customerName:orders.customerName, contactNumber:orders.contactNumber,
      productName:orders.productName, quantity:orders.quantity,
      price:orders.price, paymentStatus:orders.paymentStatus,
      city:orders.city, pincode:orders.pincode,
      status:orders.status, reason:orders.reason, remark:orders.remark,
      followUpDate:orders.followUpDate, createdAt:orders.createdAt,
      stateName:states.name, districtName:districts.name,
      sourceName:sources.name, ownerName:users.name, dealerName:dealers.name,
    }).from(orders)
      .leftJoin(states,eq(orders.stateId,states.id))
      .leftJoin(districts,eq(orders.districtId,districts.id))
      .leftJoin(sources,eq(orders.sourceId,sources.id))
      .leftJoin(users,eq(orders.leadOwnerId,users.id))
      .leftJoin(dealers,eq(orders.dealerId,dealers.id))
      .where(where).orderBy(desc(orders.dateTime)).limit(pageSize).offset(offset),
    db.select({total:count()}).from(orders).where(where),
    db.select({id:users.id,name:users.name,role:users.role}).from(users).where(eq(users.isActive,true)),
    db.select({id:dealers.id,name:dealers.name}).from(dealers).where(eq(dealers.isActive,true)),
    db.select().from(sources).where(eq(sources.isActive,true)),
    db.select().from(states),
  ])

  return (
    <OrdersClient
      orders={rows as any}
      pagination={{ page, pageSize, total:Number(total), totalPages:Math.ceil(Number(total)/pageSize) }}
      users={allUsers}
      dealers={allDealers}
      sources={allSources}
      states={allStates}
      currentUser={user}
      searchParams={searchParams}
    />
  )
}
