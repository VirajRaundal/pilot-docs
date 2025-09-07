/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  // Basic optimizations only
  experimental: {
    optimizePackageImports: [
      '@heroicons/react',
      'date-fns',
      'react-hot-toast',
      '@supabase/supabase-js'
    ]
  },
  
  // Compression
  compress: true,
  
  // Basic image optimization
  images: {
    formats: ['image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      }
    ]
  }
}

module.exports = withBundleAnalyzer(nextConfig)