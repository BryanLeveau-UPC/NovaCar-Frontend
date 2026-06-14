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
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    direccion: '', // Si tu backend no usa estos últimos 3, simplemente los ignorará
    empresa: '',
    cargo: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const validateDNI = (dni: string): boolean => {
    return /^\d{8}$/.test(dni) || /^\d{10}$/.test(dni)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // 1. Validaciones del frontend
    if (!formData.dni || !validateDNI(formData.dni)) {
      setError('DNI inválido (debe tener 8 o 10 dígitos)')
      return
    }

    if (!formData.nombres || !formData.apellidos || !formData.correo || !formData.telefono) {
      setError('Los campos marcados con * son requeridos')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo)) {
      setError('Correo electrónico inválido')
      return
    }

    if (!/^\d{7,}$/.test(formData.telefono)) {
      setError('Teléfono inválido (mínimo 7 dígitos)')
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
      // 3. Petición POST a tu backend real
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        // Enviamos el formData tal cual, ya que ahora sus llaves coinciden con el DTO
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Error en el servidor al intentar crear el cliente')
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
                  <label htmlFor="dni" className="block text-sm font-medium text-slate-700 mb-2">
                    DNI *
                  </label>
                  <input
                    id="dni"
                    name="dni"
                    type="text"
                    value={formData.dni}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition"
                    placeholder="12345678"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="nombres" className="block text-sm font-medium text-slate-700 mb-2">
                    Nombres *
                  </label>
                  <input
                    id="nombres"
                    name="nombres"
                    type="text"
                    value={formData.nombres}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition"
                    placeholder="Juan"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="apellidos" className="block text-sm font-medium text-slate-700 mb-2">
                    Apellidos *
                  </label>
                  <input
                    id="apellidos"
                    name="apellidos"
                    type="text"
                    value={formData.apellidos}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition"
                    placeholder="Pérez García"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-2">
                    Teléfono *
                  </label>
                  <input
                    id="telefono"
                    name="telefono"
                    type="tel"
                    value={formData.telefono}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition"
                    placeholder="999999999"
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
                  <label htmlFor="correo" className="block text-sm font-medium text-slate-700 mb-2">
                    Correo Electrónico *
                  </label>
                  <input
                    id="correo"
                    name="correo"
                    type="email"
                    value={formData.correo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition"
                    placeholder="juan@ejemplo.com"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="direccion" className="block text-sm font-medium text-slate-700 mb-2">
                    Dirección
                  </label>
                  <textarea
                    id="direccion"
                    name="direccion"
                    value={formData.direccion}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition resize-none"
                    placeholder="Calle Principal 123, Apt 4B"
                    rows={2}
                  />
                </div>
              </div>
            </div>

            {/* Sección: Información Laboral */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Información Laboral (Opcional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="empresa" className="block text-sm font-medium text-slate-700 mb-2">
                    Empresa
                  </label>
                  <input
                    id="empresa"
                    name="empresa"
                    type="text"
                    value={formData.empresa}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition"
                    placeholder="Nombre de la Empresa"
                  />
                </div>

                <div>
                  <label htmlFor="cargo" className="block text-sm font-medium text-slate-700 mb-2">
                    Cargo
                  </label>
                  <input
                    id="cargo"
                    name="cargo"
                    type="text"
                    value={formData.cargo}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-600 focus:border-transparent outline-none transition"
                    placeholder="Gerente General"
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