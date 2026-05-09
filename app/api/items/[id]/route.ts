import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { items } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth()
    if (user.role !== 'Admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    const [updated] = await db.update(items).set({
      name: body.name, skuCode: body.skuCode, uom: body.uom,
      stock: parseInt(body.stock) || 0, price: body.price || null, isActive: body.isActive,
    }).where(eq(items.id, parseInt(params.id))).returning()
    return NextResponse.json({ success: true, data: updated })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}
