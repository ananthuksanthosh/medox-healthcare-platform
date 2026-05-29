import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function EmergencyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-foreground">Emergency Services</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          In urgent cases, we help you connect quickly with available care providers and hospital services nearby.
        </p>
        <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-foreground">What to do in an emergency</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Call your local emergency number first, then use MEDOX to locate nearby hospitals and available doctors for follow-up care.
          </p>
          <h2 className="mt-8 text-2xl font-semibold text-foreground">Available emergency support</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            We provide fast access to hospital information, emergency department availability, and appointment options for urgent care.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  )
}
