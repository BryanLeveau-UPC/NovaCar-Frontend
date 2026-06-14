'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useRouter } from 'next/navigation'
import { User, LogOut, Shield, Bell } from 'lucide-react'
import { useState, useEffect } from 'react'

// Definimos la estructura de datos para el perfil
interface PerfilUsuario {
  adminNombres: string
  adminDni: string
  adminCorreo: string
  fechaCreacion: string
}

export default function CuentaPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<PerfilUsuario | null>(null)

  useEffect(() => {
    const cargarDatosPerfil = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        router.push('/')
        return
      }

      // Pequeña pausa para evitar advertencias de renderizado en Next.js
      await Promise.resolve()

      const nombres = localStorage.getItem('admin_nombres') || 'Administrador'
      const dni = localStorage.getItem('admin_dni') || 'Sin DNI'

      // Actualizamos el estado con los datos reales
      setUserData({
        adminNombres: nombres,
        adminDni: dni,
        adminCorreo: 'admin@novacar.com', // Dato temporal hasta que se guarde en el login
        fechaCreacion: new Date().toISOString() // Dato temporal, idealmente vendría del backend
      })
    }

    cargarDatosPerfil()
  }, [router])

  const handleLogout = () => {
    if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
      // Borramos las credenciales reales
      localStorage.removeItem('auth_token')
      localStorage.removeItem('admin_nombres')
      localStorage.removeItem('admin_dni')
      
      router.push('/')
    }
  }

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
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Nombre Completo
              </label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium">
                {userData?.adminNombres || 'Cargando...'}
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Email
              </label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
                {userData?.adminCorreo || 'Cargando...'}
              </div>
            </div>

            {/* User ID (Usamos el DNI aquí ya que es tu identificador principal) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                DNI / ID de Usuario
              </label>
              <div className="px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 font-mono text-sm">
                {userData?.adminDni || 'Cargando...'}
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

        {/* Security Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Shield className="w-6 h-6" />
            Seguridad
          </h3>

          <div className="space-y-4">
            <p className="text-slate-600 text-sm">
              Tu cuenta está protegida con autenticación de usuario y contraseña. Para mayor seguridad, recuerda:
            </p>
            <ul className="space-y-2 text-slate-600 text-sm ml-4">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span>Nunca compartas tu contraseña con nadie</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span>Cierra sesión cuando termines de usar la aplicación</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span>Usa una contraseña fuerte y única</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-bold mt-0.5">•</span>
                <span>No accedas desde dispositivos públicos o compartidos</span>
              </li>
            </ul>
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