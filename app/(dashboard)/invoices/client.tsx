'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, FileText } from 'lucide-react'
import { formatDate, formatCurrency, generateInvoiceNo } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function InvoicesClient({ invoices: initInvoices, dealers }: { invoices:any[]; dealers:any[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ dealerId:'',invoiceDate:new Date().toISOString().split('T')[0],grandTotal:'',notes:'' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    try {
      const res = await fetch('/api/invoices',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(form)})
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Invoice created: '+data.data.invoiceNo)
      setShowForm(false); router.refresh()
    } catch(e:any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Invoices</h1><p className="text-sm text-gray-500">{initInvoices.length} total</p></div>
        <button onClick={()=>setShowForm(f=>!f)} className="btn-primary btn-sm"><Plus className="w-3.5 h-3.5"/>New Invoice</button>
      </div>
      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4">Create Invoice</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Dealer *</label>
              <select className="input" value={form.dealerId} onChange={e=>setForm(f=>({...f,dealerId:e.target.value}))} required>
                <option value="">Select dealer</option>
                {dealers.map(d=><option key={d.id} value={d.id}>{d.dealerCode} — {d.name}</option>)}
              </select></div>
            <div><label className="label">Invoice Date</label>
              <input type="date" className="input" value={form.invoiceDate} onChange={e=>setForm(f=>({...f,invoiceDate:e.target.value}))}/></div>
            <div><label className="label">Grand Total (₹)</label>
              <input type="number" className="input" value={form.grandTotal} onChange={e=>setForm(f=>({...f,grandTotal:e.target.value}))} required/></div>
            <div><label className="label">Notes</label>
              <input className="input" value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))}/></div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading?<Loader2 className="w-4 h-4 animate-spin"/>:'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b"><tr>
            <th className="th">Invoice No</th><th className="th">Dealer</th><th className="th">Date</th>
            <th className="th">Total</th><th className="th">Paid</th><th className="th">Balance</th>
          </tr></thead>
          <tbody className="divide-y divide-gray-50">
            {initInvoices.length===0 && <tr><td colSpan={6} className="py-12 text-center text-gray-400">No invoices yet</td></tr>}
            {initInvoices.map((inv:any)=>(
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="table-cell"><div className="flex items-center gap-2"><FileText className="w-4 h-4 text-green-500"/><span className="font-mono text-green-600 text-xs">{inv.invoiceNo}</span></div></td>
                <td className="table-cell"><div className="font-medium">{inv.dealerName}</div><div className="text-xs text-gray-400">{inv.dealerCode}</div></td>
                <td className="table-cell text-gray-500">{formatDate(inv.invoiceDate)}</td>
                <td className="table-cell font-medium">{formatCurrency(inv.grandTotal)}</td>
                <td className="table-cell text-green-600">{formatCurrency(inv.paid)}</td>
                <td className={`table-cell font-medium ${Number(inv.balance)>0?'text-red-600':'text-green-600'}`}>{formatCurrency(inv.balance)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
