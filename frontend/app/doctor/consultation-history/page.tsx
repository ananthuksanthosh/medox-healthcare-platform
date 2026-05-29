"use client"

import { useState } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Search,
  Calendar,
  User,
  Clock,
  Filter,
  Eye,
  Download,
  MessageSquare,
  Stethoscope,
  FileText
} from "lucide-react"

const consultations = [
  {
    id: 1,
    patientName: "Arjun Kumar",
    patientAge: 35,
    date: "2026-05-10",
    time: "09:00 AM",
    type: "Follow-up",
    diagnosis: "Hypertension - Stable",
    notes: "Patient reports good medication compliance. BP readings within normal range.",
    duration: "15 min",
    status: "completed",
    avatar: "/avatars/arjun.jpg"
  },
  {
    id: 2,
    patientName: "Priya Menon",
    patientAge: 28,
    date: "2026-05-05",
    time: "10:30 AM",
    type: "Consultation",
    diagnosis: "Migraine - Acute episode",
    notes: "Prescribed Sumatriptan for acute relief. Advised trigger avoidance.",
    duration: "20 min",
    status: "completed",
    avatar: "/avatars/priya.jpg"
  },
  {
    id: 3,
    patientName: "Rajesh Nair",
    patientAge: 45,
    date: "2026-04-28",
    time: "02:00 PM",
    type: "Post-operative",
    diagnosis: "Post-surgery recovery - Good progress",
    notes: "Wound healing well. Pain management adequate. Follow-up in 2 weeks.",
    duration: "25 min",
    status: "completed",
    avatar: "/avatars/rajesh.jpg"
  },
  {
    id: 4,
    patientName: "Lakshmi Pillai",
    patientAge: 52,
    date: "2026-04-25",
    time: "11:15 AM",
    type: "Consultation",
    diagnosis: "Allergic Dermatitis - Improving",
    notes: "Rash responding well to treatment. Continue current regimen.",
    duration: "18 min",
    status: "completed",
    avatar: "/avatars/lakshmi.jpg"
  },
  {
    id: 5,
    patientName: "Ananya Das",
    patientAge: 31,
    date: "2026-04-20",
    time: "03:30 PM",
    type: "Prenatal",
    diagnosis: "Normal pregnancy - 24 weeks",
    notes: "Routine check-up. Fetal development normal. Next visit in 4 weeks.",
    duration: "30 min",
    status: "completed",
    avatar: "/avatars/ananya.jpg"
  },
  {
    id: 6,
    patientName: "Suresh Menon",
    patientAge: 58,
    date: "2026-03-15",
    time: "01:00 PM",
    type: "Consultation",
    diagnosis: "Diabetes Type 2 - Controlled",
    notes: "HbA1c improved. Continue current treatment plan.",
    duration: "22 min",
    status: "completed",
    avatar: "/avatars/suresh.jpg"
  }
]

const typeColors: Record<string, string> = {
  "Consultation": "bg-blue-100 text-blue-700",
  "Follow-up": "bg-green-100 text-green-700",
  "Post-operative": "bg-purple-100 text-purple-700",
  "Prenatal": "bg-pink-100 text-pink-700"
}

export default function ConsultationHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")

  const filteredConsultations = consultations.filter(consultation => {
    const matchesSearch = consultation.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         consultation.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = typeFilter === "all" || consultation.type === typeFilter
    return matchesSearch && matchesType
  })

  const totalConsultations = consultations.length
  const thisMonth = consultations.filter(c => c.date.startsWith("2026-05")).length
  const avgDuration = Math.round(consultations.reduce((sum, c) => sum + parseInt(c.duration), 0) / consultations.length)

  return (
    <DashboardLayout role="doctor">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Consultation History</h1>
            <p className="text-muted-foreground">View your past consultations</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Stethoscope className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalConsultations}</p>
                  <p className="text-sm text-muted-foreground">Total Consultations</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <Calendar className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{thisMonth}</p>
                  <p className="text-sm text-muted-foreground">This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Clock className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{avgDuration}</p>
                  <p className="text-sm text-muted-foreground">Avg Duration (min)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-orange-100">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {new Set(consultations.map(c => c.patientName)).size}
                  </p>
                  <p className="text-sm text-muted-foreground">Unique Patients</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search consultations..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <select
                className="px-3 py-2 border border-border rounded-md bg-background"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                <option value="Consultation">Consultation</option>
                <option value="Follow-up">Follow-up</option>
                <option value="Post-operative">Post-operative</option>
                <option value="Prenatal">Prenatal</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Consultations List */}
        <div className="space-y-4">
          {filteredConsultations.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Stethoscope className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No consultations found</h3>
                <p className="text-muted-foreground">Your consultation history will appear here</p>
              </CardContent>
            </Card>
          ) : (
            filteredConsultations.map((consultation) => (
              <Card key={consultation.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={consultation.avatar} alt={consultation.patientName} />
                        <AvatarFallback>
                          {consultation.patientName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">{consultation.patientName}</h3>
                          <Badge className={`${typeColors[consultation.type]} rounded-full px-3 py-1 text-sm font-medium`}>
                            {consultation.type}
                          </Badge>
                        </div>
                        <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 lg:grid-cols-3 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span>{consultation.patientAge} years old</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            <span>{consultation.date} at {consultation.time}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{consultation.duration}</span>
                          </div>
                        </div>
                        <p className="text-sm text-foreground mb-2">
                          <strong>Diagnosis:</strong> {consultation.diagnosis}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Notes:</strong> {consultation.notes}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
                      <Button variant="outline" size="sm" className="gap-2">
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <FileText className="h-4 w-4" />
                        Medical Records
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <Download className="h-4 w-4" />
                        Download Report
                      </Button>
                      <Button variant="outline" size="sm" className="gap-2">
                        <MessageSquare className="h-4 w-4" />
                        Follow-up
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  )
}