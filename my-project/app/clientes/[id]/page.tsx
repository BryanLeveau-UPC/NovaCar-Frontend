'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function EditarClientePage() {
  const router = useRouter()
  const params = useParams()
  const clienteId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')
  
  // Usamos los nombres exactos del DTO de Spring Boot
  const [formData, setFormData] = useState({
    dni: '',
    nombres: '',
    apellidos: '',
    correo: '',
    telefono: '',
    direccion: '',
    empresa: '',
    cargo: '',
  })

  // 1. Cargar los datos actuales del cliente al entrar a la página
  useEffect(() => {
    const fetchCliente = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/')
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${clienteId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('No se pudo cargar la información del cliente')
        }

        const data = await response.json()
        
        // Rellenamos el formulario con los datos de la base de datos
        setFormData({
          dni: data.dni || '',
          nombres: data.nombres || '',
          apellidos: data.apellidos || '',
          correo: data.correo || '',
          telefono: data.telefono || '',
          direccion: data.direccion || '',
          empresa: data.empresa || '',
          cargo: data.cargo || '',
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      } finally {
        setInitialLoad(false)
      }
    }

    fetchCliente()
  }, [clienteId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  // 2. Guardar los cambios (Actualizar)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validaciones básicas
    if (!formData.nombres || !formData.apellidos || !formData.correo || !formData.telefono) {
      setError('Los campos marcados con * son obligatorios')
      return
    }

    const token = localStorage.getItem('auth_token')
    setLoading(true)

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${clienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Error al actualizar el cliente en el servidor')
      }

      // Si se actualizó correctamente, volvemos a la lista
      router.push('/clientes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  // Pantalla de carga mientras trae los datos del GET
  if (initialLoad) {
    return (
      <ProtectedLayout title="Editar Cliente">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando datos del cliente...</p>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout title="Editar Cliente">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/clientes" className="text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h3 className="text-2xl font-bold text-slate-900">Editar Cliente</h3>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Campos del Formulario (Alineados con el DTO) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label htmlFor="dni" className="block text-sm font-medium text-slate-700 mb-2">
                  DNI *
                </label>
                <input
                  id="dni"
                  type="text"
                  name="dni"
                  value={formData.dni}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="nombres" className="block text-sm font-medium text-slate-700 mb-2">
                  Nombres *
                </label>
                <input
                  id="nombres"
                  type="text"
                  name="nombres"
                  value={formData.nombres}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="apellidos" className="block text-sm font-medium text-slate-700 mb-2">
                  Apellidos *
                </label>
                <input
                  id="apellidos"
                  type="text"
                  name="apellidos"
                  value={formData.apellidos}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="correo" className="block text-sm font-medium text-slate-700 mb-2">
                  Correo Electrónico *
                </label>
                <input
                  id="correo"
                  type="email"
                  name="correo"
                  value={formData.correo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="telefono" className="block text-sm font-medium text-slate-700 mb-2">
                  Teléfono *
                </label>
                <input
                  id="telefono"
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>

              <div>
                <label htmlFor="direccion" className="block text-sm font-medium text-slate-700 mb-2">
                  Dirección
                </label>
                <input
                  id="direccion"
                  type="text"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                />
              </div>

            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <Link
                href="/clientes"
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition text-center flex items-center justify-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedLayout>
  )
}