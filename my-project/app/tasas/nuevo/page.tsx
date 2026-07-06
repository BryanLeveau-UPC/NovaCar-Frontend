'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

export default function NuevaTasaPage() {
  const router = useRouter()
  
  // 1. CORRECCIÓN: capitalizacion inicia en 'diario' en lugar de ''
  const [formData, setFormData] = useState({
    nombre: '',
    tipoTasa: 'efectiva',
    valor: '',
    periodo: 'anual',
    capitalizacion: 'diario', 
    moneda: 'pen'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('auth_token')
    
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ ...formData, valor: parseFloat(formData.valor) })
    })
    router.push('/tasas')
  }

  const inputClass = "w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-slate-950 placeholder:text-slate-400 bg-white"

  return (
    <ProtectedLayout title="Registrar Nueva Tasa">
      <div className="max-w-2xl mx-auto">
        <Link href="/tasas" className="flex items-center gap-2 text-slate-600 mb-6 hover:text-slate-900 transition">
          <ArrowLeft size={18}/> Volver al listado
        </Link>
        
        <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm">
             <h2 className="text-2xl font-bold text-slate-900 mb-6">Registrar Nueva Tasa de Interes</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Nombre y Tipo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre de la Tasa</label>
                <input className={inputClass} placeholder="Ej: TEA Preferencial" value={formData.nombre} onChange={e => setFormData({...formData, nombre: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo de Tasa</label>
                {/* 2. CORRECCIÓN: Agregado value={formData.tipoTasa} */}
                <select className={inputClass} value={formData.tipoTasa} onChange={e => setFormData({...formData, tipoTasa: e.target.value})}>
                  <option value="efectiva">Efectiva</option>
                  <option value="nominal">Nominal</option>
                </select>
              </div>
            </div>

            {/* Valor y Moneda */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Valor Decimal (ej: 0.18)</label>
                <input type="number" step="0.0001" className={inputClass} placeholder="0.18" value={formData.valor} onChange={e => setFormData({...formData, valor: e.target.value})} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Moneda</label>
                {/* 2. CORRECCIÓN: Agregado value={formData.moneda} */}
                <select className={inputClass} value={formData.moneda} onChange={e => setFormData({...formData, moneda: e.target.value})}>
                  <option value="pen">Soles (PEN)</option>
                  <option value="usd">Dólares (USD)</option>
                </select>
              </div>
            </div>

            {/* Periodicidad y Capitalización */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Periodicidad de Tasa</label>
                {/* 2. CORRECCIÓN: Agregado value={formData.periodo} */}
                <select className={inputClass} value={formData.periodo} onChange={e => setFormData({...formData, periodo: e.target.value})}>
                  <option value="anual">Anual</option>
                  <option value="semestral">Semestral</option>
                  <option value="trimestral">Trimestral</option>
                  <option value="mensual">Mensual</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="diario">Diario</option>
                </select>
              </div>
              
              {formData.tipoTasa === 'nominal' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Capitalización</label>
                  {/* 2. CORRECCIÓN: Agregado value={formData.capitalizacion} */}
                  <select className={inputClass} value={formData.capitalizacion} onChange={e => setFormData({...formData, capitalizacion: e.target.value})}>
                    <option value="diario">Diario</option>
                    <option value="quincenal">Quincenal</option>
                    <option value="mensual">Mensual</option>
                    <option value="bimestral">Bimestral</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
              )}
            </div>

            <button className="w-full bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition">
              Guardar Tasa de Interés
            </button>
          </form>
        </div>
        {/* Recuadro de Atención / Transparencia */}
        <div className="mt-8 bg-blue-50 border-l-4 border-blue-600 p-4 rounded-r-lg shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-800 font-bold">
                Nota de Transparencia Financiera
              </p>
              <p className="text-sm text-blue-800 mt-1 leading-relaxed">
                Las tasas registradas en este formulario son procesadas automáticamente para su conversión a <strong>TEA (Tasa Efectiva Anual)</strong>. 
                Este proceso garantiza la normalización de los cálculos financieros bajo el marco de transparencia del mercado peruano, 
                permitiendo una comparación homogénea entre diferentes productos crediticios.
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedLayout>
  )
}