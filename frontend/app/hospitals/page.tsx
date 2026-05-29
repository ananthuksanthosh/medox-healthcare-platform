'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Search, MapPin, Building2, Star, Filter, X, Bed, Clock } from 'lucide-react'
import { districts } from '@/lib/data'

export default function HospitalsPage() {
  const [hospitalsList, setHospitalsList] = useState<any[]>([])
  const [departmentsList, setDepartmentsList] = useState<any[]>([])

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [hospsRes, deptsRes] = await Promise.all([
          fetch('http://localhost:5000/api/hospitals'),
          fetch('http://localhost:5000/api/departments')
        ])
        if (hospsRes.ok) {
          const hData = await hospsRes.json()
          setHospitalsList(hData.data?.hospitals ?? hData.hospitals ?? hData ?? [])
        }
        if (deptsRes.ok) {
          const dData = await deptsRes.json()
          setDepartmentsList(dData.data?.departments ?? dData.departments ?? dData ?? [])
        }
      } catch (err) {
        console.error("Failed to load hospitals list:", err)
      }
    }
    fetchData()
  }, [])

  const filteredHospitals = useMemo(() => {
    return hospitalsList.filter((hospital) => {
      const matchesSearch = hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.address.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDistrict = !selectedDistrict || hospital.district === selectedDistrict
      const matchesDepartment = !selectedDepartment || (hospital.departments && hospital.departments.includes(selectedDepartment))
      return matchesSearch && matchesDistrict && matchesDepartment
    })
  }, [hospitalsList, searchQuery, selectedDistrict, selectedDepartment])

  const clearFilters = () => {
    setSearchQuery('')
    setSelectedDistrict('')
    setSelectedDepartment('')
  }

  const hasActiveFilters = searchQuery || selectedDistrict || selectedDepartment

  const getDepartmentNames = (hospital: any): string[] => {
    // Backend returns departmentNames[] directly on the hospital object
    if (Array.isArray(hospital.departmentNames) && hospital.departmentNames.length > 0) {
      return hospital.departmentNames
    }
    // Fallback: look up by ID from departmentsList
    const ids: any[] = hospital.departments ?? []
    return ids
      .map((id) => departmentsList.find((d) => String(d.id) === String(id))?.name)
      .filter(Boolean) as string[]
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Header */}
      <div className="bg-gradient-to-b from-primary/5 to-background py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Find Hospitals</h1>
          <p className="mt-2 text-muted-foreground">
            Browse and search through partner hospitals across Kerala
          </p>

          {/* Search & Filters */}
          <div className="mt-8 flex flex-col gap-4 lg:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search hospitals by name or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 pl-10"
              />
            </div>
            <div className="flex gap-3">
              <select
                value={selectedDistrict}
                onChange={(e) => setSelectedDistrict(e.target.value)}
                className="h-12 rounded-md border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Districts</option>
                {districts.map((district) => (
                  <option key={district.id} value={district.id}>
                    {district.name}
                  </option>
                ))}
              </select>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="h-12 rounded-md border border-input bg-background px-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">All Departments</option>
                {departmentsList.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                size="lg"
                className="h-12 lg:hidden"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Active filters:</span>
              {searchQuery && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                  {searchQuery}
                  <button onClick={() => setSearchQuery('')}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {selectedDistrict && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                  {districts.find(d => d.id === selectedDistrict)?.name}
                  <button onClick={() => setSelectedDistrict('')}>
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
            Showing <span className="font-medium text-foreground">{filteredHospitals.length}</span> hospitals
          </p>
        </div>

        {filteredHospitals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="h-16 w-16 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold text-foreground">No hospitals found</h3>
            <p className="mt-2 text-muted-foreground">Try adjusting your search or filters</p>
            <Button onClick={clearFilters} variant="outline" className="mt-4">
              Clear Filters
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredHospitals.map((hospital) => (
              <Card key={hospital.id} className="group overflow-hidden transition-all hover:shadow-lg">
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="h-20 w-20 text-primary/30" />
                  </div>
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-sm font-medium backdrop-blur-sm">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span>{hospital.rating}</span>
                  </div>
                  {hospital.featured && (
                    <div className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      Featured
                    </div>
                  )}
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary">
                    {hospital.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span>{hospital.address}</span>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {getDepartmentNames(hospital).slice(0, 3).map((dept) => (
                      <span
                        key={dept}
                        className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground"
                      >
                        {dept}
                      </span>
                    ))}
                    {getDepartmentNames(hospital).length > 3 && (
                      <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
                        +{getDepartmentNames(hospital).length - 3} more
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Bed className="h-4 w-4" />
                      <span>{hospital.beds} Beds</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      <span>Est. {hospital.established}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button className="flex-1" asChild>
                      <Link href={`/book-appointment?hospital=${hospital.id}`}>
                        Book Appointment
                      </Link>
                    </Button>
                    <Button variant="outline" asChild>
                      <Link href={`/hospitals/${hospital.id}`}>
                        Details
                      </Link>
                    </Button>
                  </div>
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
