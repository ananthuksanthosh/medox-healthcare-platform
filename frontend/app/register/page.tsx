'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, User, Phone, ArrowRight, Shield, Calendar } from 'lucide-react'
import { signIn, UserRole } from '@/lib/auth'
import { AlertBox } from '@/components/ui/alert-box'
import { useToast } from '@/hooks/use-toast'
import { BrandHeader, MedoxIcon } from '@/components/ui/brand-header'

function RegisterForm() {
  const router = useRouter()
  const { toast } = useToast()
  
  const role: UserRole = 'patient'
  const roleLabel = 'patient'
  const roleName = 'Patient'

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    dob: '',
    gender: '',
  })

  const getRedirectTo = () => {
    if (typeof window === 'undefined') return '/patient/dashboard'
    const redirect = new URLSearchParams(window.location.search).get('redirect')
    return redirect ?? '/patient/dashboard'
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password,
          role: 'PATIENT',
          phone: formData.phone || null,
          address: formData.address || null,
          gender: formData.gender || null,
          dob: formData.dob ? new Date(formData.dob).toISOString() : null,
        })
      })

      const data = await response.json()

      if (!response.ok) {
        const errorMsg = data.message || data.error || 'Registration failed'
        setError(errorMsg)
        setIsLoading(false)
        return
      }

      // Store token
      signIn(role, data.token)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data.user))

      if (typeof window !== 'undefined') {
        window.localStorage.setItem('medox.userName', formData.fullName || roleName)
      }

      toast({
        title: 'Registration Successful 🎉',
        description: `Welcome to MEDOX, ${formData.fullName || 'User'}! Redirecting to your dashboard...`,
      })

      const redirectTo = getRedirectTo()
      
      setTimeout(() => {
        router.push(redirectTo)
      }, 1000)
    } catch (error: any) {
      console.error(error)
      setError(error.message || 'Something went wrong. Please check your network connection.')
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Sleek SaaS Dark Hero Left Panel */}
      <div 
        style={{ backgroundColor: '#0B0F19' }} 
        className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-between p-16 border-r border-white/5 relative overflow-hidden select-none"
      >
        {/* Background glow graphics */}
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-sky-500/5 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-emerald-500/5 blur-[120px] pointer-events-none" />

        <div className="relative z-10 flex items-center gap-2">
          <MedoxIcon className="h-10 w-10" />
          <div className="flex flex-col">
            <span className="text-2xl font-black bg-gradient-to-r from-sky-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent tracking-wide leading-none mb-1">
              MEDOX
            </span>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest leading-none truncate">
              Advanced Healthcare Platform
            </span>
          </div>
        </div>

        <div className="space-y-8 relative z-10">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/30 bg-sky-500/10 px-3 py-1.5 text-xs font-semibold text-sky-400 tracking-wide">
              ✨ Care • Connect • Cure
            </div>
            <h1 className="text-5xl font-extrabold tracking-tight text-white leading-tight">
              Create Free <br />
              <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                Patient Account
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md">
              Access high-quality medical services, upload clinical reports, and manage appointment bookings directly in one secure patient ecosystem.
            </p>
          </div>
          
          <div className="grid gap-4 border-t border-white/5 pt-8 max-w-md text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 shrink-0">
                <Calendar className="h-5 w-5" />
              </div>
              <span className="text-slate-300 font-medium">Book appointments instantly with top specialists</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                <Shield className="h-5 w-5" />
              </div>
              <span className="text-slate-300 font-medium">Keep your medical histories and reports fully encrypted</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-500 relative z-10 font-medium">
          © 2026 MEDOX Healthcare Platform. All rights reserved.
        </p>
      </div>

      {/* Right Panel Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-background overflow-y-auto">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo View */}
          <div className="mb-8 lg:hidden flex justify-center">
            <Link href="/" className="flex items-center gap-3">
              <BrandHeader collapsed={false} subtitle="Kerala Multi-Hospital Network" />
            </Link>
          </div>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="space-y-1 px-0 sm:px-6">
              <CardTitle className="text-2xl font-bold">
                Create Patient Account
              </CardTitle>
              <CardDescription>
                Enter your details to register on the platform
              </CardDescription>
            </CardHeader>

            <CardContent className="px-0 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <AlertBox
                    variant="error"
                    description={error}
                    onClose={() => setError(null)}
                  />
                )}

                {/* Full Name */}
                <div className="space-y-2">
                  <label htmlFor="fullName" className="text-sm font-medium text-slate-950">
                    Full Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="h-11 pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium text-slate-950">
                    Phone Number *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="e.g. 9876543210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-11 pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-950">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="name@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-11 pl-10"
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="text-sm font-medium text-slate-950">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="h-11 pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="text-sm font-medium text-slate-950">
                    Confirm Password *
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Repeat your password"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      className="h-11 pl-10 pr-10"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-950"
                    >
                      {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                {/* Address (Optional) */}
                <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium text-slate-950">
                    Address <span className="text-xs text-muted-foreground">(optional)</span>
                  </label>
                  <textarea
                    id="address"
                    placeholder="Enter your street address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={2}
                    className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
                  />
                </div>

                {/* Date of Birth (Optional) */}
                <div className="space-y-2">
                  <label htmlFor="dob" className="text-sm font-medium text-slate-950">
                    Date of Birth <span className="text-xs text-muted-foreground">(optional)</span>
                  </label>
                  <Input
                    id="dob"
                    type="date"
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="h-11"
                  />
                </div>

                {/* Submit Action */}
                <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors rounded-lg shadow-sm gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Registering...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Create Patient Account
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                Already have an account?{' '}
                <Link href={`/login?role=${role}`} className="font-semibold text-sky-600 hover:text-sky-500 hover:underline">
                  Sign in
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <RegisterForm />
    </Suspense>
  )
}
