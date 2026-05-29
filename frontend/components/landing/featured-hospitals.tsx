'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Star, MapPin, Building2, ArrowRight } from 'lucide-react'
import { hospitals, departments } from '@/lib/data'

export function FeaturedHospitals() {
  const featuredHospitals = hospitals.filter((h) => h.featured)

  const getDepartmentNames = (deptIds: string[]) => {
    return deptIds
      .slice(0, 3)
      .map((id) => departments.find((d) => d.id === id)?.name)
      .filter(Boolean)
      .join(', ')
  }

  return (
    <section className="bg-secondary/30 py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Featured Hospitals
            </h2>
            <p className="mt-2 text-muted-foreground">
              Top-rated hospitals in Kerala with excellent patient care
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/hospitals">
              View All Hospitals
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </motion.div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {featuredHospitals.map((hospital, index) => (
            <motion.div
              key={hospital.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="group h-full overflow-hidden transition-all hover:shadow-lg">
                <div className="relative h-40 bg-gradient-to-br from-primary/20 to-accent/20">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="h-16 w-16 text-primary/30" />
                  </div>
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-card/90 px-2.5 py-1 text-sm font-medium">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span>{hospital.rating}</span>
                  </div>
                </div>
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-foreground group-hover:text-primary">
                    {hospital.name}
                  </h3>
                  <div className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 flex-shrink-0" />
                    <span className="truncate">{hospital.address}</span>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">
                    {getDepartmentNames(hospital.departments)}
                    {hospital.departments.length > 3 && ` +${hospital.departments.length - 3} more`}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{hospital.beds} Beds</span>
                    <span className="text-muted-foreground">Est. {hospital.established}</span>
                  </div>
                  <Button className="mt-4 w-full" variant="outline" size="sm" asChild>
                    <Link href={`/hospitals/${hospital.id}`}>View Details</Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
