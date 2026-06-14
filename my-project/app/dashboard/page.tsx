'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Car, TrendingUp, ArrowRight, Clock } from 'lucide-react'
// 1. IMPORTAMOS EL LAYOUT QUE CONTIENE EL SIDEBAR Y EL HEADER
import { ProtectedLayout } from '@/components/protected-layout'

interface CreditoReciente {
  idCredito: number
  idUsuario: number
  idCliente: number
  idOferta: number
  idTasa: number
  montoFinanciado: number
  cuotaMensualRegular: number
  tcea: number
  estado: string
  fechaSolicitud: string
  createdAt: string
}

interface DashboardStats {
  totalClientes: number
  totalVehiculos: number
  totalSimulaciones: number
  simulacionesRecientes: CreditoReciente[]
}

export default function DashboardPage() {
  const router = useRouter()
  
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    totalVehiculos: 0,
    totalSimulaciones: 0,
    simulacionesRecientes: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('auth_token')

      if (!token) {
        router.push('/')
        return
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/dashboard`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          }
        })

        if (!response.ok) {
          if(response.status === 401 || response.status === 403) {
            localStorage.removeItem('auth_token')
            router.push('/')
            return
          }
          throw new Error('Error al cargar los datos del dashboard')
        }

        const data = await response.json()
        setStats(data)

      } catch (error) {
        console.error("Error cargando dashboard:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-semibold text-slate-600">Cargando panel...</div>
  }

  // 2. ENVOLVEMOS TODO EL CONTENIDO CON EL PROTECTED LAYOUT
  return (
    <ProtectedLayout title="Dashboard">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Clientes</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalClientes}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Total Vehículos</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalVehiculos}</p>
              </div>
              <div className="bg-green-100 p-3 rounded-lg">
                <Car className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-lg transition">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">Simulaciones</p>
                <p className="text-3xl font-bold text-slate-900 mt-2">{stats.totalSimulaciones}</p>
              </div>
              <div className="bg-purple-100 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recents Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Columna Izquierda: Acciones (Ocupa 2/3 en pantallas grandes) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Simulador Financiero</h3>
                <p className="text-slate-600 text-sm mb-4">Calcula cuotas y cronogramas de pago</p>
                <Link
                  href="/simulador"
                  className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  Nueva Simulación
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Historial</h3>
                <p className="text-slate-600 text-sm mb-4">Revisa las simulaciones guardadas</p>
                <Link
                  href="/historial"
                  className="inline-flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition"
                >
                  Ver Historial
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Simulaciones Recientes */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-slate-200 rounded-lg p-6 h-full">
              <div className="flex items-center gap-2 mb-6">
                <Clock className="w-5 h-5 text-slate-500" />
                <h3 className="text-lg font-bold text-slate-900">Últimas Simulaciones</h3>
              </div>

              {stats.simulacionesRecientes.length > 0 ? (
                <div className="space-y-4">
                  {stats.simulacionesRecientes.map((sim, index) => (
                    <div key={sim.idCredito || index} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">
                          {sim.montoFinanciado ? `S/ ${sim.montoFinanciado.toLocaleString('es-PE')}` : 'Sin monto'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {sim.createdAt ? new Date(sim.createdAt).toLocaleDateString('es-PE') : 'Fecha no disp.'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-blue-600">
                          {sim.cuotaMensualRegular ? `S/ ${sim.cuotaMensualRegular.toLocaleString('es-PE')}` : '-'}
                        </p>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">Cuota</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 text-sm">
                  No hay simulaciones recientes.
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </ProtectedLayout>
  )
}