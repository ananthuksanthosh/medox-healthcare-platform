const AUTH_STORAGE_KEY = 'medox.isLoggedIn'
const AUTH_ROLE_KEY = 'medox.userRole'
const AUTH_TOKEN_KEY = 'medox.authToken'

export type UserRole = 'patient' | 'doctor' | 'admin'

export function signIn(role: UserRole = 'patient', token?: string) {
  if (typeof window === 'undefined') return
  
  // Generate a token if not provided (in production, this comes from server)
  const authToken = token || `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  window.localStorage.setItem(AUTH_STORAGE_KEY, 'true')
  window.localStorage.setItem(AUTH_ROLE_KEY, role)
  window.localStorage.setItem(AUTH_TOKEN_KEY, authToken)
  
  // Also set as a cookie for middleware
  if (typeof document !== 'undefined') {
    document.cookie = `auth_token=${authToken}; path=/; max-age=${7 * 24 * 60 * 60}` // 7 days
  }
}

export function signOut() {
  if (typeof window === 'undefined') return
  
  // Clear demo auth keys
  window.localStorage.removeItem(AUTH_STORAGE_KEY)
  window.localStorage.removeItem(AUTH_ROLE_KEY)
  window.localStorage.removeItem(AUTH_TOKEN_KEY)
  window.localStorage.removeItem('medox.userName')
  
  // Clear real auth keys
  window.localStorage.removeItem('token')
  window.localStorage.removeItem('user')
  
  // Clear cookie
  if (typeof document !== 'undefined') {
    document.cookie = 'auth_token=; path=/; max-age=0; SameSite=Lax'
  }
}

export function isAuthenticated() {
  if (typeof window === 'undefined') return false
  
  // Check both localStorage and if token exists
  const isLoggedIn = window.localStorage.getItem(AUTH_STORAGE_KEY) === 'true'
  const hasToken = window.localStorage.getItem(AUTH_TOKEN_KEY)
  
  return isLoggedIn && !!hasToken
}

export function getUserRole() {
  if (typeof window === 'undefined') return null
  
  // Only return role if authenticated
  if (!isAuthenticated()) return null
  
  return window.localStorage.getItem(AUTH_ROLE_KEY) as UserRole | null
}

export function getAuthToken() {
  if (typeof window === 'undefined') return null
  return window.localStorage.getItem(AUTH_TOKEN_KEY)
}
