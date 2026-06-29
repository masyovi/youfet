import { NextRequest, NextResponse } from 'next/server'
import { getThumbnailUrl, extractThumbnailFromEmbed } from '@/lib/thumbnail'

/**
 * POST /api/thumbnail - Generate thumbnail URL from embed URL
 * Returns { thumbnailUrl, source } where source is 'direct' or 'screenshot'
 */
export async function POST(request: NextRequest) {
  try {
    const { embedUrl } = await request.json()

    if (!embedUrl || typeof embedUrl !== 'string' || embedUrl.trim().length === 0) {
      return NextResponse.json(
        { error: 'Embed URL is required' },
        { status: 400 }
      )
    }

    const trimmedUrl = embedUrl.trim()
    const direct = extractThumbnailFromEmbed(trimmedUrl)

    if (direct) {
      return NextResponse.json({
        thumbnailUrl: direct,
        source: 'direct',
      })
    }

    // Use screenshot service for unknown embed URLs
    const encoded = encodeURIComponent(trimmedUrl)
    const screenshotUrl = `https://image.thum.io/get/width/640/crop/360/noanimate/${encoded}`

    return NextResponse.json({
      thumbnailUrl: screenshotUrl,
      source: 'screenshot',
    })
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    return NextResponse.json(
      { error: 'Failed to generate thumbnail' },
      { status: 500 }
    )
  }
}
