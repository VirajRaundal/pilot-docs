import type { Metadata } from 'next'
import QueryClientProvider from './components/QueryClientProvider'
import ServiceWorkerInit from './components/ServiceWorkerInit'
import OptimizedScripts from './components/OptimizedScripts'
import './globals.css'

// Speed Insights removed to prevent console errors

export const metadata: Metadata = {
  title: 'Pilot Management',
  description: 'Pilot Document Management System',
  keywords: 'pilot, aviation, document management, compliance',
  authors: [{ name: 'Pilot Management Team' }],
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
  },
}

export const viewport = 'width=device-width, initial-scale=1, maximum-scale=5'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* Permissions Policy */}
        <meta httpEquiv="Permissions-Policy" content="browsing-topics=()" />
        
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
          <ServiceWorkerInit />
          <OptimizedScripts />
        </QueryClientProvider>
      </body>
    </html>
  )
}