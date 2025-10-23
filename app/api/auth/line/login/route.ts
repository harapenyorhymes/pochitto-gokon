import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const channelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID

  // リクエストURLからベースURLを取得
  const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
  const redirectUri = `${baseUrl}/api/auth/line/callback`

  if (!channelId) {
    return NextResponse.json(
      { error: 'LINE Channel ID is not configured' },
      { status: 500 }
    )
  }

  console.log('LINE Login - Channel ID:', channelId)
  console.log('LINE Login - Redirect URI:', redirectUri)

  // LINE Login URL を生成
  const state = generateRandomState()
  const nonce = generateRandomNonce()

  // state と nonce をセッションに保存（本番環境では secure cookie を使用）
  const response = NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?` +
    `response_type=code` +
    `&client_id=${channelId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&scope=profile%20openid%20email` +
    `&nonce=${nonce}`
  )

  // state と nonce を cookie に保存
  response.cookies.set('line_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600 // 10分
  })

  response.cookies.set('line_nonce', nonce, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600
  })

  return response
}

function generateRandomState(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

function generateRandomNonce(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
