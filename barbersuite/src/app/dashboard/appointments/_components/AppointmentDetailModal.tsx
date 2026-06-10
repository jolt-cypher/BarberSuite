'use client'

import { useState, useEffect } from 'react'
import { X, Calendar, Clock, DollarSign, Check, Trash, Loader2, User } from 'lucide-react'
import { Appointment, PaymentMethod } from '@/lib/types'
import { useAppointmentActions } from '@/hooks/useAppointmentActions'
import { formatCurrency } from '@/lib/utils'

interface AppointmentDetailModalProps {
  appointment: Appointment | null
  barbershopId: string
  isOpen: boolean
  onClose: () => void
  onRefresh: () => void
}

export function AppointmentDetailModal({ appointment, barbershopId, isOpen, onClose, onRefresh }: AppointmentDetailModalProps) {
  const { fetchClientHistory, completeAppointment, deleteAppointment, loadingAction } = useAppointmentActions()
  
  const [activeTab, setActiveTab] = useState<'details' | 'history'>('details')
  const [history, setHistory] = useState<any[]>([])
  const [totalSpent, setTotalSpent] = useState(0)
  const [loadingHistory, setLoadingHistory] = useState(false)
  
  // Completion State
  const [showCompleteForm, setShowCompleteForm] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card')
  const [tipAmount, setTipAmount] = useState<number>(0)
  const [notes, setNotes] = useState('')

  // Deletion State
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    if (isOpen && appointment?.client_phone && activeTab === 'history') {
      loadHistory()
    }
  }, [isOpen, appointment, activeTab])

  const loadHistory = async () => {
    if (!appointment) return
    setLoadingHistory(true)
    const { data, totalSpent } = await fetchClientHistory(barbershopId, appointment.client_phone)
    setHistory(data || [])
    setTotalSpent(totalSpent || 0)
    setLoadingHistory(false)
  }

  const handleComplete = async () => {
    if (!appointment) return
    const res = await completeAppointment(appointment.id, paymentMethod, tipAmount, notes)
    if (res.success) {
      onRefresh()
      onClose()
    } else {
      alert('Erro ao concluir agendamento.')
    }
  }

  const handleDelete = async () => {
    if (!appointment) return
    const res = await deleteAppointment(appointment.id)
    if (res.success) {
      onRefresh()
      onClose()
    } else {
      alert('Erro ao excluir agendamento.')
    }
  }

  if (!isOpen || !appointment) return null

  const isCompleting = loadingAction === `complete-${appointment.id}`
  const isDeleting = loadingAction === `delete-${appointment.id}`

  const scheduledDate = new Date(appointment.scheduled_at)

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
      <div className="premium-card w-full sm:max-w-lg p-6 relative bg-[#0a0a0a] border border-neutral-800 rounded-t-2xl sm:rounded-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-6 shrink-0">
          <div>
            <h2 className="font-[family-name:var(--font-display)] text-xl text-white uppercase tracking-tight flex items-center gap-2">
              <User size={20} className="text-[#ffffff]" /> {appointment.client_name}
            </h2>
            <p className="text-sm text-neutral-400 mt-1">{appointment.client_phone}</p>
          </div>
          <button onClick={onClose} className="p-2 text-neutral-500 hover:text-white transition-colors bg-neutral-900 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-neutral-800 mb-4 shrink-0">
          <button 
            className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'details' ? 'text-[#ffffff] border-b-2 border-[#ffffff]' : 'text-neutral-500 hover:text-neutral-300'}`}
            onClick={() => setActiveTab('details')}
          >
            Detalhes
          </button>
          <button 
            className={`pb-2 text-xs font-bold uppercase tracking-wider transition-colors ${activeTab === 'history' ? 'text-[#ffffff] border-b-2 border-[#ffffff]' : 'text-neutral-500 hover:text-neutral-300'}`}
            onClick={() => setActiveTab('history')}
          >
            Histórico CRM
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {activeTab === 'details' ? (
            <div className="space-y-6">
              
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-800/50">
                  <span className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">
                    <Calendar size={12} /> Data
                  </span>
                  <p className="text-sm text-white font-medium">{scheduledDate.toLocaleDateString('pt-BR')}</p>
                </div>
                <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-800/50">
                  <span className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">
                    <Clock size={12} /> Horário
                  </span>
                  <p className="text-sm text-white font-medium">
                    {scheduledDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="bg-neutral-900/50 p-3 rounded-lg border border-neutral-800/50 col-span-2">
                  <span className="flex items-center gap-1.5 text-[10px] text-neutral-500 uppercase tracking-widest font-bold mb-1">
                    Serviço Solicitado
                  </span>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-white font-medium">{appointment.service?.name || 'Serviço Excluído'}</p>
                    <p className="text-sm text-[#ffffff] font-bold">{formatCurrency(Number(appointment.price) || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Status & Actions Workflow */}
              {appointment.status === 'completed' ? (
                <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl flex items-center justify-center gap-2">
                  <Check size={18} className="text-green-500" />
                  <span className="text-sm font-bold text-green-500 uppercase tracking-wide">Atendimento Concluído</span>
                </div>
              ) : showCompleteForm ? (
                <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-xl space-y-4 animate-in fade-in slide-in-from-bottom-2">
                  <h3 className="text-xs uppercase tracking-widest text-white font-bold mb-3 border-b border-neutral-800 pb-2">Finalizar Atendimento</h3>
                  
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Método de Pagamento</label>
                    <select 
                      className="premium-input w-full appearance-none"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    >
                      <option value="credit_card">Cartão de Crédito</option>
                      <option value="debit_card">Cartão de Débito</option>
                      <option value="pix">PIX</option>
                      <option value="cash">Dinheiro</option>
                      <option value="other">Outro / Carteira Digital</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Gorjeta / Caixinha (Opcional)</label>
                    <div className="relative">
                      <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                      <input 
                        type="number" 
                        min="0"
                        step="0.01"
                        className="premium-input w-full pl-8" 
                        placeholder="0.00"
                        value={tipAmount || ''}
                        onChange={(e) => setTipAmount(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Anotações do Corte (Opcional)</label>
                    <textarea 
                      className="premium-input w-full resize-none h-20" 
                      placeholder="Ex: Cliente prefere a lateral no pente 1..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button onClick={() => setShowCompleteForm(false)} className="btn-outline flex-1 py-2 text-xs justify-center">Cancelar</button>
                    <button onClick={handleComplete} disabled={isCompleting} className="btn-neon flex-1 py-2 text-xs justify-center bg-green-500/20 text-green-400 border-green-500/50 hover:bg-green-500/30">
                      {isCompleting ? <Loader2 size={14} className="animate-spin" /> : 'Confirmar Pagamento'}
                    </button>
                  </div>
                </div>
              ) : showDeleteConfirm ? (
                <div className="bg-red-500/10 border border-red-500/30 p-4 rounded-xl space-y-4 animate-in fade-in zoom-in-95">
                  <p className="text-sm text-red-400 font-medium text-center">Tem certeza que deseja excluir este agendamento? Esta ação não pode ser desfeita.</p>
                  <div className="flex gap-2">
                    <button onClick={() => setShowDeleteConfirm(false)} className="btn-outline flex-1 py-2 text-xs justify-center">Cancelar</button>
                    <button onClick={handleDelete} disabled={isDeleting} className="btn-neon flex-1 py-2 text-xs justify-center bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30">
                      {isDeleting ? <Loader2 size={14} className="animate-spin" /> : 'Sim, Excluir'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-3 mt-4">
                  <button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    className="p-3 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors flex items-center justify-center gap-2 flex-shrink-0"
                  >
                    <Trash size={16} />
                  </button>
                  <button 
                    onClick={() => setShowCompleteForm(true)} 
                    className="btn-neon flex-1 py-3 justify-center"
                  >
                    <Check size={18} /> Marcar como Concluído
                  </button>
                </div>
              )}

            </div>
          ) : (
            // CRM History Tab
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="flex flex-col items-center justify-center py-10 gap-2 text-neutral-500">
                  <Loader2 className="animate-spin" />
                  <span className="text-xs uppercase tracking-widest font-bold">Buscando histórico...</span>
                </div>
              ) : (
                <>
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 flex justify-between items-center mb-6">
                    <div>
                      <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">Total Gasto na Barbearia</p>
                      <p className="text-xl font-[family-name:var(--font-display)] text-[#ffffff] font-bold">{formatCurrency(totalSpent)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase text-neutral-500 font-bold tracking-widest">Visitas Totais</p>
                      <p className="text-xl font-[family-name:var(--font-display)] text-white font-bold">{history.length}</p>
                    </div>
                  </div>

                  <div className="space-y-3 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-neutral-800 before:to-transparent">
                    {history.length > 0 ? history.map((apt, idx) => (
                      <div key={apt.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-neutral-800 bg-neutral-900 text-neutral-500 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          {apt.status === 'completed' ? <Check size={14} className="text-green-500" /> : <Clock size={14} />}
                        </div>
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-3 rounded-lg border border-neutral-800 bg-neutral-900/50 hover:bg-neutral-900 transition-colors">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[10px] uppercase font-bold text-neutral-500 tracking-widest">
                              {new Date(apt.scheduled_at).toLocaleDateString('pt-BR')}
                            </span>
                            <span className="text-xs font-bold text-[#ffffff]">{formatCurrency(Number(apt.price))}</span>
                          </div>
                          <p className="text-sm text-white font-medium">{apt.services?.name || 'Serviço'}</p>
                          <p className="text-xs text-neutral-400 mt-0.5">com {apt.barber?.name || 'Barbeiro'}</p>
                          {apt.notes && (
                            <p className="text-xs text-neutral-500 mt-2 italic border-t border-neutral-800/50 pt-2">"{apt.notes}"</p>
                          )}
                        </div>
                      </div>
                    )) : (
                      <p className="text-sm text-neutral-500 text-center py-4">Nenhum histórico encontrado para este número de telefone.</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
