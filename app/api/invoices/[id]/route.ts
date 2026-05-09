import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invoices, invoiceItems, payments, dealers } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth, requireRole } from '@/lib/auth'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireAuth()
    const id = parseInt(params.id)
    const [inv] = await db
      .select({
        id: invoices.id, invoiceNo: invoices.invoiceNo, invoiceDate: invoices.invoiceDate,
        grandTotal: invoices.grandTotal, paid: invoices.paid, balance: invoices.balance,
        notes: invoices.notes, createdAt: invoices.createdAt,
        dealerId: invoices.dealerId, dealerName: dealers.name,
        dealerCode: dealers.dealerCode, dealerCity: dealers.city,
      })
      .from(invoices)
      .leftJoin(dealers, eq(invoices.dealerId, dealers.id))
      .where(eq(invoices.id, id))

    if (!inv) return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })

    const items = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, id))
    const paymentList = await db
      .select()
      .from(payments)
      .where(eq(payments.invoiceId, id))

    return NextResponse.json({ success: true, data: { ...inv, items, payments: paymentList } })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['Admin', 'ZM'])
    const id = parseInt(params.id)
    const body = await req.json()

    await db.update(invoices).set({
      notes: body.notes ?? undefined,
      invoiceDate: body.invoiceDate ?? undefined,
    }).where(eq(invoices.id, id))

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    await requireRole(['Admin'])
    const id = parseInt(params.id)
    // Delete related items and payments first
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, id))
    await db.delete(payments).where(eq(payments.invoiceId, id))
    await db.delete(invoices).where(eq(invoices.id, id))
    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
