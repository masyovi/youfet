/**
 * Generate a URL-friendly slug from a string (typically video title)
 * Example: "April & Mei - Full Episode" → "april-mei-full-episode"
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    // Normalize: remove diacritics (é → e, ñ → n, etc.)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    // Replace & with 'and'
    .replace(/&/g, '-and-')
    // Replace non-alphanumeric (except hyphen) with hyphen
    .replace(/[^a-z0-9]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
}

/**
 * Ensure slug is unique by appending a numeric suffix if needed
 * Example: "april-mei" → "april-mei-2" (if "april-mei" already exists)
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  existingSlugs: string[],
  currentId?: string
): Promise<string> {
  // If this slug belongs to the current video being edited, it's fine
  if (existingSlugs.includes(baseSlug) && currentId) {
    // Check if it's our own slug
    return baseSlug
  }

  if (!existingSlugs.includes(baseSlug)) {
    return baseSlug
  }

  let counter = 2
  let slug = `${baseSlug}-${counter}`
  while (existingSlugs.includes(slug)) {
    counter++
    slug = `${baseSlug}-${counter}`
  }
  return slug
}
