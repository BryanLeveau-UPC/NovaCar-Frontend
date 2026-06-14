'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NuevoVehiculoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  // Estructura exacta de tu VehiculoDTO
  const [formData, setFormData] = useState({
    vehMarca: '',
    vehModelo: '',
    vehTipoVehiculo: 'Sedán', // Valor por defecto
    vehDescripcion: '',
    vehAnho: new Date().getFullYear(),
    vehMonto: 0,
    montoInicial: 0,
    activo: true, // Por defecto al crearlo está activo
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    
    // Convertimos a número si el campo es de tipo numérico
    if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }))
    } else if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validaciones básicas
    if (!formData.vehMarca || !formData.vehModelo || !formData.vehAnho || !formData.vehMonto) {
      setError('Por favor, completa todos los campos obligatorios (*)')
      return
    }

    if (formData.montoInicial >= formData.vehMonto) {
      setError('La cuota inicial no puede ser mayor o igual al precio total del vehículo')
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/')
      return
    }

    setLoading(true)

    try {
      // Petición POST a tu backend real
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        throw new Error('Error al guardar el vehículo en la base de datos')
      }

      // Volvemos al catálogo si todo sale bien
      router.push('/vehiculos')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedLayout title="Nuevo Vehículo">
      <div className="max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/vehiculos" className="text-slate-600 hover:text-slate-900 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h3 className="text-2xl font-bold text-slate-900">Registrar Nuevo Vehículo</h3>
        </div>

        {/* Form Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
                {error}
              </div>
            )}

            {/* Fila 1: Marca y Modelo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="Ej: Toyota"
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="Ej: Corolla"
                  required
                />
              </div>
            </div>

            {/* Fila 2: Tipo y Año */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="vehTipoVehiculo" className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de Vehículo *
                </label>
                <select
                  id="vehTipoVehiculo"
                  name="vehTipoVehiculo"
                  value={formData.vehTipoVehiculo}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  required
                >
                  <option value="Sedán">Sedán</option>
                  <option value="SUV">SUV</option>
                  <option value="Hatchback">Hatchback</option>
                  <option value="Pickup">Pickup</option>
                  <option value="Deportivo">Deportivo</option>
                  <option value="Comercial">Comercial</option>
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
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  required
                />
              </div>
            </div>

            {/* Fila 3: Finanzas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
              <div>
                <label htmlFor="vehMonto" className="block text-sm font-medium text-slate-700 mb-2">
                  Precio Total (S/) *
                </label>
                <input
                  id="vehMonto"
                  type="number"
                  name="vehMonto"
                  value={formData.vehMonto || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="0.00"
                  required
                />
              </div>

              <div>
                <label htmlFor="montoInicial" className="block text-sm font-medium text-slate-700 mb-2">
                  Cuota Inicial Mínima (S/)
                </label>
                <input
                  id="montoInicial"
                  type="number"
                  name="montoInicial"
                  value={formData.montoInicial || ''}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Fila 4: Descripción */}
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition resize-none"
                placeholder="Especificaciones, color, versión..."
              />
            </div>

            {/* Fila 5: Estado */}
            <div className="flex items-center gap-2">
              <input
                id="activo"
                type="checkbox"
                name="activo"
                checked={formData.activo}
                onChange={handleChange}
                className="w-5 h-5 rounded border-slate-300 text-green-600 focus:ring-green-500"
              />
              <label htmlFor="activo" className="text-sm font-medium text-slate-700 cursor-pointer">
                Vehículo Activo (Visible para simulaciones)
              </label>
            </div>

            {/* Botones */}
            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <Link
                href="/vehiculos"
                className="flex-1 px-6 py-3 border border-slate-300 text-slate-900 rounded-lg font-medium hover:bg-slate-50 transition text-center flex items-center justify-center"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition disabled:opacity-50"
              >
                {loading ? 'Guardando...' : 'Guardar Vehículo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedLayout>
  )
}