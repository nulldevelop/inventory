'use client'

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from 'lucide-react'
import { useTheme } from 'next-themes'
import { Toaster as Sonner, type ToasterProps } from 'sonner'

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = 'system' } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps['theme']}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
          '--success-bg':
            'color-mix(in oklab, var(--status-online) 12%, var(--popover))',
          '--success-text': 'var(--status-online)',
          '--success-border':
            'color-mix(in oklab, var(--status-online) 30%, transparent)',
          '--error-bg':
            'color-mix(in oklab, var(--destructive) 12%, var(--popover))',
          '--error-text': 'var(--destructive)',
          '--error-border':
            'color-mix(in oklab, var(--destructive) 30%, transparent)',
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: 'cn-toast shadow-lg backdrop-blur-xl border-border',
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
