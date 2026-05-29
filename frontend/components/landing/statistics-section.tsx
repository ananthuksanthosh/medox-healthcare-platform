'use client'

import { motion } from 'framer-motion'
import { Building2, Users, Calendar, Activity, MapPin, Award } from 'lucide-react'

const stats = [
  {
    icon: Building2,
    value: '73+',
    label: 'Partner Hospitals',
    description: 'Across 5 districts',
  },
  {
    icon: Users,
    value: '450+',
    label: 'Expert Doctors',
    description: 'Verified specialists',
  },
  {
    icon: Calendar,
    value: '125K+',
    label: 'Appointments',
    description: 'Successfully booked',
  },
  {
    icon: Activity,
    value: '98.5%',
    label: 'Success Rate',
    description: 'Patient satisfaction',
  },
  {
    icon: MapPin,
    value: '5',
    label: 'Districts',
    description: 'Kerala coverage',
  },
  {
    icon: Award,
    value: '24/7',
    label: 'Support',
    description: 'Always available',
  },
]

export function StatisticsSection() {
  return (
    <section className="border-y border-border bg-card py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Trusted Healthcare Platform
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Join thousands of patients who trust MEDOX for their healthcare needs across Kerala
          </p>
        </motion.div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group rounded-2xl border border-border bg-background p-6 text-center transition-all hover:border-primary/50 hover:shadow-lg"
            >
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
                <stat.icon className="h-6 w-6 text-primary" />
              </div>
              <p className="mt-4 text-3xl font-bold text-foreground">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-foreground">{stat.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
