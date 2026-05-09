'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, UserCheck, UserX, Loader2 } from 'lucide-react'
import { formatDate, ROLES } from '@/lib/utils'
import toast from 'react-hot-toast'

interface User { id:number;name:string;email:string;phone:string|null;role:string;isActive:boolean;createdAt:string }

export default function UsersClient({ users: initUsers }: { users: User[] }) {
  const router = useRouter()
  const [users, setUsers] = useState(initUsers)
  const [showForm, setShowForm] = useState(false)
  const [editUser, setEditUser] = useState<User|null>(null)
  const [form, setForm] = useState({ name:'',email:'',phone:'',role:'User',password:'' })
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const url = editUser ? `/api/users/${editUser.id}` : '/api/users'
      const method = editUser ? 'PUT' : 'POST'
      const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success(editUser?'User updated':'User created')
      setShowForm(false); setEditUser(null)
      setForm({ name:'',email:'',phone:'',role:'User',password:'' })
      router.refresh()
    } catch(e:any) { toast.error(e.message) }
    finally { setLoading(false) }
  }

  async function toggleActive(u: User) {
    const res = await fetch(`/api/users/${u.id}`, { method:'PUT', headers:{'Content-Type':'application/json'},
      body:JSON.stringify({...u, isActive:!u.isActive}) })
    const data = await res.json()
    if (data.success) { toast.success(u.isActive?'User deactivated':'User activated'); router.refresh() }
    else toast.error(data.error)
  }

  function openEdit(u: User) { setEditUser(u); setForm({name:u.name,email:u.email,phone:u.phone||'',role:u.role,password:''}); setShowForm(true) }

  const roleColors: Record<string,string> = { Admin:'bg-purple-100 text-purple-700', ZM:'bg-blue-100 text-blue-700', User:'bg-green-100 text-green-700', Field:'bg-orange-100 text-orange-700' }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Users</h1><p className="text-sm text-gray-500">{users.length} total</p></div>
        <button onClick={()=>{setEditUser(null);setForm({name:'',email:'',phone:'',role:'User',password:''});setShowForm(true)}} className="btn-primary btn-sm">
          <Plus className="w-3.5 h-3.5"/>Add User
        </button>
      </div>

      {showForm && (
        <div className="card p-5">
          <h2 className="font-semibold mb-4">{editUser?'Edit User':'Create User'}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="label">Name *</label><input className="input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
            <div><label className="label">Email *</label><input type="email" className="input" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required disabled={!!editUser}/></div>
            <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))}/></div>
            <div><label className="label">Role</label>
              <select className="input" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                {ROLES.map(r=><option key={r}>{r}</option>)}
              </select></div>
            {!editUser && <div><label className="label">Password *</label><input type="password" className="input" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required/></div>}
            <div className="md:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={()=>setShowForm(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={loading} className="btn-primary">
                {loading?<Loader2 className="w-4 h-4 animate-spin"/>:editUser?'Update':'Create'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="th">Name</th><th className="th">Email</th><th className="th">Phone</th>
              <th className="th">Role</th><th className="th">Status</th><th className="th">Joined</th><th className="th">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(u=>(
              <tr key={u.id} className="hover:bg-gray-50">
                <td className="table-cell font-medium">{u.name}</td>
                <td className="table-cell text-gray-500">{u.email}</td>
                <td className="table-cell text-gray-500">{u.phone||'—'}</td>
                <td className="table-cell"><span className={`badge ${roleColors[u.role]||'bg-gray-100'}`}>{u.role}</span></td>
                <td className="table-cell">
                  <span className={`badge ${u.isActive?'bg-green-100 text-green-700':'bg-red-100 text-red-700'}`}>
                    {u.isActive?'Active':'Inactive'}
                  </span>
                </td>
                <td className="table-cell text-gray-400">{formatDate(u.createdAt)}</td>
                <td className="table-cell">
                  <div className="flex gap-1">
                    <button onClick={()=>openEdit(u)} className="p-1.5 hover:bg-gray-100 rounded-lg" title="Edit"><Pencil className="w-3.5 h-3.5 text-gray-500"/></button>
                    <button onClick={()=>toggleActive(u)} className="p-1.5 hover:bg-gray-100 rounded-lg" title={u.isActive?'Deactivate':'Activate'}>
                      {u.isActive?<UserX className="w-3.5 h-3.5 text-red-500"/>:<UserCheck className="w-3.5 h-3.5 text-green-500"/>}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
