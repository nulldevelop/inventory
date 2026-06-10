'use client'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

interface UseVirtualScrollOptions {
  itemCount: number
  itemHeight: number
  overscan?: number
}

interface VirtualItem {
  index: number
  offsetTop: number
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  overscan = 10,
}: UseVirtualScrollOptions) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const onScroll = useCallback(() => {
    const el = containerRef.current
    if (el) setScrollTop(el.scrollTop)
  }, [])

  const totalHeight = itemCount * itemHeight

  const visibleItems = useMemo(() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      itemCount - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan,
    )

    const items: VirtualItem[] = []
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({ index: i, offsetTop: i * itemHeight })
    }
    return items
  }, [scrollTop, containerHeight, itemCount, itemHeight, overscan])

  return {
    containerRef,
    onScroll,
    totalHeight,
    visibleItems,
  }
}
