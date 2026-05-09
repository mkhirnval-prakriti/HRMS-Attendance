'use client'
import { Menu, Bell } from 'lucide-react'

interface Props { user:{name:string;role:string}; onMenuToggle:()=>void }

export default function Header({ user, onMenuToggle }: Props) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shrink-0">
      <button onClick={onMenuToggle} className="md:hidden p-2 rounded-lg hover:bg-gray-100">
        <Menu className="w-5 h-5 text-gray-600"/>
      </button>
      <div className="hidden md:block"/>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-gray-900">{user.name}</p>
          <p className="text-xs text-gray-500">{user.role}</p>
        </div>
        <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-xs font-bold text-white">
          {user.name.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
