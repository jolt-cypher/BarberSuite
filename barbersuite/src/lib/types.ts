// BarberSuite — Shared TypeScript Types
// These types mirror the Supabase database schema

export type Plan = 'trial' | 'basic' | 'pro' | 'enterprise'
export type PlanStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'paused'
export type AppointmentStatus = 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'canceled' | 'no_show'
export type PaymentMethod = 'cash' | 'pix' | 'credit_card' | 'debit_card' | 'transfer' | 'other'
export type PaymentStatus = 'pending' | 'paid' | 'refunded'

export interface Barbershop {
  id: string
  slug: string
  name: string
  owner_id: string | null
  logo_url: string | null
  cover_url: string | null
  primary_color: string
  tagline: string | null
  phone: string | null
  whatsapp: string | null
  email: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  plan: Plan
  plan_status: PlanStatus
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  trial_ends_at: string
  is_active: boolean
  working_hours: WorkingHours
  booking_advance_days: number
  cancellation_hours: number
  created_at: string
  updated_at: string
}

export interface WorkingHours {
  mon: [string, string] | null
  tue: [string, string] | null
  wed: [string, string] | null
  thu: [string, string] | null
  fri: [string, string] | null
  sat: [string, string] | null
  sun: [string, string] | null
}

export interface Barber {
  id: string
  barbershop_id: string
  name: string
  role: string
  bio: string | null
  photo_url: string | null
  instagram_url: string | null
  is_active: boolean
  working_hours: WorkingHours | null
  color: string
  created_at: string
}

export interface Client {
  id: string
  barbershop_id: string
  name: string
  phone: string | null
  email: string | null
  notes: string | null
  total_spent: number
  last_visit: string | null
  created_at: string
}

export interface Service {
  id: string
  barbershop_id: string
  name: string
  description: string | null
  price: number
  duration_min: number
  category: string
  is_active: boolean
  sort_order: number
  created_at: string
}

export interface Appointment {
  id: string
  barbershop_id: string
  barber_id: string | null
  service_id: string | null
  client_id: string | null
  client_name: string
  client_phone: string
  client_email: string | null
  scheduled_at: string
  duration_min: number
  ends_at: string
  status: AppointmentStatus
  canceled_reason: string | null
  price: number | null
  tip_amount: number | null
  payment_method: PaymentMethod | null
  payment_status: PaymentStatus
  notes: string | null
  source: string
  created_at: string
  updated_at: string
  // Relations
  barber?: Barber
  service?: Service
  client?: Client
}

export interface Product {
  id: string
  barbershop_id: string
  name: string
  sku: string | null
  description: string | null
  price: number | null
  cost: number | null
  stock_qty: number
  low_stock_alert: number
  image_url: string | null
  supplier: string | null
  category: string | null
  expires_at: string | null
  is_active: boolean
  created_at: string
}

export interface Review {
  id: string
  barbershop_id: string
  appointment_id: string | null
  barber_id: string | null
  client_name: string
  city: string | null
  rating: number
  title: string | null
  comment: string | null
  is_approved: boolean
  created_at: string
}

export interface Expense {
  id: string
  barbershop_id: string
  category: string
  description: string
  amount: number
  payment_method: string | null
  is_recurring: boolean
  recurrence: string | null
  paid_at: string
  receipt_url: string | null
  created_at: string
}

export interface BlockedSlot {
  id: string
  barbershop_id: string
  barber_id: string | null
  starts_at: string
  ends_at: string
  reason: string | null
  is_all_day: boolean
  created_at: string
}

// SaaS Plan limits
export const PLAN_LIMITS = {
  trial: { barbers: 2, services: 5, appointments_per_month: 50 },
  basic: { barbers: 2, services: 10, appointments_per_month: 200 },
  pro: { barbers: 5, services: 30, appointments_per_month: 1000 },
  enterprise: { barbers: Infinity, services: Infinity, appointments_per_month: Infinity },
} as const

export const PLAN_PRICES = {
  basic: 99,
  pro: 199,
  enterprise: 399,
} as const

export const PLAN_NAMES = {
  trial: 'Trial Gratuito',
  basic: 'Basic',
  pro: 'Pro',
  enterprise: 'Enterprise',
} as const
