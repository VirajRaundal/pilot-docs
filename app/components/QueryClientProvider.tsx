'use client'

import { QueryClient, QueryClientProvider as TanstackQueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

interface QueryClientProviderProps {
  children: React.ReactNode
}

export default function QueryClientProvider({ children }: QueryClientProviderProps) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cache for 5 minutes
        staleTime: 1000 * 60 * 5,
        // Keep in cache for 10 minutes when unused
        gcTime: 1000 * 60 * 10,
        // Retry failed requests once
        retry: 1,
        // Refetch on window focus in production
        refetchOnWindowFocus: process.env.NODE_ENV === 'production',
      },
    },
  }))

  return (
    <TanstackQueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === 'development' && <ReactQueryDevtools initialIsOpen={false} />}
    </TanstackQueryClientProvider>
  )
}