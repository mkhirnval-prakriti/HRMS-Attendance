'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createBrowserClient } from '@supabase/ssr'
import {
  LayoutDashboard, ShoppingCart, Users, Truck, FileText,
  BarChart3, Settings, Upload, LogOut, Leaf, X, Package, CalendarClock, Shield
} from 'lucide-react'
import toast from 'react-hot-toast'

const NAV = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin','User','ZM','Field'] },
  { href: '/orders', label: 'Orders', icon: ShoppingCart, roles: ['Admin','User','ZM','Field'] },
  { href: '/orders/bulk-upload', label: 'Bulk Upload', icon: Upload, roles: ['Admin','ZM'] },
  { href: '/follow-ups', label: 'Follow-ups', icon: CalendarClock, roles: ['Admin','User','ZM','Field'] },
  { href: '/users', label: 'Users', icon: Users, roles: ['Admin'] },
  { href: '/dealers', label: 'Dealers', icon: Truck, roles: ['Admin','ZM'] },
  { href: '/invoices', label: 'Invoices', icon: FileText, roles: ['Admin','ZM'] },
  { href: '/reports', label: 'Reports', icon: BarChart3, roles: ['Admin','ZM'] },
  { href: '/items', label: 'Products', icon: Package, roles: ['Admin'] },
  { href: '/settings', label: 'Settings', icon: Settings, roles: ['Admin'] },
  { href: '/audit-logs', label: 'Audit Logs', icon: Shield, roles: ['Admin'] },
]

interface Props { user: { name: string; role: string }; open?: boolean; onClose?: () => void }

export default function Sidebar({ user, open, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
  const visible = NAV.filter(i => i.roles.includes(user.role))

  async function handleLogout() {
    await supabase.auth.signOut()
    toast.success('Signed out')
    router.push('/login')
    router.refresh()
  }

  const inner = (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center shrink-0">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="font-bold text-sm leading-tight">Prakriti CRM</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-white md:hidden transition">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {visible.map(item => {
          const active = pathname === item.href || (item.href !== '/dashboard' && item.href !== '/orders' && pathname.startsWith(item.href)) || (item.href === '/orders' && (pathname === '/orders' || pathname === '/orders/create'))
          return (
            <Link key={item.href} href={item.href} onClick={onClose}
              className={cn('flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active ? 'bg-green-600 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white')}>
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-gray-800">
        <div className="flex items-center gap-3 px-2 py-2">
          <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-gray-400">{user.role}</p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 hover:text-red-400 transition shrink-0" title="Sign out">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <>
      <aside className="hidden md:flex w-60 shrink-0 flex-col">{inner}</aside>
      {open && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <aside className="absolute left-0 top-0 bottom-0 w-60">{inner}</aside>
        </div>
      )}
    </>
  )
}
