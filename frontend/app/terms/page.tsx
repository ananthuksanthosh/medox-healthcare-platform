import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-foreground">Terms of Service</h1>
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          These terms govern your use of the MEDOX platform. By using our service, you agree to these terms.
        </p>
        <div className="mt-10 space-y-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Use of service</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              MEDOX provides appointment booking and healthcare discovery tools. We are not a medical provider.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">User responsibilities</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Users are responsible for providing accurate information and following the guidance of their healthcare providers.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Changes</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              We may update these terms from time to time. Continued use of MEDOX after changes implies acceptance.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
