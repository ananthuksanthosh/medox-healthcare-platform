'use client'

import * as React from 'react'
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AlertBoxProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'success' | 'error' | 'warning' | 'info'
  title?: string
  description: string
  onClose?: () => void
}

export function AlertBox({
  variant = 'info',
  title,
  description,
  onClose,
  className,
  ...props
}: AlertBoxProps) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 [&>svg]:text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-300 dark:border-emerald-900/30',
    error: 'bg-red-50 text-red-800 border-red-200 [&>svg]:text-red-600 dark:bg-red-950/20 dark:text-red-300 dark:border-red-900/30',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 [&>svg]:text-amber-600 dark:bg-amber-950/20 dark:text-amber-300 dark:border-amber-900/30',
    info: 'bg-blue-50 text-blue-800 border-blue-200 [&>svg]:text-blue-600 dark:bg-blue-950/20 dark:text-blue-300 dark:border-blue-900/30',
  }

  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const Icon = icons[variant]

  return (
    <div
      role="alert"
      className={cn(
        'relative flex gap-3 rounded-xl border p-4 text-sm font-medium transition-all duration-300 shadow-sm animate-in fade-in slide-in-from-top-2',
        styles[variant],
        className
      )}
      {...props}
    >
      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        {title && <h5 className="font-semibold mb-1 tracking-tight leading-none">{title}</h5>}
        <p className="opacity-90 leading-relaxed">{description}</p>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="absolute right-2 top-2 p-1 rounded-lg hover:bg-black/5 opacity-60 hover:opacity-100 transition-all"
          aria-label="Close alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
