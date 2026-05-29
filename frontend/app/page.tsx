import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'
import { HeroSection } from '@/components/landing/hero-section'
import { PortalsSection } from '@/components/landing/portals-section'
import { StatisticsSection } from '@/components/landing/statistics-section'
import { ServicesSection } from '@/components/landing/services-section'
import { FeaturedHospitals } from '@/components/landing/featured-hospitals'
import { DistrictsSection } from '@/components/landing/districts-section'
import { CTASection } from '@/components/landing/cta-section'
import { ContactSection } from '@/components/landing/contact-section'

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <HeroSection />
      <PortalsSection />
      <StatisticsSection />
      <ServicesSection />
      <FeaturedHospitals />
      <DistrictsSection />
      <CTASection />
      <ContactSection />
      <Footer />
    </main>
  )
}
