'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useRouter } from 'next/navigation'
import { User, LogOut, Bell, DollarSign, Percent } from 'lucide-react'
import { useState, useEffect, startTransition  } from 'react'
import Link from 'next/link'

interface PerfilUsuario {
  adminNombres: string
  adminDni: string
  adminCorreo: string
  fechaCreacion: string
}

interface PageState {
  mounted: boolean
  moneda: string
  userData: PerfilUsuario | null
}

export default function CuentaPage() {
  const router = useRouter()
  const [state, setState] = useState<PageState>({
    mounted: false,
    moneda: 'PEN',
    userData: null,
  })

useEffect(() => {
  const token = localStorage.getItem('auth_token')
  if (!token) {
    router.push('/')
    return
  }

  const monedaGuardada = localStorage.getItem('moneda_preferida') || 'PEN'
  const nombres = localStorage.getItem('admin_nombres') || 'Administrador'
  const dni = localStorage.getItem('admin_dni') || 'Sin DNI'

  startTransition(() => {
    setState({
      mounted: true,
      moneda: monedaGuardada,
      userData: {
        adminNombres: nombres,
        adminDni: dni,
        adminCorreo: 'admin@novacar.com',
        fechaCreacion: new Date().toISOString(),
      },
    })
  })
}, [router])

  const handleMonedaChange = (nuevaMoneda: string) => {
    setState((prev) => ({ ...prev, moneda: nuevaMoneda }))
    localStorage.setItem('moneda_preferida', nuevaMoneda)
  }

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('admin_nombres')
      localStorage.removeItem('admin_dni')
      localStorage.removeItem('moneda_preferida')
      router.push('/')
    }
  }

  const { mounted, moneda, userData } = state

  if (!mounted) return null


  return (
    <ProtectedLayout title="Mi Cuenta">
      <div className="max-w-2xl space-y-6">
        
        {/* Profile Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <h3 className="text-2xl font-bold text-slate-900 mb-8 flex items-center gap-3">
            <User className="w-6 h-6" />
            Información de Perfil
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Nombre Completo</label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium">
                {userData?.adminNombres}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                {userData?.adminCorreo}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">DNI / ID de Usuario</label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono text-sm">
                {userData?.adminDni}
              </div>
            </div>
           {/* Registration Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Fecha de Registro
              </label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                {userData?.fechaCreacion
                  ? new Date(userData.fechaCreacion).toLocaleDateString('es-PE', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })
                  : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Preferencias Financieras */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <DollarSign className="w-6 h-6" />
            Preferencias Financieras
          </h3>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Moneda Predeterminada</label>
              <select 
                value={moneda}
                onChange={(e) => handleMonedaChange(e.target.value)}
                className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-900 font-medium"
              >
                <option value="PEN">Soles (PEN)</option>
                <option value="USD">Dólares (USD)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Tasas de Interés</label>
              <Link
                href="/tasas"
                className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white px-4 py-2 rounded-lg font-medium transition w-full justify-center"
              >
                <Percent className="w-5 h-5" />
                Gestionar Tasas de Interés
              </Link>
            </div>
          </div>
        </div>

{/* Notifications Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Bell className="w-6 h-6" />
            Preferencias
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
              <div>
                <p className="font-medium text-slate-900">Notificaciones de Simulaciones</p>
                <p className="text-sm text-slate-600">Recibe alertas cuando se guardan nuevas simulaciones</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="notifications"
                  defaultChecked
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Session Management */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Gestión de Sesión</h3>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
          >
            <LogOut className="w-5 h-5" />
            Cerrar Sesión
          </button>

          <p className="text-xs text-slate-500 text-center mt-4">
            Se cerrarán todas tus sesiones activas
          </p>
        </div>

        {/* About Section */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-8">
          <h3 className="text-lg font-bold text-blue-900 mb-3">NOVA CAR</h3>
          <p className="text-blue-800 text-sm mb-3">
            Plataforma de financiamiento automotriz inteligente. Versión 1.0
          </p>
          <p className="text-blue-700 text-xs">
            © 2026 NOVA CAR. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </ProtectedLayout>
  )
}