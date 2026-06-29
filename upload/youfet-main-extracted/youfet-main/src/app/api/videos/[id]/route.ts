import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { videos, categories } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'
import { getThumbnailUrl } from '@/lib/thumbnail'

// GET /api/videos/[id] - Get a single video by ID (increment views)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const rows = await db
      .select({
        id: videos.id,
        title: videos.title,
        slug: videos.slug,
        description: videos.description,
        embedUrl: videos.embedUrl,
        thumbnailUrl: videos.thumbnailUrl,
        categoryId: videos.categoryId,
        views: videos.views,
        featured: videos.featured,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        },
      })
      .from(videos)
      .leftJoin(categories, eq(videos.categoryId, categories.id))
      .where(eq(videos.id, id))
      .limit(1)

    const row = rows[0]
    if (!row) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    // Increment views by 1
    await db
      .update(videos)
      .set({ views: sql`${videos.views} + 1` })
      .where(eq(videos.id, id))

    const result = {
      ...row,
      category: row.category.id ? row.category : null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching video:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    )
  }
}

// PUT /api/videos/[id] - Update a video
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    const [existingVideo] = await db
      .select()
      .from(videos)
      .where(eq(videos.id, id))
      .limit(1)

    if (!existingVideo) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      )
    }

    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    }

    if (body.title !== undefined) {
      updateData.title = body.title.trim()
    }
    if (body.description !== undefined) {
      updateData.description = body.description?.trim() || null
    }
    if (body.embedUrl !== undefined) {
      updateData.embedUrl = body.embedUrl.trim()
    }
    if (body.thumbnailUrl !== undefined) {
      updateData.thumbnailUrl = body.thumbnailUrl?.trim() || null
    }
    if (body.slug !== undefined) {
      updateData.slug = body.slug.trim()
    }
    if (body.categoryId !== undefined) {
      updateData.categoryId = body.categoryId
    }
    if (body.featured !== undefined) {
      updateData.featured = body.featured === true
    }

    // Auto-extract thumbnail if embedUrl changed and thumbnailUrl not explicitly provided
    if (body.embedUrl !== undefined && body.thumbnailUrl === undefined) {
      const extractedThumbnail = getThumbnailUrl(body.embedUrl.trim())
      if (extractedThumbnail) {
        updateData.thumbnailUrl = extractedThumbnail
      }
    }

    await db
      .update(videos)
      .set(updateData)
      .where(eq(videos.id, id))

    // Fetch updated video with category
    const rows = await db
      .select({
        id: videos.id,
        title: videos.title,
        slug: videos.slug,
        description: videos.description,
        embedUrl: videos.embedUrl,
        thumbnailUrl: videos.thumbnailUrl,
        categoryId: videos.categoryId,
        views: videos.views,
        featured: videos.featured,
        createdAt: videos.createdAt,
        updatedAt: videos.updatedAt,
        category: {
          id: categories.id,
          name: categories.name,
          slug: categories.slug,
          createdAt: categories.createdAt,
          updatedAt: categories.updatedAt,
        },
      })
      .from(videos)
      .leftJoin(categories, eq(videos.categoryId, categories.id))
      .where(eq(videos.id, id))
      .limit(1)

    const result = {
      ...rows[0],
      category: rows[0]?.category?.id ? rows[0].category : null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error updating video:', error)
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    )
  }
}

// DELETE /api/videos/[id] - Delete a video
export async function DELETE(
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

    await db.delete(videos).where(eq(videos.id, id))

    return NextResponse.json({
      message: 'Video deleted successfully',
      deletedVideo: video,
    })
  } catch (error) {
    console.error('Error deleting video:', error)
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    )
  }
}
