import { NextRequest, NextResponse } from 'next/server'
import { getFileList, getFileInfo } from '@/lib/lulustream'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const perPage = searchParams.get('per_page') || '20'
    const title = searchParams.get('title') || undefined

    const result = await getFileList({
      page: parseInt(page),
      perPage: parseInt(perPage),
      title,
    })

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('LuluStream files error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get file list' },
      { status: 500 }
    )
  }
}
