import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

// POST /api/auth/logout - Logout and clear auth cookie
export async function POST() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete('youfet_auth')

    return NextResponse.json({ success: true, message: 'Logged out successfully' })
  } catch (error) {
    console.error('Error during logout:', error)
    return NextResponse.json(
      { success: false, message: 'Logout failed' },
      { status: 500 }
    )
  }
}
