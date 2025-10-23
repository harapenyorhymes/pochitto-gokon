import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

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

  // stateとnonceをデータベースに保存（モバイルでCookieが保持されない問題に対応）
  try {
    const supabase = createServiceSupabaseClient()
    const { error: insertError } = await supabase
      .from('line_oauth_states')
      .insert({
        state,
        nonce,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // 10分後
      })

    if (insertError) {
      console.error('Failed to save state to database:', insertError)
      return NextResponse.json(
        { error: 'Failed to initialize login session' },
        { status: 500 }
      )
    }

    console.log('LINE Login - State saved to database:', state)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize login session' },
      { status: 500 }
    )
  }

  // LINEの認証URLにリダイレクト
  const response = NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?` +
    `response_type=code` +
    `&client_id=${channelId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&scope=profile%20openid%20email` +
    `&nonce=${nonce}`
  )

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
