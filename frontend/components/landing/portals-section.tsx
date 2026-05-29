'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { User, Stethoscope, ShieldCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getUserRole, isAuthenticated, type UserRole } from '@/lib/auth'

const portals = [
  {
    id: 'patient',
    title: 'Patient Portal',
    description: 'Book appointments, manage reports, view prescriptions and token status.',
    icon: User,
    color: 'bg-blue-50 text-blue-600',
    borderColor: 'border-blue-100 hover:border-blue-300',
    buttonVariant: 'default' as const,
    loginLink: '/login?role=patient',
    signupLink: '/register?role=patient',
  },
  {
    id: 'doctor',
    title: 'Doctor Portal',
    description: 'Manage appointments, patient schedules, prescriptions and availability.',
    icon: Stethoscope,
    color: 'bg-emerald-50 text-emerald-600',
    borderColor: 'border-emerald-100 hover:border-emerald-300',
    buttonVariant: 'outline' as const,
    loginLink: '/login?role=doctor',
    signupLink: undefined,
  },

]

export function PortalsSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [role, setRole] = useState<UserRole | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const authenticated = isAuthenticated()
    setIsLoggedIn(authenticated)
    setRole(authenticated ? getUserRole() : null)
  }, [])

  if (!mounted) return null
  
  if (isLoggedIn) {
    const dashboardLink =
      role === 'doctor'
        ? '/doctor/dashboard'
        : role === 'admin'
          ? '/admin/dashboard'
          : '/patient/dashboard'

    return (
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Welcome back
          </h2>
          <p className="mt-4 text-lg text-slate-600">
            You are already signed in. Continue to your MEDOX dashboard to manage your healthcare activity.
          </p>
          <Button className="mt-8" asChild>
            <Link href={dashboardLink}>
              Go to Dashboard
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Access Your Portal
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Secure, role-based access for patients, medical professionals, and administrators.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          {portals.map((portal, index) => (
            <motion.div
              key={portal.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`flex flex-col rounded-2xl border ${portal.borderColor} bg-white p-8 shadow-sm transition-all hover:shadow-md`}
            >
              <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl ${portal.color}`}>
                <portal.icon className="h-7 w-7" />
              </div>
              
              <h3 className="mb-3 text-xl font-bold text-slate-900">{portal.title}</h3>
              <div className="mb-8 flex-1 leading-relaxed">
                <p className="text-slate-600">{portal.description}</p>
                {portal.id === 'doctor' && (
                  <p className="mt-4 text-xs font-semibold text-emerald-700 bg-emerald-50/50 p-3 rounded-lg border border-emerald-100/50 text-left">
                    Only verified medical professionals approved by MEDOX administration can access the Doctor Portal. Doctor accounts are managed by MEDOX administrators.
                  </p>
                )}
              </div>
              
              <div className="flex flex-col gap-3">
                <Button variant={portal.buttonVariant} className="w-full justify-between" asChild>
                  <Link href={portal.loginLink}>
                    Login to Portal
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Link>
                </Button>
                
                {portal.signupLink && (
                  <Button variant="ghost" className="w-full text-slate-600" asChild>
                    <Link href={portal.signupLink}>
                      Create an account
                    </Link>
                  </Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
