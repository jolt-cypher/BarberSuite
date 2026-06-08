'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

function formatSlug(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

const features = [
  { icon: '📅', label: 'Agenda inteligente' },
  { icon: '💰', label: 'Relatórios financeiros' },
  { icon: '✂️', label: 'Gestão de serviços' },
  { icon: '👥', label: 'CRM de clientes' },
  { icon: '📊', label: 'Dashboard em tempo real' },
]

export default function SignupPage() {
  const router = useRouter()

  const [barbershopName, setBarbershopName] = useState('')
  const [slug, setSlug] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [existingSession, setExistingSession] = useState(false)

  // Check if there's already a logged-in session on mount
  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setExistingSession(true)
    })
  }, [])

  // Auto-generate slug from barbershop name
  useEffect(() => {
    if (barbershopName) {
      setSlug(formatSlug(barbershopName))
    }
  }, [barbershopName])

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlug(formatSlug(e.target.value))
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)

    // Validations
    if (password !== confirmPassword) {
      setError('As senhas não coincidem. Verifique e tente novamente.')
      return
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (!slug) {
      setError('Informe um slug para sua barbearia.')
      return
    }
    if (!acceptedTerms) {
      setError('Você precisa aceitar os Termos de Uso para continuar.')
      return
    }

    setLoading(true)

    const supabase = createClient()

    // 1. Sign out any existing session first so we don't inherit another barbershop's account
    await supabase.auth.signOut()

    // 2. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          barbershop_name: barbershopName,
          slug,
          owner_name: ownerName,
        },
      },
    })

    if (authError) {
      setError(authError.message === 'User already registered'
        ? 'Este email já está cadastrado. Tente fazer login.'
        : authError.message)
      setLoading(false)
      return
    }

    const userId = authData.user?.id

    // 3. Insert row in barbershops table
    if (userId) {
      const { error: dbError } = await supabase.from('barbershops').insert({
        slug,
        name: barbershopName,
        owner_id: userId,
      })

      if (dbError) {
        console.error('Barbershop insert error:', dbError)
      }
    }

    // 4. Try to sign in automatically
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (!signInError && signInData?.session) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setSuccess(true) // Fallback to verification screen if email confirmation is required
    }
  }

  return (
    <div className="min-h-screen w-full flex">
      {/* ── LEFT COLUMN – Brand ── */}
      <div className="hidden md:flex md:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#050505]" />
        {/* Gold glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-[#ffffff]/10 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full bg-[#ffffff]/5 blur-[80px] pointer-events-none" />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffffff] to-[#d1d5db] flex items-center justify-center shadow-lg shadow-[#ffffff]/20">
              <span className="text-black font-bold text-lg font-[family-name:var(--font-display)]">B</span>
            </div>
            <span className="text-white/70 text-sm tracking-widest uppercase font-[family-name:var(--font-display)]">BarberSuite</span>
          </div>

          {/* Main brand block */}
          <div className="flex-1 flex flex-col justify-center gap-8">
            <div>
              <h1 className="text-neon-gradient font-[family-name:var(--font-display)] text-6xl xl:text-7xl font-bold tracking-tight leading-none mb-4">
                BARBER<br />SUITE
              </h1>
              <p className="text-white/50 text-lg font-[family-name:var(--font-sans)] max-w-xs leading-relaxed">
                Comece grátis. Leve sua barbearia ao próximo nível com ferramentas profissionais.
              </p>
            </div>

            {/* Features list */}
            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f.label} className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#ffffff]/10 border border-[#ffffff]/20 flex items-center justify-center text-sm">
                    {f.icon}
                  </span>
                  <span className="text-white/60 text-sm font-[family-name:var(--font-sans)]">{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bottom tagline */}
          <p className="text-white/20 text-xs font-[family-name:var(--font-sans)] tracking-widest uppercase">
            © 2025 BarberSuite · Todos os direitos reservados
          </p>
        </div>

        {/* Vertical gold line decoration */}
        <div className="absolute right-0 top-1/4 bottom-1/4 w-px bg-gradient-to-b from-transparent via-[#ffffff]/30 to-transparent" />
      </div>

      {/* ── RIGHT COLUMN – Form ── */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 md:px-12">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex md:hidden items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#ffffff] to-[#d1d5db] flex items-center justify-center shadow-lg shadow-[#ffffff]/20">
              <span className="text-black font-bold text-lg font-[family-name:var(--font-display)]">B</span>
            </div>
            <span className="text-neon-gradient font-[family-name:var(--font-display)] text-xl tracking-widest uppercase">BarberSuite</span>
          </div>

          {/* Success state */}
          {success ? (
            <div className="premium-card p-10 text-center space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-[#ffffff]/10 border border-[#ffffff]/30 flex items-center justify-center mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-[#ffffff]">
                  <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
                </svg>
              </div>
              <h2 className="text-white font-[family-name:var(--font-display)] text-3xl font-bold">
                Conta criada!
              </h2>
              <p className="text-white/50 font-[family-name:var(--font-sans)] text-sm leading-relaxed">
                Verifique seu email para confirmar o cadastro antes de fazer login.
              </p>
              <Link
                href="/login"
                className="btn-neon w-full justify-center"
              >
                Ir para o Login
              </Link>
            </div>
          ) : (
            <> 
              {/* Session warning banner */}
              {existingSession && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3 mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-amber-400 shrink-0 mt-0.5">
                    <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                  </svg>
                  <p className="text-amber-300 text-sm leading-relaxed">
                    Você está criando uma <strong>nova conta</strong>. Sua sessão atual será encerrada automaticamente ao cadastrar.
                  </p>
                </div>
              )}

              {/* Header */}
              <div className="mb-8">
                <h2 className="text-white font-[family-name:var(--font-display)] text-4xl font-bold tracking-tight mb-2">
                  Criar conta grátis
                </h2>
                <p className="text-white/40 font-[family-name:var(--font-sans)] text-sm">
                  Configure sua barbearia em menos de 2 minutos.
                </p>
              </div>


              {/* Form card */}
              <form onSubmit={handleSubmit} className="premium-card p-8 space-y-5">
                {/* Barbershop name */}
                <div className="space-y-1.5">
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-widest font-[family-name:var(--font-sans)]">
                    Nome da Barbearia
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Barbearia do João"
                    value={barbershopName}
                    onChange={(e) => setBarbershopName(e.target.value)}
                    required
                    className="premium-input"
                  />
                </div>

                {/* Slug */}
                <div className="space-y-1.5">
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-widest font-[family-name:var(--font-sans)]">
                    Slug (URL personalizada)
                  </label>
                  <input
                    type="text"
                    placeholder="barbearia-do-joao"
                    value={slug}
                    onChange={handleSlugChange}
                    required
                    className="premium-input"
                  />
                  {slug && (
                    <p className="text-[#ffffff]/60 text-xs font-[family-name:var(--font-sans)] flex items-center gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 shrink-0">
                        <path d="M12.232 4.232a2.5 2.5 0 013.536 3.536l-1.225 1.224a.75.75 0 001.061 1.06l1.224-1.224a4 4 0 00-5.656-5.656l-3 3a4 4 0 00.225 5.865.75.75 0 00.977-1.138 2.5 2.5 0 01-.142-3.667l3-3z" />
                        <path d="M11.603 7.963a.75.75 0 00-.977 1.138 2.5 2.5 0 01.142 3.667l-3 3a2.5 2.5 0 01-3.536-3.536l1.225-1.224a.75.75 0 00-1.061-1.06l-1.224 1.224a4 4 0 105.656 5.656l3-3a4 4 0 00-.225-5.865z" />
                      </svg>
                      Sua URL:{' '}
                      <span className="text-[#ffffff]">barbersuite.com.br/b/{slug}</span>
                    </p>
                  )}
                </div>

                {/* Owner name */}
                <div className="space-y-1.5">
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-widest font-[family-name:var(--font-sans)]">
                    Nome do Proprietário
                  </label>
                  <input
                    type="text"
                    placeholder="Seu nome completo"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    required
                    className="premium-input"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-widest font-[family-name:var(--font-sans)]">
                    Email
                  </label>
                  <input
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    className="premium-input"
                  />
                </div>

                {/* Password */}
                <div className="space-y-1.5">
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-widest font-[family-name:var(--font-sans)]">
                    Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="premium-input pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                      aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div className="space-y-1.5">
                  <label className="block text-white/60 text-xs font-semibold uppercase tracking-widest font-[family-name:var(--font-sans)]">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repita a senha"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="premium-input pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70 transition-colors"
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showConfirmPassword ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                        </svg>
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {/* Password match indicator */}
                  {confirmPassword && (
                    <p className={`text-xs font-[family-name:var(--font-sans)] flex items-center gap-1.5 ${password === confirmPassword ? 'text-emerald-400' : 'text-red-400'}`}>
                      {password === confirmPassword ? (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
                          </svg>
                          Senhas coincidem
                        </>
                      ) : (
                        <>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
                          </svg>
                          Senhas não coincidem
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Terms checkbox */}
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative mt-0.5 shrink-0">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(e) => setAcceptedTerms(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-5 h-5 rounded-md border border-white/20 bg-[#121212] peer-checked:bg-[#ffffff] peer-checked:border-[#ffffff] transition-all flex items-center justify-center">
                      {acceptedTerms && (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-black">
                          <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </div>
                  <span className="text-white/40 text-sm font-[family-name:var(--font-sans)] leading-relaxed group-hover:text-white/60 transition-colors">
                    Li e aceito os{' '}
                    <Link href="/terms" className="text-[#ffffff] hover:text-[#ccffea] transition-colors">
                      Termos de Uso
                    </Link>{' '}
                    e a{' '}
                    <Link href="/privacy" className="text-[#ffffff] hover:text-[#ccffea] transition-colors">
                      Política de Privacidade
                    </Link>
                  </span>
                </label>

                {/* Error message */}
                {error && (
                  <div className="flex items-center gap-2.5 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-red-400 shrink-0">
                      <path fillRule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                    </svg>
                    <p className="text-red-400 text-sm font-[family-name:var(--font-sans)]">{error}</p>
                  </div>
                )}

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-neon w-full justify-center disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Criando conta...
                    </>
                  ) : (
                    <>
                      Criar Conta Grátis
                      <span className="text-base">→</span>
                    </>
                  )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/5" />
                  <span className="text-white/20 text-xs font-[family-name:var(--font-sans)] shrink-0">ou</span>
                  <div className="flex-1 h-px bg-white/5" />
                </div>

                {/* Login link */}
                <p className="text-center text-white/40 text-sm font-[family-name:var(--font-sans)]">
                  Já tem conta?{' '}
                  <Link
                    href="/login"
                    className="text-[#ffffff] hover:text-[#ccffea] transition-colors font-semibold"
                  >
                    Fazer login
                  </Link>
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
