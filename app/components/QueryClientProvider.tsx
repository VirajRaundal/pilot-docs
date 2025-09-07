'use client'

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect } from 'react'

interface QueryClientProviderProps {
  children: React.ReactNode
}

export default function QueryClientProvider({ children }: QueryClientProviderProps) {
  const [queryClient, setQueryClient] = useState<QueryClient | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    // Create QueryClient only on client-side to prevent SSR issues
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          // Cache for 5 minutes
          staleTime: 1000 * 60 * 5,
          // Keep in cache for 10 minutes when unused  
          gcTime: 1000 * 60 * 10,
          // Don't refetch on window focus to prevent errors
          refetchOnWindowFocus: false,
          // Enhanced error handling for production
          retry: (failureCount, error) => {
            // Don't retry on 4xx errors
            if (error && typeof error === 'object' && 'status' in error) {
              const status = (error as { status: number }).status
              if (status >= 400 && status < 500) return false
            }
            return failureCount < 2
          },
        },
        mutations: {
          // Add global error handling for mutations
          retry: false,
        },
      },
    })
    
    setQueryClient(client)
    setMounted(true)
  }, [])

  // Show loading state until QueryClient is ready
  if (!mounted || !queryClient) {
    return (
      <div suppressHydrationWarning>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
    </TanstackQueryClientProvider>
  )
}