'use client'

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface ConfirmModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'default' | 'danger' | 'warning'
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
}: ConfirmModalProps) {
  const [loading, setLoading] = React.useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      await onConfirm()
      onClose()
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const colorStyles = {
    danger: {
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
      icon: 'text-red-600 bg-red-50 dark:bg-red-950/20 dark:text-red-400',
    },
    warning: {
      button: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-500 text-white',
      icon: 'text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400',
    },
    default: {
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
      icon: 'text-blue-600 bg-blue-50 dark:bg-blue-950/20 dark:text-blue-400',
    },
  }

  const styles = colorStyles[variant]

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md p-6 overflow-hidden rounded-xl border border-slate-200 shadow-xl bg-white animate-in zoom-in-95 duration-200">
        <DialogHeader className="flex flex-row items-start gap-4 space-y-0 text-left">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0 ${styles.icon}`}>
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div className="flex-1 space-y-1">
            <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">{title}</DialogTitle>
            <DialogDescription className="text-sm text-slate-500 leading-relaxed">{description}</DialogDescription>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            disabled={loading}
            onClick={handleConfirm}
            className={`w-full sm:w-auto font-medium ${styles.button}`}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
