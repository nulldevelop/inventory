'use client'
import { toast as sonnerToast } from 'sonner'

export function showToast(message: string, type: 'ok' | 'err' | '') {
  if (type === 'ok') {
    sonnerToast.success(message)
  } else if (type === 'err') {
    sonnerToast.error(message)
  } else {
    sonnerToast(message)
  }
}

export default function Toast({
  message,
  type,
  show,
}: {
  message: string
  type: string
  show: boolean
}) {
  if (show && message) {
    if (type === 'ok') {
      sonnerToast.success(message)
    } else if (type === 'err') {
      sonnerToast.error(message)
    } else {
      sonnerToast(message)
    }
  }
  return null
}
