'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function EditarVehiculoPage() {
  const router = useRouter()
  const params = useParams()
  const vehiculoId = params.id as string
  
  const [loading, setLoading] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [error, setError] = useState('')
  
  // 1. Estado actualizado para coincidir con VehiculoDTO
  const [formData, setFormData] = useState({
    vehMarca: '',
    vehModelo: '',
    vehTipoVehiculo: 'Sedán',
    vehDescripcion: '',
    vehAnho: '',
    vehMonto: '',
    vehMontoInicial: '', // Renombrado
    vehTipoMoneda: 'USD', // Nuevo campo
    vehCantidad: '',      // Nuevo campo
    activo: true,
  })

  // 2. Cargar datos del vehículo (GET) y mapear los nuevos campos
  useEffect(() => {
    const fetchVehiculo = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/')
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculos/${vehiculoId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error('No se pudo cargar la información del vehículo')
        }

        const data = await response.json()
        
        setFormData({
          vehMarca: data.vehMarca || '',
          vehModelo: data.vehModelo || '',
          vehTipoVehiculo: data.vehTipoVehiculo || 'Sedán',
          vehDescripcion: data.vehDescripcion || '',
          vehAnho: data.vehAnho ? data.vehAnho.toString() : '',
          vehMonto: data.vehMonto ? data.vehMonto.toString() : '',
          vehMontoInicial: data.vehMontoInicial ? data.vehMontoInicial.toString() : '', // Renombrado
          vehTipoMoneda: data.vehTipoMoneda || 'USD', // Nuevo campo
          vehCantidad: data.vehCantidad ? data.vehCantidad.toString() : '', // Nuevo campo
          activo: data.activo !== undefined ? data.activo : true,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      } finally {
        setInitialLoad(false)
      }
    }

    fetchVehiculo()
  }, [vehiculoId, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  // 3. Guardar Cambios (Actualizar - PUT) con el payload corregido
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Actualizada la validación para requerir la cantidad
    if (!formData.vehMarca || !formData.vehModelo || !formData.vehAnho || !formData.vehMonto || !formData.vehCantidad) {
      setError('Por favor, completa todos los campos obligatorios (*)')
      return
    }

    const montoTotal = parseFloat(formData.vehMonto) || 0
    const inicial = parseFloat(formData.vehMontoInicial) || 0

    if (inicial >= montoTotal) {
      setError('La cuota inicial no puede ser mayor o igual al precio total del vehículo')
      return
    }

    const token = localStorage.getItem('auth_token')
    setLoading(true)

    try {
      const payload = {
        ...formData,
        vehAnho: parseInt(formData.vehAnho, 10) || new Date().getFullYear(),
        vehMonto: montoTotal,
        vehMontoInicial: inicial,
        vehCantidad: parseInt(formData.vehCantidad, 10) || 1
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculos/${vehiculoId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || errorData?.mensaje || 'Error al actualizar el vehículo en el servidor')
      }

      router.push('/vehiculos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar los cambios')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-slate-950 placeholder:text-slate-400 bg-white"

  if (initialLoad) {
    return (
      <ProtectedLayout title="Editar Vehículo">
        <div className="text-center py-12">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Cargando datos del vehículo...</p>
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout title="Editar Vehículo">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <Link href="/vehiculos" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6 transition">
          <ArrowLeft size={18} />
          <span>Volver al Catálogo</span>
        </Link>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Editar Vehículo</h2>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg font-bold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección: Características */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Características del Vehículo</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="vehMarca" className="block text-sm font-medium text-slate-700 mb-2">
                    Marca *
                  </label>
                  <input
                    id="vehMarca"
                    type="text"
                    name="vehMarca"
                    value={formData.vehMarca}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="vehModelo" className="block text-sm font-medium text-slate-700 mb-2">
                    Modelo *
                  </label>
                  <input
                    id="vehModelo"
                    type="text"
                    name="vehModelo"
                    value={formData.vehModelo}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="vehTipoVehiculo" className="block text-sm font-medium text-slate-700 mb-2">
                    Tipo de Vehículo *
                  </label>
                  <select
                    id="vehTipoVehiculo"
                    name="vehTipoVehiculo"
                    value={formData.vehTipoVehiculo}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="Sedán">Sedán</option>
                    <option value="SUV">SUV</option>
                    <option value="Hatchback">Hatchback</option>
                    <option value="Pickup / Camioneta">Pickup / Camioneta</option>
                    <option value="Miniván / Familiar">Miniván / Familiar</option>
                    <option value="Deportivo">Deportivo</option>
                    <option value="Comercial / Van">Comercial / Van</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="vehAnho" className="block text-sm font-medium text-slate-700 mb-2">
                    Año de Fabricación *
                  </label>
                  <input
                    id="vehAnho"
                    type="number"
                    name="vehAnho"
                    value={formData.vehAnho}
                    onChange={handleChange}
                    min="1990"
                    max={new Date().getFullYear() + 1}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección: Finanzas y Stock (Actualizada con los nuevos campos) */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Precios, Financiamiento y Stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                
                {/* Nuevo: Selector de Moneda */}
                <div>
                  <label htmlFor="vehTipoMoneda" className="block text-sm font-medium text-slate-700 mb-2">
                    Moneda de Cotización *
                  </label>
                  <select
                    id="vehTipoMoneda"
                    name="vehTipoMoneda"
                    value={formData.vehTipoMoneda}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  >
                    <option value="USD">Dólares (USD)</option>
                    <option value="PEN">Soles (PEN)</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="vehMonto" className="block text-sm font-medium text-slate-700 mb-2">
                    Precio Total *
                  </label>
                  <input
                    id="vehMonto"
                    type="number"
                    step="0.01"
                    name="vehMonto"
                    value={formData.vehMonto}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>

                <div>
                  <label htmlFor="vehMontoInicial" className="block text-sm font-medium text-slate-700 mb-2">
                    Cuota Inicial Mínima
                  </label>
                  <input
                    id="vehMontoInicial"
                    type="number"
                    step="0.01"
                    name="vehMontoInicial"
                    value={formData.vehMontoInicial}
                    onChange={handleChange}
                    className={inputClass}
                  />
                </div>

                {/* Nuevo: Cantidad */}
                <div>
                  <label htmlFor="vehCantidad" className="block text-sm font-medium text-slate-700 mb-2">
                    Unidades en Stock *
                  </label>
                  <input
                    id="vehCantidad"
                    type="number"
                    name="vehCantidad"
                    min="0"
                    value={formData.vehCantidad}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Sección: Detalles */}
            <div>
              <label htmlFor="vehDescripcion" className="block text-sm font-medium text-slate-700 mb-2">
                Descripción / Detalles Adicionales
              </label>
              <textarea
                id="vehDescripcion"
                name="vehDescripcion"
                value={formData.vehDescripcion}
                onChange={handleChange}
                rows={3}
                className={`${inputClass} resize-none`}
              />
            </div>

            {/* Estado */}
            <div className="flex items-center gap-2 py-2">
              <input
                id="activo"
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="activo" className="text-sm font-bold text-slate-800 cursor-pointer select-none">
                Vehículo Activo (Visible para simulaciones)
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <Link
                href="/vehiculos"
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