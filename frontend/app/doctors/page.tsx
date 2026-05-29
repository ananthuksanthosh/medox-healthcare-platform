'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, MapPin, Star, X, User, Clock, IndianRupee, GraduationCap, Languages } from 'lucide-react'

export default function DoctorsPage() {
  const [doctorsList, setDoctorsList] = useState<any[]>([])
  const [departmentsList, setDepartmentsList] = useState<any[]>([])
  const [hospitalsList, setHospitalsList] = useState<any[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedHospital, setSelectedHospital] = useState('')
  const [showAvailableOnly, setShowAvailableOnly] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [docsRes, deptsRes, hospsRes] = await Promise.all([
          fetch('http://localhost:5000/api/doctors'),
          fetch('http://localhost:5000/api/departments'),
          fetch('http://localhost:5000/api/hospitals')
        ])
        if (docsRes.ok) setDoctorsList(await docsRes.json())
        if (deptsRes.ok) setDepartmentsList(await deptsRes.json())
        if (hospsRes.ok) setHospitalsList(await hospsRes.json())
      } catch (err) {
        console.error("Failed to fetch doctors data:", err)
      }
    }
    fetchData()
  }, [])

  const filteredDoctors = useMemo(() => {
    return doctorsList.filter((doctor) => {
      const matchesSearch = doctor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDepartment = !selectedDepartment || doctor.department === selectedDepartment
      const matchesHospital = !selectedHospital || doctor.hospitalId === selectedHospital
      const matchesAvailability = !showAvailableOnly || doctor.availability
      return matchesSearch && matchesDepartment && matchesHospital && matchesAvailability
    })
  }, [doctorsList, searchQuery, selectedDepartment, selectedHospital, showAvailableOnly])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedDepartment('')
    setSelectedHospital('')
    setShowAvailableOnly(false)
  }

  const hasActiveFilters = searchQuery || selectedDepartment || selectedHospital || showAvailableOnly

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Find Doctors</h1>
          <p className="mt-2 text-muted-foreground">
            Connect with expert doctors and specialists across Kerala
          </p>

          {/* Search & Filters */}
          <div className="mt-8 flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search doctors by name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-3">
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="h-12 rounded-md border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Specializations</option>
                {departmentsList.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedHospital}
                onChange={(e) => setSelectedHospital(e.target.value)}
                className="h-12 rounded-md border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Hospitals</option>
                {hospitalsList.map((hospital) => (
                  <option key={hospital.id} value={hospital.id}>
                    {hospital.name}
                  </option>
                ))}
              </select>
              <label className="flex h-12 cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-4 text-sm">
                <input
                  type="checkbox"
                  checked={showAvailableOnly}
                  onChange={(e) => setShowAvailableOnly(e.target.checked)}
                  className="h-4 w-4 rounded border-border"
                />
                <span>Available Only</span>
              </label>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                  {searchQuery}
                  <button onClick={() => setSearchQuery('')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedDepartment && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                  {departmentsList.find(d => d.id === selectedDepartment)?.name}
                  <button onClick={() => setSelectedDepartment('')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedHospital && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                  {hospitalsList.find(h => h.id === selectedHospital)?.name}
                  <button onClick={() => setSelectedHospital('')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {showAvailableOnly && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                  Available
                  <button onClick={() => setShowAvailableOnly(false)}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button
                onClick={clearFilters}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <p className="text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredDoctors.length}</span> doctors
          </p>
        </div>

        {filteredDoctors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <User className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No doctors found</h3>
            <p className="mt-2 text-muted-foreground">Try adjusting your search or filters</p>
            <Button onClick={clearFilters} variant="outline" className="mt-4">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredDoctors.map((doctor) => (
              <Card key={doctor.id} className="group overflow-hidden transition-all hover:shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                            {doctor.name}
                          </h3>
                          <p className="text-sm text-primary">{doctor.specialization}</p>
                        </div>
                        <div className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          doctor.availability
                            ? 'bg-success/10 text-success'
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {doctor.availability ? 'Available' : 'Unavailable'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{doctor.hospital}</span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <GraduationCap className="h-4 w-4 flex-shrink-0" />
                    <span>{doctor.education}</span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-3">
                    <div className="rounded-lg bg-secondary/50 p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Star className="h-4 w-4 fill-warning text-warning" />
                        <span className="font-semibold text-foreground">{doctor.rating}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Rating</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">{doctor.experience}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Years Exp</p>
                    </div>
                    <div className="rounded-lg bg-secondary/50 p-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <IndianRupee className="h-4 w-4 text-primary" />
                        <span className="font-semibold text-foreground">{doctor.consultationFee}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">Fee</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Languages className="h-4 w-4 flex-shrink-0" />
                    <span>{doctor.languages.join(', ')}</span>
                  </div>

                  <Button 
                    className="mt-4 w-full" 
                    disabled={!doctor.availability}
                    asChild={doctor.availability}
                  >
                    {doctor.availability ? (
                      <Link href={`/book-appointment?doctor=${doctor.id}`}>
                        Book Appointment
                      </Link>
                    ) : (
                      <span>Currently Unavailable</span>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  )
}
