'use client'

import { useState, useEffect } from 'react'
import { Save, UploadCloud, Link as LinkIcon, Bell, Calendar, Store, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('geral')
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [barbershop, setBarbershop] = useState<any | null>(null)

  // Form states
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [email, setEmail] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [tagline, setTagline] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#ffffff')
  const [logoUrl, setLogoUrl] = useState('')
  const [coverUrl, setCoverUrl] = useState('')
  const [workingHours, setWorkingHours] = useState<any>({
    mon: ['08:00', '20:00'],
    tue: ['08:00', '20:00'],
    wed: ['08:00', '20:00'],
    thu: ['08:00', '20:00'],
    fri: ['08:00', '20:00'],
    sat: ['08:00', '18:00'],
    sun: null
  })

  useEffect(() => {
    const fetchSettings = async () => {
      setLoading(true)
      const supabase = createClient()
      const { data: userData } = await supabase.auth.getUser()

      if (userData?.user) {
        const { data: shop } = await supabase
          .from('barbershops')
          .select('*')
          .eq('owner_id', userData.user.id)
          .single()

        if (shop) {
          setBarbershop(shop)
          setName(shop.name || '')
          setSlug(shop.slug || '')
          setWhatsapp(shop.whatsapp || '')
          setEmail(shop.email || '')
          setAddress(shop.address || '')
          setCity(shop.city || '')
          setState(shop.state || '')
          setTagline(shop.tagline || '')
          setPrimaryColor(shop.primary_color || '#ffffff')
          setLogoUrl(shop.logo_url || '')
          setCoverUrl(shop.cover_url || '')
          if (shop.working_hours) {
            setWorkingHours(shop.working_hours)
          }
        }
      }
      setLoading(false)
    }

    fetchSettings()
  }, [])

  const handleSave = async () => {
    if (!barbershop) {
      alert('Nenhuma barbearia vinculada identificada.')
      return
    }

    setIsSaving(true)
    const supabase = createClient()
    try {
      const { error } = await supabase
        .from('barbershops')
        .update({
          name,
          slug,
          whatsapp,
          email,
          address,
          city,
          state,
          tagline,
          primary_color: primaryColor,
          logo_url: logoUrl,
          cover_url: coverUrl,
          working_hours: workingHours
        })
        .eq('id', barbershop.id)

      if (error) throw error
      alert('Configurações salvas com sucesso!')
    } catch (err: any) {
      console.error('Error saving settings:', err)
      alert('Erro ao salvar configurações: ' + err.message)
    } finally {
      setIsSaving(false)
    }
  }

  const daysConfig = [
    { id: 'seg', key: 'mon', label: 'Segunda-feira' },
    { id: 'ter', key: 'tue', label: 'Terça-feira' },
    { id: 'qua', key: 'wed', label: 'Quarta-feira' },
    { id: 'qui', key: 'thu', label: 'Quinta-feira' },
    { id: 'sex', key: 'fri', label: 'Sexta-feira' },
    { id: 'sab', key: 'sat', label: 'Sábado' },
    { id: 'dom', key: 'sun', label: 'Domingo' }
  ]

  const handleToggleDay = (key: string) => {
    setWorkingHours((prev: any) => {
      const current = prev[key]
      return {
        ...prev,
        [key]: current === null ? ['08:00', '20:00'] : null
      }
    })
  }

  const handleTimeChange = (key: string, index: number, value: string) => {
    setWorkingHours((prev: any) => {
      const current = prev[key] || ['08:00', '20:00']
      const newTimes = [...current]
      newTimes[index] = value
      return {
        ...prev,
        [key]: newTimes
      }
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <Loader2 className="animate-spin text-white" size={32} />
        <p className="text-sm text-neutral-400">Carregando configurações...</p>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl uppercase tracking-tight text-white">
            Configurações
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Personalize sua barbearia e preferências do sistema.</p>
        </div>
        
        <button 
          onClick={handleSave} 
          disabled={isSaving}
          className="btn-neon py-2 text-xs w-full md:w-auto flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 className="animate-spin" size={16} />
              <span>Salvando...</span>
            </>
          ) : (
            <>
              <Save size={16} />
              <span>Salvar Alterações</span>
            </>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-64 flex-shrink-0">
          <nav className="flex lg:flex-col overflow-x-auto lg:overflow-visible gap-2 pb-2 lg:pb-0">
            <button 
              onClick={() => setActiveTab('geral')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'geral' ? 'bg-[#ffffff]/10 text-[#ffffff]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
            >
              <Store size={18} /> <span className="text-sm font-medium">Dados Gerais</span>
            </button>
            <button 
              onClick={() => setActiveTab('aparencia')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'aparencia' ? 'bg-[#ffffff]/10 text-[#ffffff]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
            >
              <LinkIcon size={18} /> <span className="text-sm font-medium">Página Pública</span>
            </button>
            <button 
              onClick={() => setActiveTab('horarios')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'horarios' ? 'bg-[#ffffff]/10 text-[#ffffff]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
            >
              <Calendar size={18} /> <span className="text-sm font-medium">Horários</span>
            </button>
            <button 
              onClick={() => setActiveTab('notificacoes')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all whitespace-nowrap ${activeTab === 'notificacoes' ? 'bg-[#ffffff]/10 text-[#ffffff]' : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'}`}
            >
              <Bell size={18} /> <span className="text-sm font-medium">Notificações</span>
            </button>
          </nav>
        </div>

        {/* Content Area */}
        <div className="flex-1 premium-card p-6 md:p-8 min-h-[500px]">
          
          {activeTab === 'geral' && (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="font-[family-name:var(--font-display)] text-xl text-white uppercase mb-6 border-b border-neutral-800 pb-4">Informações da Barbearia</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Nome do Estabelecimento</label>
                  <input 
                    type="text" 
                    className="premium-input w-full" 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Slug (URL)</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-neutral-800 bg-neutral-900 text-neutral-500 sm:text-sm">
                      barbersuite.com.br/b/
                    </span>
                    <input 
                      type="text" 
                      className="premium-input rounded-l-none flex-1 min-w-0" 
                      value={slug} 
                      onChange={e => setSlug(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">WhatsApp</label>
                  <input 
                    type="text" 
                    className="premium-input w-full" 
                    value={whatsapp} 
                    onChange={e => setWhatsapp(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Email Público</label>
                  <input 
                    type="email" 
                    className="premium-input w-full" 
                    value={email} 
                    onChange={e => setEmail(e.target.value)} 
                  />
                </div>
              </div>

              <div className="pt-4">
                <h3 className="text-sm font-medium text-white mb-4">Endereço</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-3">
                    <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Logradouro, Número, Complemento</label>
                    <input 
                      type="text" 
                      className="premium-input w-full" 
                      value={address} 
                      onChange={e => setAddress(e.target.value)} 
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Cidade</label>
                    <input 
                      type="text" 
                      className="premium-input w-full" 
                      value={city} 
                      onChange={e => setCity(e.target.value)} 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">UF</label>
                    <input 
                      type="text" 
                      className="premium-input w-full" 
                      value={state} 
                      onChange={e => setState(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'aparencia' && (
            <div className="space-y-8 animate-fade-in-up">
              <h2 className="font-[family-name:var(--font-display)] text-xl text-white uppercase mb-6 border-b border-neutral-800 pb-4">Personalização</h2>
              
              <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                <div className="w-24 h-24 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-[#ffffff] text-2xl font-bold">{name ? name.charAt(0).toUpperCase() : 'B'}</span>
                  )}
                </div>
                <div className="flex-grow w-full">
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">URL do Logo</label>
                  <input 
                    type="text" 
                    className="premium-input w-full text-xs" 
                    placeholder="https://exemplo.com/logo.png" 
                    value={logoUrl} 
                    onChange={e => setLogoUrl(e.target.value)} 
                  />
                  <p className="text-[10px] text-neutral-500 mt-1">Insira uma URL direta para a imagem do logo.</p>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-2">Imagem de Capa (Hero)</label>
                {coverUrl ? (
                  <div className="w-full h-32 rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden relative group mb-2">
                    <img src={coverUrl} alt="Capa" className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setCoverUrl('')}
                      className="absolute top-2 right-2 bg-red-600/85 text-white p-1 rounded hover:bg-red-600 text-xs transition-colors"
                    >
                      Remover
                    </button>
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center flex-col mb-2">
                    <UploadCloud size={24} className="text-neutral-500 mb-2" />
                    <span className="text-xs text-neutral-400">Nenhuma imagem de capa configurada</span>
                  </div>
                )}
                <input 
                  type="text" 
                  className="premium-input w-full text-xs" 
                  placeholder="https://exemplo.com/capa.jpg" 
                  value={coverUrl} 
                  onChange={e => setCoverUrl(e.target.value)} 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Slogan (Tagline)</label>
                  <input 
                    type="text" 
                    className="premium-input w-full" 
                    value={tagline} 
                    onChange={e => setTagline(e.target.value)} 
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Cor Principal</label>
                  <div className="flex gap-4 items-center">
                    <div 
                      className="w-10 h-10 rounded-lg border border-neutral-700 transition-colors" 
                      style={{ backgroundColor: primaryColor }}
                    ></div>
                    <input 
                      type="text" 
                      className="premium-input flex-1 font-mono text-sm" 
                      value={primaryColor} 
                      onChange={e => setPrimaryColor(e.target.value)} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'horarios' && (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="font-[family-name:var(--font-display)] text-xl text-white uppercase mb-6 border-b border-neutral-800 pb-4">Horário de Funcionamento</h2>
              
              <div className="space-y-3">
                {daysConfig.map((day) => {
                  const dayVal = workingHours[day.key]
                  const isActive = dayVal !== null
                  const startVal = dayVal ? dayVal[0] : '08:00'
                  const endVal = dayVal ? dayVal[1] : '20:00'

                  return (
                    <div key={day.id} className="flex items-center gap-4 p-3 rounded-lg bg-neutral-900/50 border border-neutral-800/50">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={isActive} 
                          onChange={() => handleToggleDay(day.key)}
                          className="sr-only peer" 
                        />
                        <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ffffff]"></div>
                      </label>
                      <span className="w-28 text-sm font-medium text-neutral-300">{day.label}</span>
                      
                      {isActive ? (
                        <div className="flex items-center gap-2 flex-1">
                          <input 
                            type="time" 
                            value={startVal} 
                            onChange={e => handleTimeChange(day.key, 0, e.target.value)}
                            className="premium-input px-2 py-1.5 text-sm w-24" 
                          />
                          <span className="text-neutral-500">até</span>
                          <input 
                            type="time" 
                            value={endVal} 
                            onChange={e => handleTimeChange(day.key, 1, e.target.value)}
                            className="premium-input px-2 py-1.5 text-sm w-24" 
                          />
                        </div>
                      ) : (
                        <span className="text-sm text-neutral-600 flex-1 italic">Fechado</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {activeTab === 'notificacoes' && (
            <div className="space-y-6 animate-fade-in-up">
              <h2 className="font-[family-name:var(--font-display)] text-xl text-white uppercase mb-6 border-b border-neutral-800 pb-4">Alertas e Notificações</h2>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ffffff]"></div>
                    </label>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Email de Confirmação</h3>
                    <p className="text-xs text-neutral-500 mt-1">Enviar email para o cliente confirmando o agendamento imediatamente.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ffffff]"></div>
                    </label>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">WhatsApp Lembrete <span className="bg-[#ffffff]/20 text-[#ffffff] text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">PRO</span></h3>
                    <p className="text-xs text-neutral-500 mt-1">Enviar mensagem automática no WhatsApp do cliente 2 horas antes do horário.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" className="sr-only peer" />
                      <div className="w-9 h-5 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#ffffff]"></div>
                    </label>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-white">Notificação de Novo Agendamento</h3>
                    <p className="text-xs text-neutral-500 mt-1">Receber um alerta no sistema a cada nova marcação.</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
