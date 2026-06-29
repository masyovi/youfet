import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { admins } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

// GET /api/auth/verify - Verify admin session
export async function GET() {
  try {
    const cookieStore = await cookies()
    const adminId = cookieStore.get('youfet_auth')?.value

    if (!adminId) {
      return NextResponse.json({ authenticated: false, admin: null })
    }

    const [admin] = await db
      .select({
        id: admins.id,
        name: admins.name,
        username: admins.username,
        createdAt: admins.createdAt,
      })
      .from(admins)
      .where(eq(admins.id, adminId))
      .limit(1)

    if (!admin) {
      return NextResponse.json({ authenticated: false, admin: null })
    }

    return NextResponse.json({
      authenticated: true,
      admin,
    })
  } catch (error) {
    console.error('Error verifying session:', error)
    return NextResponse.json(
      { authenticated: false, admin: null, error: 'Verification failed' },
      { status: 500 }
    )
  }
}
