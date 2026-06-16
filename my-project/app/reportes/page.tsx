'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FileDown, TrendingUp, PieChart } from 'lucide-react'

// --- 1. UTILIDADES LOCALES (Alto Contraste) ---
const formatearMoneda = (valor: number) => {
  return `S/ ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatearPorcentaje = (valor: number) => {
  return `${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}
// ----------------------------------------------

// --- 2. INTERFACES REALES ---
interface Cliente {
  idCliente: number
  cliDni: string      
  cliNombres: string  
  cliApellidos: string 
}

interface Vehiculo {
  idOferta: number
  vehMarca: string
  vehModelo: string
  vehAnho: number
}

interface Credito {
  idCredito: number
  idCliente: number
  idOferta: number
  montoFinanciado: number
  cuotaMensualRegular: number
  tcea: number
  plazoMeses?: number // Asumimos que tu backend devuelve el plazo
  estado: string
  fechaCreacion?: string
}
// ----------------------------

export default function ReportesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Estados de la BD
  const [creditos, setCreditos] = useState<Credito[]>([])
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])

  // Filtros
  const [filtroCliente, setFiltroCliente] = useState('')
  const [filtroVehiculo, setFiltroVehiculo] = useState('')

  // 1. Cargar toda la data de la base de datos
  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/')
        return
      }

      try {
        const [resCreditos, resClientes, resVehiculos] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creditos`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculos`, { headers: { 'Authorization': `Bearer ${token}` } })
        ])

        if (!resCreditos.ok || !resClientes.ok || !resVehiculos.ok) {
          throw new Error('Error al extraer los datos del servidor.')
        }

        setCreditos(await resCreditos.json())
        setClientes(await resClientes.json())
        setVehiculos(await resVehiculos.json())
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  // 2. Funciones de cruce de datos
  const getClienteNombre = (id: number) => {
    const c = clientes.find(c => c.idCliente === id)
    return c ? `${c.cliNombres} ${c.cliApellidos}` : `ID: ${id}`
  }

  const getVehiculoNombre = (id: number) => {
    const v = vehiculos.find(v => v.idOferta === id)
    return v ? `${v.vehMarca} ${v.vehModelo}` : `ID: ${id}`
  }

  // 3. Aplicar Filtros
  const creditosFiltrados = creditos.filter(cred => {
    if (filtroCliente && cred.idCliente.toString() !== filtroCliente) return false
    if (filtroVehiculo && cred.idOferta.toString() !== filtroVehiculo) return false
    return true
  })

  // 4. Cálculos de KPIs
  const totalOperaciones = creditosFiltrados.length
  const montoTotalFinanciado = creditosFiltrados.reduce((sum, c) => sum + (c.montoFinanciado || 0), 0)
  
  const cuotaMensualPromedio = totalOperaciones > 0
    ? creditosFiltrados.reduce((sum, c) => sum + (c.cuotaMensualRegular || 0), 0) / totalOperaciones
    : 0

  // Estimación de intereses: (Cuota * Plazo) - Capital. (Si no tienes el plazo exacto, asumimos 0 temporalmente)
  const interesesTotales = creditosFiltrados.reduce((sum, c) => {
    const plazo = c.plazoMeses || 0
    const totalPagado = c.cuotaMensualRegular * plazo
    const interesOperacion = totalPagado > c.montoFinanciado ? totalPagado - c.montoFinanciado : 0
    return sum + interesOperacion
  }, 0)

  const tceaPromedio = totalOperaciones > 0
    ? creditosFiltrados.reduce((sum, c) => sum + (c.tcea || 0), 0) / totalOperaciones
    : 0

  // 5. Exportar Reporte a TXT/PDF (Datos Reales)
  const handleExport = () => {
    const content = `
REPORTE DE OPERACIONES - AUTO-COMPRA INTELIGENTE
Generado: ${new Date().toLocaleDateString('es-PE')}
=================================================

RESUMEN EJECUTIVO
-----------------
Total de Operaciones: ${totalOperaciones}
Monto Total Financiado: ${formatearMoneda(montoTotalFinanciado)}
Cuota Mensual Promedio: ${formatearMoneda(cuotaMensualPromedio)}
Intereses Proyectados: ${formatearMoneda(interesesTotales)}
TCEA Promedio: ${formatearPorcentaje(tceaPromedio * 100)}

DETALLE DE OPERACIONES
----------------------
${creditosFiltrados.map(c => `
Operación: CRD-${c.idCredito.toString().padStart(5, '0')}
Cliente: ${getClienteNombre(c.idCliente)}
Vehículo: ${getVehiculoNombre(c.idOferta)}
Monto Financiado: ${formatearMoneda(c.montoFinanciado)}
Cuota Mensual: ${formatearMoneda(c.cuotaMensualRegular)}
TCEA: ${formatearPorcentaje(c.tcea * 100)}
Estado: ${c.estado}
---`).join('\n')}
    `
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte-operaciones-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <ProtectedLayout title="Reportes y Análisis">
        <div className="flex justify-center items-center h-64 text-slate-900 font-extrabold text-lg">
          Generando reportes financieros...
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout title="Reportes y Análisis">
      <div className="space-y-6">

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg font-bold">
            {error}
          </div>
        )}

        {/* 1. Panel de Filtros */}
        <div className="bg-white border border-slate-300 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-extrabold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-blue-700" />
            Panel de Filtros
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="filtroCliente" className="block text-sm font-extrabold text-slate-800 mb-2 uppercase tracking-wider">
                Cliente
              </label>
              <select
                id="filtroCliente"
                value={filtroCliente}
                onChange={(e) => setFiltroCliente(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition font-medium text-slate-900"
              >
                <option value="">-- Todos los Clientes --</option>
                {clientes.map(c => (
                  <option key={c.idCliente} value={c.idCliente.toString()}>
                    {c.cliNombres} {c.cliApellidos}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="filtroVehiculo" className="block text-sm font-extrabold text-slate-800 mb-2 uppercase tracking-wider">
                Vehículo
              </label>
              <select
                id="filtroVehiculo"
                value={filtroVehiculo}
                onChange={(e) => setFiltroVehiculo(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 outline-none transition font-medium text-slate-900"
              >
                <option value="">-- Todos los Vehículos --</option>
                {vehiculos.map(v => (
                  <option key={v.idOferta} value={v.idOferta.toString()}>
                    {v.vehMarca} {v.vehModelo}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={handleExport}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-lg font-extrabold transition flex items-center justify-center gap-2 shadow-sm"
              >
                <FileDown size={18} />
                Exportar Reporte (TXT)
              </button>
            </div>
          </div>
        </div>

        {/* 2. KPIs Financieros (Métricas Clave) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-900 text-xs font-extrabold uppercase tracking-wider mb-1">Operaciones</p>
                <p className="text-4xl font-black text-blue-700">{totalOperaciones}</p>
              </div>
              <div className="bg-blue-200 p-3 rounded-lg">
                <TrendingUp size={24} className="text-blue-800" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-6 shadow-sm">
            <div>
              <p className="text-green-900 text-xs font-extrabold uppercase tracking-wider mb-1">Capital Colocado</p>
              <p className="text-2xl font-black text-green-700">{formatearMoneda(montoTotalFinanciado)}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-6 shadow-sm">
            <div>
              <p className="text-purple-900 text-xs font-extrabold uppercase tracking-wider mb-1">Cuota Promedio</p>
              <p className="text-2xl font-black text-purple-700">{formatearMoneda(cuotaMensualPromedio)}</p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-6 shadow-sm">
            <div>
              <p className="text-orange-900 text-xs font-extrabold uppercase tracking-wider mb-1">TCEA Promedio</p>
              <p className="text-2xl font-black text-orange-700">{formatearPorcentaje(tceaPromedio * 100)}</p>
            </div>
          </div>
        </div>

        {/* 3. Tabla de Resultados */}
        <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-300 bg-slate-50">
            <h3 className="text-lg font-extrabold text-slate-900">Desglose de Operaciones</h3>
          </div>
          
          {creditosFiltrados.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-slate-800 font-bold text-lg">No hay datos que coincidan con los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-200 border-b border-slate-300">
                  <tr>
                    <th className="px-6 py-4 text-left font-extrabold text-slate-900">ID Operación</th>
                    <th className="px-6 py-4 text-left font-extrabold text-slate-900">Cliente</th>
                    <th className="px-6 py-4 text-left font-extrabold text-slate-900">Vehículo</th>
                    <th className="px-6 py-4 text-right font-extrabold text-slate-900">Capital</th>
                    <th className="px-6 py-4 text-right font-extrabold text-slate-900">Cuota</th>
                    <th className="px-6 py-4 text-center font-extrabold text-slate-900">TCEA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {creditosFiltrados.map((cred) => (
                    <tr key={cred.idCredito} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-bold text-slate-900">
                        CRD-{cred.idCredito.toString().padStart(5, '0')}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {getClienteNombre(cred.idCliente)}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700">
                        {getVehiculoNombre(cred.idOferta)}
                      </td>
                      <td className="px-6 py-4 text-right font-extrabold text-slate-900">
                        {formatearMoneda(cred.montoFinanciado)}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-blue-700">
                        {formatearMoneda(cred.cuotaMensualRegular)}
                      </td>
                      <td className="px-6 py-4 text-center font-extrabold text-green-700">
                        {formatearPorcentaje(cred.tcea * 100)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 4. Resumen Inferior (Análisis) */}
        {creditosFiltrados.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-300 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-6 border-b border-slate-200 pb-3">Análisis por Plazo (Meses)</h3>
              <div className="space-y-5">
                {/* Agrupación dinámica por plazos existentes */}
                {Array.from(new Set(creditosFiltrados.map(c => c.plazoMeses || 0)))
                  .sort((a, b) => a - b)
                  .map(plazo => {
                    const count = creditosFiltrados.filter(c => (c.plazoMeses || 0) === plazo).length
                    const porcentaje = (count / totalOperaciones) * 100
                    return plazo > 0 ? (
                      <div key={plazo}>
                        <div className="flex justify-between mb-2">
                          <span className="text-sm font-bold text-slate-800">{plazo} meses</span>
                          <span className="text-sm font-extrabold text-slate-900">{count} oper. ({porcentaje.toFixed(1)}%)</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                      </div>
                    ) : null
                })}
              </div>
            </div>

            <div className="bg-white border border-slate-300 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-extrabold text-slate-900 mb-6 border-b border-slate-200 pb-3">Resumen de Rentabilidad Proyectada</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <span className="text-slate-800 font-bold uppercase tracking-wider text-xs">Intereses Totales Proyectados:</span>
                  <span className="text-xl font-black text-slate-900">{formatearMoneda(interesesTotales)}</span>
                </div>
                <div className="flex justify-between items-center bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <span className="text-slate-800 font-bold uppercase tracking-wider text-xs">Utilidad Promedio / Operación:</span>
                  <span className="text-xl font-black text-slate-900">
                    {formatearMoneda(totalOperaciones > 0 ? interesesTotales / totalOperaciones : 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </ProtectedLayout>
  )
}