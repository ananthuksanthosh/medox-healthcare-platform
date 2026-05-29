"use client"

import { cn } from "@/lib/utils"
import { BrandHeader } from "./brand-header"

interface LogoProps {
  className?: string
  iconClassName?: string
  textClassName?: string
  collapsed?: boolean
  variant?: 'default' | 'white' | 'dark'
}

export function Logo({
  className,
  iconClassName,
  textClassName,
  collapsed = false,
  variant = 'default'
}: LogoProps) {
  return (
    <div className={cn("flex items-center", className)}>
      <BrandHeader collapsed={collapsed} subtitle="Advanced Healthcare Platform" />
    </div>
  )
}
