'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Loader2, Settings2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SettingsClient({ sources }: { sources:{id:number;name:string;isActive:boolean|null}[] }) {
  const router = useRouter()
  const [newSource, setNewSource] = useState('')
  const [loading, setLoading] = useState(false)

  async function addSource() {
    if (!newSource.trim()) return
    setLoading(true)
    const res = await fetch('/api/sources',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:newSource.trim()})})
    const data = await res.json()
    if (data.success) { toast.success('Source added'); setNewSource(''); router.refresh() }
    else toast.error(data.error)
    setLoading(false)
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div><h1 className="text-xl font-bold">Settings</h1><p className="text-sm text-gray-500">Manage system configuration</p></div>

      <div className="card p-5">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Settings2 className="w-4 h-4 text-green-600"/>Lead Sources</h2>
        <div className="space-y-2 mb-4">
          {sources.map(s=>(
            <div key={s.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
              <span className="text-sm font-medium">{s.name}</span>
              <span className={`badge text-xs ${s.isActive?'bg-green-100 text-green-700':'bg-gray-100 text-gray-500'}`}>{s.isActive?'Active':'Inactive'}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input className="input flex-1" placeholder="New source name" value={newSource} onChange={e=>setNewSource(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addSource()}/>
          <button onClick={addSource} disabled={loading} className="btn-primary">
            {loading?<Loader2 className="w-4 h-4 animate-spin"/>:<><Plus className="w-4 h-4"/>Add</>}
          </button>
        </div>
      </div>

      <div className="card p-5">
        <h2 className="font-semibold mb-2">System Info</h2>
        <div className="text-sm text-gray-600 space-y-1">
          <p>CRM Version: 1.0.0</p>
          <p>Stack: Next.js 14 + PostgreSQL + Supabase Auth</p>
          <p>Build: Production-ready</p>
        </div>
      </div>
    </div>
  )
}
