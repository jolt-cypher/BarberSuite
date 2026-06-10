import Link from 'next/link';
import Image from 'next/image';
// ─── Data ────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: '📅',
    title: 'Agenda Inteligente',
    description:
      'Calendário visual por barbeiro com detecção automática de conflitos e lembretes por WhatsApp.',
  },
  {
    icon: '💰',
    title: 'Financeiro Completo',
    description:
      'Controle de caixa, despesas, relatórios detalhados e margem líquida em tempo real.',
  },
  {
    icon: '🌐',
    title: 'Página Pública',
    description:
      'Sua barbearia online em minutos, com agendamento direto pelo cliente sem precisar ligar.',
  },
  {
    icon: '👥',
    title: 'Gestão de Equipe',
    description:
      'Controle de barbeiros, comissões automáticas, metas e métricas de produtividade.',
  },
  {
    icon: '📦',
    title: 'Estoque Integrado',
    description:
      'Gestão de produtos, alertas de estoque baixo e controle de fornecedores em um só lugar.',
  },
  {
    icon: '⭐',
    title: 'Avaliações',
    description:
      'Colete e exiba reviews autênticos dos clientes para construir sua reputação online.',
  },
];

const plans = [
  {
    id: 'basic',
    name: 'INICIAL',
    label: 'BASIC',
    price: 'R$90',
    period: '/mês',
    description: 'Ideal para barbearias que estão começando a crescer.',
    features: [
      '2 barbeiros',
      '10 serviços cadastrados',
      '200 agendamentos/mês',
      'Página pública',
      'Suporte por e-mail',
    ],
    cta: 'Começar Grátis',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'CRESCIMENTO',
    label: 'PRO',
    price: 'R$120',
    period: '/mês',
    description: 'Para barbearias que levam o negócio a sério.',
    badge: 'MAIS POPULAR',
    features: [
      '5 barbeiros',
      '30 serviços cadastrados',
      '1.000 agendamentos/mês',
      'WhatsApp integrado',
      'Relatórios avançados',
      'Gestão de comissões',
    ],
    cta: 'Começar Grátis',
    highlighted: true,
  },
  {
    id: 'enterprise',
    name: 'ESCALA',
    label: 'ENTERPRISE',
    price: 'R$200',
    period: '/mês',
    description: 'Para redes e franquias que precisam de escala total.',
    features: [
      'Barbeiros ilimitados',
      'Serviços ilimitados',
      'Agendamentos ilimitados',
      'Domínio próprio',
      'Suporte dedicado 24/7',
      'API access',
    ],
    cta: 'Falar com Vendas',
    highlighted: false,
  },
];

const testimonials = [
  {
    id: 1,
    name: 'Carlos Eduardo Souza',
    city: 'São Paulo, SP',
    role: 'Dono da Barbearia Corte & Estilo',
    text: 'O BarberSuite mudou completamente como eu gerencio Barbearia Suite. Antes eu perdia clientes por falta de organização. Agora tenho tudo automatizado e meu faturamento cresceu 40% em 3 meses.',
    rating: 5,
    image: 'https://picsum.photos/seed/barber1/80/80',
  },
  {
    id: 2,
    name: 'Rafael Andrade Mendes',
    city: 'Belo Horizonte, MG',
    role: 'Proprietário da NavalhaDourada',
    text: 'A página pública profissional que o BarberSuite criou pra mim trouxe 30 clientes novos no primeiro mês. O sistema de agendamento online é incrível e meus clientes adoraram a praticidade.',
    rating: 5,
    image: 'https://picsum.photos/seed/barber2/80/80',
  },
  {
    id: 3,
    name: 'Diego Ferreira Lima',
    city: 'Curitiba, PR',
    role: 'Sócio da Barbearia Clássica PR',
    text: 'Gerencio 4 barbeiros e nunca foi tão fácil. Controle de comissões, agenda sem conflitos e relatórios financeiros detalhados. Recuperei o investimento na primeira semana de uso.',
    rating: 5,
    image: 'https://picsum.photos/seed/barber3/80/80',
  },
];

const stats = [
  { value: '500+', label: 'Barbearias' },
  { value: '50k+', label: 'Agendamentos' },
  { value: '4.9/5 ★', label: 'Avaliação' },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function StarRating({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-[#ffffff] text-sm">★</span>
      ))}
    </div>
  );
}

function CheckIcon() {
  return (
    <svg
      className="w-4 h-4 shrink-0 mt-0.5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
      style={{ color: 'rgba(255,255,255,0.7)' }}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandingPage() {
  return (
    <div className="min-h-screen text-[#c8cfe0] overflow-x-hidden" style={{ background: '#030303' }}>

      {/* Background simplificado */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[#030303]"></div>

      {/* ── 1. NAVBAR ── */}
      <nav className="glass-dark fixed top-0 left-0 right-0 z-50">
        <div className="w-full px-6 md:px-12 flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl">✂️</span>
            <span className="font-[family-name:var(--font-display)] text-xl tracking-widest">
              <span className="text-white font-bold">BARBER</span>
              <span className="text-[rgba(255,255,255,0.5)] font-bold">SUITE</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {[
              { href: '#features', label: 'Funcionalidades' },
              { href: '#testimonials', label: 'Para Barbearias' },
            ].map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-xs text-[rgba(200,207,224,0.6)] hover:text-white transition-colors duration-200 tracking-[0.12em] uppercase"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-outline text-xs py-2 px-5 hidden sm:inline-flex">
              Entrar
            </Link>
            <Link href="/signup" className="btn-primary text-xs py-2 px-5">
              Criar Conta
            </Link>
          </div>
        </div>
      </nav>

      {/* ── 2. HERO ── */}
      <section className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-6 md:px-16 lg:px-24 pt-32 pb-20 z-10 max-w-full">
        {/* central glow moved to left behind text */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 55% at 30% 50%, rgba(255, 255, 255,0.08) 0%, transparent 70%)' }}
        />

        {/* LEFT COLUMN: Text Content */}
        <div className="relative flex flex-col items-start gap-8 z-10 w-full max-w-2xl">
          <span className="text-[10px] uppercase tracking-[0.2em] text-[#a1a1aa] font-bold">
            Sistema de Gestão Profissional
          </span>
          <h1
            className="animate-fade-in-up opacity-0 delay-200 font-[family-name:var(--font-display)] text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold leading-[1.05] tracking-tight text-white text-left"
          >
            Tudo Para Sua
            <br />
            Barbearia{' '}
            <span className="text-gradient">Crescer</span>
          </h1>

          <p className="animate-fade-in-up opacity-0 delay-300 max-w-lg text-left text-lg sm:text-xl leading-relaxed" style={{ color: 'rgba(200,207,224,0.6)' }}>
            Foque no que você faz de melhor. Nós cuidamos do agendamento, financeiro e controle da sua equipe com um sistema simples e eficiente.
          </p>

          <div className="animate-fade-in-up opacity-0 delay-400 flex flex-col sm:flex-row gap-4 items-start sm:items-center w-full">
            <Link href="/signup" className="btn-primary text-sm py-4 px-8 w-full sm:w-auto justify-center">
              Criar Conta →
            </Link>
            <a href="#features" className="btn-outline text-sm py-4 px-8 w-full sm:w-auto justify-center">
              Ver Demo
            </a>
          </div>

          <div className="animate-fade-in-up opacity-0 delay-500 flex flex-wrap justify-start gap-10 mt-6">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col items-start gap-1">
                <span className="font-[family-name:var(--font-display)] text-3xl font-bold text-neon-gradient">{s.value}</span>
                <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.45)' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Phone Mockup */}
        <div className="relative flex justify-center lg:justify-end z-10 animate-fade-in-up delay-300 opacity-0 lg:pr-12">
          {/* Subtle glow behind the phone */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-3/4 bg-[#ffffff] opacity-10 blur-[80px] rounded-full pointer-events-none"></div>
          
          <div className="relative w-[320px] sm:w-[360px] h-[720px] bg-[#050505] rounded-[3rem] border-[8px] border-[#1a1a1a] shadow-2xl overflow-hidden flex flex-col">
            {/* Notch */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-7 bg-[#1a1a1a] rounded-b-2xl z-20"></div>
            
            {/* Screen Content - Login */}
            <div className="flex-1 bg-[#030303] flex flex-col p-7 pt-20 relative">
              {/* Decorative background glow inside phone */}
              <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-[rgba(255, 255, 255,0.12)] to-transparent pointer-events-none" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-8">
                  <span className="text-xl">✂️</span>
                  <span className="font-[family-name:var(--font-display)] tracking-widest">
                    <span className="text-white font-bold">BARBER</span>
                    <span className="text-[rgba(255,255,255,0.5)] font-bold">SUITE</span>
                  </span>
                </div>

                <h3 className="text-2xl font-[family-name:var(--font-display)] font-bold text-white mb-2">Bem-vindo</h3>
                <p className="text-xs text-gray-400 mb-8">Acesse sua conta para gerenciar sua barbearia.</p>
                
                <form className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">E-mail</label>
                    <input type="email" placeholder="contato@barbearia.com" className="premium-input bg-[#0a0a0a] border-white/10 text-sm py-3.5 focus:border-[#ffffff] focus:ring-1 focus:ring-[#ffffff]" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold">Senha</label>
                      <a href="#" className="text-[10px] text-[#ffffff] hover:underline">Esqueceu?</a>
                    </div>
                    <input type="password" placeholder="••••••••" className="premium-input bg-[#0a0a0a] border-white/10 text-sm py-3.5 focus:border-[#ffffff] focus:ring-1 focus:ring-[#ffffff]" />
                  </div>
                  
                  <Link href="/dashboard" className="btn-primary w-full justify-center py-3.5 mt-4 text-xs font-bold">
                    Entrar no Sistema
                  </Link>
                  
                  <div className="relative flex items-center py-5 mt-2">
                    <div className="flex-grow border-t border-white/10"></div>
                    <span className="flex-shrink-0 mx-4 text-[10px] uppercase text-gray-500 tracking-wider">ou</span>
                    <div className="flex-grow border-t border-white/10"></div>
                  </div>
                  
                  <button type="button" className="btn-outline w-full justify-center py-3.5 text-xs flex items-center gap-3 border-white/10 bg-white/5 hover:bg-white/10">
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar com Google
                  </button>
                </form>
              </div>
            </div>
            
            {/* Home indicator (bottom bar) */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full z-20"></div>
          </div>
        </div>
      </section>

      {/* ── 3. FEATURES ── */}
      <section id="features" className="relative py-28 px-6 z-10">
        <div className="section-divider mb-16" />

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block mb-4 text-xs font-bold tracking-[0.3em] uppercase text-[#ffffff]">
              Funcionalidades
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold text-white">
              Tudo Que Você Precisa{' '}
              <span className="text-gradient">Em Um Só Lugar</span>
            </h2>
            <p className="mt-4 max-w-xl mx-auto" style={{ color: 'rgba(200,207,224,0.55)' }}>
              Desenvolvido especificamente para barbearias brasileiras, com cada
              detalhe pensado para o seu dia a dia.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="premium-card p-8 flex flex-col gap-4 group"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0"
                  style={{ background: 'rgba(255, 255, 255,0.07)', border: '1px solid rgba(255,255,255,0.12)' }}
                >
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-[family-name:var(--font-display)] text-xl font-bold text-white mb-2 group-hover:text-[#ffffff] transition-colors duration-300">
                    {f.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(200,207,224,0.55)' }}>{f.description}</p>
                </div>
                <div
                  className="mt-auto h-px w-0 group-hover:w-full transition-all duration-500 rounded-full"
                  style={{ background: 'linear-gradient(90deg, rgba(255, 255, 255,0.6), transparent)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* ── 5. TESTIMONIALS ── */}
      <section id="testimonials" className="py-28 px-6 relative z-10">
        <div className="section-divider mb-16" />

        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <span className="inline-block mb-4 text-xs font-bold tracking-[0.3em] uppercase text-[#ffffff]">
              Depoimentos
            </span>
            <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl font-bold text-white">
              Barbearias Que Já{' '}
              <span className="text-gradient">Transformaram</span> Seus Negócios
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.id} className="premium-card p-8 flex flex-col gap-5">
                <StarRating count={t.rating} />
                <p className="text-sm leading-relaxed flex-1" style={{ color: 'rgba(200,207,224,0.65)' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-4 mt-auto pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="relative w-11 h-11 rounded-full overflow-hidden shrink-0" style={{ boxShadow: '0 0 0 2px rgba(255, 255, 255,0.2)' }}>
                    <Image src={t.image} alt={t.name} fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <p className="text-white text-sm font-semibold">{t.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{t.role}</p>
                    <p className="text-xs mt-0.5 text-[#ffffff]">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. CTA FINAL ── */}
      <section className="py-28 px-6 relative overflow-hidden z-10">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 70% 70% at 50% 50%, rgba(80,120,255,0.06) 0%, transparent 70%)' }}
        />
        {/* rings */}
        {[600, 900].map((size) => (
          <div
            key={size}
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ width: size, height: size, border: '1px solid rgba(255,255,255,0.04)' }}
          />
        ))}

        <div className="max-w-3xl mx-auto text-center relative z-10 flex flex-col items-center gap-8">
          <span
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase"
            style={{ background: 'rgba(255, 255, 255,0.08)', border: '1px solid rgba(255, 255, 255,0.2)', color: '#ffffff' }}
          >
            ✂️ Comece Hoje
          </span>

          <h2 className="font-[family-name:var(--font-display)] text-4xl sm:text-5xl md:text-6xl font-extrabold text-white leading-tight">
            Pronto Para{' '}
            <span className="text-gradient">Transformar</span>
            <br />
            Sua Barbearia?
          </h2>

          <p className="text-lg max-w-lg" style={{ color: 'rgba(200,207,224,0.5)' }}>
            Configure sua barbearia em 5 minutos e comece a gerenciar hoje mesmo.
          </p>

          <Link href="/signup" className="btn-primary text-sm py-5 px-12">
            Criar Minha Conta →
          </Link>
        </div>
      </section>

      {/* ── 7. FOOTER ── */}
      <footer className="px-6 py-16 relative z-10" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-xl">✂️</span>
              <span className="font-[family-name:var(--font-display)] text-xl tracking-widest">
                <span className="text-white font-bold">BARBER</span>
                <span className="font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>SUITE</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
              A plataforma de gestão completa para barbearias modernas que
              querem crescer com inteligência e profissionalismo.
            </p>
            <div className="flex gap-3 mt-2">
              {['IG', 'WA'].map((s) => (
                <a
                  key={s}
                  href="#"
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.4)' }}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs mb-4 tracking-[0.2em] uppercase">Produto</h4>
            <ul className="flex flex-col gap-3">
              {['Funcionalidades', 'Sobre', 'Blog'].map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.35)' }}>{link}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs mb-4 tracking-[0.2em] uppercase">Legal</h4>
            <ul className="flex flex-col gap-3">
              {[
                { label: 'Privacidade', href: '/privacy' },
                { label: 'Termos', href: '/terms' },
                { label: 'Cookies', href: '#' },
                { label: 'Contato', href: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <Link href={item.href} className="text-sm transition-colors hover:text-white" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="max-w-7xl mx-auto mt-14 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          style={{ borderTop: '1px solid rgba(255,255,255,0.05)' }}
        >
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © 2025 BarberSuite. Todos os direitos reservados.
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            Feito com ❤️ para barbearias brasileiras
          </p>
        </div>
      </footer>
    </div>
  );
}
