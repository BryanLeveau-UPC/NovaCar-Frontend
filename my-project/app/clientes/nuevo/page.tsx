'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ProtectedLayout } from '@/components/protected-layout'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface Departamento {
  id: string;
  name: string;
}

interface Provincia {
  id: string;
  department_id: string;
  name: string;
}

interface Distrito {
  id: string;
  province_id: string;
  name: string;
}

export default function NuevoClientePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [departamentos, setDepartamentos] = useState<Departamento[]>([])
  const [provincias, setProvincias] = useState<Provincia[]>([])
  const [distritos, setDistritos] = useState<Distrito[]>([])

  // 1. Agregado el nuevo campo cliTipoMoneda (por defecto PEN)
  const [formData, setFormData] = useState({
    cliDni: '',
    cliNombres: '',
    cliApellidos: '',
    cliFecNac: '',
    cliDireccion: '',
    cliDepartamento: '',
    cliProvincia: '',
    cliDistrito: '',
    cliTelefono: '',
    cliCorreo: '',
    cliIngresos: '',
    cliTipoMoneda: 'PEN' 
  })

  useEffect(() => {
    const fetchUbigeo = async () => {
      try {
        const [resDept, resProv, resDist] = await Promise.all([
          fetch('/json/departamentos.json'),
          fetch('/json/provincias.json'),
          fetch('/json/distritos.json')
        ])
        
        setDepartamentos(await resDept.json())
        setProvincias(await resProv.json())
        setDistritos(await resDist.json())
      } catch (err) {
        console.error("No se pudieron cargar los archivos de Ubigeo", err)
      }
    }
    fetchUbigeo()
  }, [])

  const currentDept = departamentos.find(d => d.name.trim() === formData.cliDepartamento.trim())
  const filteredProvincias = provincias.filter(p => p.department_id === currentDept?.id)
  
  const currentProv = filteredProvincias.find(p => p.name.trim() === formData.cliProvincia.trim())
  const filteredDistritos = distritos.filter(d => d.province_id === currentProv?.id)

  const formatTelefono = (digits: string): string => {
    const partes = []
    if (digits.length > 0) partes.push(digits.slice(0, 3))
    if (digits.length > 3) partes.push(digits.slice(3, 6))
    if (digits.length > 6) partes.push(digits.slice(6, 9))
    return partes.join('-')
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === 'cliDni' && (!/^\d*$/.test(value) || value.length > 8)) return
    if (name === 'cliTelefono') {
      const soloDigitos = value.replace(/\D/g, '').slice(0, 9)
      setFormData(prev => ({ ...prev, cliTelefono: soloDigitos }))
      return
    }

    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target

    if (name === 'cliDepartamento') {
      setFormData(prev => ({ ...prev, cliDepartamento: value, cliProvincia: '', cliDistrito: '' }))
    } else if (name === 'cliProvincia') {
      setFormData(prev => ({ ...prev, cliProvincia: value, cliDistrito: '' }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const validateDNI = (dni: string): boolean => /^\d{8}$/.test(dni)
  const validateTelefono = (telefono: string): boolean => /^\d{9}$/.test(telefono)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!validateDNI(formData.cliDni)) {
      setError('El DNI debe tener exactamente 8 dígitos')
      return
    }

    if (!formData.cliNombres || !formData.cliApellidos || !formData.cliCorreo || !formData.cliTelefono) {
      setError('Los campos marcados con * son requeridos')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.cliCorreo)) {
      setError('Formato de correo electrónico inválido')
      return
    }

    if (!validateTelefono(formData.cliTelefono)) {
      setError('El celular debe tener exactamente 9 dígitos')
      return
    }

    const token = localStorage.getItem('auth_token')
    if (!token) {
      router.push('/')
      return
    }

    setLoading(true)

    try {
      const payload = {
        ...formData,
        cliDepartamento: formData.cliDepartamento.trim(),
        cliProvincia: formData.cliProvincia.trim(),
        cliDistrito: formData.cliDistrito.trim(),
        cliIngresos: parseFloat(formData.cliIngresos) || 0
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/clientes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.message || errorData?.mensaje || 'Error en el servidor al intentar crear el cliente')
      }

      router.push('/clientes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error de conexión al crear cliente')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-2 border border-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-slate-950 placeholder:text-slate-400 bg-white"

  return (
    <ProtectedLayout title="Registrar Nuevo Cliente">
      <div className="max-w-3xl mx-auto">
        <Link href="/clientes" className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 mb-6">
          <ArrowLeft size={18} />
          <span>Volver a Clientes</span>
        </Link>

        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Registrar Nuevo Cliente</h2>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Sección: Información Personal */}
            <div>
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Información Personal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cliDni" className="block text-sm font-medium text-slate-700 mb-2">DNI *</label>
                  <input id="cliDni" name="cliDni" type="text" inputMode="numeric" maxLength={8} value={formData.cliDni} onChange={handleChange} className={inputClass} placeholder="12345678" required />
                </div>
                <div>
                  <label htmlFor="cliFecNac" className="block text-sm font-medium text-slate-700 mb-2">Fecha de Nacimiento *</label>
                  <input id="cliFecNac" name="cliFecNac" type="date" value={formData.cliFecNac} onChange={handleChange} className={inputClass} required />
                </div>
                <div>
                  <label htmlFor="cliNombres" className="block text-sm font-medium text-slate-700 mb-2">Nombres *</label>
                  <input id="cliNombres" name="cliNombres" type="text" value={formData.cliNombres} onChange={handleChange} className={inputClass} placeholder="Juan" required />
                </div>
                <div>
                  <label htmlFor="cliApellidos" className="block text-sm font-medium text-slate-700 mb-2">Apellidos *</label>
                  <input id="cliApellidos" name="cliApellidos" type="text" value={formData.cliApellidos} onChange={handleChange} className={inputClass} placeholder="Pérez García" required />
                </div>
              </div>
            </div>

            {/* Sección: Ubicación y Finanzas */}
            <div>
              <h3 className="text-lg text-slate-900 mb-4 font-bold">Ubicación y Finanzas</h3>
              
              <div className="mb-4">
                <label htmlFor="cliDireccion" className="block text-sm font-medium text-slate-700 mb-2">Dirección</label>
                <textarea id="cliDireccion" name="cliDireccion" value={formData.cliDireccion} onChange={handleChange} className={inputClass} placeholder="Calle Principal 123" rows={2} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label htmlFor="cliDepartamento" className="block text-sm font-medium text-slate-700 mb-2">Departamento</label>
                  <select id="cliDepartamento" name="cliDepartamento" value={formData.cliDepartamento} onChange={handleSelectChange} className={inputClass}>
                    <option value="">-- Seleccionar --</option>
                    {departamentos.map(dep => (
                      <option key={dep.id} value={dep.name}>{dep.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cliProvincia" className="block text-sm font-medium text-slate-700 mb-2">Provincia</label>
                  <select id="cliProvincia" name="cliProvincia" value={formData.cliProvincia} onChange={handleSelectChange} className={inputClass} disabled={!formData.cliDepartamento}>
                    <option value="">-- Seleccionar --</option>
                    {filteredProvincias.map(prov => (
                      <option key={prov.id} value={prov.name}>{prov.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="cliDistrito" className="block text-sm font-medium text-slate-700 mb-2">Distrito</label>
                  <select id="cliDistrito" name="cliDistrito" value={formData.cliDistrito} onChange={handleSelectChange} className={inputClass} disabled={!formData.cliProvincia}>
                    <option value="">-- Seleccionar --</option>
                    {filteredDistritos.map(dist => (
                      <option key={dist.id} value={dist.name}>{dist.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 2. Actualizada la sección de ingresos con el selector de moneda */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cliIngresos" className="block text-sm font-medium text-slate-700 mb-2">Ingresos Mensuales *</label>
                  <input id="cliIngresos" name="cliIngresos" type="number" step="0.01" value={formData.cliIngresos} onChange={handleChange} className={inputClass} placeholder="0.00" required />
                </div>
                <div>
                  <label htmlFor="cliTipoMoneda" className="block text-sm font-medium text-slate-700 mb-2">Moneda de Ingresos *</label>
                  <select id="cliTipoMoneda" name="cliTipoMoneda" value={formData.cliTipoMoneda} onChange={handleSelectChange} className={inputClass} required>
                    <option value="PEN">Soles (PEN)</option>
                    <option value="USD">Dólares (USD)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Sección: Contacto */}
            <div>
              <h3 className="text-lg text-slate-900 mb-4 font-bold">Información de Contacto</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="cliTelefono" className="block text-sm font-medium text-slate-700 mb-2">Celular *</label>
                  <input id="cliTelefono" name="cliTelefono" type="tel" inputMode="numeric" maxLength={11} value={formatTelefono(formData.cliTelefono)} onChange={handleChange} className={inputClass} placeholder="999-999-999" required />
                </div>
                <div>
                  <label htmlFor="cliCorreo" className="block text-sm font-medium text-slate-700 mb-2">Correo Electrónico *</label>
                  <input id="cliCorreo" name="cliCorreo" type="email" value={formData.cliCorreo} onChange={handleChange} className={inputClass} placeholder="juan@ejemplo.com" required />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-6 border-t border-slate-200">
              <Link href="/clientes" className="flex-1 px-6 py-3 border border-slate-300 text-slate-700 rounded-lg font-medium hover:bg-slate-50 transition text-center flex items-center justify-center">
                Cancelar
              </Link>
              <button type="submit" disabled={loading} className="flex-1 px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition disabled:opacity-50">
                {loading ? 'Guardando...' : 'Guardar Cliente'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </ProtectedLayout>
  )
}