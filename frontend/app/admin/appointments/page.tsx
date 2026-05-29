'use client'

import { useMemo, useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Calendar, RefreshCw, XCircle, Loader2, X, AlertTriangle } from 'lucide-react'

const API = "http://localhost:5000"
const getToken = () => { let t = localStorage.getItem("token"); if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); return (!t || t === "undefined") ? null : t }

export default function AdminAppointmentsPage() {
  const [search, setSearch] = useState('')
  const [appointmentsList, setAppointmentsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Cancel Confirmation Dialog
  const [cancelDialogId, setCancelDialogId] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  // Reschedule Dialog State
  const [showReschedule, setShowReschedule] = useState(false)
  const [selectedAptId, setSelectedAptId] = useState<string | null>(null)
  const [newDate, setNewDate] = useState('')
  const [newTime, setNewTime] = useState('10:00 AM')

  const fetchAppointments = async () => {
    const token = getToken()
    if (!token) return
    try {
      const response = await fetch(`${API}/api/admin/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (data.success && data.data && Array.isArray(data.data.appointments)) {
        const formatted = data.data.appointments.map((a: any) => ({
          id: a.id,
          patient: a.patient?.name || a.patientName || 'N/A',
          doctor: a.doctor?.user?.name || a.doctorName || 'N/A',
          date: a.appointmentDate
            ? new Date(a.appointmentDate).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
            : a.date || 'N/A',
          fee: a.doctor?.consultationFee || a.fee || 0,
          status: a.status
        }))
        setAppointmentsList(formatted)
      }
    } catch (err) {
      console.error('Failed to load appointments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAppointments()
  }, [])

  const handleCancelAppointment = async (id: string) => {
    const token = getToken()
    if (!token) return
    setIsCancelling(true)
    try {
      const response = await fetch(`${API}/api/appointments/${id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        setAppointmentsList(prev => prev.map(a => a.id === id ? { ...a, status: 'CANCELLED' } : a))
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err)
    } finally {
      setIsCancelling(false)
      setCancelDialogId(null)
    }
  }

  const handleOpenReschedule = (apt: any) => {
    setSelectedAptId(apt.id)
    const datePart = apt.date.split(' ')[0]
    setNewDate(datePart)
    setShowReschedule(true)
  }

  const handleSaveReschedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAptId) return
    const token = getToken()
    if (!token) return
    try {
      const response = await fetch(`${API}/api/appointments/${selectedAptId}/reschedule`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ date: newDate, time: newTime })
      })
      const resData = await response.json()
      if (resData.success) {
        setAppointmentsList(prev => prev.map(a => a.id === selectedAptId ? { ...a, date: `${newDate} ${newTime}` } : a))
        setShowReschedule(false)
      }
    } catch (err) {
      console.error('Failed to reschedule:', err)
    }
  }

  const filteredAppointments = useMemo(() => {
    return appointmentsList.filter((appointment) =>
      appointment.patient.toLowerCase().includes(search.toLowerCase()) ||
      appointment.doctor.toLowerCase().includes(search.toLowerCase()) ||
      appointment.status.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, appointmentsList])

  const upcomingCount = useMemo(() => appointmentsList.filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING').length, [appointmentsList])
  const pendingCount = useMemo(() => appointmentsList.filter(a => a.status === 'PENDING').length, [appointmentsList])
  const cancelledCount = useMemo(() => appointmentsList.filter(a => a.status === 'CANCELLED').length, [appointmentsList])

  const appointmentStatus: Record<string, string> = {
    CONFIRMED: 'bg-green-50 text-green-700 border-green-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    CANCELLED: 'bg-red-50 text-red-700 border-red-200',
    COMPLETED: 'bg-gray-50 text-gray-700 border-gray-200',
  }

  if (loading) return (
    <DashboardLayout role="admin" title="Appointment Management" subtitle="System registry">
      <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  )

  return (
    <>
    <DashboardLayout role="admin" title="Appointment Management" subtitle="Monitor appointment status and rescheduling operations.">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400">Track real-time appointment updates and manage reschedules.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search appointments by doctor, patient, status..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>

        {/* Reschedule Modal */}
        {showReschedule && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in duration-200">
              <div className="flex items-center justify-between border-b pb-4 mb-4">
                <h3 className="text-lg font-bold text-slate-950">Reschedule Appointment</h3>
                <button onClick={() => setShowReschedule(false)} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleSaveReschedule} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Select New Date</label>
                  <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} required />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-600 block mb-1">Select Slot Time</label>
                  <select
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="09:00 AM">09:00 AM</option>
                    <option value="09:30 AM">09:30 AM</option>
                    <option value="10:00 AM">10:00 AM</option>
                    <option value="10:30 AM">10:30 AM</option>
                    <option value="11:00 AM">11:00 AM</option>
                    <option value="11:30 AM">11:30 AM</option>
                    <option value="02:00 PM">02:00 PM</option>
                    <option value="02:30 PM">02:30 PM</option>
                    <option value="03:00 PM">03:00 PM</option>
                    <option value="03:30 PM">03:30 PM</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 border-t pt-4 mt-4">
                  <Button type="button" variant="outline" onClick={() => setShowReschedule(false)}>Cancel</Button>
                  <Button type="submit">Confirm Reschedule</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Upcoming appointments</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{upcomingCount}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-sky-500" />
            </div>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Pending confirmation</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950 text-amber-600">{pendingCount}</p>
              </div>
              <Calendar className="h-8 w-8 text-amber-500" />
            </div>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Cancellations</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950 text-red-600">{cancelledCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </Card>
        </div>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-5">
            <CardTitle className="text-base text-slate-950">Appointment Queue</CardTitle>
            <CardDescription className="text-slate-500">Manage appointment approvals and cancellations with quick actions.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <Table className="min-w-full border-separate border-spacing-0">
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead className="px-5 py-3">Patient</TableHead>
                  <TableHead>Doctor</TableHead>
                  <TableHead>Schedule Slot</TableHead>
                  <TableHead>Fee Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="px-5 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAppointments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                      No medical appointments registered.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAppointments.map((appointment) => (
                    <TableRow key={appointment.id} className="hover:bg-slate-50">
                      <TableCell className="text-slate-950 font-medium px-5 py-3">{appointment.patient}</TableCell>
                      <TableCell>{appointment.doctor}</TableCell>
                      <TableCell>{appointment.date}</TableCell>
                      <TableCell className="font-medium text-slate-900">₹{appointment.fee}</TableCell>
                      <TableCell>
                        <Badge className={appointmentStatus[appointment.status] || "bg-gray-50 text-slate-700"}>{appointment.status}</Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right space-x-1">
                        {appointment.status !== 'CANCELLED' && appointment.status !== 'COMPLETED' && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => handleOpenReschedule(appointment)}>
                              Reschedule
                            </Button>
                            <Button size="sm" variant="ghost" className="text-destructive hover:bg-red-50" onClick={() => setCancelDialogId(String(appointment.id))}>
                              Cancel
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>

      {/* ── Cancel Confirmation Dialog ── */}
      <Dialog open={cancelDialogId !== null} onOpenChange={(open) => { if (!open) setCancelDialogId(null) }}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <AlertTriangle className="h-7 w-7 text-red-600" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold">Cancel Appointment?</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? The patient will be notified.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setCancelDialogId(null)} disabled={isCancelling}>
              Keep
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              disabled={isCancelling}
              onClick={() => cancelDialogId && handleCancelAppointment(cancelDialogId)}
            >
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Cancel Appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
