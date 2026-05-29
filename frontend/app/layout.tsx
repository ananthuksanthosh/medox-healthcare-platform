import type { Metadata, Viewport } from 'next'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// Local system font fallback to support offline isolated sandbox compilation
const inter = {
  variable: 'font-sans'
}

export const metadata: Metadata = {
  title: 'MEDOX - Kerala Multi-Hospital Appointment & Patient Management Platform',
  description: 'Book appointments, manage health records, and connect with top hospitals across Kerala. MEDOX - Your trusted healthcare partner.',
  keywords: ['healthcare', 'hospital', 'appointment', 'Kerala', 'medical', 'doctor', 'patient'],
}

export const viewport: Viewport = {
  themeColor: '#3b82f6',
  width: 'device-width',
  initialScale: 1,
}

import { Toaster } from '@/components/ui/toaster'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
        <Toaster />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
