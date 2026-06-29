import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const apiKey = process.env.LULUSTREAM_API_KEY
    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json(
        { success: false, error: 'LuluStream API key is not configured' },
        { status: 500 }
      )
    }

    // Return upload server URL and API key
    // The file upload happens directly from browser → LuluStream (bypasses size limits)
    const serverRes = await fetch(
      `https://api.lulustream.com/api/upload/server?key=${apiKey}`,
      { redirect: 'follow' }
    )
    const serverJson = await serverRes.json()

    if (serverJson.status !== 200) {
      return NextResponse.json(
        { success: false, error: serverJson.msg || 'Failed to get upload server' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      uploadServer: serverJson.result,
      apiKey,
    })
  } catch (error) {
    console.error('[LuluStream Upload Server] Error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to get upload server' },
      { status: 500 }
    )
  }
}
