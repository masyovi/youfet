import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { videos, categories } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'

// POST /api/videos/[id]/views - Increment video views
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [video] = await db
      .select()
      .from(videos)
      .where(eq(videos.id, id))
      .limit(1)

    if (!video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    await db
      .update(videos)
      .set({ views: sql`${videos.views} + 1` })
      .where(eq(videos.id, id))

    const [updated] = await db
      .select({ views: videos.views })
      .from(videos)
      .where(eq(videos.id, id))
      .limit(1)

    return NextResponse.json({
      views: updated?.views || 0,
      message: 'View incremented successfully',
    })
  } catch (error) {
    console.error('Error incrementing views:', error)
    return NextResponse.json(
      { error: 'Failed to increment views' },
      { status: 500 }
    )
  }
}
