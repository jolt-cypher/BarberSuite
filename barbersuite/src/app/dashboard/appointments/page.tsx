'use client'

import { useState, useEffect } from 'react'
import { Plus, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, User, Scissors } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const TIME_SLOTS = Array.from({ length: 25 }, (_, i) => {
  const totalMinutes = 8 * 60 + i * 30
  const hour = Math.floor(totalMinutes / 60)
  const minute = totalMinutes % 60
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
}).filter(t => t <= '20:00')

export default function AppointmentsPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [isModalOpen, setIsModalOpen] = useState(false)
  const supabase = createClient()
  
  const [barbershopId, setBarbershopId] = useState<string | null>(null)
  const [barbers, setBarbers] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  
  // Modal State
  const [newAppt, setNewAppt] = useState({ client_name: '', client_phone: '', barber_id: '', service_id: '', time: '09:00' })

  useEffect(() => {
    fetchBarbershop()
  }, [])

  useEffect(() => {
    if (barbershopId) {
      fetchBarbers()
      fetchServices()
      fetchAppointments()

      // Supabase Realtime — atualiza a agenda automaticamente quando chega novo agendamento
      const channel = supabase
        .channel(`appointments-realtime-${barbershopId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'appointments',
            filter: `barbershop_id=eq.${barbershopId}`,
          },
          () => {
            fetchAppointments()
          }
        )
        .subscribe()

      return () => {
        supabase.removeChannel(channel)
      }
    }
  }, [barbershopId, currentDate])

  const fetchBarbershop = async () => {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    // 1. Tenta carregar como proprietário
    const { data: shop } = await supabase
      .from('barbershops')
      .select('id')
      .eq('owner_id', userData.user.id)
      .maybeSingle()
    
    if (shop) {
      setBarbershopId(shop.id)
    } else {
      // 2. Tenta carregar como barbeiro (funcionário) associado
      const { data: barber } = await supabase
        .from('barbers')
        .select('barbershop_id')
        .or(`user_id.eq.${userData.user.id},working_hours->>email.eq.${userData.user.email}`)
        .maybeSingle()

      if (barber) {
        setBarbershopId(barber.barbershop_id)
      }
    }
  }

  const fetchBarbers = async () => {
    const { data } = await supabase
      .from('barbers')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
    if (data) setBarbers(data)
  }

  const fetchServices = async () => {
    const { data } = await supabase
      .from('services')
      .select('*')
      .eq('barbershop_id', barbershopId)
      .eq('is_active', true)
    if (data) setServices(data)
  }

  const fetchAppointments = async () => {
    const startOfDay = new Date(currentDate)
    startOfDay.setHours(0, 0, 0, 0)
    const endOfDay = new Date(currentDate)
    endOfDay.setHours(23, 59, 59, 999)

    const { data } = await supabase
      .from('appointments')
      .select('*, services(name, duration_min, price)')
      .eq('barbershop_id', barbershopId)
      .gte('scheduled_at', startOfDay.toISOString())
      .lte('scheduled_at', endOfDay.toISOString())
    
    if (data) setAppointments(data)
  }

  const handlePrevDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() - 1)
    setCurrentDate(newDate)
  }

  const handleNextDay = () => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + 1)
    setCurrentDate(newDate)
  }

  const handleSaveAppointment = async () => {
    if (!barbershopId) {
      alert('Erro: Barbearia não identificada.')
      return
    }
    if (!newAppt.client_name.trim()) {
      alert('Por favor, preencha o nome do cliente.')
      return
    }
    if (!newAppt.service_id) {
      alert('Por favor, selecione um serviço.')
      return
    }

    const service = services.find(s => s.id === newAppt.service_id)
    const scheduledAt = new Date(currentDate)
    const [hours, minutes] = newAppt.time.split(':').map(Number)
    scheduledAt.setHours(hours, minutes, 0, 0)

    const { error } = await supabase.from('appointments').insert({
      barbershop_id: barbershopId,
      barber_id: newAppt.barber_id || null,
      service_id: newAppt.service_id,
      client_name: newAppt.client_name,
      client_phone: newAppt.client_phone || 'Sem telefone',
      scheduled_at: scheduledAt.toISOString(),
      status: 'confirmed',
      payment_status: 'pending',
      price: service?.price || 0,
      source: 'admin'
    })

    if (error) {
      console.error('Erro ao salvar agendamento:', error)
      alert(`Erro ao salvar agendamento: ${error.message}`)
    } else {
      setIsModalOpen(false)
      fetchAppointments()
      setNewAppt({ client_name: '', client_phone: '', barber_id: '', service_id: '', time: '09:00' })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'border-blue-500 bg-blue-500/10'
      case 'completed': return 'border-green-500 bg-green-500/10'
      case 'pending': return 'border-[#ffffff] bg-[#ffffff]/10'
      case 'in_progress': return 'border-purple-500 bg-purple-500/10'
      default: return 'border-neutral-700 bg-neutral-800'
    }
  }

  return (
    <div className="p-6 flex flex-col h-[calc(100vh-64px)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h1 className="font-[family-name:var(--font-display)] text-2xl uppercase tracking-tight text-white">
            Agenda
          </h1>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/30">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-green-400">Ao Vivo</span>
          </div>
          <div className="flex items-center gap-2 bg-neutral-900 rounded-lg p-1">
            <button onClick={handlePrevDay} className="p-1.5 hover:bg-neutral-800 rounded-md transition-colors text-white">
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2 px-3 text-sm font-medium text-white">
              <CalendarIcon size={14} className="text-[#ffffff]" />
              {currentDate.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}
            </div>
            <button onClick={handleNextDay} className="p-1.5 hover:bg-neutral-800 rounded-md transition-colors text-white">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-outline py-2 text-xs">Bloquear Horário</button>
          <button onClick={() => setIsModalOpen(true)} className="btn-neon py-2 text-xs">
            <Plus size={16} /> Novo Agendamento
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 overflow-auto bg-[#0a0a0a] rounded-xl border border-neutral-900 premium-card">
        <div className="flex min-w-[800px]">
          {/* Time Column */}
          <div className="w-20 flex-shrink-0 border-r border-neutral-800/50 bg-[#0a0a0a] sticky left-0 z-10">
            <div className="h-12 border-b border-neutral-800/50"></div> {/* Header spacer */}
            {TIME_SLOTS.map((time, idx) => (
              <div key={idx} className="h-16 relative border-b border-neutral-800/30">
                <span className="absolute -top-3 right-3 text-xs text-neutral-500 bg-[#0a0a0a] px-1">
                  {time}
                </span>
              </div>
            ))}
          </div>

          {/* Barber Columns */}
          {barbers.length === 0 && (
            <div className="flex-1 flex items-center justify-center text-neutral-500">
              Cadastre barbeiros na aba Equipe para visualizar a agenda.
            </div>
          )}

          {barbers.map((barber) => (
            <div key={barber.id} className="flex-1 min-w-[250px] border-r border-neutral-800/50 relative">
              {/* Header */}
              <div className="h-12 border-b border-neutral-800/50 flex items-center justify-center sticky top-0 bg-[#0a0a0a] z-10">
                <span className="text-sm font-medium text-white flex items-center gap-2">
                  <User size={14} className="text-[#ffffff]" />
                  {barber.name}
                </span>
              </div>

              {/* Slots */}
              <div className="relative">
                {TIME_SLOTS.map((time, idx) => (
                  <div 
                    key={idx} 
                    className="h-16 border-b border-neutral-800/30 cursor-pointer hover:bg-neutral-800/20 transition-colors"
                    onClick={() => {
                      setNewAppt({ ...newAppt, barber_id: barber.id, time })
                      setIsModalOpen(true)
                    }}
                  ></div>
                ))}

                {/* Appointments Overlay */}
                {appointments.filter(a => a.barber_id === barber.id || (!a.barber_id && barber === barbers[0])).map((apt) => {
                  const d = new Date(apt.scheduled_at)
                  const hours = d.getHours()
                  const minutes = d.getMinutes()
                  const startIdx = (hours - 8) * 2 + (minutes >= 30 ? 1 : 0)
                  const duration = apt.services?.duration_min || 30
                  const height = (duration / 30) * 4 // 4rem = 64px = 1h-16 class
                  
                  return (
                    <div
                      key={apt.id}
                      className={`absolute left-1 right-1 rounded-md border-l-4 p-2 cursor-pointer hover:opacity-90 transition-opacity ${getStatusColor(apt.status)}`}
                      style={{
                        top: `${startIdx * 4}rem`,
                        height: `${height}rem`,
                        minHeight: '4rem',
                      }}
                    >
                      <p className="text-xs font-bold text-white truncate">
                        {hours.toString().padStart(2, '0')}:{minutes.toString().padStart(2, '0')} - {apt.client_name}
                      </p>
                      <p className="text-[10px] text-neutral-300 truncate mt-0.5">{apt.services?.name}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Basic Modal Implementation */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-md p-6 relative">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-white uppercase mb-4">Novo Agendamento</h2>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Cliente</label>
                  <input 
                    type="text" 
                    className="premium-input w-full" 
                    placeholder="Nome" 
                    value={newAppt.client_name}
                    onChange={e => setNewAppt({...newAppt, client_name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Telefone</label>
                  <input 
                    type="text" 
                    className="premium-input w-full" 
                    placeholder="(00) 00000-0000" 
                    value={newAppt.client_phone || ''}
                    onChange={e => setNewAppt({...newAppt, client_phone: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Barbeiro</label>
                  <select 
                    className="premium-input w-full appearance-none"
                    value={newAppt.barber_id}
                    onChange={e => setNewAppt({...newAppt, barber_id: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {barbers.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Serviço</label>
                  <select 
                    className="premium-input w-full appearance-none"
                    value={newAppt.service_id}
                    onChange={e => setNewAppt({...newAppt, service_id: e.target.value})}
                  >
                    <option value="">Selecione...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Horário (Hoje)</label>
                <select 
                  className="premium-input w-full appearance-none"
                  value={newAppt.time}
                  onChange={e => setNewAppt({...newAppt, time: e.target.value})}
                >
                  {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button onClick={() => setIsModalOpen(false)} className="btn-outline flex-1 justify-center py-2 text-xs">Cancelar</button>
              <button onClick={handleSaveAppointment} className="btn-neon flex-1 justify-center py-2 text-xs">Salvar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
