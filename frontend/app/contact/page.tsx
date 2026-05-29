import { Navbar } from '@/components/layout/navbar'
import { Footer } from '@/components/layout/footer'

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navbar />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-foreground">Contact Us</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Need help with your appointment or want to learn more about our services? Our support team is available to assist you.
        </p>
        <div className="mt-10 space-y-6 rounded-3xl border border-border bg-card p-8 shadow-sm">
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Customer Support</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              Email us at <a className="text-primary hover:underline" href="mailto:support@medox.in">support@medox.in</a> or call <a className="text-primary hover:underline" href="tel:+914712345678">+91 471 2345678</a>.
            </p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">Office Location</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">Thiruvananthapuram, Kerala, India</p>
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-foreground">General Inquiries</h2>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">For partnerships, media, or product questions, send a message to <span className="font-medium text-foreground">support@medox.in</span>.</p>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  )
}
