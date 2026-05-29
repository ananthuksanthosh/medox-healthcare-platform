'use client'

import { useMemo, useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Shield, FileText, UserX, UserCheck, Loader2 } from 'lucide-react'

const API = "http://localhost:5000"
const getToken = () => { let t = localStorage.getItem("token"); if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); return (!t || t === "undefined") ? null : t }

export default function AdminPatientsPage() {
  const [search, setSearch] = useState('')
  const [patientsList, setPatientsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchPatients = async () => {
    const token = getToken()
    if (!token) return
    try {
      const response = await fetch(`${API}/api/admin/patients`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (Array.isArray(data)) {
        setPatientsList(data)
      }
    } catch (err) {
      console.error('Failed to load patients list:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPatients()
  }, [])

  const handleToggleBlock = async (id: string, currentStatus: string) => {
    const token = getToken()
    if (!token) return
    const nextStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
    try {
      const response = await fetch(`${API}/api/admin/patients/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      })
      const resData = await response.json()
      if (resData.success) {
        setPatientsList(prev => prev.map(p => p.id === id ? { ...p, status: nextStatus } : p))
      }
    } catch (err) {
      console.error('Failed to toggle block status:', err)
    }
  }

  const filteredPatients = useMemo(() => {
    return patientsList.filter((patient) =>
      patient.name.toLowerCase().includes(search.toLowerCase()) ||
      patient.email.toLowerCase().includes(search.toLowerCase()) ||
      patient.phone.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, patientsList])

  const activeCount = useMemo(() => patientsList.filter(p => p.status === 'ACTIVE').length, [patientsList])
  const blockedCount = useMemo(() => patientsList.filter(p => p.status === 'BLOCKED').length, [patientsList])

  if (loading) return (
    <DashboardLayout role="admin" title="Patient Management" subtitle="System records">
      <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="admin" title="Patient Management" subtitle="Monitor patient records, block users, and review histories.">
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm text-slate-400">Overview of patient status and account control.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              placeholder="Search patients by name, email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </div>

        <Card className="border-slate-200 bg-white shadow-sm">
          <CardHeader className="p-5">
            <CardTitle className="text-base text-slate-950">Patient Records</CardTitle>
            <CardDescription className="text-slate-500">Manage medical profiles and user account access in one place.</CardDescription>
          </CardHeader>
          <CardContent className="p-0 overflow-hidden">
            <Table className="min-w-full border-separate border-spacing-0">
              <TableHeader className="bg-slate-100">
                <TableRow>
                  <TableHead className="px-5 py-3">Patient Profile</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Gender / Blood Group</TableHead>
                  <TableHead>Last Visit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="px-5 py-3 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                      No registered patients found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPatients.map((patient) => (
                    <TableRow key={patient.id} className="hover:bg-slate-50">
                      <TableCell className="text-slate-950 font-medium px-5 py-3">
                        <div>
                          <p>{patient.name}</p>
                          <p className="text-xs text-slate-400 font-normal">{patient.email} | {patient.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>{patient.age !== '—' ? `${patient.age} Yrs` : '—'}</TableCell>
                      <TableCell>
                        <span className="capitalize">{patient.gender}</span>
                        {patient.bloodGroup !== '—' && (
                          <Badge className="ml-2 bg-slate-100 text-slate-700 hover:bg-slate-100 border-none font-normal">
                            Blood: {patient.bloodGroup}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{patient.lastVisit}</TableCell>
                      <TableCell>
                        <Badge className={patient.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                          {patient.status === 'ACTIVE' ? 'Active' : 'Blocked'}
                        </Badge>
                      </TableCell>
                      <TableCell className="px-5 py-3 text-right">
                        <Button
                          size="sm"
                          variant={patient.status === 'ACTIVE' ? 'ghost' : 'outline'}
                          className={`gap-2 ${patient.status === 'ACTIVE' ? 'text-destructive hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                          onClick={() => handleToggleBlock(patient.id, patient.status)}
                        >
                          {patient.status === 'ACTIVE' ? (
                            <>
                              <UserX className="h-4 w-4" />
                              Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4" />
                              Activate
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Active patients</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950">{activeCount}</p>
              </div>
              <FileText className="h-8 w-8 text-sky-500" />
            </div>
          </Card>
          <Card className="border-slate-200 bg-white shadow-sm p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-slate-500">Suspended Patients</p>
                <p className="mt-2 text-3xl font-semibold text-slate-950 text-red-600">{blockedCount}</p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
