import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { items } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function GET() {
  try {
    await requireAuth()
    const data = await db.select().from(items).where(eq(items.isActive, true)).orderBy(items.name)
    return NextResponse.json({ success: true, data })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (user.role !== 'Admin') return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    if (!body.name || !body.skuCode) return NextResponse.json({ success: false, error: 'Name and SKU required' }, { status: 400 })
    const [created] = await db.insert(items).values({
      skuCode: body.skuCode, name: body.name,
      uom: body.uom || 'Pcs',
      stock: parseInt(body.stock) || 0,
      price: body.price || null, isActive: true,
    }).returning()
    return NextResponse.json({ success: true, data: created }, { status: 201 })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}
