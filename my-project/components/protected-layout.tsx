'use client'

import { ReactNode, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './sidebar'
import { Header } from './header' // Asumiendo que también tienes este archivo

interface ProtectedLayoutProps {
  children: ReactNode
  title: string
}

export const ProtectedLayout = ({ children, title }: ProtectedLayoutProps) => {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

    useEffect(() => {
        const verificarSeguridad = async () => {
        const token = localStorage.getItem('auth_token')
        
        if (!token) {
            router.push('/')
        } else {
            await Promise.resolve()
            setIsAuthenticated(true)
        }
        }

        verificarSeguridad()
    }, [router])

  // Mientras verifica, mostramos el spinner de carga
  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Verificando seguridad...</p>
        </div>
      </div>
    )
  }

  // Interfaz protegida autorizada
  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <Sidebar
        isMobileOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header
          title={title}
          onMenuToggle={() => setIsMobileSidebarOpen((current) => !current)}
        />

        {/* Content Area */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
