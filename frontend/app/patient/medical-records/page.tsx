"use client"

import { useState, useEffect, useCallback } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { FileText, Download, Eye, Search, Calendar, Share2, Trash2, Loader2 } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const API = "http://localhost:5000"
const getToken = () => { let t = localStorage.getItem("token"); if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); return (!t || t === "undefined") ? null : t }

const typeColors: Record<string, string> = {
  lab: "bg-purple-100 text-purple-700",
  diagnostic: "bg-blue-100 text-blue-700",
  imaging: "bg-green-100 text-green-700",
  consultation: "bg-orange-100 text-orange-700",
  other: "bg-gray-100 text-gray-700",
}

export default function MedicalRecordsPage() {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [deleteModal, setDeleteModal] = useState(false)
  const [toDelete, setToDelete] = useState<number | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const fetchRecords = useCallback(async () => {
    const token = getToken()
    if (!token) { setLoading(false); return }
    try {
      const res = await fetch(`${API}/api/reports/my`, { headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (data.success) setRecords(data.data.reports || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchRecords() }, [fetchRecords])

  const handleDelete = async () => {
    if (!toDelete) return
    setIsDeleting(true)
    const token = getToken()
    try {
      const res = await fetch(`${API}/api/reports/${toDelete}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        toast({ title: "Record Deleted" })
        fetchRecords()
      } else toast({ title: "Failed", variant: "destructive" })
    } catch { toast({ title: "Network Error", variant: "destructive" }) }
    finally { setIsDeleting(false); setDeleteModal(false); setToDelete(null) }
  }

  const filtered = records.filter(r => {
    const q = searchQuery.toLowerCase()
    const matchSearch = (r.title || "").toLowerCase().includes(q) || (r.description || "").toLowerCase().includes(q)
    const matchTab = activeTab === "all" || (r.reportType || "other") === activeTab
    return matchSearch && matchTab
  })

  const counts = {
    all: records.length,
    lab: records.filter(r => r.reportType === "lab").length,
    imaging: records.filter(r => r.reportType === "imaging").length,
    diagnostic: records.filter(r => r.reportType === "diagnostic").length,
    consultation: records.filter(r => r.reportType === "consultation").length,
  }

  if (loading) return (
    <DashboardLayout role="patient">
      <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="patient">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold">Medical Records</h1>
            <p className="text-muted-foreground">View and manage your health records</p>
          </div>
          <Link href="/patient/upload-reports">
            <Button className="bg-primary hover:bg-primary/90"><FileText className="mr-2 h-4 w-4" />Upload New Record</Button>
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Total Records", value: counts.all, color: "bg-primary/10 text-primary" },
            { label: "Lab Reports", value: counts.lab, color: "bg-purple-100 text-purple-700" },
            { label: "Imaging", value: counts.imaging, color: "bg-green-100 text-green-700" },
            { label: "Consultations", value: counts.consultation, color: "bg-orange-100 text-orange-700" },
          ].map(s => (
            <Card key={s.label}><CardContent className="p-4 flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.color}`}><FileText className="h-5 w-5" /></div>
              <div><p className="text-2xl font-bold">{s.value}</p><p className="text-sm text-muted-foreground">{s.label}</p></div>
            </CardContent></Card>
          ))}
        </div>

        <Card><CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search records..." className="pl-10" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
          </div>
        </CardContent></Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
            <TabsTrigger value="lab">Lab ({counts.lab})</TabsTrigger>
            <TabsTrigger value="imaging">Imaging ({counts.imaging})</TabsTrigger>
            <TabsTrigger value="diagnostic">Diagnostic ({counts.diagnostic})</TabsTrigger>
            <TabsTrigger value="consultation">Consult ({counts.consultation})</TabsTrigger>
          </TabsList>
          <TabsContent value={activeTab} className="mt-6 space-y-4">
            {filtered.length === 0 ? (
              <Card><CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold">No records found</h3>
                <p className="text-muted-foreground mb-4">Upload your medical records to track your health journey.</p>
                <Link href="/patient/upload-reports"><Button>Upload Record</Button></Link>
              </CardContent></Card>
            ) : filtered.map(record => {
              const date = new Date(record.uploadedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              const typeKey = record.reportType || "other"
              const fileUrl = record.fileUrl?.startsWith("http") ? record.fileUrl : `${API}${record.fileUrl}`
              return (
                <Card key={record.id} className="overflow-hidden hover:shadow-md transition-shadow">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row">
                      <div className={`flex items-center justify-center p-6 sm:w-24 ${typeColors[typeKey] || typeColors.other}`}>
                        <FileText className="h-5 w-5" />
                      </div>
                      <div className="flex-1 p-6">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="flex-1">
                            <div className="flex items-start gap-2 mb-2">
                              <h3 className="font-semibold">{record.title || "Untitled Report"}</h3>
                              {record.reportType && <Badge variant="secondary" className={typeColors[typeKey]}>{record.reportType}</Badge>}
                            </div>
                            {record.description && <p className="text-sm text-muted-foreground mb-3">{record.description}</p>}
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" /> {date}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => window.open(fileUrl, "_blank")}><Eye className="mr-2 h-4 w-4" />View</Button>
                            <Button size="sm" variant="outline" onClick={() => { const a = document.createElement("a"); a.href = fileUrl; a.download = record.title || "report"; a.click() }}><Download className="mr-2 h-4 w-4" />Download</Button>
                            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(fileUrl); toast({ title: "Link Copied" }) }}><Share2 className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:bg-red-50" onClick={() => { setToDelete(record.id); setDeleteModal(true) }}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={deleteModal} onOpenChange={setDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Medical Record</DialogTitle>
            <DialogDescription>Are you sure? This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteModal(false)} disabled={isDeleting}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
