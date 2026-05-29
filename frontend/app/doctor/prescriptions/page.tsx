"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import {
  Search,
  Pill,
  User,
  Calendar,
  Eye,
  Download,
  Plus,
  CheckCircle,
  AlertCircle,
  Clock,
  Trash,
  Loader2,
  X
} from "lucide-react"
import { downloadPrescriptionPDF } from "@/lib/mock-store"
import { useToast } from "@/components/ui/use-toast"

const API = "http://localhost:5000"
const getToken = () => {
  if (typeof window === "undefined") return null
  return (
    localStorage.getItem("token") ||
    localStorage.getItem("medox.authToken") ||
    null
  )
}

interface Medicine {
  name: string
  dosage: string
  frequency: string
  duration: string
}

interface Prescription {
  id: number
  prescriptionId?: string
  patientName?: string
  diagnosis: string
  notes?: string
  status: string
  createdAt?: string
  date?: string
  medicines: Medicine[]
  doctor?: string
  hospital?: string
  specialization?: string
  refillsRemaining?: number
  validUntil?: string
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  completed: "bg-blue-100 text-blue-700",
  expired: "bg-red-100 text-red-700"
}

export default function PrescriptionsPage() {
  const { toast } = useToast()
  const [searchQuery, setSearchQuery] = useState("")
  const [prescriptionsList, setPrescriptionsList] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)

  // Creation / Edit Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingPrescriptionId, setEditingPrescriptionId] = useState<number | null>(null)
  const [appointments, setAppointments] = useState<any[]>([])
  const [loadingAppointments, setLoadingAppointments] = useState(false)
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [notes, setNotes] = useState("")
  const [medicines, setMedicines] = useState<Medicine[]>([
    { name: "", dosage: "", frequency: "", duration: "" }
  ])
  const [saving, setSaving] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null)

  const loadPrescriptions = useCallback(async () => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    try {
      const res = await fetch(`${API}/api/prescriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error("Failed to fetch prescriptions")
      const data = await res.json()
      const list = data.data?.prescriptions ?? data.prescriptions ?? data ?? []
      setPrescriptionsList(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error("Failed to load prescriptions:", err)
      setPrescriptionsList([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPrescriptions()
  }, [loadPrescriptions])

  const handleOpenCreateModal = async () => {
    setEditingPrescriptionId(null)
    setSelectedAppointmentId("")
    setDiagnosis("")
    setNotes("")
    setMedicines([{ name: "", dosage: "", frequency: "", duration: "" }])
    setShowModal(true)

    // Fetch appointments for dropdown
    const token = getToken()
    if (!token) return
    setLoadingAppointments(true)
    try {
      const res = await fetch(`${API}/api/appointments`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const appts = data.data?.appointments ?? data.appointments ?? data ?? []
        setAppointments(Array.isArray(appts) ? appts.filter((a: any) => 
          a.status === "CONFIRMED" || a.status === "COMPLETED" || a.status === "BOOKED"
        ) : [])
      }
    } catch (err) {
      console.error("Failed to load appointments:", err)
    } finally {
      setLoadingAppointments(false)
    }
  }

  const handleOpenEditModal = (rx: Prescription) => {
    setEditingPrescriptionId(rx.id)
    setSelectedAppointmentId("")
    setDiagnosis(rx.diagnosis)
    setNotes(rx.notes || "")
    setMedicines(
      rx.medicines && rx.medicines.length > 0
        ? rx.medicines
        : [{ name: "", dosage: "", frequency: "", duration: "" }]
    )
    setShowModal(true)
  }

  const addMedicineRow = () => {
    setMedicines([...medicines, { name: "", dosage: "", frequency: "", duration: "" }])
  }

  const removeMedicineRow = (index: number) => {
    setMedicines(medicines.filter((_, i) => i !== index))
  }

  const updateMedicine = (index: number, field: string, val: string) => {
    setMedicines(medicines.map((m, i) => i === index ? { ...m, [field]: val } : m))
  }

  const handleSavePrescription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingPrescriptionId && !selectedAppointmentId) {
      toast({ title: "Please select a patient appointment", variant: "destructive" })
      return
    }
    if (!diagnosis.trim()) {
      toast({ title: "Diagnosis is required", variant: "destructive" })
      return
    }
    const emptyMedName = medicines.some(m => !m.name.trim())
    if (emptyMedName) {
      toast({ title: "Medication name is required for all entries", variant: "destructive" })
      return
    }

    setSaving(true)
    const token = getToken()
    if (!token) { setSaving(false); return }

    try {
      let res: Response
      if (editingPrescriptionId) {
        res = await fetch(`${API}/api/prescriptions/${editingPrescriptionId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ diagnosis, notes, medicines })
        })
      } else {
        res = await fetch(`${API}/api/prescriptions`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            appointmentId: Number(selectedAppointmentId),
            diagnosis,
            notes,
            medicines
          })
        })
      }

      if (!res.ok) {
        const errData = await res.json()
        toast({ title: "Failed to save prescription", description: errData.message, variant: "destructive" })
        return
      }

      toast({ title: editingPrescriptionId ? "Prescription Updated ✅" : "Prescription Created ✅" })
      setShowModal(false)
      setEditingPrescriptionId(null)
      setSelectedAppointmentId("")
      setDiagnosis("")
      setNotes("")
      setMedicines([{ name: "", dosage: "", frequency: "", duration: "" }])
      await loadPrescriptions()
    } catch (err: any) {
      toast({ title: "Network error", description: err.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleDeletePrescription = async (id: number) => {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`${API}/api/prescriptions/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      })
      if (res.ok) {
        setPrescriptionsList(prev => prev.filter(rx => rx.id !== id))
        toast({ title: "Prescription Deleted" })
      } else {
        const errData = await res.json()
        toast({ title: "Failed to delete", description: errData.message, variant: "destructive" })
      }
    } catch (err: any) {
      toast({ title: "Network error", variant: "destructive" })
    } finally {
      setDeleteConfirmId(null)
    }
  }

  const filteredPrescriptions = prescriptionsList.filter(rx =>
    (rx.patientName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rx.diagnosis || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (rx.prescriptionId || "").toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activePrescriptions = prescriptionsList.filter(rx => rx.status === "active").length
  const totalMedications = prescriptionsList.reduce((sum, rx) => sum + (rx.medicines?.length ?? 0), 0)

  return (
    <DashboardLayout role="doctor" title="Prescriptions" subtitle="Manage prescriptions for your patients">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Prescriptions</h1>
            <p className="text-muted-foreground">Manage prescriptions for your patients</p>
          </div>
          <Button className="gap-2" onClick={handleOpenCreateModal}>
            <Plus className="h-4 w-4" />
            New Prescription
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <Pill className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{prescriptionsList.length}</p>
                  <p className="text-sm text-muted-foreground">Total Prescriptions</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{activePrescriptions}</p>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100">
                  <Pill className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{totalMedications}</p>
                  <p className="text-sm text-muted-foreground">Medications Prescribed</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search prescriptions by patient, diagnosis..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Prescriptions List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No prescriptions found</h3>
                <p className="text-muted-foreground mb-4">Create a new prescription to get started.</p>
                <Button onClick={handleOpenCreateModal}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Prescription
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredPrescriptions.map((prescription) => {
              const name = prescription.patientName || "General Patient"
              const dateStr = prescription.createdAt
                ? new Date(prescription.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                : prescription.date || "—"
              return (
                <Card key={prescription.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col lg:flex-row">
                      <div className="flex-1 p-6">
                        <div className="flex items-start gap-4">
                          <Avatar className="h-12 w-12 border-2 border-primary/20">
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                              <h3 className="text-lg font-semibold text-foreground">{name}</h3>
                              <Badge className={`${statusColors[prescription.status] ?? "bg-slate-100 text-slate-700"} rounded-full px-3 py-1 text-sm font-medium`}>
                                {prescription.status ?? "active"}
                              </Badge>
                            </div>
                            <div className="grid gap-2 text-sm text-muted-foreground sm:grid-cols-2 mb-3">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{dateStr}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Pill className="h-4 w-4" />
                                <span>{prescription.medicines?.length ?? 0} medications</span>
                              </div>
                            </div>
                            <p className="text-sm text-foreground mb-2">
                              <strong>Diagnosis:</strong> {prescription.diagnosis}
                            </p>
                            {prescription.notes && (
                              <p className="text-sm text-muted-foreground mb-2">
                                <strong>Notes:</strong> {prescription.notes}
                              </p>
                            )}
                            <div className="mt-3 space-y-1.5 border-t pt-3">
                              {(prescription.medicines ?? []).map((med, index) => (
                                <div key={index} className="text-sm text-slate-700">
                                  💊 <strong className="text-foreground">{med.name}</strong>
                                  {med.dosage && ` • ${med.dosage}`}
                                  {med.frequency && ` • ${med.frequency}`}
                                  {med.duration && ` • ${med.duration}`}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 p-6 lg:w-48 lg:border-l lg:border-border justify-center">
                        <Button
                          variant="outline"
                          className="w-full gap-2"
                          onClick={() => downloadPrescriptionPDF(prescription)}
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full gap-2 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary"
                          onClick={() => handleOpenEditModal(prescription)}
                        >
                          <Eye className="h-4 w-4" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full gap-2 text-red-600 hover:bg-red-50 hover:text-red-700 border-red-200"
                          onClick={() => setDeleteConfirmId(prescription.id)}
                        >
                          <Trash className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      </div>

      {/* ─── Delete Confirmation Dialog ─── */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
        <DialogContent className="max-w-sm text-center">
          <DialogHeader>
            <div className="flex justify-center mb-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
                <Trash className="h-7 w-7 text-red-600" />
              </div>
            </div>
            <DialogTitle className="text-xl font-bold">Delete Prescription?</DialogTitle>
            <DialogDescription>
              This will permanently remove this prescription. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 mt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-500 hover:bg-red-600 text-white"
              onClick={() => deleteConfirmId && handleDeletePrescription(deleteConfirmId)}
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── NEW / EDIT PRESCRIPTION MODAL ─── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingPrescriptionId ? "Edit Prescription" : "New Prescription"}</DialogTitle>
            <DialogDescription>
              {editingPrescriptionId
                ? "Modify this prescription's diagnosis, notes, and medication list."
                : "Create a new medication prescription for a patient appointment."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSavePrescription} className="space-y-4 mt-2">
            {/* Appointment / Patient Dropdown — only for new */}
            {!editingPrescriptionId && (
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Select Patient Appointment *</label>
                {loadingAppointments ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading appointments...
                  </div>
                ) : (
                  <select
                    value={selectedAppointmentId}
                    onChange={(e) => setSelectedAppointmentId(e.target.value)}
                    required
                    className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">-- Choose Patient / Booking --</option>
                    {appointments.length === 0 ? (
                      <option disabled>No confirmed appointments available</option>
                    ) : (
                      appointments.map((a: any) => (
                        <option key={a.id} value={a.id}>
                          {a.patientName || a.patient?.name || "Patient"} -{" "}
                          {new Date(a.appointmentDate).toLocaleDateString("en-IN")}{" "}
                          ({a.reason || "Consultation"})
                        </option>
                      ))
                    )}
                  </select>
                )}
              </div>
            )}

            {/* Diagnosis */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Diagnosis / Reason *</label>
              <Input
                placeholder="e.g. Hypertension, Viral Fever"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
              />
            </div>

            {/* Doctor Notes */}
            <div>
              <label className="text-xs font-semibold text-slate-600 block mb-1">Instruction / Notes (Optional)</label>
              <textarea
                rows={2}
                placeholder="Special dietary advice, lab tests required, etc."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            {/* Medicines List */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-700">Medications</span>
                <Button type="button" size="sm" variant="outline" className="gap-1" onClick={addMedicineRow}>
                  <Plus className="h-3 w-3" /> Add Medication
                </Button>
              </div>

              {medicines.map((med, index) => (
                <div key={index} className="flex flex-col sm:flex-row items-end gap-2 p-3 rounded-lg border bg-slate-50/50">
                  <div className="flex-1 min-w-0 w-full">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Medicine Name *</label>
                    <Input
                      placeholder="e.g. Paracetamol"
                      value={med.name}
                      onChange={(e) => updateMedicine(index, "name", e.target.value)}
                      required
                    />
                  </div>
                  <div className="w-full sm:w-28">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Dosage</label>
                    <Input
                      placeholder="e.g. 500mg"
                      value={med.dosage}
                      onChange={(e) => updateMedicine(index, "dosage", e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-32">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Frequency</label>
                    <Input
                      placeholder="e.g. 1-0-1"
                      value={med.frequency}
                      onChange={(e) => updateMedicine(index, "frequency", e.target.value)}
                    />
                  </div>
                  <div className="w-full sm:w-28">
                    <label className="text-[10px] font-bold text-slate-500 block mb-0.5">Duration</label>
                    <Input
                      placeholder="e.g. 5 days"
                      value={med.duration}
                      onChange={(e) => updateMedicine(index, "duration", e.target.value)}
                    />
                  </div>
                  {medicines.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-red-500 hover:bg-red-50 hover:text-red-600 shrink-0"
                      onClick={() => removeMedicineRow(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 border-t pt-4">
              <Button type="button" variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                {saving ? "Saving..." : editingPrescriptionId ? "Update Prescription" : "Save Prescription"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}