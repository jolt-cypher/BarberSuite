'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Calendar, Download, DollarSign, Award, Users, ArrowUpRight } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// Mock Analytics Data
const TOP_SERVICES = [
  { name: 'Fade Clássico', count: 184, revenue: 9200.00, percentage: 60 },
  { name: 'Ritual de Barba', count: 96, revenue: 3840.00, percentage: 40 },
  { name: 'Full Experience', count: 42, revenue: 3360.00, percentage: 25 },
  { name: 'Corte + Lavagem', count: 32, revenue: 1920.00, percentage: 15 },
]

const TEAM_PERFORMANCE = [
  { name: 'José Shaper', appointments: 154, revenue: 8400.00, rating: 4.9 },
  { name: 'Carlos Barber', appointments: 122, revenue: 6100.00, rating: 4.8 },
]

export default function ReportsPage() {
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [timeRange, setTimeRange] = useState('30d')
  const [isExporting, setIsExporting] = useState(false)

  const [topServices, setTopServices] = useState<any[]>([])
  const [teamPerformance, setTeamPerformance] = useState<any[]>([])

  useEffect(() => {
    const isDemo = document.cookie.includes('demo-mode=true')
    setIsDemoMode(isDemo)
    if (isDemo) {
      setTopServices(TOP_SERVICES)
      setTeamPerformance(TEAM_PERFORMANCE)
    }
  }, [])

  const handleExport = () => {
    setIsExporting(true)
    setTimeout(() => setIsExporting(false), 1500)
  }

  const kpis = isDemoMode ? [
    { label: 'Faturamento Bruto', value: formatCurrency(18320.00), icon: DollarSign, color: '#22c55e', sub: '+15.2% vs mês anterior' },
    { label: 'Total de Atendimentos', value: '354', icon: Calendar, color: '#3b82f6', sub: 'Média de 11.8/dia' },
    { label: 'Ticket Médio Geral', value: formatCurrency(51.75), icon: TrendingUp, color: '#ffffff', sub: '+3.5% este mês' },
    { label: 'Novos Clientes', value: '48', icon: Users, color: '#8b5cf6', sub: '25% de retenção' },
  ] : [
    { label: 'Faturamento Bruto', value: formatCurrency(0), icon: DollarSign, color: '#22c55e', sub: 'Sem faturamento acumulado' },
    { label: 'Total de Atendimentos', value: '0', icon: Calendar, color: '#3b82f6', sub: 'Sem atendimentos registrados' },
    { label: 'Ticket Médio Geral', value: formatCurrency(0), icon: TrendingUp, color: '#ffffff', sub: 'Sem dados' },
    { label: 'Novos Clientes', value: '0', icon: Users, color: '#8b5cf6', sub: 'Sem novos clientes' },
  ]

  const chartData = isDemoMode ? [
    { label: 'Jan', value: 12400 },
    { label: 'Fev', value: 14500 },
    { label: 'Mar', value: 13900 },
    { label: 'Abr', value: 15800 },
    { label: 'Mai', value: 18320 },
    { label: 'Jun', value: 0 },
  ] : [
    { label: 'Jan', value: 0 },
    { label: 'Fev', value: 0 },
    { label: 'Mar', value: 0 },
    { label: 'Abr', value: 0 },
    { label: 'Mai', value: 0 },
    { label: 'Jun', value: 0 },
  ]

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

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpis.map((kpi, i) => (
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
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Ano de 2026</span>
          </div>

          <div className="flex items-end gap-3 h-48 pt-4">
            {chartData.map((month, i) => {
              const maxValue = 20000
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
            {topServices.map((service, i) => (
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
            ))}
            {topServices.length === 0 && (
              <div className="text-center py-12 text-xs text-neutral-500 italic">
                Nenhum serviço realizado no período selecionado.
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
              {teamPerformance.map((barber, i) => (
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
                      Ver Ficha
                    </button>
                  </td>
                </tr>
              ))}
              {teamPerformance.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-neutral-500 italic text-xs">
                    Nenhum profissional com atendimentos registrados no período selecionado.
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
