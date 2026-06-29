import { createClient } from '@libsql/client'

const TURSO_URL = process.env.TURSO_DATABASE_URL!
const TURSO_TOKEN = process.env.TURSO_AUTH_TOKEN!

async function pushToTurso() {
  console.log('🔗 Connecting to Turso...')
  const client = createClient({
    url: TURSO_URL,
    authToken: TURSO_TOKEN,
  })

  console.log('📋 Creating tables on Turso...')

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Admin" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "username" TEXT NOT NULL,
      "password" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `)
  console.log('  ✅ Admin table created')

  await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "Admin_username_key" ON "Admin"("username")`)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Category" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT NOT NULL,
      "slug" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL
    )
  `)
  console.log('  ✅ Category table created')

  await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "Category_name_key" ON "Category"("name")`)
  await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "Category_slug_key" ON "Category"("slug")`)

  await client.execute(`
    CREATE TABLE IF NOT EXISTS "Video" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "title" TEXT NOT NULL,
      "description" TEXT,
      "embedUrl" TEXT NOT NULL,
      "thumbnailUrl" TEXT,
      "categoryId" TEXT NOT NULL,
      "views" INTEGER NOT NULL DEFAULT 0,
      "featured" BOOLEAN NOT NULL DEFAULT 0,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL,
      FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE
    )
  `)
  console.log('  ✅ Video table created')

  await client.execute(`CREATE INDEX IF NOT EXISTS "Video_categoryId_idx" ON "Video"("categoryId")`)

  console.log('🎉 All tables created successfully on Turso!')

  // Verify
  const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'")
  console.log('\n📊 Tables in Turso:')
  tables.rows.forEach(row => console.log(`  - ${row.name}`))

  await client.close()
}

pushToTurso().catch(console.error)
