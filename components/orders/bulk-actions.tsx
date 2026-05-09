'use client'
import { useState } from 'react'
import { CheckSquare, X, Users, Truck, Tag, Trash2, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Props {
  selected: number[]
  users: {id:number;name:string}[]
  dealers: {id:number;name:string}[]
  currentUser: {role:string}
  onDone: () => void
}

export default function BulkActionsBar({ selected, users, dealers, currentUser, onDone }: Props) {
  const [loading, setLoading] = useState(false)

  async function doAction(action:string, value?:string) {
    if (!value && action!=='delete') return
    if (action==='delete' && !confirm(`Delete ${selected.length} orders permanently?`)) return
    setLoading(true)
    try {
      const res = await fetch('/api/orders/bulk-actions', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({ action, ids:selected, value })
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(`${data.updated} orders updated`)
      onDone()
    } catch(e:any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div className="card p-3 bg-green-50 border-green-200 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <CheckSquare className="w-4 h-4 text-green-600"/>
        <span className="text-sm font-medium text-green-800">{selected.length} selected</span>
      </div>
      {loading && <Loader2 className="w-4 h-4 animate-spin text-green-600"/>}

      {/* Change Status */}
      <div className="flex items-center gap-1.5">
        <Tag className="w-4 h-4 text-gray-500"/>
        <select className="input py-1.5 text-sm w-auto" defaultValue="" onChange={e=>{ if(e.target.value) doAction('changeStatus',e.target.value) }}>
          <option value="">Change Status</option>
          {['New','Confirmed','In Transit','Delivered','Pending','Callback','Cancelled','GPO'].map(s=>
            <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Change Owner */}
      <div className="flex items-center gap-1.5">
        <Users className="w-4 h-4 text-gray-500"/>
        <select className="input py-1.5 text-sm w-auto" defaultValue="" onChange={e=>{ if(e.target.value) doAction('changeOwner',e.target.value) }}>
          <option value="">Assign Owner</option>
          {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
        </select>
      </div>

      {/* Assign Dealer */}
      {(currentUser.role==='Admin'||currentUser.role==='ZM') && (
        <div className="flex items-center gap-1.5">
          <Truck className="w-4 h-4 text-gray-500"/>
          <select className="input py-1.5 text-sm w-auto" defaultValue="" onChange={e=>{ if(e.target.value) doAction('changeDealer',e.target.value) }}>
            <option value="">Assign Dealer</option>
            {dealers.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        </div>
      )}

      {currentUser.role==='Admin' && (
        <button onClick={()=>doAction('delete')} className="btn-danger btn-sm ml-auto">
          <Trash2 className="w-3.5 h-3.5"/>Delete
        </button>
      )}
    </div>
  )
}
