import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { createSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth()
    const user = await db.query.users.findFirst({ where: eq(users.id, parseInt(params.id)) })
    if (!user) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true, data: user })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const current = await requireAuth()
    if (current.role !== 'Admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    const id = parseInt(params.id)

    // If password provided, update in Supabase
    if (body.password) {
      const target = await db.query.users.findFirst({ where: eq(users.id, id) })
      if (target?.supabaseId) {
        const supabaseAdmin = createSupabaseAdmin()
        await supabaseAdmin.auth.admin.updateUserById(target.supabaseId, { password: body.password })
      }
    }

    const [updated] = await db.update(users).set({
      name: body.name,
      phone: body.phone || null,
      role: body.role,
      zmId: body.zmId ? parseInt(body.zmId) : null,
      isActive: body.isActive !== undefined ? body.isActive : true,
      updatedAt: new Date(),
    }).where(eq(users.id, id)).returning()
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const current = await requireAuth()
    if (current.role !== 'Admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const target = await db.query.users.findFirst({ where: eq(users.id, parseInt(params.id)) })
    if (!target) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
    // Deactivate instead of hard delete
    await db.update(users).set({ isActive: false, updatedAt: new Date() }).where(eq(users.id, parseInt(params.id)))
    if (target.supabaseId) {
      const supabaseAdmin = createSupabaseAdmin()
      await supabaseAdmin.auth.admin.deleteUser(target.supabaseId)
    }
    return NextResponse.json({ success: true })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}
