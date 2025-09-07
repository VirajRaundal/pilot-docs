'use client'

import Script from 'next/script'
import { useEffect, useState } from 'react'

interface ScriptLoadState {
  analytics: 'idle' | 'loading' | 'loaded' | 'error'
  monitoring: 'idle' | 'loading' | 'loaded' | 'error'
  support: 'idle' | 'loading' | 'loaded' | 'error'
}

export default function OptimizedScripts() {
  const [loadState, setLoadState] = useState<ScriptLoadState>({
    analytics: 'idle',
    monitoring: 'idle', 
    support: 'idle'
  })
  const [isInteracted, setIsInteracted] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  // Detect user interaction to load non-critical scripts
  useEffect(() => {
    const handleInteraction = () => {
      setIsInteracted(true)
    }

    const handleVisibilityChange = () => {
      setIsVisible(document.visibilityState === 'visible')
    }

    // Load scripts on first user interaction
    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('keydown', handleInteraction, { once: true })
    document.addEventListener('scroll', handleInteraction, { once: true })
    document.addEventListener('touchstart', handleInteraction, { once: true })
    
    // Visibility change detection
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    // Set initial visibility
    setIsVisible(document.visibilityState === 'visible')

    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
      document.removeEventListener('scroll', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  const updateLoadState = (script: keyof ScriptLoadState, state: ScriptLoadState[keyof ScriptLoadState]) => {
    setLoadState(prev => ({ ...prev, [script]: state }))
  }

  return (
    <>
      {/* External scripts disabled to prevent blocking errors */}
      {/* Analytics, monitoring, and chat scripts removed for stability */}

      {/* Performance monitoring initialization */}
      <Script
        id="performance-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Initialize performance monitoring
            if ('performance' in window) {
              // Mark critical milestones
              performance.mark('app-init-start');
              
              // Monitor long tasks
              if ('PerformanceObserver' in window) {
                const observer = new PerformanceObserver((list) => {
                  const entries = list.getEntries();
                  entries.forEach((entry) => {
                    if (entry.duration > 50) {
                      console.warn('Long task detected:', entry.duration + 'ms');
                    }
                  });
                });
                observer.observe({entryTypes: ['longtask']});
              }
            }
            
            // Network quality detection
            if ('connection' in navigator) {
              const connection = navigator.connection;
              if (connection.saveData || connection.effectiveType === '2g') {
                document.documentElement.classList.add('low-bandwidth');
              }
            }
          `,
        }}
      />

      {/* Preload critical resources based on user behavior */}
      <Script
        id="resource-preloader"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            // Smart preloading based on user behavior
            function preloadCriticalResources() {
              // Preload document upload component if user hovers over upload button
              const uploadBtn = document.querySelector('[data-upload-trigger]');
              if (uploadBtn) {
                uploadBtn.addEventListener('mouseenter', () => {
                  const link = document.createElement('link');
                  link.rel = 'modulepreload';
                  link.href = '/_next/static/chunks/document-upload.js';
                  document.head.appendChild(link);
                }, { once: true });
              }
              
              // Preload admin components for admin users
              if (document.querySelector('[data-user-role="admin"]')) {
                const adminLink = document.createElement('link');
                adminLink.rel = 'modulepreload';
                adminLink.href = '/_next/static/chunks/admin-dashboard.js';
                document.head.appendChild(adminLink);
              }
            }
            
            // Run after DOM is ready
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', preloadCriticalResources);
            } else {
              preloadCriticalResources();
            }
          `,
        }}
      />

      {/* Development-only scripts */}
      {process.env.NODE_ENV === 'development' && (
        <Script
          id="dev-tools"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              // Development performance helpers
              console.log('🚀 Performance monitoring active in development');
              
              // Expose performance metrics globally for debugging
              window.__performance__ = {
                getMetrics: () => ({
                  navigation: performance.getEntriesByType('navigation')[0],
                  paint: performance.getEntriesByType('paint'),
                  resources: performance.getEntriesByType('resource'),
                  marks: performance.getEntriesByType('mark'),
                  measures: performance.getEntriesByType('measure'),
                }),
                clearMetrics: () => {
                  performance.clearMarks();
                  performance.clearMeasures();
                  performance.clearResourceTimings();
                }
              };
              
              // Log Core Web Vitals in console
              import('web-vitals').then(webVitals => {
                webVitals.getCLS(console.log);
                webVitals.getFID(console.log);
                webVitals.getLCP(console.log);
              }).catch(() => {});
            `,
          }}
        />
      )}

      {/* Script loading status indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed bottom-4 left-4 z-50 text-xs bg-black/80 text-white p-2 rounded font-mono">
          <div>Analytics: {loadState.analytics}</div>
          <div>Monitoring: {loadState.monitoring}</div>
          <div>Support: {loadState.support}</div>
          <div>Interacted: {isInteracted ? '✓' : '✗'}</div>
          <div>Visible: {isVisible ? '✓' : '✗'}</div>
        </div>
      )}
    </>
  )
}

// Hook for manual script loading control
export function useScriptLoader() {
  const [loadedScripts, setLoadedScripts] = useState<Set<string>>(new Set())

  const loadScript = async (src: string, id?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (loadedScripts.has(src)) {
        resolve(true)
        return
      }

      const script = document.createElement('script')
      script.src = src
      if (id) script.id = id
      script.async = true

      script.onload = () => {
        setLoadedScripts(prev => new Set(prev).add(src))
        resolve(true)
      }

      script.onerror = () => {
        console.error('Failed to load script:', src)
        resolve(false)
      }

      document.head.appendChild(script)
    })
  }

  const isScriptLoaded = (src: string) => loadedScripts.has(src)

  return { loadScript, isScriptLoaded }
}