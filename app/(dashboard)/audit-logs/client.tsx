'use client'
import { useState, useEffect } from 'react'
import { formatDateTime } from '@/lib/utils'

type Log = {
  id: number; tableName: string; recordId: number; action: string
  oldValues: string | null; newValues: string | null
  createdAt: string; userName: string
}

export default function AuditLogsClient() {
  const [logs, setLogs] = useState<Log[]>([])
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)

  useEffect(() => { fetchLogs() }, [])

  async function fetchLogs() {
    setLoading(true)
    const params = new URLSearchParams({ limit: '100' })
    if (from) params.set('from', from)
    if (to) params.set('to', to)
    const res = await fetch(`/api/audit-logs?${params}`)
    const json = await res.json()
    if (json.success) setLogs(json.data)
    setLoading(false)
  }

  const ACTION_COLORS: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-800',
    UPDATE: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800',
    LOGIN: 'bg-purple-100 text-purple-800',
  }

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
        <p className="text-sm text-gray-500 mt-1">System activity and change history (Admin only)</p>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="label">From Date</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="input w-auto" />
        </div>
        <div>
          <label className="label">To Date</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="input w-auto" />
        </div>
        <button onClick={fetchLogs} className="btn-primary">Apply</button>
        <button onClick={() => { setFrom(''); setTo(''); }} className="btn-secondary">Clear</button>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-gray-500">Loading...</div>
        ) : logs.length === 0 ? (
          <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No logs found</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="th">Time</th>
                <th className="th">User</th>
                <th className="th">Table</th>
                <th className="th">Record ID</th>
                <th className="th">Action</th>
                <th className="th">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.map(log => (
                <>
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="table-cell text-gray-500 text-xs">{formatDateTime(log.createdAt)}</td>
                    <td className="table-cell font-medium">{log.userName || '—'}</td>
                    <td className="table-cell font-mono text-xs">{log.tableName}</td>
                    <td className="table-cell text-gray-500">#{log.recordId}</td>
                    <td className="table-cell">
                      <span className={`badge ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-700'}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="table-cell">
                      {(log.oldValues || log.newValues) && (
                        <button
                          onClick={() => setExpanded(expanded === log.id ? null : log.id)}
                          className="text-green-700 hover:underline text-xs"
                        >
                          {expanded === log.id ? 'Hide' : 'View'}
                        </button>
                      )}
                    </td>
                  </tr>
                  {expanded === log.id && (
                    <tr key={`${log.id}-detail`} className="bg-gray-50">
                      <td colSpan={6} className="px-4 py-3">
                        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                          {log.oldValues && (
                            <div>
                              <p className="font-semibold text-red-600 mb-1">Before:</p>
                              <pre className="bg-red-50 p-2 rounded text-red-800 overflow-auto max-h-48">{JSON.stringify(JSON.parse(log.oldValues), null, 2)}</pre>
                            </div>
                          )}
                          {log.newValues && (
                            <div>
                              <p className="font-semibold text-green-600 mb-1">After:</p>
                              <pre className="bg-green-50 p-2 rounded text-green-800 overflow-auto max-h-48">{JSON.stringify(JSON.parse(log.newValues), null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <p className="text-xs text-gray-400">{logs.length} log entries shown</p>
    </div>
  )
}
