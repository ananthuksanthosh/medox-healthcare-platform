'use client'

import { useMemo, useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table'
import { Plus, Trash2, CheckCircle2, XCircle, Loader2, ToggleLeft, ToggleRight, UserX, UserCheck, Eye, Edit3, X, Check, Star, Search, MapPin, Phone, Mail, Award, BookOpen, DollarSign } from 'lucide-react'

const API = "http://localhost:5000"
const getToken = () => { let t = localStorage.getItem("token"); if (!t || t === "undefined") t = localStorage.getItem("medox.authToken"); return (!t || t === "undefined") ? null : t }

export default function AdminDoctorsPage() {
  const [search, setSearch] = useState('')
  const [hospitalFilter, setHospitalFilter] = useState('ALL')
  const [specialFilter, setSpecialFilter] = useState('ALL')
  const [doctorsList, setDoctorsList] = useState<any[]>([])
  const [hospitalsList, setHospitalsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modals & Action States
  const [showViewModal, setShowViewModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)

  // Form Fields
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [qualification, setQualification] = useState('MBBS, MD')
  const [specialization, setSpecialization] = useState('General Medicine')
  const [experience, setExperience] = useState(5)
  const [consultationFee, setConsultationFee] = useState(500)
  const [hospitalId, setHospitalId] = useState<number>(0)
  const [departmentId, setDepartmentId] = useState<number>(0)
  const [availability, setAvailability] = useState('Available')
  const [status, setStatus] = useState('ACTIVE')
  const [bio, setBio] = useState('')

  const fetchInitialData = async () => {
    const token = getToken()
    if (!token) return
    try {
      // Fetch Doctors
      const docRes = await fetch(`${API}/api/admin/doctors`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const docData = await docRes.json()
      if (Array.isArray(docData)) {
        setDoctorsList(docData)
      }

      // Fetch Hospitals for dropdown selectors
      const hospRes = await fetch(`${API}/api/admin/hospitals`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const hospData = await hospRes.json()
      if (Array.isArray(hospData)) {
        setHospitalsList(hospData)
      }
    } catch (err) {
      console.error('Failed to load initial admin data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInitialData()
  }, [])

  const handleOpenView = (doc: any) => {
    setSelectedDoctor(doc)
    setShowViewModal(true)
  }

  const handleOpenEdit = (doc: any) => {
    setEditingId(doc.id)
    setName(doc.name)
    setEmail(doc.email)
    setPhone(doc.phone)
    setQualification(doc.qualification || 'MBBS, MD')
    setSpecialization(doc.specialization)
    setExperience(doc.experience)
    setConsultationFee(doc.consultationFee)
    setHospitalId(doc.hospitalId)
    setDepartmentId(doc.departmentId)
    setAvailability(doc.availability)
    setStatus(doc.status || 'ACTIVE')
    setBio(doc.bio || '')
    setShowEditModal(true)
  }

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    const token = getToken()
    if (!token) return

    const payload = {
      name,
      email,
      phone,
      qualification,
      specialization,
      experience: Number(experience),
      consultationFee: Number(consultationFee),
      hospitalId: Number(hospitalId),
      departmentId: Number(departmentId),
      availability,
      status,
      bio
    }

    try {
      const response = await fetch(`${API}/api/admin/doctors/${editingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })
      const resData = await response.json()
      if (resData.success) {
        fetchInitialData()
        setShowEditModal(false)
      }
    } catch (err) {
      console.error('Failed to save doctor edits:', err)
    }
  }

  const handleToggleStatus = async (id: number, currentStatus: string) => {
    const token = getToken()
    if (!token) return
    const nextStatus = currentStatus === 'ACTIVE' ? 'BLOCKED' : 'ACTIVE'
    try {
      const response = await fetch(`${API}/api/admin/doctors/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: nextStatus })
      })
      const resData = await response.json()
      if (resData.success) {
        setDoctorsList(prev => prev.map(d => d.id === id ? { ...d, status: nextStatus } : d))
      }
    } catch (err) {
      console.error('Failed to update doctor status:', err)
    }
  }

  const handleToggleAvailability = async (id: number, currentAvail: string) => {
    const token = getToken()
    if (!token) return
    const nextAvail = currentAvail === 'Available' ? 'Unavailable' : 'Available'
    try {
      const response = await fetch(`${API}/api/admin/doctors/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ availability: nextAvail })
      })
      const resData = await response.json()
      if (resData.success) {
        setDoctorsList(prev => prev.map(d => d.id === id ? { ...d, availability: nextAvail } : d))
      }
    } catch (err) {
      console.error('Failed to update doctor availability:', err)
    }
  }

  const handleConfirmDelete = (id: number) => {
    setDeletingId(id)
    setShowDeleteModal(true)
  }

  const handleDeleteDoctor = async () => {
    if (!deletingId) return
    const token = getToken()
    if (!token) return
    try {
      const response = await fetch(`${API}/api/admin/doctors/${deletingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const resData = await response.json()
      if (resData.success) {
        setDoctorsList(prev => prev.filter(d => d.id !== deletingId))
        setShowDeleteModal(false)
        setDeletingId(null)
      }
    } catch (err) {
      console.error('Failed to delete doctor:', err)
    }
  }

  // Find department options based on selected hospital
  const selectedHospitalObj = useMemo(() => {
    return hospitalsList.find(h => h.id === Number(hospitalId))
  }, [hospitalId, hospitalsList])

  const departmentOptions = useMemo(() => {
    return selectedHospitalObj?.departments || []
  }, [selectedHospitalObj])

  // Auto select first department when hospital changes in modal
  useEffect(() => {
    if (departmentOptions.length > 0) {
      const hasDept = departmentOptions.some((d: any) => d.id === Number(departmentId))
      if (!hasDept) {
        setDepartmentId(departmentOptions[0].id)
      }
    }
  }, [hospitalId, departmentOptions])

  const uniqueHospitals = useMemo(() => {
    const list = new Set(doctorsList.map(d => d.hospital))
    return ['ALL', ...Array.from(list)]
  }, [doctorsList])

  const uniqueSpecialties = useMemo(() => {
    const list = new Set(doctorsList.map(d => d.specialization))
    return ['ALL', ...Array.from(list)]
  }, [doctorsList])

  const filteredDoctors = useMemo(() => {
    return doctorsList.filter((doctor) => {
      const matchesSearch = doctor.name.toLowerCase().includes(search.toLowerCase()) ||
                            doctor.specialization.toLowerCase().includes(search.toLowerCase()) ||
                            doctor.hospital.toLowerCase().includes(search.toLowerCase()) ||
                            (doctor.qualification && doctor.qualification.toLowerCase().includes(search.toLowerCase())) ||
                            doctor.email.toLowerCase().includes(search.toLowerCase())
      const matchesHospital = hospitalFilter === 'ALL' || doctor.hospital === hospitalFilter
      const matchesSpecial = specialFilter === 'ALL' || doctor.specialization === specialFilter
      return matchesSearch && matchesHospital && matchesSpecial
    })
  }, [search, hospitalFilter, specialFilter, doctorsList])

  const approvedCount = useMemo(() => doctorsList.filter(d => d.status === 'ACTIVE').length, [doctorsList])
  const blockedCount = useMemo(() => doctorsList.filter(d => d.status !== 'ACTIVE').length, [doctorsList])

  if (loading) return (
    <DashboardLayout role="admin" title="Doctor Registry" subtitle="Manage healthcare providers">
      <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
    </DashboardLayout>
  )

  return (
    <DashboardLayout role="admin" title="Doctor Registry" subtitle="Monitor clinic credentials, change hospital links, and suspend or activate accounts.">
      <div className="space-y-6">
        
        {/* Statistics Panels */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card className="border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-500">Connected Providers</p>
                <p className="text-3xl font-extrabold text-slate-900">{doctorsList.length}</p>
              </div>
              <div className="rounded-2xl bg-indigo-50 p-4 text-indigo-600">
                <Award className="h-7 w-7" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-500">Active Licenses</p>
                <p className="text-3xl font-extrabold text-emerald-600">{approvedCount}</p>
              </div>
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
                <CheckCircle2 className="h-7 w-7" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-slate-100 bg-white shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-slate-500">Suspended Providers</p>
                <p className="text-3xl font-extrabold text-red-500">{blockedCount}</p>
              </div>
              <div className="rounded-2xl bg-red-50 p-4 text-red-500">
                <XCircle className="h-7 w-7" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters Panel */}
        <div className="flex flex-col gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative flex-1 min-w-[240px] max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by doctor name, specialty, degree..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-slate-50 border-slate-200 text-slate-900 rounded-xl"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Hospital:</span>
              <select
                value={hospitalFilter}
                onChange={(e) => setHospitalFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {uniqueHospitals.map(hosp => (
                  <option key={hosp} value={hosp}>{hosp === 'ALL' ? 'All Hospitals' : hosp}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Specialty:</span>
              <select
                value={specialFilter}
                onChange={(e) => setSpecialFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {uniqueSpecialties.map(spec => (
                  <option key={spec} value={spec}>{spec === 'ALL' ? 'All Specialties' : spec}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Registry Table */}
        <Card className="border-slate-100 bg-white shadow-sm rounded-2xl overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table className="min-w-full border-collapse">
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead className="px-6 py-4 font-bold text-slate-700">Doctor Profile</TableHead>
                    <TableHead className="px-4 py-4 font-bold text-slate-700">Qualifications</TableHead>
                    <TableHead className="px-4 py-4 font-bold text-slate-700">Hospital & Specialization</TableHead>
                    <TableHead className="px-4 py-4 font-bold text-slate-700 text-center">Fee (₹)</TableHead>
                    <TableHead className="px-4 py-4 font-bold text-slate-700 text-center">Availability</TableHead>
                    <TableHead className="px-4 py-4 font-bold text-slate-700">License Status</TableHead>
                    <TableHead className="px-6 py-4 font-bold text-slate-700 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDoctors.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-12 text-slate-400">
                        No doctors registered in the registry matching your criteria.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredDoctors.map((doctor) => (
                      <TableRow key={doctor.id} className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 overflow-hidden rounded-full bg-slate-100 border border-slate-200 flex-shrink-0 flex items-center justify-center">
                              <img src={doctor.profilePic || '/doctors/doctor1.jpg'} alt="" className="object-cover h-full w-full" onError={(e:any)=>{e.target.src='https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=120'}} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900">{doctor.name}</p>
                              <p className="text-xs text-slate-500 font-normal flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" /> {doctor.phone}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-slate-700">{doctor.qualification || 'MBBS, MD'}</p>
                            <p className="text-xs text-slate-400">{doctor.experience} Yrs Clinical Experience</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <div>
                            <p className="font-semibold text-slate-800">{doctor.hospital}</p>
                            <p className="text-xs text-indigo-600 font-semibold">{doctor.specialization} | {doctor.department}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center font-bold text-slate-800">
                          ₹{doctor.consultationFee}
                        </TableCell>
                        <TableCell className="px-4 py-4 text-center">
                          <button
                            onClick={() => handleToggleAvailability(doctor.id, doctor.availability)}
                            className="flex items-center justify-center gap-1.5 mx-auto hover:opacity-85"
                          >
                            {doctor.availability === 'Available' ? (
                              <ToggleRight className="h-6 w-6 text-emerald-500" />
                            ) : (
                              <ToggleLeft className="h-6 w-6 text-slate-400" />
                            )}
                            <span className="text-xs font-semibold text-slate-600">{doctor.availability}</span>
                          </button>
                        </TableCell>
                        <TableCell className="px-4 py-4">
                          <Badge className={doctor.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-50 font-semibold' : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-50 font-semibold'}>
                            {doctor.status === 'ACTIVE' ? 'Active' : 'Suspended'}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-6 py-4 text-right space-x-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenView(doctor)}
                            title="View Credentials Specs"
                            className="text-slate-600 border-slate-200 hover:bg-slate-50 rounded-lg p-2"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(doctor)}
                            title="Edit Profile"
                            className="text-sky-600 border-sky-100 hover:bg-sky-50 rounded-lg p-2"
                          >
                            <Edit3 className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(doctor.id, doctor.status)}
                            title={doctor.status === 'ACTIVE' ? 'Suspend Provider' : 'Approve/Activate'}
                            className={doctor.status === 'ACTIVE' ? 'text-red-500 border-red-100 hover:bg-red-50 rounded-lg p-2' : 'text-emerald-500 border-emerald-100 hover:bg-emerald-50 rounded-lg p-2'}
                          >
                            {doctor.status === 'ACTIVE' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleConfirmDelete(doctor.id)}
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

        {/* View Specs Modal */}
        {showViewModal && selectedDoctor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-slate-100 relative">
              <button onClick={() => setShowViewModal(false)} className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
              
              <div className="text-center mt-2">
                <div className="mx-auto h-20 w-20 overflow-hidden rounded-full border border-slate-100 shadow-sm mb-4">
                  <img src={selectedDoctor.profilePic || '/doctors/doctor1.jpg'} className="object-cover h-full w-full" alt="" />
                </div>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedDoctor.name}</h3>
                <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5 tracking-wider">{selectedDoctor.qualification}</p>
                <p className="text-sm text-indigo-600 font-bold capitalize flex items-center justify-center gap-1 mt-1"><Award className="h-4 w-4" /> {selectedDoctor.specialization}</p>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-5 space-y-3.5">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Affiliated Hospital</span>
                  <span className="text-slate-800 font-semibold text-right max-w-[200px]">{selectedDoctor.hospital}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Assigned Department</span>
                  <span className="text-slate-800 font-semibold">{selectedDoctor.department}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Contact Phone</span>
                  <span className="text-slate-800 font-semibold">{selectedDoctor.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Primary Email</span>
                  <span className="text-slate-800 font-semibold lowercase">{selectedDoctor.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Consultation Fee</span>
                  <span className="text-slate-800 font-extrabold text-emerald-600">₹{selectedDoctor.consultationFee}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400 font-medium">Experience Level</span>
                  <span className="text-slate-800 font-bold">{selectedDoctor.experience} years clinical practice</span>
                </div>
                
                <div className="space-y-1 bg-slate-50 p-3 rounded-2xl">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Professional Bio</p>
                  <p className="text-xs text-slate-600 leading-relaxed font-medium">{selectedDoctor.bio || 'No professional biography added yet.'}</p>
                </div>

                <div className="flex justify-between text-sm items-center">
                  <span className="text-slate-400 font-medium">Provider Status</span>
                  <div className="flex gap-2">
                    <Badge className={selectedDoctor.availability === 'Available' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'}>
                      {selectedDoctor.availability}
                    </Badge>
                    <Badge className={selectedDoctor.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}>
                      {selectedDoctor.status === 'ACTIVE' ? 'Active License' : 'Suspended'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-2">
                <Button className="w-full rounded-2xl py-2.5 font-bold" onClick={() => setShowViewModal(false)}>Close Profile Details</Button>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto">
              <button onClick={() => setShowEditModal(false)} className="absolute right-4 top-4 rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
              
              <div className="mb-5 border-b pb-4">
                <h3 className="text-lg font-bold text-slate-900">Modify Professional Profile</h3>
                <p className="text-xs text-slate-400 mt-1">Configure credentials, fees, hospital links and license level.</p>
              </div>

              <form onSubmit={handleSaveDoctor} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Full Name</label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Dr. Rahul Dev" className="bg-slate-50 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Qualification Degree</label>
                    <Input value={qualification} onChange={(e) => setQualification(e.target.value)} required placeholder="e.g. MBBS, MD, FRCP" className="bg-slate-50 rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Contact Phone</label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} required placeholder="e.g. 9847001001" className="bg-slate-50 rounded-xl" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Official Email</label>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="e.g. rahul.dev@medibee.com" className="bg-slate-50 rounded-xl" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Specialization Area</label>
                    <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} required placeholder="e.g. Cardiology" className="bg-slate-50 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Experience</label>
                      <Input type="number" value={experience} onChange={(e) => setExperience(Number(e.target.value))} required className="bg-slate-50 rounded-xl" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Fee (₹)</label>
                      <Input type="number" value={consultationFee} onChange={(e) => setConsultationFee(Number(e.target.value))} required className="bg-slate-50 rounded-xl" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Affiliated Hospital</label>
                    <select
                      value={hospitalId}
                      onChange={(e) => setHospitalId(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {hospitalsList.map(h => (
                        <option key={h.id} value={h.id}>{h.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Hospital Department</label>
                    <select
                      value={departmentId}
                      onChange={(e) => setDepartmentId(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      {departmentOptions.map((d: any) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Availability</label>
                    <select
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="Available">Available</option>
                      <option value="Unavailable">Unavailable</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">License Level</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="ACTIVE">Active License</option>
                      <option value="BLOCKED">Suspended</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Professional Bio</label>
                  <textarea
                    rows={3}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Short description..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div className="flex justify-end gap-2.5 border-t pt-4 mt-5">
                  <Button type="button" variant="outline" onClick={() => setShowEditModal(false)} className="rounded-xl">Cancel</Button>
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
              <h3 className="text-lg font-bold text-slate-900">Revoke Provider Account?</h3>
              <p className="text-sm text-slate-500 mt-2">Are you sure you want to completely terminate this doctor profile? Associated logins, time slots, and schedule logs will be removed.</p>
              
              <div className="flex gap-2.5 mt-6">
                <Button variant="outline" onClick={() => setShowDeleteModal(false)} className="flex-1 rounded-xl">Cancel</Button>
                <Button onClick={handleDeleteDoctor} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold">Terminate License</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </DashboardLayout>
  )
}
