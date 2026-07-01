'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit2, Trash2, Plus, CheckCircle, XCircle, Filter } from 'lucide-react'

// 1. Interfaz EXACTA de tu VehiculoDTO en Java
interface Vehiculo {
  idOferta: number
  vehMarca: string
  vehModelo: string
  vehTipoVehiculo: string
  vehDescripcion: string
  vehAnho: number
  vehMonto: number
  vehMontoInicial: number
  vehTipoMoneda: string
  vehCantidad: number
  activo: boolean
}

export default function VehiculosPage() {
  const router = useRouter()
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Estado para controlar qué endpoint usar (por defecto: false = solo activos)
  const [mostrarTodos, setMostrarTodos] = useState(false)

  // Nuevos estados para la moneda
  const [monedaPreferida, setMonedaPreferida] = useState('PEN')
  const [tipoCambio, setTipoCambio] = useState(3.40)

  // Formateador inteligente según moneda preferida y tipo de cambio
  const formatearMoneda = (valor: number, monedaVehiculo: string) => {
    let valorFinal = valor;
    let simbolo = monedaVehiculo === 'USD' ? 'US$' : 'S/';

    if (monedaPreferida === 'USD' && monedaVehiculo === 'PEN') {
      valorFinal = valor / tipoCambio;
      simbolo = 'US$';
    } else if (monedaPreferida === 'PEN' && monedaVehiculo === 'USD') {
      valorFinal = valor * tipoCambio;
      simbolo = 'S/';
    }

    return `${simbolo} ${valorFinal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  useEffect(() => {
    const fetchVehiculos = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        router.push('/')
        return
      }

      // Cargar preferencia y tipo de cambio
      const pref = localStorage.getItem('moneda_preferida') || 'PEN'
      setMonedaPreferida(pref)

      try {
        setLoading(true)
        
        // Obtener TC del backend
        const tcRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/configuracion/tipo-cambio`, {
           headers: { 'Authorization': `Bearer ${token}` }
        })
        if (tcRes.ok) setTipoCambio(await tcRes.json())

        // Construimos el endpoint dinámicamente según el estado
        const endpoint = mostrarTodos ? '/api/vehiculos/todos' : '/api/vehiculos'
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 404) {
             throw new Error('Aviso: El endpoint aún no existe en el backend.')
          }
          throw new Error('Error al cargar la lista de vehículos.')
        }

        const data = await response.json()
        setVehiculos(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión al servidor')
      } finally {
        setLoading(false)
      }
    }

    fetchVehiculos()
  }, [router, mostrarTodos])

  const handleDelete = async (idOferta: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este vehículo?')) {
      const token = localStorage.getItem('auth_token')
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculos/${idOferta}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setVehiculos(vehiculos.filter(v => v.idOferta !== idOferta))
        } else {
          alert('No se pudo eliminar el vehículo en el servidor.')
        }
      } catch (error) {
        alert('Error de conexión al intentar eliminar.')
      }
    }
  }

  if (loading) {
    return (
      <ProtectedLayout title="Vehículos">
        <div className="flex justify-center items-center h-64 text-slate-600 font-medium">
          Cargando catálogo de vehículos...
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout title="Vehículos">
      <div className="space-y-6">
        
        {/* Header Modificado con Filtro y Botón */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Catálogo de Vehículos</h3>
            <p className="text-slate-600 text-sm mt-1">Mostrando {vehiculos.length} vehículos</p>
          </div>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-white border border-slate-200 px-3 py-2 rounded-lg hover:bg-slate-50 transition shadow-sm">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                checked={mostrarTodos}
                onChange={(e) => setMostrarTodos(e.target.checked)}
              />
              <span className="text-sm font-medium text-slate-700 select-none">
                Incluir inactivos
              </span>
            </label>

            <Link
              href="/vehiculos/nuevo"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition shadow-sm"
            >
              <Plus className="w-5 h-5" />
              Nuevo Vehículo
            </Link>
          </div>
        </div>

        {/* Manejo de Errores */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {/* Tabla de Vehículos */}
        {vehiculos.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:hidden">
              {vehiculos.map((vehiculo) => (
                <article
                  key={vehiculo.idOferta}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-slate-900">
                        {vehiculo.vehMarca} {vehiculo.vehModelo}
                      </p>
                      <p className="mt-1 text-sm capitalize text-slate-600">
                        {vehiculo.vehTipoVehiculo} · {vehiculo.vehAnho}
                      </p>
                    </div>
                    {vehiculo.activo ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                        <CheckCircle className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                        <XCircle className="w-3 h-3" /> Inactivo
                      </span>
                    )}
                  </div>

                  <div className="mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monto total</p>
                      <p className="mt-1 font-bold text-slate-900">
                        {formatearMoneda(vehiculo.vehMonto, vehiculo.vehTipoMoneda)}
                      </p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Monto inicial</p>
                      <p className="mt-1 font-bold text-slate-900">
                        {formatearMoneda(vehiculo.vehMontoInicial, vehiculo.vehTipoMoneda)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/vehiculos/${vehiculo.idOferta}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-200"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(vehiculo.idOferta)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 transition hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm md:block">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Vehículo</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Tipo / Año</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Monto Total</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Monto Inicial</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Stock</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Estado</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {vehiculos.map((vehiculo) => (
                    <tr key={vehiculo.idOferta} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-slate-900">{vehiculo.vehMarca}</p>
                        <p className="text-xs text-slate-500">{vehiculo.vehModelo}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600 capitalize">{vehiculo.vehTipoVehiculo} / {vehiculo.vehAnho}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">
                        {formatearMoneda(vehiculo.vehMonto, vehiculo.vehTipoMoneda)}
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-slate-600">
                        {formatearMoneda(vehiculo.vehMontoInicial, vehiculo.vehTipoMoneda)}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{vehiculo.vehCantidad}</td>
                      <td className="px-6 py-4">
                        {vehiculo.activo ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                            <XCircle className="w-3 h-3" /> Inactivo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/vehiculos/${vehiculo.idOferta}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDelete(vehiculo.idOferta)}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          !error && (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center shadow-sm">
              <p className="text-slate-600 text-lg mb-4">
                No hay vehículos registrados para mostrar.
              </p>
              <Link
                href="/vehiculos/nuevo"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <Plus className="w-5 h-5" />
                Registrar Primer Vehículo
              </Link>
            </div>
          )
        )}
      </div>
    </ProtectedLayout>
  )
}