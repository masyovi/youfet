import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { videos, categories } from '@/lib/schema'
import { eq, desc, sql, like, or, and } from 'drizzle-orm'
import { getThumbnailUrl } from '@/lib/thumbnail'
import { generateSlug } from '@/lib/slug'

// GET /api/videos - Get videos with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const limit = searchParams.get('limit')

    const conditions = []

    if (categoryId) {
      conditions.push(eq(videos.categoryId, categoryId))
    }

    if (search) {
      conditions.push(
        or(
          like(videos.title, `%${search}%`),
          like(videos.description, `%${search}%`)
        )!
      )
    }

    if (featured !== null && featured !== undefined && featured !== '') {
      conditions.push(eq(videos.featured, featured === 'true'))
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined

    let query = db
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
      .where(whereClause)
      .orderBy(desc(videos.createdAt))

    if (limit) {
      query = query.limit(parseInt(limit, 10))
    }

    const result = await query

    const formatted = result.map(row => ({
      ...row,
      category: row.category.id ? row.category : null,
    }))

    return NextResponse.json(formatted)
  } catch (error) {
    console.error('Error fetching videos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    )
  }
}

// POST /api/videos - Create a new video
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, description, embedUrl, thumbnailUrl, categoryId, featured, slug } = body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      )
    }

    if (!embedUrl || typeof embedUrl !== 'string' || embedUrl.trim().length === 0) {
      return NextResponse.json(
        { error: 'Embed URL is required' },
        { status: 400 }
      )
    }

    if (!categoryId || typeof categoryId !== 'string') {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // Verify the category exists
    const [categoryExists] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, categoryId))
      .limit(1)

    if (!categoryExists) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    // Generate slug from title (or use provided slug)
    let finalSlug = slug?.trim() ? slug.trim() : generateSlug(title.trim())
    if (!finalSlug) finalSlug = `video-${id.slice(0, 8)}`

    // Ensure slug uniqueness
    const existingVideos = await db
      .select({ slug: videos.slug })
      .from(videos)
      .where(eq(videos.slug, finalSlug))
      .limit(1)

    if (existingVideos.length > 0) {
      let counter = 2
      let candidateSlug = `${finalSlug}-${counter}`
      while (true) {
        const check = await db
          .select({ slug: videos.slug })
          .from(videos)
          .where(eq(videos.slug, candidateSlug))
          .limit(1)
        if (check.length === 0) break
        counter++
        candidateSlug = `${finalSlug}-${counter}`
      }
      finalSlug = candidateSlug
    }

    // Auto-extract thumbnail from embed URL if not provided
    const finalThumbnailUrl = thumbnailUrl?.trim() || getThumbnailUrl(embedUrl.trim())

    try {
      const [video] = await db
        .insert(videos)
        .values({
          id,
          title: title.trim(),
          slug: finalSlug,
          description: description?.trim() || null,
          embedUrl: embedUrl.trim(),
          thumbnailUrl: finalThumbnailUrl,
          categoryId,
          featured: featured === true,
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      const result = {
        ...video,
        category: categoryExists,
      }

      return NextResponse.json(result, { status: 201 })
    } catch (insertError: unknown) {
      if (
        insertError &&
        typeof insertError === 'object' &&
        'message' in insertError &&
        String(insertError.message).includes('FOREIGN KEY')
      ) {
        return NextResponse.json(
          { error: 'Invalid category ID' },
          { status: 400 }
        )
      }
      throw insertError
    }
  } catch (error) {
    console.error('Error creating video:', error)
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    )
  }
}
