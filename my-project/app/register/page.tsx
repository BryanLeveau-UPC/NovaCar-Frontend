'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
  // 1. Estados actualizados para coincidir con el Swagger
  const [adminDni, setAdminDni] = useState('')
  const [adminNombres, setAdminNombres] = useState('')
  const [adminApellidos, setAdminApellidos] = useState('')
  const [adminCorreo, setAdminCorreo] = useState('')
  
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 2. Validación básica del frontend
    if (!adminDni || !adminNombres || !adminApellidos || !adminCorreo || !password || !confirmPassword) {
      setError('Todos los campos son requeridos')
      return
    }

    if (adminDni.length !== 8) {
      setError('El DNI debe tener exactamente 8 dígitos')
      return
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    setLoading(true)

    try {
      // 3. Petición fetch directa a tu endpoint de registro
      // Nota: Verifica que la ruta de tu endpoint sea correcta (usualmente es /register o /usuarios)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/usuarios`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        // 4. Armamos el JSON exactamente como lo pide Swagger
        body: JSON.stringify({
          adminDni,
          adminNombres,
          adminApellidos,
          adminCorreo,
          passwordHash: password // Mapeamos nuestro estado 'password' a la llave 'passwordHash'
        })
      })

      if (!response.ok) {
        try {
          const errorData = await response.json()
          throw new Error(errorData.message || 'Error al crear la cuenta')
        } catch (parseError) {
          throw new Error('Error en la API: Respuesta inesperada del servidor')
        }
      }

      // Si el registro es exitoso, redirigimos al login para que inicie sesión
      router.push('/login')
      
    } catch (err) {
      if (err instanceof TypeError) {
        setError('Error en la API: No se pudo contactar al servidor')
      } else {
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
              <p className="text-slate-300 text-sm">Crear Nueva Cuenta</p>
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
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Campo DNI (Con filtro de números y max 8) */}
                <div>
                  <label htmlFor="adminDni" className="block text-sm font-semibold text-slate-700 mb-2">
                    DNI
                  </label>
                  <input
                    id="adminDni"
                    type="text"
                    value={adminDni}
                    onChange={(e) => {
                      const soloNumeros = e.target.value.replace(/\D/g, '')
                      setAdminDni(soloNumeros)
                    }}
                    maxLength={8}
                    pattern="\d{8}"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition bg-white text-black placeholder:text-slate-400"
                    placeholder="00000000"
                    required
                  />
                </div>

                {/* Fila para Nombres y Apellidos */}
                <div className="flex gap-4">
                  <div className="w-1/2">
                    <label htmlFor="adminNombres" className="block text-sm font-semibold text-slate-700 mb-2">
                      Nombres
                    </label>
                    <input
                      id="adminNombres"
                      type="text"
                      value={adminNombres}
                      onChange={(e) => setAdminNombres(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition bg-white text-black placeholder:text-slate-400"
                      placeholder="Juan"
                      required
                    />
                  </div>
                  <div className="w-1/2">
                    <label htmlFor="adminApellidos" className="block text-sm font-semibold text-slate-700 mb-2">
                      Apellidos
                    </label>
                    <input
                      id="adminApellidos"
                      type="text"
                      value={adminApellidos}
                      onChange={(e) => setAdminApellidos(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition bg-white text-black placeholder:text-slate-400"
                      placeholder="Pérez"
                      required
                    />
                  </div>
                </div>

                {/* Campo Correo */}
                <div>
                  <label htmlFor="adminCorreo" className="block text-sm font-semibold text-slate-700 mb-2">
                    Correo Electrónico
                  </label>
                  <input
                    id="adminCorreo"
                    type="email"
                    value={adminCorreo}
                    onChange={(e) => setAdminCorreo(e.target.value)}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition bg-white text-black placeholder:text-slate-400"
                    placeholder="tu@email.com"
                    required
                  />
                </div>

                {/* Campo Contraseña */}
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

                {/* Campo Confirmar Contraseña */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700 mb-2">
                    Confirmar Contraseña
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition bg-white text-black placeholder:text-slate-400 pr-10"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600 hover:text-slate-800"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 rounded-lg font-semibold transition duration-200 mt-6"
                >
                  {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                </button>
              </form>

              {/* Login Link */}
              <div className="mt-6 text-center text-sm text-slate-600">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-slate-900 font-semibold hover:text-slate-700 transition">
                  Iniciar sesión
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