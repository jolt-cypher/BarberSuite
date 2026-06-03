'use client'

import { useState, useEffect } from 'react'
import { Plus, ShoppingBag, DollarSign, Calendar, Search, CreditCard, ChevronRight, User, Loader2 } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const METHOD_LABELS = {
  pix: { label: 'PIX', color: '#00b4d8', bg: 'bg-[#00b4d8]/10' },
  credit_card: { label: 'Crédito', color: '#ffffff', bg: 'bg-[#ffffff]/10' },
  debit_card: { label: 'Débito', color: '#3b82f6', bg: 'bg-blue-500/10' },
  cash: { label: 'Dinheiro', color: '#22c55e', bg: 'bg-green-500/10' },
  transfer: { label: 'Transferência', color: '#8b5cf6', bg: 'bg-purple-500/10' },
  other: { label: 'Outro', color: '#6b7280', bg: 'bg-neutral-800' },
}

export default function SalesPage() {
  const [loading, setLoading] = useState(true)
  const [sales, setSales] = useState<any[]>([])
  const [barbershopId, setBarbershopId] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  // Form States
  const [modalLoading, setModalLoading] = useState(false)
  const [clientName, setClientName] = useState('')
  const [itemsSold, setItemsSold] = useState('')
  const [totalValue, setTotalValue] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('pix')
  const [saleType, setSaleType] = useState('Serviço') // 'Serviço' | 'Produto' | 'Misto'

  const fetchSales = async () => {
    try {
      setLoading(true)
      const supabase = createClient()
      
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: barbershop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('owner_id', user.id)
        .single()

      if (!barbershop) return
      setBarbershopId(barbershop.id)

      // Get completed appointments that have a price (representing sales)
      const { data: appointments, error } = await supabase
        .from('appointments')
        .select('*, services(name)')
        .eq('barbershop_id', barbershop.id)
        .or('status.eq.completed,payment_status.eq.paid')
        .order('scheduled_at', { ascending: false })

      if (error) throw error

      const mappedSales = (appointments || []).map((apt: any) => {
        // Determine type based on notes/source or default
        const isProduct = apt.notes?.toLowerCase().includes('produto') || apt.source === 'product_sale'
        return {
          id: apt.id,
          client_name: apt.client_name || 'Cliente Avulso',
          date: new Date(apt.scheduled_at).toLocaleDateString('pt-BR'),
          items: apt.services?.name || apt.notes || 'Venda manual',
          total: Number(apt.price) || 0,
          method: apt.payment_method || 'other',
          type: isProduct ? 'Produto' : 'Serviço'
        }
      })

      setSales(mappedSales)
    } catch (err) {
      console.error('Error fetching sales:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSales()
  }, [])

  const handleSaveSale = async () => {
    if (!clientName.trim() || !totalValue || !barbershopId) return

    try {
      setModalLoading(true)
      const supabase = createClient()

      // Insert as a completed appointment representing a sale
      const { error } = await supabase.from('appointments').insert({
        barbershop_id: barbershopId,
        client_name: clientName,
        client_phone: 'N/A',
        price: Number(totalValue),
        payment_method: paymentMethod,
        payment_status: 'paid',
        status: 'completed',
        scheduled_at: new Date().toISOString(),
        notes: itemsSold + (saleType === 'Produto' ? ' (Produto)' : ''),
        source: saleType === 'Produto' ? 'product_sale' as any : 'admin' as any,
      })

      if (error) throw error

      // Reset form & close modal
      setClientName('')
      setItemsSold('')
      setTotalValue('')
      setPaymentMethod('pix')
      setSaleType('Serviço')
      setIsModalOpen(false)

      // Refresh list
      await fetchSales()
    } catch (err) {
      console.error('Error saving sale:', err)
      alert('Erro ao salvar venda. Tente novamente.')
    } finally {
      setModalLoading(false)
    }
  }

  const filteredSales = sales.filter(sale => 
    sale.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    sale.items.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Calculations
  const totalRevenue = sales.reduce((acc, sale) => acc + sale.total, 0)
  const productRevenue = sales.filter(s => s.type === 'Produto').reduce((acc, sale) => acc + sale.total, 0)
  const avgTicket = sales.length > 0 ? totalRevenue / sales.length : 0
  const transactionCount = sales.length

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl uppercase tracking-tight text-white">
            Vendas
          </h1>
          <p className="text-neutral-500 text-sm mt-1">Gerencie a receita de serviços e vendas de produtos reais.</p>
        </div>
        
        <div className="flex w-full md:w-auto items-center gap-3">
          <div className="relative w-full md:w-64">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
            <input 
              type="text" 
              placeholder="Buscar venda por cliente ou item..." 
              className="premium-input pl-9 py-2 text-sm w-full"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          <button onClick={async () => {
            if (confirm('Tem certeza que deseja apagar TODOS os agendamentos e vendas fakes do banco de dados? Isso não pode ser desfeito.')) {
              try {
                const supabase = createClient()
                const { error } = await supabase.from('appointments').delete().neq('id', '00000000-0000-0000-0000-000000000000')
                if (error) throw error
                alert('Dados fakes apagados com sucesso! A página será recarregada.')
                window.location.reload()
              } catch (err) {
                console.error(err)
                alert('Erro ao apagar os dados.')
              }
            }
          }} className="btn-outline py-2 text-xs whitespace-nowrap bg-red-950/20 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white transition-colors">
            Zerar Dados Fakes
          </button>
          <button onClick={() => setIsModalOpen(true)} className="btn-neon py-2 text-xs whitespace-nowrap">
            <Plus size={16} /> Registrar Venda
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 size={32} className="animate-spin text-white" />
          <p className="text-sm text-neutral-500">Buscando vendas no banco de dados...</p>
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              { label: 'Faturamento Total', value: formatCurrency(totalRevenue), icon: DollarSign, color: '#ffffff', desc: 'Total real acumulado' },
              { label: 'Vendas de Produtos', value: formatCurrency(productRevenue), icon: ShoppingBag, color: '#3b82f6', desc: 'Itens marcados como Produto' },
              { label: 'Ticket Médio', value: formatCurrency(avgTicket), icon: TrendingUpIcon, color: '#22c55e', desc: 'Média real por venda' },
              { label: 'Total Transações', value: String(transactionCount), icon: CreditCard, color: '#8b5cf6', desc: 'Pagamentos processados' },
            ].map((kpi, i) => (
              <div key={i} className="premium-card p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">{kpi.label}</p>
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${kpi.color}15` }}
                  >
                    <kpi.icon size={18} style={{ color: kpi.color }} />
                  </div>
                </div>
                <p className="font-[family-name:var(--font-display)] text-2xl font-bold text-white">{kpi.value}</p>
                <p className="text-[10px] text-neutral-600 mt-1">{kpi.desc}</p>
              </div>
            ))}
          </div>

          {/* Sales List */}
          <div className="premium-card p-6">
            <h3 className="font-[family-name:var(--font-display)] uppercase tracking-wide text-white text-sm font-bold mb-6">
              Histórico de Transações reais
            </h3>

            <div className="flex flex-col gap-3">
              {filteredSales.length > 0 ? (
                filteredSales.map((sale) => {
                  const config = METHOD_LABELS[sale.method as keyof typeof METHOD_LABELS] ?? METHOD_LABELS.other
                  return (
                    <div 
                      key={sale.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-neutral-900/60 hover:bg-neutral-900 transition-colors border border-white/0 hover:border-white/5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-neutral-800 flex items-center justify-center text-neutral-400 flex-shrink-0">
                          <User size={18} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-semibold text-white truncate">{sale.client_name}</h4>
                          <p className="text-xs text-neutral-400 truncate mt-0.5">{sale.items}</p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase bg-white/5 text-neutral-300">
                              {sale.type}
                            </span>
                            <span className="text-[9px] text-neutral-500 font-medium flex items-center gap-1">
                              <Calendar size={10} /> {sale.date}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6 flex-shrink-0">
                        <span 
                          className={`text-[9px] px-2.5 py-0.5 rounded-full font-bold uppercase ${config.bg}`}
                          style={{ color: config.color }}
                        >
                          {config.label}
                        </span>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white">{formatCurrency(sale.total)}</p>
                          <p className="text-[10px] text-neutral-500">Aprovada</p>
                        </div>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="text-center py-12">
                  <ShoppingBag className="text-neutral-700 mx-auto mb-3" size={32} />
                  <p className="text-xs text-neutral-400 font-medium">Nenhuma venda real registrada ainda.</p>
                  <p className="text-[10px] text-neutral-600 mt-1 max-w-[280px] mx-auto">Use o botão "Registrar Venda" para começar a inserir as suas transações.</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-lg p-6">
            <h2 className="font-[family-name:var(--font-display)] text-xl text-white uppercase mb-6">Nova Venda Real</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Nome do Cliente</label>
                <input 
                  type="text" 
                  className="premium-input w-full" 
                  placeholder="Ex: João da Silva" 
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                />
              </div>
              
              <div>
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Itens Vendidos / Descrição</label>
                <input 
                  type="text" 
                  className="premium-input w-full" 
                  placeholder="Ex: Corte Degradê + Pomada Modeladora" 
                  value={itemsSold}
                  onChange={e => setItemsSold(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Tipo de Venda</label>
                <select 
                  className="premium-input w-full appearance-none"
                  value={saleType}
                  onChange={e => setSaleType(e.target.value)}
                >
                  <option value="Serviço">Serviço (Corte, Barba, etc.)</option>
                  <option value="Produto">Produto (Cera, Pomada, Shampoo, etc.)</option>
                  <option value="Misto">Misto (Serviço + Produto)</option>
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Valor Total (R$)</label>
                  <input 
                    type="number" 
                    className="premium-input w-full" 
                    placeholder="0.00" 
                    value={totalValue}
                    onChange={e => setTotalValue(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1">Método de Pagamento</label>
                  <select 
                    className="premium-input w-full appearance-none"
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value)}
                  >
                    <option value="pix">PIX</option>
                    <option value="credit_card">Cartão de Crédito</option>
                    <option value="debit_card">Cartão de Débito</option>
                    <option value="cash">Dinheiro</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-8">
              <button 
                onClick={() => setIsModalOpen(false)} 
                disabled={modalLoading}
                className="btn-outline flex-1 justify-center py-2 text-xs"
              >
                Cancelar
              </button>
              <button 
                onClick={handleSaveSale} 
                disabled={modalLoading || !clientName || !totalValue}
                className="btn-neon flex-1 justify-center py-2 text-xs flex items-center gap-2"
              >
                {modalLoading ? <Loader2 size={14} className="animate-spin" /> : 'Salvar Venda'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function TrendingUpIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  )
}
