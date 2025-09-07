'use client'

import Image from 'next/image'
import { useState } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onError?: () => void
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  
  // Generate a basic blur data URL if none provided
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setHasError(true)
    onError?.()
  }

  // Error fallback component
  if (hasError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 ${className}`}
        style={fill ? {} : { width, height }}
      >
        <div className="text-center text-gray-500">
          <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs">Image failed to load</p>
        </div>
      </div>
    )
  }

  const imageProps = {
    src,
    alt,
    quality,
    priority,
    placeholder,
    blurDataURL: blurDataURL || defaultBlurDataURL,
    onLoad: handleLoad,
    onError: handleError,
    className: `${className} ${isLoading ? 'animate-pulse bg-gray-200' : ''}`,
  }

  // Handle responsive images with sizes
  if (fill) {
    return (
      <Image
        {...imageProps}
        fill
        sizes={sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'}
      />
    )
  }

  // Handle fixed dimensions
  if (width && height) {
    return (
      <Image
        {...imageProps}
        width={width}
        height={height}
        sizes={sizes}
      />
    )
  }

  // Fallback with responsive behavior
  return (
    <Image
      {...imageProps}
      width={width || 400}
      height={height || 300}
      sizes={sizes || '(max-width: 768px) 100vw, 400px'}
    />
  )
}

// Specialized components for common use cases

// Document thumbnail component
export function DocumentThumbnail({ 
  src, 
  alt, 
  className = '' 
}: { 
  src: string
  alt: string 
  className?: string 
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={80}
      height={80}
      className={`rounded-lg object-cover ${className}`}
      sizes="80px"
      quality={75}
    />
  )
}

// Profile avatar component
export function ProfileAvatar({ 
  src, 
  alt, 
  size = 40,
  className = '' 
}: { 
  src: string
  alt: string
  size?: number
  className?: string 
}) {
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      sizes={`${size}px`}
      quality={85}
    />
  )
}

// Hero image component with responsive behavior
export function HeroImage({ 
  src, 
  alt, 
  className = '' 
}: { 
  src: string
  alt: string 
  className?: string 
}) {
  return (
    <div className={`relative w-full h-64 md:h-96 ${className}`}>
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        priority
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
        quality={90}
      />
    </div>
  )
}

// Gallery image component
export function GalleryImage({ 
  src, 
  alt, 
  onClick,
  className = '' 
}: { 
  src: string
  alt: string
  onClick?: () => void
  className?: string 
}) {
  return (
    <div 
      className={`relative aspect-square cursor-pointer hover:scale-105 transition-transform ${className}`}
      onClick={onClick}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        fill
        className="object-cover rounded-lg"
        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        quality={80}
      />
    </div>
  )
}