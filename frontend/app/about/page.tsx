import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-5xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-foreground">About Us</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          MEDOX is a healthcare platform built to make it easier for patients to find doctors, book appointments, and manage medical records from one place.
          We bring together trusted hospitals, specialists, and care teams to support families across Kerala.
        </p>
        <div className="mt-10 grid gap-10 sm:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Our mission</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              We strive to simplify healthcare access by connecting patients with quality care providers, helping users make confident decisions, and improving care coordination.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">What we do</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              From appointment booking to medical records and doctor discovery, MEDOX brings modern digital tools to local healthcare needs.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
