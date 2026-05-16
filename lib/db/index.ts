/**
 * Database Connection — Prakriti Herbs CRM
 * Uses postgres.js + Drizzle ORM
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

declare global {
  // eslint-disable-next-line no-var
  var _pgClient: postgres.Sql | undefined
}

function createClient() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not defined')

  return postgres(url, {
    max:          10,
    idle_timeout: 30,
    connect_timeout: 10,
    ssl: url.includes('supabase.co') ? { rejectUnauthorized: false } : false,
  })
}

// In development, reuse the connection to avoid exhausting the pool
const client =
  process.env.NODE_ENV === 'production'
    ? createClient()
    : (globalThis._pgClient ??= createClient())

export const db = drizzle(client, { schema })
export type DB = typeof db
