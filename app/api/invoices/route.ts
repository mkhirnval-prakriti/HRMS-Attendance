import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { invoices, dealers } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { requireAuth } from '@/lib/auth'
import { generateInvoiceNo } from '@/lib/utils'

export async function GET() {
  try {
    await requireAuth()
    const data = await db.select({
      id:invoices.id, invoiceNo:invoices.invoiceNo, invoiceDate:invoices.invoiceDate,
      grandTotal:invoices.grandTotal, paid:invoices.paid, balance:invoices.balance,
      dealerName:dealers.name,
    }).from(invoices).leftJoin(dealers,eq(invoices.dealerId,dealers.id)).orderBy(desc(invoices.createdAt))
    return NextResponse.json({ success:true, data })
  } catch(e:any) { return NextResponse.json({success:false,error:e.message},{status:500}) }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireAuth()
    if (!['Admin','ZM'].includes(user.role)) return NextResponse.json({success:false,error:'Forbidden'},{status:403})
    const body = await req.json()
    const [last] = await db.select({id:invoices.id}).from(invoices).orderBy(desc(invoices.id)).limit(1)
    const total = parseFloat(body.grandTotal)||0
    const [created] = await db.insert(invoices).values({
      invoiceNo: generateInvoiceNo(last?.id??0),
      dealerId: parseInt(body.dealerId),
      invoiceDate: body.invoiceDate,
      grandTotal: String(total),
      paid: '0',
      balance: String(total),
      notes: body.notes||null,
    }).returning()
    return NextResponse.json({ success:true, data:created },{status:201})
  } catch(e:any) { return NextResponse.json({success:false,error:e.message},{status:500}) }
}
