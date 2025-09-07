'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

interface VirtualListProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number
}

export default function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className = '',
  overscan = 5
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex)

  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Smooth scroll to index
  const scrollToIndex = useCallback((index: number) => {
    if (scrollElementRef.current) {
      const targetScrollTop = index * itemHeight
      scrollElementRef.current.scrollTop = targetScrollTop
    }
  }, [itemHeight])

  // Scroll to top
  const scrollToTop = useCallback(() => {
    scrollToIndex(0)
  }, [scrollToIndex])

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <div
        ref={scrollElementRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: totalHeight, position: 'relative' }}>
          <div
            style={{
              transform: `translateY(${offsetY}px)`,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          >
            {visibleItems.map((item, index) => {
              const actualIndex = startIndex + index
              return (
                <div
                  key={actualIndex}
                  style={{ 
                    height: itemHeight,
                    overflow: 'hidden'
                  }}
                >
                  {renderItem(item, actualIndex)}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Scroll to top button */}
      {scrollTop > containerHeight && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-4 right-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors z-10"
          aria-label="Scroll to top"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
          </svg>
        </button>
      )}

      {/* Loading indicator for large lists */}
      {items.length > 1000 && (
        <div className="absolute top-2 right-2 text-xs text-gray-500 bg-white px-2 py-1 rounded shadow">
          {startIndex + 1}-{Math.min(endIndex, items.length)} of {items.length}
        </div>
      )}
    </div>
  )
}

// Hook for calculating optimal item height
export function useOptimalItemHeight(
  containerRef: React.RefObject<HTMLElement>,
  defaultHeight: number = 120
) {
  const [itemHeight, setItemHeight] = useState(defaultHeight)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { height } = entry.contentRect
        // Adjust item height based on container size for responsive design
        if (height < 400) {
          setItemHeight(80) // Compact for mobile
        } else if (height < 600) {
          setItemHeight(100) // Medium for tablet
        } else {
          setItemHeight(defaultHeight) // Full for desktop
        }
      }
    })

    resizeObserver.observe(container)
    return () => resizeObserver.disconnect()
  }, [defaultHeight])

  return itemHeight
}