import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function BlogPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-foreground">Blog</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Explore news, insights, and healthcare tips from the MEDOX team.
        </p>
        <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-foreground">Coming soon</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            We are preparing stories on health, appointments, doctor guidance, and digital care. Check back soon for our first updates.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  )
}
