'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { Play, Eye, Clock, SearchX, ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useAppStore } from '@/store/app'
import { AdNative } from '@/components/AdBanner'

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

const VIDEOS_PER_PAGE = 10

function VideoCardSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="aspect-video w-full rounded-xl" />
      <div className="space-y-2 px-1">
        <Skeleton className="h-4 w-3/4" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    </div>
  )
}

const MONTH_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return `${date.getDate()} ${MONTH_EN[date.getMonth()]} ${date.getFullYear()}`
}

function formatViews(views: number): string {
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M`
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K`
  return views.toString()
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}) {
  if (totalPages <= 1) return null

  const pages: (number | 'ellipsis')[] = []
  const maxVisible = 5

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (currentPage > 3) pages.push('ellipsis')
    const start = Math.max(2, currentPage - 1)
    const end = Math.min(totalPages - 1, currentPage + 1)
    for (let i = start; i <= end; i++) pages.push(i)
    if (currentPage < totalPages - 2) pages.push('ellipsis')
    pages.push(totalPages)
  }

  return (
    <div className="flex items-center justify-center gap-1.5 mt-8">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
      >
        <ChevronLeft className="size-4" />
        <span className="hidden sm:inline">Previous</span>
      </button>
      <div className="flex items-center gap-1">
        {pages.map((page, idx) =>
          page === 'ellipsis' ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-2 py-2 text-gray-500 text-sm select-none"
            >
              ...
            </span>
          ) : (
            <button
              key={`page-${page}`}
              onClick={() => onPageChange(page)}
              className={`min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                currentPage === page
                  ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {page}
            </button>
          )
        )}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white"
      >
        <span className="hidden sm:inline">Next</span>
        <ChevronRight className="size-4" />
      </button>
    </div>
  )
}

function VideoCard({ video }: {
  video: Video
}) {
  const [imgLoaded, setImgLoaded] = useState(!!video.thumbnailUrl)

  return (
    <Link
      href={`/video/${video.slug}`}
      className="group text-left w-full block"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-gray-800 border border-gray-800 group-hover:border-orange-500/50 transition-all">
        {video.thumbnailUrl ? (
          <>
            {!imgLoaded && (
              <div className="absolute inset-0 bg-gray-800 animate-pulse">
                <Skeleton className="w-full h-full rounded-xl" />
              </div>
            )}
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                setImgLoaded(false)
                const el = document.getElementById(`thumb-fallback-${video.id}`)
                if (el) el.style.display = 'flex'
              }}
            />
          </>
        ) : null}
        {/* Fallback: play icon */}
        <div
          id={`thumb-fallback-${video.id}`}
          className={`w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 items-center justify-center ${video.thumbnailUrl ? 'hidden' : 'flex'}`}
        >
          <Play className="size-10 text-gray-600 group-hover:text-orange-500 transition-colors" />
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="bg-orange-500 p-3 rounded-full opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100 transition-all shadow-lg">
            <Play className="size-5 text-white fill-white" />
          </div>
        </div>
      </div>
      {/* Info */}
      <div className="mt-3 px-1 space-y-1.5">
        <h3 className="font-semibold text-sm text-gray-100 line-clamp-2 group-hover:text-orange-400 transition-colors">
          {video.title}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {video.category && (
            <Badge
              variant="secondary"
              className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-xs"
            >
              {video.category.name}
            </Badge>
          )}
          <div className="flex items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <Eye className="size-3" />
              {formatViews(video.views)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="size-3" />
              {formatDate(video.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

export function HomePage() {
  const { selectedCategoryId, searchQuery, setSelectedCategory } =
    useAppStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingVideos, setLoadingVideos] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    let cancelled = false
    async function fetchCategories() {
      try {
        setLoadingCategories(true)
        const res = await fetch('/api/categories')
        if (!res.ok) throw new Error('Failed to fetch categories')
        const data = await res.json()
        if (!cancelled) setCategories(data)
      } catch {
        console.error('Failed to fetch categories')
      } finally {
        if (!cancelled) setLoadingCategories(false)
      }
    }
    fetchCategories()
    return () => { cancelled = true }
  }, [])

  const fetchVideos = useCallback(async () => {
    try {
      setLoadingVideos(true)
      const params = new URLSearchParams()
      if (selectedCategoryId) params.set('categoryId', selectedCategoryId)
      if (searchQuery) params.set('search', searchQuery)
      const query = params.toString() ? `?${params.toString()}` : ''
      const res = await fetch(`/api/videos${query}`)
      if (!res.ok) throw new Error('Failed to fetch videos')
      const data = await res.json()
      setVideos(data)
    } catch {
      console.error('Failed to fetch videos')
      setVideos([])
    } finally {
      setLoadingVideos(false)
    }
  }, [selectedCategoryId, searchQuery])

  useEffect(() => { fetchVideos() }, [fetchVideos])
  useEffect(() => { setCurrentPage(1) }, [selectedCategoryId, searchQuery])

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(videos.length / VIDEOS_PER_PAGE)),
    [videos.length]
  )

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  const paginatedVideos = useMemo(
    () => videos.slice((currentPage - 1) * VIDEOS_PER_PAGE, currentPage * VIDEOS_PER_PAGE),
    [videos, currentPage]
  )

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const adRefreshKey = `${selectedCategoryId}-${searchQuery}-${currentPage}`

  // Split video groups for in-feed ads
  const group1 = paginatedVideos.slice(0, 4)
  const group2 = paginatedVideos.slice(4, 8)
  const group3 = paginatedVideos.slice(8)

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">

        {/* ── Category Pills ── */}
        <section>
          {loadingCategories ? (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={`cat-skel-${i}`} className="h-9 w-24 rounded-full shrink-0" />
              ))}
            </div>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                  selectedCategoryId === null
                    ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all cursor-pointer ${
                    selectedCategoryId === cat.id
                      ? 'bg-orange-500 text-white shadow-md shadow-orange-500/25'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Video Grid Section ── */}
        <section>
          {loadingVideos ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {Array.from({ length: 8 }).map((_, i) => (
                <VideoCardSkeleton key={`vid-skel-${i}`} />
              ))}
            </div>
          ) : videos.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="bg-gray-800 p-4 rounded-full mb-4">
                <SearchX className="size-8 text-gray-500" />
              </div>
              <h3 className="text-lg font-semibold text-gray-300 mb-1">
                No videos found
              </h3>
              <p className="text-gray-500 text-sm max-w-md">
                Try changing your search keywords or selecting a different category.
              </p>
            </div>
          ) : (
            <div className="space-y-6">

              {/* ── Grid Row 1: Videos 1-4 ── */}
              {group1.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {group1.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}

              {/* ── In-Feed Native Banner 1 ── */}
              {group2.length > 0 && <AdNative key={`native-ad-1-${adRefreshKey}`} />}

              {/* ── Grid Row 2: Videos 5-8 ── */}
              {group2.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {group2.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}

              {/* ── In-Feed Native Banner 2 ── */}
              {group3.length > 0 && <AdNative key={`native-ad-2-${adRefreshKey}`} />}

              {/* ── Grid Row 3: Videos 9+ ── */}
              {group3.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {group3.map((video) => (
                    <VideoCard key={video.id} video={video} />
                  ))}
                </div>
              )}

              {/* ── Pagination ── */}
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
