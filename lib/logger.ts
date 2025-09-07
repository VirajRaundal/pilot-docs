// Production-safe logging utility
export const logger = {
  // Only log in development
  dev: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(message, ...args)
    }
  },
  
  // Only log warnings in development
  warn: (message: string, ...args: unknown[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(message, ...args)
    }
  },
  
  // Silent error logging - no sensitive data to console
  error: (message: string, error?: unknown) => {
    // In production, you could send this to an error reporting service
    // like Sentry, LogRocket, etc. without exposing to console
    if (process.env.NODE_ENV === 'development') {
      console.error(message, error)
    }
  }
}