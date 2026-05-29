'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, Stethoscope, Building2, Calendar, CreditCard, Loader2, CheckCircle, ShieldAlert, Server, ArrowRight } from 'lucide-react'
import Link from 'next/link'

const API = "http://localhost:5000"
const getToken = () => { let t = localStorage.getItem("token"); if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); return (!t || t === "undefined") ? null : t }

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [recentAppointments, setRecentAppointments] = useState<any[]>([])
  const [securityStats, setSecurityStats] = useState<any>(null)
  const [systemStatus, setSystemStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = getToken()
    if (!token) { setLoading(false); return }

    Promise.all([
      fetch(`${API}/api/admin/stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/admin/appointments`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/admin/security-stats`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json()),
      fetch(`${API}/api/admin/system-status`, { headers: { Authorization: `Bearer ${token}` } }).then(r => r.json())
    ]).then(([statsData, apptData, secData, sysData]) => {
      if (statsData.success && statsData.data) {
        setStats(statsData.data)
      }
      if (apptData.success && apptData.data && Array.isArray(apptData.data.appointments)) {
        setRecentAppointments(apptData.data.appointments.slice(0, 5))
      }
      if (secData.success && secData.data) {
        setSecurityStats(secData.data)
      }
      if (sysData.success && sysData.data) {
        setSystemStatus(sysData.data)
      }
    }).catch(console.error).finally(() => setLoading(false))
  }, [])

  const summaryCards = [
    { label: 'Total Patients', value: stats ? String(stats.totalPatients ?? 0) : '0', icon: Users, accent: 'text-sky-500', bg: 'bg-sky-50', detail: 'Registered patients' },
    { label: 'Total Doctors', value: stats ? String(stats.totalDoctors ?? 0) : '0', icon: Stethoscope, accent: 'text-emerald-500', bg: 'bg-emerald-50', detail: 'Verified doctors' },
    { label: 'Total Hospitals', value: stats ? String(stats.totalHospitals ?? 0) : '0', icon: Building2, accent: 'text-violet-500', bg: 'bg-violet-50', detail: 'Network hospitals' },
    { label: 'Total Appointments', value: stats ? String(stats.totalAppointments ?? 0) : '0', icon: Calendar, accent: 'text-amber-500', bg: 'bg-amber-50', detail: 'All time' },
    { label: 'Revenue', value: stats ? `₹${(stats.totalRevenue ?? 0).toLocaleString()}` : '₹0', icon: CreditCard, accent: 'text-fuchsia-500', bg: 'bg-fuchsia-50', detail: 'Total collected' },
  ]

  const statusColors: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700",
    CONFIRMED: "bg-green-100 text-green-700",
    COMPLETED: "bg-gray-100 text-gray-700",
    CANCELLED: "bg-red-100 text-red-700",
  }

  if (loading) return (
    <DashboardLayout role="admin" title="Admin Dashboard" subtitle="System overview">
      <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="admin" title="Admin Dashboard" subtitle="Overview of system operations and performance.">
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid gap-4 xl:grid-cols-5">
          {summaryCards.map(card => (
            <Card key={card.label} className="border-slate-200 bg-white shadow-sm">
              <CardHeader className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="text-sm text-slate-500">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-950">{card.value}</p>
                </div>
                <div className={`rounded-2xl p-3 ${card.bg} ${card.accent}`}><card.icon className="h-5 w-5" /></div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Quick Admin Portals */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Security Center Portal Card */}
          <Link href="/admin/security-center">
            <Card className="group relative overflow-hidden border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-red-200 hover:shadow-md cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-600 font-semibold">
                    <ShieldAlert className="h-5 w-5 animate-pulse" />
                    <span>Security Center</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">System Threats & Events</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Monitor real-time security events, detect rate limit triggers, trace active user sessions, and view platform cyber health.
                  </p>
                  <div className="flex gap-4 pt-2">
                    <div className="text-xs">
                      <span className="text-slate-400 block">Health Score</span>
                      <span className="font-semibold text-slate-900">{securityStats?.healthScore?.overallScore ?? 100}% Secure</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400 block">Failed Logins</span>
                      <span className="font-semibold text-red-600">{securityStats?.failedLoginsToday ?? 0} Today</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400 block">Suspicious Logs</span>
                      <span className="font-semibold text-amber-600">{securityStats?.suspiciousActivities ?? 0} Warning</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-red-50 p-4 text-red-600 group-hover:bg-red-100 transition-colors">
                  <ArrowRight className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </Link>

          {/* System Status Portal Card */}
          <Link href="/admin/system-status">
            <Card className="group relative overflow-hidden border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-emerald-200 hover:shadow-md cursor-pointer">
              <div className="flex items-start justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-emerald-600 font-semibold">
                    <Server className="h-5 w-5" />
                    <span>System Status</span>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Server Infrastructure Health</h3>
                  <p className="text-sm text-slate-500 max-w-sm">
                    Inspect core service online states, memory resources, system uptimes, and direct database model record counts.
                  </p>
                  <div className="flex gap-4 pt-2">
                    <div className="text-xs">
                      <span className="text-slate-400 block">API Node</span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1">
                        <span className="h-2 w-2 rounded-full bg-emerald-500"></span> Online
                      </span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400 block">CPU Core</span>
                      <span className="font-semibold text-slate-900">{systemStatus?.resources?.cpu ?? '0.0'}% Load</span>
                    </div>
                    <div className="text-xs">
                      <span className="text-slate-400 block">RAM usage</span>
                      <span className="font-semibold text-slate-900">{systemStatus?.resources?.ram ?? '0.0'}%</span>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <ArrowRight className="h-6 w-6" />
                </div>
              </div>
            </Card>
          </Link>
        </div>

        {/* Recent Appointments */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-5">
            <CardTitle className="text-base">Recent Appointments</CardTitle>
            <CardDescription>Latest booking activity across all doctors</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {recentAppointments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                <p className="text-muted-foreground">No appointments yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentAppointments.map(apt => {
                  const patientName = apt.patient?.name || apt.patientName || 'Patient'
                  const doctorName = apt.doctor?.user?.name || apt.doctorName || 'Doctor'
                  const appointmentDateStr = apt.appointmentDate
                    ? new Date(apt.appointmentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : apt.date || 'N/A'
                  const feeAmount = apt.doctor?.consultationFee || apt.fee || 0
                  return (
                    <div key={apt.id} className="flex items-center gap-4 rounded-xl border p-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{patientName}</p>
                          <span className="text-xs text-muted-foreground">→</span>
                          <p className="text-sm text-muted-foreground">{doctorName}</p>
                        </div>
                        <div className="flex gap-3 mt-1 text-xs text-muted-foreground">
                          <span>{apt.type || 'General'} Session</span>
                          <span>{appointmentDateStr}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          ₹{feeAmount}
                        </Badge>
                        <Badge className={statusColors[apt.status] || "bg-gray-100 text-gray-700"}>{apt.status}</Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Stats Summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500 mb-1">Completed Appointments</p>
              <p className="text-2xl font-bold">{stats?.completedAppointments ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500 mb-1">Pending Approval Requests</p>
              <p className="text-2xl font-bold text-amber-600">{stats?.pendingApprovals ?? 0}</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5">
              <p className="text-sm text-slate-500 mb-1">Total Revenue Collected</p>
              <p className="text-2xl font-bold text-emerald-600">{stats ? `₹${Number(stats.totalRevenue ?? 0).toLocaleString()}` : '₹0'}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
