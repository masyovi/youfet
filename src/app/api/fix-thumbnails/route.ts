import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { videos } from '@/lib/schema'
import { isNull } from 'drizzle-orm'
import { extractThumbnailFromEmbed } from '@/lib/thumbnail'

// POST /api/fix-thumbnails - Auto-extract thumbnails for videos that don't have one
export async function POST() {
  try {
    // Find all videos with null thumbnailUrl
    const videosWithoutThumb = await db
      .select()
      .from(videos)
      .where(isNull(videos.thumbnailUrl))

    if (videosWithoutThumb.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All videos already have thumbnails',
        updated: 0,
      })
    }

    let updated = 0
    for (const video of videosWithoutThumb) {
      const thumbnail = extractThumbnailFromEmbed(video.embedUrl)
      if (thumbnail) {
        await db
          .update(videos)
          .set({ thumbnailUrl: thumbnail, updatedAt: new Date().toISOString() })
          .where(videos.id.eq(video.id))
        updated++
        console.log(`✅ Thumbnail updated for: ${video.title}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated ${updated} of ${videosWithoutThumb.length} videos`,
      updated,
      total: videosWithoutThumb.length,
    })
  } catch (error) {
    console.error('Error fixing thumbnails:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fix thumbnails' },
      { status: 500 }
    )
  }
}
