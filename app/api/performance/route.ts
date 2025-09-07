import { NextRequest, NextResponse } from 'next/server'

interface PerformanceData {
  metric: string
  data: Record<string, unknown>
  timestamp: number
  url: string
  userAgent: string
}

export async function POST(request: NextRequest) {
  try {
    const body: PerformanceData = await request.json()
    
    // Validate required fields
    if (!body.metric || !body.data || !body.timestamp) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Get client IP and location info
    const ip = request.headers.get('x-forwarded-for') || 
              request.headers.get('x-real-ip') ||
              'unknown'
    
    const country = request.headers.get('x-vercel-ip-country') || 'unknown'
    const region = request.headers.get('x-vercel-ip-region') || 'unknown'
    
    // Enrich performance data
    const enrichedData = {
      ...body,
      ip,
      country,
      region,
      receivedAt: Date.now(),
    }
    
    // Log performance issues (in production, send to monitoring service)
    if (process.env.NODE_ENV === 'production') {
      console.log('Performance metric:', JSON.stringify(enrichedData, null, 2))
      
      // Send to external monitoring service (e.g., DataDog, New Relic, etc.)
      // await sendToMonitoringService(enrichedData)
    } else {
      console.log('Performance metric (dev):', enrichedData)
    }
    
    // Store in database or send to analytics service
    await storePerformanceMetric(enrichedData)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing performance data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const timeframe = searchParams.get('timeframe') || '24h'
  
  try {
    // Return aggregated performance metrics
    const metrics = await getPerformanceMetrics(timeframe)
    
    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching performance metrics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function storePerformanceMetric(data: PerformanceData & { ip: string; country: string; region: string; receivedAt: number }) {
  // In a real implementation, you would:
  // 1. Store in a time-series database (InfluxDB, TimescaleDB)
  // 2. Send to analytics service (Google Analytics, Mixpanel)
  // 3. Send to monitoring service (DataDog, New Relic)
  
  // For now, we'll just log critical performance issues
  const { metric, data: metricData } = data
  
  // Define thresholds for different metrics
  const thresholds = {
    CLS: { poor: 0.25, needsImprovement: 0.1 },
    FID: { poor: 300, needsImprovement: 100 },
    LCP: { poor: 4000, needsImprovement: 2500 },
    TTFB: { poor: 600, needsImprovement: 200 },
  }
  
  if (thresholds[metric as keyof typeof thresholds]) {
    const threshold = thresholds[metric as keyof typeof thresholds]
    const value = typeof metricData === 'object' && metricData && 'value' in metricData 
      ? (metricData as { value: number }).value 
      : typeof metricData === 'number' 
        ? metricData 
        : 0
    
    if (value > threshold.poor) {
      console.warn(`🚨 Poor ${metric} detected:`, {
        value,
        threshold: threshold.poor,
        url: data.url,
        country: data.country,
      })
      
      // In production, trigger alert or notification
      // await sendAlert('poor-performance', { metric, value, url: data.url })
    }
  }
}

async function getPerformanceMetrics(timeframe: string) {
  // Mock data - in production, fetch from your monitoring database
  return {
    timeframe,
    metrics: {
      CLS: {
        p50: 0.05,
        p75: 0.1,
        p95: 0.2,
        samples: 1000,
      },
      FID: {
        p50: 50,
        p75: 80,
        p95: 150,
        samples: 800,
      },
      LCP: {
        p50: 1200,
        p75: 1800,
        p95: 3000,
        samples: 1000,
      },
      TTFB: {
        p50: 150,
        p75: 250,
        p95: 500,
        samples: 1000,
      },
    },
    trends: {
      CLS: 'improving',
      FID: 'stable', 
      LCP: 'degrading',
      TTFB: 'stable',
    },
    alerts: [
      {
        metric: 'LCP',
        severity: 'warning',
        message: 'LCP has increased by 15% in the last 24 hours',
        timestamp: Date.now() - 1000 * 60 * 30, // 30 mins ago
      },
    ],
  }
}