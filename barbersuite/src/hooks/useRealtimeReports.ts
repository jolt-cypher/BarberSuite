import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { reportsService, ReportsData } from '@/lib/services/reports'

interface UseRealtimeReportsReturn extends ReportsData {
  loading: boolean
  error: Error | null
  barbershopId: string | null
}

export function useRealtimeReports(): UseRealtimeReportsReturn {
  const [data, setData] = useState<ReportsData>({
    barbers: [],
    services: [],
    appointments: [],
    reviews: []
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [barbershopId, setBarbershopId] = useState<string | null>(null)

  // 1. Fetch Barbershop ID on Mount
  useEffect(() => {
    reportsService.getBarbershopId()
      .then(id => {
        setBarbershopId(id)
        if (!id) setLoading(false) // Stop loading if no shop found
      })
      .catch(err => {
        console.error('Failed to get barbershop ID:', err)
        setError(err instanceof Error ? err : new Error(String(err)))
        setLoading(false)
      })
  }, [])

  // 2. Fetch Data and Setup Realtime Subscriptions
  useEffect(() => {
    if (!barbershopId) return

    let isMounted = true

    const loadData = async () => {
      try {
        setLoading(true)
        const result = await reportsService.fetchReportsData(barbershopId)
        if (isMounted) {
          setData(result)
        }
      } catch (err) {
        console.error('Failed to load reports data:', err)
        if (isMounted) {
          setError(err instanceof Error ? err : new Error(String(err)))
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    // Initial load
    loadData()

    // Setup Supabase Realtime Channels
    const supabase = createClient()
    const channel = supabase.channel('realtime_reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `barbershop_id=eq.${barbershopId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'services', filter: `barbershop_id=eq.${barbershopId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reviews', filter: `barbershop_id=eq.${barbershopId}` }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'barbers', filter: `barbershop_id=eq.${barbershopId}` }, loadData)
      .subscribe()

    return () => {
      isMounted = false
      supabase.removeChannel(channel)
    }
  }, [barbershopId])

  return {
    ...data,
    loading,
    error,
    barbershopId
  }
}
