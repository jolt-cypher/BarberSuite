'use client'

import { Bell, ShieldCheck, CalendarClock, Settings2, Smartphone, Send, Check } from 'lucide-react'

// --- Mock Data ---
const KPIs = [
  { label: 'Enviados Hoje', value: '24', icon: Bell, color: 'text-blue-400' },
  { label: 'Taxa de Confirmação', value: '89%', icon: ShieldCheck, color: 'text-[#ffffff]' },
  { label: 'Faltas Evitadas', value: '3', icon: CalendarClock, color: 'text-green-400' },
]

const REMINDERS = [
  { id: 1, time: '14:30', client: 'Marcos T.', barber: 'Hygor Miguel', service: 'Corte Degradê', status: 'Confirmado' },
  { id: 2, time: '15:00', client: 'Lucas Pinheiro', barber: 'Rhafael Barber', service: 'Corte Clássico', status: 'Enviado' },
  { id: 3, time: '15:15', client: 'Fernando Silva', barber: 'Hygor Miguel', service: 'Corte + Barba', status: 'Enviado' },
  { id: 4, time: '16:00', client: 'Carlos Eduardo', barber: 'Rafael Nunes', service: 'Barba Terapia', status: 'Falha' },
  { id: 5, time: '16:30', client: 'Pedro Alves', barber: 'Rhafael Barber', service: 'Corte Degradê', status: 'Agendado' },
]

const getStatusColor = (status: string) => {
  switch(status) {
    case 'Confirmado': return 'bg-green-500/10 text-green-400 border-green-500/20'
    case 'Enviado': return 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    case 'Agendado': return 'bg-white/5 text-neutral-400 border-white/10'
    case 'Falha': return 'bg-red-500/10 text-red-400 border-red-500/20'
    default: return 'bg-white/5 text-white border-white/10'
  }
}

export default function RemindersPage() {
  return (
    <div className="flex flex-col gap-8 p-6 min-h-full" style={{ background: '#030303' }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-3xl font-bold text-white uppercase tracking-tight">
            Lembretes de <span className="text-[#ffffff]">Horários</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(200,207,224,0.6)' }}>
            Reduza faltas e atrasos com envios automáticos via SMS.
          </p>
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
        
        {/* Left: Schedule Table */}
        <div className="lg:col-span-2 premium-card flex flex-col">
          <div className="p-6 border-b border-white/5 flex justify-between items-center">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">Lembretes de Hoje</h2>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500 flex items-center justify-center shadow-[0_0_8px_rgba(34,197,94,0.4)]">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              </span>
              <span className="text-[10px] text-green-400 uppercase font-bold tracking-widest">Ativo</span>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-center">Horário</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Cliente</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Serviço/Barbeiro</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-center">Status</th>
                  <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {REMINDERS.map((rem) => (
                  <tr key={rem.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 text-center font-bold text-white">{rem.time}</td>
                    <td className="p-4 font-medium text-white">{rem.client}</td>
                    <td className="p-4">
                      <p className="text-sm text-white">{rem.service}</p>
                      <p className="text-[10px] text-[#ffffff] uppercase">{rem.barber}</p>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(rem.status)}`}>
                        {rem.status === 'Confirmado' && <Check size={10} />}
                        {rem.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {rem.status === 'Falha' ? (
                        <button className="text-[10px] font-bold text-neutral-400 hover:text-white px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 transition-colors uppercase flex items-center gap-1 ml-auto">
                          <Send size={12} /> Reenviar
                        </button>
                      ) : (
                        <button className="text-neutral-500 hover:text-white transition-colors">
                          <Settings2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Config & Preview */}
        <div className="flex flex-col gap-6">
          
          <div className="premium-card p-6 flex flex-col gap-5">
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <Settings2 className="text-[#ffffff]" />
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Configuração Automática</h2>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-4">
                <input type="checkbox" className="w-4 h-4 rounded border-white/20 bg-white/5 accent-[#ffffff]" defaultChecked />
                <span className="text-sm font-bold text-white">Ativar Envio Automático</span>
              </label>

              <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Enviar antecedência de</label>
              <div className="flex items-center gap-2">
                <input type="number" defaultValue={24} className="premium-input w-20 text-center" />
                <span className="text-white font-bold">Horas</span>
              </div>
            </div>

            <button className="btn-neon w-full justify-center mt-2">
              Salvar Configuração
            </button>
          </div>

          <div className="premium-card p-6 flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mb-4 flex items-center gap-1">
              <Smartphone size={12} /> Simulação de SMS
            </span>
            <div className="w-full aspect-[9/19] rounded-[2rem] border-[6px] border-neutral-900 bg-[#030303] relative overflow-hidden flex flex-col shadow-xl max-w-[200px]">
              <div className="absolute top-0 inset-x-0 h-3 bg-neutral-900 rounded-b-xl mx-auto w-1/2" />
              
              <div className="pt-6 pb-2 px-4 flex items-center justify-center border-b border-white/5 bg-white/[0.02]">
                <span className="text-[9px] font-bold text-white">BarberSuite</span>
              </div>
              
              <div className="flex-1 p-3 flex flex-col justify-end bg-neutral-950">
                <div className="bg-[#25D366] p-2.5 rounded-2xl rounded-br-sm text-[10px] text-white self-end max-w-[95%] leading-relaxed shadow-lg">
                  Olá Marcos! Lembrete: você tem um agendamento na BarberSuite amanhã às 14:30 com Hygor Miguel. Responda SIM p/ confirmar ou NAO p/ cancelar.
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  )
}
