import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { admins } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { cookies } from 'next/headers'

// POST /api/auth - Admin login
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password } = body

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username and password are required' },
        { status: 400 }
      )
    }

    const [admin] = await db
      .select()
      .from(admins)
      .where(eq(admins.username, username))
      .limit(1)

    if (!admin || admin.password !== password) {
      return NextResponse.json(
        { success: false, message: 'Invalid credentials' },
        { status: 401 }
      )
    }

    const cookieStore = await cookies()
    cookieStore.set('youfet_auth', admin.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    return NextResponse.json({
      success: true,
      admin: {
        id: admin.id,
        name: admin.name,
        username: admin.username,
      },
    })
  } catch (error) {
    console.error('Error during login:', error)
    return NextResponse.json(
      { success: false, message: 'Login failed' },
      { status: 500 }
    )
  }
}
