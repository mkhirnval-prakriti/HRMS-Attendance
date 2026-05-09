'use client'
import { useState, useEffect } from 'react'
import { formatDate, STATUS_COLORS, ORDER_STATUSES } from '@/lib/utils'
import toast from 'react-hot-toast'

type Order = {
  id: number; orderId: string; patientName: string; mobile: string; city: string
  status: string; amount: string; followUpDate: string; notes: string
  stateName: string; districtName: string; sourceName: string; ownerName: string
}

type Range = 'today' | 'overdue' | 'week'

export default function FollowUpsClient({ user }: { user: any }) {
  const [range, setRange] = useState<Range>('today')
  const [data, setData] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState<number | null>(null)
  const [editDate, setEditDate] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetchData() }, [range])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch(`/api/follow-ups?range=${range}`)
      const json = await res.json()
      if (json.success) setData(json.data)
    } catch { toast.error('Failed to load follow-ups') }
    finally { setLoading(false) }
  }

  function openEdit(order: Order) {
    setEditId(order.id)
    setEditDate(order.followUpDate || '')
    setEditNotes(order.notes || '')
  }

  async function saveEdit() {
    if (!editId) return
    setSaving(true)
    try {
      const res = await fetch(`/api/orders/${editId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ followUpDate: editDate || null, notes: editNotes }),
      })
      const json = await res.json()
      if (json.success) {
        toast.success('Follow-up updated')
        setEditId(null)
        fetchData()
      } else toast.error(json.error)
    } catch { toast.error('Failed to save') }
    finally { setSaving(false) }
  }

  const counts = { today: 0, overdue: 0, week: 0 }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow-ups</h1>
          <p className="text-sm text-gray-500 mt-1">Track and manage scheduled follow-up calls</p>
        </div>
        <button onClick={fetchData} className="btn-secondary text-sm">Refresh</button>
      </div>

      {/* Range tabs */}
      <div className="flex gap-2">
        {(['today', 'overdue', 'week'] as Range[]).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              range === r
                ? r === 'overdue' ? 'bg-red-600 text-white' : 'bg-green-700 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {r === 'today' ? "Today's Follow-ups" : r === 'overdue' ? 'Overdue' : 'Next 7 Days'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Loading...</div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-gray-400">
            <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm">No follow-ups for this range</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="th">Order ID</th>
                <th className="th">Patient</th>
                <th className="th">Mobile</th>
                <th className="th">Location</th>
                <th className="th">Status</th>
                <th className="th">Follow-up Date</th>
                <th className="th">Agent</th>
                <th className="th">Notes</th>
                <th className="th">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.map(order => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="table-cell font-mono text-xs text-green-700">{order.orderId}</td>
                  <td className="table-cell font-medium">{order.patientName}</td>
                  <td className="table-cell">{order.mobile}</td>
                  <td className="table-cell text-gray-500">{[order.city, order.districtName, order.stateName].filter(Boolean).join(', ')}</td>
                  <td className="table-cell">
                    <span className={`badge ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-700'}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className={`table-cell font-medium ${new Date(order.followUpDate) < new Date() ? 'text-red-600' : 'text-green-700'}`}>
                    {formatDate(order.followUpDate)}
                  </td>
                  <td className="table-cell text-gray-500">{order.ownerName || '—'}</td>
                  <td className="table-cell max-w-xs truncate text-gray-500">{order.notes || '—'}</td>
                  <td className="table-cell">
                    <button onClick={() => openEdit(order)} className="text-green-700 hover:underline text-xs font-medium">
                      Reschedule
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-xs text-gray-400">{data.length} follow-up(s) found</p>

      {/* Edit Modal */}
      {editId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
            <div className="p-5 border-b">
              <h3 className="font-semibold text-gray-900">Update Follow-up</h3>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="label">Follow-up Date</label>
                <input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} className="input" />
              </div>
              <div>
                <label className="label">Notes</label>
                <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={3} className="input" placeholder="Add notes..." />
              </div>
            </div>
            <div className="p-5 border-t flex justify-end gap-3">
              <button onClick={() => setEditId(null)} className="btn-secondary">Cancel</button>
              <button onClick={saveEdit} disabled={saving} className="btn-primary">
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
