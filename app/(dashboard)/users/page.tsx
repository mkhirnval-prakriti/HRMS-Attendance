import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import UsersClient from './client'

export default async function UsersPage() {
  const currentUser = await getCurrentUser()
  if (!currentUser || currentUser.role!=='Admin') redirect('/dashboard')
  const allUsers = await db.select().from(users)
  return <UsersClient users={allUsers} />
}
