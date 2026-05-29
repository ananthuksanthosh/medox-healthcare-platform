import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function CareersPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-foreground">Careers</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Join MEDOX and help build the future of digital healthcare. We are looking for passionate people who care about technology and patient outcomes.
        </p>
        <div className="mt-10 space-y-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Open Roles</h2>
            <ul className="mt-4 space-y-3 list-disc pl-5 text-sm leading-7 text-muted-foreground">
              <li>Product Designer</li>
              <li>Frontend Engineer</li>
              <li>Customer Success Specialist</li>
              <li>Healthcare Operations Manager</li>
            </ul>
          </div>
          <div>
            <p className="text-sm leading-7 text-muted-foreground">
              Interested candidates should send their resume and a brief introduction to <a className="text-primary hover:underline" href="mailto:careers@medox.in">careers@medox.in</a>.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
