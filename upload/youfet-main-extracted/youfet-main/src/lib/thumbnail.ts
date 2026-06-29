/**
 * Extract thumbnail URL from various video embed URLs
 * 
 * Supported platforms:
 * - YouTube (embed, shorts, watch)
 * - Dailymotion
 * - Vimeo
 * - Facebook Video
 * - Instagram Reels/Video
 * - X/Twitter
 * - Bilibili
 * - Twitch
 * - TikTok
 * - Streamable
 * - Rumble
 * - OK.ru
 * - LuluStream (embed URL)
 * 
 * Fallback: Screenshot from thum.io for unknown embed URLs
 */

/**
 * Extract a direct thumbnail URL from known video embed platforms
 * Returns null if the platform is not recognized
 */
export function extractThumbnailFromEmbed(embedUrl: string): string | null {
  if (!embedUrl) return null

  const url = embedUrl.trim()
  let match: RegExpMatchArray | null

  // ── YouTube ──
  match = url.match(
    /(?:youtube\.com\/(?:embed\/|watch\?v=|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
  )
  if (match) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
  }

  // ── YouTube with time parameter ──
  match = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})\?/)
  if (match) {
    return `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg`
  }

  // ── Dailymotion ──
  match = url.match(/dailymotion\.com\/(?:embed\/)?video\/([a-zA-Z0-9]+)/)
  if (match) {
    return `https://www.dailymotion.com/thumbnail/video/${match[1]}`
  }

  // ── Vimeo ──
  match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (match) {
    return `https://vumbnail.com/${match[1]}.jpg`
  }

  // ── Bilibili ──
  match = url.match(/bilibili\.com\/(?:video\/|embed\/)(?:BV|bv|av)?([a-zA-Z0-9]+)/)
  if (match) {
    return `https://api.bilibili.com/x/web-interface/view?bvid=BV${match[1]}`
    // Note: Bilibili doesn't have a direct image URL, but we return the API URL
    // for the fallback screenshot to work
  }

  // ── Twitch ──
  match = url.match(/twitch\.tv\/videos\/(\d+)/)
  if (match) {
    return `https://static-cdn.jtvnw.net/s3_vods/${match[1]}/thumbnail.jpg`
  }
  match = url.match(/twitch\.tv\/([a-zA-Z0-9_]+)/)
  if (match) {
    return `https://static-cdn.jtvnw.net/previews-ttv/live_user_${match[1]}-640x360.jpg`
  }

  // ── Streamable ──
  match = url.match(/streamable\.com\/(?:e\/)?([a-zA-Z0-9]+)/)
  if (match) {
    return `https://cdn-b-east.streamable.com/image/${match[1]}`
  }

  // ── Rumble ──
  match = url.match(/rumble\.com\/embed\/([a-zA-Z0-9]+)/)
  if (match) {
    return `https://sp.rmbl.ws/s8/2/6/${match[1]}/thumbnail.jpg`
  }

  // ── LuluStream (new format: luluvid.com/e/) ──
  match = url.match(/luluvid\.com\/e\/([a-zA-Z0-9]+)/)
  if (match) {
    return `https://img.lulucdn.com/${match[1]}.jpg`
  }

  // ── LuluStream (old format: lulustream.com/embed-) ──
  match = url.match(/lulustream\.com\/embed-([a-zA-Z0-9]+)/)
  if (match) {
    return `https://img.lulucdn.com/${match[1]}.jpg`
  }

  // ── OK.ru ──
  match = url.match(/ok\.ru\/videoembed\/(\d+)/)
  if (match) {
    return null // OK.ru requires JS to get thumbnail, use screenshot fallback
  }

  // ── Facebook Video / Instagram / TikTok / X ──
  // These require OG scraping or screenshot, use screenshot fallback
  if (
    url.includes('facebook.com') ||
    url.includes('instagram.com') ||
    url.includes('tiktok.com') ||
    url.includes('x.com') ||
    url.includes('twitter.com')
  ) {
    return null
  }

  return null
}

/**
 * Generate a thumbnail URL for any embed URL
 * If the platform is known, returns a direct thumbnail URL
 * If unknown, returns a screenshot service URL
 */
export function getThumbnailUrl(embedUrl: string): string | null {
  if (!embedUrl) return null

  // Try known platform extraction first
  const direct = extractThumbnailFromEmbed(embedUrl)
  if (direct) return direct

  // Fallback: Use thum.io screenshot service
  // This captures a screenshot of the embed page
  const encoded = encodeURIComponent(embedUrl)
  return `https://image.thum.io/get/width/640/crop/360/noanimate/${encoded}`
}
