'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const benefits = [
  'Free registration for patients',
  'Instant appointment confirmation',
  'Access to 450+ verified doctors',
  'Secure medical records storage',
  '24/7 customer support',
  'Easy online payments',
]

export function CTASection() {
  return (
    <section className="relative overflow-hidden bg-primary py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 -z-10 opacity-10">
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-white blur-3xl" />
        <div className="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-white blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-balance text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl">
              Start Your Healthcare Journey Today
            </h2>
            <p className="mt-4 text-lg text-primary-foreground/80">
              Join over 125,000 patients who trust MEDOX for their healthcare needs. Register now and book your first appointment in minutes.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={benefit}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-2"
                >
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-primary-foreground" />
                  <span className="text-sm text-primary-foreground/90">{benefit}</span>
                </motion.div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row">
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-primary hover:bg-white/90"
                asChild
              >
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
                asChild
              >
                <Link href="/book-appointment">Book Appointment</Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="flex items-center justify-center"
          >
            <div className="relative">
              <div className="rounded-3xl border border-primary-foreground/20 bg-primary-foreground/10 p-8 backdrop-blur">
                <div className="text-center">
                  <p className="text-6xl font-bold text-primary-foreground">125K+</p>
                  <p className="mt-2 text-lg text-primary-foreground/80">Happy Patients</p>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-foreground">73+</p>
                    <p className="mt-1 text-sm text-primary-foreground/80">Hospitals</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-foreground">450+</p>
                    <p className="mt-1 text-sm text-primary-foreground/80">Doctors</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-foreground">5</p>
                    <p className="mt-1 text-sm text-primary-foreground/80">Districts</p>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-primary-foreground">98.5%</p>
                    <p className="mt-1 text-sm text-primary-foreground/80">Satisfaction</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
