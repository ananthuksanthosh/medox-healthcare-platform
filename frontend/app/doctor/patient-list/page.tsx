"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog"
import {
  Search, User, Phone, Mail, Calendar,
  Eye, FileText, Download, ExternalLink, Loader2, X
} from "lucide-react"

const API = "http://localhost:5000"

function getToken() {
  if (typeof window === "undefined") return null
  const t = localStorage.getItem("token")
  if (t && t !== "undefined") return t
  return localStorage.getItem("medox.authToken") || null
}

function getHeaders(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

export default function PatientListPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [patients, setPatients] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Profile modal
  const [selectedPatient, setSelectedPatient] = useState<any>(null)
  const [showProfile, setShowProfile] = useState(false)

  // Reports modal
  const [reportsPatient, setReportsPatient] = useState<any>(null)
  const [showReports, setShowReports] = useState(false)
  const [reports, setReports] = useState<any[]>([])
  const [reportsLoading, setReportsLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`${API}/api/doctors/me/patients`, { headers: getHeaders() })
        const data = await res.json()
        if (data.success) setPatients(data.data.patients ?? [])
      } catch (e) { console.error(e) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  const openReports = async (patient: any) => {
    setReportsPatient(patient)
    setShowReports(true)
    setReportsLoading(true)
    try {
      // Doctors can view a patient's reports via a dedicated endpoint
      const res = await fetch(`${API}/api/reports/patient/${patient.id}`, { headers: getHeaders() })
      const data = await res.json()
      setReports(data.data?.reports ?? data.reports ?? [])
    } catch (e) {
      setReports([])
    } finally {
      setReportsLoading(false)
    }
  }

  const filtered = patients.filter(p => {
    const q = searchQuery.toLowerCase()
    const matchSearch = !q || (p.name || "").toLowerCase().includes(q) || (p.email || "").toLowerCase().includes(q)
    return matchSearch
  })

  const getInitials = (name: string) =>
    (name || "?").split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)

  const formatDob = (dob: string) => {
    if (!dob) return "—"
    const d = new Date(dob)
    const age = Math.floor((Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25))
    return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })} (${age} yrs)`
  }

  return (
    <DashboardLayout role="doctor" title="Patient List" subtitle="View and manage your patients">
      <div className="space-y-6">

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            { label: "Total Patients", value: patients.length, color: "bg-blue-100 text-blue-600" },
            { label: "Active Patients", value: patients.length, color: "bg-green-100 text-green-600" },
            { label: "Recent Visits", value: patients.filter(p => p.lastVisit && new Date(p.lastVisit) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)).length, color: "bg-purple-100 text-purple-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}>
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patients by name or email..."
                className="pl-10"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Patient List */}
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <User className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold">No patients found</h3>
              <p className="text-muted-foreground mt-1">Patients appear here once appointments are booked with you.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(patient => (
              <Card key={patient.id} className="hover:shadow-md transition-all">
                <CardContent className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 p-6">
                  {/* Left: Avatar + Name */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/20">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {getInitials(patient.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground">{patient.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {patient.gender || "Unknown"} • {patient.lastReason || "General Consultation"}
                      </p>
                    </div>
                  </div>

                  {/* Middle: Contact info */}
                  <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2">
                    {patient.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 shrink-0" />
                        <span>{patient.phone}</span>
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 shrink-0" />
                        <span className="truncate">{patient.email}</span>
                      </div>
                    )}
                    {patient.lastVisit && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>Last visit: {new Date(patient.lastVisit).toLocaleDateString("en-IN")}</span>
                      </div>
                    )}
                  </div>

                  {/* Right: Actions (NO Message) */}
                  <div className="flex flex-wrap gap-2 shrink-0">
                    <Button
                      variant="outline" size="sm" className="gap-2"
                      onClick={() => { setSelectedPatient(patient); setShowProfile(true) }}
                    >
                      <Eye className="h-4 w-4" /> View Profile
                    </Button>
                    <Button
                      variant="outline" size="sm" className="gap-2"
                      onClick={() => openReports(patient)}
                    >
                      <FileText className="h-4 w-4" /> Medical Records
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* ── Patient Profile Modal ── */}
      <Dialog open={showProfile} onOpenChange={setShowProfile}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Patient Profile</DialogTitle>
            <DialogDescription>Full details for this patient</DialogDescription>
          </DialogHeader>
          {selectedPatient && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary/20">
                  <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">
                    {getInitials(selectedPatient.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold">{selectedPatient.name}</h3>
                  <Badge className="bg-blue-100 text-blue-700 mt-1">Patient</Badge>
                </div>
              </div>
              <div className="grid gap-3 text-sm border-t pt-4">
                {[
                  { label: "Email", value: selectedPatient.email },
                  { label: "Phone", value: selectedPatient.phone || "—" },
                  { label: "Gender", value: selectedPatient.gender || "—" },
                  { label: "Date of Birth", value: selectedPatient.dob ? formatDob(selectedPatient.dob) : "—" },
                  { label: "Last Visit", value: selectedPatient.lastVisit ? new Date(selectedPatient.lastVisit).toLocaleDateString("en-IN") : "—" },
                  { label: "Last Reason", value: selectedPatient.lastReason || "—" },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground font-medium">{label}</span>
                    <span className="text-foreground font-semibold text-right max-w-[55%]">{value}</span>
                  </div>
                ))}
              </div>
              <Button className="w-full mt-2" variant="outline" onClick={() => { setShowProfile(false); openReports(selectedPatient) }}>
                <FileText className="mr-2 h-4 w-4" /> View Medical Records
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Patient Reports Modal ── */}
      <Dialog open={showReports} onOpenChange={setShowReports}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Medical Records — {reportsPatient?.name}</DialogTitle>
            <DialogDescription>Uploaded reports and documents by this patient</DialogDescription>
          </DialogHeader>
          {reportsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : reports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <h4 className="font-semibold">No reports uploaded</h4>
              <p className="text-sm text-muted-foreground mt-1">This patient has not uploaded any medical records yet.</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {reports.map(report => (
                <div key={report.id} className="flex items-center justify-between rounded-xl border p-4 bg-card hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                      <FileText className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-foreground truncate">{report.title || "Medical Report"}</p>
                      <p className="text-xs text-muted-foreground">{report.reportType || report.type || "General"} • {report.date}</p>
                      {report.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{report.description}</p>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0 ml-3">
                    <a href={`${API}${report.fileUrl}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="gap-1.5">
                        <ExternalLink className="h-3.5 w-3.5" /> View
                      </Button>
                    </a>
                    <a href={`${API}/api/reports/download/${report.id}`} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" className="gap-1.5 bg-primary text-white hover:bg-primary/90">
                        <Download className="h-3.5 w-3.5" /> Download
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}