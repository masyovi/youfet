import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { categories, videos } from '@/lib/schema'
import { eq, and, sql } from 'drizzle-orm'

// DELETE /api/categories/[id] - Delete a category (cascade deletes videos)
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id))
      .limit(1)

    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    // Get videos count before deletion
    const [videoCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(videos)
      .where(eq(videos.categoryId, id))

    await db.delete(categories).where(eq(categories.id, id))

    return NextResponse.json({
      message: 'Category deleted successfully',
      deletedCategory: category,
      deletedVideosCount: videoCount?.count || 0,
    })
  } catch (error) {
    console.error('Error deleting category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
