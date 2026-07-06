'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Edit2, Trash2, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

// 1. Creamos la interfaz para eliminar el error del 'any'
interface Tasa {
  idTasa: number
  nombre: string
  tipoTasa: string
  valor: number
  periodo: string
  capitalizacion: string | null
  moneda: string
  teaConvertida: number
  activo: boolean
}

export default function TasasPage() {
  // 2. Usamos la interfaz Tasa en lugar de any
  const [tasas, setTasas] = useState<Tasa[]>([])
  const [loading, setLoading] = useState(true) // Ya inicia en true por defecto
  const [error, setError] = useState('')

  // Estado para controlar qué endpoint usar (por defecto: false = solo activos)
  const [mostrarTodos, setMostrarTodos] = useState(false)


  useEffect(() => {
    // 3. Declaramos la función ADENTRO del useEffect
    const fetchTasas = async () => {
      const token = localStorage.getItem('auth_token')
      try {
        setLoading(true) // Activamos carga al cambiar el filtro
        
        // Lógica dinámica para el endpoint
        const endpoint = mostrarTodos ? '/api/tasas/todos' : '/api/tasas'
        
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${endpoint}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        
        if (!res.ok) {
          if (res.status === 404) throw new Error('Aviso: El endpoint de /todos aún no existe en el backend.')
          throw new Error('No se pudo cargar el listado de Campañas.')
        }
        
        const data = await res.json()
        setTasas(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al conectar con el servidor')
      } finally {
        setLoading(false)
      }
    }

    fetchTasas()
  }, [mostrarTodos]) // Agregamos 'mostrarTodos' como dependencia para que vuelva a disparar el fetch

  // Nueva función para manejar la eliminación
  const handleDelete = async (idTasa: number) => {
    if (confirm('¿Estás seguro de que deseas eliminar esta campaña?')) {
      const token = localStorage.getItem('auth_token')
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasas/${idTasa}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })

        if (response.ok) {
          // Filtramos la tabla para quitar el elemento eliminado sin recargar la página
          setTasas(tasas.filter(t => t.idTasa !== idTasa))
        } else {
          alert('No se pudo eliminar la campaña en el servidor.')
        }
      } catch (error) {
        alert('Error de conexión al intentar eliminar.')
      }
    }
  }

  return (
    <ProtectedLayout title="Tasa de Interes">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <h2 className="text-xl font-bold text-slate-700">Listado de Campañas</h2>
        
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
              Incluir inactivas
            </span>
          </label>

          <Link href="/tasas/nuevo" className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition shadow-sm">
            <Plus size={18} /> Nueva Tasa
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-slate-500">Cargando campañas...</div>
      ) : tasas.length === 0 ? (
        <div className="text-center py-16 bg-white border border-dashed border-slate-300 rounded-lg">
          <p className="text-slate-500 mb-4">No hay campañas registradas actualmente.</p>
          <Link href="/tasas/nueva" className="text-blue-600 font-semibold hover:underline">
            Registrar la primera campaña
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-slate-50 text-left text-slate-700">
                <th className="p-4">Nombre</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Valor Inicial</th>
                <th className="p-4">Moneda</th>
                <th className="p-4">TEA Convertida</th>
                <th className="p-4">Estado</th>
                <th className="p-4">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasas.map((t) => (
                <tr key={t.idTasa} className="hover:bg-slate-50 transition">
                  <td className="p-4 font-medium text-slate-900">{t.nombre}</td>
                  <td className="p-4 capitalize text-slate-600">{t.tipoTasa}</td>
                  <td className="p-4 text-slate-700">{(t.valor * 100).toFixed(2)}%</td>
                  <td className="p-4 uppercase text-slate-600 font-medium">{t.moneda}</td>
                  <td className="p-4 font-semibold text-blue-600">{(t.teaConvertida * 100).toFixed(2)}%</td>
                  <td className="p-4">
                    {t.activo ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-xs font-medium text-green-800">
                        <CheckCircle className="w-3 h-3" /> Activa
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-800">
                        <XCircle className="w-3 h-3" /> Inactiva
                      </span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      <Link 
                        href={`/tasas/${t.idTasa}`}
                        className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition inline-flex"
                      >
                        <Edit2 size={16}/>
                      </Link>
                      
                      <button 
                        onClick={() => handleDelete(t.idTasa)}
                        className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg transition"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </ProtectedLayout>
  )
}