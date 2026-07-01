'use client'

import { ProtectedLayout } from '@/components/protected-layout'
import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Percent } from 'lucide-react'

interface Tasa {
  idTasa: number
  nombre: string
  tipoTasa: string
  capitalizacion: string
  comisiones: number
  tasaAnual: number
  moneda: string
}

export default function TasasPage() {
  const [tasas, setTasas] = useState<Tasa[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<Omit<Tasa, 'idTasa'>>({
    nombre: '',
    tipoTasa: 'TEA',
    capitalizacion: 'Mensual',
    comisiones: 0,
    tasaAnual: 0,
    moneda: 'PEN'
  })

  // Cargar tasas al iniciar
  useEffect(() => {
    fetchTasas()
  }, [])

  const fetchTasas = async () => {
    const token = localStorage.getItem('auth_token')
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasas`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    if (response.ok) {
      const data = await response.json()
      setTasas(data)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('auth_token')
    
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tasas`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` 
      },
      body: JSON.stringify(formData)
    })
    
    fetchTasas() // Refrescar lista
  }

  return (
    <ProtectedLayout title="Gestión de Tasas">
      <div className="space-y-8">
        
        {/* Formulario de Registro */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Percent className="w-5 h-5 text-blue-600" /> Registrar Nueva Tasa
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Nombre de la tasa" className="p-2 border rounded" onChange={e => setFormData({...formData, nombre: e.target.value})} required />
            <select className="p-2 border rounded" onChange={e => setFormData({...formData, tipoTasa: e.target.value})}>
              <option value="TEA">TEA</option>
              <option value="TNA">TNA</option>
            </select>
            <input type="number" step="0.01" placeholder="Tasa Anual (%)" className="p-2 border rounded" onChange={e => setFormData({...formData, tasaAnual: parseFloat(e.target.value)})} />
            <button className="bg-blue-600 text-white py-2 rounded hover:bg-blue-700">Guardar Tasa</button>
          </form>
        </div>

        {/* Tabla de Tasas */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left">Nombre</th>
                <th className="px-6 py-3 text-left">Tipo</th>
                <th className="px-6 py-3 text-left">Tasa Anual</th>
                <th className="px-6 py-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tasas.map((tasa) => (
                <tr key={tasa.idTasa}>
                  <td className="px-6 py-4">{tasa.nombre}</td>
                  <td className="px-6 py-4">{tasa.tipoTasa}</td>
                  <td className="px-6 py-4">{tasa.tasaAnual}%</td>
                  <td className="px-6 py-4 flex gap-2">
                    <button className="text-blue-600"><Edit2 size={18}/></button>
                    <button className="text-red-600"><Trash2 size={18}/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </ProtectedLayout>
  )
}