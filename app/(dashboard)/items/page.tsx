import { db } from '@/lib/db'
import { items } from '@/lib/db/schema'
import ItemsClient from './client'

export default async function ItemsPage() {
  const allItems = await db.select().from(items).orderBy(items.name)
  return <ItemsClient items={allItems} />
}
