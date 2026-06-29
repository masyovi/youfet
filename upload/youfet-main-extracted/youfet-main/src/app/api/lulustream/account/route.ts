import { NextResponse } from 'next/server'
import { getAccountInfo } from '@/lib/lulustream'

export async function GET() {
  try {
    const info = await getAccountInfo()
    return NextResponse.json({ success: true, ...info })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to get account info'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
