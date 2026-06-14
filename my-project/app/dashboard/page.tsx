'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Users, Car, TrendingUp, ArrowRight } from 'lucide-react'

interface DashboardStats {
  totalClientes: number
  totalVehiculos: number
  totalSimulaciones: number
  simulacionesRecientes: any[]
}

export default function DashboardPage() {
  const router = useRouter()
  
  // Usamos datos estáticos de demostración por ahora
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 15,
    totalVehiculos: 42,
    totalSimulaciones: 8,
    simulacionesRecientes: [],
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Verificamos la seguridad: ¿El usuario tiene un token válido?
    const token = localStorage.getItem('auth_token')

    if (!token) {
      // Si no hay token, lo devolvemos al login
      router.push('/')
      return
    }

    // 2. Simulamos un pequeño tiempo de carga de medio segundo
    // (Aquí es donde en el futuro irá el fetch a tu backend)
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [router])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center font-semibold text-slate-600">Cargando panel...</div>
  }

  return (
    <div className="p-8 space-y-8 bg-slate-50 min-h-screen">
       <h1 className="text-2xl font-bold text-slate-900 mb-6">Panel de Control</h1>
       
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
  )
}