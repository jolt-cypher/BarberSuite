'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Instagram, 
  Phone, 
  Clock, 
  DollarSign, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Upload, 
  Loader2, 
  X,
  Sparkles
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

// ─── Types & Period Constants ──────────────────────────────────────────────────
const PERIODS = ['Este Mês', 'Semana Passada', 'Mês Passado'] as const
type Period = typeof PERIODS[number]

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

export default function TeamPage() {
  const [barbers, setBarbers] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [barbershopId, setBarbershopId] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Period state
  const [period, setPeriod] = useState<Period>('Este Mês')

  // Form & Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBarber, setEditingBarber] = useState<any | null>(null)
  const [formError, setFormError] = useState('')
  const [toastMessage, setToastMessage] = useState('')

  // Form fields state
  const [name, setName] = useState('')
  const [role, setRole] = useState('')
  const [bio, setBio] = useState('')
  const [instagram, setInstagram] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [color, setColor] = useState('#ffffff')
  const [photoUrl, setPhotoUrl] = useState('')
  const [commissionPercent, setCommissionPercent] = useState(50)
  const [workingDays, setWorkingDays] = useState({
    mon: true,
    tue: true,
    wed: true,
    thu: true,
    fri: true,
    sat: true,
    sun: false
  })

  // User role states
  const [isBarberUser, setIsBarberUser] = useState(false)
  const [barberUserId, setBarberUserId] = useState<string | null>(null)

  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Fetch initial data
  useEffect(() => {
    fetchBarbershop()
  }, [])

  useEffect(() => {
    if (barbershopId) {
      fetchData(barbershopId)
    }
  }, [barbershopId])

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => {
      setToastMessage('')
    }, 4000)
  }

  const fetchBarbershop = async () => {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()

    let shopId = null
    let demoActive = false
    let isBarber = false
    let bId = null

    if (userData?.user) {
      // 1. Tenta carregar como proprietário
      const { data: shop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', userData.user.id)
        .maybeSingle()

      if (shop) {
        shopId = shop.id
      } else {
        // 2. Tenta carregar como barbeiro (funcionário) associado
        const { data: barber } = await supabase
          .from('barbers')
          .select('barbershop_id, id')
          .or(`user_id.eq.${userData.user.id},working_hours->>email.eq.${userData.user.email}`)
          .maybeSingle()

        if (barber) {
          shopId = barber.barbershop_id
          isBarber = true
          bId = barber.id
          setIsBarberUser(true)
          setBarberUserId(barber.id)
        }
      }
    } else {
      const isDemo = document.cookie.includes('demo-mode=true')
      if (isDemo) {
        demoActive = true
        setIsDemoMode(true)
        const { data: shop } = await supabase
          .from('barbershops')
          .select('id')
          .eq('slug', 'barbearia-suite')
          .single()
        if (shop) {
          shopId = shop.id
        }
      }
    }

    if (shopId) {
      setBarbershopId(shopId)
      // Chamar fetchData diretamente com as informações locais para evitar atraso de estado assíncrono
      await fetchData(shopId, isBarber, bId)
    } else {
      setLoading(false)
    }
  }

  const fetchData = async (shopId: string, customIsBarber?: boolean, customBarberId?: string | null) => {
    setLoading(true)
    const supabase = createClient()

    const checkIsBarber = customIsBarber !== undefined ? customIsBarber : isBarberUser
    const checkBarberId = customBarberId !== undefined ? customBarberId : barberUserId

    try {
      // 1. Fetch Barbers
      let barbersQuery = supabase
        .from('barbers')
        .select('*')
        .eq('barbershop_id', shopId)

      if (checkIsBarber && checkBarberId) {
        barbersQuery = barbersQuery.eq('id', checkBarberId)
      }

      const { data: barbersData, error: barbersError } = await barbersQuery.order('created_at', { ascending: true })

      if (barbersError) throw barbersError
      
      // If we got barbers, update state
      if (barbersData) {
        setBarbers(barbersData)
      }

      // 2. Fetch Appointments
      let apptsQuery = supabase
        .from('appointments')
        .select('*')
        .eq('barbershop_id', shopId)

      if (checkIsBarber && checkBarberId) {
        apptsQuery = apptsQuery.eq('barber_id', checkBarberId)
      }

      const { data: apptsData, error: apptsError } = await apptsQuery.order('scheduled_at', { ascending: false })

      if (apptsError) throw apptsError

      if (apptsData) {
        setAppointments(apptsData)
      }
    } catch (err: any) {
      console.error('Error fetching data:', err)
      showToast('Erro ao carregar os dados do servidor.')
    } finally {
      setLoading(false)
    }
  }

  // Filter appointments based on period selected
  const filterAppointmentsByPeriod = (appts: any[], periodName: Period) => {
    const now = new Date()
    return appts.filter(appt => {
      if (!appt.scheduled_at) return false
      const date = new Date(appt.scheduled_at)
      
      if (periodName === 'Este Mês') {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
      } else if (periodName === 'Semana Passada') {
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return date >= oneWeekAgo && date <= now
      } else if (periodName === 'Mês Passado') {
        const prevMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
        const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        return date.getMonth() === prevMonth && date.getFullYear() === prevYear
      }
      return true
    })
  }

  // Compute dynamic commission rows for table
  const getCommissionRows = () => {
    const filteredAppts = filterAppointmentsByPeriod(appointments, period)

    return barbers.map(barber => {
      const barberAppts = filteredAppts.filter(appt => appt.barber_id === barber.id)
      const validAppts = barberAppts.filter(appt => appt.status !== 'canceled')
      const count = validAppts.length

      const faturamentoBruto = validAppts.reduce((sum, appt) => sum + Number(appt.price || 0), 0)
      const pctComissao = barber.working_hours?.commission_percent ?? 50

      const pendingAppts = validAppts.filter(appt => appt.payment_status === 'pending')
      const valorPendente = pendingAppts.reduce((sum, appt) => sum + (Number(appt.price || 0) * pctComissao) / 100, 0)
      const valorTotalComissao = (faturamentoBruto * pctComissao) / 100

      const status = valorPendente > 0 ? 'Pendente' : 'Pago'

      return {
        id: barber.id,
        barber: barber.name,
        atendimentos: count,
        faturamentoBruto,
        percentualComissao: pctComissao,
        valorPendente,
        valorTotalComissao,
        status
      }
    })
  }

  const commissionRows = getCommissionRows()

  // Mark all pending commissions of selected period as paid
  const handleMarkPaid = async (barberId: string) => {
    if (!barbershopId) return
    
    const filteredAppts = filterAppointmentsByPeriod(appointments, period)
    const pendingApptIds = filteredAppts
      .filter(appt => appt.barber_id === barberId && appt.payment_status === 'pending' && appt.status !== 'canceled')
      .map(appt => appt.id)

    if (pendingApptIds.length === 0) {
      showToast('Nenhuma comissão pendente encontrada para este período.')
      return
    }

    if (isDemoMode) {
      // In demo mode, locally mark as paid
      setAppointments(prev => prev.map(appt => 
        pendingApptIds.includes(appt.id) ? { ...appt, payment_status: 'paid' } : appt
      ))
      showToast('Modo de Demonstração: Comissões marcadas como pagas localmente!')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('appointments')
        .update({ payment_status: 'paid' })
        .in('id', pendingApptIds)

      if (error) throw error

      showToast('Comissões pagas com sucesso!')
      await fetchData(barbershopId)
    } catch (err: any) {
      console.error('Error marking paid:', err)
      showToast('Erro ao atualizar status de pagamento.')
    } finally {
      setLoading(false)
    }
  }

  // Handle image upload with Base64 fallback
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      setFormError('A imagem deve ter no máximo 2MB.')
      return
    }

    setUploadingImage(true)
    setFormError('')

    // Read local file for instant preview / fallback
    const reader = new FileReader()
    reader.onloadend = () => {
      setPhotoUrl(reader.result as string)
    }
    reader.readAsDataURL(file)

    if (isDemoMode || !barbershopId) {
      setUploadingImage(false)
      showToast('Foto carregada com sucesso.')
      return
    }

    const supabase = createClient()
    const fileExt = file.name.split('.').pop()
    const fileName = `${barbershopId}/${Date.now()}.${fileExt}`

    try {
      const { error: uploadError } = await supabase.storage
        .from('barber-photos')
        .upload(fileName, file)

      if (uploadError) {
        console.warn('Supabase storage upload failed, using Base64 instead:', uploadError)
        // Keep the base64 URL inside state which will be stored directly in db
      } else {
        const { data } = supabase.storage
          .from('barber-photos')
          .getPublicUrl(fileName)
        
        if (data?.publicUrl) {
          setPhotoUrl(data.publicUrl)
        }
      }
      showToast('Foto processada!')
    } catch (err: any) {
      console.warn('Storage process warning:', err)
    } finally {
      setUploadingImage(false)
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  // Add / Edit Click
  const handleCreateClick = () => {
    setEditingBarber(null)
    setName('')
    setRole('')
    setBio('')
    setInstagram('')
    setPhone('')
    setEmail('')
    setColor('#ffffff')
    setPhotoUrl('')
    setCommissionPercent(50)
    setWorkingDays({
      mon: true,
      tue: true,
      wed: true,
      thu: true,
      fri: true,
      sat: true,
      sun: false
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleEditClick = (barber: any) => {
    setEditingBarber(barber)
    setName(barber.name)
    setRole(barber.role)
    setBio(barber.bio || '')
    setInstagram(barber.instagram_url || '')
    setPhone(barber.working_hours?.phone || '')
    setEmail(barber.working_hours?.email || '')
    setColor(barber.color || '#ffffff')
    setPhotoUrl(barber.photo_url || '')
    setCommissionPercent(barber.working_hours?.commission_percent ?? 50)
    
    const wh = barber.working_hours
    setWorkingDays({
      mon: wh?.mon !== null && wh?.mon !== undefined,
      tue: wh?.tue !== null && wh?.tue !== undefined,
      wed: wh?.wed !== null && wh?.wed !== undefined,
      thu: wh?.thu !== null && wh?.thu !== undefined,
      fri: wh?.fri !== null && wh?.fri !== undefined,
      sat: wh?.sat !== null && wh?.sat !== undefined,
      sun: wh?.sun !== null && wh?.sun !== undefined
    })
    setFormError('')
    setIsModalOpen(true)
  }

  // Delete handler
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este barbeiro? Esta ação não pode ser desfeita.')) return

    if (isDemoMode) {
      setBarbers(prev => prev.filter(b => b.id !== id))
      showToast('Modo de Demonstração: Barbeiro excluído localmente.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const { error } = await supabase
        .from('barbers')
        .delete()
        .eq('id', id)

      if (error) throw error

      showToast('Profissional removido da equipe.')
      if (barbershopId) await fetchData(barbershopId)
    } catch (err: any) {
      console.error('Error deleting barber:', err)
      showToast('Erro ao remover o barbeiro do servidor.')
    } finally {
      setLoading(false)
    }
  }

  // Save changes
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('O nome do profissional é obrigatório.')
      return
    }
    if (!barbershopId) {
      setFormError('Erro: Nenhuma barbearia ativa identificada.')
      return
    }

    setSaving(true)

    const barberData = {
      barbershop_id: barbershopId,
      name: name.trim(),
      role: role.trim() || 'Barbeiro',
      bio: bio.trim(),
      color: color,
      instagram_url: instagram.trim() || null,
      photo_url: photoUrl.trim() || null,
      is_active: editingBarber ? editingBarber.is_active : true,
      working_hours: {
        mon: workingDays.mon ? ["08:00", "18:00"] : null,
        tue: workingDays.tue ? ["08:00", "18:00"] : null,
        wed: workingDays.wed ? ["08:00", "18:00"] : null,
        thu: workingDays.thu ? ["08:00", "18:00"] : null,
        fri: workingDays.fri ? ["08:00", "18:00"] : null,
        sat: workingDays.sat ? ["08:00", "18:00"] : null,
        sun: workingDays.sun ? ["08:00", "18:00"] : null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        commission_percent: Number(commissionPercent)
      }
    }

    if (isDemoMode) {
      if (editingBarber) {
        setBarbers(prev => prev.map(b => 
          b.id === editingBarber.id ? { ...b, ...barberData } : b
        ))
        showToast('Modo de Demonstração: Dados atualizados localmente!')
      } else {
        const newBarber = {
          id: String(Date.now()),
          ...barberData,
          created_at: new Date().toISOString()
        }
        setBarbers(prev => [...prev, newBarber])
        showToast('Modo de Demonstração: Barbeiro cadastrado localmente!')
      }
      setSaving(false)
      setIsModalOpen(false)
      return
    }

    const supabase = createClient()

    try {
      if (editingBarber) {
        const { error } = await supabase
          .from('barbers')
          .update(barberData)
          .eq('id', editingBarber.id)

        if (error) throw error
        showToast('Perfil do barbeiro atualizado!')
      } else {
        const { error } = await supabase
          .from('barbers')
          .insert(barberData)

        if (error) throw error
        showToast('Novo profissional cadastrado com sucesso!')
      }

      setIsModalOpen(false)
      await fetchData(barbershopId)
    } catch (err: any) {
      console.error('Error saving barber:', err)
      setFormError(err.message || 'Erro ao salvar. Verifique sua conexão.')
    } finally {
      setSaving(false)
    }
  }

  // Toggle active status directly
  const handleToggleActive = async (barber: any) => {
    const newStatus = !barber.is_active

    if (isDemoMode) {
      setBarbers(prev => prev.map(b => 
        b.id === barber.id ? { ...b, is_active: newStatus } : b
      ))
      showToast(`Status alterado para ${newStatus ? 'Ativo' : 'Inativo'} localmente!`)
      return
    }

    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('barbers')
        .update({ is_active: newStatus })
        .eq('id', barber.id)

      if (error) throw error
      showToast(`Status alterado com sucesso!`)
      if (barbershopId) await fetchData(barbershopId)
    } catch (err: any) {
      console.error('Error toggling active status:', err)
      showToast('Erro ao atualizar status do profissional.')
    }
  }

  // Helper values for totals
  const totalGrossRevenue = commissionRows.reduce((sum, r) => sum + r.faturamentoBruto, 0)
  const totalPendingCommissions = commissionRows.reduce((sum, r) => sum + r.valorPendente, 0)
  const totalPaidCommissions = commissionRows.reduce((sum, r) => sum + (r.valorTotalComissao - r.valorPendente), 0)

  return (
    <div className="p-6 flex flex-col gap-8">
      {/* ── Toast Alert ── */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 premium-card py-3 px-5 flex items-center gap-3 border border-[#ffffff]/20 bg-[#07070a]/95 text-white animate-fade-in shadow-2xl rounded-xl">
          <Sparkles size={16} className="text-yellow-400" />
          <span className="text-xs font-semibold uppercase tracking-wider">{toastMessage}</span>
        </div>
      )}

      {/* ── Demo Warning Banner ── */}
      {isDemoMode && (
        <div className="w-full p-4 rounded-xl border border-yellow-500/20 bg-yellow-500/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-yellow-500 flex-shrink-0" />
            <div>
              <p className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Modo de Demonstração Ativo</p>
              <p className="text-xs text-neutral-400 mt-0.5">As modificações nos profissionais ou comissões serão salvas temporariamente nesta aba do navegador.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl uppercase tracking-tight text-white">
            {isBarberUser ? 'Meu Perfil Profissional' : 'Equipe & Funcionários'}
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            {isBarberUser ? 'Visualização e edição de suas informações e horários de trabalho.' : 'Gerencie seu time de barbeiros, comissões individuais e horários de trabalho.'}
          </p>
        </div>
        {!isBarberUser && (
          <button onClick={handleCreateClick} className="btn-neon py-2.5 px-4 text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <Plus size={16} /> Adicionar Barbeiro
          </button>
        )}
      </div>

      {/* ── Loader Overlay ── */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 size={36} className="animate-spin text-white" />
          <p className="text-xs uppercase tracking-widest text-neutral-500">Buscando equipe...</p>
        </div>
      ) : (
        <>
          {/* ── Team Grid ── */}
          {barbers.length === 0 ? (
            <div className="premium-card p-12 text-center flex flex-col items-center gap-4">
              <AlertCircle size={40} className="text-neutral-600" />
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Nenhum barbeiro cadastrado</h3>
                <p className="text-sm text-neutral-500 mt-1">Adicione seu primeiro profissional para começar a gerenciar sua equipe.</p>
              </div>
              {!isBarberUser && (
                <button onClick={handleCreateClick} className="btn-outline py-2 text-xs uppercase tracking-wider mt-2">
                  Cadastrar Barbeiro
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {barbers.map((member) => (
                <div key={member.id} className={`premium-card p-6 relative overflow-hidden group transition-all duration-300 ${!member.is_active ? 'opacity-60 hover:opacity-80' : ''}`}>
                  {/* Color Accent line */}
                  <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: member.color || '#ffffff' }} />
                  
                  {/* Action buttons */}
                  <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    {isBarberUser ? (
                      <button 
                        onClick={() => handleEditClick(member)}
                        className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-md transition-colors bg-[#0a0a0a]"
                        title="Editar Perfil"
                      >
                        <Edit2 size={14} />
                      </button>
                    ) : (
                      <>
                        <button 
                          onClick={() => handleToggleActive(member)}
                          className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-md transition-colors bg-[#0a0a0a]"
                          title={member.is_active ? 'Desativar Barbeiro' : 'Ativar Barbeiro'}
                        >
                          <CheckCircle size={14} className={member.is_active ? 'text-green-500' : 'text-neutral-500'} />
                        </button>
                        <button 
                          onClick={() => handleEditClick(member)}
                          className="p-1.5 text-neutral-500 hover:text-white hover:bg-neutral-800 rounded-md transition-colors bg-[#0a0a0a]"
                          title="Editar"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(member.id)}
                          className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors bg-[#0a0a0a]"
                          title="Excluir"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>

                  <div className="flex flex-col items-center text-center">
                    {/* Photo */}
                    <div className="relative w-24 h-24 mb-4">
                      <div className="absolute inset-0 rounded-full border-2 border-neutral-800" />
                      <div className="absolute inset-1 rounded-full overflow-hidden bg-neutral-900 flex items-center justify-center">
                        {member.photo_url ? (
                          <Image 
                            src={member.photo_url} 
                            alt={member.name} 
                            fill 
                            className="object-cover grayscale group-hover:grayscale-0 transition-all duration-500" 
                            unoptimized
                          />
                        ) : (
                          <span className="text-xl font-bold text-neutral-600 uppercase">
                            {member.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                          </span>
                        )}
                      </div>
                      <div 
                        className="absolute bottom-0 right-0 w-5 h-5 rounded-full border-2 border-[#1a1a1a] shadow-lg"
                        style={{ backgroundColor: member.color || '#ffffff' }}
                      />
                    </div>

                    <h3 className="font-[family-name:var(--font-display)] text-xl text-white tracking-wide flex items-center gap-2 justify-center">
                      {member.name}
                      {!member.is_active && (
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-500/20">
                          Inativo
                        </span>
                      )}
                    </h3>
                    <p className="text-[#ffffff] text-xs font-bold uppercase tracking-widest mt-1 mb-4">{member.role}</p>
                    
                    <p className="text-neutral-400 text-sm mb-6 line-clamp-3 h-12">
                      {member.bio || 'Sem descrição ou biografia inserida.'}
                    </p>

                    {/* Social/Contact */}
                    <div className="flex items-center gap-4 pt-4 border-t border-neutral-800/50 w-full justify-center text-xs">
                      {member.instagram_url && (
                        <a 
                          href={`https://instagram.com/${member.instagram_url.replace('@', '')}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-neutral-500 hover:text-[#ffffff] transition-colors"
                          title="Instagram"
                        >
                          <Instagram size={18} />
                        </a>
                      )}
                      {member.working_hours?.phone && (
                        <a 
                          href={`https://wa.me/55${member.working_hours.phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer" 
                          className="text-neutral-500 hover:text-[#25D366] transition-colors"
                          title="WhatsApp"
                        >
                          <Phone size={18} />
                        </a>
                      )}
                      
                      <div className="flex items-center gap-1 text-neutral-500" title="Comissão cadastrada">
                        <DollarSign size={15} />
                        <span className="font-bold">{member.working_hours?.commission_percent ?? 50}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ════════════════════════════════════════════════════════════
              COMISSÕES DO PERÍODO
          ════════════════════════════════════════════════════════════ */}
          <div className="flex flex-col gap-6 mt-6">
            {/* Section header + period tabs */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="font-[family-name:var(--font-display)] text-xl uppercase tracking-wide text-white">
                  Comissões do Período
                </h2>
                <p className="text-sm mt-0.5" style={{ color: 'rgba(200,207,224,0.5)' }}>
                  Repasses e status de pagamento gerados a partir dos agendamentos efetuados.
                </p>
              </div>

              {/* Period tabs */}
              <div
                className="flex items-center gap-1 p-1 rounded-xl"
                style={{ background: 'rgba(10,14,26,0.85)', border: '1px solid rgba(255,255,255,0.1)' }}
              >
                {PERIODS.map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all duration-200"
                    style={
                      period === p
                        ? { background: '#ffffff', color: '#030303' }
                        : { color: 'rgba(200,207,224,0.5)' }
                    }
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Commission Table */}
            <div className="premium-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                      {['Barbeiro', 'Atendimentos', 'Fat. Bruto', '% Comissão', 'Comissão Total', 'A Receber (Pendente)', 'Status', 'Ação'].map((h) => (
                        <th
                          key={h}
                          className="text-left px-6 py-4 text-[10px] uppercase font-bold tracking-widest whitespace-nowrap"
                          style={{ color: 'rgba(255,255,255,0.4)' }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {commissionRows.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-8 text-neutral-500 uppercase tracking-widest text-[10px]">
                          Nenhum profissional cadastrado para gerar repasses.
                        </td>
                      </tr>
                    ) : (
                      commissionRows.map((row, idx) => {
                        const isPago = row.status === 'Pago'
                        return (
                          <tr
                            key={row.id}
                            className="transition-colors duration-200 hover:bg-white/[0.02]"
                            style={{
                              borderBottom: idx < commissionRows.length - 1 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                            }}
                          >
                            {/* Barbeiro */}
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                                  style={{ background: 'rgba(255, 255, 255,0.08)', color: '#ffffff', border: '1px solid rgba(255, 255, 255,0.15)' }}
                                >
                                  {row.barber.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                                </div>
                                <span className="text-white font-medium">{row.barber}</span>
                              </div>
                            </td>

                            {/* Atendimentos */}
                            <td className="px-6 py-4">
                              <span className="font-semibold text-white">{row.atendimentos}</span>
                              <span className="text-xs ml-1 animate-pulse text-neutral-500" style={{ color: 'rgba(255,255,255,0.4)' }}>atend.</span>
                            </td>

                            {/* Fat. Bruto */}
                            <td className="px-6 py-4 font-medium text-neutral-300">
                              {fmt(row.faturamentoBruto)}
                            </td>

                            {/* % Comissão */}
                            <td className="px-6 py-4">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}
                              >
                                {row.percentualComissao}%
                              </span>
                            </td>

                            {/* Comissão Total */}
                            <td className="px-6 py-4 font-semibold text-neutral-300">
                              {fmt(row.valorTotalComissao)}
                            </td>

                            {/* A Receber (Pendente) */}
                            <td className="px-6 py-4 font-bold text-white">
                              {row.valorPendente > 0 ? (
                                <span className="text-yellow-400 font-extrabold">{fmt(row.valorPendente)}</span>
                              ) : (
                                <span className="text-green-500 font-semibold">—</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-6 py-4">
                              <span
                                className="flex items-center gap-1.5 w-fit px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase"
                                style={
                                  isPago
                                    ? { background: '#22c55e15', color: '#22c55e', border: '1px solid #22c55e25' }
                                    : { background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b25' }
                                }
                              >
                                {isPago ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                                {row.status}
                              </span>
                            </td>

                            {/* Ação */}
                            <td className="px-6 py-4">
                              {isPago ? (
                                <span className="text-xs text-neutral-600 font-bold uppercase tracking-wider">Tudo Pago ✓</span>
                              ) : (
                                <button
                                  onClick={() => handleMarkPaid(row.id)}
                                  className="text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-lg transition-all duration-200 hover:scale-105 hover:bg-green-500 hover:text-black border border-green-500/25 text-green-400 bg-green-500/10"
                                >
                                  Pagar Repasse
                                </button>
                              )}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Total Gross */}
              <div className="premium-card p-5 flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.2)' }}
                >
                  <TrendingUp size={18} style={{ color: '#60a5fa' }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                    Faturamento Bruto ({period})
                  </p>
                  <p className="text-lg font-bold text-white mt-0.5">{fmt(totalGrossRevenue)}</p>
                </div>
              </div>

              {/* Total Commissions */}
              <div className="premium-card p-5 flex items-center gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255, 255, 255,0.06)', border: '1px solid rgba(255, 255, 255,0.15)' }}
                >
                  <DollarSign size={18} style={{ color: '#ffffff' }} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                    Repasses Pagos ({period})
                  </p>
                  <p className="text-lg font-bold text-green-500 mt-0.5">
                    {fmt(totalPaidCommissions)}
                  </p>
                </div>
              </div>

              {/* Pending Payout */}
              <div
                className="premium-card p-5 flex items-center gap-4"
                style={totalPendingCommissions > 0 ? { border: '1px solid rgba(245,158,11,0.2)' } : {}}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={
                    totalPendingCommissions > 0
                      ? { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }
                      : { background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }
                  }
                >
                  {totalPendingCommissions > 0
                    ? <AlertCircle size={18} style={{ color: '#f59e0b' }} />
                    : <CheckCircle size={18} style={{ color: '#22c55e' }} />
                  }
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                    Pendente de Repasse
                  </p>
                  <p
                    className="text-lg font-bold mt-0.5"
                    style={{ color: totalPendingCommissions > 0 ? '#f59e0b' : '#22c55e' }}
                  >
                    {totalPendingCommissions > 0 ? fmt(totalPendingCommissions) : 'Tudo quitado ✓'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Modal Add / Edit Barber ── */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="premium-card w-full max-w-xl p-6 relative my-8">
            <button 
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-neutral-500 hover:text-white p-1 rounded-md hover:bg-neutral-800 transition-colors"
            >
              <X size={18} />
            </button>

            <h2 className="font-[family-name:var(--font-display)] text-xl text-white uppercase mb-6 flex items-center gap-2">
              {editingBarber ? 'Editar Barbeiro' : 'Adicionar Barbeiro'}
            </h2>
            
            <form onSubmit={handleSave} className="space-y-4">
              {formError && (
                <div className="p-3 bg-red-950/50 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                  <AlertCircle size={14} className="flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Photo Upload Section */}
              <div className="flex items-center gap-4 mb-6">
                <div 
                  onClick={triggerFileInput}
                  className="w-20 h-20 rounded-full bg-neutral-900 border border-neutral-800 flex flex-col items-center justify-center cursor-pointer hover:border-[#ffffff] transition-colors relative overflow-hidden group"
                >
                  {uploadingImage ? (
                    <Loader2 size={18} className="animate-spin text-neutral-500" />
                  ) : photoUrl ? (
                    <>
                      <Image src={photoUrl} alt="Preview" fill className="object-cover" unoptimized />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <Upload size={14} className="text-white" />
                      </div>
                    </>
                  ) : (
                    <>
                      <Plus size={20} className="text-neutral-500 group-hover:text-white transition-colors" />
                      <span className="text-[8px] uppercase tracking-wider text-neutral-600 mt-1">Upload</span>
                    </>
                  )}
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Foto de Perfil</label>
                  <p className="text-xs text-neutral-400">Arraste ou clique para selecionar. Salvo como link no perfil.</p>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileChange} 
                    className="hidden" 
                    accept="image/*" 
                  />
                  {photoUrl && (
                    <button 
                      type="button" 
                      onClick={() => setPhotoUrl('')}
                      className="text-[9px] uppercase tracking-wider text-red-400 font-bold mt-1.5 hover:underline"
                    >
                      Remover foto
                    </button>
                  )}
                </div>
              </div>

              {/* Grid 1: Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Nome Completo</label>
                  <input 
                    type="text" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="premium-input w-full" 
                    placeholder="Ex: Hygor Miguel" 
                    required
                    disabled={isBarberUser}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Cargo / Especialidade</label>
                  <input 
                    type="text" 
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="premium-input w-full" 
                    placeholder="Ex: Mestre Barbeiro" 
                    disabled={isBarberUser}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Email para Acesso</label>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="premium-input w-full text-xs font-mono" 
                    placeholder="barbeiro@email.com" 
                    disabled={isBarberUser || editingBarber !== null}
                  />
                </div>
              </div>

              {/* Textarea: Bio */}
              <div>
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Biografia (Apresentação)</label>
                <textarea 
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="premium-input w-full resize-none h-20" 
                  placeholder="Breve resumo sobre a especialidade e história do profissional que será exibido no booking do cliente..." 
                />
              </div>

              {/* Grid 2: Contacts & Commissions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Instagram</label>
                  <input 
                    type="text" 
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="premium-input w-full" 
                    placeholder="@usuario" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">WhatsApp (Celular)</label>
                  <input 
                    type="text" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="premium-input w-full" 
                    placeholder="62999999999" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Repasse Comissão (%)</label>
                  <input 
                    type="number" 
                    value={commissionPercent}
                    onChange={(e) => setCommissionPercent(Number(e.target.value))}
                    className="premium-input w-full" 
                    min={0}
                    max={100}
                    placeholder="50" 
                    required
                    disabled={isBarberUser}
                  />
                </div>
              </div>

              {/* Section: Calendar Color */}
              <div>
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1.5">Cor no Calendário (Diferenciação)</label>
                <div className="flex flex-wrap items-center gap-3">
                  {['#ffffff', '#3b82f6', '#22c55e', '#8b5cf6', '#ec4899', '#f97316', '#eab308'].map(c => (
                    <button 
                      key={c} 
                      type="button"
                      onClick={() => setColor(c)}
                      className="w-8 h-8 rounded-full border-2 transition-all flex items-center justify-center" 
                      style={{ 
                        backgroundColor: c,
                        borderColor: color === c ? '#ffffff' : 'transparent',
                        boxShadow: color === c ? '0 0 10px rgba(255,255,255,0.4)' : 'none'
                      }} 
                    />
                  ))}
                  <div className="flex items-center gap-2 pl-2 border-l border-neutral-800">
                    <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-bold">Personalizada</span>
                    <input 
                      type="color" 
                      value={color}
                      onChange={(e) => setColor(e.target.value)}
                      className="w-8 h-8 rounded-full border-0 p-0 cursor-pointer overflow-hidden bg-transparent" 
                    />
                  </div>
                </div>
              </div>

              {/* Section: Working Days (Accordion styled Checkbox group) */}
              <div className="border-t border-neutral-800 pt-4 mt-2">
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-2 flex items-center gap-1.5">
                  <Clock size={12} /> Dias de Atendimento
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { key: 'mon', label: 'Seg' },
                    { key: 'tue', label: 'Ter' },
                    { key: 'wed', label: 'Qua' },
                    { key: 'thu', label: 'Qui' },
                    { key: 'fri', label: 'Sex' },
                    { key: 'sat', label: 'Sáb' },
                    { key: 'sun', label: 'Dom' }
                  ].map(day => {
                    const isChecked = workingDays[day.key as keyof typeof workingDays]
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => setWorkingDays(prev => ({ ...prev, [day.key]: !isChecked }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                          isChecked 
                            ? 'bg-[#ffffff] text-black border-[#ffffff]' 
                            : 'bg-neutral-900 text-neutral-500 border-neutral-800 hover:border-neutral-700'
                        }`}
                      >
                        {day.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Submit / Action buttons */}
              <div className="flex gap-3 pt-6 border-t border-neutral-800">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="btn-outline flex-1 justify-center py-2.5 text-xs font-bold uppercase tracking-wider"
                  disabled={saving}
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="btn-neon flex-1 justify-center py-2.5 text-xs font-bold uppercase tracking-wider flex items-center gap-2"
                  disabled={saving}
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Perfil'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
