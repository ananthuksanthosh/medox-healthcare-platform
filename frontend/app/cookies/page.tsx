import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function CookiesPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-foreground">Cookie Policy</h1>
        <p className="mt-6 text-sm leading-7 text-muted-foreground">
          We use cookies to improve your experience on MEDOX. Cookies help us remember preferences and analyze usage.
        </p>
        <div className="mt-10 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <h2 className="text-2xl font-semibold text-foreground">What are cookies?</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            Cookies are small data files stored on your browser. They help our site work efficiently and personalize your visit.
          </p>
          <h2 className="mt-8 text-2xl font-semibold text-foreground">How we use cookies</h2>
          <p className="mt-4 text-sm leading-7 text-muted-foreground">
            We use cookies for session management, analytics, and site improvements. You can control cookie settings in your browser.
          </p>
        </div>
      </section>
      <Footer />
    </main>
  )
}
