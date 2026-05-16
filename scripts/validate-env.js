/**
 * Environment Variable Validator
 * Runs before build/start to catch missing configs early
 */
const REQUIRED = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'DATABASE_URL',
  'NEXT_PUBLIC_APP_URL',
  'APP_SECRET',
]

const missing = REQUIRED.filter(k => !process.env[k])

if (missing.length > 0) {
  console.error('\n❌ Missing required environment variables:')
  missing.forEach(k => console.error(`   • ${k}`))
  console.error('\nCheck your .env file or VPS environment.\n')
  process.exit(1)
}

console.log('✅ All required environment variables present')
