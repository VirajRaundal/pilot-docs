import type { Metadata } from 'next'
import { SpeedInsights } from '@vercel/speed-insights/next'
import QueryClientProvider from './components/QueryClientProvider'
import ServiceWorkerInit from './components/ServiceWorkerInit'
import OptimizedScripts from './components/OptimizedScripts'
import './globals.css'

export const metadata: Metadata = {
  title: 'Pilot Management',
  description: 'Pilot Document Management System',
  keywords: 'pilot, aviation, document management, compliance',
  authors: [{ name: 'Pilot Management Team' }],
  viewport: 'width=device-width, initial-scale=1, maximum-scale=5',
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Preconnect to external domains for better performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        
        {/* Resource hints for critical assets */}
        
        {/* Critical CSS inline (if any) */}
        <style dangerouslySetInnerHTML={{
          __html: `
            /* Critical above-the-fold styles */
            .loading-spinner { animation: spin 1s linear infinite; }
            @keyframes spin { to { transform: rotate(360deg); } }
            .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
          `
        }} />
      </head>
      <body className="font-sans antialiased">
        <QueryClientProvider>
          {children}
          <SpeedInsights />
          <ServiceWorkerInit />
          <OptimizedScripts />
        </QueryClientProvider>
      </body>
    </html>
  )
}