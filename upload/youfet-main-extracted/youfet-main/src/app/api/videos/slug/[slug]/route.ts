import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { videos, categories } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'

// GET /api/videos/slug/[slug] - Get a single video by slug (increment views)
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

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
      .where(eq(videos.slug, slug))
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
      .where(eq(videos.id, row.id))

    const result = {
      ...row,
      category: row.category.id ? row.category : null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching video by slug:', error)
    return NextResponse.json(
      { error: 'Failed to fetch video' },
      { status: 500 }
    )
  }
}
