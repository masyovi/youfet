'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX, Play, SkipForward, Loader2, AlertCircle } from 'lucide-react'

/**
 * ExoClick In-Stream (VAST) Pre-Roll Ad.
 *
 * Plays a VAST pre-roll video ad BEFORE the main video content (LuluStream
 * iframe embed). Flow:
 *
 *   1. Fetch parsed VAST data from /api/vast (server resolves the wrapper).
 *   2. If no ad available → call onComplete() immediately (graceful fallback).
 *   3. Play the ad media file in a muted <video> (autoplay policy compliant).
 *   4. Fire impression + quartile tracking pixels from the browser.
 *   5. Show "Skip Ad" button after skipOffset seconds (default 5s).
 *   6. On ad end / skip / error → call onComplete() to reveal the real video.
 */

interface VastData {
  ok: boolean
  mediaUrl?: string
  mimeType?: string
  duration?: number
  skipOffset?: number
  clickThrough?: string | null
  clickTracking?: string[]
  impressions: string[]
  trackingEvents: Record<string, string[]>
  error?: string
}

function firePixels(urls: string[] | undefined) {
  if (!urls || !urls.length) return
  for (const url of urls) {
    try {
      const img = new Image()
      img.src = url
    } catch {
      /* noop */
    }
  }
}

function formatRemaining(seconds: number): string {
  const s = Math.max(0, Math.ceil(seconds))
  const m = Math.floor(s / 60)
  const r = s % 60
  return `${m}:${r.toString().padStart(2, '0')}`
}

export function PrerollAd({ onComplete }: { onComplete: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const dataRef = useRef<VastData | null>(null)
  const firedRef = useRef<Set<string>>(new Set())
  const completedRef = useRef(false)

  const [phase, setPhase] = useState<'loading' | 'playing' | 'done'>('loading')
  const [canSkip, setCanSkip] = useState(false)
  const [skipIn, setSkipIn] = useState<number | null>(null)
  const [remaining, setRemaining] = useState(0)
  const [muted, setMuted] = useState(true)
  const [needsClick, setNeedsClick] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const finish = useCallback(() => {
    if (completedRef.current) return
    completedRef.current = true
    setPhase('done')
    // Defer onComplete to next tick so React can unmount cleanly.
    setTimeout(onComplete, 0)
  }, [onComplete])

  const fireTrackingEvent = useCallback((event: string) => {
    if (firedRef.current.has(event)) return
    firedRef.current.add(event)
    const urls = dataRef.current?.trackingEvents?.[event]
    firePixels(urls)
  }, [])

  // Parse progress event offsets from trackingEvents keys.
  // Keys look like "progress-10" (10s) or "progress-00:00:10.000" (HH:MM:SS).
  function parseProgressOffsets(events: Record<string, string[]>): { key: string; time: number }[] {
    const out: { key: string; time: number }[] = []
    for (const key of Object.keys(events)) {
      if (!key.startsWith('progress-')) continue
      const raw = key.slice('progress-'.length)
      let t: number | null = null
      if (/^\d+(\.\d+)?$/.test(raw)) {
        t = parseFloat(raw)
      } else if (raw.includes(':')) {
        const parts = raw.split(':').map(Number)
        if (parts.length === 3) t = parts[0] * 3600 + parts[1] * 60 + parts[2]
        else if (parts.length === 2) t = parts[0] * 60 + parts[1]
      }
      if (t !== null && !Number.isNaN(t)) out.push({ key, time: t })
    }
    return out.sort((a, b) => a.time - b.time)
  }

  // Fetch VAST data on mount.
  // The <video> element is always mounted so the ref is available here.
  useEffect(() => {
    let cancelled = false

    fetch('/api/vast')
      .then((r) => r.json())
      .then((data: VastData) => {
        if (cancelled || completedRef.current) return
        dataRef.current = data

        if (!data.ok || !data.mediaUrl) {
          // No ad available — skip straight to the video.
          finish()
          return
        }

        const video = videoRef.current
        if (!video) {
          finish()
          return
        }

        video.muted = true
        setMuted(true)
        video.src = data.mediaUrl
        video.load()

        const playPromise = video.play()
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(() => {
            // Autoplay blocked — ask user to click to start.
            if (cancelled || completedRef.current) return
            setNeedsClick(true)
          })
        }

        // Fire impression + start immediately on ad render.
        firePixels(data.impressions)
        fireTrackingEvent('start')
      })
      .catch(() => {
        if (!cancelled) finish()
      })

    return () => {
      cancelled = true
    }
  }, [finish, fireTrackingEvent])

  // When the ad video actually starts playing, switch to 'playing' phase.
  const handlePlaying = () => {
    setPhase('playing')
  }

  const handleTimeUpdate = () => {
    const video = videoRef.current
    const data = dataRef.current
    if (!video || !data || completedRef.current) return

    const t = video.currentTime
    const dur = video.duration || data.duration || 0

    // Skip-button countdown.
    const skipOff = typeof data.skipOffset === 'number' ? data.skipOffset : 5
    if (t >= skipOff) {
      if (!canSkip) setCanSkip(true)
      if (skipIn !== null) setSkipIn(null)
    } else if (skipIn !== Math.ceil(skipOff - t)) {
      setSkipIn(Math.ceil(skipOff - t))
    }

    // Remaining time display.
    if (dur > 0) setRemaining(Math.max(0, dur - t))

    // Quartile tracking (standard VAST events).
    if (dur > 0) {
      const pct = t / dur
      if (pct >= 0.25) fireTrackingEvent('firstQuartile')
      if (pct >= 0.5) fireTrackingEvent('midpoint')
      if (pct >= 0.75) fireTrackingEvent('thirdQuartile')
    }

    // Progress tracking (e.g. progress-10 → fire at 10s).
    const progressOffsets = parseProgressOffsets(data.trackingEvents || {})
    for (const { key, time } of progressOffsets) {
      if (t >= time) fireTrackingEvent(key)
    }
  }

  const handleEnded = () => {
    fireTrackingEvent('complete')
    finish()
  }

  const handleError = () => {
    fireTrackingEvent('error')
    finish()
  }

  const handleSkip = () => {
    fireTrackingEvent('skip')
    finish()
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return
    const next = !muted
    video.muted = next
    setMuted(next)
  }

  const handleManualPlay = () => {
    const video = videoRef.current
    if (!video) return
    video.muted = true
    setMuted(true)
    video.play().catch(() => {})
    setNeedsClick(false)
  }

  const handleVideoClick = () => {
    const data = dataRef.current
    if (!data) return
    // Fire click tracking, open click-through in new tab.
    firePixels(data.clickTracking)
    if (data.clickThrough) {
      try {
        window.open(data.clickThrough, '_blank', 'noopener,noreferrer')
      } catch {
        /* noop */
      }
    }
  }

  // Don't render anything once done (let the real video show through).
  if (phase === 'done') return null

  return (
    <div className="absolute inset-0 z-30 bg-black flex items-center justify-center">
      {/* Ad video — always mounted so the ref is available when VAST data arrives */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain bg-black"
        playsInline
        muted={muted}
        onPlaying={handlePlaying}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        onClick={handleVideoClick}
      />

      {/* Loading overlay (covers the empty video element while fetching) */}
      {phase === 'loading' && !needsClick && (
        <div className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 text-gray-400 bg-black">
          <Loader2 className="size-8 animate-spin text-orange-500" />
          <span className="text-xs uppercase tracking-widest">Loading ad…</span>
        </div>
      )}

      {/* Click-to-play overlay (autoplay blocked) */}
      <AnimatePresence>
        {needsClick && phase !== 'done' && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleManualPlay}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-3 bg-black/70 text-white cursor-pointer"
          >
            <Play className="size-14 fill-white" />
            <span className="text-sm font-medium">Tap to play ad</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Top-left: Ad badge */}
      {phase === 'playing' && (
        <div className="absolute top-3 left-3 z-40 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-bold uppercase tracking-wider">
            Ad
          </span>
          <span className="px-2 py-0.5 rounded bg-black/70 text-white/80 text-[10px] font-medium tabular-nums">
            {formatRemaining(remaining)}
          </span>
        </div>
      )}

      {/* Bottom-right: Mute + Skip controls */}
      {phase === 'playing' && (
        <div className="absolute bottom-3 right-3 z-40 flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="p-2 rounded-full bg-black/70 text-white hover:bg-black/90 transition-colors"
            aria-label={muted ? 'Unmute ad' : 'Mute ad'}
          >
            {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          </button>

          {canSkip ? (
            <button
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500 text-white text-xs font-bold hover:bg-orange-600 transition-colors"
            >
              Skip Ad
              <SkipForward className="size-3.5 fill-white" />
            </button>
          ) : skipIn !== null && skipIn > 0 ? (
            <span className="px-3 py-1.5 rounded-full bg-black/70 text-white/90 text-xs font-medium tabular-nums">
              Skip in {skipIn}s
            </span>
          ) : null}
        </div>
      )}

      {/* Error toast (only shown briefly before finish()) */}
      {errorMsg && (
        <div className="absolute top-3 right-3 z-40 flex items-center gap-2 px-3 py-1.5 rounded bg-black/80 text-white/80 text-xs">
          <AlertCircle className="size-3.5" />
          {errorMsg}
        </div>
      )}
    </div>
  )
}
