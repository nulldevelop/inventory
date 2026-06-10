'use client'
import { useEffect, useRef } from 'react'

export function useAutoScroll(enabled: boolean = true, speed: number = 1) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return

    const container = containerRef.current
    if (!container) return

    let animationFrameId: number
    let lastTime = performance.now()
    let scrollPos = container.scrollTop
    let isResetting = false

    const scroll = (currentTime: number) => {
      const deltaTime = currentTime - lastTime
      lastTime = currentTime

      if (container.scrollHeight - container.clientHeight <= 1) {
        animationFrameId = requestAnimationFrame(scroll)
        return
      }

      const maxScroll = container.scrollHeight - container.clientHeight

      if (scrollPos >= maxScroll) {
        if (!isResetting) {
          isResetting = true
          setTimeout(() => {
            scrollPos = 0
            isResetting = false
          }, 500)
        }
      } else {
        scrollPos += (speed * deltaTime) / 16
        container.scrollTop = scrollPos
      }

      animationFrameId = requestAnimationFrame(scroll)
    }

    animationFrameId = requestAnimationFrame(scroll)

    return () => cancelAnimationFrame(animationFrameId)
  }, [enabled, speed])

  return containerRef
}
