import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    // 1. Read form data FIRST
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = formData.get('title') as string | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // 2. Check API key early
    const apiKey = process.env.LULUSTREAM_API_KEY
    if (!apiKey || apiKey === 'your_api_key_here') {
      return NextResponse.json(
        { success: false, error: 'LuluStream API key is not configured. Set LULUSTREAM_API_KEY in .env file.' },
        { status: 500 }
      )
    }

    // 3. Read file into buffer immediately (can't re-read stream)
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name
    const fileType = file.type || 'video/mp4'
    const fileSize = fileBuffer.length

    console.log(`[LuluStream Upload] File: ${fileName} (${(fileSize / 1024 / 1024).toFixed(2)} MB)`)

    // 4. Get upload server
    const serverRes = await fetch(
      `https://api.lulustream.com/api/upload/server?key=${apiKey}`,
      { redirect: 'follow' }
    )
    const serverJson = await serverRes.json()

    if (serverJson.status !== 200) {
      console.error('[LuluStream Upload] Server error:', serverJson.msg)
      return NextResponse.json(
        { success: false, error: `LuluStream: ${serverJson.msg || 'Failed to get upload server'}` },
        { status: 500 }
      )
    }

    const uploadServer = serverJson.result as string
    console.log(`[LuluStream Upload] Upload server: ${uploadServer}`)

    // 5. Build multipart form for LuluStream
    const boundary = '----FormBoundary' + Math.random().toString(36).substring(2)
    const parts: Buffer[] = []

    // Key field
    parts.push(
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="key"\r\n\r\n${apiKey}\r\n`)
    )

    // File field
    parts.push(
      Buffer.from(
        `--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="${fileName}"\r\nContent-Type: ${fileType}\r\n\r\n`
      )
    )
    parts.push(fileBuffer)
    parts.push(Buffer.from('\r\n'))

    // Title field (optional)
    if (title) {
      parts.push(
        Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file_title"\r\n\r\n${title}\r\n`)
      )
    }

    // Public flag
    parts.push(
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file_public"\r\n\r\n1\r\n`)
    )

    // Closing boundary
    parts.push(Buffer.from(`--${boundary}--\r\n`))

    const body = Buffer.concat(parts)

    // 6. Upload to LuluStream
    console.log(`[LuluStream Upload] Uploading ${(body.length / 1024 / 1024).toFixed(2)} MB to ${uploadServer}...`)

    const uploadRes = await fetch(uploadServer, {
      method: 'POST',
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    })

    const uploadJson = await uploadRes.json()
    console.log(`[LuluStream Upload] Response:`, JSON.stringify(uploadJson))

    if (uploadJson.status !== 200) {
      return NextResponse.json(
        { success: false, error: uploadJson.msg || 'LuluStream upload failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      files: uploadJson.files || [],
    })
  } catch (error) {
    console.error('[LuluStream Upload] Error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to upload file to LuluStream',
      },
      { status: 500 }
    )
  }
}
