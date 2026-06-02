'use client'

import { useState, useEffect } from 'react'
import { Gift, Award, TrendingUp, Sparkles, Settings2, CheckCircle2 } from 'lucide-react'

// --- Mock Data ---
const MOCK_KPIs = [
  { label: 'Clientes no Programa', value: '89', icon: Award, color: 'text-purple-400' },
  { label: 'Resgates este Mês', value: '14', icon: Gift, color: 'text-[#ffffff]' },
  { label: 'Serviços Grátis Pendentes', value: '7', icon: Sparkles, color: 'text-blue-400' },
  { label: 'Taxa de Retenção', value: '78%', icon: TrendingUp, color: 'text-green-400' },
]

const MOCK_LOYALTY = [
  { id: 1, name: 'Marcos T.', visits: 10, target: 10, status: 'Resgate Disponível!' },
  { id: 2, name: 'Rafael Andrade Mendes', visits: 8, target: 10, status: 'Em andamento' },
  { id: 3, name: 'Lucas Pinheiro', visits: 10, target: 10, status: 'Resgate Disponível!' },
  { id: 4, name: 'Fernando Silva', visits: 6, target: 10, status: 'Em andamento' },
  { id: 5, name: 'Carlos Eduardo Souza', visits: 4, target: 10, status: 'Em andamento' },
  { id: 6, name: 'Pedro Alves', visits: 2, target: 10, status: 'Em andamento' },
]

export default function LoyaltyPage() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [loyaltyList, setLoyaltyList] = useState<any[]>([])

  useEffect(() => {
    const isDemo = document.cookie.includes('demo-mode=true')
    setIsDemoMode(isDemo)
    if (isDemo) {
      setLoyaltyList(MOCK_LOYALTY)
    }
  }, [])

  const kpis = isDemoMode ? MOCK_KPIs : [
    { label: 'Clientes no Programa', value: '0', icon: Award, color: 'text-purple-400' },
    { label: 'Resgates este Mês', value: '0', icon: Gift, color: 'text-[#ffffff]' },
    { label: 'Serviços Grátis Pendentes', value: '0', icon: Sparkles, color: 'text-blue-400' },
    { label: 'Taxa de Retenção', value: '0%', icon: TrendingUp, color: 'text-green-400' },
  ]

  return (
    <div className="flex flex-col gap-8 p-6 min-h-full" style={{ background: '#030303' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white uppercase tracking-tight">
            Programa de <span className="text-[#ffffff]">Fidelidade</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(200,207,224,0.6)' }}>
            Incentive o retorno de seus clientes oferecendo recompensas.
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <div key={i} className="premium-card p-6 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                <kpi.icon size={20} className={kpi.color} />
              </div>
              <span className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{kpi.label}</span>
            </div>
            <div className="flex items-end justify-between mt-2">
              <span className="text-2xl font-[family-name:var(--font-display)] font-bold text-white">{kpi.value}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Main Content: Left (Ranking) & Right (Config) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Ranking Table */}
        <div className="lg:col-span-2 premium-card flex flex-col min-h-[400px]">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Top Clientes (Visitas)</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 w-12 text-center">#</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Cliente</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Progresso</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-center">Status</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {loyaltyList.map((client, idx) => {
                  const isReady = client.visits >= client.target;
                  const progressPct = Math.min(100, (client.visits / client.target) * 100);

                  return (
                    <tr key={client.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 text-center font-bold text-neutral-500">{idx + 1}</td>
                      <td className="p-4">
                        <span className="text-sm font-medium text-white">{client.name}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1 w-full max-w-[150px]">
                          <div className="flex justify-between text-[10px] uppercase font-bold text-neutral-400">
                            <span>{client.visits} Visitas</span>
                            <span>Meta: {client.target}</span>
                          </div>
                          <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isReady ? 'bg-[#ffffff]' : 'bg-blue-400'}`} 
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        {isReady ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-[#ffffff]/10 text-[#ffffff] border-[#ffffff]/20 animate-pulse">
                            <Sparkles size={10} /> Resgate Disp.
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border bg-white/5 text-neutral-400 border-white/10">
                            Em andamento
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right">
                        {isReady && (
                          <button className="btn-neon px-3 py-1.5 text-[10px]">
                            Registrar Resgate
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
                {loyaltyList.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-neutral-500 italic text-xs">
                      Nenhum cliente cadastrado no programa de fidelidade ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Config Panel */}
        <div className="premium-card p-6 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Settings2 className="text-[#ffffff]" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Configuração</h2>
          </div>
          
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Modelo de Recompensa
              </label>
              <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-white flex items-center gap-2">
                <CheckCircle2 size={16} className="text-green-400" /> Por número de visitas
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Visitas Necessárias
              </label>
              <input 
                type="number" 
                defaultValue={10}
                className="premium-input w-full"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                O cliente ganha a recompensa após atingir este número de visitas.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">
                Recompensa (O que ele ganha?)
              </label>
              <input 
                type="text" 
                defaultValue="1 Serviço Grátis (Corte ou Barba)"
                className="premium-input w-full"
              />
            </div>

            <button className="btn-neon w-full justify-center mt-4">
              Salvar Configurações
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
