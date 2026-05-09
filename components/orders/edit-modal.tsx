'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, Clock, Save, Trash2 } from 'lucide-react'
import { ORDER_STATUSES, STATUS_REASONS, STATUS_COLORS, formatDateTime, cn } from '@/lib/utils'
import toast from 'react-hot-toast'

interface HistoryEntry { id:number; status:string; remark:string|null; reason:string|null; followUpDate:string|null; addedByName:string|null; createdAt:string }

interface Props {
  order: any
  users: {id:number; name:string; role:string}[]
  dealers: {id:number; name:string}[]
  sources: {id:number; name:string}[]
  states: {id:number; name:string}[]
  currentUser: {id:number; name:string; role:string}
  onClose: () => void
  onSaved: () => void
}

export default function OrderEditModal({ order, users, dealers, sources, states, currentUser, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    customerName: order.customerName || '',
    contactNumber: order.contactNumber || '',
    productName: order.productName || '',
    quantity: order.quantity || 1,
    price: order.price || '',
    paymentStatus: order.paymentStatus || 'Pending',
    address: order.address || '',
    city: order.city || '',
    tehsil: order.tehsil || '',
    pincode: order.pincode || '',
    status: order.status || 'New',
    reason: order.reason || '',
    remark: order.remark || '',
    followUpDate: order.followUpDate || '',
    sourceId: String(order.sourceId || ''),
    leadOwnerId: String(order.leadOwnerId || ''),
    dealerId: String(order.dealerId || ''),
    zmId: String(order.zmId || ''),
  })
  const [stateId, setStateId] = useState(String(order.stateId || ''))
  const [districtId, setDistrictId] = useState(String(order.districtId || ''))
  const [districts, setDistricts] = useState<{id:number; name:string}[]>([])
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [histLoading, setHistLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [tab, setTab] = useState<'details'|'history'>('details')

  const fieldAgents = users.filter(u => ['User','Field','ZM'].includes(u.role))
  const zmUsers = users.filter(u => u.role === 'ZM')
  const reasons = STATUS_REASONS[form.status] || []

  // Load districts when stateId changes
  useEffect(() => {
    if (!stateId) { setDistricts([]); return }
    fetch(`/api/locations?stateId=${stateId}`)
      .then(r => r.json())
      .then(d => setDistricts(d.data || []))
  }, [stateId])

  // Load history
  useEffect(() => {
    fetch(`/api/orders/${order.id}/history`)
      .then(r => r.json())
      .then(d => { setHistory(d.data || []); setHistLoading(false) })
  }, [order.id])

  async function handleSave() {
    if (!form.contactNumber.trim()) { toast.error('Phone required'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          quantity: parseInt(String(form.quantity)) || 1,
          price: form.price || null,
          stateId: stateId ? parseInt(stateId) : null,
          districtId: districtId ? parseInt(districtId) : null,
          sourceId: form.sourceId ? parseInt(form.sourceId) : null,
          leadOwnerId: form.leadOwnerId ? parseInt(form.leadOwnerId) : null,
          dealerId: form.dealerId ? parseInt(form.dealerId) : null,
          zmId: form.zmId ? parseInt(form.zmId) : null,
          followUpDate: form.followUpDate || null,
          reason: form.reason || null,
          remark: form.remark || null,
        }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Order updated!')
      onSaved()
    } catch (e: any) { toast.error(e.message) }
    finally { setSaving(false) }
  }

  async function handleDelete() {
    if (!confirm(`Delete order ${order.orderId}? This cannot be undone.`)) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/orders/${order.id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!data.success) throw new Error(data.error)
      toast.success('Order deleted')
      onSaved()
    } catch (e: any) { toast.error(e.message) }
    finally { setDeleting(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{order.orderId}</h2>
            <p className="text-xs text-gray-500 mt-0.5">{formatDateTime(order.dateTime)}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>{order.status}</span>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg ml-2">
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6 shrink-0">
          {(['details', 'history'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={cn('py-3 px-4 text-sm font-medium border-b-2 transition-colors',
                tab === t ? 'border-green-600 text-green-600' : 'border-transparent text-gray-500 hover:text-gray-700')}>
              {t === 'history' ? <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" />History ({history.length})</span> : 'Details'}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {tab === 'details' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div className="md:col-span-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Customer Info</p>
              </div>
              <div>
                <label className="label">Customer Name</label>
                <input className="input" value={form.customerName} onChange={e => setForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Full name" />
              </div>
              <div>
                <label className="label">Phone *</label>
                <input className="input" value={form.contactNumber} onChange={e => setForm(f => ({ ...f, contactNumber: e.target.value }))} />
              </div>
              <div>
                <label className="label">Address</label>
                <input className="input" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
              </div>
              <div>
                <label className="label">City</label>
                <input className="input" value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} />
              </div>
              <div>
                <label className="label">State</label>
                <select className="input" value={stateId} onChange={e => { setStateId(e.target.value); setDistrictId('') }}>
                  <option value="">Select state</option>
                  {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">District</label>
                <select className="input" value={districtId} onChange={e => setDistrictId(e.target.value)}>
                  <option value="">Select district</option>
                  {districts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Pincode</label>
                <input className="input" maxLength={6} value={form.pincode} onChange={e => setForm(f => ({ ...f, pincode: e.target.value }))} />
              </div>

              <div className="md:col-span-2 pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Order Info</p>
              </div>
              <div>
                <label className="label">Product</label>
                <input className="input" value={form.productName} onChange={e => setForm(f => ({ ...f, productName: e.target.value }))} />
              </div>
              <div>
                <label className="label">Quantity</label>
                <input type="number" min="1" className="input" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} />
              </div>
              <div>
                <label className="label">Price (₹)</label>
                <input type="number" className="input" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div>
                <label className="label">Payment Status</label>
                <select className="input" value={form.paymentStatus} onChange={e => setForm(f => ({ ...f, paymentStatus: e.target.value }))}>
                  <option value="Pending">Pending</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
              <div>
                <label className="label">Source</label>
                <select className="input" value={form.sourceId} onChange={e => setForm(f => ({ ...f, sourceId: e.target.value }))}>
                  <option value="">No source</option>
                  {sources.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="md:col-span-2 pt-2">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status & Assignment</p>
              </div>
              <div>
                <label className="label text-green-700 font-semibold">Status *</label>
                <select className="input border-green-400 focus:ring-green-500" value={form.status}
                  onChange={e => setForm(f => ({ ...f, status: e.target.value, reason: '' }))}>
                  {ORDER_STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Reason</label>
                <select className="input" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}>
                  <option value="">Select reason</option>
                  {reasons.map(r => <option key={r}>{r}</option>)}
                </select>
              </div>
              <div>
                <label className="label">Follow-up Date</label>
                <input type="date" className="input" value={form.followUpDate} onChange={e => setForm(f => ({ ...f, followUpDate: e.target.value }))} />
              </div>
              <div>
                <label className="label">Lead Owner</label>
                <select className="input" value={form.leadOwnerId} onChange={e => setForm(f => ({ ...f, leadOwnerId: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {fieldAgents.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              {(currentUser.role === 'Admin' || currentUser.role === 'ZM') && (
                <div>
                  <label className="label">Zone Manager</label>
                  <select className="input" value={form.zmId} onChange={e => setForm(f => ({ ...f, zmId: e.target.value }))}>
                    <option value="">No ZM</option>
                    {zmUsers.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
              )}
              {(currentUser.role === 'Admin' || currentUser.role === 'ZM') && (
                <div>
                  <label className="label">Dealer</label>
                  <select className="input" value={form.dealerId} onChange={e => setForm(f => ({ ...f, dealerId: e.target.value }))}>
                    <option value="">No dealer</option>
                    {dealers.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              <div className="md:col-span-2">
                <label className="label">Remark</label>
                <textarea className="input resize-none" rows={3} value={form.remark} onChange={e => setForm(f => ({ ...f, remark: e.target.value }))} placeholder="Add internal notes..." />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {histLoading && <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>}
              {!histLoading && history.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p className="text-sm">No history yet</p>
                </div>
              )}
              {history.map((h, i) => (
                <div key={h.id} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full mt-1.5 shrink-0" />
                    {i < history.length - 1 && <div className="w-0.5 bg-gray-200 flex-1 mt-1" />}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge text-xs ${STATUS_COLORS[h.status] || 'bg-gray-100 text-gray-700'}`}>{h.status}</span>
                      {h.reason && <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{h.reason}</span>}
                      {h.followUpDate && <span className="text-xs text-blue-600">📅 {h.followUpDate}</span>}
                    </div>
                    {h.remark && <p className="text-sm text-gray-700 mt-1.5 bg-gray-50 rounded-lg p-2">{h.remark}</p>}
                    <p className="text-xs text-gray-400 mt-1.5">
                      {h.addedByName || 'System'} · {formatDateTime(h.createdAt)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50 shrink-0">
          <div>
            {currentUser.role === 'Admin' && (
              <button onClick={handleDelete} disabled={deleting} className="btn-danger btn-sm">
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="btn-secondary btn-sm">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary btn-sm">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving...</> : <><Save className="w-3.5 h-3.5" />Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
