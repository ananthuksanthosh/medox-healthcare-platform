'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, MapPin, Calendar, Shield, Clock, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { districts } from '@/lib/data'

export function HeroSection() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background pb-20 pt-12">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 opacity-30">
        <div className="absolute left-1/4 top-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute right-1/4 top-1/2 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col justify-center"
          >
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Shield className="h-4 w-4" />
              Trusted by 125,000+ Patients
            </div>

            <h1 className="mt-6 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Healthcare Made{' '}
              <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Simple
              </span>{' '}
              Across Kerala
            </h1>

            <p className="mt-6 max-w-lg text-lg text-muted-foreground">
              Book appointments with top doctors, access your medical records, and manage your health journey seamlessly across 73+ hospitals in Kerala.
            </p>

            {/* Search Box */}
            <div className="mt-8 rounded-2xl border border-border bg-card p-4 shadow-lg">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search hospitals, doctors, departments..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-12 pl-10"
                  />
                </div>
                <div className="relative sm:w-48">
                  <MapPin className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    className="h-12 w-full rounded-md border border-input bg-background pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">All Districts</option>
                    {districts.map((district) => (
                      <option key={district.id} value={district.id}>
                        {district.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button size="lg" className="h-12 px-8" asChild>
                  <Link href={`/hospitals?search=${searchQuery}&district=${selectedDistrict}`}>
                    Search
                  </Link>
                </Button>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Clock className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">24/7</p>
                  <p className="text-xs text-muted-foreground">Support</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                  <Users className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">450+</p>
                  <p className="text-xs text-muted-foreground">Doctors</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                  <Calendar className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">98.5%</p>
                  <p className="text-xs text-muted-foreground">Success Rate</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Content - Hero Image/Illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative hidden lg:flex lg:items-center lg:justify-center"
          >
            <div className="relative">
              {/* Main Card */}
              <div className="rounded-3xl border border-border bg-card p-8 shadow-2xl">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
                    <Calendar className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">Quick Appointment</h3>
                    <p className="text-sm text-muted-foreground">Book in under 2 minutes</p>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="rounded-xl bg-secondary/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Dr. Arun Kumar</p>
                        <p className="text-xs text-muted-foreground">Cardiologist</p>
                      </div>
                      <div className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                        Available
                      </div>
                    </div>
                  </div>
                  <div className="rounded-xl bg-secondary/50 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Dr. Priya Menon</p>
                        <p className="text-xs text-muted-foreground">Neurologist</p>
                      </div>
                      <div className="rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
                        Available
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="mt-6 w-full" asChild>
                  <Link href="/book-appointment">Book Now</Link>
                </Button>
              </div>

              {/* Floating Card */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -left-8 -top-8 rounded-2xl border border-border bg-card p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <Shield className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">73+ Hospitals</p>
                    <p className="text-xs text-muted-foreground">Across Kerala</p>
                  </div>
                </div>
              </motion.div>

              {/* Another Floating Card */}
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -bottom-4 -right-4 rounded-2xl border border-border bg-card p-4 shadow-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">125K+</p>
                    <p className="text-xs text-muted-foreground">Happy Patients</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
