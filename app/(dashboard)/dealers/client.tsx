'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Loader2, Search } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Dealer { id:number;dealerCode:string;name:string;contactPerson:string|null;mobile:string|null;city:string|null;isActive:boolean;balance:string;stateName:string|null }

export default function DealersClient({ dealers: initDealers, states }: { dealers:Dealer[]; states:{id:number;name:string}[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editDealer, setEditDealer] = useState<Dealer|null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name:'',contactPerson:'',mobile:'',email:'',address:'',city:'',stateId:'',pincode:'' })

  const filtered = initDealers.filter(d => !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.dealerCode.includes(search) || (d.mobile||'').includes(search))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    try {
      const url = editDealer ? `/api/dealers/${editDealer.id}` : '/api/dealers'
      const method = editDealer ? 'PUT' : 'POST'
      const res = await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify({...form,stateId:form.stateId||null})})
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(editDealer?'Dealer updated':'Dealer created')
      setShowForm(false); setEditDealer(null)
      setForm({name:'',contactPerson:'',mobile:'',email:'',address:'',city:'',stateId:'',pincode:''})
      router.refresh()
    } catch(e:any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  function openEdit(d: Dealer) {
    setEditDealer(d)
    setForm({name:d.name,contactPerson:d.contactPerson||'',mobile:d.mobile||'',email:'',address:'',city:d.city||'',stateId:'',pincode:''})
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Dealers</h1><p className="text-sm text-gray-500">{initDealers.length} total</p></div>
        <button onClick={()=>{setEditDealer(null);setForm({name:'',contactPerson:'',mobile:'',email:'',address:'',city:'',stateId:'',pincode:''});setShowForm(true)}} className="btn-primary btn-sm">
          <Plus className="w-3.5 h-3.5"/>Add Dealer
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4">{editDealer?'Edit Dealer':'Create Dealer'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Dealer Name *</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
            <div><label className="label">Contact Person</label><input className="input" value={form.contactPerson} onChange={e=>setForm(f=>({...f,contactPerson:e.target.value}))}/></div>
            <div><label className="label">Mobile</label><input className="input" value={form.mobile} onChange={e=>setForm(f=>({...f,mobile:e.target.value}))}/></div>
            <div><label className="label">Email</label><input type="email" className="input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
            <div><label className="label">City</label><input className="input" value={form.city} onChange={e=>setForm(f=>({...f,city:e.target.value}))}/></div>
            <div><label className="label">State</label>
              <select className="input" value={form.stateId} onChange={e=>setForm(f=>({...f,stateId:e.target.value}))}>
                <option value="">Select state</option>
                {states.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
            <div><label className="label">Pincode</label><input className="input" value={form.pincode} onChange={e=>setForm(f=>({...f,pincode:e.target.value}))}/></div>
            <div><label className="label">Address</label><input className="input" value={form.address} onChange={e=>setForm(f=>({...f,address:e.target.value}))}/></div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading?<Loader2 className="w-4 h-4 animate-spin"/>:editDealer?'Update':'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card p-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"/>
          <input className="input pl-9 py-2 text-sm" placeholder="Search dealers..." value={search} onChange={e=>setSearch(e.target.value)}/>
        </div>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="th">Code</th><th className="th">Name</th><th className="th">Mobile</th>
              <th className="th">City</th><th className="th">State</th><th className="th">Balance</th>
              <th className="th">Status</th><th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {filtered.length===0 && <tr><td colSpan={8} className="py-12 text-center text-gray-400">No dealers found</td></tr>}
            {filtered.map(d=>(
              <tr key={d.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs text-green-600">{d.dealerCode}</td>
                <td className="table-cell font-medium">{d.name}</td>
                <td className="table-cell text-gray-500">{d.mobile||'—'}</td>
                <td className="table-cell text-gray-500">{d.city||'—'}</td>
                <td className="table-cell text-gray-500">{d.stateName||'—'}</td>
                <td className={`table-cell font-medium ${Number(d.balance)<0?'text-red-600':'text-green-600'}`}>{formatCurrency(d.balance)}</td>
                <td className="table-cell">
                  <span className={`badge ${d.isActive?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{d.isActive?'Active':'Inactive'}</span>
                </td>
                <td className="table-cell">
                  <button onClick={()=>openEdit(d)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Pencil className="w-3.5 h-3.5 text-gray-500"/></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
