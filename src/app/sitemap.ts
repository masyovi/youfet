import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { videos } from '@/lib/schema'
import { eq, isNotNull } from 'drizzle-orm'

const SITE_URL = 'https://youfet.site'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  try {
    const allVideos = await db
      .select({
        slug: videos.slug,
        updatedAt: videos.updatedAt,
      })
      .from(videos)
      .where(isNotNull(videos.slug))

    const videoEntries: MetadataRoute.Sitemap = allVideos.map((video) => ({
      url: `${SITE_URL}/video/${video.slug}`,
      lastModified: new Date(video.updatedAt),
      changeFrequency: 'weekly',
      priority: 0.8,
    }))

    return [
      {
        url: SITE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
      ...videoEntries,
    ]
  } catch {
    return [
      {
        url: SITE_URL,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 1.0,
      },
    ]
  }
}
