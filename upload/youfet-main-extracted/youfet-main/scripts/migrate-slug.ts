import { db } from '../src/lib/db'
import { videos } from '../src/lib/schema'
import { eq } from 'drizzle-orm'
import { generateSlug } from '../src/lib/slug'

async function migrate() {
  console.log('🏃 Starting slug migration...')

  try {
    // 1. Add slug column if it doesn't exist
    console.log('📋 Adding slug column to Video table...')
    try {
      await db.run(`ALTER TABLE Video ADD COLUMN slug TEXT NOT NULL DEFAULT ''`)
      console.log('✅ Column "slug" added')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('duplicate column name') || msg.includes('already exists')) {
        console.log('ℹ️  Column "slug" already exists, skipping...')
      } else {
        throw err
      }
    }

    // 2. Fetch all videos
    console.log('📋 Fetching all videos...')
    const allVideos = await db.select().from(videos)
    console.log(`📊 Found ${allVideos.length} videos`)

    // 3. Generate unique slugs for each video
    console.log('🔧 Generating slugs...')
    const usedSlugs = new Set<string>()

    for (const video of allVideos) {
      let slug = generateSlug(video.title)
      if (!slug) {
        slug = `video-${video.id.slice(0, 8)}`
      }

      // Ensure uniqueness
      let finalSlug = slug
      let counter = 2
      while (usedSlugs.has(finalSlug)) {
        finalSlug = `${slug}-${counter}`
        counter++
      }

      usedSlugs.add(finalSlug)

      // Update the video
      await db
        .update(videos)
        .set({ slug: finalSlug })
        .where(eq(videos.id, video.id))

      console.log(`  ✅ "${video.title}" → /video/${finalSlug}`)
    }

    // 4. Add unique constraint (create unique index)
    console.log('📋 Creating unique index on slug...')
    try {
      await db.run(`CREATE UNIQUE INDEX IF NOT EXISTS idx_video_slug ON Video(slug)`)
      console.log('✅ Unique index created')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes('already exists')) {
        console.log('ℹ️  Index already exists, skipping...')
      } else {
        throw err
      }
    }

    console.log('🎉 Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

migrate()
