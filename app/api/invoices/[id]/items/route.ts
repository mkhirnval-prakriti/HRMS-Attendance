import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invoiceItems, invoices } from '@/lib/db/schema'
import { eq, sum } from 'drizzle-orm'
import { requireRole } from '@/lib/auth'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['Admin', 'ZM'])
    const invoiceId = parseInt(params.id)
    const body = await req.json()

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ success: false, error: 'items array required' }, { status: 400 })
    }

    // Remove existing items and re-add
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId))

    const toInsert = body.items.map((item: any) => ({
      invoiceId,
      itemId: item.itemId ? parseInt(item.itemId) : null,
      itemName: item.itemName,
      skuCode: item.skuCode || null,
      qty: parseInt(item.qty) || 1,
      rate: String(parseFloat(item.rate) || 0),
      amount: String((parseFloat(item.rate) || 0) * (parseInt(item.qty) || 1)),
      discount: String(parseFloat(item.discount) || 0),
    }))

    await db.insert(invoiceItems).values(toInsert)

    // Recalculate grandTotal
    const totalAmount = toInsert.reduce((s: number, i: any) => s + parseFloat(i.amount), 0)
    const inv = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) })
    if (inv) {
      const newBalance = totalAmount - parseFloat(String(inv.paid || 0))
      await db.update(invoices).set({
        grandTotal: String(totalAmount),
        balance: String(newBalance > 0 ? newBalance : 0),
      }).where(eq(invoices.id, invoiceId))
    }

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
