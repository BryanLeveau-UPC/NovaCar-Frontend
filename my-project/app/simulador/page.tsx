'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedLayout } from '@/components/protected-layout'
import { BarChart3, Save } from 'lucide-react'

// --- 1. CONSTANTES Y UTILIDADES LOCALES ---
const PRAZOS_MESES = [12, 24, 36, 48, 60]
const TIPOS_GRACIA = ['ninguna', 'parcial', 'total']

const formatearMoneda = (valor: number) => {
  return `S/ ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatearPorcentaje = (valor: number) => {
  return `${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}
// ------------------------------------------

// --- 2. INTERFACES BASADAS EN TUS DTOs ---
interface Cliente {
  idCliente: number
  nombres: string
  apellidos: string
  dni?: string 
}

interface Vehiculo {
  idOferta: number
  vehMarca: string
  vehModelo: string
  vehMonto: number
  montoInicial: number
  activo: boolean
}

interface PagoCronograma {
  idCuota?: number
  idCredito?: number
  numeroCuota: number
  fechaVencimiento?: string
  saldoInicial?: number
  interes: number
  amortizacionCapital: number
  cuotaTotal: number
  saldoFinal: number
  estadoPago?: string
  itfPeriodo?: number
  segDesgravamen?: number
  segVehicular?: number
  fechaPago?: string
}

// Nueva interfaz para evitar el uso de <any> y errores de TypeScript
interface ResultadoSimulacion {
  montoFinanciado: number
  tem: number
  tea: number
  cuotaMensualRegular: number
  vanDeudor: number
  tirDeudor: number
  tcea: number
  cronograma: PagoCronograma[]
  totalAPagar: number
  totalInteres: number
}
// -----------------------------------------

export default function SimuladorPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  
  // Usamos la interfaz correcta
  const [resultado, setResultado] = useState<ResultadoSimulacion | null>(null)
  
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])

  // Estado del formulario
  const [formData, setFormData] = useState({
    idCliente: '',
    idOferta: '',
    idTasa: 1, 
    plazo: 24,
    cuotaInicial: 0,
    montoBalloon: 0,
    tipoGracia: 'ninguna', 
    periodiGracia: 0,
    periodoTasa: 3, // 1=Diaria, 2=Mensual, 3=Anual
    segurosDesgravamen: 0.06, 
    segurosVehicular: 0, 
    comision: 0, 
  })

  // Cargar Clientes y Vehículos simultáneamente
  useEffect(() => {
    const fetchCatologos = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/')
        return
      }

      try {
        const [resClientes, resVehiculos] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculos`, { headers: { 'Authorization': `Bearer ${token}` } })
        ])

        if (resClientes.ok && resVehiculos.ok) {
          setClientes(await resClientes.json())
          const dataVehiculos = await resVehiculos.json()
          setVehiculos(dataVehiculos.filter((v: Vehiculo) => v.activo))
        }
      } catch (err) {
        setError('Error al cargar clientes y vehículos.')
      } finally {
        setLoading(false)
      }
    }
    fetchCatologos()
  }, [router])

  const clienteSeleccionado = clientes.find(c => c.idCliente.toString() === formData.idCliente)
  const vehiculoSeleccionado = vehiculos.find(v => v.idOferta.toString() === formData.idOferta)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: isNaN(Number(value)) || value === '' ? value : Number(value),
    }))

    // Autocompletar cuota inicial si el vehículo la tiene predefinida
    if (name === 'idOferta') {
      const vehiculo = vehiculos.find(v => v.idOferta.toString() === value)
      if (vehiculo && vehiculo.montoInicial > 0) {
        setFormData(prev => ({ ...prev, cuotaInicial: vehiculo.montoInicial }))
      }
    }
  }

  // SOLICITAR SIMULACIÓN AL BACKEND
  const handleCalcular = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!vehiculoSeleccionado) {
      setError('Seleccione un vehículo')
      return
    }

    const token = localStorage.getItem('auth_token')
    setCalculando(true)

    try {
      const payload = {
        idTasa: formData.idTasa,
        montoVehiculo: vehiculoSeleccionado.vehMonto,
        montoInicial: formData.cuotaInicial,
        montoBalloon: formData.montoBalloon,
        plazoMeses: formData.plazo,
        periodoGracia: formData.periodiGracia,
        tipoGracia: formData.tipoGracia,
        periodoTasa: formData.periodoTasa,
        seguroDesgravamen: formData.segurosDesgravamen / 100, 
        seguroVehicular: formData.segurosVehicular,
        montoPortes: formData.comision,
        tasaItf: 0.00005 
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/simulador/simular`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Error al generar la simulación en el servidor')

      const data = await response.json()
      
      // Sumatorias visuales seguras (protegidas con Array.isArray)
      const cronogramaSeguro = Array.isArray(data.cronograma) ? data.cronograma : []
      // Reemplazamos "any" por "PagoCronograma"
      data.totalAPagar = cronogramaSeguro.reduce((acc: number, pago: PagoCronograma) => acc + (pago.cuotaTotal || 0), 0)
      data.totalInteres = cronogramaSeguro.reduce((acc: number, pago: PagoCronograma) => acc + (pago.interes || 0), 0)

      setResultado(data)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de red')
    } finally {
      setCalculando(false)
    }
  }

  // GUARDAR CRÉDITO DEFINITIVO
  const handleGuardar = async () => {
    if (!resultado || !clienteSeleccionado || !vehiculoSeleccionado) return

    const token = localStorage.getItem('auth_token')
    setSaving(true)

    try {
      const payload = {
        idCliente: clienteSeleccionado.idCliente,
        idOferta: vehiculoSeleccionado.idOferta,
        idTasa: formData.idTasa,
        montoFinanciado: resultado.montoFinanciado,
        cuotaMensualRegular: resultado.cuotaMensualRegular,
        tcea: resultado.tcea,
        estado: 'GUARDADO'
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creditos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('Error al guardar en el servidor')

      alert('Simulación guardada exitosamente.')
      setStep(1)
      setResultado(null)
      setFormData(prev => ({ ...prev, idCliente: '', idOferta: '' }))
      
    } catch (err) {
      alert('Hubo un problema al guardar.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <ProtectedLayout title="Simulador de Financiamiento">
        <div className="flex justify-center items-center h-64 text-slate-600 font-medium">
          Cargando catálogos y conectando con el motor financiero...
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout title="Simulador de Financiamiento">
      <div className="space-y-6">
        
        {error && step === 1 && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-medium">
            {error}
          </div>
        )}

        {step === 1 ? (
          // PASO 1: FORMULARIO
          <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Nueva Simulación</h2>

            <form onSubmit={handleCalcular} className="space-y-8">
              {/* SECCIÓN 1: Cliente y Vehículo */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Seleccione Cliente y Vehículo</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Cliente *</label>
                    <select
                      name="idCliente"
                      value={formData.idCliente}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      required
                    >
                      <option value="">-- Seleccionar Cliente --</option>
                      {clientes.map(c => (
                        <option key={c.idCliente} value={c.idCliente.toString()}>
                          {c.nombres} {c.apellidos}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Vehículo *</label>
                    <select
                      name="idOferta"
                      value={formData.idOferta}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      required
                    >
                      <option value="">-- Seleccionar Vehículo --</option>
                      {vehiculos.map(v => (
                        <option key={v.idOferta} value={v.idOferta.toString()}>
                          {v.vehMarca} {v.vehModelo} - {formatearMoneda(v.vehMonto)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 2: Parámetros Base */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Estructura del Crédito</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Cuota Inicial (S/)</label>
                    <input
                      name="cuotaInicial"
                      type="number"
                      value={formData.cuotaInicial}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Plazo (Meses)</label>
                    <select
                      name="plazo"
                      value={formData.plazo}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    >
                      {PRAZOS_MESES.map(m => <option key={m} value={m}>{m} meses</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">ID Tasa (Base de Datos)</label>
                    <input
                      name="idTasa"
                      type="number"
                      value={formData.idTasa}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Período de la Tasa</label>
                    <select
                      name="periodoTasa"
                      value={formData.periodoTasa}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                    >
                      <option value="1">Diaria</option>
                      <option value="2">Mensual</option>
                      <option value="3">Anual</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* SECCIÓN 3: Gracia y Balloon */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Condiciones Especiales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tipo de Gracia</label>
                    <select
                      name="tipoGracia"
                      value={formData.tipoGracia}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition capitalize"
                    >
                      {TIPOS_GRACIA.map(tipo => (
                        <option key={tipo} value={tipo}>{tipo}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Meses de Gracia</label>
                    <input
                      name="periodiGracia"
                      type="number"
                      value={formData.periodiGracia}
                      onChange={handleChange}
                      disabled={formData.tipoGracia === 'ninguna'}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg disabled:bg-slate-100 focus:ring-2 focus:ring-blue-500 outline-none transition"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Cuota Balloon (S/)</label>
                    <input
                      name="montoBalloon"
                      type="number"
                      value={formData.montoBalloon}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* SECCIÓN 4: Costos Adicionales */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Seguros y Comisiones</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Seg. Desgravamen (%)</label>
                    <input
                      name="segurosDesgravamen"
                      type="number"
                      value={formData.segurosDesgravamen}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      step="0.01" min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Seg. Vehicular (S/ Fijo)</label>
                    <input
                      name="segurosVehicular"
                      type="number"
                      value={formData.segurosVehicular}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      min="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Portes Mensuales (S/)</label>
                    <input
                      name="comision"
                      type="number"
                      value={formData.comision}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Botón */}
              <div className="flex gap-4 pt-6 border-t border-slate-200">
                <button
                  type="submit"
                  disabled={calculando}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2 shadow-sm"
                >
                  <BarChart3 size={20} />
                  {calculando ? 'Consultando Motor Financiero...' : 'Generar Cronograma'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          // PASO 2: RESULTADOS (Basado en SimulacionResponseDTO)
          resultado && (
            <div className="space-y-6">
              {/* Resumen Ejecutivo */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6">
                  <p className="text-blue-600 text-sm font-semibold mb-1">Cuota Referencial</p>
                  <p className="text-2xl font-bold text-blue-900">{formatearMoneda(resultado.cuotaMensualRegular)}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6">
                  <p className="text-green-600 text-sm font-semibold mb-1">TCEA</p>
                  <p className="text-2xl font-bold text-green-900">{formatearPorcentaje(resultado.tcea * 100)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6">
                  <p className="text-purple-600 text-sm font-semibold mb-1">TEA</p>
                  <p className="text-2xl font-bold text-purple-900">{formatearPorcentaje(resultado.tea * 100)}</p>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
                  <p className="text-orange-600 text-sm font-semibold mb-1">Total a Pagar Estimado</p>
                  <p className="text-2xl font-bold text-orange-900">{formatearMoneda(resultado.totalAPagar)}</p>
                </div>
              </div>

              {/* Detalles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Análisis de Estructura</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Precio del Vehículo:</span>
                      <span className="font-semibold">{formatearMoneda(vehiculoSeleccionado?.vehMonto || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cuota Inicial:</span>
                      <span className="font-semibold">{formatearMoneda(formData.cuotaInicial)}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-slate-200">
                      <span className="text-slate-600">Monto a Financiar Real:</span>
                      <span className="font-semibold text-blue-600">{formatearMoneda(resultado.montoFinanciado)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Indicadores de Riesgo</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-slate-600">TEM (Tasa Efectiva Mensual):</span>
                      <span className="font-semibold">{formatearPorcentaje(resultado.tem * 100)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">VAN Deudor:</span>
                      <span className="font-semibold">{formatearMoneda(resultado.vanDeudor)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">TIR Deudor (Mensual):</span>
                      <span className="font-semibold">{formatearPorcentaje(resultado.tirDeudor * 100)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Cronograma Generado */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Cronograma de Pagos Generado</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-slate-700 font-semibold rounded-tl-lg">N°</th>
                        <th className="px-4 py-3 text-right text-slate-700 font-semibold">Cuota Total</th>
                        <th className="px-4 py-3 text-right text-slate-700 font-semibold">Interés</th>
                        <th className="px-4 py-3 text-right text-slate-700 font-semibold">Amortización</th>
                        <th className="px-4 py-3 text-right text-slate-700 font-semibold rounded-tr-lg">Saldo Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {resultado.cronograma.map((pago: PagoCronograma, index: number) => (
                        <tr key={index} className="border-t border-slate-200 hover:bg-slate-50 transition">
                          <td className="px-4 py-3 font-medium text-slate-900">{pago.numeroCuota || index + 1}</td>
                          <td className="px-4 py-3 text-right font-medium text-blue-600">
                            {formatearMoneda(pago.cuotaTotal || 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatearMoneda(pago.interes || 0)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatearMoneda(pago.amortizacionCapital || 0)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatearMoneda(pago.saldoFinal || 0)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button
                  onClick={() => {
                    setStep(1)
                    setResultado(null)
                  }}
                  className="flex-1 border border-slate-300 text-slate-700 hover:bg-slate-50 py-3 rounded-lg font-semibold transition"
                >
                  Modificar Parámetros
                </button>
                <button
                  onClick={handleGuardar}
                  disabled={saving}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 rounded-lg font-semibold transition shadow-sm flex items-center justify-center gap-2"
                >
                  <Save size={20} />
                  {saving ? 'Guardando...' : 'Guardar y Aprobar Simulación'}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </ProtectedLayout>
  )
}