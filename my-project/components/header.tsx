'use client'

import { useRouter } from 'next/navigation'
import { LogOut, ChevronDown } from 'lucide-react'
import { useState, useEffect } from 'react'

// 1. Definimos la estructura exacta con los nombres de tu Swagger/Backend
interface UsuarioHeader {
  adminNombres: string
  adminDni: string
  adminCorreo?: string // Opcional por ahora si no viene en el LoginDTO
}

export const Header = ({ title }: { title: string }) => {
  const router = useRouter()
  const [showMenu, setShowMenu] = useState(false)

  const [userData, setUserData] = useState<UsuarioHeader | null>(null)

    useEffect(() => {
    const cargarDatosUsuario = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (token) {
        // Simulamos una pequeña pausa asíncrona 
        await Promise.resolve() 
        
        const nombres = localStorage.getItem('admin_nombres') || 'Administrador'
        const dni = localStorage.getItem('admin_dni') || ''

        setUserData({
          adminNombres: nombres,
          adminDni: dni,
          adminCorreo: 'admin@novacar.com' 
        })
      }
    }

    cargarDatosUsuario()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('admin_nombres')
    localStorage.removeItem('admin_dni')
    router.push('/')
  }

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
      <div className="flex items-center justify-between px-8 py-4">
        <h2 className="text-2xl font-bold">{title}</h2>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-slate-800 transition"
          >
            <div className="text-right">
              {/* 4. Usamos las variables corregidas de tu backend */}
              <p className="text-sm font-medium">{userData?.adminNombres || 'Cargando...'}</p>
              <p className="text-xs text-slate-400">DNI: {userData?.adminDni || '...'}</p>
            </div>
            <ChevronDown className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          {showMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white text-slate-900 rounded-lg shadow-lg overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-200">
                <p className="text-sm font-medium">{userData?.adminNombres || 'Usuario'}</p>
                <p className="text-xs text-slate-500">{userData?.adminCorreo}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-4 py-3 hover:bg-slate-100 transition text-left text-sm"
              >
                <LogOut className="w-4 h-4" />
                Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}