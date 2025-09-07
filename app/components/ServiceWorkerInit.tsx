'use client'

import { useEffect } from 'react'
import { registerServiceWorker } from '../../lib/serviceWorker'

export default function ServiceWorkerInit() {
  useEffect(() => {
    if (process.env.NODE_ENV === 'production') {
      registerServiceWorker()
    }
  }, [])

  return null
}