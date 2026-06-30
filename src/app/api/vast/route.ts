import { NextResponse } from 'next/server'
import { VASTClient } from '@dailymotion/vast-client'

/**
 * ExoClick In-Stream (VAST) pre-roll ad endpoint.
 *
 * The VAST tag from ExoClick is a VAST <Wrapper> that points to another VAST
 * URL containing the actual <InLine> ad with the media file. We resolve the
 * wrapper server-side (no CORS) using @dailymotion/vast-client, extract the
 * playable media URL + tracking endpoints, and return them as JSON.
 *
 * The client (PrerollAd component) plays the media file in a <video> element
 * and fires the impression / tracking pixels from the user's browser (so
 * impressions are counted correctly by ExoClick, from the real user IP).
 */

const DEFAULT_VAST_TAG = 'https://s.magsrv.com/v1/vast.php?idz=5962192'
const VAST_TAG_URL = process.env.EXOCLICK_VAST_TAG || DEFAULT_VAST_TAG

// ExoClick in-stream ads for this zone (idz=5962192) are targeted at desktop
// traffic. A desktop User-Agent is required — without it ExoClick returns an
// empty <VAST/> response (no ad). This UA is sent on both the wrapper request
// and the resolved inline-ad request.
const DESKTOP_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

// In-memory cache — avoid hammering ExoClick on every request.
// Only successful ad responses are cached; errors / no-ad responses are
// retried on the next request (short negative cache to avoid hammering).
let cache: { ts: number; data: VastPayload } | null = null
const CACHE_TTL = 60_000 // 60s for successful ad responses
const NEGATIVE_CACHE_TTL = 5_000 // 5s for no-ad / error responses

interface VastPayload {
  ok: boolean
  mediaUrl?: string
  mimeType?: string
  width?: number
  height?: number
  bitrate?: number
  duration?: number
  skipOffset?: number
  clickThrough?: string | null
  clickTracking?: string[]
  impressions: string[]
  trackingEvents: Record<string, string[]>
  error?: string
}

function emptyPayload(error: string): VastPayload {
  return { ok: false, impressions: [], trackingEvents: {}, error }
}

function pickBestMediaFile(mediaFiles: any[]): any | null {
  if (!mediaFiles?.length) return null

  // Prefer progressive MP4 (broad browser support).
  const mp4 = mediaFiles.filter(
    (m) =>
      m.deliveryType === 'progressive' &&
      (m.mimeType === 'video/mp4' || (typeof m.fileURL === 'string' && m.fileURL.endsWith('.mp4')))
  )
  const candidates = mp4.length ? mp4 : mediaFiles

  // Sort by bitrate ascending, pick the middle one (good quality without overloading).
  const sorted = [...candidates].sort((a, b) => (a.bitrate || 0) - (b.bitrate || 0))
  return sorted[Math.floor(sorted.length / 2)] || sorted[0]
}

function normalizeUrlList(items: any[]): string[] {
  if (!Array.isArray(items)) return []
  return items
    .map((item) => {
      if (typeof item === 'string') return item
      if (item?.children && typeof item.children === 'string') return item.children
      if (typeof item?.url === 'string') return item.url
      return null
    })
    .filter((u): u is string => Boolean(u))
}

/**
 * Extract impression URLs from a parsed Ad.
 * dailymotion/vast-client stores them in `ad.impressionURLTemplates`
 * as `[{ id, url }]` (merged from wrapper + inline during resolution).
 */
function extractImpressions(ad: any): string[] {
  const out: string[] = []
  const lists = [ad?.impressionURLTemplates, ad?.impressions]
  for (const list of lists) {
    if (!Array.isArray(list)) continue
    for (const item of list) {
      if (typeof item === 'string') {
        out.push(item)
      } else if (item && typeof item === 'object') {
        if (typeof item.url === 'string') out.push(item.url)
        else if (typeof item.children === 'string') out.push(item.children)
      }
    }
  }
  return out
}

export async function GET() {
  // Serve from cache if fresh (TTL depends on whether the cached response
  // was a successful ad or a no-ad/error response).
  if (cache) {
    const ttl = cache.data.ok ? CACHE_TTL : NEGATIVE_CACHE_TTL
    if (Date.now() - cache.ts < ttl) {
      return NextResponse.json(cache.data)
    }
  }

  try {
    const client = new VASTClient()
    // resolveAll: true follows <Wrapper><VASTAdTagURI> to the inline ad.
    // ExoClick requires a desktop User-Agent for this zone — without it
    // the response is an empty <VAST/> element (no ad).
    const response = await client.get(VAST_TAG_URL, {
      resolveAll: true,
      fetchOptions: {
        headers: {
          'User-Agent': DESKTOP_UA,
          Accept: '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
    })

    const ad = response?.ads?.[0]
    if (!ad) {
      const payload = emptyPayload('No ads available')
      cache = { ts: Date.now(), data: payload }
      return NextResponse.json(payload)
    }

    // Find the first linear creative (pre-roll video).
    const creative =
      (ad.creatives || []).find((c: any) => c.type === 'linear') || ad.creatives?.[0]

    if (!creative || !creative.mediaFiles?.length) {
      const payload = emptyPayload('No linear creative with media')
      cache = { ts: Date.now(), data: payload }
      return NextResponse.json(payload)
    }

    const mediaFile = pickBestMediaFile(creative.mediaFiles)
    if (!mediaFile?.fileURL) {
      const payload = emptyPayload('No playable media file URL')
      cache = { ts: Date.now(), data: payload }
      return NextResponse.json(payload)
    }

    // Impressions — fired once when the ad starts rendering.
    // Stored in ad.impressionURLTemplates by the dailymotion client.
    const impressions = extractImpressions(ad)

    // Tracking events keyed by VAST event name (start, firstQuartile, midpoint,
    // thirdQuartile, complete, skip, error, progress, ...).
    const trackingEvents: Record<string, string[]> = {}
    const te = creative.trackingEvents || {}
    for (const [event, urls] of Object.entries(te)) {
      trackingEvents[event] = normalizeUrlList(urls as any)
    }

    // Ad-level error URLs (from <Wrapper><Error> / <InLine><Error>).
    const errorUrls = normalizeUrlList(ad.errorURLTemplates || [])
    if (errorUrls.length) {
      trackingEvents.error = [...(trackingEvents.error || []), ...errorUrls]
    }

    // skipDelay (seconds). ExoClick pre-roll is typically skippable after 5s.
    // Fall back to 5s if not declared (matches ExoClick default skippable pre-roll).
    let skipOffset: number | undefined
    if (typeof creative.skipDelay === 'number' && !Number.isNaN(creative.skipDelay)) {
      skipOffset = creative.skipDelay
    } else {
      skipOffset = 5
    }

    // clickThrough can be either a plain string or an object {id, url}
    // depending on what the VAST response contains. Normalize to a string.
    const rawClickThrough = creative.videoClickThroughURLTemplate
    let clickThrough: string | null = null
    if (typeof rawClickThrough === 'string') {
      clickThrough = rawClickThrough
    } else if (rawClickThrough && typeof rawClickThrough === 'object') {
      clickThrough =
        typeof rawClickThrough.url === 'string'
          ? rawClickThrough.url
          : typeof rawClickThrough.children === 'string'
            ? rawClickThrough.children
            : null
    }

    const payload: VastPayload = {
      ok: true,
      mediaUrl: mediaFile.fileURL,
      mimeType: mediaFile.mimeType || 'video/mp4',
      width: mediaFile.width || undefined,
      height: mediaFile.height || undefined,
      bitrate: mediaFile.bitrate || undefined,
      duration: typeof creative.duration === 'number' ? creative.duration : undefined,
      skipOffset,
      clickThrough,
      clickTracking: normalizeUrlList(creative.videoClickTrackingURLTemplates || []),
      impressions,
      trackingEvents,
    }

    // Only cache successful ad responses for the long TTL.
    cache = { ts: Date.now(), data: payload }
    return NextResponse.json(payload)
  } catch (err: any) {
    console.error('[api/vast] error:', err?.message || err)
    const payload = emptyPayload(err?.message || 'VAST fetch failed')
    // Short negative cache for errors.
    cache = { ts: Date.now(), data: payload }
    return NextResponse.json(payload)
  }
}
