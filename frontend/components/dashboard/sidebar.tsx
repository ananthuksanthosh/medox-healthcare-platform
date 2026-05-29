'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard, Calendar, FileText, CreditCard, Upload, Download,
  Settings, LogOut, Menu, X, User, Stethoscope, Building2, Users,
  Activity, Shield, Bell, Clock, ChevronLeft, ShieldAlert, Server
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { signOut } from '@/lib/auth'
import { BrandHeader } from '@/components/ui/brand-header'

type UserRole = 'patient' | 'doctor' | 'admin'

interface SidebarProps {
  role: UserRole
  collapsed: boolean
  setCollapsed: (c: boolean) => void
}

const menuItems = {
  patient: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/patient/dashboard' },
    { icon: Calendar, label: 'Appointments', href: '/patient/appointments' },
    { icon: FileText, label: 'Medical Records', href: '/patient/medical-records' },
    { icon: Upload, label: 'Upload Reports', href: '/patient/upload-reports' },
    { icon: Download, label: 'Prescriptions', href: '/patient/prescriptions' },
    { icon: CreditCard, label: 'Payments', href: '/patient/payments' },
    { icon: Settings, label: 'Settings', href: '/patient/settings' },
  ],
  doctor: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/doctor/dashboard' },
    { icon: Calendar, label: 'Appointments', href: '/doctor/todays-appointments' },
    { icon: Users, label: 'Patient List', href: '/doctor/patient-list' },
    { icon: FileText, label: 'Prescriptions', href: '/doctor/prescriptions' },
    { icon: Clock, label: 'Availability', href: '/doctor/availability' },
    { icon: Activity, label: 'Consultation History', href: '/doctor/consultation-history' },
    { icon: Settings, label: 'Settings', href: '/doctor/settings' },
  ],
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
    { icon: ShieldAlert, label: 'Security Center', href: '/admin/security-center' },
    { icon: Server, label: 'System Status', href: '/admin/system-status' },
    { icon: Shield, label: 'Hospital Verification', href: '/admin/hospital-verification' },
    { icon: Stethoscope, label: 'Doctors', href: '/admin/doctors' },
    { icon: Building2, label: 'Hospitals', href: '/admin/hospitals' },
    { icon: Users, label: 'Patients', href: '/admin/patients' },
    { icon: Calendar, label: 'Appointments', href: '/admin/appointments' },
    { icon: CreditCard, label: 'Payments', href: '/admin/payments' },
    { icon: Activity, label: 'Reports', href: '/admin/reports' },
    { icon: Bell, label: 'Notifications', href: '/admin/notifications' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ],
}

const roleLabels: Record<UserRole, string> = {
  patient: 'Patient Portal',
  doctor: 'Doctor Portal',
  admin: 'Admin Portal',
}

export function Sidebar({ role, collapsed, setCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userName, setUserName] = useState<string>('User')

  useState(() => {
    if (typeof window !== 'undefined') {
      const storedUserName = window.localStorage.getItem('medox.userName')
      if (storedUserName) {
        setUserName(storedUserName)
      } else {
        setUserName(role === 'patient' ? 'Patient' : role === 'doctor' ? 'Doctor' : 'Admin')
      }
    }
  })

  const items = menuItems[role]

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white lg:hidden border border-slate-800"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: '#0F172A', borderColor: '#1E293B' }}
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r transition-all duration-300 text-slate-100",
          collapsed ? "w-16" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-white/5 px-4 bg-slate-950/20">
          <Link href="/" className="flex-1 min-w-0 flex items-center">
            <BrandHeader collapsed={collapsed} />
          </Link>
          {!collapsed && (
            <button
              onClick={() => {
                setCollapsed(!collapsed)
                setMobileOpen(false)
              }}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white transition-colors hover:bg-white/5 shrink-0 ml-1"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          {collapsed && (
            <button
              onClick={() => setCollapsed(false)}
              className="absolute -right-3 top-6 flex h-6 w-6 items-center justify-center rounded-full border border-slate-700 bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors shadow-md"
            >
              <ChevronLeft className="h-4 w-4 rotate-180" />
            </button>
          )}
        </div>

        {/* Role Label */}
        {!collapsed && (
          <div className="border-b border-white/5 px-4 py-3 bg-slate-950/10">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
              {roleLabels[role]}
            </p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          <ul className="space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    style={isActive ? { backgroundColor: '#1E293B', color: '#F8FAFC' } : {}}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "shadow-md shadow-black/20 border border-white/5"
                        : "text-slate-400 hover:bg-white/5 hover:text-slate-100"
                    )}
                  >
                    <item.icon className={cn("h-5 w-5 flex-shrink-0 transition-transform duration-200", isActive ? "text-sky-400 scale-105 animate-pulse" : "text-slate-400", collapsed && "mx-auto")} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        {/* Footer */}
        <div className="border-t border-white/5 p-3 bg-slate-950/20">
          {!collapsed && (
            <div className="mb-3 flex items-center gap-3 rounded-lg bg-white/5 border border-white/5 px-3 py-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20">
                <User className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-100 truncate leading-none mb-1">{userName}</p>
                <p className="text-[10px] text-slate-400 uppercase tracking-wider leading-none capitalize">{role}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => {
              signOut()
              window.location.href = '/'
            }}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300",
              collapsed && "justify-center"
            )}
          >
            <LogOut className="h-5 w-5" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>
    </>
  )
}
