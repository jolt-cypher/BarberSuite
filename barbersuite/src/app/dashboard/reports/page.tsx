'use client'

import { useState } from 'react'
import { BarChart3, TrendingUp, Calendar, Download, DollarSign, Award, Users, ArrowUpRight, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { useRealtimeReports } from '@/hooks/useRealtimeReports'

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('30d')
  const [isExporting, setIsExporting] = useState(false)

  const { appointments, barbers, services, reviews, loading, error, barbershopId } = useRealtimeReports()

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-neutral-500 gap-3">
        <Loader2 className="animate-spin text-[#ffffff]" size={28} />
        <span className="text-xs font-semibold uppercase tracking-wider">Carregando relatórios...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-red-500 gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider">Erro ao carregar dados. Tente novamente mais tarde.</span>
      </div>
    )
  }

  if (!barbershopId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-neutral-500 gap-3">
        <span className="text-xs font-semibold uppercase tracking-wider">Barbearia não encontrada. Configure seu perfil.</span>
      </div>
    )
  }

  const handleExport = () => {
    setIsExporting(true)
    setTimeout(() => setIsExporting(false), 1500)
  }

  // Dynamic database calculation
  const now = new Date()
  let startDate = new Date()
  if (timeRange === '7d') {
    startDate.setDate(now.getDate() - 7)
  } else if (timeRange === '30d') {
    startDate.setDate(now.getDate() - 30)
  } else if (timeRange === '90d') {
    startDate.setDate(now.getDate() - 90)
  } else if (timeRange === 'year') {
    startDate = new Date(now.getFullYear(), 0, 1)
  }

  const periodDuration = now.getTime() - startDate.getTime()
  const prevPeriodStartDate = new Date(startDate.getTime() - periodDuration)

  // Filter appointments
  const currentAppts = appointments.filter(apt => {
    const scheduled = new Date(apt.scheduled_at)
    return scheduled >= startDate && scheduled <= now
  })

  const prevAppts = appointments.filter(apt => {
    const scheduled = new Date(apt.scheduled_at)
    return scheduled >= prevPeriodStartDate && scheduled < startDate
  })

  // KPI 1: Faturamento Bruto
  const currentRevenue = currentAppts
    .filter(apt => apt.status === 'completed' || apt.payment_status === 'paid')
    .reduce((sum, apt) => sum + (Number(apt.price) || 0), 0)

  const prevRevenue = prevAppts
    .filter(apt => apt.status === 'completed' || apt.payment_status === 'paid')
    .reduce((sum, apt) => sum + (Number(apt.price) || 0), 0)

  const faturamentoBrutoValue = formatCurrency(currentRevenue)
  let faturamentoSub = 'Sem dados anteriores'
  if (prevRevenue > 0) {
    const diffPct = ((currentRevenue - prevRevenue) / prevRevenue) * 100
    faturamentoSub = `${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}% vs período anterior`
  } else if (currentRevenue > 0) {
    faturamentoSub = '+100% vs período anterior'
  }

  // KPI 2: Total de Atendimentos
  const currentCount = currentAppts.filter(apt => apt.status === 'completed').length
  const prevCount = prevAppts.filter(apt => apt.status === 'completed').length
  const totalAtendimentosValue = String(currentCount)
  const daysDiff = Math.max(1, Math.round(periodDuration / (24 * 60 * 60 * 1000)))
  const totalAtendimentosSub = `Média de ${(currentCount / daysDiff).toFixed(1)}/dia`

  // KPI 3: Ticket Médio Geral
  const currentTicket = currentCount > 0 ? currentRevenue / currentCount : 0
  const prevTicket = prevCount > 0 ? prevRevenue / prevCount : 0
  const ticketMedioValue = formatCurrency(currentTicket)
  let ticketMedioSub = 'Sem dados anteriores'
  if (prevTicket > 0) {
    const diffPct = ((currentTicket - prevTicket) / prevTicket) * 100
    ticketMedioSub = `${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}% vs período anterior`
  }

  // KPI 4: Novos Clientes
  const currentClients = new Set(currentAppts.map(apt => apt.client_name.trim().toLowerCase())).size
  const prevClients = new Set(prevAppts.map(apt => apt.client_name.trim().toLowerCase())).size
  const novosClientesValue = String(currentClients)
  let novosClientesSub = 'Novos clientes'
  if (prevClients > 0) {
    const diffPct = ((currentClients - prevClients) / prevClients) * 100
    novosClientesSub = `${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}% vs período anterior`
  }

  // Chart Data: last 6 calendar months
  const monthNames = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
  const chartMonths: { label: string; year: number; monthIndex: number; value: number }[] = []

  for (let i = 5; i >= 0; i--) {
    const d = new Date()
    d.setMonth(now.getMonth() - i)
    chartMonths.push({
      label: monthNames[d.getMonth()],
      year: d.getFullYear(),
      monthIndex: d.getMonth(),
      value: 0
    })
  }

  appointments
    .filter(apt => apt.status === 'completed' || apt.payment_status === 'paid')
    .forEach(apt => {
      const aptDate = new Date(apt.scheduled_at)
      const aptMonth = aptDate.getMonth()
      const aptYear = aptDate.getFullYear()
      const match = chartMonths.find(m => m.monthIndex === aptMonth && m.year === aptYear)
      if (match) {
        match.value += Number(apt.price) || 0
      }
    })

  const chartData = chartMonths.map(m => ({
    label: m.label,
    value: m.value
  }))

  // Top Services breakdown
  const serviceStatsMap = new Map<string, { name: string; count: number; revenue: number }>()
  currentAppts
    .filter(apt => apt.status === 'completed')
    .forEach(apt => {
      const sId = apt.service_id
      if (!sId) return
      const serviceObj = services.find(s => s.id === sId)
      const serviceName = serviceObj ? serviceObj.name : 'Serviço Excluído'
      const currentStat = serviceStatsMap.get(sId) || { name: serviceName, count: 0, revenue: 0 }
      currentStat.count += 1
      currentStat.revenue += Number(apt.price) || 0
      serviceStatsMap.set(sId, currentStat)
    })

  const topServicesList = Array.from(serviceStatsMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 4)

  const totalTopServicesCount = topServicesList.reduce((acc, s) => acc + s.count, 0) || 1
  const topServices = topServicesList.map(s => ({
    name: s.name,
    count: s.count,
    revenue: s.revenue,
    percentage: Math.round((s.count / totalTopServicesCount) * 100)
  }))

  // Team performance leaderboard
  const barberStatsMap = new Map<string, { name: string; appointments: number; revenue: number; ratingSum: number; ratingCount: number }>()
  barbers.forEach(b => {
    barberStatsMap.set(b.id, {
      name: b.name,
      appointments: 0,
      revenue: 0,
      ratingSum: 0,
      ratingCount: 0
    })
  })

  currentAppts
    .filter(apt => apt.status === 'completed')
    .forEach(apt => {
      const bId = apt.barber_id
      if (!bId) return
      const stat = barberStatsMap.get(bId)
      if (stat) {
        stat.appointments += 1
        stat.revenue += Number(apt.price) || 0
      }
    })

  reviews.forEach(r => {
    const bId = r.barber_id
    if (!bId) return
    const stat = barberStatsMap.get(bId)
    if (stat) {
      stat.ratingSum += Number(r.rating) || 5
      stat.ratingCount += 1
    }
  })

  const teamPerformance = Array.from(barberStatsMap.values())
    .map(stat => {
      const avgRating = stat.ratingCount > 0 ? stat.ratingSum / stat.ratingCount : 5.0
      return {
        name: stat.name,
        appointments: stat.appointments,
        revenue: stat.revenue,
        rating: Number(avgRating.toFixed(1))
      }
    })
    .sort((a, b) => b.revenue - a.revenue)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl uppercase tracking-tight text-white">
            Relatórios & Estatísticas
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Acompanhe a saúde financeira e o desempenho da sua barbearia.</p>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3">
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="premium-input text-xs py-2 px-3 w-full md:w-40 appearance-none cursor-pointer"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 3 meses</option>
            <option value="year">Este Ano</option>
          </select>
          <button 
            onClick={handleExport} 
            disabled={isExporting}
            className="btn-neon py-2 text-xs whitespace-nowrap"
          >
            <Download size={14} /> {isExporting ? 'Exportando...' : 'Exportar Relatório'}
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Faturamento Bruto', value: faturamentoBrutoValue, icon: DollarSign, color: '#22c55e', sub: faturamentoSub },
          { label: 'Total de Atendimentos', value: totalAtendimentosValue, icon: Calendar, color: '#3b82f6', sub: totalAtendimentosSub },
          { label: 'Ticket Médio Geral', value: ticketMedioValue, icon: TrendingUp, color: '#ffffff', sub: ticketMedioSub },
          { label: 'Novos Clientes', value: novosClientesValue, icon: Users, color: '#8b5cf6', sub: novosClientesSub },
        ].map((kpi, i) => (
          <div key={i} className="premium-card p-5">
            <div className="flex items-start justify-between mb-3">
              <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">{kpi.label}</p>
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${kpi.color}15` }}
              >
                <kpi.icon size={18} style={{ color: kpi.color }} />
              </div>
            </div>
            <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">{kpi.value}</p>
            <p className="text-[10px] text-neutral-600 mt-1">{kpi.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 mb-8">
        {/* Monthly Revenue Comparison */}
        <div className="premium-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[family-name:var(--font-display)] uppercase tracking-wide text-white text-sm font-bold flex items-center gap-2">
              <BarChart3 size={16} className="text-[#ffffff]" /> Evolução Mensal
            </h3>
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">
              {timeRange === 'year' ? 'Evolução por Ano' : 'Últimos Meses'}
            </span>
          </div>

          <div className="flex items-end gap-3 h-48 pt-4">
            {chartData.map((month, i) => {
              const maxValue = Math.max(...chartData.map(d => d.value), 1)
              const percentageHeight = month.value > 0 ? (month.value / maxValue) * 100 : 0
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[9px] text-neutral-500 group-hover:text-[#ffffff] transition-colors">
                    {month.value > 0 ? formatCurrency(month.value).replace('R$\u00a0', 'R$') : '-'}
                  </span>
                  <div className="w-full relative rounded-t-lg overflow-hidden bg-neutral-900" style={{ height: '140px' }}>
                    <div 
                      className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-700 group-hover:opacity-100"
                      style={{ 
                        height: `${percentageHeight}%`,
                        background: month.value > 0 ? 'linear-gradient(to top, #ffffff, #ccffea80)' : '#1a1a1a',
                        opacity: month.value > 0 ? 0.8 : 0.3
                      }}
                    />
                  </div>
                  <span className="text-[9px] text-neutral-600 uppercase">{month.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Top Services Breakdown */}
        <div className="premium-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[family-name:var(--font-display)] uppercase tracking-wide text-white text-sm font-bold flex items-center gap-2">
              <Award size={16} className="text-[#ffffff]" /> Serviços Mais Procurados
            </h3>
          </div>

          <div className="space-y-4">
            {topServices.length > 0 ? (
              topServices.map((service, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-white">{service.name}</span>
                    <span className="text-neutral-400">{service.count}x ({formatCurrency(service.revenue)})</span>
                  </div>
                  <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-[#ffffff] to-[#ccffea]" 
                      style={{ width: `${service.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center text-neutral-500 text-xs">
                Nenhum serviço realizado no período.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Team Performance Table */}
      <div className="premium-card p-6">
        <h3 className="font-[family-name:var(--font-display)] uppercase tracking-wide text-white text-sm font-bold mb-6">
          Desempenho da Equipe
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400 border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
                <th className="pb-3">Profissional</th>
                <th className="pb-3">Atendimentos</th>
                <th className="pb-3">Faturamento Gerado</th>
                <th className="pb-3">Avaliação Média</th>
                <th className="pb-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/40">
              {teamPerformance.length > 0 ? (
                teamPerformance.map((barber, i) => (
                  <tr key={i} className="hover:bg-neutral-900/20 transition-colors">
                    <td className="py-3.5 font-medium text-white flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#ffffff]/10 flex items-center justify-center font-bold text-xs text-[#ffffff]">
                        {barber.name.charAt(0)}
                      </div>
                      {barber.name}
                    </td>
                    <td className="py-3.5">{barber.appointments} cortes</td>
                    <td className="py-3.5 font-bold text-white">{formatCurrency(barber.revenue)}</td>
                    <td className="py-3.5 text-white flex items-center gap-1 mt-2.5">
                      <span className="text-[#ffffff]">★</span> {barber.rating}
                    </td>
                    <td className="py-3.5 text-right">
                      <button className="text-[10px] uppercase font-bold text-[#ffffff] tracking-wider hover:underline inline-flex items-center gap-1">
                        Ver Ficha <ArrowUpRight size={12} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-neutral-500 text-xs">
                    Nenhum profissional cadastrado ou sem atendimentos concluídos no período.
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
