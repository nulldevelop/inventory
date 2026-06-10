'use client'

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { authClient } from '@/lib/client'

type AuthSession = {
  user: {
    id: string
    name: string
    email: string
    emailVerified: boolean
    image?: string
    createdAt: Date
    updatedAt: Date
  }
  session: {
    expiresAt: Date
    token: string
    createdAt: Date
    updatedAt: Date
    ipAddress?: string
    userAgent?: string
  }
} | null

type SessionContextType = {
  isPending: boolean
  data: AuthSession
}

const SessionContext = createContext<SessionContextType | null>(null)

export function SessionProvider({ children }: { children: ReactNode }) {
  const [isPending, setIsPending] = useState(true)
  const [data, setData] = useState<AuthSession>(null)
  const { isPending: betterAuthIsPending, data: betterAuthData } =
    authClient.useSession()

  useEffect(() => {
    setIsPending(betterAuthIsPending)
    setData(betterAuthData as AuthSession)
  }, [betterAuthIsPending, betterAuthData])

  const _onUpdate = useCallback((pending: boolean, nextData: AuthSession) => {
    setIsPending(pending)
    setData(nextData)
  }, [])

  return (
    <SessionContext.Provider value={{ isPending, data }}>
      {children}
    </SessionContext.Provider>
  )
}

export function useSession() {
  const context = useContext(SessionContext)
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider')
  }
  return context
}
