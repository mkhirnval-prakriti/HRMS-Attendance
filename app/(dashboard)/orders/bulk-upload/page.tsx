import { db } from '@/lib/db'
import { sources } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import BulkUploadClient from './client'

export default async function BulkUploadPage() {
  const allSources = await db.select().from(sources).where(eq(sources.isActive, true))
  return <BulkUploadClient sources={allSources} />
}
