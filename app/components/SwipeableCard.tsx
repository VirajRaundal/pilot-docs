'use client'

import { useState, useRef, useEffect } from 'react'

interface SwipeableCardProps {
  children: React.ReactNode
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  className?: string
  swipeThreshold?: number
}

export default function SwipeableCard({
  children,
  onSwipeLeft,
  onSwipeRight,
  className = '',
  swipeThreshold = 100
}: SwipeableCardProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [translateX, setTranslateX] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleStart = (clientX: number) => {
    setIsDragging(true)
    setStartX(clientX)
    setCurrentX(clientX)
  }

  const handleMove = (clientX: number) => {
    if (!isDragging) return
    
    setCurrentX(clientX)
    const deltaX = clientX - startX
    setTranslateX(deltaX)
  }

  const handleEnd = () => {
    if (!isDragging) return
    
    setIsDragging(false)
    const deltaX = currentX - startX
    
    // Check if swipe threshold is met
    if (Math.abs(deltaX) > swipeThreshold) {
      if (deltaX > 0 && onSwipeRight) {
        onSwipeRight()
      } else if (deltaX < 0 && onSwipeLeft) {
        onSwipeLeft()
      }
    }
    
    // Reset position
    setTranslateX(0)
    setStartX(0)
    setCurrentX(0)
  }

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    handleMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  // Add global mouse events when dragging
  useEffect(() => {
    if (isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        handleMove(e.clientX)
      }
      
      const handleGlobalMouseUp = () => {
        handleEnd()
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [isDragging, startX, currentX])

  const cardStyle = {
    transform: `translateX(${translateX}px)`,
    transition: isDragging ? 'none' : 'transform 0.3s ease-out',
  }

  const getSwipeIndicator = () => {
    if (!isDragging || Math.abs(translateX) < 50) return null
    
    if (translateX > 0) {
      return (
        <div className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-green-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
          Swipe Right Action
        </div>
      )
    } else {
      return (
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-red-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
          Swipe Left Action
        </div>
      )
    }
  }

  return (
    <div className="relative overflow-hidden">
      {getSwipeIndicator()}
      <div
        ref={cardRef}
        className={`swipeable-card ${isDragging ? 'swiping' : ''} ${className}`}
        style={cardStyle}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </div>
    </div>
  )
}