import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payments, invoices, dealers } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'

export async function GET(req: NextRequest) {
  try {
    await requireAuth()
    const { searchParams } = new URL(req.url)
    const dealerId = searchParams.get('dealerId')
    const conditions = dealerId ? [eq(payments.dealerId, parseInt(dealerId))] : []
    const data = await db.select({
      id: payments.id, amount: payments.amount,
      paymentDate: payments.paymentDate, paymentMode: payments.paymentMode,
      reference: payments.reference, notes: payments.notes, createdAt: payments.createdAt,
      dealerName: dealers.name, invoiceNo: invoices.invoiceNo,
    }).from(payments)
      .leftJoin(dealers, eq(payments.dealerId, dealers.id))
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(payments.createdAt)).limit(200)
    return NextResponse.json({ success: true, data })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (!['Admin', 'ZM'].includes(user.role)) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })
    const body = await req.json()
    if (!body.dealerId || !body.amount || !body.paymentDate) {
      return NextResponse.json({ success: false, error: 'dealerId, amount and paymentDate required' }, { status: 400 })
    }
    const amount = parseFloat(body.amount)
    const [payment] = await db.insert(payments).values({
      dealerId: parseInt(body.dealerId),
      invoiceId: body.invoiceId ? parseInt(body.invoiceId) : null,
      amount: String(amount),
      paymentDate: body.paymentDate,
      paymentMode: body.paymentMode || null,
      reference: body.reference || null,
      notes: body.notes || null,
    }).returning()

    // Update invoice paid/balance if invoiceId provided
    if (body.invoiceId) {
      const inv = await db.query.invoices.findFirst({ where: eq(invoices.id, parseInt(body.invoiceId)) })
      if (inv) {
        const newPaid = parseFloat(String(inv.paid || 0)) + amount
        const newBalance = parseFloat(String(inv.grandTotal || 0)) - newPaid
        await db.update(invoices).set({ paid: String(newPaid), balance: String(newBalance) }).where(eq(invoices.id, parseInt(body.invoiceId)))
      }
    }

    // Update dealer balance
    const dealer = await db.query.dealers.findFirst({ where: eq(dealers.id, parseInt(body.dealerId)) })
    if (dealer) {
      const newBalance = parseFloat(String(dealer.balance || 0)) + amount
      await db.update(dealers).set({ balance: String(newBalance) }).where(eq(dealers.id, parseInt(body.dealerId)))
    }

    return NextResponse.json({ success: true, data: payment }, { status: 201 })
  } catch (e: any) { return NextResponse.json({ success: false, error: e.message }, { status: 500 }) }
}
