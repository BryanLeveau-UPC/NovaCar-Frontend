'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Edit2, Trash2, Plus } from 'lucide-react'

// 1. Adaptamos la interfaz a los nombres típicos de tu base de datos
interface Cliente {
  idCliente: number
  nombres: string
  apellidos: string
  correo: string
  telefono: string
}

export default function ClientesPage() {
  const router = useRouter()
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchClientes = async () => {
      // 2. Verificación de seguridad real
      const token = localStorage.getItem('auth_token')
      
      if (!token) {
        router.push('/')
        return
      }

      try {
        // 3. Petición a tu backend real de Spring Boot
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        })

        if (!response.ok) {
          if (response.status === 404) {
             throw new Error('Aviso: El endpoint /api/clientes aún no existe en tu backend (Spring Boot).')
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
  }, [router])

  // 4. Lógica de eliminación conectada al backend
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
          // Si el backend lo borra, lo quitamos de la pantalla
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
        
        {/* Header con Botón de Agregar */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Gestión de Clientes</h3>
            <p className="text-slate-600 text-sm mt-1">Total de clientes: {clientes.length}</p>
          </div>
          <Link
            href="/clientes/nuevo"
            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <Plus className="w-5 h-5" />
            Nuevo Cliente
          </Link>
        </div>

        {/* Manejo de Errores (Ej: Si no has creado el endpoint aún) */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {/* Tabla de Clientes */}
        {clientes.length > 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Nombres</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Apellidos</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Teléfono</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-slate-900">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {clientes.map((cliente) => (
                  <tr key={cliente.idCliente} className="hover:bg-slate-50 transition">
                    <td className="px-6 py-4 text-sm text-slate-900">{cliente.nombres}</td>
                    <td className="px-6 py-4 text-sm text-slate-900">{cliente.apellidos}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{cliente.correo}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">{cliente.telefono}</td>
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
        ) : (
          !error && (
            <div className="bg-white border border-slate-200 rounded-lg p-12 text-center">
              <p className="text-slate-600 text-lg mb-4">No hay clientes registrados en el sistema.</p>
              <Link
                href="/clientes/nuevo"
                className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
              >
                <Plus className="w-5 h-5" />
                Crear Primer Cliente
              </Link>
            </div>
          )
        )}
      </div>
    </ProtectedLayout>
  )
}