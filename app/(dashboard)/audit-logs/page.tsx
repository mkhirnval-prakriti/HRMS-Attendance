import { requireRole } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AuditLogsClient from './client'

export default async function AuditLogsPage() {
  try { await requireRole('Admin') } catch { redirect('/dashboard') }
  return <AuditLogsClient />
}
