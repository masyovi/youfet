/**
 * LuluStream API Client
 *
 * Docs: https://lulustream.com/api.html
 *
 * Endpoints:
 * - GET  /api/account/info      → Account info
 * - GET  /api/account/stats      → Account stats
 * - GET  /api/upload/server      → Get upload server URL
 * - POST {upload_server}         → Upload video file (multipart)
 * - GET  /api/upload/url         → Upload by remote URL
 * - GET  /api/file/info          → File info (thumbnail, title, etc.)
 * - GET  /api/file/list          → List all files
 * - GET  /api/file/edit          → Edit file metadata
 *
 * Embed URL format: https://luluvid.com/e/{filecode}
 * Thumbnail URL format: https://img.lulucdn.com/{filecode}.jpg
 */

const LULUSTREAM_BASE = 'https://api.lulustream.com/api'

function getApiKey(): string {
  const key = process.env.LULUSTREAM_API_KEY
  if (!key || key === 'your_api_key_here') {
    throw new Error(
      'LULUSTREAM_API_KEY is not configured. Please set a valid API key in .env'
    )
  }
  return key
}

// ─── Account ──────────────────────────────────────────────

export interface LuluAccountInfo {
  login: string
  email: string
  premium: number
  premium_expire: string
  balance: string
  storage_used: string
  storage_left: string
  files_total: string
}

export async function getAccountInfo(): Promise<LuluAccountInfo> {
  try {
    const res = await fetch(`${LULUSTREAM_BASE}/account/info?key=${getApiKey()}`, {
      redirect: 'follow',
    })
    const json = await res.json()
    if (json.status !== 200) throw new Error(json.msg || 'Failed to get account info')
    return json.result
  } catch (error) {
    if (error instanceof Error && error.message.includes('LULUSTREAM_API_KEY')) throw error
    throw new Error('Connection error — check your LuluStream API key is valid and the service is accessible')
  }
}

// ─── Upload Server ───────────────────────────────────────

export async function getUploadServer(): Promise<string> {
  const res = await fetch(`${LULUSTREAM_BASE}/upload/server?key=${getApiKey()}`, {
    redirect: 'follow',
  })
  const json = await res.json()
  if (json.status !== 200) throw new Error(json.msg || 'Failed to get upload server')
  return json.result
}

// ─── Upload File ─────────────────────────────────────────

export interface LuluUploadResult {
  filecode: string
  filename: string
  status: string
}

export interface LuluUploadOptions {
  fileTitle?: string
  fileDescr?: string
  snapshot?: Buffer | null
  fldId?: number
  catId?: number
  tags?: string
  filePublic?: number
  fileAdult?: number
}

export async function uploadFile(
  file: Buffer | Blob,
  filename: string,
  options: LuluUploadOptions = {}
): Promise<LuluUploadResult[]> {
  const uploadServer = await getUploadServer()

  const formData = new FormData()
  formData.append('key', getApiKey())
  formData.append('file', new Blob([file]), filename)

  if (options.fileTitle) formData.append('file_title', options.fileTitle)
  if (options.fileDescr) formData.append('file_descr', options.fileDescr)
  if (options.fldId) formData.append('fld_id', String(options.fldId))
  if (options.catId) formData.append('cat_id', String(options.catId))
  if (options.tags) formData.append('tags', options.tags)
  if (options.filePublic !== undefined) formData.append('file_public', String(options.filePublic))
  if (options.fileAdult !== undefined) formData.append('file_adult', String(options.fileAdult))

  if (options.snapshot) {
    formData.append('snapshot', new Blob([options.snapshot]), 'thumbnail.jpg')
  }

  const res = await fetch(uploadServer, {
    method: 'POST',
    body: formData,
  })

  const json = await res.json()
  if (json.status !== 200) throw new Error(json.msg || 'Failed to upload file')
  return json.files
}

// ─── Upload by URL ───────────────────────────────────────

export interface LuluUrlUploadResult {
  filecode: string
}

export interface LuluUrlUploadOptions {
  fldId?: number
  catId?: number
  tags?: string
  filePublic?: number
  fileAdult?: number
}

export async function uploadByUrl(
  url: string,
  options: LuluUrlUploadOptions = {}
): Promise<LuluUrlUploadResult> {
  const params = new URLSearchParams()
  params.set('key', getApiKey())
  params.set('url', url)
  if (options.fldId) params.set('fld_id', String(options.fldId))
  if (options.catId) params.set('cat_id', String(options.catId))
  if (options.tags) params.set('tags', options.tags)
  if (options.filePublic !== undefined) params.set('file_public', String(options.filePublic))
  if (options.fileAdult !== undefined) params.set('file_adult', String(options.fileAdult))

  const res = await fetch(`${LULUSTREAM_BASE}/upload/url?${params.toString()}`, {
    redirect: 'follow',
  })
  const json = await res.json()
  if (json.status !== 200) throw new Error(json.msg || 'Failed to upload by URL')
  return json.result
}

// ─── File Info ───────────────────────────────────────────

export interface LuluFileInfo {
  file_code: string
  file_title: string
  file_length: string // duration in seconds
  file_views: string
  file_public: string
  file_adult: string
  file_premium_only: string
  file_fld_id: string
  file_created: string
  file_last_download: string
  canplay: number
  player_img: string // thumbnail URL
  cat_id: string
  tags: string
}

export async function getFileInfo(fileCode: string): Promise<LuluFileInfo> {
  const res = await fetch(
    `${LULUSTREAM_BASE}/file/info?key=${getApiKey()}&file_code=${fileCode}`,
    { redirect: 'follow' }
  )
  const json = await res.json()
  if (json.status !== 200) throw new Error(json.msg || 'Failed to get file info')
  return json.result[0]
}

// ─── File List ───────────────────────────────────────────

export interface LuluFileListItem {
  file_code: string
  title: string
  thumbnail: string
  link: string
  length: string // duration in seconds
  views: string
  uploaded: string
  public: string
  fld_id: string
  canplay: number
}

export interface LuluFileListResult {
  files: LuluFileListItem[]
  results_total: number
  pages: number
  results: number
}

export interface LuluFileListOptions {
  fldId?: number
  title?: string
  created?: string
  public?: number
  adult?: number
  perPage?: number
  page?: number
}

export async function getFileList(
  options: LuluFileListOptions = {}
): Promise<LuluFileListResult> {
  const params = new URLSearchParams()
  params.set('key', getApiKey())
  if (options.fldId) params.set('fld_id', String(options.fldId))
  if (options.title) params.set('title', options.title)
  if (options.created) params.set('created', options.created)
  if (options.public !== undefined) params.set('public', String(options.public))
  if (options.adult !== undefined) params.set('adult', String(options.adult))
  if (options.perPage) params.set('per_page', String(options.perPage))
  if (options.page) params.set('page', String(options.page))

  const res = await fetch(`${LULUSTREAM_BASE}/file/list?${params.toString()}`, {
    redirect: 'follow',
  })
  const json = await res.json()
  if (json.status !== 200) throw new Error(json.msg || 'Failed to get file list')
  return json.result
}

// ─── URL Helpers ─────────────────────────────────────────

/**
 * Convert a LuluStream file code to an embed URL
 * Example: "fb5asfuj2snh" → "https://luluvid.com/e/fb5asfuj2snh"
 */
export function getEmbedUrl(fileCode: string): string {
  return `https://luluvid.com/e/${fileCode}`
}

/**
 * Convert a LuluStream file code to a thumbnail URL
 * Example: "fb5asfuj2snh" → "https://img.lulucdn.com/fb5asfuj2snh.jpg"
 */
export function getThumbnailUrl(fileCode: string): string {
  return `https://img.lulucdn.com/${fileCode}.jpg`
}

/**
 * Extract file code from a LuluStream embed URL
 * Supports both new (luluvid.com/e/xxx) and old (lulustream.com/embed-xxx.html) formats
 * Example: "https://luluvid.com/e/fb5asfuj2snh" → "fb5asfuj2snh"
 */
export function extractFileCode(embedUrl: string): string | null {
  // New format: luluvid.com/e/{filecode} (with or without .html)
  const matchNew = embedUrl.match(/luluvid\.com\/e\/([a-zA-Z0-9]+)/)
  if (matchNew) return matchNew[1]

  // Old format: lulustream.com/embed-{filecode}.html
  const matchOld = embedUrl.match(/lulustream\.com\/embed-([a-zA-Z0-9]+)/)
  if (matchOld) return matchOld[1]

  return null
}

/**
 * Extract file code from a LuluStream page URL
 * Example: "https://lulustream.com/fb5asfuj2snh.html" → "fb5asfuj2snh"
 */
export function extractFileCodeFromPage(url: string): string | null {
  const match = url.match(/lulustream\.com\/([a-zA-Z0-9]+)\.html/)
  if (match) return match[1]
  // Also try embed formats
  return extractFileCode(url)
}
