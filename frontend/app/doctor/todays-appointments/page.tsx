"use client"

import { useState, useEffect, useCallback, useMemo } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Search, Clock, User, Phone, CheckCircle, XCircle, AlertCircle, Calendar, Filter, Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

const API = "http://localhost:5000"
const getToken = () => { let t = localStorage.getItem("token"); if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); return (!t || t === "undefined") ? null : t }

const statusColors: Record<string, string> = {
  BOOKED: "bg-blue-100 text-blue-700",
  CONFIRMED: "bg-green-100 text-green-700",
  COMPLETED: "bg-gray-100 text-gray-700",
  CANCELLED: "bg-red-100 text-red-700",
  NO_SHOW: "bg-orange-100 text-orange-700",
}

export default function TodaysAppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [updatingId, setUpdatingId] = useState<number | null>(null)
  const { toast } = useToast()

  // Dynamic date schedule select state
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

  const fetchAppointments = useCallback(async () => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    try {
      const res = await fetch(`${API}/api/appointments/doctor/my?date=${selectedDate}`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) setAppointments(data.data.appointments)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [selectedDate])

  useEffect(() => { fetchAppointments() }, [fetchAppointments])

  const handleStatus = async (id: number, status: string) => {
    setUpdatingId(id)
    const token = getToken()
    try {
      const res = await fetch(`${API}/api/appointments/${id}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      })
      if (res.ok) {
        toast({ title: `Marked as ${status}` })
        fetchAppointments()
      } else {
        const d = await res.json()
        toast({ title: "Failed", description: d.message, variant: "destructive" })
      }
    } catch {
      toast({ title: "Network Error", variant: "destructive" })
    } finally {
      setUpdatingId(null)
    }
  }

  const filteredAppointments = useMemo(() => {
    return appointments.filter(apt => {
      const name = (apt.patientName || apt.patient?.name || "").toLowerCase()
      const query = searchQuery.toLowerCase()
      return name.includes(query)
    })
  }, [appointments, searchQuery])

  return (
    <DashboardLayout role="doctor" title="Appointments Schedule" subtitle="View and manage patient queues">
      <div className="space-y-6">
        
        {/* Date Selector Tabs */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card border p-4 rounded-xl shadow-sm">
          <div className="flex bg-secondary/50 rounded-lg p-1 w-full sm:w-auto">
            {dateTabs.map(tab => (
              <button
                key={tab.value}
                onClick={() => { setLoading(true); setSelectedDate(tab.value) }}
                className={`flex-1 sm:flex-none px-4 py-2 text-xs sm:text-sm font-semibold rounded-md transition-all ${
                  selectedDate === tab.value
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.label} ({tab.shortDate})
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search patients..."
              className="pl-10"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Appointment queue list */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredAppointments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-semibold">No appointments found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {appointments.length === 0 
                  ? "There are no bookings registered for this day." 
                  : "No matches found for your search query."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredAppointments.map(apt => {
              const time = apt.slotTime || new Date(apt.appointmentDate).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
              const isUpdating = updatingId === apt.id

              return (
                <Card key={apt.id} className="hover:shadow-md transition-all border-l-4 border-l-primary">
                  <CardContent className="flex flex-col md:flex-row md:items-center gap-6 p-6">
                    
                    {/* Patient brief */}
                    <div className="flex items-center gap-4 flex-1">
                      <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
                        <AvatarFallback className="bg-primary/5 text-primary font-bold">
                          {((apt.patientName || apt.patient?.name || "?").charAt(0).toUpperCase())}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <h4 className="text-lg font-bold text-foreground truncate">{apt.patientName || apt.patient?.name}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                          <span>Token: <strong className="text-foreground">#{apt.tokenNumber || "1"}</strong></span>
                          <span>•</span>
                          <span>Reason: <strong className="text-foreground">{apt.notes || "General Consultation"}</strong></span>
                        </p>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground md:border-l md:pl-6">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-semibold text-foreground">{time}</span>
                      </div>
                      {apt.patient?.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-primary shrink-0" />
                          <span>{apt.patient.phone}</span>
                        </div>
                      )}
                      <Badge className={(statusColors[apt.status] || "bg-gray-100") + " border-none font-semibold text-xs ml-2"}>
                        {apt.status}
                      </Badge>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 md:border-l md:pl-6 shrink-0">
                      {isUpdating ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary" />
                      ) : (
                        <>
                          {(apt.status === "CONFIRMED" || apt.status === "BOOKED") && (
                            <Button size="sm" className="bg-primary hover:bg-primary/95 text-white" onClick={() => handleStatus(apt.id, "COMPLETED")}>
                              <CheckCircle className="mr-1.5 h-4 w-4" /> Complete
                            </Button>
                          )}
                        </>
                      )}
                    </div>

                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}