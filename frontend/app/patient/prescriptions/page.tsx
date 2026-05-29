"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Pill, Download, Eye, Search, Calendar, User, Building2, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { getPrescriptions, Prescription, downloadPrescriptionPDF } from "@/lib/mock-store"

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    getPrescriptions("", "patient")
      .then(setPrescriptions)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = prescriptions.filter((p) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      (p.doctor ?? "").toLowerCase().includes(q) ||
      (p.hospital ?? "").toLowerCase().includes(q) ||
      (p.diagnosis ?? "").toLowerCase().includes(q)
    )
  })

  if (loading)
    return (
      <DashboardLayout role="patient">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground">View prescriptions issued by your doctors</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Pill className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{prescriptions.length}</p>
                <p className="text-sm text-muted-foreground">Total Prescriptions</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                <Pill className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{prescriptions.filter((p) => p.status === "active").length}</p>
                <p className="text-sm text-muted-foreground">Active Prescriptions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by doctor, hospital or diagnosis..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Pill className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No prescriptions found</h3>
                <p className="text-muted-foreground">Prescriptions will appear here after your consultations.</p>
              </CardContent>
            </Card>
          ) : (
            filtered.map((p) => (
              <Card key={p.id} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex flex-col lg:flex-row">
                    <div className="w-full lg:w-2 bg-green-500" />
                    <div className="flex-1 p-6">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="flex-1">
                          <div className="flex items-start justify-between mb-1">
                            <p className="font-semibold text-lg">{p.doctor || "Doctor"}</p>
                            <span className="text-xs text-muted-foreground font-mono">{p.prescriptionId}</span>
                          </div>
                          <p className="text-sm text-primary mb-3">{p.specialization}</p>
                          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
                            {p.hospital && (
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                {p.hospital}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {p.date}
                            </div>
                          </div>
                          {p.diagnosis && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">Diagnosis:</p>
                              <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3">{p.diagnosis}</p>
                            </div>
                          )}
                          {p.notes && (
                            <div className="mb-3">
                              <p className="text-sm font-medium mb-1">Doctor&apos;s Notes:</p>
                              <p className="text-sm text-muted-foreground bg-muted/50 rounded p-3">{p.notes}</p>
                            </div>
                          )}
                          {p.medicines && p.medicines.length > 0 && (
                            <div>
                              <p className="text-sm font-medium mb-2">Medications:</p>
                              <div className="space-y-1">
                                {p.medicines.map((m, i) => (
                                  <div key={i} className="flex flex-wrap gap-2 text-sm bg-muted/30 rounded px-3 py-2">
                                    <span className="font-medium">{m.name}</span>
                                    {m.dosage && <span className="text-muted-foreground">· {m.dosage}</span>}
                                    {m.frequency && <span className="text-muted-foreground">· {m.frequency}</span>}
                                    {m.duration && <span className="text-muted-foreground">· {m.duration}</span>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="mr-2 h-4 w-4" />View
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => downloadPrescriptionPDF(p)}>
                            <Download className="mr-2 h-4 w-4" />Download
                          </Button>
                        </div>
                      </div>
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
