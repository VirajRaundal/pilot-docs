import { createClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

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
    // Connection timeout optimizations
    fetch: (url, options = {}) => {
      const controller = new AbortController()
      setTimeout(() => controller.abort(), 15000)
      return fetch(url, {
        ...options,
        // Shorter timeout for better UX
        signal: controller.signal, 
      })
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

