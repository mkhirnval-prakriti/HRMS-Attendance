#!/usr/bin/env node
/**
 * Environment Validation Script
 * Run this before starting the app to ensure all required variables are configured
 * Usage: npm run validate:env
 */

const requiredEnv = [
  {
    key: 'NEXT_PUBLIC_SUPABASE_URL',
    description: 'Supabase project URL',
    sensitive: false,
  },
  {
    key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    description: 'Supabase anonymous key (for client)',
    sensitive: false,
  },
  {
    key: 'SUPABASE_SERVICE_ROLE_KEY',
    description: 'Supabase service role key (for server)',
    sensitive: true,
  },
  {
    key: 'DATABASE_URL',
    description: 'PostgreSQL connection string',
    sensitive: true,
  },
  {
    key: 'APP_SECRET',
    description: 'Application secret for encryption',
    sensitive: true,
  },
]

const optionalEnv = [
  {
    key: 'NEXT_PUBLIC_APP_URL',
    description: 'Application public URL',
    default: 'http://localhost:3000',
    sensitive: false,
  },
  {
    key: 'UPSTASH_REDIS_REST_URL',
    description: 'Redis cache URL (optional)',
    sensitive: false,
  },
  {
    key: 'UPSTASH_REDIS_REST_TOKEN',
    description: 'Redis cache token (optional)',
    sensitive: true,
  },
]

console.log('\n' + '='.repeat(70))
console.log('ENVIRONMENT VALIDATION')
console.log('='.repeat(70) + '\n')

let errors = []
let warnings = []

// Check required variables
console.log('Checking REQUIRED variables:\n')
requiredEnv.forEach(({ key, description, sensitive }) => {
  const value = process.env[key]
  if (!value) {
    errors.push(`❌ ${key}: NOT SET - ${description}`)
    console.log(`❌ ${key}`)
    console.log(`   └─ ${description}`)
  } else {
    const display = sensitive
      ? '***' + value.slice(-6)
      : value.length > 50
        ? value.slice(0, 50) + '...'
        : value
    console.log(`✅ ${key}`)
    console.log(`   └─ ${display}`)
  }
})

// Check optional variables
console.log('\nChecking OPTIONAL variables:\n')
optionalEnv.forEach(({ key, description, default: defaultVal, sensitive }) => {
  const value = process.env[key]
  if (!value) {
    warnings.push(`⚠️  ${key}: NOT SET (using default: ${defaultVal})`)
    console.log(`⚠️  ${key}`)
    console.log(`   └─ Not set (default: ${defaultVal})`)
  } else {
    const display = sensitive
      ? '***' + value.slice(-6)
      : value.length > 50
        ? value.slice(0, 50) + '...'
        : value
    console.log(`✅ ${key}`)
    console.log(`   └─ ${display}`)
  }
})

// Summary
console.log('\n' + '='.repeat(70))
if (errors.length > 0) {
  console.log(`\n❌ VALIDATION FAILED: ${errors.length} error(s)\n`)
  errors.forEach((e) => console.log(`  ${e}`))
  console.log(
    '\n⚠️  Please set the missing environment variables in .env.local'
  )
  console.log('📚 See .env.local for instructions\n')
  process.exit(1)
} else {
  console.log('\n✅ VALIDATION PASSED: All required variables are set\n')
  if (warnings.length > 0) {
    console.log(`⚠️  ${warnings.length} warning(s):\n`)
    warnings.forEach((w) => console.log(`  ${w}`))
  }
  console.log()
  process.exit(0)
}
