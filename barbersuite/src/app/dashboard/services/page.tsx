'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Clock, DollarSign, Search, Scissors, ShieldAlert, Store } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function ServicesPage() {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [barbershopId, setBarbershopId] = useState<string | null>(null)
  const [noBarbershop, setNoBarbershop] = useState(false)

  // Form states
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [durationMin, setDurationMin] = useState(45)
  const [category, setCategory] = useState('Corte')
  const [description, setDescription] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<any | null>(null)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    fetchBarbershop()
  }, [])

  useEffect(() => {
    if (barbershopId) {
      fetchServices(barbershopId)
    }
  }, [barbershopId])

  const fetchBarbershop = async () => {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()

    let shopId = null

    if (userData?.user) {
      const { data: shop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', userData.user.id)
        .single()

      if (shop) {
        shopId = shop.id
      }
    } else {
      // Demo mode fallback
      const isDemo = document.cookie.includes('demo-mode=true')
      if (isDemo) {
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
    } else {
      setNoBarbershop(true)
      setLoading(false)
    }
  }

  const fetchServices = async (shopId: string) => {
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('barbershop_id', shopId)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching services:', error)
    } else if (data) {
      setServices(data)
    }
    setLoading(false)
  }

  const handleCreateClick = () => {
    setEditingService(null)
    setName('')
    setPrice('')
    setDurationMin(45)
    setCategory('Corte')
    setDescription('')
    setIsActive(true)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleEditClick = (service: any) => {
    setEditingService(service)
    setName(service.name)
    setPrice(service.price.toString())
    setDurationMin(service.duration_min)
    setCategory(service.category || 'Corte')
    setDescription(service.description || '')
    setIsActive(service.is_active)
    setFormError('')
    setIsModalOpen(true)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    if (!name.trim()) {
      setFormError('O nome do serviço é obrigatório.')
      return
    }
    if (!price.trim() || isNaN(parseFloat(price)) || parseFloat(price) <= 0) {
      setFormError('Insira um preço válido maior que R$ 0.')
      return
    }
    if (!barbershopId) {
      setFormError('Nenhuma barbearia ativa encontrada para salvar o serviço.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    const serviceData = {
      barbershop_id: barbershopId,
      name: name.trim(),
      price: parseFloat(price),
      duration_min: durationMin,
      category: category.trim() || 'Outros',
      description: description.trim(),
      is_active: isActive,
    }

    try {
      if (editingService) {
        // Update existing service
        const { error } = await supabase
          .from('services')
          .update(serviceData)
          .eq('id', editingService.id)

        if (error) throw error
      } else {
        // Insert new service
        const { error } = await supabase
          .from('services')
          .insert({
            ...serviceData,
            sort_order: services.length + 1,
          })

        if (error) throw error
      }

      setIsModalOpen(false)
      fetchServices(barbershopId)
    } catch (err: any) {
      console.error('Error saving service:', err)
      setFormError(err.message || 'Erro ao salvar o serviço. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza de que deseja excluir este serviço? Esta ação não pode ser desfeita.')) return

    const supabase = createClient()
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting service:', error)
      alert('Erro ao excluir o serviço. Verifique se existem agendamentos antigos vinculados a ele.')
    } else if (barbershopId) {
      fetchServices(barbershopId)
    }
  }

  const filteredServices = services.filter((service) =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="p-6">
      {/* Barbearia não configurada */}
      {noBarbershop && (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Store size={28} className="text-neutral-400" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold mb-2">Barbearia não configurada</h2>
            <p className="text-neutral-400 text-sm max-w-md leading-relaxed">
              Sua conta ainda não possui uma barbearia vinculada. Acesse as{' '}
              <strong className="text-white">Configurações</strong> para configurar sua barbearia,
              ou insira um registro na tabela{' '}
              <code className="bg-white/10 px-1 rounded text-white">barbershops</code> com seu{' '}
              <code className="bg-white/10 px-1 rounded text-white">owner_id</code>.
            </p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-left max-w-md w-full">
            <p className="text-amber-400 text-xs font-bold uppercase tracking-widest mb-2">SQL para corrigir</p>
            <pre className="text-amber-300/70 text-xs leading-relaxed whitespace-pre-wrap font-mono">
{`INSERT INTO barbershops (name, slug, owner_id)
SELECT 'Minha Barbearia', 'minha-barbearia', id
FROM auth.users LIMIT 1;`}
            </pre>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl uppercase tracking-tight text-white">
            Serviços
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Gerencie os serviços oferecidos na sua barbearia.</p>
        </div>

        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              placeholder="Buscar serviço..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="premium-input pl-9 py-2 text-sm w-full"
            />
          </div>
          <button onClick={handleCreateClick} className="btn-neon py-2 text-xs whitespace-nowrap">
            <Plus size={16} /> Novo Serviço
          </button>
        </div>
      </div>

      {loading && services.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin w-8 h-8 rounded-full border-t-2 border-white"></div>
          <p className="text-neutral-400 text-sm">Carregando serviços...</p>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="premium-card p-12 text-center flex flex-col items-center justify-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
            <Scissors className="text-neutral-400" size={20} />
          </div>
          <h3 className="text-white text-lg font-bold">Nenhum serviço encontrado</h3>
          <p className="text-neutral-400 text-sm max-w-sm">
            {searchQuery
              ? 'Nenhum serviço corresponde à sua pesquisa.'
              : 'Você ainda não cadastrou nenhum serviço. Clique em "Novo Serviço" para começar!'}
          </p>
          {!searchQuery && (
            <button onClick={handleCreateClick} className="btn-neon mt-2 py-2 text-xs">
              <Plus size={16} /> Criar Primeiro Serviço
            </button>
          )}
        </div>
      ) : (
        /* Services Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-fade-in">
          {filteredServices.map((service) => (
            <div
              key={service.id}
              className={`premium-card p-5 relative overflow-hidden transition-all group ${
                !service.is_active ? 'opacity-50 grayscale' : ''
              }`}
            >
              {/* Action buttons */}
              <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <button
                  onClick={() => handleEditClick(service)}
                  className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
                  title="Editar serviço"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(service.id)}
                  className="p-1.5 text-neutral-400 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors"
                  title="Excluir serviço"
                >
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Category badge */}
              <span className="inline-block px-2.5 py-1 rounded-full bg-[#ffffff]/10 text-[#ffffff] text-[9px] font-bold uppercase tracking-widest mb-3">
                {service.category || 'Geral'}
              </span>

              <h3 className="font-[family-name:var(--font-display)] text-xl text-white mb-2">{service.name}</h3>

              <p className="text-neutral-400 text-sm mb-4 line-clamp-2 min-h-[40px] leading-relaxed">
                {service.description || 'Sem descrição cadastrada.'}
              </p>

              <div className="flex items-center gap-4 pt-4 border-t border-neutral-800/50">
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <DollarSign size={16} className="text-[#ffffff]" />
                  <span className="font-bold">{formatCurrency(service.price)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-neutral-300">
                  <Clock size={16} className="text-[#ffffff]" />
                  <span className="font-medium text-sm">{service.duration_min} min</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSave} className="premium-card w-full max-w-lg p-6 space-y-5 animate-in">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-white uppercase border-b border-white/10 pb-3">
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>

            {formError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2">
                <ShieldAlert size={14} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Nome do Serviço</label>
                <input
                  type="text"
                  required
                  className="premium-input w-full"
                  placeholder="Ex: Corte Degradê, Design de Barba"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Preço (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="premium-input w-full"
                    placeholder="50.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Duração</label>
                  <select
                    className="premium-input w-full appearance-none"
                    value={durationMin}
                    onChange={(e) => setDurationMin(parseInt(e.target.value))}
                  >
                    <option value="15">15 minutos</option>
                    <option value="30">30 minutos</option>
                    <option value="45">45 minutos</option>
                    <option value="60">1 hora</option>
                    <option value="75">1h 15min</option>
                    <option value="90">1h 30min</option>
                    <option value="120">2 horas</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Categoria</label>
                <input
                  type="text"
                  className="premium-input w-full"
                  placeholder="Ex: Corte, Barba, Química, Tratamento"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Descrição</label>
                <textarea
                  className="premium-input w-full resize-none h-24"
                  placeholder="Descreva o que está incluso no serviço..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                    isActive ? 'bg-white/20 border-white/30' : 'bg-white/5 border-white/10 hover:border-white/20'
                  }`}
                >
                  {isActive && <div className="w-2.5 h-2.5 rounded-full bg-white animate-fade-in" />}
                </button>
                <span
                  className="text-sm text-neutral-400 cursor-pointer select-none"
                  onClick={() => setIsActive(!isActive)}
                >
                  Disponível para agendamento online?
                </span>
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="btn-outline flex-1 justify-center py-2 text-xs"
              >
                Cancelar
              </button>
              <button type="submit" disabled={loading} className="btn-neon flex-1 justify-center py-2 text-xs">
                {loading ? 'Salvando...' : 'Salvar Serviço'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
