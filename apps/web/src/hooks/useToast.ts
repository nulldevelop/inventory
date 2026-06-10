'use client'
import { useCallback, useRef, useState } from 'react'

export function useToast() {
  const [toast, setToast] = useState({ message: '', type: '', show: false })
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((message: string, type = '') => {
    if (timerRef.current) clearTimeout(timerRef.current)
    setToast({ message, type, show: true })
    timerRef.current = setTimeout(() => {
      setToast((t) => ({ ...t, show: false }))
    }, 4000)
  }, [])

  return { toast, showToast }
}
