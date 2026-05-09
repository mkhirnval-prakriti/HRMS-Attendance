import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const user = await requireAuth()
    if (user.role !== 'Admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const data = await db.select({
      id: users.id, name: users.name, email: users.email, phone: users.phone,
      role: users.role, isActive: users.isActive, createdAt: users.createdAt,
      supabaseId: users.supabaseId, zmId: users.zmId,
    }).from(users).orderBy(desc(users.createdAt))
    return NextResponse.json({ success: true, data })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const current = await requireAuth()
    if (current.role !== 'Admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    if (!body.name || !body.email || !body.password) {
      return NextResponse.json({ success: false, error: 'Name, email and password required' }, { status: 400 })
    }

    // Create Supabase auth user
    const supabaseAdmin = createSupabaseAdmin()
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    })
    if (authError) return NextResponse.json({ success: false, error: authError.message }, { status: 400 })

    // Create DB record linked to Supabase user
    const [created] = await db.insert(users).values({
      supabaseId: authData.user.id,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      role: body.role || 'User',
      zmId: body.zmId ? parseInt(body.zmId) : null,
      isActive: true,
    }).returning()

    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}
