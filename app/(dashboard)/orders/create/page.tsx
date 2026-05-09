import { db } from '@/lib/db'
import { users, sources, states, items } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import CreateOrderForm from './form'

export default async function CreateOrderPage() {
  const [allUsers, allSources, allStates, allItems] = await Promise.all([
    db.select({id:users.id,name:users.name}).from(users).where(eq(users.isActive,true)),
    db.select().from(sources).where(eq(sources.isActive,true)),
    db.select().from(states),
    db.select({id:items.id,name:items.name,price:items.price}).from(items).where(eq(items.isActive,true)),
  ])
  return <CreateOrderForm users={allUsers} sources={allSources} states={allStates} items={allItems}/>
}
