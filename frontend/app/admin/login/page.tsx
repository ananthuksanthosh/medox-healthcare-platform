'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, Building2, Users, Activity, Server } from 'lucide-react'
import { signIn } from '@/lib/auth'
import { AlertBox } from '@/components/ui/alert-box'
import { useToast } from '@/hooks/use-toast'

export default function AdminLoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
  })

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
            role: 'admin'
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        setIsLoading(false)
        setError(data.message || 'Login failed')
        return
      }

      const normalizedRole = String(data.user?.role || 'admin').toLowerCase()
      if (normalizedRole !== 'admin') {
        setIsLoading(false)
        setError('This account is not registered as an administrator. Access denied.')
        return
      }

      // Save JWT token
      localStorage.setItem('token', data.token)

      // Keep shared frontend auth state in sync for navbar, homepage, and guards.
      signIn('admin', data.token)
      
      // Set cookie for Next.js middleware
      document.cookie = `auth_token=${data.token}; path=/; max-age=86400; SameSite=Lax`

      // Save user
      localStorage.setItem(
        'user',
        JSON.stringify(data.user)
      )

      // Save user name
      localStorage.setItem(
        'medox.userName',
        data.user.name || 'Admin'
      )

      toast({
        title: 'Access Granted 🎉',
        description: 'Welcome back, Administrator! Opening control panel...',
      })

      setTimeout(() => {
        window.location.href = '/admin/dashboard'
      }, 1000)
    } catch (error) {
      console.error(error)
      setError('Connection error. Is the server running?')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_top_right,_rgba(59,130,246,0.18),_transparent_25%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.12),_transparent_20%)]" />

      <div className="relative w-full max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Panel - Admin Summary */}
          <div className="hidden lg:flex rounded-[2rem] border border-slate-200 bg-white p-10 shadow-lg shadow-slate-200/50 items-center justify-center">
            <div className="max-w-md text-center">
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="p-3 rounded-xl bg-blue-50">
                  <Shield className="h-8 w-8 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-950">Admin Portal</h1>
                  <p className="text-slate-600">Secure access for authorized administrators.</p>
                </div>
              </div>
              <p className="text-slate-600 text-lg leading-relaxed">
                Sign in with your admin credentials to manage hospitals, doctors, appointments, and patient workflows.
              </p>
            </div>
          </div>

          {/* Right Panel - Login Form */}
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="p-2 rounded-lg bg-blue-50">
                  <Shield className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-950">MEDOX Admin</h1>
                  <p className="text-slate-600 text-sm">Secure Login Portal</p>
                </div>
              </div>
            </div>

            <Card className="border border-slate-200 bg-white shadow-xl">
              <CardHeader className="space-y-1 pb-4">
                <CardTitle className="text-xl font-bold text-slate-950 text-center">
                  Administrator Access
                </CardTitle>
                <CardDescription className="text-slate-500 text-center">
                  Enter your administrative credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <AlertBox
                      variant="error"
                      description={error}
                      onClose={() => setError(null)}
                    />
                  )}
                  {/* Username */}
                  <div className="space-y-2">
                    <label htmlFor="username" className="text-sm font-medium text-slate-300">
                      Admin Username
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <Input
                        id="username"
                        type="text"
                        placeholder="admin_username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="h-11 pl-10 bg-white border border-slate-200 text-slate-950 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-slate-300">
                      Administrator Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="admin@medox.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="h-11 pl-10 bg-white border border-slate-200 text-slate-950 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="password" className="text-sm font-medium text-slate-300">
                        Access Password
                      </label>
                      <Link
                        href="/admin/forgot-password"
                        className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter secure password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="h-11 pl-10 pr-10 bg-white border border-slate-200 text-slate-950 placeholder:text-slate-400 focus:border-blue-500 focus:ring-blue-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-400"
                      >
                        {showPassword ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Security Notice */}
                  <div className="rounded-3xl bg-blue-50 p-3 border border-blue-100">
                    <div className="flex items-center gap-2 mb-1">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <span className="text-xs font-medium text-blue-700">Security Reminder</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Ensure you're on a secure network. This session will be monitored.
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <span className="flex items-center gap-2">
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Authenticating...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Admin Sign In
                        <ArrowRight className="h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>

                <div className="text-sm text-slate-400 text-center mt-4">
                  Authorized personnel only. All activities are monitored and secured.
                </div>

                {/* Back to Main Site */}
                <div className="text-center pt-4 border-t border-slate-200">
                  <Link
                    href="/"
                    className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
                  >
                    ← Back to MEDOX Healthcare
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}