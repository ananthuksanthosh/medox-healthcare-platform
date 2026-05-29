'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DoctorRequestsRedirect() {
  const router = useRouter()
  
  useEffect(() => {
    router.replace('/admin/hospital-verification')
  }, [router])

  return (
    <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500">
      Redirecting to Hospital Verification...
    </div>
  )
}
