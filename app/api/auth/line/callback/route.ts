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
    const tokenResponse = await exchangeCodeForToken(code, requestUrl)

    // LINE プロフィール情報を取得
    const profile = await getLineProfile(tokenResponse.access_token)

    console.log('LINE Profile:', profile)

    // Supabase でユーザーを作成/取得してセッションを確立
    const { user, isNewUser, sessionToken } = await findOrCreateSupabaseUser(profile, tokenResponse, requestUrl)

    console.log('User created/found:', user.id, 'isNewUser:', isNewUser)

    // プロフィール確認してリダイレクト
    const redirectPath = await determinePostLoginRedirect(user.id, isNewUser)

    // Supabase セッションを設定してからリダイレクト
    const supabase = createServerSupabaseClient()

    if (sessionToken) {
      // セッションを設定
      const { error: setSessionError } = await supabase.auth.setSession({
        access_token: sessionToken.access_token,
        refresh_token: sessionToken.refresh_token
      })

      if (setSessionError) {
        console.error('Failed to set session:', setSessionError)
      }
    }

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

async function exchangeCodeForToken(code: string, requestUrl: URL): Promise<LineTokenResponse> {
  const channelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID!
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET!

  // リクエストURLからベースURLを取得
  const baseUrl = process.env.NEXTAUTH_URL || `${requestUrl.protocol}//${requestUrl.host}`
  const redirectUri = `${baseUrl}/api/auth/line/callback`

  console.log('Token Exchange - Channel ID:', channelId)
  console.log('Token Exchange - Redirect URI:', redirectUri)

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

async function findOrCreateSupabaseUser(
  profile: LineProfile,
  tokenResponse: LineTokenResponse,
  requestUrl: URL
): Promise<{ user: any; isNewUser: boolean; sessionToken?: any }> {
  const serviceSupabase = createServiceSupabaseClient()
  const email = `line_${profile.userId}@line.local`

  // LINE User ID で既存ユーザーを検索
  const { data: existingUser } = await serviceSupabase
    .from('users')
    .select('id, email')
    .eq('line_user_id', profile.userId)
    .maybeSingle()

  if (existingUser) {
    // 既存ユーザーの場合、セッションを作成
    console.log('Existing user found, creating session...')

    // Admin APIを使ってセッショントークンを生成
    const { data: sessionData, error: sessionError } = await serviceSupabase.auth.admin.createSession({
      user_id: existingUser.id
    })

    if (sessionError) {
      console.error('Failed to create session:', sessionError)
      throw new Error('Failed to create session')
    }

    return {
      user: existingUser,
      isNewUser: false,
      sessionToken: sessionData.session
    }
  }

  // 新規ユーザーを作成
  console.log('Creating new user...')

  // ランダムなパスワードを生成（LINEログインなので使用しない）
  const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Supabase Auth にユーザーを作成
  const { data: authData, error: authError } = await serviceSupabase.auth.admin.createUser({
    email,
    password: randomPassword,
    email_confirm: true,
    user_metadata: {
      line_user_id: profile.userId,
      display_name: profile.displayName,
      picture_url: profile.pictureUrl,
      auth_provider: 'line'
    }
  })

  if (authError || !authData.user) {
    console.error('Failed to create auth user:', authError)
    throw new Error('Failed to create user')
  }

  // users テーブルに追加
  const { error: insertError } = await serviceSupabase
    .from('users')
    .insert({
      id: authData.user.id,
      email,
      line_user_id: profile.userId,
      is_active: true
    })

  if (insertError) {
    console.error('Failed to insert user record:', insertError)
    // ユーザーは作成されているのでエラーにしない
  }

  // 新規ユーザー用のセッションを作成
  const { data: sessionData, error: sessionError } = await serviceSupabase.auth.admin.createSession({
    user_id: authData.user.id
  })

  if (sessionError) {
    console.error('Failed to create session for new user:', sessionError)
    throw new Error('Failed to create session')
  }

  return {
    user: authData.user,
    isNewUser: true,
    sessionToken: sessionData.session
  }
}

async function determinePostLoginRedirect(userId: string, isNewUser: boolean): Promise<string> {
  try {
    // 新規ユーザーは必ずプロフィール作成へ
    if (isNewUser) {
      console.log('New user, redirecting to profile creation')
      return '/profile/create?source=line'
    }

    // 既存ユーザーはプロフィール完成状態をチェック
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
      console.log('Profile incomplete, redirecting to profile creation')
      return '/profile/create?source=line'
    }

    console.log('Profile complete, redirecting to home')
    return '/'
  } catch (error) {
    console.error('Unexpected error checking profile:', error)
    return '/'
  }
}
