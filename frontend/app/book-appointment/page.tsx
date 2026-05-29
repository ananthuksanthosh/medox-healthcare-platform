'use client'

import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  MapPin, Building2, Star, User, Calendar, Clock, CreditCard,
  CheckCircle2, ArrowRight, ArrowLeft, IndianRupee, Loader2, Search,
  Phone, Mail, FileText, Printer, Check
} from 'lucide-react'

const API = 'http://localhost:5000'

const getToken = () => {
  if (typeof window === 'undefined') return null
  let t = localStorage.getItem('token')
  if (!t || t === 'undefined') t = localStorage.getItem('medox.authToken')
  return (!t || t === 'undefined') ? null : t
}

type Step = 'hospital' | 'doctor' | 'datetime' | 'confirm' | 'done'

export default function BookAppointmentPage() {
  const router = useRouter()
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [currentStep, setCurrentStep] = useState<Step>('hospital')
  const [isProcessing, setIsProcessing] = useState(false)

  // Current Patient Details
  const [patient, setPatient] = useState<any>(null)

  // Data
  const [hospitals, setHospitals] = useState<any[]>([])
  const [loadingHospitals, setLoadingHospitals] = useState(true)
  const [doctors, setDoctors] = useState<any[]>([])
  const [loadingDoctors, setLoadingDoctors] = useState(false)
  const [slots, setSlots] = useState<any[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bookedAppointment, setBookedAppointment] = useState<any>(null)

  // Selections
  const [selectedHospital, setSelectedHospital] = useState<any>(null)
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null)
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState<any>(null)
  const [notes, setNotes] = useState('')

  // Filters
  const [hospitalSearch, setHospitalSearch] = useState('')
  const [doctorSearch, setDoctorSearch] = useState('')
  const [districtFilter, setDistrictFilter] = useState('')

  // Demo Razorpay State
  const [showRazorpay, setShowRazorpay] = useState(false)
  const [razorpayMethod, setRazorpayMethod] = useState<'card' | 'upi' | 'net' | 'wallet'>('card')
  const [razorpayStep, setRazorpayStep] = useState<'details' | 'processing' | 'success'>('details')
  const [simulatedTxnId, setSimulatedTxnId] = useState('')
  const [bookingError, setBookingError] = useState<string | null>(null)

  // Check auth and fetch patient + hospital details
  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/login?redirect=/book-appointment')
      return
    }
    setCheckedAuth(true)

    // Fetch patient details
    fetch(`${API}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json())
      .then(d => { if (d.id) setPatient(d) })
      .catch(console.error)

    // Fetch all hospitals
    fetch(`${API}/api/hospitals`)
      .then(r => r.json())
      .then(d => { if (d.success) setHospitals(d.data.hospitals || []) })
      .catch(console.error)
      .finally(() => setLoadingHospitals(false))
  }, [router])

  // Fetch doctors when hospital selected or changed
  useEffect(() => {
    if (!selectedHospital) {
      setDoctors([])
      return
    }
    setLoadingDoctors(true)
    fetch(`${API}/api/doctors?hospitalId=${selectedHospital.id}`)
      .then(r => r.json())
      .then(d => { if (d.success) setDoctors(d.data.doctors || []) })
      .catch(console.error)
      .finally(() => setLoadingDoctors(false))
  }, [selectedHospital])

  // Load slots when doctor + date selected
  useEffect(() => {
    if (!selectedDoctor || !selectedDate) {
      setSlots([])
      return
    }
    setLoadingSlots(true)
    fetch(`${API}/api/appointments/slots/${selectedDoctor.id}?date=${selectedDate}`)
      .then(r => r.json())
      .then(d => {
        if (d.success) {
          setSlots(d.data.slots || [])
        } else {
          // Fallback: generate generic slots
          const generic = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
            '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM']
          setSlots(generic.map((t, i) => ({ id: `gen-${i}`, slotTime: t, isBooked: false })))
        }
      })
      .catch(() => {
        const generic = ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM',
          '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM']
        setSlots(generic.map((t, i) => ({ id: `gen-${i}`, slotTime: t, isBooked: false })))
      })
      .finally(() => setLoadingSlots(false))
  }, [selectedDoctor, selectedDate])

  // Unique districts from hospital list
  const districts = useMemo(() => {
    const set = new Set(hospitals.map(h => h.district).filter(Boolean))
    return Array.from(set).sort()
  }, [hospitals])

  // Filtered hospitals
  const filteredHospitals = useMemo(() => {
    return hospitals.filter(h => {
      const q = hospitalSearch.toLowerCase()
      const matchSearch = !q || h.name?.toLowerCase().includes(q) || h.address?.toLowerCase().includes(q)
      const matchDistrict = !districtFilter || h.district === districtFilter
      return matchSearch && matchDistrict
    })
  }, [hospitals, hospitalSearch, districtFilter])

  // Filtered doctors
  const filteredDoctors = useMemo(() => {
    return doctors.filter(d => {
      const q = doctorSearch.toLowerCase()
      return !q ||
        d.name?.toLowerCase().includes(q) ||
        d.specialization?.toLowerCase().includes(q) ||
        d.department?.toLowerCase().includes(q)
    })
  }, [doctors, doctorSearch])

  // Next 7 days
  const availableDates = useMemo(() => {
    const dates = []
    const today = new Date()
    for (let i = 1; i <= 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() + i)
      dates.push({
        value: d.toISOString().split('T')[0],
        label: d.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }),
        day: d.toLocaleDateString('en-IN', { weekday: 'short' }),
        num: d.getDate(),
      })
    }
    return dates
  }, [])

  const steps: { key: Step; label: string }[] = [
    { key: 'hospital', label: 'Select Hospital' },
    { key: 'doctor', label: 'Select Doctor' },
    { key: 'datetime', label: 'Date & Slot' },
    { key: 'confirm', label: 'Confirm & Pay' },
    { key: 'done', label: 'Booked' },
  ]
  const stepIndex = steps.findIndex(s => s.key === currentStep)

  // Demo Razorpay Trigger
  const handleRazorpayStart = () => {
    setRazorpayStep('details')
    setSimulatedTxnId(`pay_sim_${Math.random().toString(36).substring(2, 10).toUpperCase()}`)
    setShowRazorpay(true)
  }

  // Handle Simulated Razorpay Success
  const handleRazorpayPayment = () => {
    setRazorpayStep('processing')
    setTimeout(() => {
      setRazorpayStep('success')
      setTimeout(() => {
        setShowRazorpay(false)
        handleFinalBook()
      }, 1500)
    }, 1500)
  }

  // Final Book Call to Backend
  const handleFinalBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) return
    setIsProcessing(true)
    setBookingError(null)
    const token = getToken()
    try {
      const payload = {
        doctorId: selectedDoctor.id,
        appointmentDate: selectedDate,
        slotId: selectedSlot.id?.toString().startsWith('gen-') ? null : selectedSlot.id,
        slotTime: selectedSlot.slotTime,
        type: 'IN_PERSON', // Always in-person as requested
        notes: notes || null,
        reason: notes || 'General Consultation',
        paymentMethod: 'ONLINE',
        paymentStatus: 'PAID'
      }
      const res = await fetch(`${API}/api/appointments`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      const data = await res.json()
      if (res.ok && data.success) {
        setBookedAppointment(data.data.appointment)
        setCurrentStep('done')
      } else {
        setBookingError(data.message || 'Booking failed. Please try again.')
      }
    } catch (e: any) {
      setBookingError(e.message || 'Network error. Please check your connection.')
    }
    setIsProcessing(false)
  }

  if (!checkedAuth) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="min-h-screen bg-background relative">
      <Navbar />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 print:hidden">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <div key={step.key} className="flex items-center">
                <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors ${
                  i < stepIndex ? 'bg-green-500 text-white'
                  : i === stepIndex ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted text-muted-foreground'
                }`}>
                  {i < stepIndex ? <Check className="h-4 w-4" /> : i + 1}
                </div>
                {i < steps.length - 1 && (
                  <div className={`hidden sm:block h-0.5 w-12 lg:w-16 ${i < stepIndex ? 'bg-green-500' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="mt-2 hidden sm:flex items-center justify-between">
            {steps.map(step => (
              <span key={step.key} className="text-xs text-muted-foreground">{step.label}</span>
            ))}
          </div>
        </div>

        <div className="animate-in fade-in duration-200">
          {/* ─── Step 1: Select Hospital ─────────────────────────── */}
          {currentStep === 'hospital' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5 text-primary" />
                  Select Hospital
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col gap-3 sm:flex-row">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search hospitals by name or address..."
                      className="pl-10"
                      value={hospitalSearch}
                      onChange={e => setHospitalSearch(e.target.value)}
                    />
                  </div>
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={districtFilter}
                    onChange={e => setDistrictFilter(e.target.value)}
                  >
                    <option value="">All Districts</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>

                {loadingHospitals ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredHospitals.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="font-semibold">No hospitals found</p>
                    <p className="text-sm text-muted-foreground">Try a different search or filter.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredHospitals.map(hosp => (
                      <button
                        key={hosp.id}
                        onClick={() => { setSelectedHospital(hosp); setCurrentStep('doctor') }}
                        className="flex items-center gap-4 rounded-xl border p-4 text-left transition-all hover:border-primary hover:shadow-md"
                      >
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <Building2 className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-base text-foreground">{hosp.name}</span>
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                              <span>{hosp.rating || '4.5'}</span>
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mt-0.5">{hosp.address}</p>
                          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{hosp.district}</span>
                            {hosp.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{hosp.phone}</span>}
                            <span>{hosp.doctorCount || 0} Doctors Available</span>
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Step 2: Select Doctor ───────────────────────────── */}
          {currentStep === 'doctor' && selectedHospital && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Select Doctor at {selectedHospital.name}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep('hospital')}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Change Hospital
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search doctors by name, specialization, or department..."
                    className="pl-10"
                    value={doctorSearch}
                    onChange={e => setDoctorSearch(e.target.value)}
                  />
                </div>

                {loadingDoctors ? (
                  <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                ) : filteredDoctors.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <User className="h-12 w-12 text-muted-foreground/50 mb-3" />
                    <p className="font-semibold">No doctors found at this hospital</p>
                    <p className="text-sm text-muted-foreground">Please choose a different hospital or adjust your search.</p>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {filteredDoctors.map(doc => (
                      <button
                        key={doc.id}
                        onClick={() => { setSelectedDoctor(doc); setCurrentStep('datetime') }}
                        className="flex items-center gap-4 rounded-xl border p-4 text-left transition-all hover:border-primary hover:shadow-md"
                      >
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-7 w-7 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold">{doc.name}</span>
                            <div className="flex items-center gap-1 text-sm text-amber-600">
                              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                              <span>{doc.rating || '4.5'}</span>
                            </div>
                          </div>
                          <p className="text-sm text-primary font-medium">{doc.specialization}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{doc.department}</p>
                          <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1 font-semibold text-foreground">
                              <IndianRupee className="h-3 w-3" />{doc.consultationFee} Fee
                            </span>
                            {doc.experience && <span>{doc.experience} Years Exp</span>}
                          </div>
                        </div>
                        <ArrowRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* ─── Step 3: Date & Slot ─────────────────────────────── */}
          {currentStep === 'datetime' && selectedDoctor && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Select Date & Time Slot
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setCurrentStep('doctor')}>
                  <ArrowLeft className="mr-1 h-4 w-4" /> Change Doctor
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Doctor Brief Card */}
                <div className="rounded-xl border bg-secondary/30 p-4 flex gap-3 items-center">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {selectedDoctor.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-foreground">{selectedDoctor.name}</h4>
                    <p className="text-xs text-muted-foreground">{selectedDoctor.specialization} • {selectedHospital.name}</p>
                  </div>
                </div>

                {/* Date Selection */}
                <div>
                  <h4 className="mb-3 font-medium">Select Date</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableDates.map(date => (
                      <button
                        key={date.value}
                        onClick={() => { setSelectedDate(date.value); setSelectedSlot(null) }}
                        className={`flex flex-col items-center rounded-xl border px-4 py-3 transition-all hover:border-primary ${
                          selectedDate === date.value
                            ? 'border-primary bg-primary text-primary-foreground font-semibold shadow-md'
                            : 'border-border'
                        }`}
                      >
                        <span className="text-xs">{date.day}</span>
                        <span className="text-lg font-bold">{date.num}</span>
                        <span className="text-xs">{date.label.split(' ')[1]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Slot Selection */}
                {selectedDate && (
                  <div>
                    <h4 className="mb-3 flex items-center justify-between font-medium">
                      Available Slots
                      {loadingSlots && <Loader2 className="h-4 w-4 animate-spin" />}
                    </h4>
                    {!loadingSlots && slots.length === 0 ? (
                      <div className="rounded-xl border border-dashed p-8 text-center">
                        <Clock className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                        <p className="text-muted-foreground">No slots available for this date.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 animate-in fade-in duration-300">
                        {slots.map((slot, i) => {
                          const isBooked = slot.isBooked
                          const isSelected = selectedSlot?.id === slot.id || selectedSlot?.slotTime === slot.slotTime
                          return (
                            <button
                              key={slot.id || i}
                              disabled={isBooked}
                              onClick={() => setSelectedSlot(slot)}
                              className={`flex flex-col items-center rounded-xl border p-3 text-sm transition-all ${
                                isBooked ? 'opacity-40 cursor-not-allowed border-border'
                                : isSelected ? 'ring-2 ring-primary border-primary bg-primary/5 font-semibold text-primary'
                                : 'border-green-200 bg-green-50 hover:border-primary hover:-translate-y-0.5'
                              }`}
                            >
                              <Clock className="h-4 w-4 mb-1 text-muted-foreground animate-pulse" />
                              <span className="font-semibold">{slot.slotTime}</span>
                              {isBooked && <span className="text-xs text-red-500 mt-1">Booked</span>}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* Reason Notes */}
                <div>
                  <label className="mb-2 block text-sm font-medium">Reason / Symptoms (optional)</label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your symptoms..."
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:ring-1 focus:ring-primary"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentStep('doctor')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />Back
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={!selectedDate || !selectedSlot}
                    onClick={() => setCurrentStep('confirm')}
                  >
                    Review Booking <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Step 4: Confirm & Pay ───────────────────────────── */}
          {currentStep === 'confirm' && selectedHospital && selectedDoctor && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-primary" />
                  Review & Secure Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl border bg-secondary/30 p-5 space-y-3 text-sm">
                  <h4 className="font-semibold text-base border-b pb-2">Appointment Details</h4>
                  {[
                    ['Hospital', selectedHospital.name],
                    ['Hospital Address', selectedHospital.address],
                    ['Doctor', selectedDoctor.name],
                    ['Specialization', selectedDoctor.specialization],
                    ['Department', selectedDoctor.department],
                    ['Date', selectedDate],
                    ['Time Slot', selectedSlot?.slotTime],
                    ['Consultation Type', 'In-Person Visit'],
                    ...(notes ? [['Reason', notes]] : []),
                  ].map(([label, value]) => value ? (
                    <div key={label} className="flex justify-between">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium text-right max-w-[60%]">{value}</span>
                    </div>
                  ) : null)}
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold text-base text-foreground">Total Fee Payable</span>
                    <span className="flex items-center gap-1 font-bold text-lg text-primary">
                      <IndianRupee className="h-4 w-4" />{selectedDoctor.consultationFee}
                    </span>
                  </div>
                </div>

                {bookingError && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 flex items-start gap-3 shadow-sm animate-in fade-in duration-200">
                    <span className="font-extrabold text-red-800 uppercase shrink-0 text-xs px-2 py-0.5 rounded bg-red-100 mt-0.5">Failed</span>
                    <span className="font-medium flex-1">{bookingError}</span>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setCurrentStep('datetime')}>
                    <ArrowLeft className="mr-2 h-4 w-4" />Back
                  </Button>
                  <Button className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md font-semibold" onClick={handleRazorpayStart}>
                    Pay Online with Razorpay <CreditCard className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* ─── Step 5: Done ────────────────────────────────────── */}
          {currentStep === 'done' && selectedHospital && selectedDoctor && (
            <Card>
              <CardContent className="py-12 text-center space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-10 w-10 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Appointment Confirmed! 🎉</h2>
                  <p className="mt-2 text-muted-foreground">Your booking has been successfully verified & finalized.</p>
                </div>

                {/* Token Card */}
                <div className="mx-auto max-w-sm overflow-hidden rounded-2xl border-2 border-primary/20 bg-card shadow-lg text-left">
                  <div className="bg-primary p-4 text-primary-foreground text-center">
                    <p className="text-sm opacity-90">Your Token Number</p>
                    <p className="text-6xl font-bold tracking-tighter">
                      {bookedAppointment?.tokenNumber ?? '1'}
                    </p>
                  </div>
                  <div className="p-5 space-y-3 text-sm">
                    <h4 className="font-semibold border-b pb-2">Receipt Overview</h4>
                    {[
                      ['Appointment ID', `MDB-${bookedAppointment?.id || Date.now().toString().slice(-6)}`],
                      ['Patient Name', patient?.name || 'Ananthu K Santhosh'],
                      ['Hospital', selectedHospital.name],
                      ['Doctor', selectedDoctor.name],
                      ['Time Slot', selectedSlot?.slotTime],
                      ['Paid Amount', `₹${selectedDoctor.consultationFee}`],
                      ['Payment ID', bookedAppointment?.payment?.transactionId || 'pay_sim_success'],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between">
                        <span className="text-muted-foreground">{label}</span>
                        <span className="font-medium text-right">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Button variant="outline" className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" /> Print Appointment Slip
                  </Button>
                  <Button onClick={() => router.push('/patient/appointments')}>
                    View My Appointments
                  </Button>
                  <Button variant="ghost" onClick={() => router.push('/patient/dashboard')}>
                    Go to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* ─── DEMO RAZORPAY MODAL WINDOW ──────────────────────────── */}
      {showRazorpay && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-[450px] bg-slate-900 text-slate-100 rounded-xl overflow-hidden shadow-2xl border border-slate-700 font-sans">
            
            {/* Razorpay Header */}
            <div className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow-md">
                  M
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-wide text-white">MEDOX Healthcare</h3>
                  <p className="text-xs text-slate-400">Appointment Consultation</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Amount</p>
                <p className="font-bold text-lg text-white">₹{selectedDoctor?.consultationFee || '500'}.00</p>
              </div>
            </div>

            {/* Steps & Processing */}
            {razorpayStep === 'details' && (
              <div className="p-5 space-y-4">
                
                {/* Simulated Payment Methods */}
                <div className="flex border-b border-slate-700 text-sm">
                  {(['card', 'upi', 'net', 'wallet'] as const).map(method => (
                    <button
                      key={method}
                      onClick={() => setRazorpayMethod(method)}
                      className={`flex-1 pb-2 font-semibold capitalize ${
                        razorpayMethod === method ? 'border-b-2 border-blue-500 text-blue-400' : 'text-slate-400'
                      }`}
                    >
                      {method}
                    </button>
                  ))}
                </div>

                {razorpayMethod === 'card' && (
                  <div className="space-y-3 animate-in fade-in duration-200">
                    <div>
                      <label className="text-xs text-slate-400 block mb-1">Card Number</label>
                      <Input value="4111 2222 3333 4444" disabled className="bg-slate-800 border-slate-700 text-slate-200 disabled:opacity-90" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Expiry</label>
                        <Input value="12/30" disabled className="bg-slate-800 border-slate-700 text-slate-200 disabled:opacity-90" />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">CVV</label>
                        <Input value="***" disabled className="bg-slate-800 border-slate-700 text-slate-200 disabled:opacity-90" />
                      </div>
                    </div>
                    <p className="text-[10px] text-slate-500 text-center">Demo Card details configured for sandbox testing.</p>
                  </div>
                )}

                {razorpayMethod === 'upi' && (
                  <div className="text-center py-4 space-y-2 animate-in fade-in duration-200">
                    <div className="inline-block p-3 bg-white rounded-lg mb-2">
                      {/* Fake QR */}
                      <div className="h-32 w-32 bg-slate-300 flex items-center justify-center text-slate-900 font-bold text-xs">
                        [ RAZORPAY QR ]
                      </div>
                    </div>
                    <p className="text-xs text-slate-300">Scan QR Code using PhonePe, GPay, or Paytm</p>
                    <p className="text-[10px] text-slate-500">UPI ID: medox@razorpay</p>
                  </div>
                )}

                {razorpayMethod === 'net' && (
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 animate-in fade-in duration-200">
                    {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak', 'KIMS Pay'].map(bank => (
                      <button key={bank} className="p-2 border border-slate-700 rounded bg-slate-800 text-left hover:border-blue-500 transition-colors">
                        {bank}
                      </button>
                    ))}
                  </div>
                )}

                {razorpayMethod === 'wallet' && (
                  <div className="grid grid-cols-2 gap-2 text-xs py-2 animate-in fade-in duration-200">
                    {['Paytm Wallet', 'PhonePe Wallet', 'Amazon Pay', 'Mobikwik'].map(wallet => (
                      <button key={wallet} className="p-2 border border-slate-700 rounded bg-slate-800 text-left hover:border-blue-500 transition-colors">
                        {wallet}
                      </button>
                    ))}
                  </div>
                )}

                {/* Fake Razorpay Details Footer */}
                <div className="pt-2 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400">
                  <span>Method: {razorpayMethod.toUpperCase()}</span>
                  <span>Sandbox Mode</span>
                </div>

                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 tracking-wide" onClick={handleRazorpayPayment}>
                  Pay ₹{selectedDoctor?.consultationFee || '500'}.00 Now
                </Button>
              </div>
            )}

            {razorpayStep === 'processing' && (
              <div className="p-12 text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-blue-500 mx-auto" />
                <div>
                  <h4 className="font-bold text-base">Processing Payment Securely</h4>
                  <p className="text-xs text-slate-400 mt-1">Please do not refresh or close this window.</p>
                </div>
              </div>
            )}

            {razorpayStep === 'success' && (
              <div className="p-12 text-center space-y-4">
                <div className="h-14 w-14 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center mx-auto text-2xl border border-green-500">
                  ✓
                </div>
                <div>
                  <h4 className="font-bold text-base text-green-400">Payment Successful!</h4>
                  <p className="text-xs text-slate-400 mt-1">ID: {simulatedTxnId}</p>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ─── PRINT SLIP TEMPLATE (Only visible inside printed page) ─── */}
      <div id="print-slip" className="hidden print:block p-8 bg-white text-black font-sans w-full max-w-[800px] border border-gray-300">
        <div className="text-center border-b pb-4 mb-6">
          <h1 className="text-2xl font-bold tracking-wide">MEDOX HEALTHCARE PLATFORM</h1>
          <p className="text-xs text-gray-500 mt-1">Premium Healthcare & Clinic Services across Kerala</p>
          <h2 className="text-lg font-semibold bg-gray-100 py-1.5 px-4 rounded mt-4 inline-block">APPOINTMENT CONFIRMATION SLIP</h2>
        </div>

        {/* Token and Booking Details */}
        <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded mb-6 border">
          <div>
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">TOKEN NUMBER</p>
            <p className="text-4xl font-extrabold text-blue-600">{bookedAppointment?.tokenNumber || '1'}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">APPOINTMENT ID</p>
            <p className="text-lg font-bold">MDB-{bookedAppointment?.id || Date.now().toString().slice(-6)}</p>
            <p className="text-xs text-gray-400 mt-1">Date Printed: {new Date().toLocaleDateString('en-IN')}</p>
          </div>
        </div>

        {/* Patient and Doctor section */}
        <div className="grid grid-cols-2 gap-8 mb-6 border-b pb-6">
          <div>
            <h3 className="text-sm font-bold text-gray-700 border-b pb-1 mb-2 uppercase tracking-wide">Patient Information</h3>
            <p className="text-base font-bold text-gray-900">{patient?.name || 'Ananthu K Santhosh'}</p>
            <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Phone:</span> {patient?.phone || '9037772101'}</p>
            <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Address:</span> {patient?.address || 'Kunnelpurayidom(H) Nedukunnam Karukachal'}</p>
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-700 border-b pb-1 mb-2 uppercase tracking-wide">Consultation Information</h3>
            <p className="text-base font-bold text-gray-900">{selectedDoctor?.name || 'Dr. Arun Kumar'}</p>
            <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Specialization:</span> {selectedDoctor?.specialization || 'Cardiologist'}</p>
            <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Department:</span> {selectedDoctor?.department || 'Cardiology'}</p>
            <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Hospital:</span> {selectedHospital?.name || 'KIMS Hospital'}</p>
            <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Time Slot:</span> {selectedSlot?.slotTime || '09:00 AM'}</p>
            <p className="text-sm text-gray-600 mt-1"><span className="font-semibold">Date:</span> {selectedDate || new Date().toISOString().split('T')[0]}</p>
          </div>
        </div>

        {/* Payment overview */}
        <div className="bg-gray-50 p-4 rounded mb-6 border">
          <h3 className="text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Payment Details</h3>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>Consultation Fee Paid:</div>
            <div className="text-right font-bold text-gray-900">₹{selectedDoctor?.consultationFee || '500'}.00</div>

            <div>Transaction Status:</div>
            <div className="text-right font-bold text-green-600">SUCCESS / PAID</div>

            <div>Transaction ID:</div>
            <div className="text-right font-mono text-xs">{bookedAppointment?.payment?.transactionId || simulatedTxnId || 'pay_sim_success'}</div>

            <div>Payment Gateway:</div>
            <div className="text-right font-medium">Razorpay Simulated Sandbox</div>
          </div>
        </div>

        {/* Print Slip Footer */}
        <div className="text-center text-xs text-gray-500 border-t pt-4 mt-8">
          <p className="font-semibold text-gray-600">Important Instructions:</p>
          <p className="mt-1">1. Please produce a printed copy or digital screenshot of this slip at the hospital reception counters.</p>
          <p className="mt-0.5">2. Please arrive at least 15 minutes before your scheduled slot time.</p>
          <p className="mt-0.5">3. For support or cancellation, please visit the MEDOX portal or call the helpline.</p>
          <p className="mt-4 font-bold text-gray-700">Thank you for booking with MEDOX!</p>
        </div>
      </div>

      {/* Hidden Print Styling */}
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-slip, #print-slip * {
            visibility: visible !important;
          }
          #print-slip {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            display: block !important;
          }
        }
      `}</style>

      <Footer />
    </div>
  )
}
