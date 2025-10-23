import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'

interface LineTokenResponse {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
  scope: string
  id_token: string
}

interface LineProfile {
  userId: string
  displayName: string
  pictureUrl?: string
  statusMessage?: string
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')

  // エラーチェック
  if (error) {
    console.error('LINE Login error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, requestUrl.origin)
    )
  }

  // state の検証
  const savedState = request.cookies.get('line_state')?.value
  if (!state || state !== savedState) {
    console.error('State mismatch or missing')
    return NextResponse.redirect(
      new URL('/login?error=invalid_state', requestUrl.origin)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=missing_code', requestUrl.origin)
    )
  }

  try {
    // LINE からアクセストークンを取得
    const tokenResponse = await exchangeCodeForToken(code)

    // LINE プロフィール情報を取得
    const profile = await getLineProfile(tokenResponse.access_token)

    // Supabase でユーザーを作成/取得
    const supabaseUser = await findOrCreateSupabaseUser(profile, tokenResponse)

    // Supabase セッションを作成
    const supabase = createServerSupabaseClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: `line_${profile.userId}@line.local`,
      password: tokenResponse.access_token
    })

    if (signInError) {
      console.error('Failed to create Supabase session:', signInError)

      // ユーザーが存在しない場合は作成
      const { error: signUpError } = await supabase.auth.signUp({
        email: `line_${profile.userId}@line.local`,
        password: tokenResponse.access_token,
        options: {
          data: {
            line_user_id: profile.userId,
            display_name: profile.displayName,
            picture_url: profile.pictureUrl
          }
        }
      })

      if (signUpError) {
        console.error('Failed to create Supabase user:', signUpError)
        return NextResponse.redirect(
          new URL('/login?error=signup_failed', requestUrl.origin)
        )
      }
    }

    // プロフィール確認してリダイレクト
    const redirectPath = await determinePostLoginRedirect(supabaseUser.id)

    const response = NextResponse.redirect(new URL(redirectPath, requestUrl.origin))

    // Cookie をクリア
    response.cookies.delete('line_state')
    response.cookies.delete('line_nonce')

    return response

  } catch (err) {
    console.error('LINE callback error:', err)
    return NextResponse.redirect(
      new URL('/login?error=callback_failed', requestUrl.origin)
    )
  }
}

async function exchangeCodeForToken(code: string): Promise<LineTokenResponse> {
  const channelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID!
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET!
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/auth/line/callback`

  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    client_id: channelId,
    client_secret: channelSecret
  })

  const response = await fetch('https://api.line.me/oauth2/v2.1/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Token exchange failed:', errorData)
    throw new Error('Failed to exchange code for token')
  }

  return await response.json()
}

async function getLineProfile(accessToken: string): Promise<LineProfile> {
  const response = await fetch('https://api.line.me/v2/profile', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Failed to get LINE profile:', errorData)
    throw new Error('Failed to get LINE profile')
  }

  return await response.json()
}

async function findOrCreateSupabaseUser(profile: LineProfile, tokenResponse: LineTokenResponse) {
  const serviceSupabase = createServiceSupabaseClient()

  // LINE User ID で既存ユーザーを検索
  const { data: existingUser, error: findError } = await serviceSupabase
    .from('users')
    .select('id')
    .eq('line_user_id', profile.userId)
    .maybeSingle()

  if (existingUser) {
    return existingUser
  }

  // 新規ユーザーを作成
  const email = `line_${profile.userId}@line.local`

  // Supabase Auth にユーザーを作成
  const supabase = createServerSupabaseClient()
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: tokenResponse.access_token,
    options: {
      data: {
        line_user_id: profile.userId,
        display_name: profile.displayName,
        picture_url: profile.pictureUrl
      }
    }
  })

  if (authError || !authData.user) {
    console.error('Failed to create auth user:', authError)
    throw new Error('Failed to create user')
  }

  // users テーブルに追加
  const { data: newUser, error: insertError } = await serviceSupabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      line_user_id: profile.userId,
      is_active: true
    })
    .select()
    .single()

  if (insertError) {
    console.error('Failed to insert user record:', insertError)
    throw new Error('Failed to create user record')
  }

  return newUser
}

async function determinePostLoginRedirect(userId: string) {
  try {
    const serviceSupabase = createServiceSupabaseClient()
    const { data: profile, error } = await serviceSupabase
      .from('profiles')
      .select('is_complete')
      .eq('id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('Failed to fetch profile status:', error)
      return '/'
    }

    if (!profile || profile.is_complete === false) {
      return '/profile/create?source=line'
    }

    return '/'
  } catch (error) {
    console.error('Unexpected error checking profile:', error)
    return '/'
  }
}
