'use client'

import { useMemo, useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, CheckCircle2, ShieldAlert, Loader2, Trash2, Edit3, X, Check, Eye, Star, Search, MapPin, Phone, Mail, Award } from 'lucide-react'

const API = "http://localhost:5000"
const getToken = () => { let t = localStorage.getItem("token"); if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); return (!t || t === "undefined") ? null : t }

export default function AdminHospitalsPage() {
  const [search, setSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [hospitalsList, setHospitalsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals & Action States
  const [showFormModal, setShowFormModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  
  const [selectedHospital, setSelectedHospital] = useState<any>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Form Fields
  const [name, setName] = useState('')
  const [district, setDistrict] = useState('Thiruvananthapuram')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [rating, setRating] = useState(4.5)
  const [status, setStatus] = useState('VERIFIED')

  const fetchHospitals = async () => {
    const token = getToken()
    if (!token) return
    try {
      const response = await fetch(`${API}/api/admin/hospitals`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (Array.isArray(data)) {
        setHospitalsList(data)
      }
    } catch (err) {
      console.error('Failed to load hospitals:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHospitals()
  }, [])

  const handleOpenAdd = () => {
    setEditingId(null)
    setName('')
    setDistrict('Thiruvananthapuram')
    setAddress('')
    setPhone('')
    setEmail('')
    setRating(4.5)
    setStatus('VERIFIED')
    setShowFormModal(true)
  }

  const handleOpenEdit = (h: any) => {
    setEditingId(h.id)
    setName(h.name)
    setDistrict(h.district)
    setAddress(h.address)
    setPhone(h.phone)
    setEmail(h.email || 'info@hospital.com')
    setRating(h.rating)
    setStatus(h.status || 'VERIFIED')
    setShowFormModal(true)
  }

  const handleOpenView = (h: any) => {
    setSelectedHospital(h)
    setShowViewModal(true)
  }

  const handleSaveHospital = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = getToken()
    if (!token) return

    const payload = {
      name,
      district,
      address,
      phone,
      email,
      rating: Number(rating),
      status,
      image: '/hospitals/kims.jpg'
    }

    try {
      if (editingId) {
        // Edit hospital
        const response = await fetch(`${API}/api/admin/hospitals/${editingId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
        const resData = await response.json()
        if (resData.success) {
          fetchHospitals()
          setShowFormModal(false)
        }
      } else {
        // Add hospital
        const response = await fetch(`${API}/api/admin/hospitals`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        })
        const resData = await response.json()
        if (resData.success) {
          fetchHospitals()
          setShowFormModal(false)
        }
      }
    } catch (err) {
      console.error('Failed to save hospital:', err)
    }
  }

  const handleToggleVerify = async (id: number, currentStatus: string) => {
    const token = getToken()
    if (!token) return
    const nextStatus = currentStatus === 'VERIFIED' ? 'PENDING' : 'VERIFIED'
    try {
      const response = await fetch(`${API}/api/admin/hospitals/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      })
      const resData = await response.json()
      if (resData.success) {
        setHospitalsList(prev => prev.map(h => h.id === id ? { ...h, status: nextStatus } : h))
      }
    } catch (err) {
      console.error('Failed to toggle status:', err)
    }
  }

  const handleConfirmDelete = (id: number) => {
    setDeletingId(id)
    setShowDeleteModal(true)
  }

  const handleDeleteHospital = async () => {
    if (!deletingId) return
    const token = getToken()
    if (!token) return
    try {
      const response = await fetch(`${API}/api/admin/hospitals/${deletingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const resData = await response.json()
      if (resData.success) {
        setHospitalsList(prev => prev.filter(h => h.id !== deletingId))
        setShowDeleteModal(false)
        setDeletingId(null)
      }
    } catch (err) {
      console.error('Failed to delete hospital:', err)
    }
  }

  const uniqueDistricts = useMemo(() => {
    const list = new Set(hospitalsList.map(h => h.district))
    return ['ALL', ...Array.from(list)]
  }, [hospitalsList])

  const filteredHospitals = useMemo(() => {
    return hospitalsList.filter((h) => {
      const matchesSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
                            h.address.toLowerCase().includes(search.toLowerCase()) ||
                            (h.email && h.email.toLowerCase().includes(search.toLowerCase())) ||
                            h.phone.includes(search)
      const matchesDistrict = districtFilter === 'ALL' || h.district === districtFilter
      const matchesStatus = statusFilter === 'ALL' || h.status === statusFilter
      return matchesSearch && matchesDistrict && matchesStatus
    })
  }, [search, districtFilter, statusFilter, hospitalsList])

  const verifiedCount = useMemo(() => hospitalsList.filter(h => h.status === 'VERIFIED').length, [hospitalsList])
  const pendingCount = useMemo(() => hospitalsList.filter(h => h.status !== 'VERIFIED').length, [hospitalsList])

  if (loading) return (
    <DashboardLayout role="admin" title="Hospital Registry" subtitle="Manage healthcare facility integrations">
      <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="admin" title="Hospital Registry" subtitle="Verify and manage partner clinics, medical colleges, and specialist centers.">
      <div className="space-y-6">
        
        {/* Info Cards */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-500">Total Partners</p>
                <p className="text-3xl font-extrabold text-slate-900">{hospitalsList.length}</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600">
                <Award className="h-7 w-7" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-500">Verified Facilities</p>
                <p className="text-3xl font-extrabold text-emerald-600">{verifiedCount}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-500">Pending Review</p>
                <p className="text-3xl font-extrabold text-amber-500">{pendingCount}</p>
              </div>
              <div className="rounded-2xl bg-amber-50 p-4 text-amber-500">
                <ShieldAlert className="h-7 w-7" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Controls */}
        <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by name, address, contact..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">District:</span>
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {uniqueDistricts.map(dist => (
                  <option key={dist} value={dist}>{dist === 'ALL' ? 'All Districts' : dist}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">All Statuses</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending Review</option>
              </select>
            </div>
          </div>
          
          <Button onClick={handleOpenAdd} className="gap-2 bg-primary hover:bg-primary/95 text-white font-semibold py-2 px-4 rounded-xl shadow-lg shadow-indigo-100 transition-all duration-200">
            <Plus className="h-4 w-4" />
            Add Hospital
          </Button>
        </div>

        {/* Datatable */}
        <Card className="border-slate-100 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full border-collapse">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="px-6 py-4 font-bold text-slate-700">Hospital Details</TableHead>
                    <TableHead className="px-4 py-4 font-bold text-slate-700">District</TableHead>
                    <TableHead className="px-4 py-4 font-bold text-slate-700">Contact</TableHead>
                    <TableHead className="px-4 py-4 font-bold text-slate-700 text-center">Rating</TableHead>
                    <TableHead className="px-4 py-4 font-bold text-slate-700 text-center">Depts</TableHead>
                    <TableHead className="px-4 py-4 font-bold text-slate-700 text-center">Doctors</TableHead>
                    <TableHead className="px-4 py-4 font-bold text-slate-700">Status</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredHospitals.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12 text-slate-400">
                        No hospital facilities match your filters.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHospitals.map((hospital) => (
                      <TableRow key={hospital.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-xl bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                              <img src={hospital.image || '/hospitals/kims.jpg'} alt="" className="object-cover h-full w-full" onError={(e:any)=>{e.target.src='https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?q=80&w=120'}} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{hospital.name}</p>
                              <p className="text-xs text-slate-500 font-normal flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3 flex-shrink-0" /> {hospital.address}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 font-semibold text-slate-700">{hospital.district}</TableCell>
                        <TableCell className="px-4 py-4">
                          <div className="space-y-0.5 text-xs text-slate-600">
                            <p className="flex items-center gap-1 font-medium"><Phone className="h-3 w-3" /> {hospital.phone}</p>
                            <p className="flex items-center gap-1"><Mail className="h-3 w-3" /> {hospital.email || 'info@hospital.com'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 font-bold px-2 py-0.5 gap-1 inline-flex">
                            <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                            {hospital.rating.toFixed(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center font-bold text-slate-800">{hospital.departmentCount ?? 0}</TableCell>
                        <TableCell className="px-4 py-4 text-center font-bold text-slate-800">{hospital.doctorCount ?? 0}</TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge className={hospital.status === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50 font-medium' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 font-medium'}>
                            {hospital.status === 'VERIFIED' ? 'Verified' : 'Pending'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right space-x-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenView(hospital)}
                            title="View Facility Specs"
                            className="text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg p-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(hospital)}
                            title="Edit details"
                            className="text-sky-600 border-sky-100 hover:bg-sky-50 rounded-lg p-2"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            title={hospital.status === 'VERIFIED' ? 'Revoke Verification' : 'Verify'}
                            onClick={() => handleToggleVerify(hospital.id, hospital.status)}
                            className={hospital.status === 'VERIFIED' ? 'text-amber-600 border-amber-100 hover:bg-amber-50 rounded-lg p-2' : 'text-emerald-600 border-emerald-100 hover:bg-emerald-50 rounded-lg p-2'}
                          >
                            {hospital.status === 'VERIFIED' ? <ShieldAlert className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleConfirmDelete(hospital.id)}
                            className="text-red-500 hover:bg-red-50 hover:text-red-600 rounded-lg p-2"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* View Modal */}
        {showViewModal && selectedHospital && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100 relative">
              <button onClick={() => setShowViewModal(false)} className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
              
              <div className="text-center mt-2">
                <div className="mx-auto h-20 w-20 overflow-hidden rounded-2xl border border-slate-100 shadow-sm mb-4">
                  <img src={selectedHospital.image || '/hospitals/kims.jpg'} className="object-cover h-full w-full" alt="" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedHospital.name}</h3>
                <p className="text-sm text-slate-500 font-semibold capitalize flex items-center justify-center gap-1 mt-1"><MapPin className="h-4 w-4 text-primary" /> {selectedHospital.district}, Kerala</p>
                
                <div className="mt-2 flex justify-center">
                  <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 font-bold px-2 py-0.5 gap-1">
                    <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                    {selectedHospital.rating.toFixed(1)} / 5.0 Rating
                  </Badge>
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5 space-y-3.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Facility Address</span>
                  <span className="text-slate-800 font-semibold text-right max-w-[200px]">{selectedHospital.address}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Hotline Contact</span>
                  <span className="text-slate-800 font-semibold">{selectedHospital.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Administrative Email</span>
                  <span className="text-slate-800 font-semibold lowercase">{selectedHospital.email || 'info@hospital.com'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Departments Open</span>
                  <span className="text-slate-800 font-bold">{selectedHospital.departmentCount ?? 0} active departments</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Connected Doctors</span>
                  <span className="text-slate-800 font-bold">{selectedHospital.doctorCount ?? 0} registered doctors</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Integration Status</span>
                  <Badge className={selectedHospital.status === 'VERIFIED' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50 font-semibold' : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50 font-semibold'}>
                    {selectedHospital.status === 'VERIFIED' ? 'Fully Verified' : 'Under Review'}
                  </Badge>
                </div>
              </div>

              <div className="mt-6 pt-2">
                <Button className="w-full rounded-2xl py-2.5 font-bold" onClick={() => setShowViewModal(false)}>Close Specifications</Button>
              </div>
            </div>
          </div>
        )}

        {/* Add/Edit Modal */}
        {showFormModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowFormModal(false)} className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
              
              <div className="mb-5 border-b pb-4">
                <h3 className="text-lg font-bold text-slate-900">
                  {editingId ? 'Modify Partner Facility' : 'Register New Hospital Partner'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">Configure structural details, address, and verification level.</p>
              </div>

              <form onSubmit={handleSaveHospital} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Hospital Name</label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Kozhikode Government Medical College" className="bg-slate-50 rounded-xl" />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">District</label>
                    <select
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Thiruvananthapuram">Thiruvananthapuram</option>
                      <option value="Kozhikode">Kozhikode</option>
                      <option value="Ernakulam">Ernakulam</option>
                      <option value="Thrissur">Thrissur</option>
                      <option value="Kollam">Kollam</option>
                      <option value="Palakkad">Palakkad</option>
                      <option value="Kannur">Kannur</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Rating</label>
                    <Input type="number" step="0.1" max="5" min="1" value={rating} onChange={(e) => setRating(Number(e.target.value))} required className="bg-slate-50 rounded-xl" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Address</label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} required placeholder="Medical College P.O, Kozhikode, Kerala" className="bg-slate-50 rounded-xl" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Phone Helpline</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="e.g. 0495-2350216" className="bg-slate-50 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Administrative Email</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="e.g. info@kims.com" className="bg-slate-50 rounded-xl" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Verification Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="VERIFIED">Verified & Active</option>
                    <option value="PENDING">Pending Administrative Review</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2.5 border-t pt-4 mt-5">
                  <Button type="button" variant="outline" onClick={() => setShowFormModal(false)} className="rounded-xl">Cancel</Button>
                  <Button type="submit" className="bg-primary hover:bg-primary/95 text-white font-semibold rounded-xl">Save Changes</Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 mb-4 border border-red-100">
                <Trash2 className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Delete Hospital Facility?</h3>
              <p className="text-sm text-slate-500 mt-2">Are you sure you want to completely remove this hospital? All connected doctors and time slots will be revoked.</p>
              
              <div className="flex gap-2.5 mt-6">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={handleDeleteHospital} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold">Delete Partner</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
