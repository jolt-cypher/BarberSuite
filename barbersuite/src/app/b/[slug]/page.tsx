import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin, Phone, Instagram, Clock, Star, Scissors } from 'lucide-react'
import BookingModalClientWrapper from './booking-wrapper'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/server'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()
  const { data } = await supabase
    .from('barbershops')
    .select('name')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()
  if (!data) return { title: 'Barbearia não encontrada' }
  return { title: `${data.name} | Agendamento Online` }
}

export default async function TenantPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createClient()

  // Buscar barbearia pelo slug no Supabase
  const { data: barbershop } = await supabase
    .from('barbershops')
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (!barbershop) notFound()

  // Buscar serviços ativos
  const { data: servicesData } = await supabase
    .from('services')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)
    .order('sort_order')
  const services = servicesData || []

  // Buscar barbeiros ativos
  const { data: barbersData } = await supabase
    .from('barbers')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .eq('is_active', true)
  const barbers = barbersData || []

  // Buscar avaliações aprovadas
  const { data: reviewsData } = await supabase
    .from('reviews')
    .select('*')
    .eq('barbershop_id', barbershop.id)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(10)
  const reviews = reviewsData || []

  return (
    <div className="min-h-screen bg-[#050505] selection:bg-[#ffffff] selection:text-black">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-40 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#ffffff] text-xl">✂</span>
            <span className="font-[family-name:var(--font-display)] text-lg tracking-tighter uppercase text-white font-bold">
              {barbershop.name}
            </span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-xs font-semibold uppercase tracking-widest text-neutral-400">
            <a href="#servicos" className="hover:text-white transition-colors">Serviços</a>
            <a href="#equipe" className="hover:text-white transition-colors">Equipe</a>
            <a href="#avaliacoes" className="hover:text-white transition-colors">Avaliações</a>
          </div>

          <BookingModalClientWrapper 
            barbershop={barbershop} 
            barbers={barbers || []} 
            services={services || []} 
          />
        </div>
      </nav>

      {/* HERO */}
      <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          {barbershop.cover_url ? (
            <Image 
              src={barbershop.cover_url} 
              alt={barbershop.name} 
              fill 
              className="object-cover"
              priority
            />
          ) : (
            <div className="absolute inset-0 bg-neutral-950" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-[#050505]/80 to-[#050505]" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255, 255, 255,0.15)_0%,transparent_70%)]" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center animate-fade-in-up">
          {(barbershop.city || barbershop.state) && (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md mb-6">
              <MapPin size={12} className="text-[#ffffff]" />
              <span className="text-[10px] uppercase tracking-widest text-neutral-300 font-bold">
                {[barbershop.city, barbershop.state].filter(Boolean).join(', ')}
              </span>
            </div>
          )}
          
          <h1 className="font-[family-name:var(--font-display)] text-5xl md:text-7xl lg:text-8xl text-white uppercase tracking-tighter leading-none mb-6">
            {barbershop.tagline
              ? <>{barbershop.tagline.split('.')[0]}<br/><span className="text-neon-gradient italic pr-2">{barbershop.tagline.split('.').slice(1).join('.')}</span>.</>
              : barbershop.name
            }
          </h1>
          
          {barbershop.tagline && (
            <p className="text-neutral-400 text-sm md:text-base max-w-2xl mx-auto mb-10 leading-relaxed font-light">
              {barbershop.tagline}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <BookingModalClientWrapper 
              barbershop={barbershop} 
              barbers={barbers ?? []} 
              services={services ?? []} 
              className="btn-neon py-3 px-8 text-sm w-full sm:w-auto justify-center"
            />
            {barbershop.whatsapp && (
              <a 
                href={`https://wa.me/${barbershop.whatsapp}`} 
                target="_blank" 
                rel="noreferrer"
                className="btn-outline py-3 px-8 text-sm w-full sm:w-auto justify-center bg-white/5 backdrop-blur-md"
              >
                <Phone size={16} /> Contato via WhatsApp
              </a>
            )}
          </div>
        </div>
      </header>

      {/* SERVIÇOS */}
      <section id="servicos" className="py-20 md:py-32 px-4 relative">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl text-white uppercase tracking-tight">Nossos <span className="text-[#ffffff]">Serviços</span></h2>
            <div className="w-24 h-1 bg-[#ffffff] mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
            {services.map((service, i) => (
              <div key={service.id} className="group cursor-default animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
                <div className="flex items-end justify-between mb-2">
                  <h3 className="font-[family-name:var(--font-display)] text-xl text-white tracking-wide group-hover:text-[#ffffff] transition-colors duration-300">
                    {service.name}
                  </h3>
                  <div className="flex-1 border-b border-dashed border-neutral-800 mx-4 mb-1 group-hover:border-[#ffffff]/30 transition-colors" />
                  <span className="text-[#ffffff] font-bold text-lg">{formatCurrency(service.price)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-neutral-400 text-sm font-light max-w-[80%]">{service.description}</p>
                  <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-bold flex items-center gap-1">
                    <Clock size={10} /> {service.duration_min}m
                  </span>
                </div>
                <div className="h-px w-0 bg-gradient-to-r from-[#ffffff] to-transparent mt-4 group-hover:w-full transition-all duration-700 ease-out" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EQUIPE */}
      <section id="equipe" className="py-20 md:py-32 px-4 bg-[#0a0a0a]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl text-white uppercase tracking-tight">Profissionais de <span className="text-[#ffffff]">Elite</span></h2>
            <div className="w-24 h-1 bg-[#ffffff] mx-auto mt-6" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
            {barbers.map((barber) => (
              <div key={barber.id} className="premium-card overflow-hidden group">
                <div className="relative h-80 w-full overflow-hidden bg-neutral-900">
                  {barber.photo_url ? (
                    <Image 
                      src={barber.photo_url} 
                      alt={barber.name} 
                      fill 
                      className="object-cover object-top grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                      unoptimized
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center bg-neutral-950 text-neutral-600 font-[family-name:var(--font-display)] text-lg tracking-widest uppercase">
                      Sem Foto
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent opacity-80" />
                </div>
                <div className="p-8 relative -mt-20 z-10">
                  <span className="text-[10px] text-[#ffffff] uppercase tracking-widest font-bold block mb-1">{barber.role}</span>
                  <h3 className="font-[family-name:var(--font-display)] text-3xl text-white tracking-wide mb-4">{barber.name}</h3>
                  <p className="text-neutral-400 text-sm font-light leading-relaxed">{barber.bio}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AVALIAÇÕES */}
      <section id="avaliacoes" className="py-20 md:py-32 px-4 relative overflow-hidden">
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="font-[family-name:var(--font-display)] text-3xl md:text-5xl text-white uppercase tracking-tight">O Que Dizem <span className="text-[#ffffff]">Os Clientes</span></h2>
            <div className="w-24 h-1 bg-[#ffffff] mx-auto mt-6" />
          </div>

          <div className="flex gap-6 overflow-x-auto pb-8 snap-x scrollbar-hide px-4 md:px-0">
            {reviews.map((review) => (
              <div key={review.id} className="premium-card p-8 min-w-[300px] md:min-w-[400px] snap-center shrink-0 border-t-4 border-t-[#ffffff]">
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} size={14} className="text-[#ffffff] fill-[#ffffff]" />
                  ))}
                </div>
                <p className="text-neutral-300 text-sm md:text-base italic mb-6 leading-relaxed">"{review.comment}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center font-bold text-[#ffffff]">
                    {review.client_name.charAt(0)}
                  </div>
                  <span className="text-white font-medium text-sm">{review.client_name}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#0a0a0a] pt-20 pb-10 px-4 border-t border-neutral-900">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between gap-12 mb-16">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[#ffffff] text-2xl">✂</span>
              <span className="font-[family-name:var(--font-display)] text-xl tracking-tighter uppercase text-white font-bold">
                {barbershop.name}
              </span>
            </div>
            <p className="text-neutral-400 text-sm mb-6 leading-relaxed">
              O seu destino definitivo para um visual impecável e um serviço de excelência. Agende seu horário online com praticidade.
            </p>
            <div className="flex gap-4">
              {barbershop.instagram && (
                <a href={`https://instagram.com/${barbershop.instagram}`} className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-[#ffffff] hover:bg-[#ffffff]/10 transition-colors">
                  <Instagram size={18} />
                </a>
              )}
              {barbershop.whatsapp && (
                <a href={`https://wa.me/${barbershop.whatsapp}`} className="w-10 h-10 rounded-full bg-neutral-900 flex items-center justify-center text-neutral-400 hover:text-[#ffffff] hover:bg-[#ffffff]/10 transition-colors">
                  <Phone size={18} />
                </a>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-4 text-sm text-neutral-400">
            <h4 className="font-[family-name:var(--font-display)] text-white text-lg tracking-wide mb-2 uppercase">Contato</h4>
            {barbershop.phone && <span className="flex items-center gap-3"><Phone size={16} className="text-[#ffffff]" /> {barbershop.phone}</span>}
            {barbershop.address && <span className="flex items-start gap-3 max-w-[250px]"><MapPin size={16} className="text-[#ffffff] flex-shrink-0 mt-1" /> {barbershop.address}</span>}
          </div>
        </div>

        <div className="max-w-6xl mx-auto pt-8 border-t border-neutral-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[11px] text-neutral-600 uppercase tracking-widest font-bold">
          <p>© {new Date().getFullYear()} {barbershop.name}. Todos os direitos reservados.</p>
          <a href="/" className="flex items-center gap-2 hover:text-[#ffffff] transition-colors">
            Powered by <span className="text-white">BarberSuite</span> <Scissors size={12} />
          </a>
        </div>
      </footer>
    </div>
  )
}
