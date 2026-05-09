import { db } from '@/lib/db'
import { sources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import SettingsClient from './client'

export default async function SettingsPage() {
  const allSources = await db.select().from(sources)
  return <SettingsClient sources={allSources} />
}
