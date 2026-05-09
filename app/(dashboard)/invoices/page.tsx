import { db } from '@/lib/db'
import { invoices, dealers } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import InvoicesClient from './client'

export default async function InvoicesPage() {
  const [allInvoices, allDealers] = await Promise.all([
    db.select({
      id:invoices.id, invoiceNo:invoices.invoiceNo, invoiceDate:invoices.invoiceDate,
      grandTotal:invoices.grandTotal, paid:invoices.paid, balance:invoices.balance,
      notes:invoices.notes, dealerName:dealers.name, dealerCode:dealers.dealerCode,
    }).from(invoices).leftJoin(dealers,eq(invoices.dealerId,dealers.id)).orderBy(desc(invoices.createdAt)),
    db.select({id:dealers.id,name:dealers.name,dealerCode:dealers.dealerCode}).from(dealers).where(eq(dealers.isActive,true)),
  ])
  return <InvoicesClient invoices={allInvoices as any} dealers={allDealers} />
}
