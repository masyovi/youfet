import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { admins, categories, videos } from '@/lib/schema'
import { eq, sql } from 'drizzle-orm'

// POST /api/seed - Seed the database with sample data
export async function POST() {
  try {
    // Seed default admin
    const [existingAdmin] = await db.select().from(admins).limit(1)

    if (!existingAdmin) {
      const now = new Date().toISOString()
      await db.insert(admins).values({
        id: crypto.randomUUID(),
        username: 'media',
        password: 'warkop88',
        name: 'Administrator',
        createdAt: now,
        updatedAt: now,
      })
      console.log('✅ Default admin created')
    } else {
      await db
        .update(admins)
        .set({ username: 'media', password: 'warkop88' })
        .where(eq(admins.id, existingAdmin.id))
      console.log('✅ Admin credentials updated')
    }

    // Seed categories
    const categoryNames = ['Film', 'Musik', 'Gaming', 'Edukasi', 'Olahraga']
    const categoriesMap: Record<string, string> = {}

    for (const name of categoryNames) {
      const [existing] = await db
        .select()
        .from(categories)
        .where(eq(categories.name, name))
        .limit(1)

      if (!existing) {
        const now = new Date().toISOString()
        const [category] = await db
          .insert(categories)
          .values({
            id: crypto.randomUUID(),
            name,
            slug: name.toLowerCase(),
            createdAt: now,
            updatedAt: now,
          })
          .returning()
        categoriesMap[name] = category.id
        console.log(`✅ Category "${name}" created`)
      } else {
        categoriesMap[name] = existing.id
        console.log(`⏭️  Category "${name}" already exists, skipping`)
      }
    }

    // Seed sample videos
    const sampleVideos = [
      {
        title: 'Behind the Scenes: Film Making Masterclass',
        description: 'Learn the art of filmmaking from industry professionals.',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        category: 'Film',
        featured: true,
      },
      {
        title: 'Top 10 Movies You Must Watch in 2024',
        description: 'A curated list of the most anticipated films this year.',
        embedUrl: 'https://www.youtube.com/embed/5qap5aO4i9A',
        thumbnailUrl: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
        category: 'Film',
        featured: false,
      },
      {
        title: 'Documentary: The Art of Storytelling',
        description: 'Explore how great stories are crafted and told through cinema.',
        embedUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
        thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg',
        category: 'Film',
        featured: false,
      },
      {
        title: 'Lofi Hip Hop Radio - Beats to Relax/Study To',
        description: 'Chill beats perfect for studying, working, or just relaxing.',
        embedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
        thumbnailUrl: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
        category: 'Musik',
        featured: true,
      },
      {
        title: 'Acoustic Guitar Session - Live Performance',
        description: 'Beautiful acoustic guitar covers of popular songs.',
        embedUrl: 'https://www.youtube.com/embed/1w7OgIMMRc4',
        thumbnailUrl: 'https://img.youtube.com/vi/1w7OgIMMRc4/hqdefault.jpg',
        category: 'Musik',
        featured: false,
      },
      {
        title: 'Music Theory Explained Simply',
        description: 'Understanding the fundamentals of music theory for beginners.',
        embedUrl: 'https://www.youtube.com/embed/smEQqVatMhA',
        thumbnailUrl: 'https://img.youtube.com/vi/smEQqVatMhA/hqdefault.jpg',
        category: 'Musik',
        featured: false,
      },
      {
        title: 'Epic Gaming Moments Compilation',
        description: 'The most incredible and funny gaming moments of the year.',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        category: 'Gaming',
        featured: true,
      },
      {
        title: 'Pro Player Tips: How to Rank Up Fast',
        description: 'Tips and strategies from professional gamers.',
        embedUrl: 'https://www.youtube.com/embed/5qap5aO4i9A',
        thumbnailUrl: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
        category: 'Gaming',
        featured: false,
      },
      {
        title: 'Game Review: Latest Open World RPG',
        description: 'An in-depth review of the newest open world RPG release.',
        embedUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
        thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg',
        category: 'Gaming',
        featured: false,
      },
      {
        title: 'Learn Programming in 30 Minutes',
        description: 'A beginner-friendly introduction to programming concepts.',
        embedUrl: 'https://www.youtube.com/embed/jfKfPfyJRdk',
        thumbnailUrl: 'https://img.youtube.com/vi/jfKfPfyJRdk/hqdefault.jpg',
        category: 'Edukasi',
        featured: true,
      },
      {
        title: 'Understanding Artificial Intelligence',
        description: 'A comprehensive guide to AI and machine learning.',
        embedUrl: 'https://www.youtube.com/embed/1w7OgIMMRc4',
        thumbnailUrl: 'https://img.youtube.com/vi/1w7OgIMMRc4/hqdefault.jpg',
        category: 'Edukasi',
        featured: false,
      },
      {
        title: 'Science Experiments You Can Do at Home',
        description: 'Fun and educational science experiments for all ages.',
        embedUrl: 'https://www.youtube.com/embed/smEQqVatMhA',
        thumbnailUrl: 'https://img.youtube.com/vi/smEQqVatMhA/hqdefault.jpg',
        category: 'Edukasi',
        featured: false,
      },
      {
        title: 'Best Sports Highlights of 2024',
        description: 'The most exciting moments from the world of sports this year.',
        embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
        category: 'Olahraga',
        featured: true,
      },
      {
        title: 'Home Workout: 15-Min Full Body Routine',
        description: 'Get fit with this quick and effective full body workout.',
        embedUrl: 'https://www.youtube.com/embed/5qap5aO4i9A',
        thumbnailUrl: 'https://img.youtube.com/vi/5qap5aO4i9A/hqdefault.jpg',
        category: 'Olahraga',
        featured: false,
      },
      {
        title: 'Football Skills Tutorial for Beginners',
        description: 'Master the basics of football with step-by-step tutorials.',
        embedUrl: 'https://www.youtube.com/embed/jNQXAC9IVRw',
        thumbnailUrl: 'https://img.youtube.com/vi/jNQXAC9IVRw/hqdefault.jpg',
        category: 'Olahraga',
        featured: false,
      },
    ]

    for (const videoData of sampleVideos) {
      const categoryId = categoriesMap[videoData.category]
      if (!categoryId) {
        console.log(`⚠️  Category "${videoData.category}" not found, skipping video`)
        continue
      }

      // Check if video already exists
      const [existingVideo] = await db
        .select()
        .from(videos)
        .where(eq(videos.title, videoData.title))
        .limit(1)

      if (!existingVideo) {
        const now = new Date().toISOString()
        await db.insert(videos).values({
          id: crypto.randomUUID(),
          title: videoData.title,
          description: videoData.description,
          embedUrl: videoData.embedUrl,
          thumbnailUrl: videoData.thumbnailUrl,
          categoryId,
          featured: videoData.featured,
          createdAt: now,
          updatedAt: now,
        })
        console.log(`✅ Video "${videoData.title}" created`)
      } else {
        console.log(`⏭️  Video "${videoData.title}" already exists, skipping`)
      }
    }

    // Return summary
    const [adminCount] = await db.select({ count: sql<number>`count(*)` }).from(admins)
    const [categoryCount] = await db.select({ count: sql<number>`count(*)` }).from(categories)
    const [videoCount] = await db.select({ count: sql<number>`count(*)` }).from(videos)
    const [featuredCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(videos)
      .where(eq(videos.featured, true))

    return NextResponse.json({
      success: true,
      message: 'Database seeded successfully',
      data: {
        admins: adminCount?.count || 0,
        categories: categoryCount?.count || 0,
        videos: videoCount?.count || 0,
        featuredVideos: featuredCount?.count || 0,
      },
    })
  } catch (error) {
    console.error('Error seeding database:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to seed database' },
      { status: 500 }
    )
  }
}
