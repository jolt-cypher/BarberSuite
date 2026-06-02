'use client'

import { useState, useEffect } from 'react'
import { Users, Clock, Zap, Check, X, Plus } from 'lucide-react'

// --- Mock Data ---
const MOCK_KPIs = [
  { label: 'Na Fila Agora', value: '3', icon: Users, color: 'text-blue-400' },
  { label: 'Tempo Médio de Espera', value: '24 min', icon: Clock, color: 'text-[#ffffff]' },
  { label: 'Convertidos Hoje', value: '8', icon: Zap, color: 'text-green-400' },
]

type WaitlistEntry = { id: string; position: number; name: string; phone: string; service: string; barber: string; timeIn: string; waitTime: string }

const MOCK_WAITLIST: WaitlistEntry[] = [
  { id: 'w1', position: 1, name: 'Marcos T.', phone: '(62) 99876-5432', service: 'Corte Degradê', barber: 'Qualquer um', timeIn: '14:05', waitTime: '45 min' },
  { id: 'w2', position: 2, name: 'João Silva', phone: '(62) 98765-4321', service: 'Corte + Barba', barber: 'José Shaper', timeIn: '14:20', waitTime: '30 min' },
  { id: 'w3', position: 3, name: 'Lucas Pinheiro', phone: '(62) 99123-4567', service: 'Pézinho', barber: 'Carlos Barber', timeIn: '14:40', waitTime: '10 min' },
]

const MOCK_HISTORY = [
  { id: 'h1', name: 'Rafael Andrade', service: 'Corte Clássico', timeIn: '13:00', timeOut: '13:30', waitTime: '30 min', status: 'Atendido' },
  { id: 'h2', name: 'Pedro Alves', service: 'Barba Terapia', timeIn: '12:45', timeOut: '13:05', waitTime: '20 min', status: 'Atendido' },
  { id: 'h3', name: 'Diego Ferreira', service: 'Corte Degradê', timeIn: '11:00', timeOut: '11:45', waitTime: '45 min', status: 'Desistiu' },
]

export default function WaitlistPage() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [waitlist, setWaitlist] = useState<WaitlistEntry[]>([])
  const [history, setHistory] = useState<any[]>([])

  useEffect(() => {
    const isDemo = document.cookie.includes('demo-mode=true')
    setIsDemoMode(isDemo)
    if (isDemo) {
      setWaitlist(MOCK_WAITLIST)
      setHistory(MOCK_HISTORY)
    }
  }, [])

  const handleRemove = (id: string) => {
    setWaitlist(waitlist.filter(w => w.id !== id).map((w, idx) => ({ ...w, position: idx + 1 })))
  }

  const kpis = isDemoMode ? MOCK_KPIs : [
    { label: 'Na Fila Agora', value: String(waitlist.length), icon: Users, color: 'text-blue-400' },
    { label: 'Tempo Médio de Espera', value: '0 min', icon: Clock, color: 'text-[#ffffff]' },
    { label: 'Convertidos Hoje', value: '0', icon: Zap, color: 'text-green-400' },
  ]

  return (
    <div className="flex flex-col gap-8 p-6 min-h-full" style={{ background: '#030303' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white uppercase tracking-tight">
            Lista de <span className="text-[#ffffff]">Espera</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(200,207,224,0.6)' }}>
            Fila virtual para clientes sem agendamento prévio.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="premium-card p-6 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <kpi.icon size={20} className={kpi.color} />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{kpi.label}</span>
            </div>
            <div className="flex items-end justify-between mt-2">
              <span className="text-3xl font-[family-name:var(--font-display)] font-bold text-white">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Live Queue */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Fila Atual</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            {waitlist.map(entry => (
              <div key={entry.id} className="premium-card p-0 flex overflow-hidden border-l-4" style={{ borderLeftColor: entry.position === 1 ? '#ffffff' : 'rgba(255,255,255,0.2)' }}>
                {/* Position Number */}
                <div className="w-20 bg-white/5 flex flex-col items-center justify-center border-r border-white/5">
                  <span className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest mb-1">Posição</span>
                  <span className="font-[family-name:var(--font-display)] text-4xl font-bold" style={{ color: entry.position === 1 ? '#ffffff' : '#fff' }}>
                    {entry.position}
                  </span>
                </div>
                
                {/* Details */}
                <div className="flex-1 p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white">{entry.name}</h3>
                    <p className="text-xs text-neutral-400 mt-0.5">{entry.phone}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-xs font-semibold px-2 py-1 rounded bg-white/10 text-white">{entry.service}</span>
                      <span className="text-xs text-[#ffffff] font-semibold">{entry.barber}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end gap-3">
                    <div className="text-right">
                      <p className="text-[10px] text-neutral-500 uppercase font-bold tracking-widest">Espera Aut.</p>
                      <p className="text-sm font-bold text-red-400 animate-pulse">{entry.waitTime}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRemove(entry.id)} className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center hover:bg-red-500/20 transition-colors">
                        <X size={16} />
                      </button>
                      <button onClick={() => handleRemove(entry.id)} className="px-4 h-8 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1 hover:bg-green-500/20 transition-colors">
                        <Check size={14} /> Chamar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {waitlist.length === 0 && (
              <div className="premium-card p-12 flex flex-col items-center text-center border-dashed">
                <Users size={32} className="text-neutral-600 mb-4" />
                <p className="text-white font-medium">Fila vazia</p>
                <p className="text-sm text-neutral-500">Nenhum cliente aguardando no momento.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right: Add to Queue */}
        <div className="premium-card p-6 flex flex-col gap-5 h-fit">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Adicionar à Fila</h2>
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Cliente</label>
            <input type="text" placeholder="Nome do cliente" className="premium-input w-full" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Telefone</label>
            <input type="text" placeholder="(DD) 9XXXX-XXXX" className="premium-input w-full" />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Serviço Desejado</label>
            <select className="premium-input w-full appearance-none">
              <option>Corte Degradê</option>
              <option>Barba Terapia</option>
              <option>Corte + Barba</option>
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Preferência de Barbeiro</label>
            <select className="premium-input w-full appearance-none">
              <option>Qualquer um (Mais rápido)</option>
              <option>José Shaper</option>
              <option>Carlos Barber</option>
            </select>
          </div>

          <button className="btn-neon w-full justify-center mt-2">
            <Plus size={16} /> Colocar na Fila
          </button>
        </div>
      </div>

      {/* History */}
      <div className="premium-card flex flex-col mt-2">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-white uppercase tracking-wider">Histórico de Hoje</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Cliente</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Serviço</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-center">Entrada</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-center">Saída</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-center">Espera</th>
                <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {history.map((hist) => (
                <tr key={hist.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="p-4 font-medium text-white">{hist.name}</td>
                  <td className="p-4 text-sm" style={{ color: 'rgba(200,207,224,0.6)' }}>{hist.service}</td>
                  <td className="p-4 text-sm text-center text-neutral-400">{hist.timeIn}</td>
                  <td className="p-4 text-sm text-center text-neutral-400">{hist.timeOut}</td>
                  <td className="p-4 text-sm text-center font-bold text-white">{hist.waitTime}</td>
                  <td className="p-4 text-right">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${hist.status === 'Atendido' ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {hist.status}
                    </span>
                  </td>
                </tr>
              ))}
              {history.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-neutral-500 italic text-xs">
                    Nenhum registro no histórico hoje.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
