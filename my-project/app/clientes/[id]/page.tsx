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
  
  // Mismos nombres exactos que en NuevoClientePage (ClienteDTO de Java)
  const [formData, setFormData] = useState({
    cliDni: '',
    cliNombres: '',
    cliApellidos: '',
    cliFecNac: '',
    cliDireccion: '',
    cliRegion: '',
    cliTelefono: '',
    cliCorreo: '',
    cliIngresos: '',
    estado: '' // Se mantendrá el estado que venga de la base de datos
  })

  // Convierte "999999999" -> "999-999-999" solo para mostrarlo
  const formatTelefono = (digits: string): string => {
    const partes = []
    if (digits.length > 0) partes.push(digits.slice(0, 3))
    if (digits.length > 3) partes.push(digits.slice(3, 6))
    if (digits.length > 6) partes.push(digits.slice(6, 9))
    return partes.join('-')
  }

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
        
        // Rellenamos el formulario con los datos exactos del backend
        setFormData({
          cliDni: data.cliDni || '',
          cliNombres: data.cliNombres || '',
          cliApellidos: data.cliApellidos || '',
          cliFecNac: data.cliFecNac || '',
          cliDireccion: data.cliDireccion || '',
          cliRegion: data.cliRegion || '',
          cliTelefono: data.cliTelefono || '',
          cliCorreo: data.cliCorreo || '',
          cliIngresos: data.cliIngresos ? data.cliIngresos.toString() : '',
          estado: data.estado || 'ACTIVO'
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      } finally {
        setInitialLoad(false)
      }
    }

    fetchCliente()
  }, [clienteId, router])

  // Validación y filtrado en tiempo real (Igual que en Nuevo Cliente)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === 'cliDni' && (!/^\d*$/.test(value) || value.length > 8)) return

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

  // 2. Guardar los cambios (Actualizar - PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validaciones del frontend
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
    setLoading(true)

    try {
      const payload = {
        ...formData,
        cliIngresos: parseFloat(formData.cliIngresos) || 0
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${clienteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.mensaje || 'Error al actualizar el cliente en el servidor')
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
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-medium text-sm">
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
              <Link
                href="/clientes"
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition text-center flex items-center justify-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition disabled:opacity-50"
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