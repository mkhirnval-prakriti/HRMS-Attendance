import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invoices, payments, dealers } from '@/lib/db/schema'
import { eq, sql, desc } from 'drizzle-orm'
import { requireRole } from '@/lib/auth'

export async function GET(_req: NextRequest) {
  try {
    await requireRole(['Admin', 'ZM'])

    const rows = await db
      .select({
        dealerId: dealers.id,
        dealerCode: dealers.dealerCode,
        dealerName: dealers.name,
        city: dealers.city,
        totalInvoiced: sql<number>`COALESCE(SUM(CAST(${invoices.grandTotal} AS NUMERIC)),0)`,
        totalPaid: sql<number>`COALESCE(SUM(CAST(${invoices.paid} AS NUMERIC)),0)`,
        totalBalance: sql<number>`COALESCE(SUM(CAST(${invoices.balance} AS NUMERIC)),0)`,
        invoiceCount: sql<number>`COUNT(${invoices.id})`,
      })
      .from(dealers)
      .leftJoin(invoices, eq(invoices.dealerId, dealers.id))
      .groupBy(dealers.id, dealers.dealerCode, dealers.name, dealers.city)
      .orderBy(desc(sql`COALESCE(SUM(CAST(${invoices.grandTotal} AS NUMERIC)),0)`))

    // Get payment counts
    const paymentCounts = await db
      .select({
        dealerId: payments.dealerId,
        paymentCount: sql<number>`COUNT(*)`,
        lastPayment: sql<string>`MAX(${payments.paymentDate})`,
      })
      .from(payments)
      .groupBy(payments.dealerId)

    const paymentMap = new Map(paymentCounts.map(p => [p.dealerId, p]))

    const data = rows.map(r => ({
      ...r,
      totalInvoiced: Number(r.totalInvoiced),
      totalPaid: Number(r.totalPaid),
      totalBalance: Number(r.totalBalance),
      invoiceCount: Number(r.invoiceCount),
      paymentCount: Number(paymentMap.get(r.dealerId)?.paymentCount ?? 0),
      lastPayment: paymentMap.get(r.dealerId)?.lastPayment ?? null,
    }))

    return NextResponse.json({ success: true, data })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e.message }, { status: 500 })
  }
}
