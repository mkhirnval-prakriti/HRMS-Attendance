import { requireAuth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import FollowUpsClient from './client'

export default async function FollowUpsPage() {
  let user
  try { user = await requireAuth() } catch { redirect('/login') }
  return <FollowUpsClient user={user} />
}
