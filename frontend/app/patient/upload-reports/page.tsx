"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Upload, FileText, X, CheckCircle, Image as ImageIcon,
  File, AlertCircle, Calendar, Eye, Download, Trash2, Loader2,
  RefreshCw, FolderOpen
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog"
import Link from "next/link"

const API = "http://localhost:5000"

function getToken(): string | null {
  if (typeof window === "undefined") return null
  const t = localStorage.getItem("token")
  if (t && t !== "undefined" && t !== "null") return t
  return localStorage.getItem("medox.authToken") || null
}

function authHeaders(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface PendingFile {
  id: string
  name: string
  size: number
  mimeType: string
  rawFile: File
  preview?: string  // for images
  status: "ready" | "uploading" | "done" | "error"
  errorMsg?: string
}

interface UploadedReport {
  id: number
  title: string
  reportType: string
  type: string
  description: string
  fileUrl: string
  date: string
  uploadedAt: string
  fileSize: string
  status: string
}

const ALLOWED_TYPES = [
  "application/pdf",
  "image/jpeg", "image/jpg", "image/png", "image/webp"
]
const ALLOWED_EXTS = [".pdf", ".jpg", ".jpeg", ".png", ".webp"]
const MAX_SIZE_MB = 25

// ── Helper ────────────────────────────────────────────────────────────────────
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function getFileIcon(mimeType: string, className = "h-8 w-8") {
  if (mimeType === "application/pdf") return <FileText className={`${className} text-red-500`} />
  if (mimeType.startsWith("image/")) return <ImageIcon className={`${className} text-blue-500`} />
  return <File className={`${className} text-gray-500`} />
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function UploadReportsPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragActive, setDragActive] = useState(false)

  // Pending files (staged but not yet submitted)
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])

  // Form metadata
  const [formData, setFormData] = useState({
    title: "", reportType: "", description: ""
  })

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  // My uploaded reports list
  const [reports, setReports] = useState<UploadedReport[]>([])
  const [loadingReports, setLoadingReports] = useState(true)

  // Viewer modal
  const [viewReport, setViewReport] = useState<UploadedReport | null>(null)

  // ── Fetch existing reports ──────────────────────────────────────────────────
  const fetchReports = useCallback(async () => {
    setLoadingReports(true)
    try {
      const res = await fetch(`${API}/api/reports`, { headers: authHeaders() })
      const data = await res.json()
      setReports(data.data?.reports ?? data.reports ?? [])
    } catch (e) {
      console.error("fetchReports error:", e)
    } finally {
      setLoadingReports(false)
    }
  }, [])

  useEffect(() => { fetchReports() }, [fetchReports])

  // ── File handling ───────────────────────────────────────────────────────────
  const addFiles = useCallback((fileList: FileList | File[]) => {
    const incoming = Array.from(fileList)

    const valid: PendingFile[] = []
    for (const f of incoming) {
      const ext = "." + f.name.split(".").pop()!.toLowerCase()
      if (!ALLOWED_EXTS.includes(ext)) {
        toast({ title: `"${f.name}" not supported`, description: "Use PDF, JPG, or PNG.", variant: "destructive" })
        continue
      }
      if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        toast({ title: `"${f.name}" too large`, description: `Max size is ${MAX_SIZE_MB} MB.`, variant: "destructive" })
        continue
      }
      const preview = f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined
      valid.push({ id: crypto.randomUUID(), name: f.name, size: f.size, mimeType: f.type, rawFile: f, preview, status: "ready" })
    }

    setPendingFiles(prev => [...prev, ...valid])
    if (valid.length && !formData.title) {
      // Auto-fill title from first filename
      setFormData(fd => ({ ...fd, title: valid[0].name.replace(/\.[^.]+$/, "") }))
    }
  }, [formData.title, toast])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(false)
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files)
  }, [addFiles])

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragActive(e.type === "dragenter" || e.type === "dragover")
  }, [])

  const removeFile = (id: string) => {
    setPendingFiles(prev => {
      const f = prev.find(x => x.id === id)
      if (f?.preview) URL.revokeObjectURL(f.preview)
      return prev.filter(x => x.id !== id)
    })
  }

  // ── Submit upload ───────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (pendingFiles.length === 0) {
      toast({ title: "No file selected", description: "Please select a file to upload.", variant: "destructive" })
      return
    }
    if (!formData.title.trim()) {
      toast({ title: "Title required", description: "Enter a report title.", variant: "destructive" })
      return
    }

    const token = getToken()
    if (!token) {
      toast({ title: "Not logged in", description: "Please log in first.", variant: "destructive" })
      return
    }

    setIsSubmitting(true)
    setSubmitSuccess(false)
    let successCount = 0

    for (const pf of pendingFiles) {
      setPendingFiles(prev => prev.map(x => x.id === pf.id ? { ...x, status: "uploading" } : x))

      try {
        const fd = new FormData()
        fd.append("file", pf.rawFile)
        fd.append("title", formData.title || pf.name)
        fd.append("reportType", formData.reportType || "general")
        fd.append("description", formData.description || "")

        const res = await fetch(`${API}/api/reports/upload`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },  // NO Content-Type — browser sets boundary
          body: fd
        })
        const data = await res.json()

        if (res.ok && data.success) {
          setPendingFiles(prev => prev.map(x => x.id === pf.id ? { ...x, status: "done" } : x))
          successCount++
        } else {
          setPendingFiles(prev => prev.map(x => x.id === pf.id ? { ...x, status: "error", errorMsg: data.message } : x))
          toast({ title: `Failed: ${pf.name}`, description: data.message || "Server error.", variant: "destructive" })
        }
      } catch (err: any) {
        setPendingFiles(prev => prev.map(x => x.id === pf.id ? { ...x, status: "error", errorMsg: err.message } : x))
        toast({ title: "Network error", description: err.message, variant: "destructive" })
      }
    }

    if (successCount > 0) {
      setSubmitSuccess(true)
      setPendingFiles([])
      setFormData({ title: "", reportType: "", description: "" })
      fetchReports()
      toast({ title: `✅ ${successCount} report${successCount > 1 ? "s" : ""} uploaded!`, description: "Your reports are saved securely." })
    }
    setIsSubmitting(false)
  }

  // ── Delete report ───────────────────────────────────────────────────────────
  const deleteReport = async (id: number) => {
    const token = getToken()
    if (!token) return
    try {
      const res = await fetch(`${API}/api/reports/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } })
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== id))
        toast({ title: "Report deleted" })
      }
    } catch {
      toast({ title: "Delete failed", variant: "destructive" })
    }
  }

  // ── View file URL ───────────────────────────────────────────────────────────
  const getFileUrl = (report: UploadedReport) => {
    const url = report.fileUrl
    if (url.startsWith("http")) return url
    return `${API}${url.startsWith("/") ? "" : "/"}${url}`
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <DashboardLayout role="patient" title="Upload Reports" subtitle="Upload and manage your medical reports">
      <div className="space-y-8">

        {/* ── Upload Form ── */}
        <div className="grid gap-6 xl:grid-cols-2">

          {/* Left: Drop zone + file list */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Upload className="h-5 w-5 text-primary" /> Upload Files
              </CardTitle>
              <CardDescription>Drag & drop or click to browse. PDF, JPG, PNG up to {MAX_SIZE_MB} MB.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Drop zone */}
              <div
                className={`relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 text-center cursor-pointer transition-all ${
                  dragActive
                    ? "border-primary bg-primary/8 scale-[1.01]"
                    : "border-muted-foreground/30 hover:border-primary/60 hover:bg-muted/30"
                }`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png,.webp"
                  className="hidden"
                  onChange={e => e.target.files && addFiles(e.target.files)}
                />
                <div className={`mb-4 flex h-16 w-16 items-center justify-center rounded-full transition-all ${dragActive ? "bg-primary/20" : "bg-muted"}`}>
                  <Upload className={`h-8 w-8 ${dragActive ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {dragActive ? "Drop files here..." : "Drag & drop files here"}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">or click to browse</p>
                <Button type="button" variant="outline" size="sm" className="mt-4 pointer-events-none">
                  Select Files
                </Button>
              </div>

              {/* Staged file list */}
              {pendingFiles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-foreground">Selected Files ({pendingFiles.length})</p>
                  {pendingFiles.map(f => (
                    <div key={f.id} className={`flex items-center gap-3 rounded-xl border p-3 transition-all ${
                      f.status === "done" ? "border-green-200 bg-green-50/50"
                      : f.status === "error" ? "border-red-200 bg-red-50/50"
                      : f.status === "uploading" ? "border-primary/30 bg-primary/5"
                      : "bg-card"
                    }`}>
                      {f.preview
                        ? <img src={f.preview} alt={f.name} className="h-12 w-12 rounded-lg object-cover border shrink-0" />
                        : <div className="shrink-0">{getFileIcon(f.mimeType)}</div>
                      }
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{f.name}</p>
                        <p className="text-xs text-muted-foreground">{formatBytes(f.size)}</p>
                        {f.status === "uploading" && (
                          <div className="mt-1.5 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                            <div className="h-full bg-primary rounded-full animate-pulse w-3/4" />
                          </div>
                        )}
                        {f.status === "error" && <p className="text-xs text-red-600 mt-0.5">{f.errorMsg}</p>}
                      </div>
                      <div className="shrink-0">
                        {f.status === "done" && <CheckCircle className="h-5 w-5 text-green-500" />}
                        {f.status === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
                        {f.status === "uploading" && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                        {f.status === "ready" && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500"
                            onClick={() => removeFile(f.id)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Right: Metadata form */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Report Details</CardTitle>
              <CardDescription>Provide information about your medical report</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">

                <div className="space-y-1.5">
                  <Label htmlFor="rTitle">Report Title *</Label>
                  <Input id="rTitle" placeholder="e.g., Blood Test Report" value={formData.title}
                    onChange={e => setFormData(f => ({ ...f, title: e.target.value }))} required />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rType">Report Type</Label>
                  <Select value={formData.reportType} onValueChange={v => setFormData(f => ({ ...f, reportType: v }))}>
                    <SelectTrigger id="rType"><SelectValue placeholder="Select report type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="lab">Lab Report</SelectItem>
                      <SelectItem value="imaging">Imaging (X-Ray, MRI, CT)</SelectItem>
                      <SelectItem value="diagnostic">Diagnostic Report</SelectItem>
                      <SelectItem value="prescription">Prescription</SelectItem>
                      <SelectItem value="consultation">Consultation Notes</SelectItem>
                      <SelectItem value="discharge">Discharge Summary</SelectItem>
                      <SelectItem value="general">General / Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="rDesc">Description</Label>
                  <Textarea id="rDesc" placeholder="Any additional notes about this report..."
                    rows={4} value={formData.description}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))} />
                </div>

                {submitSuccess && (
                  <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Report uploaded successfully!</span>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1" disabled={isSubmitting || pendingFiles.length === 0}>
                    {isSubmitting
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading...</>
                      : <><Upload className="mr-2 h-4 w-4" /> Upload Report</>
                    }
                  </Button>
                  <Button type="button" variant="outline" disabled={isSubmitting}
                    onClick={() => { setPendingFiles([]); setFormData({ title: "", reportType: "", description: "" }); setSubmitSuccess(false) }}>
                    Clear
                  </Button>
                </div>

              </form>
            </CardContent>
          </Card>
        </div>

        {/* ── My Reports ── */}
        <Card className="shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FolderOpen className="h-5 w-5 text-primary" /> My Medical Records
                </CardTitle>
                <CardDescription>All your uploaded reports and documents</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={fetchReports} disabled={loadingReports}>
                <RefreshCw className={`h-4 w-4 ${loadingReports ? "animate-spin" : ""}`} />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingReports ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reports.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground/40 mb-3" />
                <h4 className="font-semibold">No reports uploaded yet</h4>
                <p className="text-sm text-muted-foreground mt-1">Upload your first medical report using the form above.</p>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {reports.map(report => {
                  const isPdf = report.fileUrl?.toLowerCase().includes(".pdf") || report.fileUrl?.toLowerCase().endsWith("/pdf")
                  return (
                    <div key={report.id} className="group flex flex-col gap-3 rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all">
                      {/* Header */}
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50">
                          {isPdf
                            ? <FileText className="h-5 w-5 text-red-500" />
                            : <ImageIcon className="h-5 w-5 text-blue-500" />
                          }
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm text-foreground truncate">{report.title}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 capitalize">
                              {report.reportType || report.type || "General"}
                            </Badge>
                            {report.fileSize && (
                              <span className="text-[10px] text-muted-foreground">{report.fileSize}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {report.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>
                      )}

                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-t pt-2 mt-auto">
                        <Calendar className="h-3 w-3" />
                        <span>{report.date || "—"}</span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex gap-2">
                        <Button
                          size="sm" variant="outline" className="flex-1 gap-1.5 text-xs h-8"
                          onClick={() => setViewReport(report)}
                        >
                          <Eye className="h-3.5 w-3.5" /> View
                        </Button>
                        <a href={`${API}/api/reports/download/${report.id}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                          <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs h-8">
                            <Download className="h-3.5 w-3.5" /> Download
                          </Button>
                        </a>
                        <Button
                          size="sm" variant="ghost"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                          onClick={() => deleteReport(report.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Viewer Modal ── */}
      {viewReport && (
        <Dialog open={!!viewReport} onOpenChange={() => setViewReport(null)}>
          <DialogContent className="max-w-4xl w-full h-[85vh] flex flex-col p-0 gap-0">
            <DialogHeader className="flex flex-row items-center justify-between px-6 py-4 border-b bg-card shrink-0">
              <div>
                <DialogTitle className="text-base">{viewReport.title}</DialogTitle>
                <DialogDescription className="text-xs">
                  {viewReport.reportType || "Medical Report"} • {viewReport.date}
                </DialogDescription>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <a href={`${API}/api/reports/download/${viewReport.id}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" className="gap-1.5">
                    <Download className="h-4 w-4" /> Download
                  </Button>
                </a>
                <a href={getFileUrl(viewReport)} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Eye className="h-4 w-4" /> Open in Tab
                  </Button>
                </a>
              </div>
            </DialogHeader>

            {/* Viewer body */}
            <div className="flex-1 overflow-hidden bg-slate-100">
              {(() => {
                const url = getFileUrl(viewReport)
                const isImg = /\.(jpg|jpeg|png|webp)(\?|$)/i.test(url)
                const isPdf = /\.pdf(\?|$)/i.test(url)

                if (isImg) {
                  return (
                    <div className="flex items-center justify-center h-full p-4">
                      <img src={url} alt={viewReport.title} className="max-h-full max-w-full object-contain rounded-lg shadow-lg" />
                    </div>
                  )
                }

                if (isPdf) {
                  return (
                    <iframe
                      src={url}
                      className="w-full h-full border-0"
                      title={viewReport.title}
                    />
                  )
                }

                return (
                  <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
                    <FileText className="h-16 w-16 text-muted-foreground/40" />
                    <p className="font-semibold text-foreground">Cannot preview this file type</p>
                    <p className="text-sm text-muted-foreground">Use the Download or Open in Tab button above.</p>
                  </div>
                )
              })()}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  )
}
