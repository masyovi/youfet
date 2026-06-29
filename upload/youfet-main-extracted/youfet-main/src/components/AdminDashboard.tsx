'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Plus,
  Trash2,
  Pencil,
  ArrowLeft,
  LogOut,
  FolderOpen,
  VideoIcon,
  Star,
  Loader2,
  ImageIcon,
  RefreshCw,
  ExternalLink,
  Upload,
  Link,
  Cloud,
  CheckCircle2,
  AlertCircle,
  FileVideo,
  HardDrive,
  CircleUserRound,
  Crown,
  Database,
  DollarSign,
  Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useAppStore } from '@/store/app'

// ─── Types ───────────────────────────────────────────────
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

interface LuluFile {
  file_code: string
  title: string
  thumbnail: string
  link: string
  length: string
  views: string
  uploaded: string
  canplay: number
}

// ─── Component ───────────────────────────────────────────
export function AdminDashboard() {
  const router = useRouter()
  const { goHome, setAdminLoggedIn } = useAppStore()

  const [categories, setCategories] = useState<Category[]>([])
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)

  // ─── Data Fetching ──────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch('/api/categories')
      if (!res.ok) throw new Error('Failed to load categories')
      const data = await res.json()
      setCategories(data)
      return data
    } catch {
      toast.error('Failed to load categories')
      return []
    }
  }, [])

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/videos')
      if (!res.ok) throw new Error('Failed to load videos')
      const data = await res.json()
      setVideos(data)
    } catch {
      toast.error('Failed to load videos')
    }
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    await Promise.all([fetchCategories(), fetchVideos()])
    setLoading(false)
  }, [fetchCategories, fetchVideos])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  // ─── Category CRUD ──────────────────────────────────────
  const [catDialogOpen, setCatDialogOpen] = useState(false)
  const [catForm, setCatForm] = useState({ name: '' })

  const openCategoryDialog = () => {
    setCatForm({ name: '' })
    setCatDialogOpen(true)
  }

  const handleCreateCategory = async () => {
    if (!catForm.name.trim()) {
      toast.error('Category name is required')
      return
    }
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: catForm.name.trim() }),
      })
      if (!res.ok) throw new Error('Failed to create category')
      toast.success('Category created successfully')
      setCatDialogOpen(false)
      await fetchAll()
    } catch {
      toast.error('Failed to create category')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete category')
      toast.success('Category deleted successfully')
      await fetchAll()
    } catch {
      toast.error('Failed to delete category')
    }
  }

  // ─── Video CRUD ─────────────────────────────────────────
  const [videoDialogOpen, setVideoDialogOpen] = useState(false)
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null)
  const [videoForm, setVideoForm] = useState({
    title: '',
    slug: '',
    description: '',
    embedUrl: '',
    thumbnailUrl: '',
    categoryId: '',
    featured: false,
  })
  const [generatingThumbnail, setGeneratingThumbnail] = useState(false)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)

  const openVideoDialog = (video?: Video) => {
    if (video) {
      setEditingVideoId(video.id)
      setVideoForm({
        title: video.title,
        slug: video.slug || '',
        description: video.description,
        embedUrl: video.embedUrl,
        thumbnailUrl: video.thumbnailUrl || '',
        categoryId: video.categoryId,
        featured: video.featured,
      })
      setThumbnailPreview(video.thumbnailUrl || null)
    } else {
      setEditingVideoId(null)
      setVideoForm({
        title: '',
        slug: '',
        description: '',
        embedUrl: '',
        thumbnailUrl: '',
        categoryId: categories[0]?.id || '',
        featured: false,
      })
      setThumbnailPreview(null)
    }
    setVideoDialogOpen(true)
  }

  const openVideoDialogWithEmbed = (embedUrl: string, title?: string, thumbnailUrl?: string) => {
    setEditingVideoId(null)
    setVideoForm({
      title: title || '',
      slug: title ? title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-') : '',
      description: '',
      embedUrl,
      thumbnailUrl: thumbnailUrl || '',
      categoryId: categories[0]?.id || '',
      featured: false,
    })
    setThumbnailPreview(thumbnailUrl || null)
    setVideoDialogOpen(true)
  }

  const handleGenerateThumbnail = async () => {
    if (!videoForm.embedUrl.trim()) {
      toast.error('Embed URL is required first')
      return
    }
    setGeneratingThumbnail(true)
    try {
      const res = await fetch('/api/thumbnail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedUrl: videoForm.embedUrl.trim() }),
      })
      if (!res.ok) throw new Error('Failed to generate thumbnail')
      const data = await res.json()
      setVideoForm((f) => ({ ...f, thumbnailUrl: data.thumbnailUrl }))
      setThumbnailPreview(data.thumbnailUrl)
      toast.success(
        data.source === 'direct'
          ? 'Thumbnail extracted from platform'
          : 'Thumbnail screenshot created'
      )
    } catch {
      toast.error('Failed to generate thumbnail')
    } finally {
      setGeneratingThumbnail(false)
    }
  }

  const handleSaveVideo = async () => {
    if (!videoForm.title.trim()) {
      toast.error('Video title is required')
      return
    }
    if (!videoForm.embedUrl.trim()) {
      toast.error('Video embed URL is required')
      return
    }

    try {
      const url = editingVideoId
        ? `/api/videos/${editingVideoId}`
        : '/api/videos'
      const method = editingVideoId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...videoForm,
          title: videoForm.title.trim(),
          slug: videoForm.slug.trim() || undefined,
          embedUrl: videoForm.embedUrl.trim(),
          thumbnailUrl: videoForm.thumbnailUrl.trim() || undefined,
        }),
      })
      if (!res.ok) throw new Error('Failed to save video')
      toast.success(
        editingVideoId ? 'Video updated successfully' : 'Video created successfully'
      )
      setVideoDialogOpen(false)
      await fetchAll()
    } catch {
      toast.error('Failed to save video')
    }
  }

  const handleDeleteVideo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this video?')) return
    try {
      const res = await fetch(`/api/videos/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete video')
      toast.success('Video deleted successfully')
      await fetchAll()
    } catch {
      toast.error('Failed to delete video')
    }
  }

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // ignore
    }
    setAdminLoggedIn(false)
    goHome()
  }

  const handleToggleFeatured = async (video: Video) => {
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: video.title,
          slug: video.slug,
          description: video.description,
          embedUrl: video.embedUrl,
          categoryId: video.categoryId,
          featured: !video.featured,
        }),
      })
      if (!res.ok) throw new Error('Failed to update status')
      toast.success('Status updated successfully')
      await fetchAll()
    } catch {
      toast.error('Failed to update status')
    }
  }

  // ─── LuluStream Upload State ────────────────────────────
  const [uploadTab, setUploadTab] = useState<'file' | 'url'>('file')
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadUrl, setUploadUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadResult, setUploadResult] = useState<{
    filecode: string
    embedUrl: string
    thumbnailUrl: string
  } | null>(null)

  // LuluStream file browser
  const [luluFiles, setLuluFiles] = useState<LuluFile[]>([])
  const [luluFilesLoading, setLuluFilesLoading] = useState(false)
  const [luluFilesPage, setLuluFilesPage] = useState(1)
  const [luluFilesTotal, setLuluFilesTotal] = useState(0)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setUploadFile(file)
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file) {
      setUploadFile(file)
      if (!uploadTitle) setUploadTitle(file.name.replace(/\.[^.]+$/, ''))
    }
  }

  const handleFileUpload = async () => {
    if (!uploadFile) {
      toast.error('Please select a file first')
      return
    }
    setUploading(true)
    setUploadProgress(0)

    try {
      console.log('[Upload] Starting:', uploadFile.name, (uploadFile.size / 1024 / 1024).toFixed(1), 'MB')

      // Step 1: Get upload server URL from our API (small payload, no file)
      const serverRes = await fetch('/api/lulustream/upload-server', {
        method: 'POST',
      })
      const serverData = await serverRes.json()
      if (!serverRes.ok || !serverData.success) {
        throw new Error(serverData.error || 'Failed to get upload server')
      }

      const uploadServerUrl = serverData.uploadServer as string
      const apiKey = serverData.apiKey as string
      console.log('[Upload] Server:', uploadServerUrl)

      // Step 2: Upload file DIRECTLY from browser to LuluStream (bypasses our server size limit)
      const luluForm = new FormData()
      luluForm.append('key', apiKey)
      luluForm.append('file', uploadFile)
      if (uploadTitle) luluForm.append('file_title', uploadTitle)
      luluForm.append('file_public', '1')

      // Use XMLHttpRequest for real upload progress tracking
      const uploadResult = await new Promise<{
        status: number
        files: { filecode: string; filename: string; status: string }[]
      }>((resolve, reject) => {
        const xhr = new XMLHttpRequest()

        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const pct = Math.round((e.loaded / e.total) * 100)
            setUploadProgress(pct)
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const json = JSON.parse(xhr.responseText)
              resolve(json)
            } catch {
              reject(new Error(`Invalid response: ${xhr.responseText.substring(0, 200)}`))
            }
          } else {
            try {
              const json = JSON.parse(xhr.responseText)
              reject(new Error(json.msg || `Upload failed (HTTP ${xhr.status})`))
            } catch {
              reject(new Error(`Upload failed (HTTP ${xhr.status})`))
            }
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error while uploading to LuluStream'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'))
        })

        xhr.open('POST', uploadServerUrl)
        xhr.send(luluForm)
      })

      console.log('[Upload] Result:', JSON.stringify(uploadResult))

      if (uploadResult.status !== 200 || !uploadResult.files || uploadResult.files.length === 0) {
        throw new Error('Upload completed but no file code returned')
      }

      const filecode = uploadResult.files[0].filecode
      const embedUrl = `https://luluvid.com/e/${filecode}`
      const thumbnailUrl = `https://img.lulucdn.com/${filecode}.jpg`

      setUploadResult({ filecode, embedUrl, thumbnailUrl })
      toast.success('Video uploaded to LuluStream!')
    } catch (error) {
      console.error('[Upload] Error:', error)
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleUrlUpload = async () => {
    if (!uploadUrl.trim()) {
      toast.error('Please enter a video URL')
      return
    }
    setUploading(true)
    setUploadProgress(0)

    try {
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + Math.random() * 10
        })
      }, 800)

      const res = await fetch('/api/lulustream/upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: uploadUrl.trim() }),
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Upload failed')

      const filecode = data.filecode
      const embedUrl = `https://luluvid.com/e/${filecode}`
      const thumbnailUrl = `https://img.lulucdn.com/${filecode}.jpg`

      setUploadResult({ filecode, embedUrl, thumbnailUrl })
      toast.success('Video uploaded to LuluStream!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const fetchLuluFiles = useCallback(async (page = 1) => {
    setLuluFilesLoading(true)
    try {
      const res = await fetch(`/api/lulustream/files?page=${page}&per_page=20`)
      if (!res.ok) throw new Error('Failed to fetch files')
      const data = await res.json()
      setLuluFiles(data.files || [])
      setLuluFilesTotal(data.results_total || 0)
      setLuluFilesPage(page)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to load LuluStream files')
      setLuluFiles([])
    } finally {
      setLuluFilesLoading(false)
    }
  }, [])

  const resetUpload = () => {
    setUploadFile(null)
    setUploadTitle('')
    setUploadUrl('')
    setUploadProgress(0)
    setUploadResult(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // ─── LuluStream Account Info ───────────────────────────
  const [accountInfo, setAccountInfo] = useState<{
    login: string
    email: string
    premium: number
    premium_expire: string
    balance: string
    storage_used: string
    storage_left: string
    files_total: string
  } | null>(null)
  const [accountLoading, setAccountLoading] = useState(false)
  const [accountError, setAccountError] = useState<string | null>(null)

  const fetchAccountInfo = useCallback(async () => {
    setAccountLoading(true)
    setAccountError(null)
    try {
      const res = await fetch('/api/lulustream/account')
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load account info')
      setAccountInfo({
        login: data.login,
        email: data.email,
        premium: data.premium,
        premium_expire: data.premium_expire,
        balance: data.balance,
        storage_used: data.storage_used,
        storage_left: data.storage_left,
        files_total: data.files_total,
      })
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Failed to load account info')
      setAccountInfo(null)
    } finally {
      setAccountLoading(false)
    }
  }, [])

  // ─── Loading State ──────────────────────────────────────
  if (loading) {
    return (
      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-64" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Manage your categories and videos here
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={goHome}
              variant="outline"
              className="border-gray-700 hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400 text-gray-300"
            >
              <ArrowLeft className="size-4" />
              <span className="hidden sm:inline">Home</span>
            </Button>
            <Button
              onClick={handleLogout}
              variant="outline"
              className="border-red-900/50 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-red-400"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Tabs defaultValue="categories" className="space-y-6">
            <TabsList className="bg-gray-900 border border-gray-800 w-full sm:w-auto">
              <TabsTrigger
                value="categories"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
              >
                <FolderOpen className="size-4 mr-1.5" />
                <span className="hidden sm:inline">Categories</span>
              </TabsTrigger>
              <TabsTrigger
                value="videos"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
              >
                <VideoIcon className="size-4 mr-1.5" />
                <span className="hidden sm:inline">Videos</span>
              </TabsTrigger>
              <TabsTrigger
                value="upload"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
              >
                <Cloud className="size-4 mr-1.5" />
                <span className="hidden sm:inline">Upload</span>
              </TabsTrigger>
              <TabsTrigger
                value="account"
                className="data-[state=active]:bg-orange-500 data-[state=active]:text-white text-gray-400"
              >
                <CircleUserRound className="size-4 mr-1.5" />
                <span className="hidden sm:inline">Account</span>
              </TabsTrigger>
            </TabsList>

            {/* ─── Categories Tab ──────────────────────────── */}
            <TabsContent value="categories">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={openCategoryDialog}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="size-4" />
                  Add Category
                </Button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center py-12 border border-gray-800 rounded-xl bg-gray-900/50">
                  <FolderOpen className="size-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No categories yet. Add your first category!</p>
                </div>
              ) : (
                <div className="border border-gray-800 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-gray-900/50">
                        <TableHead className="text-gray-300 font-semibold">Name</TableHead>
                        <TableHead className="text-gray-300 font-semibold">Slug</TableHead>
                        <TableHead className="text-right text-gray-300 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {categories.map((cat) => (
                        <TableRow key={cat.id} className="border-gray-800 hover:bg-gray-900/50">
                          <TableCell className="text-white font-medium">{cat.name}</TableCell>
                          <TableCell className="text-gray-400 text-sm">{cat.slug}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              onClick={() => handleDeleteCategory(cat.id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ─── Videos Tab ──────────────────────────────── */}
            <TabsContent value="videos">
              <div className="flex justify-end mb-4">
                <Button
                  onClick={() => openVideoDialog()}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Plus className="size-4" />
                  Add Video
                </Button>
              </div>

              {videos.length === 0 ? (
                <div className="text-center py-12 border border-gray-800 rounded-xl bg-gray-900/50">
                  <VideoIcon className="size-10 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No videos yet. Add your first video!</p>
                </div>
              ) : (
                <div className="border border-gray-800 rounded-xl overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gray-800 hover:bg-gray-900/50">
                        <TableHead className="text-gray-300 font-semibold">Title</TableHead>
                        <TableHead className="text-gray-300 font-semibold hidden sm:table-cell">Category</TableHead>
                        <TableHead className="text-gray-300 font-semibold hidden md:table-cell">Featured</TableHead>
                        <TableHead className="text-gray-300 font-semibold hidden lg:table-cell">Views</TableHead>
                        <TableHead className="text-right text-gray-300 font-semibold">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {videos.map((vid) => (
                        <TableRow key={vid.id} className="border-gray-800 hover:bg-gray-900/50">
                          <TableCell>
                            <div className="flex items-center gap-3 max-w-xs">
                              {vid.thumbnailUrl ? (
                                <img
                                  src={vid.thumbnailUrl}
                                  alt={vid.title}
                                  className="w-20 h-12 object-cover rounded-lg shrink-0 border border-gray-700"
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement
                                    target.style.display = 'none'
                                    target.nextElementSibling?.classList.remove('hidden')
                                  }}
                                />
                              ) : null}
                              <div className={`w-20 h-12 shrink-0 rounded-lg bg-gray-800 flex items-center justify-center border border-gray-700 ${vid.thumbnailUrl ? 'hidden' : ''}`}>
                                <VideoIcon className="size-5 text-gray-600" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-white font-medium truncate">{vid.title}</p>
                                {vid.slug && (
                                  <p className="text-gray-500 text-xs truncate">/video/{vid.slug}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <Badge
                              variant="secondary"
                              className="bg-orange-500/10 text-orange-400 border-orange-500/20 text-xs"
                            >
                              {vid.category?.name || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <button
                              onClick={() => handleToggleFeatured(vid)}
                              className="cursor-pointer"
                            >
                              {vid.featured ? (
                                <Badge className="bg-orange-500 text-white border-orange-500 gap-1">
                                  <Star className="size-3 fill-white" />
                                  Yes
                                </Badge>
                              ) : (
                                <span className="text-gray-500 text-sm">No</span>
                              )}
                            </button>
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-gray-400">
                            {vid.views.toLocaleString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {vid.slug && (
                                <Button
                                  onClick={() => router.push(`/video/${vid.slug}`)}
                                  variant="ghost"
                                  size="sm"
                                  className="text-gray-400 hover:text-orange-400 hover:bg-orange-500/10"
                                  title="Open video"
                                >
                                  <ExternalLink className="size-4" />
                                </Button>
                              )}
                              <Button
                                onClick={() => openVideoDialog(vid)}
                                variant="ghost"
                                size="sm"
                                className="text-orange-400 hover:text-orange-300 hover:bg-orange-500/10"
                              >
                                <Pencil className="size-4" />
                              </Button>
                              <Button
                                onClick={() => handleDeleteVideo(vid.id)}
                                variant="ghost"
                                size="sm"
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>

            {/* ─── Upload Tab (LuluStream) ─────────────────── */}
            <TabsContent value="upload">
              <div className="space-y-6">

                {/* Upload Success Result */}
                {uploadResult ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 space-y-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="bg-green-500/20 p-2 rounded-full mt-0.5">
                        <CheckCircle2 className="size-6 text-green-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white">Upload Complete!</h3>
                        <p className="text-gray-400 text-sm mt-0.5">
                          Your video has been uploaded to LuluStream
                        </p>
                      </div>
                    </div>

                    {/* Embed URL + Thumbnail preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Embed URL</Label>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-xs bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-orange-400 break-all">
                            {uploadResult.embedUrl}
                          </code>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(uploadResult.embedUrl)
                              toast.success('Embed URL copied!')
                            }}
                            className="border-gray-700 text-gray-300 hover:text-white shrink-0"
                          >
                            Copy
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-gray-300 text-sm">Thumbnail</Label>
                        <div className="aspect-video rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                          <img
                            src={uploadResult.thumbnailUrl}
                            alt="Upload thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <Button
                        onClick={() => openVideoDialogWithEmbed(uploadResult.embedUrl, uploadTitle, uploadResult.thumbnailUrl)}
                        className="bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        <Plus className="size-4 mr-1.5" />
                        Add to YouFet
                      </Button>
                      <Button
                        variant="outline"
                        onClick={resetUpload}
                        className="border-gray-700 text-gray-300 hover:bg-gray-800"
                      >
                        <Upload className="size-4 mr-1.5" />
                        Upload Another
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <>
                    {/* Upload Method Toggle */}
                    <div className="flex gap-2">
                      <Button
                        variant={uploadTab === 'file' ? 'default' : 'outline'}
                        onClick={() => setUploadTab('file')}
                        className={uploadTab === 'file'
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                        }
                      >
                        <Upload className="size-4 mr-1.5" />
                        Upload File
                      </Button>
                      <Button
                        variant={uploadTab === 'url' ? 'default' : 'outline'}
                        onClick={() => setUploadTab('url')}
                        className={uploadTab === 'url'
                          ? 'bg-orange-500 hover:bg-orange-600 text-white'
                          : 'border-gray-700 text-gray-300 hover:bg-gray-800'
                        }
                      >
                        <Link className="size-4 mr-1.5" />
                        Upload by URL
                      </Button>
                    </div>

                    {/* Upload Progress */}
                    {uploading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-3 rounded-xl border border-orange-500/30 bg-orange-500/5 p-5"
                      >
                        <div className="flex items-center gap-3">
                          <Loader2 className="size-5 text-orange-400 animate-spin" />
                          <span className="text-white font-medium">
                            {uploadTab === 'file' ? 'Uploading video...' : 'Processing remote upload...'}
                          </span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                        <p className="text-gray-400 text-xs">
                          Please wait, this may take a while depending on file size
                        </p>
                      </motion.div>
                    )}

                    {/* File Upload */}
                    {uploadTab === 'file' && (
                      <div className="space-y-4">
                        {/* Title input */}
                        <div className="space-y-2">
                          <Label className="text-gray-300">Video Title (optional)</Label>
                          <Input
                            placeholder="Enter video title"
                            value={uploadTitle}
                            onChange={(e) => setUploadTitle(e.target.value)}
                            disabled={uploading}
                            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                          />
                        </div>

                        {/* Drop zone */}
                        <div
                          onDragOver={(e) => e.preventDefault()}
                          onDrop={handleDrop}
                          onClick={() => !uploading && fileInputRef.current?.click()}
                          className={`
                            relative cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-all
                            ${uploadFile
                              ? 'border-orange-500/50 bg-orange-500/5'
                              : 'border-gray-700 hover:border-orange-500/30 hover:bg-gray-900/50'
                            }
                            ${uploading ? 'opacity-50 pointer-events-none' : ''}
                          `}
                        >
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="video/*,.mp4,.avi,.mkv,.webm,.flv,.mov,.wmv,.mpeg,.mpg,.3gp,.m4v"
                            onChange={handleFileSelect}
                            className="hidden"
                          />
                          {uploadFile ? (
                            <div className="space-y-3">
                              <FileVideo className="size-10 text-orange-400 mx-auto" />
                              <div>
                                <p className="text-white font-medium">{uploadFile.name}</p>
                                <p className="text-gray-400 text-sm mt-1">
                                  {(uploadFile.size / (1024 * 1024)).toFixed(1)} MB
                                </p>
                              </div>
                              <p className="text-gray-500 text-xs">Click or drag to change file</p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Upload className="size-10 text-gray-500 mx-auto" />
                              <div>
                                <p className="text-gray-300 font-medium">
                                  Drop video file here or click to browse
                                </p>
                                <p className="text-gray-500 text-sm mt-1">
                                  MP4, AVI, MKV, WebM, MOV, WMV, etc.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>

                        <Button
                          onClick={handleFileUpload}
                          disabled={!uploadFile || uploading}
                          className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"
                        >
                          {uploading ? (
                            <Loader2 className="size-4 animate-spin mr-2" />
                          ) : (
                            <Cloud className="size-4 mr-2" />
                          )}
                          Upload to LuluStream
                        </Button>
                      </div>
                    )}

                    {/* URL Upload */}
                    {uploadTab === 'url' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-gray-300">Remote Video URL</Label>
                          <Input
                            placeholder="https://example.com/video.mp4"
                            value={uploadUrl}
                            onChange={(e) => setUploadUrl(e.target.value)}
                            disabled={uploading}
                            className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
                          />
                          <p className="text-xs text-gray-500">
                            Enter a direct URL to a video file (MP4, AVI, MKV, etc.)
                          </p>
                        </div>

                        <Button
                          onClick={handleUrlUpload}
                          disabled={!uploadUrl.trim() || uploading}
                          className="bg-orange-500 hover:bg-orange-600 text-white w-full sm:w-auto"
                        >
                          {uploading ? (
                            <Loader2 className="size-4 animate-spin mr-2" />
                          ) : (
                            <Cloud className="size-4 mr-2" />
                          )}
                          Upload to LuluStream
                        </Button>
                      </div>
                    )}
                  </>
                )}

                {/* Divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-gray-800" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-gray-950 px-3 text-gray-500">or browse your LuluStream files</span>
                  </div>
                </div>

                {/* LuluStream File Browser */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-gray-300">
                      <HardDrive className="size-4 inline mr-1.5" />
                      Your LuluStream Files
                    </h3>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchLuluFiles()}
                      disabled={luluFilesLoading}
                      className="border-gray-700 text-gray-300 hover:bg-gray-800"
                    >
                      {luluFilesLoading ? (
                        <Loader2 className="size-3.5 animate-spin mr-1" />
                      ) : (
                        <RefreshCw className="size-3.5 mr-1" />
                      )}
                      Refresh
                    </Button>
                  </div>

                  {luluFilesLoading ? (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Skeleton key={i} className="h-16 w-full rounded-lg" />
                      ))}
                    </div>
                  ) : luluFiles.length === 0 ? (
                    <div
                      className="text-center py-10 border border-gray-800 rounded-xl bg-gray-900/50 cursor-pointer hover:border-orange-500/30 transition-colors"
                      onClick={() => fetchLuluFiles()}
                    >
                      <HardDrive className="size-8 text-gray-600 mx-auto mb-2" />
                      <p className="text-gray-400 text-sm">Click to load your LuluStream files</p>
                      {luluFilesTotal > 0 && (
                        <p className="text-gray-500 text-xs mt-1">{luluFilesTotal} files total</p>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {luluFiles.map((file) => {
                        const embedUrl = `https://luluvid.com/e/${file.file_code}`
                        const thumbnailUrl = `https://img.lulucdn.com/${file.file_code}.jpg`
                        return (
                          <div
                            key={file.file_code}
                            className="group rounded-lg border border-gray-800 bg-gray-900/50 overflow-hidden hover:border-orange-500/30 transition-all"
                          >
                            <div className="relative aspect-video bg-gray-800">
                              <img
                                src={file.thumbnail || thumbnailUrl}
                                alt={file.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute bottom-2 right-2">
                                <Badge variant="secondary" className="bg-black/70 text-white text-[10px] border-0">
                                  {Math.floor(Number(file.length) / 60)}:{String(Number(file.length) % 60).padStart(2, '0')}
                                </Badge>
                              </div>
                            </div>
                            <div className="p-3 space-y-2">
                              <p className="text-white text-sm font-medium truncate">
                                {file.title || file.file_code}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <span>{file.views} views</span>
                                <span>•</span>
                                <span>{file.uploaded.split(' ')[0]}</span>
                              </div>
                              <Button
                                size="sm"
                                onClick={() => openVideoDialogWithEmbed(embedUrl, file.title, thumbnailUrl)}
                                className="w-full bg-orange-500 hover:bg-orange-600 text-white h-8 text-xs"
                              >
                                <Plus className="size-3 mr-1" />
                                Add to YouFet
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* Pagination */}
                  {luluFilesTotal > 20 && (
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLuluFiles(luluFilesPage - 1)}
                        disabled={luluFilesPage <= 1 || luluFilesLoading}
                        className="border-gray-700 text-gray-300"
                      >
                        Previous
                      </Button>
                      <span className="text-gray-400 text-sm">
                        Page {luluFilesPage} of {Math.ceil(luluFilesTotal / 20)}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchLuluFiles(luluFilesPage + 1)}
                        disabled={luluFilesPage >= Math.ceil(luluFilesTotal / 20) || luluFilesLoading}
                        className="border-gray-700 text-gray-300"
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* ─── Account Tab (LuluStream) ────────────────── */}
            <TabsContent value="account">
              <div className="space-y-6">
                {/* Refresh Button */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-300">
                    LuluStream Account Info
                  </h3>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={fetchAccountInfo}
                    disabled={accountLoading}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800"
                  >
                    {accountLoading ? (
                      <Loader2 className="size-3.5 animate-spin mr-1" />
                    ) : (
                      <RefreshCw className="size-3.5 mr-1" />
                    )}
                    Refresh
                  </Button>
                </div>

                {/* Loading State */}
                {accountLoading && !accountInfo && (
                  <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <Skeleton key={i} className="h-20 w-full rounded-xl" />
                    ))}
                  </div>
                )}

                {/* Error State */}
                {accountError && !accountInfo && !accountLoading && (
                  <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-6 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="bg-red-500/20 p-2 rounded-full mt-0.5">
                        <AlertCircle className="size-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">Connection Error</h3>
                        <p className="text-gray-400 text-sm mt-1">{accountError}</p>
                        <p className="text-gray-500 text-xs mt-2">
                          Check that your LuluStream API key is valid and the service is accessible.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Account Info Cards */}
                {accountInfo && !accountLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4"
                  >
                    {/* Status Banner */}
                    <div className={accountInfo.premium === 1
                      ? 'rounded-xl border p-4 border-yellow-500/30 bg-yellow-500/5'
                      : 'rounded-xl border p-4 border-gray-700 bg-gray-900/50'
                    }>
                      <div className="flex items-center gap-3">
                        <div className={accountInfo.premium === 1
                          ? 'p-2 rounded-full bg-yellow-500/20'
                          : 'p-2 rounded-full bg-gray-800'
                        }>
                          <CircleUserRound className={accountInfo.premium === 1
                            ? 'size-6 text-yellow-400'
                            : 'size-6 text-gray-400'
                          } />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="text-white font-bold text-lg">{accountInfo.login}</h3>
                            {accountInfo.premium === 1 && (
                              <Badge className="bg-yellow-500 text-black border-yellow-500 gap-1">
                                <Crown className="size-3" />
                                Premium
                              </Badge>
                            )}
                            {accountInfo.premium !== 1 && (
                              <Badge variant="secondary" className="bg-gray-800 text-gray-400 border-gray-700">
                                Free
                              </Badge>
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{accountInfo.email}</p>
                        </div>
                      </div>
                      {accountInfo.premium === 1 && accountInfo.premium_expire && (
                        <div className="mt-3 flex items-center gap-2 text-sm">
                          <Clock className="size-3.5 text-yellow-500" />
                          <span className="text-gray-400">
                            Premium expires:{' '}
                            <span className="text-yellow-400 font-medium">
                              {new Date(accountInfo.premium_expire).toLocaleDateString('en-US', {
                                year: 'numeric', month: 'long', day: 'numeric'
                              })}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {/* Storage Used */}
                      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                          <Database className="size-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">Storage Used</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{accountInfo.storage_used}</p>
                        <p className="text-xs text-gray-500">of {accountInfo.storage_left} remaining</p>
                      </div>

                      {/* Files Total */}
                      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                          <FileVideo className="size-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">Total Files</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{accountInfo.files_total}</p>
                        <p className="text-xs text-gray-500">files hosted on LuluStream</p>
                      </div>

                      {/* Balance */}
                      <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-2">
                        <div className="flex items-center gap-2 text-gray-400">
                          <DollarSign className="size-4" />
                          <span className="text-xs font-medium uppercase tracking-wide">Balance</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{'$'}{accountInfo.balance}</p>
                        <p className="text-xs text-gray-500">account balance</p>
                      </div>
                    </div>

                    {/* API Key Info */}
                    <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4 space-y-2">
                      <div className="flex items-center gap-2 text-gray-400">
                        <HardDrive className="size-4" />
                        <span className="text-xs font-medium uppercase tracking-wide">API Configuration</span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <CheckCircle2 className="size-4 text-green-400" />
                        <span className="text-green-400 text-sm font-medium">API Connected</span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        Your LuluStream API key is configured and connected.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Initial empty state */}
                {!accountInfo && !accountLoading && !accountError && (
                  <div className="text-center py-12 border border-gray-800 rounded-xl bg-gray-900/50">
                    <CircleUserRound className="size-10 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">Click "Refresh" to load your LuluStream account info</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>

      {/* ─── Category Dialog ─────────────────────────────── */}
      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent className="bg-gray-950 border-gray-800 sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-white">Add Category</DialogTitle>
            <DialogDescription className="text-gray-400">
              Create a new category to organize your videos
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-gray-300">Category Name</Label>
              <Input
                placeholder="e.g. Music, Gaming, Education"
                value={catForm.name}
                onChange={(e) => setCatForm({ name: e.target.value })}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateCategory()}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCatDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateCategory}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Create Category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Video Dialog ────────────────────────────────── */}
      <Dialog open={videoDialogOpen} onOpenChange={setVideoDialogOpen}>
        <DialogContent className="bg-gray-950 border-gray-800 sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingVideoId ? 'Edit Video' : 'Add Video'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {editingVideoId
                ? 'Update existing video information'
                : 'Fill in the details to add a new video'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-gray-300">Video Title</Label>
              <Input
                placeholder="Enter video title"
                value={videoForm.title}
                onChange={(e) => {
                  const newTitle = e.target.value
                  setVideoForm((f) => ({
                    ...f,
                    title: newTitle,
                    slug: !editingVideoId
                      ? newTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').replace(/-+/g, '-')
                      : f.slug,
                  }))
                }}
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
              />
            </div>

            {/* Slug field */}
            <div className="space-y-2">
              <Label className="text-gray-300">URL Slug</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm pointer-events-none">
                  /video/
                </span>
                <Input
                  placeholder="auto-from-title"
                  value={videoForm.slug}
                  onChange={(e) =>
                    setVideoForm((f) => ({ ...f, slug: e.target.value }))
                  }
                  className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-600 focus-visible:border-orange-500 focus-visible:ring-orange-500/30 pl-16"
                />
              </div>
              <p className="text-xs text-gray-500">
                Leave empty to auto-generate from title. Example: youfet.site/video/april-mei
              </p>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Description</Label>
              <Textarea
                placeholder="Brief description of this video (optional)"
                value={videoForm.description}
                onChange={(e) =>
                  setVideoForm((f) => ({ ...f, description: e.target.value }))
                }
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus-visible:border-orange-500 focus-visible:ring-orange-500/30 min-h-20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">URL Embed</Label>
              <Input
                placeholder="https://www.youtube.com/embed/... or https://luluvid.com/e/xxx"
                value={videoForm.embedUrl}
                onChange={(e) =>
                  setVideoForm((f) => ({ ...f, embedUrl: e.target.value }))
                }
                className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus-visible:border-orange-500 focus-visible:ring-orange-500/30"
              />
              <p className="text-xs text-gray-500">
                Use an embed URL from YouTube, LuluStream, or other video platforms
              </p>
            </div>

            {/* ── Thumbnail Section ── */}
            <div className="space-y-3 rounded-lg border border-gray-800 p-4 bg-gray-900/50">
              <div className="flex items-center justify-between">
                <Label className="text-gray-300 flex items-center gap-2">
                  <ImageIcon className="size-4" />
                  Thumbnail
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleGenerateThumbnail}
                  disabled={generatingThumbnail || !videoForm.embedUrl.trim()}
                  className="border-gray-700 text-gray-300 hover:bg-orange-500/10 hover:border-orange-500/50 hover:text-orange-400 text-xs h-7"
                >
                  {generatingThumbnail ? (
                    <Loader2 className="size-3 animate-spin mr-1" />
                  ) : (
                    <RefreshCw className="size-3 mr-1" />
                  )}
                  Auto Generate
                </Button>
              </div>

              {thumbnailPreview ? (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-800 border border-gray-700">
                  <img
                    src={thumbnailPreview}
                    alt="Thumbnail preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.style.display = 'none'
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setVideoForm((f) => ({ ...f, thumbnailUrl: '' }))
                      setThumbnailPreview(null)
                    }}
                    className="absolute top-2 right-2 bg-black/60 hover:bg-red-500/80 text-white rounded-full p-1 transition-colors cursor-pointer"
                    title="Remove thumbnail"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              ) : (
                <div className="aspect-video rounded-lg bg-gray-800/50 border border-dashed border-gray-700 flex flex-col items-center justify-center gap-1.5">
                  <ImageIcon className="size-6 text-gray-600" />
                  <p className="text-xs text-gray-500">
                    {videoForm.embedUrl.trim()
                      ? 'Click "Auto Generate" to create a thumbnail'
                      : 'Enter an embed URL first'}
                  </p>
                </div>
              )}

              <div className="space-y-1.5">
                <Input
                  placeholder="Or paste a manual image URL..."
                  value={videoForm.thumbnailUrl}
                  onChange={(e) => {
                    const val = e.target.value
                    setVideoForm((f) => ({ ...f, thumbnailUrl: val }))
                    if (val.trim()) setThumbnailPreview(val.trim())
                    else setThumbnailPreview(null)
                  }}
                  className="bg-gray-800 border-gray-700 text-white text-sm placeholder:text-gray-600 focus-visible:border-orange-500 focus-visible:ring-orange-500/30 h-8"
                />
                <p className="text-[11px] text-gray-600">
                  Optional. Leave empty to auto-generate from embed URL.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-300">Category</Label>
              <Select
                value={videoForm.categoryId}
                onValueChange={(val) =>
                  setVideoForm((f) => ({ ...f, categoryId: val }))
                }
              >
                <SelectTrigger className="w-full bg-gray-900 border-gray-700 text-white focus:ring-orange-500/30 focus:border-orange-500">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-gray-700">
                  {categories.map((cat) => (
                    <SelectItem
                      key={cat.id}
                      value={cat.id}
                      className="text-gray-200 focus:bg-orange-500/10 focus:text-orange-400"
                    >
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-800 p-3 bg-gray-900/50">
              <div className="space-y-0.5">
                <Label className="text-gray-300 text-sm">Featured Video</Label>
                <p className="text-xs text-gray-500">Display as a featured video</p>
              </div>
              <Switch
                checked={videoForm.featured}
                onCheckedChange={(checked) =>
                  setVideoForm((f) => ({ ...f, featured: checked }))
                }
                className="data-[state=checked]:bg-orange-500"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVideoDialogOpen(false)}
              className="border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveVideo}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              {editingVideoId ? 'Save Changes' : 'Create Video'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
