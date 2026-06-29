import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories, videos } from '@/lib/schema'
import { sql, asc } from 'drizzle-orm'

// GET /api/categories - Return all categories ordered by name
export async function GET() {
  try {
    const cats = await db.select().from(categories).orderBy(asc(categories.name))

    // Get video counts for each category
    const counts = await db
      .select({
        categoryId: videos.categoryId,
        count: sql<number>`count(*)`,
      })
      .from(videos)
      .groupBy(videos.categoryId)

    const countMap = new Map(counts.map(c => [c.categoryId, c.count]))

    const result = cats.map(cat => ({
      ...cat,
      _count: {
        videos: countMap.get(cat.id) || 0,
      },
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    const slug = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')

    if (slug.length === 0) {
      return NextResponse.json(
        { error: 'Category name must contain valid characters' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const id = crypto.randomUUID()

    try {
      const [category] = await db
        .insert(categories)
        .values({
          id,
          name: name.trim(),
          slug,
          createdAt: now,
          updatedAt: now,
        })
        .returning()

      return NextResponse.json(category, { status: 201 })
    } catch (insertError: unknown) {
      if (
        insertError &&
        typeof insertError === 'object' &&
        'message' in insertError &&
        String(insertError.message).includes('UNIQUE')
      ) {
        return NextResponse.json(
          { error: 'A category with this name or slug already exists' },
          { status: 409 }
        )
      }
      throw insertError
    }
  } catch (error) {
    console.error('Error creating category:', error)
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    )
  }
}
