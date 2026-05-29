'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { isAuthenticated, getUserRole, signOut } from '@/lib/auth'
import { Sidebar } from './sidebar'
import { Bell, Search, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import Link from 'next/link'

interface DashboardLayoutProps {
  children: React.ReactNode
  role: 'patient' | 'doctor' | 'admin'
  title?: string
  subtitle?: string
}

export function DashboardLayout({ children, role, title, subtitle }: DashboardLayoutProps) {
  const router = useRouter()
  const [authorized, setAuthorized] = useState(false)
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    // 1. Check if authenticated
    if (!isAuthenticated()) {
      if (role === 'admin') {
        router.replace('/admin/login')
      } else {
        router.replace(`/login?role=${role}`)
      }
      return
    }

    // 2. Check if role matches expected scope
    const currentRole = getUserRole()
    if (currentRole !== role) {
      // Automatically redirect to their matching portal
      router.replace(`/${currentRole}/dashboard`)
      return
    }

    setAuthorized(true)
  }, [role, router])

  const handleLogout = () => {
    signOut()
    window.location.href = '/'
  }

  if (!authorized) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">Securing session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} collapsed={collapsed} setCollapsed={setCollapsed} />
      
      <div className={cn("transition-all duration-300", collapsed ? "lg:pl-16" : "lg:pl-64")}>
        {/* Top Header */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 lg:px-8 shadow-sm">
          <div className="flex items-center gap-4 pl-12 lg:pl-0">
            {/* Top Navbar branding removed to keep it in the sidebar */}

            {title && (
              <div className="flex items-center gap-3 border-l border-slate-100 pl-4">
                <div>
                  <h1 className="text-base font-semibold text-slate-900 leading-none mb-0.5">{title}</h1>
                  {subtitle && <p className="text-xs text-muted-foreground leading-none">{subtitle}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search..."
                className="w-64 pl-9"
              />
            </div>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                    3
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <div className="p-2">
                  <p className="text-sm font-medium text-foreground">Notifications</p>
                </div>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <span className="text-sm font-medium">Appointment Reminder</span>
                  <span className="text-xs text-muted-foreground">You have an appointment tomorrow at 10:00 AM</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <span className="text-sm font-medium">New Prescription</span>
                  <span className="text-xs text-muted-foreground">Dr. Arun Kumar added a new prescription</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex flex-col items-start gap-1 p-3">
                  <span className="text-sm font-medium">Payment Successful</span>
                  <span className="text-xs text-muted-foreground">Your payment of Rs. 800 was successful</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/${role}/settings`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/${role}/settings`}>Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
