'use client'

import Link from 'next/link'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  Calendar, FileText, CreditCard, ArrowRight,
  User, MapPin, CheckCircle2, AlertCircle, Download, Activity,
  Phone, Mail, CalendarDays, Venus, Shield, Clock
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { getAppointments, getPrescriptions, getMedicalRecords, Appointment, Prescription, MedicalRecord } from '@/lib/mock-store'

const statusColors: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
}

export default function PatientDashboard() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([])

  useEffect(() => {
    let token = localStorage.getItem('token')
    if (!token || token === 'undefined' || token === 'null') {
      token = localStorage.getItem('medox.authToken')
    }
    if (!token || token === 'undefined' || token === 'null') {
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setUser(data)
        }
      } catch (err) {
        console.error('Profile fetch error:', err)
      }
    }
    loadProfile()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [apptsList, prescriptionsList, reportsList] = await Promise.all([
          getAppointments('', 'patient'),
          getPrescriptions('', 'patient'),
          getMedicalRecords('')
        ])
        setAppointments(apptsList)
        setPrescriptions(prescriptionsList)
        setMedicalRecords(reportsList)
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  // Derive initials from name
  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  // Format dob nicely
  const formatDob = (dob: string) => {
    if (!dob) return null
    const d = new Date(dob)
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
  }

  // Calculate statistics
  const upcoming = appointments.filter(a => {
    const s = a.status?.toUpperCase()
    return s === 'BOOKED' || s === 'CONFIRMED'
  })

  const completed = appointments.filter(a => a.status?.toUpperCase() === 'COMPLETED')

  const totalSpent = appointments
    .filter(a => ['BOOKED', 'CONFIRMED', 'COMPLETED'].includes(a.status?.toUpperCase()))
    .reduce((sum, a) => sum + (Number(a.fee) || Number(a.consultationFee) || 0), 0)

  return (
    <DashboardLayout
      role="patient"
      title="Dashboard"
      subtitle={user ? `Welcome back, ${user.name}` : 'Welcome back'}
    >
      {loading && appointments.length === 0 ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">

          {/* ── Profile Card ── */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

                {/* Avatar */}
                <Avatar className="h-20 w-20 text-2xl border-2 border-primary/30 shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                    {getInitials(user?.name || '')}
                  </AvatarFallback>
                </Avatar>

                {/* Info */}
                <div className="flex-1 space-y-1">
                  <h2 className="text-xl font-bold text-foreground">
                    {user?.name || '—'}
                  </h2>
                  <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                    {user?.role?.toLowerCase() || 'patient'}
                  </span>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm text-muted-foreground">

                    {user?.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-primary shrink-0" />
                        <span className="truncate">{user.email}</span>
                      </div>
                    )}

                    {user?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-primary shrink-0" />
                        <span>{user.phone}</span>
                      </div>
                    )}

                    {user?.gender && (
                      <div className="flex items-center gap-2">
                        <Venus className="h-4 w-4 text-primary shrink-0" />
                        <span className="capitalize">{user.gender}</span>
                      </div>
                    )}

                    {user?.dob && (
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-primary shrink-0" />
                        <span>{formatDob(user.dob)}</span>
                      </div>
                    )}

                    {user?.address && (
                      <div className="flex items-center gap-2 sm:col-span-2">
                        <MapPin className="h-4 w-4 text-primary shrink-0" />
                        <span>{user.address}</span>
                      </div>
                    )}

                  </div>
                </div>

                {/* Edit link */}
                <Button variant="outline" size="sm" asChild className="shrink-0">
                  <Link href="/patient/settings">
                    <User className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Link>
                </Button>

              </div>
            </CardContent>
          </Card>

          {/* ── Stats Row ── */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { label: 'Upcoming Appointments', value: String(upcoming.length), icon: Calendar, color: 'text-primary bg-primary/10' },
              { label: 'Total Visits', value: String(completed.length), icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
              { label: 'Pending Reports', value: String(medicalRecords.length), icon: FileText, color: 'text-amber-600 bg-amber-50' },
              { label: 'Total Spent', value: `₹${totalSpent}`, icon: CreditCard, color: 'text-violet-600 bg-violet-50' },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex items-center gap-4 p-6">
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Main content ── */}
          <div className="grid gap-8 lg:grid-cols-3">

            {/* Upcoming Appointments */}
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    Upcoming Appointments
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/patient/appointments">
                      View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcoming.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center bg-slate-50/50">
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
                        <Calendar className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">No upcoming appointments</h3>
                      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                        Book an appointment with a doctor to get started.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcoming.slice(0, 3).map((apt) => {
                        const statusUpper = apt.status?.toUpperCase() ?? "BOOKED"
                        return (
                          <div key={apt.id} className="flex items-center gap-4 rounded-xl border p-4 hover:border-primary/40 hover:shadow-sm transition-all bg-card">
                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <User className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold truncate text-foreground">{apt.doctor || "Doctor"}</p>
                              <p className="text-xs text-primary font-semibold">{apt.specialization || "Specialist"}</p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">{apt.hospital || "Hospital"}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0 text-right">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                <span>{apt.date}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                <span>{apt.time}</span>
                              </div>
                              {apt.tokenNumber && (
                                <Badge variant="outline" className="text-xs font-bold">
                                  Token #{apt.tokenNumber}
                                </Badge>
                              )}
                              <Badge className={`${statusColors[statusUpper] || "bg-gray-100"} text-[10px] uppercase font-bold py-0.5 px-2`}>
                                {statusUpper}
                              </Badge>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                  <Button className="mt-4 w-full" asChild>
                    <Link href="/book-appointment">Book New Appointment</Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Recent Prescriptions */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Recent Prescriptions
                  </CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/patient/prescriptions">
                      View All <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardHeader>
                <CardContent className="space-y-3">
                  {prescriptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center bg-slate-50/50">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                        <FileText className="h-6 w-6 text-slate-400" />
                      </div>
                      <h3 className="text-md font-semibold text-foreground">No prescriptions yet</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Prescriptions from your doctors will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {prescriptions.slice(0, 3).map((pr) => {
                        let medsList: any[] = []
                        if (Array.isArray(pr.medicines)) {
                          medsList = pr.medicines
                        } else if (typeof pr.medicines === 'string') {
                          try {
                            medsList = JSON.parse(pr.medicines)
                          } catch {
                            medsList = [{ name: pr.medicines }]
                          }
                        }

                        return (
                          <div key={pr.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:border-primary/30 transition-all">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 text-emerald-600">
                                <FileText className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <h4 className="font-bold text-sm text-foreground truncate">{pr.doctor || "Doctor"}</h4>
                                <p className="text-xs text-muted-foreground truncate">{pr.diagnosis || "General Consultation"}</p>
                                <p className="text-[10px] text-primary truncate mt-0.5">
                                  {medsList.map(m => m.name || m).join(', ')}
                                </p>
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground">{pr.date || (pr.createdAt ? new Date(pr.createdAt).toLocaleDateString('en-IN') : '')}</p>
                              <Button variant="ghost" size="sm" className="h-7 mt-1 text-xs text-primary hover:text-primary-foreground hover:bg-primary" asChild>
                                <Link href="/patient/prescriptions">
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div className="space-y-8">

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full justify-start" asChild>
                    <Link href="/book-appointment">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Appointment
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/patient/upload-reports">
                      <FileText className="mr-2 h-4 w-4" />
                      Upload Medical Report
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/patient/medical-records">
                      <Download className="mr-2 h-4 w-4" />
                      View Medical Records
                    </Link>
                  </Button>
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <Link href="/patient/payments">
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payment History
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* Health Tips */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-primary" />
                    Health Tips
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="rounded-lg bg-primary/5 p-4">
                      <p className="text-sm font-medium text-foreground">Stay Hydrated</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Drink at least 8 glasses of water daily for optimal health.
                      </p>
                    </div>
                    <div className="rounded-lg bg-emerald-50 p-4">
                      <p className="text-sm font-medium text-foreground">Regular Exercise</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        30 minutes of daily exercise can improve your health significantly.
                      </p>
                    </div>
                    <div className="rounded-lg bg-violet-50 p-4">
                      <p className="text-sm font-medium text-foreground">Medication Reminder</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Take your prescribed medications on time for best results.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}