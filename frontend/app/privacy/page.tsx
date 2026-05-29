import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-foreground">Privacy Policy</h1>
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          At MEDOX, we take your privacy seriously. We only collect personal information needed to provide our services and keep it secure.
        </p>
        <div className="mt-10 space-y-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Information we collect</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              We may collect contact details, appointment data, and medical records to help you book care and manage your account.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">How we use it</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              Your data is used for appointment scheduling, provider communication, and improving the MEDOX experience.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Security</h2>
            <p className="mt-4 text-sm leading-7 text-muted-foreground">
              We implement appropriate technical and organizational measures to protect your information from unauthorized access.
            </p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
