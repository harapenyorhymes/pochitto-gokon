import { NextRequest, NextResponse } from 'next/server'
import { createServiceSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  const channelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID

  // Determine base URL for callback routing
  const baseUrl = process.env.NEXTAUTH_URL || `${request.nextUrl.protocol}//${request.nextUrl.host}`
  const redirectUri = `${baseUrl}/api/auth/line/callback`
  const returnTo = normalizeReturnPath(request.nextUrl.searchParams.get('returnTo'))

  if (!channelId) {
    return NextResponse.json(
      { error: 'LINE Channel ID is not configured' },
      { status: 500 }
    )
  }

  console.log('LINE Login - Channel ID:', channelId)
  console.log('LINE Login - Redirect URI:', redirectUri)

  // Generate LINE login authorization URL
  const state = generateRandomState()
  const nonce = generateRandomNonce()

  // Persist OAuth state/nonce via Supabase for mobile environments
  try {
    const supabase = createServiceSupabaseClient()
    const payload: Record<string, any> = {
      state,
      nonce,
      used: false,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString() // Expires after 10 minutes
    }

    if (returnTo) {
      payload.return_to = returnTo
    }

    const { error: insertError } = await supabase
      .from('line_oauth_states')
      .insert(payload)

    if (insertError) {
      if (insertError.code === '42703') {
        console.warn('line_oauth_states.return_to column missing, retrying without return_to')
        const { error: fallbackError } = await supabase
          .from('line_oauth_states')
          .insert({
            state,
            nonce,
            used: false,
            expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
          })

        if (fallbackError) {
          console.error('Failed to save state to database (fallback):', fallbackError)
          return NextResponse.json(
            { error: 'Failed to initialize login session' },
            { status: 500 }
          )
        }
      } else {
        console.error('Failed to save state to database:', insertError)
        return NextResponse.json(
          { error: 'Failed to initialize login session' },
          { status: 500 }
        )
      }
    }

    console.log('LINE Login - State saved to database:', state)
  } catch (error) {
    console.error('Database error:', error)
    return NextResponse.json(
      { error: 'Failed to initialize login session' },
      { status: 500 }
    )
  }

  // Redirect to LINE authorization endpoint
  const response = NextResponse.redirect(
    `https://access.line.me/oauth2/v2.1/authorize?` +
    `response_type=code` +
    `&client_id=${channelId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${state}` +
    `&scope=profile%20openid%20email%20offline_access` +
    `&nonce=${nonce}` +
    `&prompt=consent` +
    `&bot_prompt=aggressive`
  )

  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')

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

function normalizeReturnPath(raw: string | null): string | null {
  if (!raw) return null

  try {
    const decoded = decodeURIComponent(raw)
    if (decoded.startsWith('/')) {
      return decoded
    }
    const url = new URL(decoded, 'https://placeholder.invalid')
    return url.pathname.startsWith('/') ? url.pathname : null
  } catch {
    return null
  }
}

