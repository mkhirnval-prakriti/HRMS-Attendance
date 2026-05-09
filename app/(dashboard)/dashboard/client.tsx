'use client'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Package, CheckCircle, XCircle, PhoneCall, CalendarCheck, TrendingUp, Filter } from 'lucide-react'
import { STATUS_COLORS } from '@/lib/utils'
import Link from 'next/link'

const CHART_COLORS: Record<string,string> = {
  New:'#3b82f6',Confirmed:'#22c55e','In Transit':'#f59e0b',Delivered:'#10b981',
  Pending:'#6b7280',Callback:'#8b5cf6',Cancelled:'#ef4444',GPO:'#f97316',
}

interface Props {
  statusCounts: {status:string;count:number}[]
  total: number
  todayOrders: number
  followUps: number
  role: string
}

export default function DashboardClient({ statusCounts, total, todayOrders, followUps, role }: Props) {
  const router = useRouter()
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [isPending, startTransition] = useTransition()

  const delivered = statusCounts.find(s=>s.status==='Delivered')?.count ?? 0
  const cancelled = statusCounts.find(s=>s.status==='Cancelled')?.count ?? 0
  const callback = statusCounts.find(s=>s.status==='Callback')?.count ?? 0

  const kpis = [
    { label:'Total Orders', value:total.toLocaleString(), icon:Package, color:'blue', href:'/orders' },
    { label:'Delivered', value:Number(delivered).toLocaleString(), icon:CheckCircle, color:'green', href:'/orders?status=Delivered' },
    { label:'Cancelled', value:Number(cancelled).toLocaleString(), icon:XCircle, color:'red', href:'/orders?status=Cancelled' },
    { label:'Callbacks', value:Number(callback).toLocaleString(), icon:PhoneCall, color:'purple', href:'/orders?status=Callback' },
    { label:"Today's Orders", value:todayOrders.toLocaleString(), icon:TrendingUp, color:'yellow', href:'/orders' },
    { label:"Today's Follow-ups", value:followUps.toLocaleString(), icon:CalendarCheck, color:'teal', href:'/orders?followup=today' },
  ]
  const colorMap: Record<string,string> = {
    blue:'bg-blue-50 text-blue-600', green:'bg-green-50 text-green-600',
    red:'bg-red-50 text-red-600', purple:'bg-purple-50 text-purple-600',
    yellow:'bg-yellow-50 text-yellow-600', teal:'bg-teal-50 text-teal-600',
  }

  function applyFilter() {
    startTransition(() => {
      const p = new URLSearchParams()
      if (from) p.set('from', from)
      if (to) p.set('to', to)
      router.push(`/dashboard?${p}`)
    })
  }

  const chartData = statusCounts
    .filter(s=>Number(s.count)>0)
    .sort((a,b)=>Number(b.count)-Number(a.count))
    .slice(0,10)
    .map(s=>({ name:s.status, count:Number(s.count) }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Order analytics & overview</p>
        </div>
        {(role==='Admin'||role==='ZM') && (
          <div className="flex items-center gap-2 flex-wrap">
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} className="input w-auto text-sm py-2"/>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} className="input w-auto text-sm py-2"/>
            <button onClick={applyFilter} disabled={isPending} className="btn-primary btn-sm">
              <Filter className="w-3.5 h-3.5"/>{isPending?'Loading...':'Apply'}
            </button>
            <button onClick={()=>{setFrom('');setTo('');router.push('/dashboard')}} className="btn-secondary btn-sm">Clear</button>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map(k=>(
          <Link key={k.label} href={k.href} className="card p-4 hover:shadow-md transition-shadow">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-3 ${colorMap[k.color]}`}>
              <k.icon className="w-4 h-4"/>
            </div>
            <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{k.label}</p>
          </Link>
        ))}
      </div>

      {/* Chart + Status List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Orders by Status</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{top:0,right:0,left:-20,bottom:40}}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
              <XAxis dataKey="name" tick={{fontSize:11}} angle={-35} textAnchor="end"/>
              <YAxis tick={{fontSize:11}}/>
              <Tooltip formatter={(v:any)=>[v.toLocaleString(),'Orders']}/>
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {chartData.map((entry,i)=>(
                  <Cell key={i} fill={CHART_COLORS[entry.name]||'#94a3b8'}/>
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Status Breakdown</h2>
          <div className="space-y-2 max-h-72 overflow-y-auto">
            {statusCounts.sort((a,b)=>Number(b.count)-Number(a.count)).map(s=>{
              const pct = total>0?Math.round((Number(s.count)/total)*100):0
              const cls = STATUS_COLORS[s.status]||'bg-gray-100 text-gray-700'
              return (
                <Link key={s.status} href={`/orders?status=${encodeURIComponent(s.status)}`}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 group">
                  <span className={`badge ${cls} shrink-0`}>{s.status}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div className="bg-green-500 h-2 rounded-full transition-all" style={{width:`${pct}%`}}/>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                    {Number(s.count).toLocaleString()}
                  </span>
                  <span className="text-xs text-gray-400 w-8 text-right">{pct}%</span>
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
