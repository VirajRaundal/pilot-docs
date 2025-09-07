import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Removed debug logs for security

// Enhanced Supabase client with performance optimizations
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'public',
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    headers: {
      'X-Client-Info': 'pilot-management-app',
      'X-Client-Version': '1.0.0',
    },
    // Enhanced fetch with better error handling
    fetch: async (url, options = {}) => {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 30000) // Increased to 30s
      
      try {
        const response = await fetch(url, {
          ...options,
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        return response
      } catch (error) {
        clearTimeout(timeoutId)
        // Handle different error types
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            throw new Error('Request timeout - please check your connection')
          }
          if (error.message.includes('Failed to fetch')) {
            throw new Error('Network error - please check your internet connection')
          }
        }
        throw error
      }
    }
  },
  // Realtime optimizations
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
    timeout: 20000,
  },
})

