'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Loader2, Package } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Item { id:number; skuCode:string; name:string; uom:string|null; stock:number|null; price:string|null; isActive:boolean|null }

export default function ItemsClient({ items: initItems }: { items: Item[] }) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [editItem, setEditItem] = useState<Item|null>(null)
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ skuCode:'', name:'', uom:'Pcs', stock:'0', price:'' })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setLoading(true)
    try {
      const url = editItem ? `/api/items/${editItem.id}` : '/api/items'
      const method = editItem ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(editItem ? 'Item updated' : 'Item created')
      setShowForm(false); setEditItem(null)
      setForm({ skuCode:'', name:'', uom:'Pcs', stock:'0', price:'' })
      router.refresh()
    } catch(e: any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  function openEdit(item: Item) {
    setEditItem(item)
    setForm({ skuCode:item.skuCode, name:item.name, uom:item.uom||'Pcs', stock:String(item.stock||0), price:item.price||'' })
    setShowForm(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Items / Products</h1><p className="text-sm text-gray-500">{initItems.length} items</p></div>
        <button onClick={()=>{setEditItem(null);setForm({skuCode:'',name:'',uom:'Pcs',stock:'0',price:''});setShowForm(true)}} className="btn-primary btn-sm">
          <Plus className="w-3.5 h-3.5"/>Add Item
        </button>
      </div>
      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4">{editItem?'Edit Item':'Add Item'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">SKU Code *</label><input className="input" value={form.skuCode} onChange={e=>setForm(f=>({...f,skuCode:e.target.value}))} required/></div>
            <div><label className="label">Item Name *</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
            <div><label className="label">UOM</label>
              <select className="input" value={form.uom} onChange={e=>setForm(f=>({...f,uom:e.target.value}))}>
                {['Pcs','Box','Kg','Gm','Ltr','ML','Pack'].map(u=><option key={u}>{u}</option>)}
              </select></div>
            <div><label className="label">Stock</label><input type="number" className="input" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/></div>
            <div><label className="label">Price (₹)</label><input type="number" className="input" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/></div>
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading?<Loader2 className="w-4 h-4 animate-spin"/>:editItem?'Update':'Create'}
              </button>
            </div>
          </form>
        </div>
      )}
      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr><th className="th">SKU</th><th className="th">Name</th><th className="th">UOM</th><th className="th">Stock</th><th className="th">Price</th><th className="th">Status</th><th className="th">Actions</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {initItems.length===0 && <tr><td colSpan={7} className="py-12 text-center text-gray-400">No items added yet</td></tr>}
            {initItems.map(item=>(
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="table-cell font-mono text-xs text-green-600">{item.skuCode}</td>
                <td className="table-cell font-medium">{item.name}</td>
                <td className="table-cell text-gray-500">{item.uom||'Pcs'}</td>
                <td className={`table-cell font-medium ${Number(item.stock||0)<10?'text-red-600':'text-gray-700'}`}>{item.stock||0}</td>
                <td className="table-cell">{item.price?formatCurrency(item.price):'—'}</td>
                <td className="table-cell"><span className={`badge ${item.isActive?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>{item.isActive?'Active':'Inactive'}</span></td>
                <td className="table-cell"><button onClick={()=>openEdit(item)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Pencil className="w-3.5 h-3.5 text-gray-500"/></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
