'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Menu, X, ChevronDown, Bell, User, LogOut, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { isAuthenticated, getUserRole, signOut } from '@/lib/auth'
import { Logo } from '@/components/ui/logo'

interface NavbarProps {
  variant?: 'default' | 'dashboard'
  userRole?: 'patient' | 'doctor' | 'admin' | null
}

export function Navbar({ variant = 'default', userRole = null }: NavbarProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [role, setRole] = useState<'patient' | 'doctor' | 'admin' | null>(null)
  const [userName, setUserName] = useState<string>('')

  useEffect(() => {
    // Check auth status and load user info
    const checkAuth = () => {
      const isAuth = isAuthenticated()
      setAuthenticated(isAuth)
      
      if (isAuth) {
        const userRole = getUserRole()
        setRole(userRole)
        
        // Get user name from localStorage (stored during login)
        const storedUserName = typeof window !== 'undefined' 
          ? window.localStorage.getItem('medox.userName') 
          : null
        
        if (storedUserName) {
          setUserName(storedUserName)
        } else {
          // Fallback if no name stored
          setUserName(userRole === 'patient' ? 'Patient' : userRole === 'doctor' ? 'Doctor' : 'Admin')
        }
      } else {
        setUserName('')
      }
    }
    
    checkAuth()
  }, [])

  const handleLogout = () => {
    signOut()
    setAuthenticated(false)
    setRole(null)
    setUserName('')
    window.location.href = '/'
  }

  const publicLinks = [
    { href: '/', label: 'Home' },
    { href: '/hospitals', label: 'Hospitals' },
    { href: '/doctors', label: 'Doctors' },
    { href: '/book-appointment', label: 'Book Appointment' },
  ]

  const dashboardLink = role === 'patient' 
    ? '/patient/dashboard' 
    : role === 'doctor' 
    ? '/doctor/dashboard' 
    : '/admin/dashboard'

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full border-b",
      variant === 'dashboard' 
        ? "bg-sidebar border-sidebar-border" 
        : "bg-card/80 backdrop-blur-md border-border"
    )}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            {variant === 'default' && publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons / User Menu */}
          <div className="hidden md:flex md:items-center md:gap-4">
            {authenticated && role ? (
              <>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="h-5 w-5" />
                  <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                    3
                  </span>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium truncate max-w-[150px]">{userName || 'User'}</span>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem className="text-sm">
                      <span className="font-medium">{userName || 'User'}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-xs text-muted-foreground">
                      {role === 'patient' ? 'Patient' : role === 'doctor' ? 'Doctor' : 'Admin'}
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={dashboardLink}>Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`${dashboardLink}/settings`}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive cursor-pointer" onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : ( <>
                  <Button variant="ghost" asChild>
                    <Link href="/login?role=patient">Patient Login</Link>
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link href="/login?role=doctor">Doctor Login</Link>
                  </Button>
                </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            {isOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="border-t border-border py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {publicLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 pt-4">
                {authenticated && role ? (
                  <>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href={dashboardLink} onClick={() => setIsOpen(false)}>
                        <User className="mr-2 h-4 w-4" />
                        {userName}
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full justify-start">
                      <Link href={`${dashboardLink}/settings`} onClick={() => setIsOpen(false)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </Button>
                    <Button variant="destructive" className="w-full justify-start" onClick={() => {
                      handleLogout()
                      setIsOpen(false)
                    }}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" asChild className="w-full">
                      <Link href="/login?role=patient" onClick={() => setIsOpen(false)}>Patient Login</Link>
                    </Button>
                    <Button variant="ghost" asChild className="w-full">
                      <Link href="/login?role=doctor" onClick={() => setIsOpen(false)}>Doctor Login</Link>
                    </Button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
