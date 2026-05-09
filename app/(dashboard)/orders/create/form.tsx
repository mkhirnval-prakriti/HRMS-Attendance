'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { ORDER_STATUSES, STATUS_REASONS } from '@/lib/utils'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface Props {
  users:{id:number;name:string}[];
  sources:{id:number;name:string}[];
  states:{id:number;name:string}[];
  items:{id:number;name:string;price:string|null}[];
}

export default function CreateOrderForm({ users, sources, states, items }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [districts, setDistricts] = useState<{id:number;name:string}[]>([])
  const [form, setForm] = useState({
    customerName:'',contactNumber:'',productName:'',quantity:1,price:'',
    paymentStatus:'Pending',address:'',city:'',tehsil:'',pincode:'',
    status:'New',reason:'',remark:'',followUpDate:'',
    sourceId:'',leadOwnerId:'',stateId:'',districtId:'',
  })

  function set(k:string,v:any) { setForm(f=>({...f,[k]:v})) }

  async function loadDistricts(sid:string) {
    set('stateId',sid); set('districtId','')
    if(sid) {
      const r = await fetch(`/api/locations?stateId=${sid}`)
      const d = await r.json()
      setDistricts(d.data||[])
    }
  }

  async function handleSubmit(e:React.FormEvent) {
    e.preventDefault()
    if(!form.contactNumber) { toast.error('Phone number required'); return }
    setLoading(true)
    try {
      const res = await fetch('/api/orders',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...form,
          quantity:parseInt(String(form.quantity))||1,
          sourceId:form.sourceId||null, leadOwnerId:form.leadOwnerId||null,
          stateId:form.stateId||null, districtId:form.districtId||null,
        })
      })
      const data = await res.json()
      if(!data.success) throw new Error(data.error)
      toast.success('Order created: '+data.data.orderId)
      router.push('/orders')
    } catch(e:any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  const reasons = STATUS_REASONS[form.status]||[]

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/orders" className="btn-ghost btn-sm p-2"><ArrowLeft className="w-4 h-4"/></Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Create New Order</h1>
          <p className="text-sm text-gray-500">Fill in order details</p>
        </div>
      </div>
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="label">Customer Name</label>
            <input className="input" value={form.customerName} onChange={e=>set('customerName',e.target.value)} placeholder="Full name"/></div>
          <div><label className="label text-red-600">Phone *</label>
            <input className="input" value={form.contactNumber} onChange={e=>set('contactNumber',e.target.value)} placeholder="10-digit mobile" required/></div>
          <div><label className="label">Product</label>
            <input className="input" value={form.productName} onChange={e=>set('productName',e.target.value)} list="products-list"/>
            <datalist id="products-list">{items.map(i=><option key={i.id} value={i.name}/>)}</datalist></div>
          <div><label className="label">Quantity</label>
            <input type="number" min="1" className="input" value={form.quantity} onChange={e=>set('quantity',parseInt(e.target.value)||1)}/></div>
          <div><label className="label">Price (₹)</label>
            <input type="number" className="input" value={form.price} onChange={e=>set('price',e.target.value)} placeholder="0.00"/></div>
          <div><label className="label">Payment Status</label>
            <select className="input" value={form.paymentStatus} onChange={e=>set('paymentStatus',e.target.value)}>
              <option>Pending</option><option>Completed</option>
            </select></div>
          <div><label className="label">Status</label>
            <select className="input" value={form.status} onChange={e=>set('status',e.target.value)}>
              {ORDER_STATUSES.map(s=><option key={s}>{s}</option>)}
            </select></div>
          <div><label className="label">Reason</label>
            <select className="input" value={form.reason} onChange={e=>set('reason',e.target.value)}>
              <option value="">Select reason</option>
              {reasons.map(r=><option key={r}>{r}</option>)}
            </select></div>
          <div><label className="label">Follow-up Date</label>
            <input type="date" className="input" value={form.followUpDate} onChange={e=>set('followUpDate',e.target.value)}/></div>
          <div><label className="label">Source</label>
            <select className="input" value={form.sourceId} onChange={e=>set('sourceId',e.target.value)}>
              <option value="">Select source</option>
              {sources.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div><label className="label">Lead Owner</label>
            <select className="input" value={form.leadOwnerId} onChange={e=>set('leadOwnerId',e.target.value)}>
              <option value="">Unassigned</option>
              {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
            </select></div>
          <div><label className="label">State</label>
            <select className="input" value={form.stateId} onChange={e=>loadDistricts(e.target.value)}>
              <option value="">Select state</option>
              {states.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
            </select></div>
          <div><label className="label">District</label>
            <select className="input" value={form.districtId} onChange={e=>set('districtId',e.target.value)}>
              <option value="">Select district</option>
              {districts.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
            </select></div>
          <div><label className="label">City</label>
            <input className="input" value={form.city} onChange={e=>set('city',e.target.value)}/></div>
          <div><label className="label">Pincode</label>
            <input className="input" maxLength={6} value={form.pincode} onChange={e=>set('pincode',e.target.value)}/></div>
          <div className="md:col-span-2"><label className="label">Address</label>
            <textarea className="input resize-none" rows={2} value={form.address} onChange={e=>set('address',e.target.value)}/></div>
          <div className="md:col-span-2"><label className="label">Remark</label>
            <textarea className="input resize-none" rows={2} value={form.remark} onChange={e=>set('remark',e.target.value)}/></div>
        </div>
        <div className="flex justify-end gap-3">
          <Link href="/orders" className="btn-secondary">Cancel</Link>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading?<><Loader2 className="w-4 h-4 animate-spin"/>Creating...</>:<><Save className="w-4 h-4"/>Create Order</>}
          </button>
        </div>
      </form>
    </div>
  )
}
