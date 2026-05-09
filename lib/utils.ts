import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, formatDistanceToNow } from 'date-fns'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function formatDate(d: string | Date | null) {
  if (!d) return '—'
  try { return format(new Date(d), 'dd/MM/yyyy') } catch { return '—' }
}
export function formatDateTime(d: string | Date | null) {
  if (!d) return '—'
  try { return format(new Date(d), 'dd/MM/yyyy HH:mm') } catch { return '—' }
}
export function formatCurrency(n: string | number | null) {
  if (n === null || n === undefined) return '₹0'
  return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 })}`
}
export function timeAgo(d: string | Date | null) {
  if (!d) return '—'
  try { return formatDistanceToNow(new Date(d), { addSuffix: true }) } catch { return '—' }
}
export function generateOrderId(lastId: number) {
  return `PHCRM${String(lastId + 1).padStart(6, '0')}`
}
export function generateInvoiceNo(lastId: number) {
  return `PHB2B${String(lastId + 1).padStart(4, '0')}`
}
export function generateDealerCode(lastId: number) {
  return `12${String(lastId + 301).padStart(3, '0')}`
}
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.startsWith('91') && digits.length === 12) return digits.slice(2)
  if (digits.startsWith('0') && digits.length === 11) return digits.slice(1)
  return digits.slice(-10)
}

export const ORDER_STATUSES = [
  'New','Confirmed','In Transit','Delivered','Pending','Callback',
  'GPO','GPO Done','GPO Delivered','GPO Pending','Cancelled',
  'Future Delivery','Confirm Pending','Final Cancel',
  'Confirm Cancel','Cancel Pending','UNA','Dealer Cancel',
] as const

export const STATUS_REASONS: Record<string, string[]> = {
  Callback: ['Out of Station','Money Problem','Customer Not Available','Callback'],
  Cancelled: ['Enquiry','Money Problem','Door Cancel','Wrong Number','Fake Orders','No Order','Others'],
  Delivered: ['Delivered'],
  Pending: ['No Answer','Switch Off','Out of Town','Call Disconnected'],
  Confirmed: ['Confirmed'],
  GPO: ['GPO'],
  'GPO Done': ['GPO Done'],
  New: ['New Order','Website Order','Walk-in Order'],
  'In Transit': ['Out for Delivery','In Transit','On the Way'],
  'GPO Delivered': ['Delivered'],
  'GPO Pending': ['No Answer','Switch Off','Out of Town'],
  'Confirm Pending': ['No Answer','Switch Off'],
  UNA: ['Unreachable','No Answer'],
  'Dealer Cancel': ['Dealer Cancelled'],
  'Final Cancel': ['Final Cancelled'],
  'Confirm Cancel': ['Confirm Cancel'],
  'Cancel Pending': ['Cancel Pending'],
  'Future Delivery': ['Future Delivery'],
}

export const STATUS_COLORS: Record<string, string> = {
  New: 'bg-blue-100 text-blue-700',
  Confirmed: 'bg-green-100 text-green-700',
  'In Transit': 'bg-yellow-100 text-yellow-700',
  Delivered: 'bg-emerald-100 text-emerald-700',
  Pending: 'bg-gray-100 text-gray-700',
  Callback: 'bg-purple-100 text-purple-700',
  Cancelled: 'bg-red-100 text-red-700',
  GPO: 'bg-orange-100 text-orange-700',
  'GPO Done': 'bg-teal-100 text-teal-700',
  'GPO Delivered': 'bg-cyan-100 text-cyan-700',
  'GPO Pending': 'bg-amber-100 text-amber-700',
  'Confirm Pending': 'bg-indigo-100 text-indigo-700',
  'Future Delivery': 'bg-pink-100 text-pink-700',
  'Final Cancel': 'bg-rose-100 text-rose-700',
  'Confirm Cancel': 'bg-rose-100 text-rose-800',
  'Cancel Pending': 'bg-red-50 text-red-600',
  UNA: 'bg-slate-100 text-slate-700',
  'Dealer Cancel': 'bg-red-100 text-red-800',
}

export const ROLES = ['Admin','User','ZM','Field'] as const
export type Role = typeof ROLES[number]

export function canPerformAction(role: Role, action: string): boolean {
  const permissions: Record<string, Role[]> = {
    deleteOrder: ['Admin'],
    bulkUpload: ['Admin','ZM'],
    createUser: ['Admin'],
    viewReports: ['Admin','ZM'],
    assignDealer: ['Admin','ZM'],
    exportData: ['Admin','ZM','User'],
    viewAllOrders: ['Admin','ZM'],
    manageInvoices: ['Admin','ZM'],
  }
  return permissions[action]?.includes(role) ?? false
}
