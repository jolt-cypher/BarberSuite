import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Appointment, PaymentMethod } from '@/lib/types'

export function useAppointmentActions() {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const supabase = createClient()

  // Completes the appointment and sets payment details
  const completeAppointment = async (
    appointmentId: string, 
    paymentMethod: PaymentMethod, 
    tipAmount: number,
    feedbackNotes?: string
  ) => {
    setLoadingAction(`complete-${appointmentId}`)
    try {
      // Step 1: Update Appointment
      const { error: apptError } = await supabase
        .from('appointments')
        .update({
          status: 'completed',
          payment_status: 'paid',
          payment_method: paymentMethod,
          tip_amount: tipAmount,
          notes: feedbackNotes || null
        })
        .eq('id', appointmentId)

      if (apptError) throw apptError

      return { success: true }
    } catch (error) {
      console.error('Error completing appointment:', error)
      return { success: false, error }
    } finally {
      setLoadingAction(null)
    }
  }

  // Deletes the appointment securely
  const deleteAppointment = async (appointmentId: string) => {
    setLoadingAction(`delete-${appointmentId}`)
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', appointmentId)

      if (error) throw error
      return { success: true }
    } catch (error) {
      console.error('Error deleting appointment:', error)
      return { success: false, error }
    } finally {
      setLoadingAction(null)
    }
  }

  // Fetch client history based on phone (or client_id if migrated)
  const fetchClientHistory = async (barbershopId: string, clientPhone: string) => {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select('*, services(name, price), barber:barbers(name)')
        .eq('barbershop_id', barbershopId)
        .eq('client_phone', clientPhone)
        .order('scheduled_at', { ascending: false })

      if (error) throw error
      
      const history = data || []
      const totalSpent = history
        .filter(a => a.payment_status === 'paid' || a.status === 'completed')
        .reduce((sum, a) => sum + (Number(a.price) || 0) + (Number(a.tip_amount) || 0), 0)

      return { success: true, data: history, totalSpent }
    } catch (error) {
      console.error('Error fetching client history:', error)
      return { success: false, data: [], totalSpent: 0, error }
    }
  }

  return {
    loadingAction,
    completeAppointment,
    deleteAppointment,
    fetchClientHistory
  }
}
