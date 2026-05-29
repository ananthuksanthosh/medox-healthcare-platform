"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Calendar, Clock, Users, CheckCircle2, ArrowRight, User,
  FileText, Loader2, Activity, Mail, Phone, Building2, MapPin
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const API = "http://localhost:5000"
const getToken = () => { let t = localStorage.getItem("token"); if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); return (!t || t === "undefined") ? null : t }

const statusColors: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
}

export default function DoctorDashboard() {
  const { toast } = useToast()
  const [appointments, setAppointments] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [doctor, setDoctor] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [prescriptionForm, setPrescriptionForm] = useState({ appointmentId: "", notes: "", medicines: "" })
  const [medicinesInput, setMedicinesInput] = useState("")
  const [saving, setSaving] = useState(false)

  // Selected schedule date tab
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split("T")[0])

  // Compute 3 days tabs dynamically
  const dateTabs = useMemo(() => {
    const today = new Date()
    const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000)
    const dayAfter = new Date(today.getTime() + 48 * 60 * 60 * 1000)

    const formatShort = (d: Date) => d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })

    return [
      { label: "Today", value: today.toISOString().split("T")[0], shortDate: formatShort(today) },
      { label: "Tomorrow", value: tomorrow.toISOString().split("T")[0], shortDate: formatShort(tomorrow) },
      { label: "Next Day", value: dayAfter.toISOString().split("T")[0], shortDate: formatShort(dayAfter) }
    ]
  }, [])

  const fetchData = useCallback(async () => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    try {
      const [apptRes, statsRes, profileRes] = await Promise.all([
        fetch(`${API}/api/appointments/doctor/my?date=${selectedDate}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/doctors/stats/me`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${API}/api/doctors/me/profile`, { headers: { Authorization: `Bearer ${token}` } })
      ])
      const apptData = await apptRes.json()
      const statsData = await statsRes.json()
      const profileData = await profileRes.json()

      if (apptData.success) setAppointments(apptData.data.appointments)
      if (statsData.success) setStats(statsData.data)
      if (profileData.success) setDoctor(profileData.data.doctor)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [selectedDate])

  useEffect(() => { fetchData() }, [fetchData])

  const handleStatusUpdate = async (id: number, status: string) => {
    const token = getToken()
    try {
      const res = await fetch(`${API}/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast({ title: "Status Updated", description: `Appointment marked as ${status}` })
        fetchData()
      }
    } catch { toast({ title: "Error", variant: "destructive" }) }
  }

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    const medicines = medicinesInput || prescriptionForm.medicines
    if (!prescriptionForm.appointmentId || !medicines) {
      toast({ title: "Required", description: "Select appointment and enter medicines.", variant: "destructive" })
      return
    }
    setSaving(true)
    const token = getToken()
    try {
      const res = await fetch(`${API}/api/prescriptions`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: prescriptionForm.appointmentId,
          diagnosis: "General Consultation",
          notes: prescriptionForm.notes,
          medicines: medicines.split('\n').filter(Boolean).map(m => ({
            name: m.trim(), dosage: "As directed", frequency: "Once daily", duration: "7 days"
          }))
        })
      })
      if (res.ok) {
        toast({ title: "Prescription Saved ✅" })
        setPrescriptionForm({ appointmentId: "", notes: "", medicines: "" })
        setMedicinesInput("")
        fetchData()
      } else {
        const d = await res.json()
        toast({ title: "Failed", description: d.message, variant: "destructive" })
      }
    } catch { toast({ title: "Network Error", variant: "destructive" }) }
    finally { setSaving(false) }
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
  }

  const getWelcomeName = () => {
    if (!doctor?.user?.name) return "Welcome back"
    const name = doctor.user.name
    return name.startsWith("Dr.") ? `Welcome back, ${name}` : `Welcome back, Dr. ${name}`
  }

  if (loading) return (
    <DashboardLayout role="doctor" title="Dashboard" subtitle="Welcome back">
      <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="doctor" title="Dashboard" subtitle={getWelcomeName()}>
      <div className="space-y-6">
        
        {/* ── Doctor Profile Card ── */}
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

              {/* Avatar */}
              <Avatar className="h-20 w-20 text-2xl border-2 border-primary/30 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-xl">
                  {getInitials(doctor?.user?.name || '')}
                </AvatarFallback>
              </Avatar>

              {/* Info */}
              <div className="flex-1 space-y-1">
                <h2 className="text-xl font-bold text-foreground">
                  {doctor?.user?.name ? (doctor.user.name.startsWith("Dr.") ? doctor.user.name : `Dr. ${doctor.user.name}`) : '—'}
                </h2>
                <span className="inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary capitalize">
                  doctor
                </span>

                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 text-sm text-muted-foreground">

                  {doctor?.user?.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-primary shrink-0" />
                      <span className="truncate">{doctor.user.email}</span>
                    </div>
                  )}

                  {doctor?.user?.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary shrink-0" />
                      <span>{doctor.user.phone}</span>
                    </div>
                  )}

                  {doctor?.specialization && (
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-primary shrink-0" />
                      <span>{doctor.specialization}</span>
                    </div>
                  )}

                  {doctor?.department?.name && (
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary shrink-0" />
                      <span>Department: {doctor.department.name}</span>
                    </div>
                  )}

                  {doctor?.hospital?.name && (
                    <div className="flex items-center gap-2 sm:col-span-2">
                      <MapPin className="h-4 w-4 text-primary shrink-0" />
                      <span>{doctor.hospital.name}</span>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </CardContent>
        </Card>

        {/* ── Stats Row ── */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { label: "Today's Appointments", value: stats?.todayAppointments ?? appointments.length, icon: Calendar, color: "bg-primary/10 text-primary" },
            { label: "Total Patients", value: stats?.totalPatients ?? "—", icon: Users, color: "bg-accent/10 text-accent" },
            { label: "Completed", value: stats?.completedAppointments ?? "—", icon: CheckCircle2, color: "bg-green-100 text-green-700" },
            { label: "Total Appointments", value: stats?.totalAppointments ?? "—", icon: Activity, color: "bg-orange-100 text-orange-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${s.color}`}><s.icon className="h-6 w-6" /></div>
                <div><p className="text-2xl font-bold">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Main Dashboard Content ── */}
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Appointments Schedule
                </CardTitle>
                <div className="flex bg-secondary/50 rounded-lg p-1 w-fit">
                  {dateTabs.map(tab => (
                    <button
                      key={tab.value}
                      onClick={() => setSelectedDate(tab.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                        selectedDate === tab.value
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab.label} ({tab.shortDate})
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {appointments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-12 text-center bg-slate-50/30">
                    <Calendar className="h-10 w-10 text-muted-foreground mb-3" />
                    <h3 className="font-semibold">No appointments scheduled</h3>
                    <p className="text-sm text-muted-foreground">Your schedule is clear for this date.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {appointments.map(apt => {
                      const time = apt.slotTime || new Date(apt.appointmentDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
                      return (
                        <div key={apt.id} className="flex items-center gap-4 rounded-xl border p-4 hover:border-primary/40 hover:shadow-sm transition-all bg-card">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-secondary">
                            <User className="h-5 w-5 text-foreground/70" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">{apt.patientName || apt.patient?.name}</p>
                            <p className="text-sm text-muted-foreground truncate">{apt.notes || "General Consultation"}</p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground"><Clock className="h-3 w-3" />{time}</div>
                            {apt.tokenNumber && <Badge variant="outline" className="text-xs">Token #{apt.tokenNumber}</Badge>}
                            <Badge className={(statusColors[apt.status] || "bg-gray-100") + " text-xs"}>{apt.status}</Badge>
                          </div>
                          <div className="flex flex-col gap-1 flex-shrink-0">
                            {apt.status === "BOOKED" && (
                              <Button size="sm" variant="outline" className="text-green-600 text-xs hover:bg-green-50"
                                onClick={() => handleStatusUpdate(apt.id, "CONFIRMED")}>Confirm</Button>
                            )}
                            {apt.status === "CONFIRMED" && (
                              <Button size="sm" className="text-xs bg-primary hover:bg-primary/95 text-white"
                                onClick={() => handleStatusUpdate(apt.id, "COMPLETED")}>Complete</Button>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5 text-primary" />Quick Prescription</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleSavePrescription} className="space-y-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Select Appointment *</label>
                    <select
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={prescriptionForm.appointmentId}
                      onChange={e => setPrescriptionForm(p => ({ ...p, appointmentId: e.target.value }))}
                      required
                    >
                      <option value="">— Select patient appointment —</option>
                      {appointments.filter(a => a.status === "COMPLETED" || a.status === "CONFIRMED").map(a => (
                        <option key={a.id} value={a.id}>
                          {a.patientName || a.patient?.name} — {new Date(a.appointmentDate).toLocaleDateString("en-IN")}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Medicines *</label>
                    <textarea rows={3} placeholder="e.g., Paracetamol 500mg twice daily&#10;Cetirizine 10mg at night"
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={prescriptionForm.medicines}
                      onChange={e => setPrescriptionForm(p => ({ ...p, medicines: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Notes / Instructions</label>
                    <textarea rows={2} placeholder="Additional instructions..."
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={prescriptionForm.notes}
                      onChange={e => setPrescriptionForm(p => ({ ...p, notes: e.target.value }))} />
                  </div>
                  <div className="flex gap-3">
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Prescription
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setPrescriptionForm({ appointmentId: "", notes: "", medicines: "" })}>Clear</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" />Quick Actions</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/doctor/todays-appointments"><Calendar className="mr-2 h-4 w-4" />Today's Schedule</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/doctor/patient-list"><Users className="mr-2 h-4 w-4" />My Patients</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/doctor/availability"><Clock className="mr-2 h-4 w-4" />Manage Slots</Link>
                </Button>
                <Button variant="outline" className="w-full justify-start" asChild>
                  <Link href="/doctor/prescriptions"><FileText className="mr-2 h-4 w-4" />All Prescriptions</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
