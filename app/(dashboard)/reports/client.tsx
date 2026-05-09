'use client'
import { useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Download } from 'lucide-react'
import * as XLSX from 'xlsx'

const COLORS = ['#22c55e','#3b82f6','#f59e0b','#ef4444','#8b5cf6','#14b8a6','#f97316','#06b6d4']

function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
  return arr.reduce((acc, item) => {
    const k = String(item[key]||'Unknown')
    ;(acc[k]=acc[k]||[]).push(item)
    return acc
  }, {} as Record<string,T[]>)
}

export default function ReportsClient({ sourceStats, agentStats, dealerStats }: any) {
  const [activeTab, setActiveTab] = useState<'source'|'agent'|'dealer'>('source')

  // Aggregate source data
  const bySource = groupBy(sourceStats, 'sourceName')
  const sourceChart = Object.entries(bySource).map(([name, rows]) => ({
    name: name||'Unknown',
    total: rows.reduce((s,r:any)=>s+Number(r.count),0),
    delivered: rows.filter((r:any)=>r.status==='Delivered').reduce((s,r:any)=>s+Number(r.count),0),
    cancelled: rows.filter((r:any)=>r.status==='Cancelled').reduce((s,r:any)=>s+Number(r.count),0),
  })).sort((a,b)=>b.total-a.total)

  // Aggregate agent data
  const byAgent = groupBy(agentStats, 'agentName')
  const agentChart = Object.entries(byAgent).map(([name, rows]) => ({
    name: name||'Unassigned',
    total: rows.reduce((s,r:any)=>s+Number(r.count),0),
    delivered: rows.filter((r:any)=>r.status==='Delivered').reduce((s,r:any)=>s+Number(r.count),0),
    cancelled: rows.filter((r:any)=>r.status==='Cancelled').reduce((s,r:any)=>s+Number(r.count),0),
  })).sort((a,b)=>b.total-a.total).slice(0,15)

  const byDealer = groupBy(dealerStats, 'dealerName')
  const dealerChart = Object.entries(byDealer).map(([name, rows]) => ({
    name: name||'Unassigned',
    total: rows.reduce((s,r:any)=>s+Number(r.count),0),
    delivered: rows.filter((r:any)=>r.status==='Delivered').reduce((s,r:any)=>s+Number(r.count),0),
  })).sort((a,b)=>b.total-a.total).slice(0,15)

  function exportToExcel(data: any[], name: string) {
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data), name)
    XLSX.writeFile(wb, `${name}-report-${Date.now()}.xlsx`)
  }

  const tabs = [
    { key:'source', label:'Source Analytics' },
    { key:'agent', label:'Agent Performance' },
    { key:'dealer', label:'Dealer Report' },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-xl font-bold">Reports</h1><p className="text-sm text-gray-500">Analytics & Insights</p></div>
      </div>

      <div className="flex border-b border-gray-200">
        {tabs.map(t=>(
          <button key={t.key} onClick={()=>setActiveTab(t.key as any)}
            className={`py-3 px-5 text-sm font-medium border-b-2 transition-colors ${activeTab===t.key?'border-green-600 text-green-600':'border-transparent text-gray-500 hover:text-gray-700'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab==='source' && (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button onClick={()=>exportToExcel(sourceChart,'source-analytics')} className="btn-secondary btn-sm"><Download className="w-3.5 h-3.5"/>Export</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card p-5">
              <h2 className="font-semibold mb-4">Orders by Source</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={sourceChart.slice(0,8)} margin={{left:-20,bottom:30}}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                  <XAxis dataKey="name" tick={{fontSize:11}} angle={-30} textAnchor="end"/>
                  <YAxis tick={{fontSize:11}}/>
                  <Tooltip/>
                  <Bar dataKey="total" fill="#22c55e" name="Total" radius={[3,3,0,0]}/>
                  <Bar dataKey="delivered" fill="#3b82f6" name="Delivered" radius={[3,3,0,0]}/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="card p-5">
              <h2 className="font-semibold mb-4">Source Distribution</h2>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={sourceChart} dataKey="total" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({name,percent})=>`${name} ${(percent*100).toFixed(0)}%`} labelLine={false}>
                    {sourceChart.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                  </Pie>
                  <Tooltip/>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="th">Source</th><th className="th">Total</th><th className="th">Delivered</th>
                <th className="th">Cancelled</th><th className="th">Conv. Rate</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {sourceChart.map(s=>(
                  <tr key={s.name} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{s.name}</td>
                    <td className="table-cell">{s.total.toLocaleString()}</td>
                    <td className="table-cell text-green-600">{s.delivered.toLocaleString()}</td>
                    <td className="table-cell text-red-500">{s.cancelled.toLocaleString()}</td>
                    <td className="table-cell">{s.total>0?((s.delivered/s.total)*100).toFixed(1):0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab==='agent' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={()=>exportToExcel(agentChart,'agent-performance')} className="btn-secondary btn-sm"><Download className="w-3.5 h-3.5"/>Export</button>
          </div>
          <div className="card p-5">
            <h2 className="font-semibold mb-4">Agent Performance (Top 15)</h2>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={agentChart} layout="vertical" margin={{left:80,right:20}}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis type="number" tick={{fontSize:11}}/>
                <YAxis dataKey="name" type="category" tick={{fontSize:11}} width={80}/>
                <Tooltip/>
                <Bar dataKey="total" fill="#22c55e" name="Total" radius={[0,3,3,0]}/>
                <Bar dataKey="delivered" fill="#3b82f6" name="Delivered" radius={[0,3,3,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="th">Agent</th><th className="th">Total</th><th className="th">Delivered</th>
                <th className="th">Cancelled</th><th className="th">Conv. Rate</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {agentChart.map((a,i)=>(
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{a.name}</td>
                    <td className="table-cell">{a.total.toLocaleString()}</td>
                    <td className="table-cell text-green-600">{a.delivered.toLocaleString()}</td>
                    <td className="table-cell text-red-500">{a.cancelled.toLocaleString()}</td>
                    <td className="table-cell">{a.total>0?((a.delivered/a.total)*100).toFixed(1):0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab==='dealer' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={()=>exportToExcel(dealerChart,'dealer-report')} className="btn-secondary btn-sm"><Download className="w-3.5 h-3.5"/>Export</button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b"><tr>
                <th className="th">Dealer</th><th className="th">Total Orders</th>
                <th className="th">Delivered</th><th className="th">Conv. Rate</th>
              </tr></thead>
              <tbody className="divide-y divide-gray-50">
                {dealerChart.map((d,i)=>(
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="table-cell font-medium">{d.name}</td>
                    <td className="table-cell">{d.total.toLocaleString()}</td>
                    <td className="table-cell text-green-600">{d.delivered.toLocaleString()}</td>
                    <td className="table-cell">{d.total>0?((d.delivered/d.total)*100).toFixed(1):0}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
