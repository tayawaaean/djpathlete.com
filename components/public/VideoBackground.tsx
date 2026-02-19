"use client"

import { useState, useEffect, useRef } from "react"

interface VideoBackgroundProps {
  videoId: string
  className?: string
}

export function VideoBackground({ videoId, className = "" }: VideoBackgroundProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Defer iframe load until after initial paint for faster page load
  useEffect(() => {
    const hasIdleCallback = typeof requestIdleCallback === "function"
    const timer = hasIdleCallback
      ? requestIdleCallback(() => setShouldLoad(true))
      : window.setTimeout(() => setShouldLoad(true), 100)

    return () => {
      if (hasIdleCallback) {
        cancelIdleCallback(timer as number)
      } else {
        window.clearTimeout(timer as number)
      }
    }
  }, [])

  return (
    <div ref={containerRef} className={`absolute inset-0 pointer-events-none ${className}`}>
      {shouldLoad && (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&disablekb=1&iv_load_policy=3&cc_load_policy=0&fs=0`}
          title="Background Video"
          allow="autoplay; encrypted-media"
          onLoad={() => setIsLoaded(true)}
          className={`absolute top-[60%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] min-w-full min-h-full transition-opacity duration-1000 ${
            isLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{ border: 0 }}
          loading="eager"
          tabIndex={-1}
        />
      )}
    </div>
  )
}
