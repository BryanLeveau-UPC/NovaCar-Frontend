'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, CheckCircle, Clock, CheckSquare } from 'lucide-react'
import Link from 'next/link'

const formatearPorcentaje = (valor: number) => {
  return `${valor.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`
}

// --- INTERFACES (Basadas en tus DTOs) ---
interface Credito {
  idCredito: number
  idCliente: number
  idOferta: number
  montoFinanciado: number
  cuotaMensualRegular: number
  tcea: number
  estado: string
  fechaCreacion?: string
}

interface PagoCronograma {
  idCuota: number
  idCredito: number
  numeroCuota: number
  fechaVencimiento: string
  interes: number
  amortizacionCapital: number
  cuotaTotal: number
  saldoFinal: number
  estadoPago: string // "pendiente", "pagado", "vencido"
}
// -------------------------------------------

export default function HistorialPage() {
  const router = useRouter()
  const [creditos, setCreditos] = useState<Credito[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Estados para el Modal
  const [selectedCredito, setSelectedCredito] = useState<Credito | null>(null)
  const [cronograma, setCronograma] = useState<PagoCronograma[]>([])
  const [loadingCronograma, setLoadingCronograma] = useState(false)

  // Nuevos estados para la moneda y tipo de cambio
  const [monedaPreferida, setMonedaPreferida] = useState('PEN')
  const [tipoCambio, setTipoCambio] = useState(3.40)

  // Formateador inteligente según moneda preferida y tipo de cambio
  // (Asumimos que la BD guarda en PEN por defecto, si tuvieras la moneda de origen la pasas como 2do parámetro)
  const formatearMoneda = (valor: number, monedaBase: string = 'PEN') => {
    let valorFinal = valor;
    let simbolo = monedaBase === 'USD' ? 'US$' : 'S/';

    if (monedaPreferida === 'USD' && monedaBase === 'PEN') {
      valorFinal = valor / tipoCambio;
      simbolo = 'US$';
    } else if (monedaPreferida === 'PEN' && monedaBase === 'USD') {
      valorFinal = valor * tipoCambio;
      simbolo = 'S/';
    } else {
      simbolo = monedaPreferida === 'USD' ? 'US$' : 'S/';
    }

    return `${simbolo} ${valorFinal.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  // 1. Cargar todos los créditos/simulaciones + TC
  useEffect(() => {
    const fetchCreditos = async () => {
      const token = localStorage.getItem('auth_token')
      if (!token) {
        router.push('/')
        return
      }

      // Cargar preferencia del localStorage
      const pref = localStorage.getItem('moneda_preferida') || 'PEN'
      setMonedaPreferida(pref)

      try {
        setLoading(true)

        // Obtener TC del backend
        const tcRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/configuraciones/tipo-cambio`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (tcRes.ok) setTipoCambio(await tcRes.json())

        // Obtener historial
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/creditos`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })

        if (!response.ok) throw new Error('Error al cargar el historial de créditos.')

        const data = await response.json()
        setCreditos(data.sort((a: Credito, b: Credito) => b.idCredito - a.idCredito))
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error de conexión')
      } finally {
        setLoading(false)
      }
    }

    fetchCreditos()
  }, [router])

  // 2. Abrir Modal y cargar el cronograma de ese crédito
  const handleVerDetalle = async (credito: Credito) => {
    setSelectedCredito(credito)
    setLoadingCronograma(true)
    const token = localStorage.getItem('auth_token')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cronogramas/credito/${credito.idCredito}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setCronograma(data)
      }
    } catch (err) {
      alert('No se pudo cargar el cronograma de este crédito.')
    } finally {
      setLoadingCronograma(false)
    }
  }

  // 3. Consumir tu endpoint @PatchMapping para pagar una cuota
  const handlePagarCuota = async (idCuota: number) => {
    if (!confirm('¿Confirmas el pago de esta cuota?')) return;

    const token = localStorage.getItem('auth_token')

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/cronogramas/${idCuota}/pagar`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Error al procesar el pago en el servidor.')

      // Actualizamos la fila en la pantalla para que diga "pagado" sin recargar la página
      setCronograma(prev => 
        prev.map(cuota => cuota.idCuota === idCuota ? { ...cuota, estadoPago: 'pagado' } : cuota)
      )
      
      alert('Pago registrado con éxito.')
    } catch (err) {
      alert('Hubo un error al intentar registrar el pago.')
    }
  }

  if (loading) {
    return (
      <ProtectedLayout title="Historial y Cobranzas">
        <div className="flex justify-center items-center h-64 text-slate-800 text-lg">
          Cargando historial de base de datos...
        </div>
      </ProtectedLayout>
    )
  }

  return (
    <ProtectedLayout title="Historial y Cobranzas">
      <div className="space-y-6">
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg font-bold">
            {error}
          </div>
        )}

        {creditos.length === 0 && !error ? (
          <div className="bg-white border border-slate-300 rounded-lg p-12 text-center shadow-sm">
            <p className="text-slate-800 font-bold text-xl mb-4">No hay créditos registrados aún</p>
            <Link
              href="/simulador"
              className="inline-block bg-blue-700 hover:bg-blue-800 text-white px-6 py-3 rounded-lg font-bold transition"
            >
              Ir al Simulador
            </Link>
          </div>
        ) : (
          <>
            {/* Resumen Superior Protegido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white border border-slate-300 rounded-lg p-6 shadow-sm">
                <p className="text-slate-800 font-bold text-sm mb-2 uppercase tracking-wider">Total Operaciones</p>
                <p className="text-3xl font-extrabold text-slate-900">{creditos.length}</p>
              </div>
              <div className="bg-white border border-slate-300 rounded-lg p-6 shadow-sm">
                <p className="text-slate-800 font-bold text-sm mb-2 uppercase tracking-wider">Capital Financiado (Total)</p>
                <p className="text-3xl font-extrabold text-blue-700">
                  {formatearMoneda(creditos.reduce((sum, c) => sum + (c.montoFinanciado || 0), 0) || 0)}
                </p>
              </div>
              <div className="bg-white border border-slate-300 rounded-lg p-6 shadow-sm">
                <p className="text-slate-800 font-bold text-sm mb-2 uppercase tracking-wider">TCEA Promedio</p>
                <p className="text-3xl font-extrabold text-green-700">
                  {formatearPorcentaje(
                    creditos.length > 0 
                      ? (creditos.reduce((sum, c) => sum + (c.tcea || 0), 0) / creditos.length) 
                      : 0
                  )}
                </p>
              </div>
            </div>

            {/* Tabla Principal */}
            <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-200 border-b border-slate-300">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-extrabold text-slate-900">ID Operación</th>
                      <th className="px-6 py-4 text-left text-sm font-extrabold text-slate-900">ID Cliente</th>
                      <th className="px-6 py-4 text-right text-sm font-extrabold text-slate-900">Capital Financiado</th>
                      <th className="px-6 py-4 text-right text-sm font-extrabold text-slate-900">Cuota Base</th>
                      <th className="px-6 py-4 text-center text-sm font-extrabold text-slate-900">Estado</th>
                      <th className="px-6 py-4 text-center text-sm font-extrabold text-slate-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creditos.map((cred) => (
                      <tr key={cred.idCredito} className="border-t border-slate-300 hover:bg-slate-100 transition">
                        <td className="px-6 py-4 text-sm text-slate-900">CRD-{cred.idCredito.toString().padStart(5, '0')}</td>
                        <td className="px-6 py-4 text-sm text-slate-800">Cliente #{cred.idCliente}</td>
                        <td className="px-6 py-4 text-sm text-slate-900 text-right">
                          {formatearMoneda(cred.montoFinanciado || 0)}
                        </td>
                        <td className="px-6 py-4 text-sm font-bold text-blue-700 text-right">
                          {formatearMoneda(cred.cuotaMensualRegular || 0)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            cred.estado === 'GUARDADO' || cred.estado === 'ACTIVO' 
                              ? 'bg-green-200 text-green-900' 
                              : 'bg-slate-200 text-slate-900'
                          }`}>
                            {cred.estado}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => handleVerDetalle(cred)}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold transition text-sm shadow-sm"
                          >
                            <Eye size={16} />
                            Ver Cronograma
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Modal de Cronograma y Pagos */}
        {selectedCredito && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
              
              {/* Header del Modal */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
                <h3 className="text-xl font-extrabold">Gestión de Cronograma (CRD-{selectedCredito.idCredito.toString().padStart(5, '0')})</h3>
                <button onClick={() => setSelectedCredito(null)} className="text-white hover:text-red-400 text-2xl transition">✕</button>
              </div>

              <div className="p-6 overflow-y-auto grow">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-blue-900 text-xs font-extrabold uppercase tracking-wider mb-1">Monto Financiado</p>
                    <p className="text-xl font-black text-blue-700">{formatearMoneda(selectedCredito.montoFinanciado || 0)}</p>
                  </div>
                  <div>
                    <p className="text-blue-900 text-xs font-extrabold uppercase tracking-wider mb-1">Cuota Mensual</p>
                    <p className="text-xl font-black text-blue-700">{formatearMoneda(selectedCredito.cuotaMensualRegular || 0)}</p>
                  </div>
                  <div>
                    <p className="text-blue-900 text-xs font-extrabold uppercase tracking-wider mb-1">TCEA</p>
                    <p className="text-xl font-black text-blue-700">{formatearPorcentaje(selectedCredito.tcea)}</p>
                  </div>
                </div>

                <h4 className="font-extrabold text-slate-900 text-lg mb-4">Registro de Pagos</h4>

                {loadingCronograma ? (
                  <div className="text-center py-8 font-bold text-slate-800">Consultando cronograma en el servidor...</div>
                ) : cronograma.length === 0 ? (
                  <div className="text-center py-8 font-bold text-red-700">No se encontró el cronograma.</div>
                ) : (
                  <div className="border border-slate-300 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-200 border-b border-slate-300">
                        <tr>
                          <th className="px-4 py-3 text-left font-extrabold text-slate-900">N°</th>
                          <th className="px-4 py-3 text-left font-extrabold text-slate-900">Vencimiento</th>
                          <th className="px-4 py-3 text-right font-extrabold text-slate-900">Cuota</th>
                          <th className="px-4 py-3 text-right font-extrabold text-slate-900">Saldo Final</th>
                          <th className="px-4 py-3 text-center font-extrabold text-slate-900">Estado</th>
                          <th className="px-4 py-3 text-center font-extrabold text-slate-900">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-300  text-slate-950">
                        {cronograma.map((pago) => (
                          <tr key={pago.idCuota} className={`transition ${pago.estadoPago === 'pagado' ? 'bg-green-50' : 'hover:bg-slate-100'}`}>
                            <td className="px-4 py-3  text-slate-900">{pago.numeroCuota}</td>
                            <td className="px-4 py-3  text-slate-800">
                              {pago.fechaVencimiento ? new Date(pago.fechaVencimiento).toLocaleDateString('es-PE') : 'N/A'}
                            </td>
                            {/* PROTEGIDO: Agregado respaldo || 0 para evitar crash en toLocaleString */}
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {formatearMoneda(pago.cuotaTotal || 0)}
                            </td>
                            {/* PROTEGIDO: Agregado respaldo || 0 */}
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatearMoneda(pago.saldoFinal || 0)}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {pago.estadoPago === 'pagado' ? (
                                <span className="inline-flex items-center gap-1 text-green-700 font-extrabold text-xs uppercase tracking-wider">
                                  <CheckCircle size={14} /> Pagado
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-orange-600 font-extrabold text-xs uppercase tracking-wider">
                                  <Clock size={14} /> Pendiente
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {pago.estadoPago !== 'pagado' && (
                                <button
                                  onClick={() => handlePagarCuota(pago.idCuota)}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs uppercase tracking-wider transition shadow-sm"
                                >
                                  <CheckSquare size={14} /> Cobrar
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedLayout>
  )
}