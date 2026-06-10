import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { cookies } from 'next/headers'
import { 
  CalendarDays, ShoppingCart, Scissors, Package, 
  Users, BarChart3, Settings, CreditCard, 
  Zap, ChevronRight, UserCheck, Star, Megaphone,
  ClipboardList, Gift, Clock, MessageSquare,
  ClipboardCheck, Bell, Cake, ListOrdered
} from 'lucide-react'
import { getPlanColor } from '@/lib/utils'
import type { Barbershop } from '@/lib/types'

const navGroups = [
  {
    label: 'Gestão',
    items: [
      { href: '/dashboard',             icon: CalendarDays,    label: 'Atendimentos',  id: 'atendimentos' },
      { href: '/dashboard/sales',       icon: ShoppingCart,    label: 'Vendas',        id: 'vendas' },
      { href: '/dashboard/orders',      icon: ClipboardList,   label: 'Comandas',      id: 'comandas' },
      { href: '/dashboard/services',    icon: Scissors,        label: 'Serviços',      id: 'servicos' },
      { href: '/dashboard/products',    icon: Package,         label: 'Estoque',       id: 'produtos' },
      { href: '/dashboard/team',        icon: Users,           label: 'Equipe',        id: 'equipe' },
      { href: '/dashboard/reports',     icon: BarChart3,       label: 'Relatórios',    id: 'relatorios' },
    ],
  },
  {
    label: 'Clientes',
    items: [
      { href: '/dashboard/clients',     icon: UserCheck,       label: 'Clube de Clientes', id: 'clients' },
      { href: '/dashboard/loyalty',     icon: Gift,            label: 'Fidelidade',    id: 'loyalty' },
      { href: '/dashboard/waitlist',    icon: ListOrdered,     label: 'Lista de Espera', id: 'waitlist' },
      { href: '/dashboard/birthdays',   icon: Cake,            label: 'Aniversariantes', id: 'birthdays' },
      { href: '/dashboard/surveys',     icon: ClipboardCheck,  label: 'Pesquisa NPS',  id: 'surveys' },
    ],
  },
  {
    label: 'Marketing',
    items: [
      { href: '/dashboard/marketing',   icon: Megaphone,       label: 'Campanhas',     id: 'marketing' },
      { href: '/dashboard/reminders',   icon: Bell,            label: 'Lembretes SMS', id: 'reminders' },
      { href: '/dashboard/automations', icon: MessageSquare,   label: 'Automações',    id: 'automations' },
    ],
  },
  {
    label: 'Sistema',
    items: [
      { href: '/dashboard/settings',    icon: Settings,        label: 'Configurações', id: 'configuracoes' },
    ],
  },
]

const PLAN_LABELS: Record<string, string> = {
  trial: 'TRIAL',
  basic: 'BASIC',
  pro: 'PRO',
  enterprise: 'ENTERPRISE',
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const isDemoMode = cookieStore.get('demo-mode')?.value === 'true'

  let user = null
  let barbershop: Barbershop | null = null
  let isBarber = false
  let matchedBarber = null

  if (isDemoMode) {
    const demoName = cookieStore.get('demo-barbershop-name')?.value
    const demoSlug = cookieStore.get('demo-barbershop-slug')?.value
    const demoEmail = cookieStore.get('demo-email')?.value

    user = {
      id: 'demo-user-id',
      email: demoEmail ? decodeURIComponent(demoEmail) : 'demo@barbeariasuite.com',
    }
    barbershop = {
      id: 'demo-barbershop-id',
      owner_id: 'demo-user-id',
      name: demoName ? decodeURIComponent(demoName) : 'Barbearia Suite',
      slug: demoSlug ? decodeURIComponent(demoSlug) : 'demo-barbearia',
      plan: 'pro',
      plan_status: 'active',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any
  } else {
    const supabase = await createClient()
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser()

    if (error || !supabaseUser) {
      redirect('/login')
    }
    user = supabaseUser

    const { data: realBarbershop } = await supabase
      .from('barbershops')
      .select('*')
      .eq('owner_id', user.id)
      .maybeSingle<Barbershop>()
    
    if (realBarbershop) {
      barbershop = realBarbershop
    } else {
      // Tenta buscar na tabela de barbeiros (funcionários) por user_id ou email
      const { data: barberProfile } = await supabase
        .from('barbers')
        .select('*, barbershops(*)')
        .or(`user_id.eq.${user.id},working_hours->>email.eq.${user.email}`)
        .maybeSingle()

      if (barberProfile) {
        isBarber = true
        matchedBarber = barberProfile
        barbershop = barberProfile.barbershops as any

        // Auto-vincula o ID de autenticação se estiver vazio
        if (!barberProfile.user_id) {
          await supabase
            .from('barbers')
            .update({ user_id: user.id })
            .eq('id', barberProfile.id)
        }
      }
    }
  }

  // Filtrar itens do menu se o usuário for um barbeiro
  const visibleNavGroups = isBarber ? [
    {
      label: 'Minha Agenda',
      items: [
        { href: '/dashboard',             icon: CalendarDays,    label: 'Meus Atendimentos', id: 'atendimentos' },
        { href: '/dashboard/appointments', icon: CalendarDays,    label: 'Agenda Geral',      id: 'agenda' },
        { href: '/dashboard/team',        icon: Users,           label: 'Meu Perfil',        id: 'equipe' },
      ],
    }
  ] : navGroups

  return (
    <div className="h-screen overflow-hidden flex bg-[#050505]">
      {/* SIDEBAR */}
      <aside className="w-[72px] md:w-64 bg-[#0a0a0a] border-r border-neutral-900 flex flex-col flex-shrink-0 z-30">
        {/* Logo */}
        <div className="h-[72px] flex items-center justify-center md:justify-start md:px-6 border-b border-neutral-900 flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="text-[#ffffff] text-2xl">✂</span>
            <span className="hidden md:block font-[family-name:var(--font-display)] text-xl tracking-tighter uppercase text-white">
              BARBER<span className="font-light opacity-60 ml-1">SUITE</span>
            </span>
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 flex flex-col gap-0.5">
          {visibleNavGroups.map((group) => (
            <div key={group.label} className="mb-1">
              <div className="hidden md:block px-5 pt-4 pb-1.5">
                <p className="text-[9px] text-neutral-700 uppercase tracking-widest font-bold">{group.label}</p>
              </div>
              {group.items.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="nav-item flex items-center gap-3 px-3 py-2.5 text-neutral-500 hover:text-white transition-colors group mx-2 rounded-xl"
                >
                  <item.icon size={18} className="flex-shrink-0 group-hover:text-[#ffffff] transition-colors" />
                  <span className="hidden md:block font-medium uppercase tracking-wider text-[10px]">
                    {item.label}
                  </span>
                </Link>
              ))}
            </div>
          ))}
        </nav>

        {/* User Footer */}
        <div className="p-3 md:p-4 border-t border-neutral-900 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-[#ffffff]/20 border border-[#ffffff]/30 flex items-center justify-center flex-shrink-0">
              <span className="text-[#ffffff] text-sm font-bold">
                {barbershop?.name?.[0]?.toUpperCase() ?? 'B'}
              </span>
            </div>
            <div className="hidden md:block min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {barbershop?.name ?? 'Barbearia Suite'}
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <span
                  className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-green-500/10 text-green-500"
                >
                  Ativo
                </span>
              </div>
            </div>
          </div>

          {/* View public page link */}
          {barbershop && (
            <Link
              href={`/b/${barbershop.slug}`}
              target="_blank"
              className="hidden md:flex items-center gap-2 mt-3 text-[10px] text-neutral-600 hover:text-[#ffffff] transition-colors group"
            >
              <Zap size={12} className="group-hover:text-[#ffffff]" />
              Ver página pública
              <ChevronRight size={10} />
            </Link>
          )}
        </div>
      </aside>

      {/* MAIN */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">


        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
