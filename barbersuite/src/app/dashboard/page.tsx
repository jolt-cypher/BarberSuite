import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { 
  TrendingUp, Calendar, DollarSign, Users, 
  ArrowRight, Plus, Lock, ShoppingCart,
  Clock, CheckCircle2, AlertCircle
} from 'lucide-react'
import { formatCurrency, getDaysUntilTrialEnd } from '@/lib/utils'
import type { Barbershop } from '@/lib/types'

const STATUS_CONFIG = {
  pending: { label: 'Pendente', color: '#ffffff', bg: 'bg-[#ffffff]/10', icon: Clock },
  confirmed: { label: 'Confirmado', color: '#3b82f6', bg: 'bg-blue-500/10', icon: CheckCircle2 },
  completed: { label: 'Concluído', color: '#22c55e', bg: 'bg-green-500/10', icon: CheckCircle2 },
  canceled: { label: 'Cancelado', color: '#6b7280', bg: 'bg-neutral-800', icon: AlertCircle },
  in_progress: { label: 'Em Andamento', color: '#8b5cf6', bg: 'bg-[#8b5cf6]/10', icon: Clock },
  no_show: { label: 'Não Compareceu', color: '#ef4444', bg: 'bg-[#ef4444]/10', icon: AlertCircle },
}

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const isDemoMode = cookieStore.get('demo-mode')?.value === 'true'

  let user = null
  let barbershop: Barbershop | null = null
  let todayApts: any[] = []
  let countToday = 0
  let pendingTodayCount = 0
  let revenueToday = 0
  let countWeek = 0
  let revenueWeek = 0
  let countMonth = 0
  let revenueMonth = 0
  let chartData: { day: string; value: number }[] = []
  let maxChartValue = 1
  let daysLeft = 14

  if (isDemoMode) {
    user = { id: 'demo-user-id', email: 'demo@barbeariasuite.com' }
    barbershop = {
      id: 'demo-barbershop-id',
      name: 'Barbearia Suite',
      slug: 'demo-barbearia',
      plan: 'pro',
      plan_status: 'active',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    } as any

    todayApts = [
      { id: '1', client_name: 'Arthur Santos', time: '09:00', barber: 'José Shaper', service: 'Corte Degradê', status: 'completed', price: 45 },
      { id: '2', client_name: 'Gustavo Lima', time: '10:30', barber: 'Pablo Barber', service: 'Barba Terapia', status: 'completed', price: 35 },
      { id: '3', client_name: 'Lucas Souza', time: '13:00', barber: 'José Shaper', service: 'Corte + Barba', status: 'in_progress', price: 75 },
      { id: '4', client_name: 'Rodrigo Silva', time: '14:30', barber: 'Pablo Barber', service: 'Corte Degradê', status: 'confirmed', price: 45 },
      { id: '5', client_name: 'Matheus Pereira', time: '16:00', barber: 'José Shaper', service: 'Cabelo, Barba e Sobrancelha', status: 'pending', price: 95 },
      { id: '6', client_name: 'Felipe Santos', time: '17:30', barber: 'Pablo Barber', service: 'Corte Infantil', status: 'pending', price: 40 },
    ]

    revenueToday = 80
    revenueWeek = 1420
    revenueMonth = 5890
    countToday = todayApts.length
    pendingTodayCount = todayApts.filter(apt => apt.status === 'pending').length
    countWeek = 38
    countMonth = 154
    daysLeft = 14

    chartData = [
      { day: 'Sex', value: 340 },
      { day: 'Sáb', value: 580 },
      { day: 'Dom', value: 0 },
      { day: 'Seg', value: 210 },
      { day: 'Ter', value: 410 },
      { day: 'Qua', value: 380 },
      { day: 'Qui', value: 480 },
    ]
    maxChartValue = Math.max(...chartData.map(d => d.value), 1)

  } else {
    const supabase = await createClient()
    const { data: { user: supabaseUser } } = await supabase.auth.getUser()

    if (!supabaseUser) {
      redirect('/login')
    }
    user = supabaseUser

    let realBarbershop = null
    let isBarber = false
    let matchedBarberId = null

    // 1. Tenta carregar como proprietário
    const { data: shopAsOwner } = await supabase
      .from('barbershops')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (shopAsOwner) {
      realBarbershop = shopAsOwner
    } else {
      // 2. Tenta carregar como barbeiro (funcionário) associado
      const { data: barberProfile } = await supabase
        .from('barbers')
        .select('*, barbershops(*)')
        .or(`user_id.eq.${user.id},working_hours->>email.eq.${user.email}`)
        .maybeSingle()

      if (barberProfile) {
        realBarbershop = barberProfile.barbershops
        isBarber = true
        matchedBarberId = barberProfile.id
      }
    }

    if (!realBarbershop) {
      redirect('/add-barbershop')
    }
    barbershop = realBarbershop as any

    // 1. Obter datas limites de Hoje
    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    // 2. Buscar agendamentos de Hoje (com relacionamento de barbeiros e serviços)
    let todayQuery = supabase
      .from('appointments')
      .select('*, barbers(name), services(name)')
      .eq('barbershop_id', barbershop!.id)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())

    if (isBarber) {
      todayQuery = todayQuery.eq('barber_id', matchedBarberId!)
    }

    const { data: todayAptsRaw } = await todayQuery.order('scheduled_at', { ascending: true })

    todayApts = (todayAptsRaw || []).map(apt => ({
      id: apt.id,
      client_name: apt.client_name,
      time: new Date(apt.scheduled_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      barber: apt.barbers ? (apt.barbers as any).name : 'Não atribuído',
      service: apt.services ? (apt.services as any).name : 'Serviço excluído',
      status: apt.status,
      price: Number(apt.price) || 0
    }))

    // 3. Buscar agendamentos desta Semana para os KPIs
    const startOfWeek = new Date()
    const dayOfWeek = startOfWeek.getDay()
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Inicia na Segunda-feira
    startOfWeek.setDate(diff)
    startOfWeek.setHours(0, 0, 0, 0)

    let weekQuery = supabase
      .from('appointments')
      .select('price, status, payment_status')
      .eq('barbershop_id', barbershop!.id)
      .gte('scheduled_at', startOfWeek.toISOString())

    if (isBarber) {
      weekQuery = weekQuery.eq('barber_id', matchedBarberId!)
    }

    const { data: weekAptsRaw } = await weekQuery

    // 4. Buscar agendamentos deste Mês para os KPIs
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    let monthQuery = supabase
      .from('appointments')
      .select('price, status, payment_status')
      .eq('barbershop_id', barbershop!.id)
      .gte('scheduled_at', startOfMonth.toISOString())

    if (isBarber) {
      monthQuery = monthQuery.eq('barber_id', matchedBarberId!)
    }

    const { data: monthAptsRaw } = await monthQuery

    // Cálculos de KPIs reais
    revenueToday = (todayAptsRaw || [])
      .filter(apt => apt.status === 'completed' || apt.payment_status === 'paid')
      .reduce((acc, apt) => acc + (Number(apt.price) || 0), 0)

    revenueWeek = (weekAptsRaw || [])
      .filter(apt => apt.status === 'completed' || apt.payment_status === 'paid')
      .reduce((acc, apt) => acc + (Number(apt.price) || 0), 0)

    revenueMonth = (monthAptsRaw || [])
      .filter(apt => apt.status === 'completed' || apt.payment_status === 'paid')
      .reduce((acc, apt) => acc + (Number(apt.price) || 0), 0)

    countToday = todayAptsRaw?.length || 0
    pendingTodayCount = todayAptsRaw?.filter(apt => apt.status === 'pending').length || 0
    countWeek = weekAptsRaw?.length || 0
    countMonth = monthAptsRaw?.length || 0

    // 5. Histórico de Faturamento dos Últimos 7 Dias (Gráfico)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6)
    sevenDaysAgo.setHours(0, 0, 0, 0)

    let sevenDaysQuery = supabase
      .from('appointments')
      .select('price, scheduled_at, status, payment_status')
      .eq('barbershop_id', barbershop!.id)
      .gte('scheduled_at', sevenDaysAgo.toISOString())

    if (isBarber) {
      sevenDaysQuery = sevenDaysQuery.eq('barber_id', matchedBarberId!)
    }

    const { data: sevenDaysAptsRaw } = await sevenDaysQuery

    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const chartMap = new Map<string, number>()
    const orderOfDays: string[] = []

    // Inicializar o mapa com os últimos 7 dias na ordem correta
    for (let i = 0; i < 7; i++) {
      const d = new Date()
      d.setDate(d.getDate() - 6 + i)
      const dayName = weekdays[d.getDay()]
      orderOfDays.push(dayName)
      chartMap.set(dayName, 0)
    }

    (sevenDaysAptsRaw || [])
      .filter(apt => apt.status === 'completed' || apt.payment_status === 'paid')
      .forEach(apt => {
        const d = new Date(apt.scheduled_at)
        const dayName = weekdays[d.getDay()]
        if (chartMap.has(dayName)) {
          chartMap.set(dayName, (chartMap.get(dayName) || 0) + (Number(apt.price) || 0))
        }
      })

    chartData = orderOfDays.map(day => ({
      day,
      value: chartMap.get(day) || 0
    }))

    maxChartValue = Math.max(...chartData.map(d => d.value), 1) // evita divisão por zero
    daysLeft = getDaysUntilTrialEnd(barbershop!.trial_ends_at ?? '')
  }

  const kpis = [
    { label: 'Faturamento Hoje', value: formatCurrency(revenueToday), icon: DollarSign, color: '#ffffff', sub: `${countToday} atendimentos hoje` },
    { label: 'Esta Semana', value: formatCurrency(revenueWeek), icon: TrendingUp, color: '#3b82f6', sub: `${countWeek} atendimentos` },
    { label: 'Este Mês', value: formatCurrency(revenueMonth), icon: ShoppingCart, color: '#22c55e', sub: `${countMonth} atendimentos` },
    { label: 'Agendamentos Hoje', value: String(countToday), icon: Calendar, color: '#8b5cf6', sub: `${pendingTodayCount} pendentes` },
  ]

  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl uppercase tracking-tight text-white">
            Visão Geral — {barbershop?.name}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/appointments" className="btn-neon text-xs py-2.5 px-4">
            <Plus size={14} />
            Novo Agendamento
          </Link>
          <button className="btn-outline text-xs py-2.5 px-4">
            <Lock size={14} />
            Bloquear Horário
          </button>
        </div>
      </div>

      {/* Trial Banner */}
      {barbershop?.plan === 'trial' && (
        <div className="bg-[#ffffff]/8 border border-[#ffffff]/25 rounded-2xl p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#ffffff]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✨</span>
            </div>
            <div>
              <p className="text-[#ffffff] font-semibold text-sm">Trial Gratuito Ativo</p>
              <p className="text-neutral-400 text-xs mt-0.5">
                {daysLeft > 0 ? `${daysLeft} dias restantes no seu período de avaliação` : 'Seu trial expirou!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block w-32 h-2 bg-neutral-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#ffffff] to-[#ccffea]"
                style={{ width: `${Math.max(0, Math.min(100, ((14 - daysLeft) / 14) * 100))}%` }}
              />
            </div>
            <Link href="/dashboard/billing" className="btn-neon text-xs py-2 px-4 whitespace-nowrap">
              Escolher Plano <ArrowRight size={12} />
            </Link>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Revenue Chart */}
        <div className="premium-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-[family-name:var(--font-display)] uppercase tracking-wide text-white text-sm font-bold">
              Faturamento — Últimos 7 Dias
            </h3>
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest">Fluxo de Caixa</span>
          </div>
          <div className="flex items-end gap-3 h-40">
            {chartData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <span className="text-[9px] text-neutral-600 group-hover:text-[#ffffff] transition-colors">
                  {d.value > 0 ? formatCurrency(d.value).replace('R$\u00a0', 'R$') : '-'}
                </span>
                <div className="w-full relative rounded-t-lg overflow-hidden bg-neutral-900"
                  style={{ height: '120px' }}>
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-t-lg transition-all duration-700 group-hover:opacity-100"
                    style={{
                      height: `${(d.value / maxChartValue) * 100}%`,
                      background: d.value > 0
                        ? 'linear-gradient(to top, #ffffff, #ccffea80)'
                        : '#1a1a1a',
                      opacity: d.value > 0 ? 0.8 : 0.3,
                    }}
                  />
                </div>
                <span className="text-[9px] text-neutral-600 uppercase">{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Today's Appointments */}
        <div className="premium-card p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-[family-name:var(--font-display)] uppercase tracking-wide text-white text-sm font-bold">
              Agenda de Hoje
            </h3>
            <Link
              href="/dashboard/appointments"
              className="text-[10px] text-[#ffffff] hover:underline flex items-center gap-1 uppercase tracking-widest"
            >
              Ver todos <ArrowRight size={10} />
            </Link>
          </div>

          <div className="flex flex-col gap-2 overflow-y-auto max-h-64">
            {todayApts.length > 0 ? (
              todayApts.map((apt) => {
                const config = STATUS_CONFIG[apt.status as keyof typeof STATUS_CONFIG] ?? STATUS_CONFIG.pending
                return (
                  <div
                    key={apt.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 transition-colors group cursor-pointer"
                  >
                    <div className="flex-shrink-0 text-center min-w-[40px]">
                      <span className="text-xs font-bold text-white">{apt.time}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{apt.client_name}</p>
                      <p className="text-[10px] text-neutral-500 truncate">{apt.service} · {apt.barber}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase ${config.bg}`}
                        style={{ color: config.color }}
                      >
                        {config.label}
                      </span>
                      <span className="text-[10px] text-neutral-600">{formatCurrency(apt.price)}</span>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-12 flex flex-col items-center justify-center h-full">
                <Calendar className="text-neutral-700 mb-3" size={32} />
                <p className="text-xs text-neutral-400 font-medium">Nenhum agendamento para hoje</p>
                <p className="text-[10px] text-neutral-600 mt-1 max-w-[180px]">Os agendamentos confirmados aparecerão aqui.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Access */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: '/dashboard/services', label: 'Gerenciar Serviços', icon: '✂', color: '#ffffff' },
          { href: '/dashboard/products', label: 'Controle de Estoque', icon: '📦', color: '#3b82f6' },
          { href: '/dashboard/team', label: 'Equipe', icon: '👥', color: '#22c55e' },
          { href: '/dashboard/reports', label: 'Relatórios', icon: '📊', color: '#8b5cf6' },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="premium-card p-4 flex items-center gap-3 group hover:border-white/10 transition-all"
          >
            <span className="text-2xl">{item.icon}</span>
            <span className="text-xs text-neutral-400 font-medium group-hover:text-white transition-colors">
              {item.label}
            </span>
            <ArrowRight size={12} className="ml-auto text-neutral-700 group-hover:text-[#ffffff] transition-colors" />
          </Link>
        ))}
      </div>
    </div>
  )
}
