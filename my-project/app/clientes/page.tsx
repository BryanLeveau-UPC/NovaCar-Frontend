'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit2, Trash2, Plus, CheckCircle, XCircle } from 'lucide-react'

// 1. Interfaz adaptada (se agregó 'activo' de forma opcional por si el backend lo devuelve)
interface Cliente {
  idCliente: number
  cliNombres: string
  cliApellidos: string
  cliCorreo: string
  cliTelefono: string
  activo?: boolean
}

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Estado para controlar qué endpoint usar (por defecto: false = solo activos)
  const [mostrarTodos, setMostrarTodos] = useState(false)

  useEffect(() => {
    const fetchClientes = async () => {
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        router.push('/')
        return
      }

      try {
        setLoading(true)
        const endpoint = mostrarTodos ? '/api/clientes/todos' : '/api/clientes'

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 404) {
             throw new Error('Aviso: El endpoint aún no existe en el backend (Spring Boot).')
          }
          throw new Error('Error al cargar la lista de clientes.')
        }

        const data = await response.json()
        setClientes(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchClientes()
  }, [router, mostrarTodos])

  const handleDelete = async (idCliente: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar este cliente?')) {
      const token = localStorage.getItem('auth_token')
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes/${idCliente}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          setClientes(clientes.filter(c => c.idCliente !== idCliente))
        } else {
          alert('No se pudo eliminar el cliente en el servidor.')
        }
      } catch (error) {
        alert('Error de conexión al intentar eliminar.')
      }
    }
  }

  if (loading) {
    return (
      <ProtectedLayout title="Clientes">
        <div className="flex justify-center items-center h-64 text-slate-600 font-medium">
          Cargando directorio de clientes...
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout title="Clientes">
      <div className="space-y-6">
        
        {/* Header con Filtro y Botón de Agregar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Gestión de Clientes</h3>
            <p className="text-slate-600 text-sm mt-1">Total de clientes: {clientes.length}</p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Toggle de Filtro Dinámico */}
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
              href="/clientes/nuevo"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <Plus className="w-5 h-5" />
              Nuevo Cliente
            </Link>
          </div>
        </div>

        {/* Manejo de Errores */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {/* Tabla de Clientes */}
        {clientes.length > 0 ? (
          <div className="space-y-4">
            <div className="grid gap-4 md:hidden">
              {clientes.map((cliente) => (
                <article
                  key={cliente.idCliente}
                  className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-bold text-slate-900">
                        {cliente.cliNombres} {cliente.cliApellidos}
                      </p>
                      <p className="mt-1 text-sm text-slate-600">{cliente.cliCorreo}</p>
                      <p className="mt-1 text-sm text-slate-500">{cliente.cliTelefono}</p>
                    </div>
                    {/* Renderizado condicional del estado (si el backend lo devuelve) */}
                    {cliente.activo !== undefined && (
                      cliente.activo ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                          <CheckCircle className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                          <XCircle className="w-3 h-3" /> Inactivo
                        </span>
                      )
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link
                      href={`/clientes/${cliente.idCliente}`}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-100 px-3 py-2 text-sm text-blue-700 transition hover:bg-blue-200"
                    >
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </Link>
                    <button
                      onClick={() => handleDelete(cliente.idCliente)}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-100 px-3 py-2 text-sm text-red-700 transition hover:bg-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="hidden overflow-hidden rounded-lg border border-slate-200 bg-white md:block shadow-sm">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nombres</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Apellidos</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Teléfono</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Estado</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {clientes.map((cliente) => (
                    <tr key={cliente.idCliente} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">{cliente.cliNombres}</td>
                      <td className="px-6 py-4 text-sm text-slate-900">{cliente.cliApellidos}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{cliente.cliCorreo}</td>
                      <td className="px-6 py-4 text-sm text-slate-600">{cliente.cliTelefono}</td>
                      <td className="px-6 py-4">
                        {/* Renderizado condicional del estado */}
                        {cliente.activo !== undefined ? (
                          cliente.activo ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <CheckCircle className="w-3 h-3" /> Activo
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                              <XCircle className="w-3 h-3" /> Inactivo
                            </span>
                          )
                        ) : (
                          <span className="text-sm text-slate-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/clientes/${cliente.idCliente}`}
                            className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg transition text-sm"
                          >
                            <Edit2 className="w-4 h-4" />
                            Editar
                          </Link>
                          <button
                            onClick={() => handleDelete(cliente.idCliente)}
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
                {clientes.length > 0 
                  ? "No hay clientes que coincidan con el filtro actual." 
                  : "No hay clientes registrados en el sistema."}
              </p>
              {clientes.length === 0 && (
                <Link
                  href="/clientes/nuevo"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  <Plus className="w-5 h-5" />
                  Crear Primer Cliente
                </Link>
              )}
            </div>
          )
        )}
      </div>
    </ProtectedLayout>
  )
}