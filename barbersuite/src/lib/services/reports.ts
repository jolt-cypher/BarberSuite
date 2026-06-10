import { createClient } from '@/lib/supabase/client'
import { Barber, Service, Appointment, Review } from '@/lib/types'

export interface ReportsData {
  barbers: Barber[]
  services: Service[]
  appointments: Appointment[]
  reviews: Review[]
}

export const reportsService = {
  /**
   * Retrieves the current user's barbershop ID
   */
  async getBarbershopId(): Promise<string | null> {
    const supabase = createClient()
    const { data: userData, error: userError } = await supabase.auth.getUser()
    
    if (userError || !userData?.user) {
      return null
    }

    const { data: shop, error: shopError } = await supabase
      .from('barbershops')
      .select('id')
      .eq('owner_id', userData.user.id)
      .single()

    if (shopError || !shop) {
      console.error('Error fetching barbershop:', shopError)
      return null
    }

    return shop.id
  },

  /**
   * Fetches all core data needed for the reports dashboard
   * Uses Promise.all to fetch them in parallel for optimal performance
   */
  async fetchReportsData(barbershopId: string): Promise<ReportsData> {
    const supabase = createClient()
    
    const [barbersRes, servicesRes, appointmentsRes, reviewsRes] = await Promise.all([
      supabase.from('barbers').select('*').eq('barbershop_id', barbershopId),
      supabase.from('services').select('*').eq('barbershop_id', barbershopId),
      supabase.from('appointments').select('*').eq('barbershop_id', barbershopId),
      supabase.from('reviews').select('*').eq('barbershop_id', barbershopId),
    ])

    if (barbersRes.error) console.error('Error fetching barbers:', barbersRes.error)
    if (servicesRes.error) console.error('Error fetching services:', servicesRes.error)
    if (appointmentsRes.error) console.error('Error fetching appointments:', appointmentsRes.error)
    if (reviewsRes.error) console.error('Error fetching reviews:', reviewsRes.error)

    return {
      barbers: (barbersRes.data as Barber[]) || [],
      services: (servicesRes.data as Service[]) || [],
      appointments: (appointmentsRes.data as Appointment[]) || [],
      reviews: (reviewsRes.data as Review[]) || [],
    }
  }
}
