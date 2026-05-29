'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, notFound } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { MapPin, Star, Bed, Clock, HeartPulse, User, Building2 } from 'lucide-react'

export default function HospitalDetailsPage() {
  const params = useParams()
  const id = params?.id as string

  const [hospital, setHospital] = useState<any>(null)
  const [doctorsList, setDoctorsList] = useState<any[]>([])
  const [departmentsList, setDepartmentsList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      try {
        const [hospsRes, docsRes, deptsRes] = await Promise.all([
          fetch('http://localhost:5000/api/hospitals'),
          fetch('http://localhost:5000/api/doctors'),
          fetch('http://localhost:5000/api/departments')
        ])
        if (hospsRes.ok && docsRes.ok && deptsRes.ok) {
          const hosps = await hospsRes.json()
          const found = hosps.find((h: any) => h.id === id)
          setHospital(found || null)
          setDoctorsList(await docsRes.json())
          setDepartmentsList(await deptsRes.json())
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex min-h-[400px] items-center justify-center">
          <p className="text-muted-foreground font-medium">Loading hospital details...</p>
        </div>
        <Footer />
      </div>
    )
  }

  if (!hospital) {
    notFound()
  }

  const hospitalDoctors = doctorsList.filter((doctor) => String(doctor.hospitalId) === String(hospital.id))
  const departmentNames = (hospital.departments || [])
    .map((deptId: string) => departmentsList.find((dept) => dept.id === deptId)?.name)
    .filter(Boolean) as string[]

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="flex items-center gap-3 text-slate-500">
                  <Building2 className="h-6 w-6" />
                  <span className="text-sm font-medium">Hospital Details</span>
                </div>
                <h1 className="mt-4 text-3xl font-semibold text-foreground">{hospital.name}</h1>
                <p className="mt-2 max-w-2xl text-slate-600">A trusted hospital partner in Kerala with a strong department network and expert staff.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-3xl bg-slate-50 p-4 text-center">
                  <p className="text-sm text-slate-500">Rating</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{hospital.rating}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-center">
                  <p className="text-sm text-slate-500">Beds</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{hospital.beds}</p>
                </div>
                <div className="rounded-3xl bg-slate-50 p-4 text-center">
                  <p className="text-sm text-slate-500">Established</p>
                  <p className="mt-2 text-2xl font-semibold text-foreground">{hospital.established}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6">
              <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl font-semibold text-foreground">Hospital overview</CardTitle>
                  <CardDescription className="text-slate-500">
                    Location, departments, and the doctor team currently available at this hospital.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-5">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-medium">Location</span>
                      </div>
                      <p className="mt-3 text-slate-950">{hospital.address}</p>
                    </div>
                    <div className="rounded-3xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Bed className="h-4 w-4" />
                        <span className="text-sm font-medium">District</span>
                      </div>
                      <p className="mt-3 text-slate-950 capitalize">{hospital.district}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-slate-600">Departments</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {departmentNames.map((name) => (
                        <span key={name} className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                          {name}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex items-center gap-3 text-slate-600">
                      <HeartPulse className="h-5 w-5" />
                      <p className="text-sm font-medium">Care summary</p>
                    </div>
                    <p className="mt-3 text-slate-700">
                      This hospital covers a broad range of medical specialties and supports high-quality patient care with experienced clinical teams.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm">
                <CardHeader className="p-6">
                  <CardTitle className="text-xl font-semibold text-foreground">Doctors at {hospital.name}</CardTitle>
                  <CardDescription className="text-slate-500">
                    Our team of experienced healthcare professionals specialized in various departments.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {hospitalDoctors.length === 0 ? (
                    <p className="text-slate-600">No doctors are currently assigned to this hospital.</p>
                  ) : (
                    hospitalDoctors.map((doctor) => (
                      <div key={doctor.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <p className="text-lg font-semibold text-foreground">{doctor.name}</p>
                            <p className="text-sm text-slate-600">{doctor.specialization}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${doctor.availability ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-700'}`}>
                            {doctor.availability ? 'Available' : 'Unavailable'}
                          </span>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-3 text-sm text-slate-600">
                          <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <span className="block font-medium text-slate-950">Rating</span>
                            <span>{doctor.rating}</span>
                          </div>
                          <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <span className="block font-medium text-slate-950">Experience</span>
                            <span>{doctor.experience} yrs</span>
                          </div>
                          <div className="rounded-2xl bg-white p-3 shadow-sm">
                            <span className="block font-medium text-slate-950">Fee</span>
                            <span>₹{doctor.consultationFee}</span>
                          </div>
                        </div>
                        {doctor.languages && doctor.languages.length > 0 && (
                          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                            <User className="h-4 w-4" />
                            <span>{doctor.languages.join(', ')}</span>
                          </div>
                        )}
                        <div className="mt-4">
                          <Button asChild className="w-full">
                            <Link href={`/book-appointment?doctor=${doctor.id}&hospital=${hospital.id}`}>
                              Book Appointment
                            </Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
                <div className="flex items-center gap-3 text-slate-600">
                  <MapPin className="h-5 w-5" />
                  <span className="text-sm font-medium">Hospital location</span>
                </div>
                <p className="mt-4 text-slate-700">{hospital.address}</p>
                <div className="mt-6 grid gap-4">
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm font-medium">Working hours</span>
                    </div>
                    <p className="mt-2 text-slate-700">Mon - Sat, 8:00 AM to 8:00 PM</p>
                  </div>
                  <div className="rounded-3xl bg-slate-50 p-4">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Star className="h-4 w-4" />
                      <span className="text-sm font-medium">Verification status</span>
                    </div>
                    <p className="mt-2 text-slate-700">Verified care partner</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  )
}
