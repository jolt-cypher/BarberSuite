'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Scissors, Check, ChevronRight, ChevronLeft, Loader2, UploadCloud, AlertCircle } from 'lucide-react'

// Dummy wrapper for Supabase client since we are simulating the API based on specs
import { createClient } from '@/lib/supabase/client'

const steps = ['Basic Info', 'Branding', 'Details', 'Review']

export default function AddBarbershopPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [globalError, setGlobalError] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    adminEmail: '',
    password: '',
    logo: '',
    primaryColor: '#ffffff',
    secondaryColor: '#ffffff',
    address: '',
    phone: '',
    description: '',
    openingHours: {
      monday: { open: '09:00', close: '18:00', closed: false },
      tuesday: { open: '09:00', close: '18:00', closed: false },
      wednesday: { open: '09:00', close: '18:00', closed: false },
      thursday: { open: '09:00', close: '18:00', closed: false },
      friday: { open: '09:00', close: '19:00', closed: false },
      saturday: { open: '09:00', close: '15:00', closed: false },
      sunday: { open: '00:00', close: '00:00', closed: true },
    }
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    // Check if user is already logged in
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user)
        setFormData(prev => ({
          ...prev,
          adminEmail: user.email || '',
        }))
      }
    })
  }, [])

  useEffect(() => {
    // Generate slug from name
    if (currentStep === 1 && !formData.slug && formData.name) {
      setFormData(prev => ({
        ...prev,
        slug: prev.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '')
      }))
    }
  }, [formData.name, currentStep, formData.slug])

  useEffect(() => {
    // Staggered animations
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const delay = (entry.target as HTMLElement).dataset.delay || '0'
          ;(entry.target as HTMLElement).style.transitionDelay = `${delay}ms`
          entry.target.classList.add('visible')
          observer.unobserve(entry.target)
        }
      })
    }, { threshold: 0.1 })

    document.querySelectorAll('.animate-in').forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [currentStep])

  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {}
    
    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = 'Name is required'
      if (!formData.slug.trim()) newErrors.slug = 'Slug is required'
      else if (!/^[a-z0-9-]+$/.test(formData.slug)) newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens'
      
      if (!currentUser) {
        if (!formData.adminEmail.trim()) newErrors.adminEmail = 'Admin email is required'
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.adminEmail)) newErrors.adminEmail = 'Invalid email format'
        
        if (!formData.password) newErrors.password = 'Password is required'
        else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters'
      }
    }

    if (step === 2) {
      if (!formData.primaryColor) newErrors.primaryColor = 'Primary color is required'
      if (!formData.secondaryColor) newErrors.secondaryColor = 'Secondary color is required'
    }

    if (step === 3) {
      if (!formData.address.trim()) newErrors.address = 'Address is required'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 4))
    }
  }

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleCreate = async () => {
    if (!validateStep(4)) return
    
    setLoading(true)
    setGlobalError('')

    try {
      const supabase = createClient()
      let userId = currentUser?.id

      if (!userId) {
        // 1. Attempt auth signup in Supabase
        const { data: authData, error: signUpError } = await supabase.auth.signUp({
          email: formData.adminEmail,
          password: formData.password,
          options: {
            data: {
              barbershop_name: formData.name,
              slug: formData.slug,
            }
          }
        })

        if (signUpError) throw new Error(signUpError.message)
        userId = authData.user?.id
      }

      // 2. Insert row in barbershops table
      if (userId) {
        const { error: dbError } = await supabase.from('barbershops').insert({
          slug: formData.slug,
          name: formData.name,
          owner_id: userId,
          primary_color: formData.primaryColor,
          address: formData.address,
          phone: formData.phone,
          tagline: formData.description,
          plan: 'pro',
          plan_status: 'active',
        })

        if (dbError) {
          console.error('Barbershop database insert error:', dbError)
          throw new Error('Conta de usuário criada, mas erro ao registrar barbearia no banco de dados.')
        }
      }

      // 3. Try to sign in automatically if not already logged in
      if (!currentUser) {
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: formData.adminEmail,
          password: formData.password,
        })

        setLoading(false)

        if (!signInError && signInData?.session) {
          router.push('/dashboard')
          router.refresh()
        } else {
          // Show success status even if we cannot log in due to email verification
          setGlobalError('Conta criada com sucesso! Por favor, verifique seu e-mail para confirmar seu cadastro antes de acessar o painel.')
        }
      } else {
        setLoading(false)
        router.push('/dashboard')
        router.refresh()
      }
    } catch (err: any) {
      setGlobalError(err.message || 'Failed to create barbershop. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-black relative overflow-x-hidden overflow-y-auto flex font-sans text-neutral-100">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="glow-element"></div>
      </div>
      <div className="fixed inset-0 bg-gradient-to-b from-black to-[#1a1a1a] z-[-1] pointer-events-none" />

      <div className="w-full max-w-lg mx-auto pt-20 pb-28 md:pt-32 px-6 z-10 relative">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-10 animate-in" data-delay="0">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/10 mb-4">
            <Scissors size={24} className="text-white" />
          </div>
          <h1 className="font-display text-3xl uppercase tracking-tight text-white mb-2">Create Your Barbershop</h1>
          <p className="text-neutral-400 text-sm max-w-md mx-auto">Set up your workspace, invite your team, and start managing appointments like a pro.</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-12 relative animate-in" data-delay="100">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-white/10 -translate-y-1/2 z-0"></div>
          <div 
            className="absolute top-1/2 left-0 h-0.5 bg-white -translate-y-1/2 z-0 transition-all duration-500 ease-out" 
            style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
          ></div>
          
          <div className="flex justify-between relative z-10">
            {steps.map((label, i) => {
              const stepNum = i + 1
              const isActive = currentStep === stepNum
              const isCompleted = currentStep > stepNum
              return (
                <div key={label} className="flex flex-col items-center gap-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors duration-300 ${isActive ? 'bg-white text-black border-2 border-white' : isCompleted ? 'bg-black text-white border-2 border-white' : 'bg-black text-neutral-500 border-2 border-neutral-700'}`}>
                    {isCompleted ? <Check size={14} /> : stepNum}
                  </div>
                  <span className={`text-[10px] uppercase tracking-widest ${isActive || isCompleted ? 'text-white' : 'text-neutral-500'}`}>{label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {globalError && (
          <div className="mb-6 p-4 rounded-xl bg-red-500/15 border border-red-500/30 flex items-start gap-3 animate-in">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-red-400 text-sm">{globalError}</p>
          </div>
        )}

        {/* Form Container */}
        <div className="glass-card min-h-[400px] flex flex-col relative overflow-hidden animate-in" data-delay="200">
          
          <div className="flex-1 flex flex-col w-full transition-transform duration-500">
            
            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-5 animate-in" data-delay="100">
                <h2 className="text-xl font-display uppercase tracking-widest text-white mb-2">Basic Information</h2>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">Barbershop Name</label>
                    <input type="text" placeholder="Your barbershop name" 
                      value={formData.name} onChange={e => handleChange('name', e.target.value)}
                      className={`w-full bg-white/5 border ${errors.name ? 'border-red-500' : 'border-white/10 focus:border-white/20'} rounded-xl text-white px-4 py-3 text-sm transition-all outline-none`} />
                    {errors.name && <p className="text-red-400 text-[10px] mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">URL Slug</label>
                    <div className="relative flex items-center">
                      <span className="absolute left-4 text-neutral-500 text-sm">app.barbesuite.com/</span>
                      <input type="text" 
                        value={formData.slug} onChange={e => handleChange('slug', e.target.value)}
                        className={`w-full bg-white/5 border ${errors.slug ? 'border-red-500' : 'border-white/10 focus:border-white/20'} rounded-xl text-white pl-[150px] pr-4 py-3 text-sm transition-all outline-none`} />
                    </div>
                    {errors.slug && <p className="text-red-400 text-[10px] mt-1">{errors.slug}</p>}
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">Admin Email</label>
                    <input type="email" placeholder="admin@example.com" 
                      value={formData.adminEmail} onChange={e => handleChange('adminEmail', e.target.value)}
                      disabled={!!currentUser}
                      className={`w-full bg-white/5 border ${errors.adminEmail ? 'border-red-500' : 'border-white/10 focus:border-white/20'} rounded-xl text-white px-4 py-3 text-sm transition-all outline-none disabled:opacity-50 disabled:cursor-not-allowed`} />
                    {errors.adminEmail && <p className="text-red-400 text-[10px] mt-1">{errors.adminEmail}</p>}
                    {currentUser && <p className="text-green-400 text-[10px] mt-1">Conectado com sua conta existente</p>}
                  </div>
                  {!currentUser && (
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">Password</label>
                      <input type="password" placeholder="Min 8 characters" 
                        value={formData.password} onChange={e => handleChange('password', e.target.value)}
                        className={`w-full bg-white/5 border ${errors.password ? 'border-red-500' : 'border-white/10 focus:border-white/20'} rounded-xl text-white px-4 py-3 text-sm transition-all outline-none`} />
                      {errors.password && <p className="text-red-400 text-[10px] mt-1">{errors.password}</p>}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-5 animate-in" data-delay="100">
                <h2 className="text-xl font-display uppercase tracking-widest text-white mb-2">Branding</h2>
                <div className="flex flex-col gap-8">
                  <div className="flex flex-col gap-5">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">Logo Upload</label>
                      <div className="border-2 border-dashed border-white/20 rounded-xl p-8 flex flex-col items-center justify-center gap-3 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                        <UploadCloud size={32} className="text-neutral-400" />
                        <span className="text-xs text-neutral-400 text-center">Drag & drop your logo or <br/> <span className="text-white underline">browse files</span></span>
                      </div>
                    </div>
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="block text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">Primary Color</label>
                        <div className="flex items-center gap-3">
                          <input type="color" value={formData.primaryColor} onChange={e => handleChange('primaryColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0" />
                          <span className="text-sm font-mono text-neutral-300 uppercase">{formData.primaryColor}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">Secondary Color</label>
                        <div className="flex items-center gap-3">
                          <input type="color" value={formData.secondaryColor} onChange={e => handleChange('secondaryColor', e.target.value)} className="w-10 h-10 rounded cursor-pointer bg-transparent border-0 p-0" />
                          <span className="text-sm font-mono text-neutral-300 uppercase">{formData.secondaryColor}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">Theme Preview</label>
                    <div className="w-full h-full min-h-[200px] border border-white/10 rounded-xl p-6 relative overflow-hidden" style={{ backgroundColor: '#0a0a0a' }}>
                       <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: formData.primaryColor }}></div>
                       <div className="flex flex-col gap-4 mt-2">
                         <div className="w-1/2 h-4 rounded" style={{ backgroundColor: formData.secondaryColor, opacity: 0.8 }}></div>
                         <div className="w-3/4 h-2 rounded bg-neutral-800"></div>
                         <div className="w-2/3 h-2 rounded bg-neutral-800"></div>
                         <button className="mt-4 py-2 px-4 rounded text-xs font-bold uppercase tracking-widest border-none" style={{ backgroundColor: formData.primaryColor, color: '#000' }}>Sample Button</button>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="flex flex-col gap-5 animate-in" data-delay="100">
                <h2 className="text-xl font-display uppercase tracking-widest text-white mb-2">Location & Details</h2>
                <div className="grid grid-cols-1 gap-5">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">Address</label>
                    <input type="text" placeholder="123 Main St, City, Country" 
                      value={formData.address} onChange={e => handleChange('address', e.target.value)}
                      className={`w-full bg-white/5 border ${errors.address ? 'border-red-500' : 'border-white/10 focus:border-white/20'} rounded-xl text-white px-4 py-3 text-sm transition-all outline-none`} />
                    {errors.address && <p className="text-red-400 text-[10px] mt-1">{errors.address}</p>}
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">Phone Number</label>
                    <input type="tel" placeholder="+1 234 567 8900" 
                      value={formData.phone} onChange={e => handleChange('phone', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl text-white px-4 py-3 text-sm transition-all outline-none" />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-neutral-400 font-bold mb-2">Description</label>
                    <textarea placeholder="Tell us about your shop..." rows={3}
                      value={formData.description} onChange={e => handleChange('description', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 focus:border-white/20 rounded-xl text-white px-4 py-3 text-sm transition-all outline-none resize-none"></textarea>
                    <div className="text-[10px] text-neutral-500 mt-1 text-right">{formData.description.length}/500</div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-5 animate-in" data-delay="100">
                <h2 className="text-xl font-display uppercase tracking-widest text-white mb-2">Review & Create</h2>
                <div className="bg-white/5 border border-white/10 rounded-xl p-6 text-sm flex flex-col gap-4">
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Barbershop Name</p>
                      <p className="text-white mt-1">{formData.name}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Slug / URL</p>
                      <p className="text-white mt-1">{formData.slug}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-4 border-b border-white/10 pb-4">
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Admin Email</p>
                      <p className="text-white mt-1">{formData.adminEmail}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Colors</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="w-4 h-4 rounded-full" style={{backgroundColor: formData.primaryColor}}></div>
                        <div className="w-4 h-4 rounded-full" style={{backgroundColor: formData.secondaryColor}}></div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">Address & Contact</p>
                    <p className="text-white mt-1">{formData.address}</p>
                    <p className="text-neutral-400 mt-1">{formData.phone}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-10 pt-6 border-t border-white/10 flex items-center justify-between mt-auto">
              {currentStep > 1 ? (
                <button type="button" onClick={prevStep} className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold">
                  <ChevronLeft size={16} /> Back
                </button>
              ) : <div></div>}

              {currentStep < 4 ? (
                <button type="button" onClick={nextStep} className="bg-white text-black hover:bg-neutral-200 transition-colors px-6 py-2.5 rounded-full flex items-center gap-2 text-xs uppercase tracking-widest font-bold">
                  Next <ChevronRight size={16} />
                </button>
              ) : (
                <button type="button" onClick={handleCreate} disabled={loading} className="bg-white text-black hover:bg-neutral-200 transition-colors px-8 py-2.5 rounded-full flex items-center gap-2 text-xs uppercase tracking-widest font-bold disabled:opacity-50">
                  {loading ? <Loader2 size={16} className="animate-spin" /> : 'Create Barbershop'}
                </button>
              )}
            </div>

          </div>
        </div>
      </div>
    </div>
  )
}
