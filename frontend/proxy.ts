import { NextRequest, NextResponse } from 'next/server'

// Protected routes that require authentication
const PROTECTED_ROUTES = [
  '/book-appointment',
  '/patient',
  '/doctor',
  '/admin/dashboard',
  '/admin/doctor-requests',
  '/admin/doctors',
  '/admin/hospitals',
  '/admin/patients',
  '/admin/appointments',
  '/admin/payments',
  '/admin/reports',
  '/admin/notifications',
  '/admin/settings',
]

// Public routes
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/doctors',
  '/hospitals',
  '/admin/login',
  '/admin/forgot-password',
  '/'
]

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public routes through without checking auth
  const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(`${route}/`))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Check if the route is protected
  const isProtectedRoute = PROTECTED_ROUTES.some(route => pathname.startsWith(route))

  if (isProtectedRoute) {
    // Check for auth token in cookies or headers
    const authToken = request.cookies.get('auth_token')?.value

    // If no auth token, redirect to the right login page
    if (!authToken) {
      const redirectUrl = pathname.startsWith('/admin') ? '/admin/login' : '/login'
      const loginUrl = new URL(redirectUrl, request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Allow the request to continue
  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all routes except static assets and API routes
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
