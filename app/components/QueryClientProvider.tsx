'use client'

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

interface QueryClientProviderProps {
  children: React.ReactNode
}

// Create a stable QueryClient instance
const createQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      // Cache for 5 minutes
      staleTime: 1000 * 60 * 5,
      // Keep in cache for 10 minutes when unused
      gcTime: 1000 * 60 * 10,
      // Retry failed requests once
      retry: 1,
      // Don't refetch on window focus to prevent errors
      refetchOnWindowFocus: false,
    },
  },
})

export default function QueryClientProvider({ children }: QueryClientProviderProps) {
  const [queryClient] = useState(createQueryClient)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to prevent hydration mismatch
  if (!mounted) {
    return <div suppressHydrationWarning>{children}</div>
  }

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  )
}