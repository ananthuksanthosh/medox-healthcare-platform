"use client"

import { cn } from "@/lib/utils"

export function MedoxIcon({ className = "h-9 w-9" }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center bg-gradient-to-tr from-sky-500 to-emerald-500 rounded-lg p-1.5 text-white shadow-sm shrink-0", className)}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-full w-full animate-pulse"
        style={{ animationDuration: '3s' }}
      >
        <path d="M4.5 10.5C4.5 10.5 7.5 4.5 12 4.5C16.5 4.5 19.5 10.5 19.5 10.5C19.5 10.5 16.5 16.5 12 16.5C7.5 16.5 4.5 10.5 4.5 10.5Z" strokeOpacity="0.4" />
        <path d="M4.5 13.5C4.5 13.5 7.5 19.5 12 19.5C16.5 19.5 19.5 13.5 19.5 13.5C19.5 13.5 16.5 7.5 12 7.5C7.5 7.5 4.5 13.5 4.5 13.5Z" strokeOpacity="0.4" />
        <path d="M6 10v4M9 8.5v7M12 7.5v9M15 8.5v7M18 10v4" stroke="currentColor" strokeWidth="2" strokeDasharray="1.5 1.5" />
      </svg>
    </div>
  )
}

interface BrandHeaderProps {
  collapsed?: boolean
  className?: string
}

export function BrandHeader({
  collapsed = false,
  className,
}: BrandHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 transition-all duration-300 select-none",
        className
      )}
    >
      <MedoxIcon className="h-9 w-9" />
      
      {!collapsed && (
        <span className="text-xl font-bold tracking-wide text-slate-100">
          MEDOX
        </span>
      )}
    </div>
  )
}
