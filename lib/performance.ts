// Performance monitoring and web vitals tracking
import React from 'react'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
    dataLayer?: Record<string, unknown>[]
  }
}

// Web Vitals interfaces
interface Metric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  entries: PerformanceEntry[]
}

interface WebVitalsData {
  CLS?: number
  FCP?: number
  FID?: number
  LCP?: number
  TTFB?: number
}

// Performance monitoring class
export class PerformanceMonitor {
  private metrics: WebVitalsData = {}
  private isProduction = process.env.NODE_ENV === 'production'
  
  constructor() {
    if (typeof window !== 'undefined' && this.isProduction) {
      this.initializeWebVitals()
      this.initializeNavigationTiming()
      this.initializeResourceTiming()
    }
  }

  // Initialize Web Vitals tracking
  private async initializeWebVitals() {
    try {
      const webVitals = await import('web-vitals')
      
      // Core Web Vitals
      webVitals.getCLS(this.onCLS.bind(this))
      webVitals.getFID(this.onFID.bind(this))
      webVitals.getLCP(this.onLCP.bind(this))
      
      // Additional metrics
      webVitals.getFCP(this.onFCP.bind(this))
      webVitals.getTTFB(this.onTTFB.bind(this))
    } catch (error) {
      console.warn('Web Vitals not available:', error)
    }
  }

  // CLS (Cumulative Layout Shift) handler
  private onCLS(metric: Metric) {
    this.metrics.CLS = metric.value
    this.sendToAnalytics('CLS', metric)
    
    // Log poor CLS scores for debugging
    if (metric.rating === 'poor') {
      console.warn('Poor CLS detected:', metric.value, metric.entries)
      this.reportPerformanceIssue('CLS', metric.value, metric.entries)
    }
  }

  // FID (First Input Delay) handler
  private onFID(metric: Metric) {
    this.metrics.FID = metric.value
    this.sendToAnalytics('FID', metric)
    
    if (metric.rating === 'poor') {
      console.warn('Poor FID detected:', metric.value)
      this.reportPerformanceIssue('FID', metric.value, metric.entries)
    }
  }

  // LCP (Largest Contentful Paint) handler
  private onLCP(metric: Metric) {
    this.metrics.LCP = metric.value
    this.sendToAnalytics('LCP', metric)
    
    if (metric.rating === 'poor') {
      console.warn('Poor LCP detected:', metric.value)
      this.reportPerformanceIssue('LCP', metric.value, metric.entries)
    }
  }

  // FCP (First Contentful Paint) handler
  private onFCP(metric: Metric) {
    this.metrics.FCP = metric.value
    this.sendToAnalytics('FCP', metric)
  }

  // TTFB (Time to First Byte) handler
  private onTTFB(metric: Metric) {
    this.metrics.TTFB = metric.value
    this.sendToAnalytics('TTFB', metric)
    
    if (metric.value > 600) { // TTFB > 600ms is concerning
      console.warn('High TTFB detected:', metric.value)
      this.reportPerformanceIssue('TTFB', metric.value, metric.entries)
    }
  }

  // Navigation timing monitoring
  private initializeNavigationTiming() {
    if ('performance' in window && 'navigation' in performance) {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      
      const metrics = {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        connection: navigation.connectEnd - navigation.connectStart,
        tls: navigation.connectEnd - navigation.secureConnectionStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        dom: navigation.domContentLoadedEventEnd - navigation.responseEnd,
        load: navigation.loadEventEnd - navigation.loadEventStart,
      }
      
      // Report slow metrics
      Object.entries(metrics).forEach(([key, value]) => {
        if (value > 500) { // > 500ms
          console.warn(`Slow ${key} timing:`, value)
        }
      })
      
      this.sendToAnalytics('NavigationTiming', metrics)
    }
  }

  // Resource timing monitoring
  private initializeResourceTiming() {
    if ('performance' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        
        entries.forEach((entry) => {
          if (entry.duration > 1000) { // Resources taking > 1s
            console.warn('Slow resource detected:', {
              name: entry.name,
              duration: entry.duration,
              size: (entry as PerformanceEntry & { transferSize?: number }).transferSize || 0
            })
            
            this.reportPerformanceIssue('SlowResource', entry.duration, [entry])
          }
        })
      })
      
      observer.observe({ entryTypes: ['resource'] })
    }
  }

  // Send metrics to analytics
  private sendToAnalytics(metricName: string, data: Record<string, unknown> | Metric) {
    // Google Analytics 4
    if (window.gtag) {
      window.gtag('event', metricName, {
        custom_parameter_1: (data as Metric).value || data,
        custom_parameter_2: (data as Metric).rating || 'unknown',
      })
    }
    
    // Vercel Speed Insights (automatically handled by @vercel/speed-insights)
    
    // Custom analytics endpoint (optional)
    if (this.isProduction) {
      this.sendToCustomEndpoint(metricName, data)
    }
  }

  // Send to custom monitoring endpoint
  private async sendToCustomEndpoint(metricName: string, data: Record<string, unknown> | Metric) {
    try {
      await fetch('/api/performance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          metric: metricName,
          data,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
        }),
      })
    } catch {
      // Silently fail - don't impact user experience
    }
  }

  // Report performance issues for debugging
  private reportPerformanceIssue(type: string, value: number, entries: PerformanceEntry[]) {
    const report = {
      type,
      value,
      timestamp: Date.now(),
      url: window.location.href,
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
      connection: this.getConnectionInfo(),
      entries: entries.map(entry => ({
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
      })),
    }
    
    // Send to error tracking service (e.g., Sentry)
    console.info('Performance issue report:', report)
    
    // Store locally for debugging
    if (typeof localStorage !== 'undefined') {
      const existing = JSON.parse(localStorage.getItem('performance-issues') || '[]')
      existing.push(report)
      
      // Keep only last 10 reports
      if (existing.length > 10) {
        existing.shift()
      }
      
      localStorage.setItem('performance-issues', JSON.stringify(existing))
    }
  }

  // Get network connection information
  private getConnectionInfo() {
    if ('connection' in navigator) {
      const conn = (navigator as unknown as { connection: { effectiveType: string; downlink: number; rtt: number; saveData: boolean } }).connection
      return {
        effectiveType: conn.effectiveType,
        downlink: conn.downlink,
        rtt: conn.rtt,
        saveData: conn.saveData,
      }
    }
    return null
  }

  // Get current metrics
  public getMetrics(): WebVitalsData {
    return { ...this.metrics }
  }

  // Manual performance marking
  public mark(name: string) {
    if ('performance' in window) {
      performance.mark(name)
    }
  }

  // Manual performance measurement
  public measure(name: string, startMark: string, endMark?: string) {
    if ('performance' in window) {
      try {
        const measurement = performance.measure(name, startMark, endMark)
        console.log(`${name}: ${measurement.duration.toFixed(2)}ms`)
        return measurement.duration
      } catch (error) {
        console.warn('Performance measurement failed:', error)
      }
    }
    return 0
  }

  // Track user interactions
  public trackInteraction(name: string, startTime?: number) {
    const duration = startTime ? Date.now() - startTime : 0
    
    this.sendToAnalytics('Interaction', {
      name,
      duration,
      timestamp: Date.now(),
    })
  }
}

// Initialize global performance monitor
export const performanceMonitor = new PerformanceMonitor()

// Utility functions
export function measureAsync<T>(
  name: string,
  asyncFn: () => Promise<T>
): Promise<T> {
  return new Promise((resolve, reject) => {
    performanceMonitor.mark(`${name}-start`)
    
    asyncFn()
      .then((result) => {
        performanceMonitor.mark(`${name}-end`)
        const duration = performanceMonitor.measure(name, `${name}-start`, `${name}-end`)
        
        // Track long operations
        if (duration > 1000) {
          console.warn(`Long async operation: ${name} took ${duration.toFixed(2)}ms`)
        }
        
        resolve(result)
      })
      .catch((error) => {
        console.error(`Async operation failed: ${name}`, error)
        reject(error)
      })
  })
}

// HOC for measuring component render times
export function withPerformanceTracking<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  return function WrappedComponent(props: P) {
    React.useEffect(() => {
      performanceMonitor.mark(`${componentName}-mount-start`)
      
      return () => {
        performanceMonitor.mark(`${componentName}-mount-end`)
        performanceMonitor.measure(
          `${componentName}-mount`,
          `${componentName}-mount-start`,
          `${componentName}-mount-end`
        )
      }
    }, [])
    
    return React.createElement(Component, props)
  }
}

// React hook for performance tracking
export function usePerformanceTracking(componentName: string) {
  React.useEffect(() => {
    performanceMonitor.mark(`${componentName}-render-start`)
    
    return () => {
      performanceMonitor.mark(`${componentName}-render-end`)
      
      const duration = performanceMonitor.measure(
        `${componentName}-render`,
        `${componentName}-render-start`,
        `${componentName}-render-end`
      )
      
      // Track slow renders
      if (duration > 100) {
        console.warn(`Slow component render: ${componentName} took ${duration.toFixed(2)}ms`)
      }
    }
  })
}

export default performanceMonitor