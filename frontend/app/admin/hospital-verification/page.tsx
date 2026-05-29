'use client'

import { useMemo, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  Check,
  X,
  FileText,
  Building2,
  Phone,
  Mail,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react'

interface HospitalVerificationRequest {
  id: string
  name: string
  logo: string
  district: string
  address: string
  phone: string
  email: string
  licenseNumber: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  bedsCount: number
  establishedYear: number
}

const mockRequests: HospitalVerificationRequest[] = [
  {
    id: 'hreq-1',
    name: 'Aster Medcity Kochi',
    logo: '/hospitals/aster.jpg',
    district: 'Ernakulam',
    address: 'Kuttisahib Road, Cheranalloor, Kochi, Kerala 682027',
    phone: '+91 484 6699999',
    email: 'info@astermedcity.com',
    licenseNumber: 'HOSP-KL-EKM-40192',
    status: 'PENDING',
    bedsCount: 670,
    establishedYear: 2014
  },
  {
    id: 'hreq-2',
    name: 'KIMSHEALTH Hospital Trivandrum',
    logo: '/hospitals/aster.jpg',
    district: 'Trivandrum',
    address: 'P.B.No.1, Anayara, Thiruvananthapuram, Kerala 695029',
    phone: '+91 471 2941000',
    email: 'relations@kimshealth.org',
    licenseNumber: 'HOSP-KL-TVM-88231',
    status: 'PENDING',
    bedsCount: 650,
    establishedYear: 2002
  },
  {
    id: 'hreq-3',
    name: 'Baby Memorial Hospital Calicut',
    logo: '/hospitals/aster.jpg',
    district: 'Kozhikode',
    address: 'Indira Gandhi Road, Arayidathupalam, Kozhikode, Kerala 673004',
    phone: '+91 495 2723272',
    email: 'care@babymh.com',
    licenseNumber: 'HOSP-KL-KKD-11204',
    status: 'APPROVED',
    bedsCount: 800,
    establishedYear: 1987
  },
  {
    id: 'hreq-4',
    name: 'Malabar Medical College Hospital',
    logo: '/hospitals/aster.jpg',
    district: 'Kozhikode',
    address: 'Modakkallur, Kozhikode, Kerala 673323',
    phone: '+91 496 2701500',
    email: 'contact@mmchospital.in',
    licenseNumber: 'HOSP-KL-KKD-99824',
    status: 'REJECTED',
    bedsCount: 450,
    establishedYear: 2010
  }
]

export default function HospitalVerificationPage() {
  const [requests, setRequests] = useState<HospitalVerificationRequest[]>(mockRequests)
  const [search, setSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  
  const [selectedReq, setSelectedReq] = useState<HospitalVerificationRequest | null>(null)
  const [confirmAction, setConfirmAction] = useState<{ reqId: string; action: 'APPROVED' | 'REJECTED' } | null>(null)
  const [toastMessage, setToastMessage] = useState<{ message: string; type: 'success' | 'danger' } | null>(null)

  // Extract unique districts
  const districts = useMemo(() => ['all', ...Array.from(new Set(requests.map(r => r.district)))], [requests])

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchesSearch = 
        req.name.toLowerCase().includes(search.toLowerCase()) ||
        req.licenseNumber.toLowerCase().includes(search.toLowerCase()) ||
        req.email.toLowerCase().includes(search.toLowerCase())
      
      const matchesDistrict = districtFilter === 'all' || req.district === districtFilter
      const matchesStatus = statusFilter === 'all' || req.status === statusFilter
      
      return matchesSearch && matchesDistrict && matchesStatus
    })
  }, [requests, search, districtFilter, statusFilter])

  // Quick statistics
  const stats = useMemo(() => {
    return {
      total: requests.length,
      pending: requests.filter(r => r.status === 'PENDING').length,
      approved: requests.filter(r => r.status === 'APPROVED').length,
      rejected: requests.filter(r => r.status === 'REJECTED').length
    }
  }, [requests])

  const handleAction = (id: string, nextStatus: 'APPROVED' | 'REJECTED') => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: nextStatus } : r))
    setToastMessage({
      message: `Hospital request successfully ${nextStatus === 'APPROVED' ? 'Approved' : 'Rejected'}.`,
      type: nextStatus === 'APPROVED' ? 'success' : 'danger'
    })
    setConfirmAction(null)
    if (selectedReq && selectedReq.id === id) {
      setSelectedReq(prev => prev ? { ...prev, status: nextStatus } : null)
    }
    setTimeout(() => setToastMessage(null), 4000)
  }

  return (
    <DashboardLayout
      role="admin"
      title="Hospital Verification"
      subtitle="Audit, approve, and verify license documentation for partner clinical networks."
    >
      <div className="space-y-6">
        
        {/* Toast Alerts */}
        {toastMessage && (
          <div className={`p-4 rounded-xl border flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-4 duration-300 ${
            toastMessage.type === 'success' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}>
            <div className="flex items-center gap-2">
              {toastMessage.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-rose-600" />}
              <span className="text-sm font-semibold">{toastMessage.message}</span>
            </div>
            <button onClick={() => setToastMessage(null)} className="hover:opacity-70 transition-opacity">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Info Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Applications</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.total}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Building2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pending Review</p>
                <p className="text-2xl font-bold text-amber-600 mt-1">{stats.pending}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600 animate-pulse">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Verified Networks</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.approved}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                <CheckCircle2 className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rejected Requests</p>
                <p className="text-2xl font-bold text-rose-600 mt-1">{stats.rejected}</p>
              </div>
              <div className="h-10 w-10 rounded-lg bg-rose-50 flex items-center justify-center text-rose-600">
                <XCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filter Controls */}
        <Card className="border-slate-200 bg-white shadow-sm">
          <CardContent className="p-5 space-y-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Search by hospital name or license..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-10 w-full"
                />
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Select value={districtFilter} onValueChange={setDistrictFilter}>
                  <SelectTrigger className="w-44 h-10 text-xs font-medium bg-white">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-3.5 w-3.5 text-slate-400" />
                      <SelectValue placeholder="All Districts" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {districts.map(dist => (
                      <SelectItem key={dist} value={dist} className="capitalize text-xs">
                        {dist === 'all' ? 'All Districts' : dist}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-36 h-10 text-xs font-medium bg-white">
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <SelectValue placeholder="All Statuses" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">All Statuses</SelectItem>
                    <SelectItem value="PENDING" className="text-xs text-amber-600 font-semibold">Pending</SelectItem>
                    <SelectItem value="APPROVED" className="text-xs text-emerald-600 font-semibold">Approved</SelectItem>
                    <SelectItem value="REJECTED" className="text-xs text-rose-600 font-semibold">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Requests Directory */}
        <Card className="border-slate-200 bg-white shadow-sm overflow-hidden">
          <CardHeader className="border-b border-slate-100 p-5 bg-slate-50/50">
            <CardTitle className="text-base font-semibold text-slate-900">Hospital Request Queue</CardTitle>
            <CardDescription className="text-xs text-slate-500">Showing {filteredRequests.length} results matching selected filters.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {filteredRequests.length === 0 ? (
              <div className="p-12 text-center">
                <AlertTriangle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-slate-800">No requests found</p>
                <p className="text-xs text-slate-400 mt-1">Try adjusting your filters or search queries.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="w-full border-collapse">
                  <TableHeader className="bg-slate-50 border-b border-slate-100">
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-slate-700 p-4">Hospital Name</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 p-4">District / Location</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 p-4">Contact info</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 p-4">License number</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 p-4">Status</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-700 p-4 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map(req => (
                      <TableRow key={req.id} className="hover:bg-slate-50/50 border-b border-slate-100 last:border-0">
                        <TableCell className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center font-bold text-slate-500 text-lg">
                              {req.name[0]}
                            </div>
                            <div>
                              <div className="font-semibold text-sm text-slate-900">{req.name}</div>
                              <div className="text-xs text-slate-400">Est. {req.establishedYear} • {req.bedsCount} Beds</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="p-4">
                          <div className="text-sm font-semibold text-slate-800">{req.district}</div>
                          <div className="text-xs text-slate-400 truncate max-w-[200px]">{req.address}</div>
                        </TableCell>
                        <TableCell className="p-4 text-xs space-y-0.5">
                          <div className="flex items-center gap-1.5 text-slate-700"><Phone className="h-3 w-3 text-slate-400" /> {req.phone}</div>
                          <div className="flex items-center gap-1.5 text-slate-500"><Mail className="h-3 w-3 text-slate-400" /> {req.email}</div>
                        </TableCell>
                        <TableCell className="p-4 text-sm font-mono text-slate-600 font-medium">
                          {req.licenseNumber}
                        </TableCell>
                        <TableCell className="p-4">
                          <Badge className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            req.status === 'PENDING' 
                              ? 'bg-amber-100 text-amber-800 hover:bg-amber-100' 
                              : req.status === 'APPROVED' 
                                ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' 
                                : 'bg-rose-100 text-rose-800 hover:bg-rose-100'
                          }`}>
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="p-4 text-right space-x-1.5 whitespace-nowrap">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-8 text-xs font-semibold gap-1.5"
                            onClick={() => setSelectedReq(req)}
                          >
                            <Eye className="h-3.5 w-3.5" />
                            View
                          </Button>
                          
                          {req.status === 'PENDING' && (
                            <>
                              <Button 
                                size="sm" 
                                className="h-8 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white gap-1"
                                onClick={() => setConfirmAction({ reqId: req.id, action: 'APPROVED' })}
                              >
                                <Check className="h-3.5 w-3.5" />
                                Approve
                              </Button>
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                className="h-8 text-xs font-semibold gap-1"
                                onClick={() => setConfirmAction({ reqId: req.id, action: 'REJECTED' })}
                              >
                                <X className="h-3.5 w-3.5" />
                                Reject
                              </Button>
                            </>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* VIEW DETAILS DIALOG */}
      {selectedReq && (
        <Dialog open={!!selectedReq} onOpenChange={(open) => { if (!open) setSelectedReq(null) }}>
          <DialogContent className="max-w-2xl bg-white border border-slate-200 shadow-xl rounded-xl">
            <DialogHeader className="border-b pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900">{selectedReq.name}</DialogTitle>
                  <DialogDescription className="text-xs text-slate-500">Partner Clinical Network Onboarding File</DialogDescription>
                </div>
                <Badge className={`text-xs px-2.5 py-0.5 uppercase tracking-wider rounded-full ${
                  selectedReq.status === 'PENDING' 
                    ? 'bg-amber-100 text-amber-800' 
                    : selectedReq.status === 'APPROVED' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-rose-100 text-rose-800'
                }`}>
                  {selectedReq.status}
                </Badge>
              </div>
            </DialogHeader>

            <div className="grid gap-6 py-4 md:grid-cols-2">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hospital Profile</h4>
                  <div className="mt-2 space-y-3">
                    <div>
                      <span className="text-xs text-slate-500 block">Established Year</span>
                      <span className="text-sm font-semibold text-slate-800">{selectedReq.establishedYear}</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Total Beds Count</span>
                      <span className="text-sm font-semibold text-slate-800">{selectedReq.bedsCount} Beds</span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Address & District</span>
                      <span className="text-sm font-semibold text-slate-800 block">{selectedReq.district}</span>
                      <span className="text-xs text-slate-500 block">{selectedReq.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Licenses & Contact</h4>
                  <div className="mt-2 space-y-3">
                    <div>
                      <span className="text-xs text-slate-500 block">Professional Licencing Registration</span>
                      <span className="text-sm font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 inline-block mt-0.5">
                        {selectedReq.licenseNumber}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Clinical Verification Status</span>
                      <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 inline-flex items-center gap-1 mt-1">
                        <ShieldCheck className="h-3 w-3" /> State Board Cleared
                      </span>
                    </div>
                    <div>
                      <span className="text-xs text-slate-500 block">Onboarding Contact Info</span>
                      <span className="text-sm font-semibold text-slate-800 block">{selectedReq.phone}</span>
                      <span className="text-xs text-slate-500 block">{selectedReq.email}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 border-t pt-4">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Attached Verification Documents</h4>
                <div className="grid gap-2 sm:grid-cols-2">
                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-5 w-5 text-red-500" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-800">State_Board_Clinical_License.pdf</p>
                        <p className="text-[10px] text-slate-400">Clinical Establishment Board Clearance</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/50">
                    <div className="flex items-center gap-2.5">
                      <FileText className="h-5 w-5 text-blue-500" />
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-800">Fire_And_Safety_Certificate.pdf</p>
                        <p className="text-[10px] text-slate-400">NOC Department clearance file</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="border-t pt-4 flex gap-2">
              <Button variant="ghost" className="text-slate-600 font-semibold" onClick={() => setSelectedReq(null)}>
                Close
              </Button>
              {selectedReq.status === 'PENDING' && (
                <>
                  <Button 
                    variant="destructive" 
                    className="font-semibold" 
                    onClick={() => handleAction(selectedReq.id, 'REJECTED')}
                  >
                    Reject Application
                  </Button>
                  <Button 
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold" 
                    onClick={() => handleAction(selectedReq.id, 'APPROVED')}
                  >
                    Approve Network
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* CONFIRMATION DIALOG */}
      {confirmAction && (
        <Dialog open={!!confirmAction} onOpenChange={(open) => { if (!open) setConfirmAction(null) }}>
          <DialogContent className="max-w-md bg-white border border-slate-200 shadow-xl rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900">
                Confirm {confirmAction.action === 'APPROVED' ? 'Approval' : 'Rejection'}
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-1">
                Are you sure you want to {confirmAction.action === 'APPROVED' ? 'approve' : 'reject'} this clinical establishment? 
                {confirmAction.action === 'APPROVED' 
                  ? ' This will instantly include them in the MEDOX verified hospital lists.' 
                  : ' This will reject onboarding and exclude them from patient registries.'}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="flex gap-2 justify-end mt-4">
              <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>
                Cancel
              </Button>
              <Button 
                size="sm"
                variant={confirmAction.action === 'APPROVED' ? 'default' : 'destructive'}
                className={confirmAction.action === 'APPROVED' ? 'bg-emerald-600 hover:bg-emerald-700 text-white font-semibold' : 'font-semibold'}
                onClick={() => handleAction(confirmAction.reqId, confirmAction.action)}
              >
                Yes, Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </DashboardLayout>
  )
}
