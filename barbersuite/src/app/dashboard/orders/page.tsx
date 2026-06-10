'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, X, Search, FileText, CheckCircle2, ChevronRight, Calculator, CreditCard, Receipt, Clock, Loader2, ShieldAlert, AlertCircle, DollarSign } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

type OrderItem = {
  id: string;
  name: string;
  price: number;
  type: 'service' | 'product';
  quantity: number;
}

type DbOrder = {
  id: string;
  barbershop_id: string;
  client_name: string;
  client_id: string | null;
  barber_id: string | null;
  status: 'open' | 'closed' | 'canceled';
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  payment_method: 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'other' | null;
  notes: string | null;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
}

export default function OrdersPage() {
  const [openOrders, setOpenOrders] = useState<DbOrder[]>([])
  const [closedOrders, setClosedOrders] = useState<DbOrder[]>([])
  
  // Database Catalogs
  const [barbers, setBarbers] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [products, setProducts] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])

  const [loading, setLoading] = useState(true)
  const [barbershopId, setBarbershopId] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)

  // Creation State
  const [clientSearch, setClientSearch] = useState('')
  const [selectedClient, setSelectedClient] = useState<any | null>(null)
  const [showClientSuggestions, setShowClientSuggestions] = useState(false)
  const [selectedBarberId, setSelectedBarberId] = useState('')
  const [selectedItems, setSelectedItems] = useState<OrderItem[]>([])
  const [createError, setCreateError] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  // Checkout Modal State
  const [checkoutOrder, setCheckoutOrder] = useState<DbOrder | null>(null)
  const [discountVal, setDiscountVal] = useState('')
  const [discountType, setDiscountType] = useState<'value' | 'percent'>('value') // 'value' | 'percent'
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'pix' | 'credit_card' | 'debit_card' | 'other'>('pix')
  const [checkoutNotes, setCheckoutNotes] = useState('')
  const [checkoutError, setCheckoutError] = useState('')
  const [isCheckingOut, setIsCheckingOut] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isDemo = document.cookie.includes('demo-mode=true')
    setIsDemoMode(isDemo)
    fetchBarbershop(isDemo)

    // Handle clicks outside client suggestions dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowClientSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (barbershopId) {
      loadAllData(barbershopId)
    }
  }, [barbershopId])

  const fetchBarbershop = async (isDemo: boolean) => {
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
    } else if (isDemo) {
      const { data: shop } = await supabase
        .from('barbershops')
        .select('id')
        .eq('slug', 'barbearia-suite')
        .single()
      if (shop) {
        shopId = shop.id
      }
    }

    if (shopId) {
      setBarbershopId(shopId)
    } else {
      setLoading(false)
      if (isDemo) {
        loadMockData()
      }
    }
  }

  const loadAllData = async (shopId: string) => {
    setLoading(true)
    const supabase = createClient()

    try {
      // 1. Fetch Barbers
      const { data: barbersData } = await supabase
        .from('barbers')
        .select('*')
        .eq('barbershop_id', shopId)
        .eq('is_active', true)

      if (barbersData) {
        setBarbers(barbersData)
        if (barbersData.length > 0) setSelectedBarberId(barbersData[0].id)
      }

      // 2. Fetch Services
      const { data: servicesData } = await supabase
        .from('services')
        .select('*')
        .eq('barbershop_id', shopId)
        .eq('is_active', true)

      if (servicesData) setServices(servicesData)

      // 3. Fetch Products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('barbershop_id', shopId)
        .eq('is_active', true)

      if (productsData) setProducts(productsData)

      // 4. Fetch Clients
      const { data: clientsData } = await supabase
        .from('clients')
        .select('*')
        .eq('barbershop_id', shopId)
        .eq('is_active', true)

      if (clientsData) setClients(clientsData)

      // 5. Fetch Orders
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { data: ordersData, error: ordersErr } = await supabase
        .from('orders')
        .select('*')
        .eq('barbershop_id', shopId)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false })

      if (ordersErr) throw ordersErr

      if (ordersData) {
        // Parse items JSONB to our typed format safely
        const parsedOrders: DbOrder[] = ordersData.map(o => ({
          ...o,
          items: Array.isArray(o.items) ? o.items : []
        }))
        setOpenOrders(parsedOrders.filter(o => o.status === 'open'))
        setClosedOrders(parsedOrders.filter(o => o.status === 'closed'))
      }
    } catch (err) {
      console.error('Error loading orders data:', err)
      if (isDemoMode) loadMockData()
    } finally {
      setLoading(false)
    }
  }

  const loadMockData = () => {
    // Populate catalogs
    setBarbers([
      { id: 'b1', name: 'Hygor Miguel' },
      { id: 'b2', name: 'Rhafael Barber' },
      { id: 'b3', name: 'Rafael Nunes' }
    ])
    setSelectedBarberId('b1')

    setServices([
      { id: 's1', name: 'Corte Degradê', price: 50.00 },
      { id: 's2', name: 'Corte Clássico', price: 45.00 },
      { id: 's3', name: 'Barba Terapia', price: 40.00 },
      { id: 's4', name: 'Pézinho', price: 15.00 }
    ])

    setProducts([
      { id: 'p1', name: 'Pomada Matte', price: 65.00, stock_qty: 12 },
      { id: 'p2', name: 'Óleo para Barba', price: 45.00, stock_qty: 5 },
      { id: 'p3', name: 'Cerveja Artesanal', price: 12.00, stock_qty: 30 }
    ])

    setClients([
      { id: 'c1', name: 'Marcos T.', phone: '11988888888', email: 'marcos@email.com', total_visits: 12, total_spent: 450.00 },
      { id: 'c2', name: 'Lucas Pinheiro', phone: '11977777777', email: 'lucas@email.com', total_visits: 5, total_spent: 220.00 },
      { id: 'c3', name: 'Fernando Silva', phone: '11966666666', email: 'fernando@email.com', total_visits: 1, total_spent: 50.00 }
    ])

    // Populate initial orders
    const mockOpen: DbOrder[] = [
      {
        id: '101',
        barbershop_id: 'demo',
        client_name: 'Marcos T.',
        client_id: 'c1',
        barber_id: 'b1',
        status: 'open',
        items: [
          { id: 's1', name: 'Corte Degradê', price: 50, type: 'service', quantity: 1 },
          { id: 'p3', name: 'Cerveja Artesanal', price: 12, type: 'product', quantity: 1 }
        ],
        subtotal: 62,
        discount: 0,
        total: 62,
        payment_method: null,
        notes: null,
        opened_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
        closed_at: null,
        created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      },
      {
        id: '102',
        barbershop_id: 'demo',
        client_name: 'Lucas Pinheiro',
        client_id: 'c2',
        barber_id: 'b2',
        status: 'open',
        items: [
          { id: 's2', name: 'Corte Clássico', price: 45, type: 'service', quantity: 1 }
        ],
        subtotal: 45,
        discount: 0,
        total: 45,
        payment_method: null,
        notes: null,
        opened_at: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
        closed_at: null,
        created_at: new Date(Date.now() - 20 * 60 * 1000).toISOString()
      }
    ]

    const mockClosed: DbOrder[] = [
      {
        id: '99',
        barbershop_id: 'demo',
        client_name: 'Fernando Silva',
        client_id: 'c3',
        barber_id: 'b1',
        status: 'closed',
        items: [
          { id: 's1', name: 'Corte Degradê', price: 50, type: 'service', quantity: 1 },
          { id: 'p1', name: 'Pomada Matte', price: 65, type: 'product', quantity: 1 }
        ],
        subtotal: 115,
        discount: 15,
        total: 100,
        payment_method: 'pix',
        notes: 'Cliente satisfeito',
        opened_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        closed_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
        created_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString()
      }
    ]

    setOpenOrders(mockOpen)
    setClosedOrders(mockClosed)
  }

  const handleAddItem = (item: any, type: 'service' | 'product') => {
    // Check if product has stock
    if (type === 'product') {
      const stock = item.stock_qty ?? 0
      const currentInCart = selectedItems.find(i => i.id === item.id)?.quantity ?? 0
      if (stock <= currentInCart) {
        alert(`Estoque insuficiente! Apenas ${stock} unidades disponíveis de ${item.name}.`)
        return
      }
    }

    const existingIndex = selectedItems.findIndex(i => i.id === item.id)
    if (existingIndex > -1) {
      const updated = [...selectedItems]
      updated[existingIndex].quantity += 1
      setSelectedItems(updated)
    } else {
      setSelectedItems([...selectedItems, {
        id: item.id,
        name: item.name,
        price: item.price,
        type,
        quantity: 1
      }])
    }
  }

  const handleRemoveItem = (idx: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== idx))
  }

  const handleCreateOrder = async () => {
    setCreateError('')
    if (!clientSearch.trim()) {
      setCreateError('Digite o nome do cliente.')
      return
    }
    if (selectedItems.length === 0) {
      setCreateError('Adicione pelo menos um item à comanda.')
      return
    }

    const subtotal = selectedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0)

    const newOrderPayload: Omit<DbOrder, 'id' | 'created_at'> = {
      barbershop_id: barbershopId || 'demo',
      client_name: selectedClient ? selectedClient.name : clientSearch,
      client_id: selectedClient ? selectedClient.id : null,
      barber_id: selectedBarberId || null,
      status: 'open',
      items: selectedItems,
      subtotal,
      discount: 0,
      total: subtotal,
      payment_method: null,
      notes: null,
      opened_at: new Date().toISOString(),
      closed_at: null
    }

    if (isDemoMode && !barbershopId) {
      // Offline local simulation
      const orderSim: DbOrder = {
        id: Math.random().toString(36).substr(2, 6).toUpperCase(),
        created_at: new Date().toISOString(),
        ...newOrderPayload
      }
      setOpenOrders([orderSim, ...openOrders])
      resetForm()
      return
    }

    if (!barbershopId) {
      setCreateError('Barbearia não encontrada. Faça login novamente.')
      return
    }

    setIsCreating(true)
    const supabase = createClient()
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrderPayload])
        .select('*')

      if (error) throw error

      if (data && data.length > 0) {
        const created: DbOrder = {
          ...data[0],
          items: Array.isArray(data[0].items) ? data[0].items : []
        }
        setOpenOrders([created, ...openOrders])
      }
      resetForm()
    } catch (err: any) {
      console.error('Error inserting comanda:', err)
      setCreateError(err.message || 'Erro ao criar a comanda no banco.')
    } finally {
      setIsCreating(false)
    }
  }

  const resetForm = () => {
    setClientSearch('')
    setSelectedClient(null)
    setSelectedItems([])
    setCreateError('')
    if (barbers.length > 0) setSelectedBarberId(barbers[0].id)
  }

  // Prepares checkout drawer
  const handleOpenCheckout = (order: DbOrder) => {
    setCheckoutOrder(order)
    setDiscountVal('')
    setDiscountType('value')
    setPaymentMethod('pix')
    setCheckoutNotes('')
    setCheckoutError('')
  }

  const calculateFinalTotal = () => {
    if (!checkoutOrder) return 0
    const disc = parseFloat(discountVal) || 0
    if (disc <= 0) return checkoutOrder.subtotal

    if (discountType === 'percent') {
      const calculated = checkoutOrder.subtotal * (1 - disc / 100)
      return Math.max(0, calculated)
    } else {
      return Math.max(0, checkoutOrder.subtotal - disc)
    }
  }

  const handleCloseOrder = async () => {
    setCheckoutError('')
    if (!checkoutOrder) return

    const discNumber = parseFloat(discountVal) || 0
    const finalTotal = calculateFinalTotal()
    const discountAmount = checkoutOrder.subtotal - finalTotal

    if (isDemoMode && !barbershopId) {
      // Offline local simulation
      const updatedOrder: DbOrder = {
        ...checkoutOrder,
        status: 'closed',
        discount: discountAmount,
        total: finalTotal,
        payment_method: paymentMethod,
        notes: checkoutNotes || null,
        closed_at: new Date().toISOString()
      }

      setOpenOrders(openOrders.filter(o => o.id !== checkoutOrder.id))
      setClosedOrders([updatedOrder, ...closedOrders])

      // ERP Simulation: Debit stock
      const updatedProducts = [...products]
      checkoutOrder.items.forEach(item => {
        if (item.type === 'product') {
          const prodIdx = updatedProducts.findIndex(p => p.id === item.id)
          if (prodIdx > -1) {
            updatedProducts[prodIdx].stock_qty = Math.max(0, (updatedProducts[prodIdx].stock_qty || 0) - item.quantity)
          }
        }
      })
      setProducts(updatedProducts)

      // ERP Simulation: Update client CRM totals
      if (checkoutOrder.client_id) {
        const updatedClients = [...clients]
        const clientIdx = updatedClients.findIndex(c => c.id === checkoutOrder.client_id)
        if (clientIdx > -1) {
          updatedClients[clientIdx].total_visits = (updatedClients[clientIdx].total_visits || 0) + 1
          updatedClients[clientIdx].total_spent = (updatedClients[clientIdx].total_spent || 0) + finalTotal
          updatedClients[clientIdx].last_visit_at = new Date().toISOString()
        }
        setClients(updatedClients)
      }

      setCheckoutOrder(null)
      return
    }

    setIsCheckingOut(true)
    const supabase = createClient()
    try {
      // 1. Transactional Update: Update Order in DB
      const { error: orderErr } = await supabase
        .from('orders')
        .update({
          status: 'closed',
          discount: discountAmount,
          total: finalTotal,
          payment_method: paymentMethod,
          notes: checkoutNotes || null,
          closed_at: new Date().toISOString()
        })
        .eq('id', checkoutOrder.id)

      if (orderErr) throw orderErr

      // 2. Transactional Update: Debit stock for each product in the order
      for (const item of checkoutOrder.items) {
        if (item.type === 'product') {
          // Fetch current stock
          const { data: prodData } = await supabase
            .from('products')
            .select('stock_qty')
            .eq('id', item.id)
            .single()

          if (prodData) {
            const currentStock = prodData.stock_qty ?? 0
            const nextStock = Math.max(0, currentStock - item.quantity)

            await supabase
              .from('products')
              .update({ stock_qty: nextStock })
              .eq('id', item.id)
          }
        }
      }

      // 3. Transactional Update: CRM client total visits and total spent increments
      if (checkoutOrder.client_id) {
        const { data: clientData } = await supabase
          .from('clients')
          .select('total_visits, total_spent')
          .eq('id', checkoutOrder.client_id)
          .single()

        if (clientData) {
          const currentVisits = clientData.total_visits ?? 0
          const currentSpent = Number(clientData.total_spent) || 0

          await supabase
            .from('clients')
            .update({
              total_visits: currentVisits + 1,
              total_spent: currentSpent + finalTotal,
              last_visit_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', checkoutOrder.client_id)
        }
      }

      // Refresh DB state
      if (barbershopId) await loadAllData(barbershopId)
      setCheckoutOrder(null)
    } catch (err: any) {
      console.error('Error closing comanda transactionally:', err)
      setCheckoutError(err.message || 'Erro ao realizar a transação de encerramento.')
    } finally {
      setIsCheckingOut(false)
    }
  }

  // --- KPI Calculations (Today Only) ---
  const getTodayKPIs = () => {
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)

    const todayClosed = closedOrders.filter(o => {
      if (!o.closed_at) return false
      const closedDate = new Date(o.closed_at)
      return closedDate >= todayStart
    })

    const openCount = openOrders.length
    const closedCount = todayClosed.length
    
    const todayRevenue = todayClosed.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
    const averageTicket = closedCount > 0 ? todayRevenue / closedCount : 0

    return {
      openCount: String(openCount),
      closedCount: String(closedCount),
      averageTicket: fmt(averageTicket),
      todayRevenue: fmt(todayRevenue)
    }
  }

  const kpis = getTodayKPIs()

  // Suggest matching clients from CRM
  const matchedClients = clientSearch.trim() && !selectedClient
    ? clients.filter(c => 
        c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.phone?.includes(clientSearch)
      ).slice(0, 5)
    : []

  const handleSelectClientSuggestion = (client: any) => {
    setSelectedClient(client)
    setClientSearch(client.name)
    setShowClientSuggestions(false)
  }

  return (
    <div className="flex flex-col gap-8 p-6 min-h-full" style={{ background: '#030303' }}>
      {/* Demo mode badge alert */}
      {isDemoMode && !barbershopId && (
        <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex items-center gap-3">
          <ShieldAlert className="text-white shrink-0 animate-pulse" size={20} />
          <div>
            <p className="text-xs font-semibold text-white uppercase tracking-wider">Modo de Demonstração Ativo</p>
            <p className="text-[11px] text-neutral-400 mt-0.5">Criar comandas, fechar comandas, alterar estoque e acumular fidelidade funcionam em simulação reativa local.</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-display)] text-2xl md:text-3xl font-bold text-white uppercase tracking-tight">
            Comandas & <span className="text-[#ffffff]">Consumo</span>
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'rgba(200,207,224,0.6)' }}>
            Controle de serviços e produtos consumidos em tempo de visita na barbearia.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-white" size={32} />
          <p className="text-sm text-neutral-400">Carregando comandas e registros de vendas...</p>
        </div>
      ) : (
        <>
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Comandas Abertas', value: kpis.openCount, icon: FileText, color: 'text-blue-400' },
              { label: 'Fechadas Hoje', value: kpis.closedCount, icon: CheckCircle2, color: 'text-green-400' },
              { label: 'Ticket Médio (Hoje)', value: kpis.averageTicket, icon: Calculator, color: 'text-purple-400' },
              { label: 'Faturamento de Hoje', value: kpis.todayRevenue, icon: Receipt, color: 'text-[#ffffff]' },
            ].map((kpi, i) => (
              <div key={i} className="premium-card p-6 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    <kpi.icon size={20} className={kpi.color} />
                  </div>
                  <span className="text-sm font-semibold uppercase tracking-wider text-neutral-400">{kpi.label}</span>
                </div>
                <div className="flex items-end justify-between mt-2">
                  <span className="text-2xl font-[family-name:var(--font-display)] font-bold text-white">{kpi.value}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Main Layout: Left (Open Orders) & Right (New Order Form) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left Column: Open Orders List */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Comandas Abertas</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {openOrders.map(order => {
                  const barberObj = barbers.find(b => b.id === order.barber_id)
                  
                  return (
                    <div key={order.id} className="premium-card p-5 border-l-4 flex flex-col justify-between" style={{ borderLeftColor: '#22c55e' }}>
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-white tracking-wide truncate max-w-[150px]">{order.client_name}</h3>
                            <p className="text-[10px] text-[#ffffff] font-bold tracking-widest uppercase mt-1">
                              💈 {barberObj?.name || 'Sem Barbeiro'}
                            </p>
                          </div>
                          <span className="text-xs text-neutral-500 flex items-center gap-1 font-mono">
                            <Clock size={12} /> {new Date(order.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        
                        <div className="space-y-2 mb-4 min-h-[60px] border-t border-white/5 pt-3">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between text-xs">
                              <span className="text-neutral-400 truncate max-w-[160px]">{item.name} {item.quantity > 1 && `(x${item.quantity})`}</span>
                              <span className="text-neutral-200 font-mono">{fmt(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="border-t border-white/5 pt-4 flex justify-between items-center mt-2">
                        <div>
                          <p className="text-[9px] text-neutral-500 uppercase font-bold tracking-widest">Total</p>
                          <p className="text-lg font-bold text-white font-mono">{fmt(order.total)}</p>
                        </div>
                        <button 
                          onClick={() => handleOpenCheckout(order)} 
                          className="btn-outline px-3 py-1.5 text-[10px] hover:bg-[#22c55e]/10 hover:text-[#22c55e] hover:border-[#22c55e]"
                        >
                          Fechar Comanda
                        </button>
                      </div>
                    </div>
                  )
                })}
                
                {openOrders.length === 0 && (
                  <div className="col-span-full premium-card p-12 flex flex-col items-center justify-center text-center">
                    <FileText size={36} className="text-neutral-600 mb-4" />
                    <p className="text-white font-semibold">Nenhuma comanda em andamento</p>
                    <p className="text-xs text-neutral-500 mt-1">Todas as comandas de clientes no salão estão fechadas ou faturadas.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: New Order Form */}
            <div className="premium-card p-6 flex flex-col gap-5 h-fit">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-2">Nova Comanda</h2>

              {createError && (
                <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle size={14} className="shrink-0" />
                  <span>{createError}</span>
                </div>
              )}
              
              {/* Autocomplete Client Name Input */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Cliente *</label>
                <div className="relative">
                  <input 
                    type="text" 
                    placeholder="Nome ou Celular do cliente..."
                    value={clientSearch}
                    onChange={e => {
                      setClientSearch(e.target.value)
                      setSelectedClient(null)
                      setShowClientSuggestions(true)
                    }}
                    onFocus={() => setShowClientSuggestions(true)}
                    className="premium-input w-full"
                  />
                  {selectedClient && (
                    <button 
                      onClick={() => {
                        setSelectedClient(null)
                        setClientSearch('')
                      }} 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {showClientSuggestions && matchedClients.length > 0 && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-[#121212] border border-white/10 rounded-lg overflow-hidden z-20 shadow-xl max-h-48 overflow-y-auto">
                    {matchedClients.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => handleSelectClientSuggestion(c)}
                        className="p-3 text-xs text-neutral-300 hover:bg-white/5 cursor-pointer flex justify-between items-center transition-colors"
                      >
                        <span className="font-semibold text-white">{c.name}</span>
                        <span className="text-[10px] text-neutral-500">{c.phone || 'Sem celular'}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Barber Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Barbeiro Responsável</label>
                <select 
                  value={selectedBarberId}
                  onChange={e => setSelectedBarberId(e.target.value)}
                  className="premium-input w-full appearance-none font-medium"
                >
                  {barbers.map(b => <option key={b.id} value={b.id} className="bg-[#0f0f0f] text-white">{b.name}</option>)}
                  {barbers.length === 0 && <option value="" className="bg-[#0f0f0f] text-white">Sem barbeiros cadastrados</option>}
                </select>
              </div>

              {/* Items Catalog Add Dropdown */}
              <div className="border-t border-white/5 pt-4">
                <label className="block text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-2">Adicionar Itens Consumidos</label>
                <select 
                  className="premium-input w-full appearance-none text-xs"
                  onChange={(e) => {
                    const val = e.target.value
                    if (!val) return

                    const [type, id] = val.split(':')
                    if (type === 'service') {
                      const item = services.find(s => s.id === id)
                      if (item) handleAddItem(item, 'service')
                    } else if (type === 'product') {
                      const item = products.find(p => p.id === id)
                      if (item) handleAddItem(item, 'product')
                    }
                    e.target.value = ""
                  }}
                >
                  <option value="" className="bg-[#0f0f0f]">Adicione um Serviço ou Produto...</option>
                  
                  {services.length > 0 && (
                    <optgroup label="Serviços (Menu)" className="bg-[#0f0f0f] text-neutral-400">
                      {services.map(s => (
                        <option key={`s:${s.id}`} value={`service:${s.id}`} className="text-white">
                          ✂️ {s.name} — {fmt(s.price)}
                        </option>
                      ))}
                    </optgroup>
                  )}

                  {products.length > 0 && (
                    <optgroup label="Produtos (Estoque)" className="bg-[#0f0f0f] text-neutral-400">
                      {products.map(p => {
                        const stock = p.stock_qty ?? 0
                        return (
                          <option 
                            key={`p:${p.id}`} 
                            value={`product:${p.id}`} 
                            className="text-white"
                            disabled={stock <= 0}
                          >
                            📦 {p.name} — {fmt(p.price)} {stock <= 0 ? '(Sem Estoque)' : `(${stock} un)`}
                          </option>
                        )
                      })}
                    </optgroup>
                  )}
                </select>

                {/* Selected Items Cart List */}
                {selectedItems.length > 0 && (
                  <div className="bg-white/5 border border-white/5 rounded-lg p-3 mt-4 space-y-2 max-h-48 overflow-y-auto">
                    {selectedItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-xs">
                        <div className="flex flex-col">
                          <span className="text-neutral-200 font-semibold truncate max-w-[130px]">{item.name}</span>
                          <span className="text-[10px] text-neutral-500 uppercase tracking-widest">{item.type === 'service' ? 'Serviço' : 'Produto'}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-neutral-400 font-mono">
                            {item.quantity}x {fmt(item.price)}
                          </span>
                          <button onClick={() => handleRemoveItem(idx)} className="text-red-400 hover:text-red-300">
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Total and Order Launcher */}
              <div className="mt-auto pt-4 border-t border-white/5">
                <div className="flex justify-between items-end mb-4">
                  <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Total Parcial</span>
                  <span className="text-xl font-bold text-[#ffffff] font-mono">
                    {fmt(selectedItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0))}
                  </span>
                </div>
                
                <button 
                  onClick={handleCreateOrder}
                  disabled={!clientSearch.trim() || selectedItems.length === 0 || isCreating}
                  className={`w-full justify-center py-3 ${(!clientSearch.trim() || selectedItems.length === 0 || isCreating) ? 'btn-outline opacity-50 cursor-not-allowed' : 'btn-neon'}`}
                >
                  {isCreating && <Loader2 className="animate-spin text-black mr-2 inline" size={14} />}
                  Abrir Comanda
                </button>
              </div>
            </div>

          </div>

          {/* Closed Orders History Table */}
          <div className="premium-card flex flex-col mt-4">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h2 className="text-lg font-bold text-white uppercase tracking-wider">Últimas Comandas Fechadas</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Cliente</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Responsável</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500">Itens Vendidos</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-center">Pagamento</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-right">Total Final</th>
                    <th className="p-4 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-center">Encerramento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {closedOrders.slice(0, 10).map((order) => {
                    const barberObj = barbers.find(b => b.id === order.barber_id)
                    const payMethodName = {
                      pix: 'Pix ⚡',
                      cash: 'Dinheiro 💵',
                      credit_card: 'Crédito 💳',
                      debit_card: 'Débito 💳',
                      other: 'Outro'
                    }[order.payment_method || 'other']

                    return (
                      <tr key={order.id} className="hover:bg-white/[0.01] transition-colors">
                        <td className="p-4 font-semibold text-white text-sm">{order.client_name}</td>
                        <td className="p-4 text-xs text-neutral-300">💈 {barberObj?.name || 'Outro'}</td>
                        <td className="p-4 text-xs text-neutral-500 max-w-[200px] truncate">
                          {order.items.map(i => `${i.name} (${i.quantity}x)`).join(', ')}
                        </td>
                        <td className="p-4 text-xs text-center text-neutral-300 font-medium">{payMethodName}</td>
                        <td className="p-4 text-sm text-right font-bold text-white font-mono">{fmt(order.total)}</td>
                        <td className="p-4 text-xs text-center text-neutral-500 font-mono">
                          {order.closed_at ? new Date(order.closed_at).toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                      </tr>
                    )
                  })}

                  {closedOrders.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-12 text-center text-neutral-500 text-xs font-semibold">
                        Nenhuma comanda fechada nos últimos 30 dias.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Advanced Checkout Payment Modal */}
      {checkoutOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="premium-card w-full max-w-lg p-6 relative">
            <button 
              onClick={() => setCheckoutOrder(null)} 
              className="absolute top-4 right-4 text-neutral-500 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            <h2 className="font-[family-name:var(--font-display)] text-xl text-white uppercase font-bold mb-1">
              Checkout & Fechamento
            </h2>
            <p className="text-xs text-neutral-500 mb-6">Comanda ativa para o cliente <span className="text-white font-semibold">{checkoutOrder.client_name}</span></p>

            {checkoutError && (
              <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={14} className="shrink-0" />
                <span>{checkoutError}</span>
              </div>
            )}

            {/* Items Summary list */}
            <div className="bg-white/5 rounded-lg border border-white/5 p-4 mb-6 space-y-2.5 max-h-40 overflow-y-auto">
              <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-widest border-b border-white/5 pb-1.5 mb-2">Itens Selecionados</p>
              {checkoutOrder.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="text-neutral-300">{item.name} <span className="text-neutral-500 font-mono">x{item.quantity}</span></span>
                  <span className="text-white font-mono">{fmt(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Calculation, Discount inputs & Options */}
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1.5">Desconto</label>
                  <input 
                    type="number" 
                    placeholder="Ex: 5" 
                    min="0"
                    value={discountVal}
                    onChange={e => setDiscountVal(e.target.value)}
                    className="premium-input w-full"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1.5">Tipo de Desconto</label>
                  <div className="flex bg-white/5 p-1 rounded-lg border border-white/10">
                    <button 
                      type="button" 
                      onClick={() => setDiscountType('value')}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${discountType === 'value' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'}`}
                    >
                      Real (R$)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setDiscountType('percent')}
                      className={`flex-1 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${discountType === 'percent' ? 'bg-white text-black font-semibold' : 'text-neutral-400 hover:text-white'}`}
                    >
                      Porcent (%)
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1.5">Método de Pagamento</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'pix', label: 'Pix ⚡' },
                    { id: 'cash', label: 'Dinheiro 💵' },
                    { id: 'credit_card', label: 'Crédito 💳' },
                    { id: 'debit_card', label: 'Débito 💳' },
                    { id: 'other', label: 'Outro' }
                  ].map(m => (
                    <button 
                      key={m.id}
                      type="button"
                      onClick={() => setPaymentMethod(m.id as any)}
                      className={`py-2 rounded-lg border text-center transition-all ${paymentMethod === m.id ? 'bg-white text-black font-semibold border-white shadow-lg' : 'bg-white/5 border-white/10 text-neutral-400 text-xs hover:text-white hover:border-white/20'}`}
                    >
                      <span className="text-xs uppercase tracking-wider font-semibold">{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase text-neutral-500 font-bold mb-1.5">Notas da Venda</label>
                <textarea 
                  placeholder="Observações adicionais sobre o atendimento ou venda..." 
                  value={checkoutNotes}
                  onChange={e => setCheckoutNotes(e.target.value)}
                  className="premium-input w-full h-16 resize-none py-2 text-xs"
                />
              </div>
            </div>

            {/* Total Math Checkout Footer Summary */}
            <div className="mt-8 pt-5 border-t border-white/5 flex flex-col gap-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">Subtotal:</span>
                <span className="text-neutral-300 font-mono">{fmt(checkoutOrder.subtotal)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-neutral-500">Desconto Aplicado:</span>
                <span className="text-red-400 font-mono">
                  -{fmt(checkoutOrder.subtotal - calculateFinalTotal())}
                </span>
              </div>
              <div className="flex justify-between items-end border-t border-white/5 pt-3 mb-4">
                <span className="text-xs uppercase font-bold text-neutral-400 tracking-wider">Faturamento Total</span>
                <span className="text-2xl font-bold text-[#ffffff] font-mono">
                  {fmt(calculateFinalTotal())}
                </span>
              </div>

              <div className="flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setCheckoutOrder(null)} 
                  className="btn-outline flex-1 justify-center py-3 text-xs"
                  disabled={isCheckingOut}
                >
                  Voltar
                </button>
                <button 
                  type="button" 
                  onClick={handleCloseOrder}
                  className="btn-neon flex-1 justify-center py-3 text-xs flex items-center gap-1"
                  disabled={isCheckingOut}
                >
                  {isCheckingOut && <Loader2 className="animate-spin" size={14} />}
                  Confirmar & Fechar Comanda
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

