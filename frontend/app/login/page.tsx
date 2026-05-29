'use client'

import { useState, Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card'

import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight
} from 'lucide-react'
import { signIn, type UserRole } from '@/lib/auth'
import { AlertBox } from '@/components/ui/alert-box'
import { useToast } from '@/hooks/use-toast'
import { BrandHeader, MedoxIcon } from '@/components/ui/brand-header'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  const roleParam = searchParams?.get('role') || 'patient'

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: roleParam,
  })

  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      role: roleParam
    }))
  }, [roleParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(
        'http://localhost:5000/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
            role: formData.role
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setIsLoading(false)
        setError(data.message || 'Login failed')
        return
      }

      const normalizedRole = String(data.user?.role || 'patient').toLowerCase()
      const userRole: UserRole =
        normalizedRole === 'doctor'
          ? 'doctor'
          : normalizedRole === 'admin'
            ? 'admin'
            : 'patient'

      const defaultDashboard =
        userRole === 'doctor'
          ? '/doctor/dashboard'
          : userRole === 'admin'
            ? '/admin/dashboard'
            : '/patient/dashboard'

      // Save JWT token
      localStorage.setItem('token', data.token)

      // Keep shared frontend auth state in sync
      signIn(userRole, data.token)
      
      // Set cookie for Next.js middleware
      document.cookie = `auth_token=${data.token}; path=/; max-age=86400; SameSite=Lax`

      // Save user
      localStorage.setItem('user', JSON.stringify(data.user))

      // Save user name
      localStorage.setItem('medox.userName', data.user.name || 'User')

      toast({
        title: 'Authentication Successful 🎉',
        description: `Welcome back, ${data.user.name || 'User'}! Redirecting...`,
      })

      const redirectPath = searchParams?.get('redirect')
      const canUseRedirect = redirectPath?.startsWith(`/${userRole}/`)
      
      const targetUrl = redirectPath && canUseRedirect ? redirectPath : defaultDashboard
      
      setTimeout(() => {
        window.location.href = targetUrl
      }, 1000)

    } catch (error) {
      console.error(error)
      setError('Connection refused. Please check that the server is online.')
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
              Advanced Healthcare <br />
              <span className="bg-gradient-to-r from-sky-400 via-sky-300 to-emerald-400 bg-clip-text text-transparent">
                SaaS Portal
              </span>
            </h1>
            <p className="text-lg text-slate-400 max-w-md">
              An enterprise-grade, modern digital ecosystem connecting multi-speciality hospitals, dedicated clinicians, and patients seamlessly.
            </p>
          </div>
          
          <div className="grid gap-4 border-t border-white/5 pt-8 max-w-md text-sm text-slate-300">
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">✓</div>
              <span>Secure EHR & Medical Record Uploads</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">✓</div>
              <span>Comprehensive Real-Time Prescriptions Workflow</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-xs">✓</div>
              <span>Hospital Verification & Admin Aggregation</span>
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-500 relative z-10 font-medium">
          © 2026 MEDOX Healthcare Platform. All rights reserved.
        </p>
      </div>

      {/* Right Panel Card Form */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:px-20 xl:px-24 bg-background">
        <div className="mx-auto w-full max-w-md">
          {/* Mobile Logo View */}
          <div className="mb-8 lg:hidden flex justify-center">
            <Link href="/" className="flex items-center gap-3">
              <BrandHeader collapsed={false} subtitle="Kerala Multi-Hospital Network" />
            </Link>
          </div>

          <Card className="border-0 shadow-none sm:border sm:shadow-sm">
            <CardHeader className="space-y-1 px-0 sm:px-6">
              <CardTitle className="text-2xl font-bold capitalize">
                {formData.role} Sign in
              </CardTitle>
              <CardDescription>
                Enter your credentials to access your account
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

                {/* Email Input */}
                <div className="space-y-2">
                  <label htmlFor="email" className="text-sm font-medium text-slate-950">
                    Email Address
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

                {/* Password Input */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label htmlFor="password" className="text-sm font-medium text-slate-950">
                      Password
                    </label>
                    <Link href="/forgot-password" className="text-sm text-sky-600 hover:text-sky-500 hover:underline">
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
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

                {/* Submit Action */}
                <Button type="submit" className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors rounded-lg shadow-sm gap-2" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Authenticating...
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      Sign in
                      <ArrowRight className="h-4 w-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-slate-500">
                {formData.role === 'patient' ? (
                  <>
                    {"Don't have an account?"}{' '}
                    <Link href="/register" className="font-semibold text-sky-600 hover:text-sky-500 hover:underline">
                      Sign up
                    </Link>
                  </>
                ) : formData.role === 'doctor' ? (
                  <div className="space-y-2 border-t pt-4 border-slate-100 text-left">
                    <p className="font-semibold text-emerald-600 leading-tight">
                      Verified medical professionals only.
                    </p>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Doctor authentication credentials are set and managed by authorized MEDOX administrators.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 border-t pt-4 border-slate-100 text-left">
                    <p className="font-semibold text-purple-600 leading-tight">
                      Administrative access only.
                    </p>
                    <p className="text-xs text-muted-foreground leading-normal">
                      Authorized security configurations are protected. Login attempts are monitored.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <LoginForm />
    </Suspense>
  )
}
