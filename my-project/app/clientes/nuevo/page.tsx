'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedLayout } from '@/components/protected-layout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NuevoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Ajustado EXACTAMENTE a ClienteDTO
  const [formData, setFormData] = useState({
    cliDni: '',
    cliNombres: '',
    cliApellidos: '',
    cliFecNac: '',
    cliDireccion: '',
    cliDepartamento: '',
    cliProvincia: '',
    cliDistrito: '',
    cliTelefono: '',
    cliCorreo: '',
    cliIngresos: ''
  })

  // Convierte "999999999" -> "999-999-999" solo para mostrarlo en el input
  const formatTelefono = (digits: string): string => {
    const partes = []
    if (digits.length > 0) partes.push(digits.slice(0, 3))
    if (digits.length > 3) partes.push(digits.slice(3, 6))
    if (digits.length > 6) partes.push(digits.slice(6, 9))
    return partes.join('-')
  }

  // Validación y filtrado en tiempo real
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    // 1. Bloquear letras en DNI (8 dígitos máximo)
    if (name === 'cliDni' && (!/^\d*$/.test(value) || value.length > 8)) return

    // 2. Celular: nos quedamos solo con los dígitos y limitamos a 9
    if (name === 'cliTelefono') {
      const soloDigitos = value.replace(/\D/g, '').slice(0, 9)
      setFormData(prev => ({ ...prev, cliTelefono: soloDigitos }))
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateDNI = (dni: string): boolean => {
    return /^\d{8}$/.test(dni)
  }

  const validateTelefono = (telefono: string): boolean => {
    return /^\d{9}$/.test(telefono)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateDNI(formData.cliDni)) {
      setError('El DNI debe tener exactamente 8 dígitos')
      return
    }

    if (!formData.cliNombres || !formData.cliApellidos || !formData.cliCorreo || !formData.cliTelefono) {
      setError('Los campos marcados con * son requeridos')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.cliCorreo)) {
      setError('Formato de correo electrónico inválido')
      return
    }

    if (!validateTelefono(formData.cliTelefono)) {
      setError('El celular debe tener exactamente 9 dígitos')
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/')
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        cliIngresos: parseFloat(formData.cliIngresos) || 0
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        // Spring Boot envía el error en 'message' por defecto al lanzar excepciones
        throw new Error(errorData?.message || errorData?.mensaje || 'Error en el servidor al intentar crear el cliente')
      }

      router.push('/clientes')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión al crear cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedLayout title="Registrar Nuevo Cliente">
      <div className="max-w-3xl mx-auto">
        <Link href="/clientes" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft size={18} />
          <span>Volver a Clientes</span>
        </Link>

        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Registrar Nuevo Cliente</h2>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección: Información Personal */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cliDni" className="block text-sm font-medium text-slate-700 mb-2">
                    DNI *
                  </label>
                  <input
                    id="cliDni"
                    name="cliDni"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    value={formData.cliDni}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="12345678"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cliFecNac" className="block text-sm font-medium text-slate-700 mb-2">
                    Fecha de Nacimiento *
                  </label>
                  <input
                    id="cliFecNac"
                    name="cliFecNac"
                    type="date"
                    value={formData.cliFecNac}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cliNombres" className="block text-sm font-medium text-slate-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    id="cliNombres"
                    name="cliNombres"
                    type="text"
                    value={formData.cliNombres}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="Juan"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cliApellidos" className="block text-sm font-medium text-slate-700 mb-2">
                    Apellidos *
                  </label>
                  <input
                    id="cliApellidos"
                    name="cliApellidos"
                    type="text"
                    value={formData.cliApellidos}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="Pérez García"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección: Ubicación y Finanzas */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Ubicación y Finanzas</h3>
              
              <div className="mb-4">
                <label htmlFor="cliDireccion" className="block text-sm font-medium text-slate-700 mb-2">
                  Dirección
                </label>
                <textarea
                  id="cliDireccion"
                  name="cliDireccion"
                  value={formData.cliDireccion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                  placeholder="Calle Principal 123"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="cliDepartamento" className="block text-sm font-medium text-slate-700 mb-2">
                    Departamento
                  </label>
                  <input
                    id="cliDepartamento"
                    name="cliDepartamento"
                    type="text"
                    value={formData.cliDepartamento}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="Ej. Lima"
                  />
                </div>

                <div>
                  <label htmlFor="cliProvincia" className="block text-sm font-medium text-slate-700 mb-2">
                    Provincia
                  </label>
                  <input
                    id="cliProvincia"
                    name="cliProvincia"
                    type="text"
                    value={formData.cliProvincia}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="Ej. Lima"
                  />
                </div>

                <div>
                  <label htmlFor="cliDistrito" className="block text-sm font-medium text-slate-700 mb-2">
                    Distrito
                  </label>
                  <input
                    id="cliDistrito"
                    name="cliDistrito"
                    type="text"
                    value={formData.cliDistrito}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="Ej. Miraflores"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cliIngresos" className="block text-sm font-medium text-slate-700 mb-2">
                    Ingresos Mensuales *
                  </label>
                  <input
                    id="cliIngresos"
                    name="cliIngresos"
                    type="number"
                    step="0.01"
                    value={formData.cliIngresos}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección: Contacto */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Información de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cliTelefono" className="block text-sm font-medium text-slate-700 mb-2">
                    Celular *
                  </label>
                  <input
                    id="cliTelefono"
                    name="cliTelefono"
                    type="tel"
                    inputMode="numeric"
                    maxLength={11}
                    value={formatTelefono(formData.cliTelefono)}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="999-999-999"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cliCorreo" className="block text-sm font-medium text-slate-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    id="cliCorreo"
                    name="cliCorreo"
                    type="email"
                    value={formData.cliCorreo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="juan@ejemplo.com"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition text-center flex items-center justify-center"
              >
                {loading ? 'Guardando en Base de Datos...' : 'Guardar Cliente'}
              </button>
              <Link
                href="/clientes"
                className="flex-1 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                Cancelar
              </Link>
            </div>
          </form>
        </div>
      </div>
    </ProtectedLayout>
  )
}