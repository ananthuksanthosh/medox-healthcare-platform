"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import {
  Clock,
  Calendar,
  Save,
  RefreshCw,
  CheckCircle,
  XCircle,
  Settings
} from "lucide-react"
import { getCurrentUser, getAvailability, saveAvailability, DayAvailability } from "@/lib/mock-store"

const daysOfWeek = [
  { name: "Monday", short: "Mon" },
  { name: "Tuesday", short: "Tue" },
  { name: "Wednesday", short: "Wed" },
  { name: "Thursday", short: "Thu" },
  { name: "Friday", short: "Fri" },
  { name: "Saturday", short: "Sat" },
  { name: "Sunday", short: "Sun" }
]

const timeSlots = [
  "09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM",
  "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM", "02:30 PM",
  "03:00 PM", "03:30 PM", "04:00 PM", "04:30 PM", "05:00 PM", "05:30 PM"
]

export default function AvailabilityPage() {
  const { toast } = useToast()
  const [availability, setAvailability] = useState<Record<string, DayAvailability>>({
    Monday: { enabled: false, slots: [] },
    Tuesday: { enabled: false, slots: [] },
    Wednesday: { enabled: false, slots: [] },
    Thursday: { enabled: false, slots: [] },
    Friday: { enabled: false, slots: [] },
    Saturday: { enabled: false, slots: [] },
    Sunday: { enabled: false, slots: [] }
  })
  const [selectedDay, setSelectedDay] = useState("Monday")
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const currentUser = getCurrentUser()
    if (currentUser) {
      setUser(currentUser)
      const loadAvailability = async () => {
        const schedule = await getAvailability(currentUser.email)
        setAvailability(schedule)
      }
      loadAvailability()
    }
  }, [])

  const toggleDay = (day: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: !prev[day].enabled
      }
    }))
  }

  const toggleSlot = (day: string, slot: string) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.includes(slot)
          ? prev[day].slots.filter(s => s !== slot)
          : [...prev[day].slots, slot].sort()
      }
    }))
  }

  const handleSave = async () => {
    if (user) {
      try {
        await saveAvailability(user.email, availability)
        toast({
          title: "Availability Saved",
          description: "Your weekly availability schedule has been successfully updated.",
        })
      } catch (error) {
        console.error("Save availability error:", error)
        toast({
          title: "Failed to Save",
          description: "There was a problem updating your availability schedule.",
          variant: "destructive"
        })
      }
    }
  }

  const handleReset = () => {
    const defaults: Record<string, DayAvailability> = {
      Monday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
      Tuesday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
      Wednesday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
      Thursday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
      Friday: { enabled: true, slots: ["09:00 AM", "09:30 AM", "10:00 AM", "10:30 AM", "11:00 AM", "02:00 PM", "02:30 PM", "03:00 PM"] },
      Saturday: { enabled: false, slots: [] },
      Sunday: { enabled: false, slots: [] }
    }
    setAvailability(defaults)
    toast({
      title: "Schedule Reset",
      description: "Availability reset to default working hours. Make sure to click save to persist.",
    })
  }

  const enabledDays = Object.values(availability).filter(day => day.enabled).length
  const totalSlots = Object.values(availability).reduce((sum, day) => sum + day.slots.length, 0)

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Availability</h1>
            <p className="text-muted-foreground">Set and manage your availability schedule</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2" onClick={handleReset}>
              <RefreshCw className="h-4 w-4" />
              Reset to Default
            </Button>
            <Button className="gap-2" onClick={handleSave}>
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{enabledDays}</p>
                  <p className="text-sm text-muted-foreground">Working Days</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Clock className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalSlots}</p>
                  <p className="text-sm text-muted-foreground">Available Slots</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Settings className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">30</p>
                  <p className="text-sm text-muted-foreground">Min per Slot</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Schedule */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Days List */}
          <Card>
            <CardHeader>
              <CardTitle>Working Days</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {daysOfWeek.map((day) => (
                <div key={day.name} className="flex items-center justify-between">
                  <span className="font-medium">{day.name}</span>
                  <Switch
                    checked={availability[day.name]?.enabled || false}
                    onCheckedChange={() => toggleDay(day.name)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Time Slots */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Time Slots - {selectedDay}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Select the time slots when you're available for appointments
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {timeSlots.map((slot) => (
                  <Button
                    key={slot}
                    variant={availability[selectedDay]?.slots.includes(slot) ? "default" : "outline"}
                    size="sm"
                    className="justify-start"
                    onClick={() => toggleSlot(selectedDay, slot)}
                    disabled={!availability[selectedDay]?.enabled}
                  >
                    {availability[selectedDay]?.slots.includes(slot) ? (
                      <CheckCircle className="h-4 w-4 mr-2" />
                    ) : (
                      <XCircle className="h-4 w-4 mr-2" />
                    )}
                    {slot}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Day Selector */}
        <Card>
          <CardHeader>
            <CardTitle>Select Day to Edit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {daysOfWeek.map((day) => (
                <Button
                  key={day.name}
                  variant={selectedDay === day.name ? "default" : "outline"}
                  onClick={() => setSelectedDay(day.name)}
                  disabled={!availability[day.name]?.enabled}
                >
                  {day.short}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Current Schedule Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Current Schedule Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {daysOfWeek.map((day) => (
              <div key={day.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium w-20">{day.short}</span>
                  <Badge variant={availability[day.name]?.enabled ? "default" : "secondary"}>
                    {availability[day.name]?.enabled ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {availability[day.name]?.enabled
                    ? `${availability[day.name]?.slots.length} slots`
                    : "No slots"
                  }
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}