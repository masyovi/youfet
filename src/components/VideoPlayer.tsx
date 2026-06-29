'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, Eye, Clock, Play, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useAppStore } from '@/store/app'

interface Category {
  id: string
  name: string
  slug: string
}

interface Video {
  id: string
  title: string
  slug: string
  description: string
  embedUrl: string
  thumbnailUrl: string | null
  categoryId: string
  featured: boolean
  views: number
  createdAt: string
  category?: Category
}

const MONTH_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${MONTH_EN[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`
}

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
  return views.toString()
}

function VideoIntro({ onComplete }: { onComplete: () => void }) {
  const [count, setCount] = useState(3)

  useEffect(() => {
    const interval = setInterval(() => {
      setCount((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setTimeout(onComplete, 400)
          return 0
        }
        return prev - 1
      })
    }, 700)
    return () => clearInterval(interval)
  }, [onComplete])

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-black overflow-hidden">
      {/* Subtle animated rings */}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: [0, 1.5, 2.5], opacity: [0.6, 0.2, 0] }}
          transition={{ duration: 2.1, repeat: Infinity, ease: 'easeOut' }}
          className="w-16 h-16 rounded-full border-2 border-orange-500/20"
        />
        <motion.div
          initial={{ scale: 0, opacity: 0.4 }}
          animate={{ scale: [0, 1.2, 2], opacity: [0.4, 0.15, 0] }}
          transition={{ duration: 2.1, repeat: Infinity, ease: 'easeOut', delay: 0.25 }}
          className="absolute w-16 h-16 rounded-full border border-orange-500/15"
        />
      </div>

      {/* Scan lines */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.08) 3px, rgba(0,0,0,0.08) 4px)',
        }}
      />

      <div className="relative flex flex-col items-center gap-2">
        {/* YouFet Logo - compact */}
        <motion.div
          initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ duration: 0.5, type: 'spring', stiffness: 250, damping: 15 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-orange-500/20 blur-xl rounded-full scale-125" />
          <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-xl shadow-lg shadow-orange-500/25">
            <Play className="size-5 text-white fill-white" />
          </div>
        </motion.div>

        {/* Brand text */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="text-center"
        >
          <h1 className="text-lg font-black text-white tracking-tight leading-none">
            You<span className="text-orange-500">Fet</span>
          </h1>
          <p className="text-gray-500 text-[8px] tracking-[0.25em] uppercase mt-0.5">
            Video Streaming
          </p>
        </motion.div>

        {/* Countdown */}
        <AnimatePresence mode="wait">
          {count > 0 ? (
            <motion.div
              key={count}
              initial={{ scale: 1.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.6, opacity: 0, y: -8 }}
              transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
              className="mt-1"
            >
              <div className="relative">
                <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                  <circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="rgba(249,115,22,0.12)"
                    strokeWidth="2"
                  />
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="20"
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="2"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: '0 126', strokeDashoffset: 0 }}
                    animate={{ strokeDasharray: ['0 126', '126 0'] }}
                    transition={{ duration: 0.7, ease: 'easeInOut' }}
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-base font-black text-orange-500">
                  {count}
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="go"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 2.5, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="mt-1"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-orange-500/25 blur-lg rounded-full" />
                <div className="relative w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/40">
                  <Play className="size-5 text-white fill-white ml-0.5" />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Top/bottom decorative lines */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent origin-left"
      />
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-orange-500/40 to-transparent origin-right"
      />
    </div>
  )
}

// ─── Related Video Item (Desktop Sidebar) ─────────────
function RelatedVideoItem({ rv }: {
  rv: Video
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/video/${rv.slug}`)}
      className="group flex gap-3 w-full text-left cursor-pointer"
    >
      <div className="w-40 shrink-0 aspect-video rounded-lg overflow-hidden bg-gray-800 border border-gray-800 group-hover:border-orange-500/50 transition-all relative">
        {rv.thumbnailUrl ? (
          <>
            {!imgLoaded && <Skeleton className="absolute inset-0 w-full h-full rounded-lg" />}
            <img
              src={rv.thumbnailUrl}
              alt={rv.title}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="size-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <Play className="size-4 text-white fill-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
      <div className="flex-1 min-w-0 py-0.5">
        <h4 className="text-sm font-medium text-gray-200 line-clamp-2 group-hover:text-orange-400 transition-colors leading-snug">
          {rv.title}
        </h4>
        <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-500">
          <span>{formatViews(rv.views)} views</span>
        </div>
      </div>
    </button>
  )
}

// ─── Related Video Item (Mobile/Tablet Card) ───────────
function RelatedVideoItemMobile({ rv }: {
  rv: Video
}) {
  const [imgLoaded, setImgLoaded] = useState(false)
  const router = useRouter()

  return (
    <button
      onClick={() => router.push(`/video/${rv.slug}`)}
      className="group text-left w-full cursor-pointer"
    >
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 border border-gray-800 group-hover:border-orange-500/50 transition-all">
        {rv.thumbnailUrl ? (
          <>
            {!imgLoaded && <Skeleton className="absolute inset-0 w-full h-full rounded-xl" />}
            <img
              src={rv.thumbnailUrl}
              alt={rv.title}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
            />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Play className="size-8 text-gray-600 group-hover:text-orange-500 transition-colors" />
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="bg-orange-500 p-2.5 rounded-full opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-lg">
            <Play className="size-4 text-white fill-white" />
          </div>
        </div>
      </div>
      <div className="mt-2 px-1">
        <h4 className="text-sm font-medium text-gray-100 line-clamp-2 group-hover:text-orange-400 transition-colors">
          {rv.title}
        </h4>
        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
          <span>{formatViews(rv.views)} views</span>
        </div>
      </div>
    </button>
  )
}

// ─── Main Video Player Component (SPA fallback) ────────
export function VideoPlayer() {
  const router = useRouter()
  const { selectedVideoId, goHome } = useAppStore()

  const [video, setVideo] = useState<Video | null>(null)
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showIntro, setShowIntro] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const prevVideoIdRef = useRef<string | null>(null)

  // Detect video change to trigger intro
  useEffect(() => {
    if (selectedVideoId && selectedVideoId !== prevVideoIdRef.current) {
      prevVideoIdRef.current = selectedVideoId
      setShowIntro(true)
      setIsReady(false)
    }
  }, [selectedVideoId])

  useEffect(() => {
    if (!selectedVideoId) return

    let cancelled = false
    async function fetchVideo() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch(`/api/videos/${selectedVideoId}`)
        if (!res.ok) {
          if (res.status === 404) {
            setError('Video not found')
            setVideo(null)
            return
          }
          throw new Error('Failed to load video')
        }
        const data = await res.json()
        if (!cancelled) {
          setVideo(data)
          if (data.categoryId) {
            fetchRelated(data.categoryId, data.id)
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'An error occurred')
          setVideo(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    async function fetchRelated(categoryId: string, currentVideoId: string) {
      try {
        const res = await fetch(`/api/videos?categoryId=${categoryId}`)
        if (!res.ok) return
        const data: Video[] = await res.json()
        if (!cancelled) {
          setRelatedVideos(data.filter((v) => v.id !== currentVideoId).slice(0, 10))
        }
      } catch {
        // Silently fail for related videos
      }
    }

    fetchVideo()
    return () => { cancelled = true }
  }, [selectedVideoId])

  const handleIntroComplete = useCallback(() => {
    setShowIntro(false)
    setIsReady(true)
  }, [])

  // Loading state
  if (loading) {
    return (
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <Skeleton className="aspect-video w-full rounded-xl" />
              <Skeleton className="h-7 w-3/4" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-20 w-full" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !video) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md mx-auto px-4"
        >
          <div className="bg-gray-800 p-5 rounded-full inline-flex mb-5">
            <AlertTriangle className="size-10 text-orange-500" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">
            {error || 'Video not found'}
          </h2>
          <p className="text-gray-400 mb-6">
            Sorry, the video you're looking for is unavailable or has been removed.
          </p>
          <Button onClick={goHome} className="bg-orange-500 hover:bg-orange-600 text-white">
            <ArrowLeft className="size-4" />
            Back to Home
          </Button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Video Embed */}
            <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-900 border border-gray-800">
              <AnimatePresence>
                {showIntro && video && (
                  <VideoIntro onComplete={handleIntroComplete} />
                )}
              </AnimatePresence>

              {(isReady || !showIntro) && video.embedUrl && (
                <motion.iframe
                  key={video.id}
                  src={video.embedUrl}
                  title={video.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  initial={isReady ? { opacity: 0, scale: 1.02 } : undefined}
                  animate={isReady ? { opacity: 1, scale: 1 } : undefined}
                  transition={isReady ? { duration: 0.5 } : undefined}
                />
              )}

              {!video.embedUrl && (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
                  <Play className="size-16 text-gray-700" />
                </div>
              )}
            </div>

            {/* Video Info */}
            <div className="space-y-3">
              <h1 className="text-xl font-bold text-white leading-tight">
                {video.title}
              </h1>

              <div className="flex flex-wrap items-center gap-3">
                {video.category && (
                  <Badge variant="secondary" className="bg-orange-500/15 text-orange-400 border-orange-500/25">
                    {video.category.name}
                  </Badge>
                )}
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Eye className="size-4" />
                  <span>{formatViews(video.views)} views</span>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock className="size-4" />
                  <span>{formatDate(video.createdAt)}</span>
                </div>
              </div>

              {video.description && (
                <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                  <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                    {video.description}
                  </p>
                </div>
              )}

              <Button
                onClick={goHome}
                variant="outline"
                className="border-gray-700 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400 text-gray-300 mt-2"
              >
                <ArrowLeft className="size-4" />
                Back
              </Button>
            </div>

          </motion.div>

          {/* Sidebar - Related Videos (Desktop only) */}
          <motion.aside
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="hidden lg:block"
          >
            <div className="sticky top-20">
              <h3 className="text-lg font-bold text-white mb-4">Related Videos</h3>
              {relatedVideos.length === 0 ? (
                <p className="text-gray-500 text-sm">No related videos.</p>
              ) : (
                <div className="space-y-3 max-h-[calc(100vh-10rem)] overflow-y-auto pr-1 scrollbar-thin">
                  {relatedVideos.map((rv) => (
                    <RelatedVideoItem key={rv.id} rv={rv} />
                  ))}
                </div>
              )}
            </div>
          </motion.aside>
        </div>

        {/* Related Videos (Mobile/Tablet) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="lg:hidden mt-8"
        >
          <h3 className="text-lg font-bold text-white mb-4">Related Videos</h3>
          {relatedVideos.length === 0 ? (
            <p className="text-gray-500 text-sm">No related videos.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {relatedVideos.map((rv) => (
                <RelatedVideoItemMobile key={rv.id} rv={rv} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
