'use client'
import { useState } from 'react'
import Sidebar from './sidebar'
import Header from './header'

interface Props {
  children: React.ReactNode
  user: { name: string; role: string; id: number; email: string }
}

export default function DashboardShell({ children, user }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar user={user} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onMenuToggle={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
