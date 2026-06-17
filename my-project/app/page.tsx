'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [adminDni, setAdminDni] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // 2. Ajustamos la ruta del endpoint a /api/auth/login
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 3. Enviamos adminDni en lugar de email
        body: JSON.stringify({ adminDni, password }) 
      })

      if (!response.ok) {
       try {
          // Intentamos leer el mensaje JSON de tu backend
          const errorData = await response.json()
          throw new Error(errorData.message || 'Credenciales inválidas')
        } catch (parseError) {
          // Si el backend falló tan grave que no devolvió JSON (ej. Error 500)
          throw new Error('Error en la API: Respuesta inesperada del servidor')
        }
      }

      const data = await response.json()

      if (data.token) {
        localStorage.setItem('auth_token', data.token)
        localStorage.setItem('admin_id', data.idUsuario)
        localStorage.setItem('admin_nombres', data.adminNombres)
        localStorage.setItem('admin_dni', data.adminDni)
      }

      router.push('/dashboard')
      
    } catch (err) {
      // TypeError es el error específico que lanza fetch() cuando el servidor está totalmente apagado
      if (err instanceof TypeError) {
        setError('Error en la API: No se pudo contactar al servidor')
      } else {
        // Atrapa cualquier otro error que hayamos lanzado manualmente arriba
        setError(err instanceof Error ? err.message : 'Error en la API')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src="/car-background.png"
          alt="Fondo"
          fill
          priority
          className="object-cover w-full h-full blur-sm"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Card */}
          <div className="bg-white rounded-lg shadow-2xl overflow-hidden">
            {/* Header con color */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-6 py-12 text-center">
              <h1 className="text-3xl font-bold text-white mb-2">NOVA CAR</h1>
              <p className="text-slate-300 text-sm">Auto-compra Inteligente</p>
            </div>

            {/* Form Container */}
            <div className="px-6 py-8">

              {/* Error */}
              {error && (
                <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  {/* 4. Actualizamos las etiquetas y el input para el DNI */}
                  <label htmlFor="adminDni" className="block text-sm font-semibold text-slate-700 mb-2">
                    DNI
                  </label>
                  <input
                    id="adminDni"
                    type="text" // Cambiado de 'email' a 'text'
                    value={adminDni}
                    // 1. Filtramos en tiempo real para que solo acepte números (0-9)
                    onChange={(e) => {
                      const soloNumeros = e.target.value.replace(/\D/g, '')
                      setAdminDni(soloNumeros)
                    }}
                    // 2. Limitamos físicamente a 8 caracteres
                    maxLength={8}
                    // 3. (Opcional) Validación nativa del navegador al dar clic en Iniciar Sesión
                    pattern="\d{8}"
                    title="El DNI debe tener exactamente 8 dígitos"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition bg-white text-black placeholder:text-slate-400"
                    placeholder="00000000"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-slate-700 mb-2">
                    Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition bg-white text-black placeholder:text-slate-400 pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 rounded-lg font-semibold transition duration-200 mt-6"
                >
                  {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                </button>
              </form>

              {/* Demo Credentials */}
              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-xs font-semibold text-amber-900 mb-2">CREDENCIALES DE DEMO:</p>
                <div className="space-y-1 text-xs text-amber-800">
                  {/* 5. Actualizamos el texto de demostración */}
                  <p>DNI: 00000000</p>
                  <p>Contraseña: admin123</p>
                </div>
              </div>

              {/* Register Link */}
              <div className="mt-6 text-center text-sm text-slate-600">
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-slate-900 font-semibold hover:text-slate-700 transition">
                  Crear cuenta
                </Link>
              </div>

              {/* Forgot Password */}
              <div className="mt-3 text-center text-sm">
                <Link href="#" className="text-slate-600 hover:text-slate-900 transition">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 text-center text-slate-300 text-xs">
            <p>&copy; 2026 NOVA CAR. Plataforma de Financiamiento Automotriz</p>
          </div>
        </div>
      </div>
    </div>
  )
}