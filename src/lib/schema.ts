import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const admins = sqliteTable('Admin', {
  id: text('id').primaryKey(),
  username: text('username').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
})

export const categories = sqliteTable('Category', {
  id: text('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
})

export const videos = sqliteTable('Video', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  embedUrl: text('embedUrl').notNull(),
  thumbnailUrl: text('thumbnailUrl'),
  categoryId: text('categoryId').notNull().references(() => categories.id, { onDelete: 'cascade' }),
  views: integer('views').notNull().default(0),
  featured: integer('featured', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('createdAt').notNull(),
  updatedAt: text('updatedAt').notNull(),
})
