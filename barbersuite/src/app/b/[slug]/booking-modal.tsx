'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, Calendar, Clock, User, Scissors, CheckCircle, ArrowLeft } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function BookingModal({ 
  isOpen, 
  onClose, 
  barbershop, 
  barbers, 
  services 
}: { 
  isOpen: boolean
  onClose: () => void
  barbershop: any
  barbers: any[]
  services: any[]
}) {
  const [step, setStep] = useState(1)
  const supabase = createClient()
  
  // Selections
  const [selectedService, setSelectedService] = useState<any>(null)
  const [selectedBarber, setSelectedBarber] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState<string>('')
  const [selectedTime, setSelectedTime] = useState<string>('')
  
  // Client Data
  const [clientData, setClientData] = useState({ name: '', phone: '', email: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Availability
  const [availableTimes, setAvailableTimes] = useState<string[]>([])
  const [loadingTimes, setLoadingTimes] = useState(false)

  const handleNext = () => setStep(s => s + 1)
  const handlePrev = () => setStep(s => s - 1)

  const handleSubmit = async () => {
    setLoading(true)
    
    try {
      const scheduledAt = new Date(`${selectedDate}T${selectedTime}:00-03:00`).toISOString()
      
      const { error } = await supabase
        .from('appointments')
        .insert({
          barbershop_id: barbershop.id,
          barber_id: selectedBarber?.id === 'any' ? null : selectedBarber?.id,
          service_id: selectedService?.id,
          client_name: clientData.name,
          client_phone: clientData.phone,
          client_email: clientData.email,
          scheduled_at: scheduledAt,
          status: 'pending',
          payment_status: 'pending',
          price: selectedService?.price,
          source: 'website'
        })

      if (error) throw error

      setSuccess(true)
    } catch (error) {
      console.error('Erro ao agendar:', error)
      alert('Não foi possível realizar o agendamento. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Mock days
  const upcomingDays = Array.from({length: 14}, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() + i)
    return d
  })

  // Base times for a day (09:00 to 18:00 every 30 mins)
  const baseTimes = ['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00']

  useEffect(() => {
    if (selectedDate && step === 3) {
      fetchAvailableTimes()
    }
  }, [selectedDate, step, selectedBarber, selectedService])

  const fetchAvailableTimes = async () => {
    setLoadingTimes(true)
    try {
      // Setup date boundaries for the selected day
      const startDate = new Date(`${selectedDate}T00:00:00-03:00`).toISOString()
      const endDate = new Date(`${selectedDate}T23:59:59-03:00`).toISOString()

      let query = supabase
        .from('appointments')
        .select('scheduled_at, service_id') // we ideally would join services to get duration, but for now we'll assume standard duration if not found
        .eq('barbershop_id', barbershop.id)
        .gte('scheduled_at', startDate)
        .lte('scheduled_at', endDate)
        .in('status', ['pending', 'confirmed'])

      if (selectedBarber && selectedBarber.id !== 'any') {
        query = query.eq('barber_id', selectedBarber.id)
      }

      const { data, error } = await query

      if (error) throw error

      const bookedSlots = (data || []).map(appt => {
        const time = new Date(appt.scheduled_at)
        const minutes = time.getHours() * 60 + time.getMinutes()
        // Assuming average duration of 45 mins for booked slots if we don't have the exact service duration
        return { start: minutes, end: minutes + 45 }
      })

      const serviceDuration = selectedService?.duration_min || 45

      const freeTimes = baseTimes.filter(time => {
        const [h, m] = time.split(':').map(Number)
        const slotStart = h * 60 + m
        const slotEnd = slotStart + serviceDuration

        // Check if this slot overlaps with any booked slot
        const hasOverlap = bookedSlots.some(booked => {
          return (slotStart < booked.end && slotEnd > booked.start)
        })

        // Check if time is in the past if it's today
        const today = new Date()
        const isToday = selectedDate === today.toISOString().split('T')[0]
        const nowMinutes = today.getHours() * 60 + today.getMinutes()
        
        // Require at least 30 min advance booking for today
        if (isToday && slotStart <= nowMinutes + 30) {
           return false 
        }

        return !hasOverlap
      })

      setAvailableTimes(freeTimes)
    } catch (err) {
      console.error('Error fetching times:', err)
      setAvailableTimes(baseTimes) // Fallback to all times on error
    } finally {
      setLoadingTimes(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      
      <div className="premium-card w-full max-w-3xl relative z-10 flex flex-col h-[860px] max-h-[95vh] overflow-hidden bg-[#050505] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-neutral-800 bg-[#0a0a0a]">
          <div className="flex items-center gap-2">
            {step > 1 && !success && (
              <button onClick={handlePrev} className="p-1 hover:bg-neutral-800 rounded-md">
                <ArrowLeft size={18} className="text-neutral-400" />
              </button>
            )}
            <h2 className="font-[family-name:var(--font-display)] text-2xl text-white uppercase tracking-tight">
              {success ? 'Agendamento Confirmado' : 'Agendar Horário'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 text-neutral-500 hover:text-white rounded-md transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Progress Bar */}
        {!success && (
          <div className="h-1 w-full bg-neutral-900">
            <div 
              className="h-full bg-[#ffffff] transition-all duration-300 ease-in-out" 
              style={{ width: `${(step / 5) * 100}%` }}
            />
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
          
          {step === 1 && (
            <div className="animate-fade-in-up">
              <h3 className="text-base font-bold text-white mb-6 uppercase tracking-widest text-center">Escolha o Serviço</h3>
              <div className="space-y-4">
                {services.map(service => (
                  <button 
                    key={service.id}
                    onClick={() => { setSelectedService(service); handleNext() }}
                    className="w-full p-5 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:border-[#ffffff] hover:bg-[#ffffff]/5 transition-all text-left flex justify-between items-center group"
                  >
                    <div>
                      <p className="text-white font-medium group-hover:text-[#ffffff] transition-colors">{service.name}</p>
                      <p className="text-xs text-neutral-500 flex items-center gap-1 mt-1">
                        <Clock size={12} /> {service.duration_min} min
                      </p>
                    </div>
                    <span className="font-bold text-white">{formatCurrency(service.price)}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="animate-fade-in-up">
              <h3 className="text-base font-bold text-white mb-6 uppercase tracking-widest text-center">Escolha o Profissional</h3>
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setSelectedBarber({ id: 'any', name: 'Qualquer Barbeiro' }); handleNext() }}
                  className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:border-[#ffffff] hover:bg-[#ffffff]/5 transition-all flex flex-col items-center gap-4"
                >
                  <div className="w-20 h-20 rounded-full bg-neutral-800 flex items-center justify-center">
                    <User size={30} className="text-neutral-400" />
                  </div>
                  <p className="text-sm font-medium text-white text-center">Qualquer Profissional</p>
                </button>
                
                {barbers.map(barber => (
                  <button 
                    key={barber.id}
                    onClick={() => { setSelectedBarber(barber); handleNext() }}
                    className="p-6 rounded-xl border border-neutral-800 bg-neutral-900/50 hover:border-[#ffffff] hover:bg-[#ffffff]/5 transition-all flex flex-col items-center gap-4"
                  >
                    <div className="w-20 h-20 relative rounded-full overflow-hidden border-2 border-transparent hover:border-[#ffffff] transition-colors flex items-center justify-center bg-neutral-800">
                      {barber.photo_url ? (
                        <Image src={barber.photo_url} alt={barber.name} fill className="object-cover" />
                      ) : (
                        <span className="text-xl font-bold text-neutral-500 uppercase">
                          {barber.name.split(' ').map((n: any) => n[0]).slice(0, 2).join('')}
                        </span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white text-center line-clamp-1">{barber.name}</p>
                      <p className="text-[10px] text-neutral-500 text-center uppercase tracking-widest mt-0.5">{barber.role}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="animate-fade-in-up">
              <h3 className="text-base font-bold text-white mb-6 uppercase tracking-widest text-center">Data e Horário</h3>
              
              <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 font-bold">Datas Disponíveis</p>
              <div className="flex gap-2 overflow-x-auto pb-4 mb-4 scrollbar-hide snap-x">
                {upcomingDays.map((date, i) => {
                  const dateStr = date.toISOString().split('T')[0]
                  const isSelected = selectedDate === dateStr
                  return (
                    <button
                      key={i}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`flex-shrink-0 snap-start w-16 h-20 rounded-xl border flex flex-col items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-[#ffffff] bg-[#ffffff]/10 text-[#ffffff]' 
                          : 'border-neutral-800 bg-neutral-900/50 text-white hover:border-[#ffffff]/50'
                      }`}
                    >
                      <span className="text-[10px] uppercase">{date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}</span>
                      <span className="text-xl font-bold">{date.getDate()}</span>
                      <span className="text-[10px]">{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
                    </button>
                  )
                })}
              </div>

              {selectedDate && (
                <>
                  <p className="text-[10px] text-neutral-500 uppercase tracking-widest mb-2 font-bold animate-fade-in-up">Horários Disponíveis</p>
                  {loadingTimes ? (
                    <div className="flex justify-center py-8">
                      <div className="animate-spin w-6 h-6 rounded-full border-t-2 border-[#ffffff]"></div>
                    </div>
                  ) : availableTimes.length === 0 ? (
                    <div className="text-center py-6 text-neutral-400 text-sm bg-neutral-900/50 rounded-xl border border-neutral-800">
                      Nenhum horário disponível para esta data.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 animate-fade-in-up">
                      {availableTimes.map((time, i) => (
                        <button
                          key={i}
                          onClick={() => { setSelectedTime(time); handleNext() }}
                          className={`py-2 rounded-lg border text-sm font-medium transition-all ${
                            selectedTime === time 
                              ? 'border-[#ffffff] bg-[#ffffff] text-black' 
                              : 'border-neutral-800 bg-neutral-900/50 text-white hover:border-[#ffffff]/50'
                          }`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="animate-fade-in-up">
              <h3 className="text-base font-bold text-white mb-6 uppercase tracking-widest text-center">Seus Dados</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    className="premium-input w-full" 
                    placeholder="Seu nome"
                    value={clientData.name}
                    onChange={e => setClientData({...clientData, name: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">WhatsApp</label>
                  <input 
                    type="tel" 
                    className="premium-input w-full" 
                    placeholder="(00) 00000-0000"
                    value={clientData.phone}
                    onChange={e => setClientData({...clientData, phone: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Email (Opcional)</label>
                  <input 
                    type="email" 
                    className="premium-input w-full" 
                    placeholder="seu@email.com"
                    value={clientData.email}
                    onChange={e => setClientData({...clientData, email: e.target.value})}
                  />
                </div>
                
                <button 
                  onClick={handleNext}
                  disabled={!clientData.name || !clientData.phone}
                  className="btn-neon w-full justify-center mt-4 py-3 disabled:opacity-50"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {step === 5 && !success && (
            <div className="animate-fade-in-up flex flex-col h-full">
              <h3 className="text-base font-bold text-white mb-6 uppercase tracking-widest text-center">Confirmar Agendamento</h3>
              
              <div className="flex-1 space-y-4">
                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800 space-y-3">
                  <div className="flex items-start gap-3">
                    <Scissors className="text-[#ffffff] mt-1" size={18} />
                    <div>
                      <p className="text-sm font-medium text-white">{selectedService?.name}</p>
                      <p className="text-[11px] text-neutral-400">{formatCurrency(selectedService?.price)} • {selectedService?.duration_min} min</p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-neutral-800" />
                  <div className="flex items-start gap-3">
                    <User className="text-[#ffffff] mt-1" size={18} />
                    <div>
                      <p className="text-sm font-medium text-white">{selectedBarber?.name}</p>
                      <p className="text-[11px] text-neutral-400">Profissional selecionado</p>
                    </div>
                  </div>
                  <div className="w-full h-px bg-neutral-800" />
                  <div className="flex items-start gap-3">
                    <Calendar className="text-[#ffffff] mt-1" size={18} />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedTime}
                      </p>
                      <p className="text-[11px] text-neutral-400">{barbershop?.name}</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-neutral-900 border border-neutral-800">
                  <p className="text-[10px] uppercase text-neutral-500 font-bold mb-2">Dados do Cliente</p>
                  <p className="text-sm text-white font-medium">{clientData.name}</p>
                  <p className="text-xs text-neutral-400">{clientData.phone}</p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-neutral-800">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-neutral-400 text-sm">Total a pagar no local</span>
                  <span className="text-[#ffffff] font-bold text-xl">{formatCurrency(selectedService?.price)}</span>
                </div>
                <button 
                  onClick={handleSubmit}
                  disabled={loading}
                  className="btn-neon w-full justify-center py-3 text-sm disabled:opacity-50"
                >
                  {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </div>
          )}

          {success && (
            <div className="h-full flex flex-col items-center justify-center text-center animate-fade-in-up pb-10">
              <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-green-500" />
              </div>
              <h2 className="font-[family-name:var(--font-display)] text-3xl uppercase text-white mb-2">Confirmado!</h2>
              <p className="text-neutral-400 text-sm mb-8 max-w-xs">
                Seu horário com <strong>{selectedBarber?.name}</strong> foi agendado para o dia <strong>{new Date(selectedDate).toLocaleDateString('pt-BR')} às {selectedTime}</strong>.
              </p>
              <button onClick={onClose} className="btn-outline">
                Fechar
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
