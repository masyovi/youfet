import { NextRequest, NextResponse } from 'next/server'
import { uploadByUrl } from '@/lib/lulustream'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { url, title } = body

    if (!url) {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    const result = await uploadByUrl(url, {
      filePublic: 1,
    })

    return NextResponse.json({
      success: true,
      filecode: result.filecode,
    })
  } catch (error) {
    console.error('LuluStream URL upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload by URL failed' },
      { status: 500 }
    )
  }
}
