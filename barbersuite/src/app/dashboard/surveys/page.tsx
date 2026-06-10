'use client'

import { ClipboardCheck, BarChart3, Target, Settings2, Star } from 'lucide-react'

// --- Mock Data ---
const KPIs = [
  { label: 'Pesquisas Enviadas', value: '143', icon: ClipboardCheck, color: 'text-blue-400' },
  { label: 'Taxa de Resposta', value: '63%', icon: Target, color: 'text-purple-400' },
  { label: 'Média de Avaliação', value: '4.7 / 5', icon: Star, color: 'text-[#ffffff]' },
]

const RESPONSES = [
  { id: 1, client: 'Marcos T.', barber: 'Hygor Miguel', date: 'Hoje, 10:30', score: 10, comment: 'Corte sensacional! Atendimento de primeira.' },
  { id: 2, client: 'Rafael Andrade', barber: 'Rhafael Barber', date: 'Ontem', score: 9, comment: 'Muito bom, mas achei que atrasou 5 minutos.' },
  { id: 3, client: 'Lucas Pinheiro', barber: 'Hygor Miguel', date: '18/05/2026', score: 6, comment: 'O corte foi ok, mas não gostei do produto finalizador usado.' },
  { id: 4, client: 'Pedro Alves', barber: 'Rhafael Barber', date: '17/05/2026', score: 10, comment: 'Melhor barbeiro da cidade.' },
  { id: 5, client: 'Fernando Silva', barber: 'Rafael Nunes', date: '15/05/2026', score: 8, comment: '' },
]

const getScoreColor = (score: number) => {
  if (score >= 9) return 'text-green-400 bg-green-400/10 border-green-400/20'
  if (score >= 7) return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
  return 'text-red-400 bg-red-400/10 border-red-400/20'
}

export default function SurveysPage() {
  return (
    <div className="flex flex-col gap-8 p-6 min-h-full" style={{ background: '#030303' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white uppercase tracking-tight">
            Pesquisa de <span className="text-[#ffffff]">Satisfação</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(200,207,224,0.6)' }}>
            Acompanhe o seu NPS (Net Promoter Score) e avaliações de clientes.
          </p>
        </div>
      </div>

      {/* NPS Score Card */}
      <div className="premium-card p-8 flex flex-col md:flex-row items-center gap-8 border-l-4" style={{ borderLeftColor: '#ffffff' }}>
        <div className="flex flex-col items-center justify-center w-40 flex-shrink-0">
          <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-400 mb-2">Score NPS</p>
          <div className="w-32 h-32 rounded-full border-[8px] border-[#ffffff]/20 flex items-center justify-center relative">
            <span className="font-[family-name:var(--font-display)] text-5xl text-white">72</span>
            {/* Pseudo-progress border (CSS only representation) */}
            <svg className="absolute inset-0 w-full h-full -rotate-90">
              <circle cx="50%" cy="50%" r="46%" fill="none" stroke="#ffffff" strokeWidth="8" strokeDasharray="300" strokeDashoffset="80" />
            </svg>
          </div>
          <span className="mt-3 text-xs font-bold text-[#ffffff] uppercase">Zona de Excelência</span>
        </div>

        <div className="flex-1 w-full space-y-6">
          <div>
            <h3 className="text-white font-bold mb-4">Composição da Nota</h3>
            <div className="flex flex-col gap-3">
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-green-400 font-bold uppercase tracking-wider">Promotores (Notas 9-10)</span>
                  <span className="text-white">68%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-green-400 w-[68%]" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-yellow-400 font-bold uppercase tracking-wider">Neutros (Notas 7-8)</span>
                  <span className="text-white">20%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-yellow-400 w-[20%]" /></div>
              </div>
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-red-400 font-bold uppercase tracking-wider">Detratores (Notas 0-6)</span>
                  <span className="text-white">12%</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-red-400 w-[12%]" /></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {KPIs.map((kpi, i) => (
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
        
        {/* Left: Responses Table */}
        <div className="lg:col-span-2 premium-card flex flex-col">
          <div className="p-6 border-b border-white/5">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Últimas Avaliações</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Cliente</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Data</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-center">Nota</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Comentário</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {RESPONSES.map((res) => (
                  <tr key={res.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <p className="font-bold text-white">{res.client}</p>
                      <p className="text-[10px] text-neutral-500 uppercase">Atendido por {res.barber}</p>
                    </td>
                    <td className="p-4 text-sm text-neutral-400">{res.date}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-3 py-1.5 rounded-lg border text-lg font-bold ${getScoreColor(res.score)}`}>
                        {res.score}
                      </span>
                    </td>
                    <td className="p-4">
                      {res.comment ? (
                        <p className="text-sm italic" style={{ color: 'rgba(200,207,224,0.8)' }}>"{res.comment}"</p>
                      ) : (
                        <span className="text-xs text-neutral-600 italic">Sem comentário</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Config */}
        <div className="premium-card p-6 flex flex-col gap-5 h-fit">
          <div className="flex items-center gap-3 border-b border-white/5 pb-4">
            <Settings2 className="text-[#ffffff]" />
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Configuração de Envio</h2>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer mb-4">
              <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#ffffff]" defaultChecked />
              <span className="text-sm font-bold text-white">Ativar envio automático NPS</span>
            </label>

            <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Enviar quanto tempo após o corte?</label>
            <select className="premium-input w-full appearance-none">
              <option>2 Horas Depois</option>
              <option>Imediatamente</option>
              <option>24 Horas Depois</option>
            </select>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-xl relative mt-2">
            <div className="absolute top-2 right-3 text-[10px] text-neutral-500 font-mono">SMS</div>
            <p className="text-xs text-neutral-300 font-mono leading-relaxed mt-2">
              "Olá <span className="text-[#ffffff]">{'<nome>'}</span>! Como foi sua experiência na <span className="text-white">{'<estabelecimento>'}</span> hoje? Responda esta msg com uma nota de 0 a 10."
            </p>
          </div>

          <button className="btn-neon w-full justify-center mt-2">
            Salvar Configuração
          </button>
        </div>

      </div>
    </div>
  )
}
