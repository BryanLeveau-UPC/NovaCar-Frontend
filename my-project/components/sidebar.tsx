'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  Users,
  Car,
  Calculator,
  History,
  BarChart3,
  Settings,
} from 'lucide-react'
import { LogoNovaCar } from './logo-nova-car' 

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

const navItems: NavItem[] = [
  // CORRECCIÓN: Ahora INICIO apunta al dashboard, no al login
  { label: 'INICIO', href: '/dashboard', icon: <Home className="w-5 h-5" /> },
  { label: 'CLIENTES', href: '/clientes', icon: <Users className="w-5 h-5" /> },
  { label: 'VEHÍCULOS', href: '/vehiculos', icon: <Car className="w-5 h-5" /> },
  { label: 'SIMULADOR', href: '/simulador', icon: <Calculator className="w-5 h-5" /> },
  { label: 'HISTORIAL', href: '/historial', icon: <History className="w-5 h-5" /> },
  { label: 'REPORTES', href: '/reportes', icon: <BarChart3 className="w-5 h-5" /> },
  { label: 'CUENTA', href: '/cuenta', icon: <Settings className="w-5 h-5" /> },
]

export const Sidebar = () => {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-slate-900 text-white min-h-screen flex flex-col">
    {/* Logo Section actualizado */}
      <div className="px-6 py-6 border-b border-slate-800 flex flex-col items-center justify-center">
        {/* Envolvemos el logo y le aplicamos el filtro para volverlo blanco */}
        <div className="brightness-0 invert">
          <LogoNovaCar size="sm" />
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => {
          // Lógica para marcar el botón activo
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition ${
                isActive
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {item.icon}
              <span className="text-sm">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-6 py-6 border-t border-slate-800">
        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-2">Sistema</p>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
            <Settings className="w-4 h-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-200">Administrador</p>
            <p className="text-xs text-slate-500">Activo</p>
          </div>
        </div>
      </div>
    </aside>
  )
}