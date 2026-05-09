'use client'
import { useState, useTransition, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { formatDate, formatDateTime, STATUS_COLORS, ORDER_STATUSES, cn } from '@/lib/utils'
import { Search, Filter, Download, Plus, ChevronLeft, ChevronRight, MoreVertical, X, Loader2, Upload } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import OrderEditModal from '@/components/orders/edit-modal'
import BulkActionsBar from '@/components/orders/bulk-actions'

interface Order {
  id:number; orderId:string; dateTime:string; customerName:string;
  contactNumber:string; productName:string; quantity:number;
  price:string; paymentStatus:string; city:string; pincode:string;
  status:string; reason:string; remark:string; followUpDate:string;
  stateName:string; districtName:string; sourceName:string;
  ownerName:string; dealerName:string; createdAt:string;
}

interface Props {
  orders: Order[]; pagination:{page:number;pageSize:number;total:number;totalPages:number};
  users:{id:number;name:string;role:string}[];
  dealers:{id:number;name:string}[];
  sources:{id:number;name:string}[];
  states:{id:number;name:string}[];
  currentUser:{id:number;name:string;role:string};
  searchParams:Record<string,string>;
}

export default function OrdersClient({ orders, pagination, users, dealers, sources, states, currentUser, searchParams }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selected, setSelected] = useState<number[]>([])
  const [editOrder, setEditOrder] = useState<Order|null>(null)
  const [showFilters, setShowFilters] = useState(false)

  // Filter state
  const [filters, setFilters] = useState({
    phone: searchParams.phone??'',
    orderId: searchParams.orderId??'',
    status: searchParams.status??'all',
    sourceId: searchParams.sourceId??'all',
    ownerId: searchParams.ownerId??'all',
    dealerId: searchParams.dealerId??'all',
    paymentStatus: searchParams.paymentStatus??'all',
    stateId: searchParams.stateId??'',
    dateFrom: searchParams.dateFrom??'',
    dateTo: searchParams.dateTo??'',
    followFrom: searchParams.followFrom??'',
    followTo: searchParams.followTo??'',
  })

  function applyFilters() {
    const p = new URLSearchParams()
    p.set('page','1')
    Object.entries(filters).forEach(([k,v])=>{ if(v && v!=='all') p.set(k,v) })
    startTransition(()=>router.push(`/orders?${p}`))
  }

  function clearFilters() {
    setFilters({phone:'',orderId:'',status:'all',sourceId:'all',ownerId:'all',dealerId:'all',paymentStatus:'all',stateId:'',dateFrom:'',dateTo:'',followFrom:'',followTo:''})
    startTransition(()=>router.push('/orders'))
  }

  function changePage(p:number) {
    const params = new URLSearchParams(searchParams)
    params.set('page',String(p))
    startTransition(()=>router.push(`/orders?${params}`))
  }

  function toggleSelect(id:number) {
    setSelected(prev=>prev.includes(id)?prev.filter(x=>x!==id):[...prev,id])
  }
  function toggleAll() {
    setSelected(prev=>prev.length===orders.length?[]:orders.map(o=>o.id))
  }

  async function exportData() {
    const params = new URLSearchParams(searchParams)
    const res = await fetch(`/api/orders/export?${params}`)
    if (!res.ok) { toast.error('Export failed'); return }
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href=url; a.download=`orders-${Date.now()}.xlsx`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Export ready!')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Orders</h1>
          <p className="text-sm text-gray-500">{pagination.total.toLocaleString()} total orders</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={()=>setShowFilters(f=>!f)} className="btn-secondary btn-sm">
            <Filter className="w-3.5 h-3.5"/>Filters
          </button>
          {(currentUser.role==='Admin'||currentUser.role==='ZM') && (
            <Link href="/orders/bulk-upload" className="btn-secondary btn-sm">
              <Upload className="w-3.5 h-3.5"/>Bulk Upload
            </Link>
          )}
          <button onClick={exportData} className="btn-secondary btn-sm">
            <Download className="w-3.5 h-3.5"/>Export
          </button>
          <Link href="/orders/create" className="btn-primary btn-sm">
            <Plus className="w-3.5 h-3.5"/>New Order
          </Link>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card p-4 space-y-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><label className="label text-xs">Phone</label>
              <input className="input py-2 text-sm" placeholder="Search phone..." value={filters.phone} onChange={e=>setFilters(f=>({...f,phone:e.target.value}))}/></div>
            <div><label className="label text-xs">Order ID</label>
              <input className="input py-2 text-sm" placeholder="PHCRM..." value={filters.orderId} onChange={e=>setFilters(f=>({...f,orderId:e.target.value}))}/></div>
            <div><label className="label text-xs">Status</label>
              <select className="input py-2 text-sm" value={filters.status} onChange={e=>setFilters(f=>({...f,status:e.target.value}))}>
                <option value="all">All Statuses</option>
                {ORDER_STATUSES.map(s=><option key={s} value={s}>{s}</option>)}
              </select></div>
            <div><label className="label text-xs">Payment</label>
              <select className="input py-2 text-sm" value={filters.paymentStatus} onChange={e=>setFilters(f=>({...f,paymentStatus:e.target.value}))}>
                <option value="all">All</option>
                <option value="Pending">Pending</option>
                <option value="Completed">Completed</option>
              </select></div>
            <div><label className="label text-xs">Source</label>
              <select className="input py-2 text-sm" value={filters.sourceId} onChange={e=>setFilters(f=>({...f,sourceId:e.target.value}))}>
                <option value="all">All Sources</option>
                {sources.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
            <div><label className="label text-xs">Lead Owner</label>
              <select className="input py-2 text-sm" value={filters.ownerId} onChange={e=>setFilters(f=>({...f,ownerId:e.target.value}))}>
                <option value="all">All Agents</option>
                {users.map(u=><option key={u.id} value={u.id}>{u.name}</option>)}
              </select></div>
            <div><label className="label text-xs">Dealer</label>
              <select className="input py-2 text-sm" value={filters.dealerId} onChange={e=>setFilters(f=>({...f,dealerId:e.target.value}))}>
                <option value="all">All Dealers</option>
                {dealers.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}
              </select></div>
            <div><label className="label text-xs">State</label>
              <select className="input py-2 text-sm" value={filters.stateId} onChange={e=>setFilters(f=>({...f,stateId:e.target.value}))}>
                <option value="">All States</option>
                {states.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select></div>
            <div><label className="label text-xs">Date From</label>
              <input type="date" className="input py-2 text-sm" value={filters.dateFrom} onChange={e=>setFilters(f=>({...f,dateFrom:e.target.value}))}/></div>
            <div><label className="label text-xs">Date To</label>
              <input type="date" className="input py-2 text-sm" value={filters.dateTo} onChange={e=>setFilters(f=>({...f,dateTo:e.target.value}))}/></div>
            <div><label className="label text-xs">Follow-up From</label>
              <input type="date" className="input py-2 text-sm" value={filters.followFrom} onChange={e=>setFilters(f=>({...f,followFrom:e.target.value}))}/></div>
            <div><label className="label text-xs">Follow-up To</label>
              <input type="date" className="input py-2 text-sm" value={filters.followTo} onChange={e=>setFilters(f=>({...f,followTo:e.target.value}))}/></div>
          </div>
          <div className="flex gap-2">
            <button onClick={applyFilters} disabled={isPending} className="btn-primary btn-sm">
              {isPending?<Loader2 className="w-3.5 h-3.5 animate-spin"/>:<Filter className="w-3.5 h-3.5"/>}Apply Filters
            </button>
            <button onClick={clearFilters} className="btn-secondary btn-sm"><X className="w-3.5 h-3.5"/>Clear</button>
          </div>
        </div>
      )}

      {/* Bulk Actions */}
      {selected.length>0 && (
        <BulkActionsBar
          selected={selected}
          users={users}
          dealers={dealers}
          currentUser={currentUser}
          onDone={()=>{ setSelected([]); router.refresh() }}
        />
      )}

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="th w-10">
                  <input type="checkbox" checked={selected.length===orders.length&&orders.length>0}
                    onChange={toggleAll} className="rounded border-gray-300"/>
                </th>
                <th className="th">Order ID</th>
                <th className="th">Customer</th>
                <th className="th">Phone</th>
                <th className="th">Status</th>
                <th className="th">Source</th>
                <th className="th">Agent</th>
                <th className="th">Follow-up</th>
                <th className="th">Date</th>
                <th className="th w-16">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.length===0 && (
                <tr><td colSpan={10} className="py-16 text-center text-gray-400 text-sm">No orders found</td></tr>
              )}
              {orders.map(order=>(
                <tr key={order.id} className={cn("hover:bg-gray-50 transition-colors", selected.includes(order.id)&&"bg-green-50")}>
                  <td className="table-cell">
                    <input type="checkbox" checked={selected.includes(order.id)}
                      onChange={()=>toggleSelect(order.id)} className="rounded border-gray-300"/>
                  </td>
                  <td className="table-cell">
                    <button onClick={()=>setEditOrder(order)} className="font-mono text-green-600 hover:underline text-xs">
                      {order.orderId}
                    </button>
                  </td>
                  <td className="table-cell">
                    <div className="font-medium">{order.customerName||'—'}</div>
                    <div className="text-xs text-gray-400">{order.city||'—'}</div>
                  </td>
                  <td className="table-cell font-mono">{order.contactNumber}</td>
                  <td className="table-cell">
                    <span className={`badge ${STATUS_COLORS[order.status]||'bg-gray-100 text-gray-700'}`}>{order.status}</span>
                  </td>
                  <td className="table-cell text-gray-500">{order.sourceName||'—'}</td>
                  <td className="table-cell text-gray-500">{order.ownerName||'—'}</td>
                  <td className="table-cell">
                    {order.followUpDate ? (
                      <span className={cn("text-xs", new Date(order.followUpDate)<new Date()?"text-red-500 font-medium":"text-gray-600")}>
                        {formatDate(order.followUpDate)}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="table-cell text-gray-400 text-xs">{formatDateTime(order.dateTime)}</td>
                  <td className="table-cell">
                    <button onClick={()=>setEditOrder(order)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <MoreVertical className="w-4 h-4 text-gray-400"/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Show</span>
            <select className="input py-1 w-auto text-sm"
              value={pagination.pageSize}
              onChange={e=>{const p=new URLSearchParams(searchParams);p.set('pageSize',e.target.value);p.set('page','1');router.push(`/orders?${p}`)}}>
              {[10,20,50,100].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
            <span>of {pagination.total.toLocaleString()} orders</span>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={()=>changePage(1)} disabled={pagination.page===1} className="btn-secondary btn-sm p-2">«</button>
            <button onClick={()=>changePage(pagination.page-1)} disabled={pagination.page===1} className="btn-secondary btn-sm p-2">
              <ChevronLeft className="w-3.5 h-3.5"/>
            </button>
            <span className="px-3 py-1 text-sm font-medium">
              {pagination.page} / {pagination.totalPages}
            </span>
            <button onClick={()=>changePage(pagination.page+1)} disabled={pagination.page>=pagination.totalPages} className="btn-secondary btn-sm p-2">
              <ChevronRight className="w-3.5 h-3.5"/>
            </button>
            <button onClick={()=>changePage(pagination.totalPages)} disabled={pagination.page>=pagination.totalPages} className="btn-secondary btn-sm p-2">»</button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editOrder && (
        <OrderEditModal
          order={editOrder}
          users={users}
          dealers={dealers}
          sources={sources}
          states={states}
          currentUser={currentUser}
          onClose={()=>setEditOrder(null)}
          onSaved={()=>{ setEditOrder(null); router.refresh() }}
        />
      )}
    </div>
  )
}
