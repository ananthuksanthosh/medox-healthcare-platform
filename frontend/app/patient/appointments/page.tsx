"use client"

import React, { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Search,
  Filter,
  Phone,
  Video,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  IndianRupee
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { getAppointments, cancelAppointment, Appointment } from "@/lib/mock-store"

const statusColors: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-slate-100 text-slate-700",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
  // legacy lowercase support
  confirmed: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  completed: "bg-slate-100 text-slate-700",
  cancelled: "bg-red-100 text-red-700",
}

const statusIcons: Record<string, React.ReactNode> = {
  BOOKED: <Clock className="h-4 w-4" />,
  CONFIRMED: <CheckCircle className="h-4 w-4" />,
  COMPLETED: <CheckCircle className="h-4 w-4" />,
  CANCELLED: <X className="h-4 w-4" />,
  NO_SHOW: <AlertCircle className="h-4 w-4" />,
}

function getStatusLabel(status: string) {
  const map: Record<string, string> = {
    BOOKED: "Booked",
    CONFIRMED: "Confirmed",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
    NO_SHOW: "No Show",
  }
  return map[status?.toUpperCase()] ?? status
}

function isUpcoming(apt: Appointment) {
  const s = apt.status?.toUpperCase()
  return s === "BOOKED" || s === "CONFIRMED"
}

function isPast(apt: Appointment) {
  const s = apt.status?.toUpperCase()
  return s === "COMPLETED" || s === "CANCELLED" || s === "NO_SHOW"
}

export default function AppointmentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("upcoming")
  const [appointmentsList, setAppointmentsList] = useState<Appointment[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | number | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  const loadAppointments = async () => {
    setLoading(true)
    try {
      const list = await getAppointments("", "patient")
      setAppointmentsList(list)
    } catch (err) {
      console.error("Failed to load appointments:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAppointments()
  }, [])

  const handleCancelClick = (id: string | number) => {
    setAppointmentToCancel(id)
    setCancelModalOpen(true)
  }

  const confirmCancel = async () => {
    if (appointmentToCancel === null) return
    setIsCancelling(true)
    try {
      await cancelAppointment("", appointmentToCancel)
      await loadAppointments()
      toast({ title: "Appointment Cancelled", description: "Your appointment has been cancelled." })
    } catch {
      toast({ title: "Cancellation Failed", description: "There was a problem cancelling.", variant: "destructive" })
    } finally {
      setIsCancelling(false)
      setCancelModalOpen(false)
      setAppointmentToCancel(null)
    }
  }

  const upcomingAppointments = appointmentsList.filter(isUpcoming)
  const pastAppointments = appointmentsList.filter(isPast)

  const filteredAppointments = (list: Appointment[]) =>
    list.filter((apt) => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        apt.doctor?.toLowerCase().includes(q) ||
        apt.hospital?.toLowerCase().includes(q) ||
        apt.specialization?.toLowerCase().includes(q)
      )
    })

  return (
    <DashboardLayout role="patient" title="My Appointments" subtitle="Manage and track your appointments">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">My Appointments</h1>
            <p className="text-muted-foreground">Manage and track your appointments</p>
          </div>
          <Link href="/book-appointment">
            <Button>
              <Calendar className="mr-2 h-4 w-4" />
              Book New Appointment
            </Button>
          </Link>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by doctor, hospital, or specialization..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upcoming">Upcoming ({upcomingAppointments.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastAppointments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="upcoming" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments(upcomingAppointments).length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No upcoming appointments</h3>
                      <p className="text-muted-foreground mb-4">Book an appointment to get started.</p>
                      <Link href="/book-appointment">
                        <Button>Book Appointment</Button>
                      </Link>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAppointments(upcomingAppointments).map((apt) => (
                    <AppointmentCard
                      key={apt.id}
                      appointment={apt}
                      showActions
                      onCancel={() => handleCancelClick(apt.id)}
                    />
                  ))
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments(pastAppointments).length === 0 ? (
                  <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <h3 className="text-lg font-semibold">No past appointments</h3>
                      <p className="text-muted-foreground">Your appointment history will appear here.</p>
                    </CardContent>
                  </Card>
                ) : (
                  filteredAppointments(pastAppointments).map((apt) => (
                    <AppointmentCard key={apt.id} appointment={apt} />
                  ))
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Cancel confirmation dialog */}
      <Dialog open={cancelModalOpen} onOpenChange={setCancelModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this appointment? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelModalOpen(false)} disabled={isCancelling}>
              Keep Appointment
            </Button>
            <Button variant="destructive" onClick={confirmCancel} disabled={isCancelling}>
              {isCancelling ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Yes, Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

function AppointmentCard({
  appointment,
  showActions = false,
  onCancel,
}: {
  appointment: Appointment
  showActions?: boolean
  onCancel?: () => void
}) {
  const statusUpper = appointment.status?.toUpperCase() ?? "BOOKED"

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-0">
        <div className="flex flex-col lg:flex-row">
          {/* Left status bar */}
          <div
            className={`w-full lg:w-2 ${
              statusUpper === "CONFIRMED"
                ? "bg-green-500"
                : statusUpper === "BOOKED"
                ? "bg-blue-500"
                : statusUpper === "COMPLETED"
                ? "bg-slate-400"
                : "bg-red-500"
            }`}
          />

          <div className="flex-1 p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Doctor Info */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground">{appointment.doctor || "—"}</h3>
                  <p className="text-sm text-muted-foreground">{appointment.specialization || "—"}</p>
                  {appointment.hospital && (
                    <div className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {appointment.hospital}
                    </div>
                  )}
                </div>
              </div>

              {/* Date & Time & Status */}
              <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                {appointment.date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{appointment.date}</span>
                  </div>
                )}
                {appointment.time && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{appointment.time}</span>
                  </div>
                )}
                {appointment.tokenNumber && (
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {appointment.tokenNumber}
                    </span>
                    <span className="text-xs text-muted-foreground">Token</span>
                  </div>
                )}
                <Badge variant="secondary" className={`${statusColors[statusUpper] || statusColors[appointment.status] || ''} flex items-center gap-1`}>
                  {statusIcons[statusUpper] || <Clock className="h-4 w-4" />}
                  {getStatusLabel(appointment.status)}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {appointment.type === "VIDEO" ? (
                    <Video className="h-3 w-3" />
                  ) : (
                    <User className="h-3 w-3" />
                  )}
                  {appointment.type === "VIDEO" ? "Video Call" : "In-Person"}
                </Badge>
              </div>

              {/* Actions */}
              {showActions && (
                <div className="flex gap-2">
                  {(statusUpper === "BOOKED" || statusUpper === "CONFIRMED") && (
                    <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={onCancel}>
                      <X className="mr-2 h-4 w-4" />
                      Cancel
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Fee */}
            {(appointment.fee || appointment.consultationFee) && (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <span className="text-sm text-muted-foreground">Consultation Fee</span>
                <span className="flex items-center gap-1 font-semibold text-foreground">
                  <IndianRupee className="h-4 w-4" />
                  {appointment.fee ?? appointment.consultationFee}
                </span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
