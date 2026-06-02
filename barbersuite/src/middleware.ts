import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const isDemoMode = request.cookies.get('demo-mode')?.value === 'true'

  const {
    data: { user },
  } = isDemoMode ? { data: { user: null } } : await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!user && !isDemoMode) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      url.searchParams.set('redirectTo', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === '/login' || pathname === '/signup') && (user || isDemoMode)) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Multi-Tenancy: Subdomain Routing
  const hostname = request.headers.get('host') || ''
  // Handle localhost or production domain
  const currentHost = process.env.NODE_ENV === 'production' && process.env.VERCEL === '1'
    ? hostname.replace(`.barbersuite.com.br`, '') // Replace with your production domain
    : hostname.replace(`.localhost:3000`, '')

  console.log('[Middleware Debug]', { hostname, currentHost, pathname })

  // Se for um subdomínio (não é o root e não é 'www') e não estamos acessando rotas de API, _next ou telas administrativas
  if (
    currentHost !== 'localhost:3000' && 
    currentHost !== 'localhost' && 
    currentHost !== 'barbersuite.com.br' && 
    currentHost !== 'www' &&
    !hostname.includes('vercel.app') && // Evitar tratar domínios de desenvolvimento/produção da Vercel como subdomínios de inquilinos
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.startsWith('/dashboard') &&
    !pathname.startsWith('/login') &&
    !pathname.startsWith('/signup') &&
    !pathname.startsWith('/add-barbershop') &&
    !pathname.startsWith('/forgot-password') &&
    !pathname.startsWith('/reset-password')
  ) {
    // Reescrever a URL para a rota dinâmica do tenant: /b/[slug]
    const url = request.nextUrl.clone()
    url.pathname = `/b/${currentHost}${pathname === '/' ? '' : pathname}`
    return NextResponse.rewrite(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
