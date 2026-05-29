'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Calendar,
  FileText,
  Hospital,
  CreditCard,
  Bell,
  Shield,
  Video,
  Clock,
} from 'lucide-react'

const services = [
  {
    icon: Calendar,
    title: 'Online Appointment',
    description: 'Book appointments with doctors across Kerala in just a few clicks. No waiting, no hassle.',
    href: '/book-appointment',
    color: 'bg-primary/10 text-primary',
  },
  {
    icon: Hospital,
    title: 'Find Hospitals',
    description: 'Search and compare hospitals by location, speciality, ratings, and available facilities.',
    href: '/hospitals',
    color: 'bg-accent/10 text-accent',
  },
  {
    icon: FileText,
    title: 'Medical Records',
    description: 'Access your complete medical history, prescriptions, and reports anytime, anywhere.',
    href: '/patient/dashboard',
    color: 'bg-success/10 text-success',
  },
  {
    icon: CreditCard,
    title: 'Easy Payments',
    description: 'Secure payment options with Razorpay integration. Pay online or at the hospital.',
    href: '/book-appointment',
    color: 'bg-warning/10 text-warning',
  },

  {
    icon: Shield,
    title: 'Data Security',
    description: 'Your health data is encrypted and protected with enterprise-grade security.',
    href: '#',
    color: 'bg-success/10 text-success',
  },
  {
    icon: Clock,
    title: '24/7 Support',
    description: 'Our support team is always available to help you with any queries.',
    href: '/contact',
    color: 'bg-warning/10 text-warning',
  },
]

export function ServicesSection() {
  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Our Services
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Everything you need to manage your healthcare journey in one platform
          </p>
        </motion.div>

        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((service, index) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link
                href={service.href}
                className="group flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:border-primary/50 hover:shadow-lg"
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${service.color}`}>
                  <service.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-foreground group-hover:text-primary">
                  {service.title}
                </h3>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">
                  {service.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-12 text-center"
        >
          <Button size="lg" asChild>
            <Link href="/book-appointment">Book Your Appointment Now</Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
