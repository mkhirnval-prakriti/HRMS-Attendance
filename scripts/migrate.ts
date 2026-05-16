/**
 * Database Migration Runner — Prakriti Herbs CRM
 * Run: npx tsx scripts/migrate.ts
 */
import 'dotenv/config'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

async function runMigrations() {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL not set')

  console.log('🔄 Running database migrations...')
  console.log('   DB:', databaseUrl.replace(/:([^:@]+)@/, ':***@'))

  const client = postgres(databaseUrl, { max: 1 })
  const db = drizzle(client)

  try {
    await migrate(db, { migrationsFolder: 'drizzle' })
    console.log('✅ Migrations complete')
  } catch (err) {
    console.error('❌ Migration failed:', err)
    process.exit(1)
  } finally {
    await client.end()
  }
}

runMigrations()
