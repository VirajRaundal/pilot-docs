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
      {/* Google Analytics - Load after interaction for better performance */}
      {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_GA_ID && isInteracted && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
            strategy="afterInteractive"
            onLoad={() => updateLoadState('analytics', 'loaded')}
            onError={() => updateLoadState('analytics', 'error')}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}', {
                  page_title: document.title,
                  page_location: window.location.href,
                  custom_map: {
                    'custom_parameter_1': 'metric_value',
                    'custom_parameter_2': 'metric_rating'
                  }
                });
              `,
            }}
          />
        </>
      )}

      {/* Error Monitoring (e.g., Sentry) - Load when needed */}
      {process.env.NODE_ENV === 'production' && process.env.NEXT_PUBLIC_SENTRY_DSN && isInteracted && (
        <Script
          src="https://browser.sentry-cdn.com/7.0.0/bundle.min.js"
          strategy="lazyOnload"
          onLoad={() => {
            updateLoadState('monitoring', 'loaded')
            // Initialize Sentry
            ;(window as { Sentry?: { init: (config: Record<string, unknown>) => void } }).Sentry?.init({
              dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
              tracesSampleRate: 0.1,
              environment: process.env.NODE_ENV,
              beforeSend: (event: Record<string, unknown>) => {
                // Filter out non-critical errors
                if ((event as { exception?: { values?: { value?: string }[] } }).exception) {
                  const error = (event as { exception: { values: { value?: string }[] } }).exception.values[0]
                  if (error?.value?.includes('Non-Error promise rejection captured')) {
                    return null
                  }
                }
                return event
              }
            })
          }}
          onError={() => updateLoadState('monitoring', 'error')}
        />
      )}

      {/* Customer Support Chat (e.g., Intercom, Zendesk) - Load only when visible and after delay */}
      {process.env.NEXT_PUBLIC_INTERCOM_APP_ID && isInteracted && isVisible && (
        <Script
          id="intercom-script"
          strategy="lazyOnload"
          dangerouslySetInnerHTML={{
            __html: `
              (function(){
                var w=window;var ic=w.Intercom;
                if(typeof ic==="function"){
                  ic('reattach_activator');ic('update',w.intercomSettings);
                }else{
                  var d=document;var i=function(){i.c(arguments);};
                  i.q=[];i.c=function(args){i.q.push(args);};w.Intercom=i;
                  var l=function(){
                    var s=d.createElement('script');
                    s.type='text/javascript';s.async=true;
                    s.src='https://widget.intercom.io/widget/${process.env.NEXT_PUBLIC_INTERCOM_APP_ID}';
                    var x=d.getElementsByTagName('script')[0];
                    x.parentNode.insertBefore(s,x);
                  };
                  if(w.attachEvent){w.attachEvent('onload',l);}
                  else{w.addEventListener('load',l,false);}
                }
              })();
              
              window.Intercom('boot', {
                app_id: '${process.env.NEXT_PUBLIC_INTERCOM_APP_ID}',
                hide_default_launcher: true
              });
            `,
          }}
          onLoad={() => updateLoadState('support', 'loaded')}
          onError={() => updateLoadState('support', 'error')}
        />
      )}

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