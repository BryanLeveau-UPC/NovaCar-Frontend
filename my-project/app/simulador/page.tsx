'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedLayout } from '@/components/protected-layout'
import { BarChart3, Save, RefreshCw } from 'lucide-react'

// --- CONSTANTES Y UTILIDADES LOCALES ---
const PRAZOS_MESES = [12, 24, 36, 48, 60]
const TIPOS_GRACIA = ['ninguna', 'parcial', 'total']

const formatearMoneda = (valor: number, moneda: string = 'PEN') => {
  const simbolo = moneda === 'USD' ? 'US$' : 'S/'
  return `${simbolo} ${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

const formatearPorcentaje = (valor: number) => {
  return `${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

// --- INTERFACES BASADAS EN TUS DTOs ---
interface Cliente {
  idCliente: number
  cliNombres: string 
  cliApellidos: string
  cliDni: string 
}

interface Vehiculo {
  idOferta: number
  vehMarca: string
  vehModelo: string
  vehMonto: number
  vehMontoInicial: number
  activo: boolean
}

interface TasaInteres {
  idTasa: number
  nombre: string
  tipoTasa: string
  valor: number
  periodo: string
  capitalización: string
  moneda: string
  teaConvertida: number
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
  segDesgravamen?: number
  segVehicular?: number
  itfPeriodo?: number
  cuotaTotal: number
  saldoFinal: number
  estadoPago?: string
}

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

export default function SimuladorPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [calculando, setCalculando] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [moneda, setMoneda] = useState('PEN') // Estado para la moneda dinámica
  
  const [resultado, setResultado] = useState<ResultadoSimulacion | null>(null)
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([])
  const [tasas, setTasas] = useState<TasaInteres[]>([])

  // Estado optimizado alineado 100% al DTO
  const [formData, setFormData] = useState({
    idCliente: '',
    idOferta: '',
    idTasa: '', 
    plazo: '24',
    cuotaInicial: '',
    montoBalloon: '0',
    tipoGracia: 'ninguna', 
    periodoGracia: '0',
    // Gastos Iniciales
    costesNotariales: '0',
    costesRegistrales: '0',
    comisionEstudio: '0',
    comisionActivacion: '0',
    tasacion: '0',
    // Gastos Periódicos
    segurosDesgravamen: '0.049', 
    tasaSeguroVehicular: '0', 
    comision: '0', // Portes
    gastosAdministracion: '0'
  })

  // Cargar catálogos
  useEffect(() => {
    const fetchCatologos = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/')
        return
      }

      // Leer preferencia de moneda
      const monedaGuardada = localStorage.getItem('moneda_preferida') || 'PEN'
      setMoneda(monedaGuardada)

      try {
        const [resClientes, resVehiculos, resTasas] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/vehiculos`, { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasas`, { headers: { 'Authorization': `Bearer ${token}` } })
        ])

        if (resClientes.ok && resVehiculos.ok && resTasas.ok) {
          setClientes(await resClientes.json())
          const dataVehiculos = await resVehiculos.json()
          setVehiculos(dataVehiculos.filter((v: Vehiculo) => v.activo))
          const dataTasas = await resTasas.json()
          setTasas(dataTasas.filter((t: TasaInteres) => t.activo))
        } else {
          throw new Error('No se pudo sincronizar la data con el servidor')
        }
      } catch (err) {
        setError('Error al conectar con los catálogos del servidor.')
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
    
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      
      if (name === 'idOferta') {
        const vehiculo = vehiculos.find(v => v.idOferta.toString() === value)
        updated.cuotaInicial = vehiculo ? vehiculo.vehMontoInicial.toString() : ''
      }
      
      if (name === 'tipoGracia' && value === 'ninguna') {
        updated.periodoGracia = '0'
      }

      return updated
    })
  }

  // SOLICITAR SIMULACIÓN AL BACKEND
  const handleCalcular = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!clienteSeleccionado) {
      setError('Por favor, seleccione un cliente válido.')
      return
    }
    if (!vehiculoSeleccionado) {
      setError('Por favor, seleccione un vehículo del catálogo.')
      return
    }
    if (!formData.idTasa) {
      setError('Por favor, seleccione una campaña financiera.')
      return
    }

    const montoTotalVehiculo = vehiculoSeleccionado.vehMonto
    const inicialIngresada = parseFloat(formData.cuotaInicial) || 0
    const balloonIngresado = parseFloat(formData.montoBalloon) || 0

    if (inicialIngresada < vehiculoSeleccionado.vehMontoInicial) {
      setError(`La cuota inicial mínima para este vehículo debe ser de ${formatearMoneda(vehiculoSeleccionado.vehMontoInicial, moneda)}`)
      return
    }
    if (inicialIngresada >= montoTotalVehiculo) {
      setError('La cuota inicial no puede igualar ni superar el valor total del vehículo.')
      return
    }

    const token = localStorage.getItem('auth_token')
    setCalculando(true)

    try {
      const payload = {
        idTasa: parseInt(formData.idTasa, 10),
        montoVehiculo: montoTotalVehiculo,
        montoInicial: inicialIngresada,
        montoBalloon: balloonIngresado,
        plazoMeses: parseInt(formData.plazo, 10),
        periodoGracia: parseInt(formData.periodoGracia, 10),
        tipoGracia: formData.tipoGracia,
        
        // Gastos Iniciales
        costesNotariales: parseFloat(formData.costesNotariales) || 0,
        costesRegistrales: parseFloat(formData.costesRegistrales) || 0,
        comisionEstudio: parseFloat(formData.comisionEstudio) || 0,
        comisionActivacion: parseFloat(formData.comisionActivacion) || 0,
        tasacion: parseFloat(formData.tasacion) || 0,

        // Gastos Periódicos
        seguroDesgravamen: (parseFloat(formData.segurosDesgravamen) || 0) / 100,
        tasaSeguroVehicular: (parseFloat(formData.tasaSeguroVehicular) || 0) / 100,
        montoPortes: parseFloat(formData.comision) || 0,
        gastosAdministracion: parseFloat(formData.gastosAdministracion) || 0,
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

      if (!response.ok) throw new Error('El motor financiero de Java rechazó los parámetros enviados.')

      const data = await response.json()
      
      const cronogramaSeguro = Array.isArray(data.cronograma) ? data.cronograma : []
      data.totalAPagar = cronogramaSeguro.reduce((acc: number, pago: PagoCronograma) => acc + (pago.cuotaTotal || 0), 0)
      data.totalInteres = cronogramaSeguro.reduce((acc: number, pago: PagoCronograma) => acc + (pago.interes || 0), 0)

      setResultado(data)
      setStep(2)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error en la conexión con el servidor de simulación.')
    } finally {
      setCalculando(false)
    }
  }

  // GUARDAR CRÉDITO DEFINITIVO
  const handleGuardar = async () => {
    if (!resultado || !clienteSeleccionado || !vehiculoSeleccionado) return

    const token = localStorage.getItem('auth_token')
    const idAdmin = localStorage.getItem('admin_id') 

    setSaving(true)
    setError('')

    try {
      const payload = {
        idTasa: parseInt(formData.idTasa, 10),
        montoVehiculo: vehiculoSeleccionado.vehMonto,
        montoInicial: parseFloat(formData.cuotaInicial) || 0,
        montoBalloon: parseFloat(formData.montoBalloon) || 0,
        plazoMeses: parseInt(formData.plazo, 10),
        periodoGracia: parseInt(formData.periodoGracia, 10),
        tipoGracia: formData.tipoGracia,
        
        // Gastos Iniciales
        costesNotariales: parseFloat(formData.costesNotariales) || 0,
        costesRegistrales: parseFloat(formData.costesRegistrales) || 0,
        comisionEstudio: parseFloat(formData.comisionEstudio) || 0,
        comisionActivacion: parseFloat(formData.comisionActivacion) || 0,
        tasacion: parseFloat(formData.tasacion) || 0,

        // Gastos Periódicos
        seguroDesgravamen: (parseFloat(formData.segurosDesgravamen) || 0) / 100,
        tasaSeguroVehicular: (parseFloat(formData.tasaSeguroVehicular) || 0) / 100,
        montoPortes: parseFloat(formData.comision) || 0,
        gastosAdministracion: parseFloat(formData.gastosAdministracion) || 0,
        tasaItf: 0.00005,
        
        // Relaciones
        idUsuario: idAdmin ? parseInt(idAdmin, 10) : null,
        idCliente: clienteSeleccionado.idCliente,
        idOffer: vehiculoSeleccionado.idOferta,
        idOferta: vehiculoSeleccionado.idOferta,
        idConfig: null
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creditos/guardar-simulacion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error('No se pudo registrar la aprobación del crédito en el servidor.')

      setStep(1)
      setResultado(null)
      setFormData(prev => ({ ...prev, idCliente: '', idOferta: '', cuotaInicial: '', montoBalloon: '0' }))
      alert('Crédito definitivo guardado y aprobado exitosamente.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ocurrió un error al procesar el guardado.')
    } finally {
      setSaving(false)
    }
  }

  const inputClass = "w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition text-slate-950 placeholder:text-slate-400 bg-white"
  const simboloMoneda = moneda === 'USD' ? 'US$' : 'S/' // Helper para los labels

  if (loading) {
    return (
      <ProtectedLayout title="Simulador de Financiamiento">
        <div className="flex justify-center items-center h-64 text-slate-600 font-medium">
          <div className="w-6 h-6 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
          Sincronizando catálogos de base de datos...
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout title="Simulador de Financiamiento">
      <div className="space-y-6">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm font-bold">
            {error}
          </div>
        )}

        {step === 1 ? (
          /* PASO 1: ENTRADA DE DATOS */
          <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900 mb-8">Nueva Simulación Vehicular</h2>

            <form onSubmit={handleCalcular} className="space-y-8">
              
              {/* Bloque 1: Entidades Relacionales */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Titular y Objeto del Crédito</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Cliente Asociado *</label>
                    <select name="idCliente" value={formData.idCliente} onChange={handleChange} className={inputClass} required>
                      <option value="">-- Seleccionar Cliente --</option>
                      {clientes.map(c => (
                        <option key={c.idCliente} value={c.idCliente.toString()}>
                          {c.cliNombres} {c.cliApellidos} {c.cliDni ? `(DNI: ${c.cliDni})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Vehículo a Cotizar *</label>
                    <select name="idOferta" value={formData.idOferta} onChange={handleChange} className={inputClass} required>
                      <option value="">-- Seleccionar Vehículo --</option>
                      {vehiculos.map(v => (
                        <option key={v.idOferta} value={v.idOferta.toString()}>
                          {v.vehMarca} {v.vehModelo} - Costo: {formatearMoneda(v.vehMonto, moneda)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Bloque 2: Parámetros del Motor de Amortización */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Configuración Estructural del Financiamiento</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Precio del Vehículo ({simboloMoneda})</label>
                    <input 
                      type="text" 
                      value={vehiculoSeleccionado ? formatearMoneda(vehiculoSeleccionado.vehMonto, moneda) : ''} 
                      className={`${inputClass} bg-slate-100 text-slate-500 font-semibold cursor-not-allowed border-slate-200`} 
                      placeholder={`${simboloMoneda} 0.00`} 
                      readOnly 
                      disabled 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Cuota Inicial ({simboloMoneda})</label>
                    <input name="cuotaInicial" type="number" step="0.01" value={formData.cuotaInicial} onChange={handleChange} className={inputClass} placeholder={vehiculoSeleccionado ? `Min. ${vehiculoSeleccionado.vehMontoInicial}` : "0.00"} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Plazo del Crédito</label>
                    <select name="plazo" value={formData.plazo} onChange={handleChange} className={inputClass}>
                      {PRAZOS_MESES.map(m => <option key={m} value={m.toString()}>{m} meses</option>)}
                    </select>
                  </div>
                </div>
                
                <div className="w-full">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Campaña Financiera (Tasa) *</label>
                  <select name="idTasa" value={formData.idTasa} onChange={handleChange} className={inputClass} required>
                    <option value="">-- Seleccionar Campaña --</option>
                    {tasas.map((t: TasaInteres) => (
                      <option key={t.idTasa} value={t.idTasa}>
                        {t.nombre} - TEA: {(t.teaConvertida).toFixed(2)}%
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Bloque 3: Periodos Especiales */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Estructuras de Gracia y Cuotas Finales</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Modalidad de Gracia</label>
                    <select name="tipoGracia" value={formData.tipoGracia} onChange={handleChange} className={inputClass + " capitalize"}>
                      {TIPOS_GRACIA.map(tipo => <option key={tipo} value={tipo}>{tipo}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Meses diferidos (Gracia)</label>
                    <input name="periodoGracia" type="number" value={formData.periodoGracia} onChange={handleChange} disabled={formData.tipoGracia === 'ninguna'} className={inputClass + " disabled:bg-slate-100 disabled:opacity-60"} min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Monto Cuota Balloon ({simboloMoneda})</label>
                    <input name="montoBalloon" type="number" step="0.01" value={formData.montoBalloon} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                </div>
              </div>

              {/* Bloque 4: Gastos Iniciales (Desembolso) */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Gastos Iniciales (Cobrados al Desembolso)</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Costes Notariales ({simboloMoneda})</label>
                    <input name="costesNotariales" type="number" step="0.01" value={formData.costesNotariales} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Costes Registrales ({simboloMoneda})</label>
                    <input name="costesRegistrales" type="number" step="0.01" value={formData.costesRegistrales} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Tasación ({simboloMoneda})</label>
                    <input name="tasacion" type="number" step="0.01" value={formData.tasacion} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Comisión de Estudio ({simboloMoneda})</label>
                    <input name="comisionEstudio" type="number" step="0.01" value={formData.comisionEstudio} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Comisión de Activación ({simboloMoneda})</label>
                    <input name="comisionActivacion" type="number" step="0.01" value={formData.comisionActivacion} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                </div>
              </div>

              {/* Bloque 5: Gastos Periódicos Adicionales */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Pólizas de Seguros y Cargos Mensuales</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Seg. Desgravamen (% Mensual)</label>
                    <input name="segurosDesgravamen" type="number" step="0.0001" value={formData.segurosDesgravamen} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Seg. Vehicular (% s/Valor Auto)</label>
                    <input name="tasaSeguroVehicular" type="number" step="0.0001" value={formData.tasaSeguroVehicular} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Portes Mensuales ({simboloMoneda})</label>
                    <input name="comision" type="number" step="0.01" value={formData.comision} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Gastos Mantenimiento / Admin ({simboloMoneda})</label>
                    <input name="gastosAdministracion" type="number" step="0.01" value={formData.gastosAdministracion} onChange={handleChange} className={inputClass} min="0" />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-200">
                <button type="submit" disabled={calculando} className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-4 rounded-lg font-bold transition flex items-center justify-center gap-2 shadow-md">
                  <BarChart3 size={20} />
                  {calculando ? 'Calculando VAN, TIR y TCEA en Servidor...' : 'Generar Cronograma de Pagos'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          /* PASO 2: PANEL DE CONTROL DE RESULTADOS FINANCIEROS */
          resultado && (
            <div className="space-y-6">
              {/* Tarjetas de Indicadores */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 shadow-sm">
                  <p className="text-blue-700 text-xs font-bold uppercase tracking-wider mb-1">Cuota Mensual Regular</p>
                  <p className="text-2xl font-black text-blue-950">{formatearMoneda(resultado.cuotaMensualRegular, moneda)}</p>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-6 shadow-sm">
                  <p className="text-green-700 text-xs font-bold uppercase tracking-wider mb-1">TCEA (Costo Real Anual)</p>
                  <p className="text-2xl font-black text-green-950">{formatearPorcentaje(resultado.tcea)}</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-6 shadow-sm">
                  <p className="text-purple-700 text-xs font-bold uppercase tracking-wider mb-1">TEA Solicitada</p>
                  <p className="text-2xl font-black text-purple-950">{formatearPorcentaje(resultado.tea)}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-100 border border-amber-200 rounded-lg p-6 shadow-sm">
                  <p className="text-amber-800 text-xs font-bold uppercase tracking-wider mb-1">Costo Total del Crédito</p>
                  <p className="text-2xl font-black text-amber-950">{formatearMoneda(resultado.totalAPagar, moneda)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Estructura del Capital</h3>
                  <div className="space-y-3 font-medium text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Valor Comercial Vehículo:</span>
                      <span className="text-slate-900 font-bold">{formatearMoneda(vehiculoSeleccionado?.vehMonto || 0, moneda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Cuota Inicial Aportada:</span>
                      <span className="text-slate-900 font-bold text-green-600">-{formatearMoneda(parseFloat(formData.cuotaInicial) || 0, moneda)}</span>
                    </div>
                    <div className="flex justify-between pt-3 border-t border-slate-200 text-base">
                      <span className="text-slate-800 font-bold">Monto Neto Financiado:</span>
                      <span className="font-extrabold text-blue-600">{formatearMoneda(resultado.montoFinanciado, moneda)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Evaluación y Rentabilidad (Riesgo)</h3>
                  <div className="space-y-3 font-medium text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-600">TEM Equivalente (Mensual):</span>
                      <span className="text-slate-900 font-bold">{formatearPorcentaje(resultado.tem)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">VAN del Deudor:</span>
                      <span className="text-slate-900 font-bold">{formatearMoneda(resultado.vanDeudor, moneda)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">TIR Deudor Obtenida:</span>
                      <span className="text-slate-900 font-bold">{formatearPorcentaje(resultado.tirDeudor)}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <div className="p-6 bg-slate-50 border-b border-slate-200">
                  <h3 className="text-lg font-bold text-slate-900">Cronograma de Pagos Completo (Breakdown)</h3>
                  <p className="text-xs text-slate-600 mt-1">Incluye Amortización Francesa, intereses devengados, primas de seguros e impuestos (ITF).</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3 text-center font-bold">N°</th>
                        <th className="px-4 py-3 text-right font-bold">Interés</th>
                        <th className="px-4 py-3 text-right font-bold">Amortización</th>
                        <th className="px-4 py-3 text-right font-bold">Seg. Desgrav.</th>
                        <th className="px-4 py-3 text-right font-bold">Seg. Vehic.</th>
                        <th className="px-4 py-3 text-right font-bold">ITF</th>
                        <th className="px-4 py-3 text-right font-bold bg-blue-50 text-blue-900">Cuota Total</th>
                        <th className="px-4 py-3 text-right font-bold">Saldo Final</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-medium text-slate-800">
                      {resultado.cronograma.map((pago: PagoCronograma, index: number) => (
                        <tr key={index} className="hover:bg-slate-50 transition">
                          <td className="px-4 py-3 text-center text-slate-900 font-bold bg-slate-50">{pago.numeroCuota || index + 1}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatearMoneda(pago.interes, moneda)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatearMoneda(pago.amortizacionCapital, moneda)}</td>
                          <td className="px-4 py-3 text-right text-red-600">{formatearMoneda(pago.segDesgravamen || 0, moneda)}</td>
                          <td className="px-4 py-3 text-right text-red-600">{formatearMoneda(pago.segVehicular || 0, moneda)}</td>
                          <td className="px-4 py-3 text-right text-amber-700 text-xs">{formatearMoneda(pago.itfPeriodo || 0, moneda)}</td>
                          <td className="px-4 py-3 text-right font-bold bg-blue-50/60 text-blue-700">{formatearMoneda(pago.cuotaTotal, moneda)}</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">{formatearMoneda(pago.saldoFinal, moneda)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t border-slate-200">
                <button onClick={() => { setStep(1); setResultado(null); }} className="flex-1 border border-slate-400 text-slate-700 hover:bg-slate-100 py-3 rounded-lg font-bold transition flex items-center justify-center gap-2 bg-white">
                  <RefreshCw size={18} />
                  Modificar Parámetros
                </button>
                <button onClick={handleGuardar} disabled={saving} className="flex-1 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white py-3 rounded-lg font-bold transition shadow-md flex items-center justify-center gap-2">
                  <Save size={18} />
                  {saving ? 'Escribiendo en Servidor...' : 'Aprobar y Guardar Crédito'}
                </button>
              </div>
            </div>
          )
        )}
      </div>
    </ProtectedLayout>
  )
}