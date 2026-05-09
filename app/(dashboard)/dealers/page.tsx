import { db } from '@/lib/db'
import { dealers, states, districts } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import DealersClient from './client'

export default async function DealersPage() {
  const [allDealers, allStates] = await Promise.all([
    db.select({
      id:dealers.id, dealerCode:dealers.dealerCode, name:dealers.name,
      contactPerson:dealers.contactPerson, mobile:dealers.mobile,
      city:dealers.city, isActive:dealers.isActive, balance:dealers.balance,
      stateName:states.name, districtName:districts.name,
    }).from(dealers)
      .leftJoin(states, eq(dealers.stateId, states.id))
      .leftJoin(districts, eq(dealers.districtId, districts.id))
      .orderBy(dealers.dealerCode),
    db.select().from(states).orderBy(states.name),
  ])
  return <DealersClient dealers={allDealers as any} states={allStates} />
}
