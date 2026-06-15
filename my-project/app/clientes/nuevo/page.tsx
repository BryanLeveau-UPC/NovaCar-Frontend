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

  // Ajustamos los nombres para que coincidan EXACTAMENTE con tu ClienteDTO de Java
  // cliTelefono se guarda SIEMPRE como 9 dígitos sin guiones; el formato "999-999-999"
  // es solo visual y se aplica en el render del input.
  const [formData, setFormData] = useState({
    cliDni: '',
    cliNombres: '',
    cliApellidos: '',
    cliFecNac: '',
    cliDireccion: '',
    cliRegion: '',
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

    // 1. Bloquear letras en DNI (8 dígitos máximo, estándar Perú)
    if (name === 'cliDni' && (!/^\d*$/.test(value) || value.length > 8)) return

    // 2. Celular: nos quedamos solo con los dígitos (ignora los guiones del formato)
    //    y limitamos a 9 dígitos (celulares en Perú)
    if (name === 'cliTelefono') {
      const soloDigitos = value.replace(/\D/g, '').slice(0, 9)
      setFormData(prev => ({ ...prev, cliTelefono: soloDigitos }))
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // En Perú el DNI siempre es de 8 dígitos
  const validateDNI = (dni: string): boolean => {
    return /^\d{8}$/.test(dni)
  }

  // Celulares en Perú: 9 dígitos exactos
  const validateTelefono = (telefono: string): boolean => {
    return /^\d{9}$/.test(telefono)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 1. Validaciones del frontend
    // Validación DNI (8 dígitos exactos)
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

    // Validación celular (9 dígitos exactos)
    if (!validateTelefono(formData.cliTelefono)) {
      setError('El celular debe tener exactamente 9 dígitos')
      return
    }

    // 2. Verificamos la seguridad antes de enviar
    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/')
      return
    }

    setLoading(true)

    try {
      // Conversión de tipo para el backend (cliIngresos como número)
      const payload = {
        ...formData,
        cliIngresos: parseFloat(formData.cliIngresos) || 0
      }

      // 3. Petición POST a tu backend real
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        // El backend responde { "mensaje": "..." } para DNI/correo/teléfono duplicados (409)
        // o cliente no encontrado (404). Mostramos ese mensaje si existe.
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.mensaje || 'Error en el servidor al intentar crear el cliente')
      }

      // Si todo sale bien, lo devolvemos a la lista de clientes
      router.push('/clientes')

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión al crear cliente')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedLayout title="Registrar Nuevo Cliente">
      <div className="max-w-2xl">
        {/* Breadcrumb */}
        <Link href="/clientes" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft size={18} />
          <span>Volver a Clientes</span>
        </Link>

        {/* Form Card */}
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
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2  focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="12345678"
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
                  <label htmlFor="cliRegion" className="block text-sm font-medium text-slate-700 mb-2">
                    Región *
                  </label>
                  <input
                    id="cliRegion"
                    name="cliRegion"
                    type="text"
                    value={formData.cliRegion}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="Lima"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="cliIngresos" className="block text-sm font-medium text-slate-700 mb-2">
                    Ingreso *
                  </label>
                  <input
                    id="cliIngresos"
                    name="cliIngresos"
                    type="number"
                    step="0.01"
                    value={formData.cliIngresos}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="00.00"
                    required
                  />
                </div>

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
              </div>
            </div>

            {/* Sección: Contacto */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Información de Contacto</h3>
              <div className="space-y-4">
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

                <div>
                  <label htmlFor="cliDireccion" className="block text-sm font-medium text-slate-700 mb-2">
                    Dirección
                  </label>
                  <textarea
                    id="cliDireccion"
                    name="cliDireccion"
                    value={formData.cliDireccion}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition font text-slate-950 placeholder:text-slate-400"
                    placeholder="Calle Principal 123, Apt 4B"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 rounded-lg font-semibold transition"
              >
                {loading ? 'Guardando en Base de Datos...' : 'Guardar Cliente'}
              </button>
              <Link
                href="/clientes"
                className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-900 py-3 rounded-lg font-semibold transition text-center flex items-center justify-center"
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