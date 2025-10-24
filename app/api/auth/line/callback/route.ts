import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

interface LineTokenResponse {
  access_token: string
  token_type: string
  refresh_token?: string
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

interface LineFriendshipStatus {
  friendFlag: boolean
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const state = requestUrl.searchParams.get('state')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  let returnPath: string | null = null

  // エラーチェチE��
  if (error) {
    console.error('LINE Login error:', error, errorDescription)
    const errorUrl = `/login?error=${encodeURIComponent(error)}`
    if (errorDescription) {
      return NextResponse.redirect(
        new URL(`${errorUrl}&error_description=${encodeURIComponent(errorDescription)}`, requestUrl.origin)
      )
    }
    return NextResponse.redirect(
      new URL(errorUrl, requestUrl.origin)
    )
  }

  // チE�Eタベ�Eスからstate検証�E�モバイルでCookieが保持されなぁE��題に対応！E
  console.log('LINE Callback - State from URL:', state)

  if (!state) {
    console.error('State missing from callback')
    return NextResponse.redirect(
      new URL('/login?error=invalid_state&error_description=' + encodeURIComponent('State parameter is missing.'), requestUrl.origin)
    )
  }

  try {
    const serviceSupabase = createServiceSupabaseClient()

    // チE�Eタベ�Eスからstateを検索
    const { data: savedStateData, error: stateError } = await serviceSupabase
      .from('line_oauth_states')
      .select('*')
      .eq('state', state)
      .maybeSingle()

    if (stateError) {
      console.error('Failed to verify state:', stateError)
      return NextResponse.redirect(
        new URL('/login?error=invalid_state&error_description=' + encodeURIComponent('State verification failed.'), requestUrl.origin)
      )
    }

    if (!savedStateData || savedStateData.used) {
      console.error('State not found or already used')
      return NextResponse.redirect(
        new URL('/login?error=invalid_state&error_description=' + encodeURIComponent('Invalid or expired state.'), requestUrl.origin)
      )
    }

    returnPath = sanitizeReturnPath(savedStateData.return_to)

    // 有効期限チェチE��
    const expiresAt = new Date(savedStateData.expires_at)
    if (expiresAt < new Date()) {
      console.error('State expired')
      return NextResponse.redirect(
        new URL('/login?error=invalid_state&error_description=' + encodeURIComponent('State has expired. Please try again.'), requestUrl.origin)
      )
    }

    // stateを使用済みにマ�Eク�E�リプレイアタチE��防止�E�E
    await serviceSupabase
      .from('line_oauth_states')
      .update({ used: true })
      .eq('state', state)

    console.log('State verification successful')
  } catch (error) {
    console.error('State verification error:', error)
    return NextResponse.redirect(
      new URL('/login?error=invalid_state&error_description=' + encodeURIComponent('State verification error.'), requestUrl.origin)
    )
  }

  if (!code) {
    return NextResponse.redirect(
      new URL('/login?error=missing_code', requestUrl.origin)
    )
  }

  try {
    // LINE からアクセスト�Eクンを取征E
    const tokenResponse = await exchangeCodeForToken(code, requestUrl)

    // LINE プロフィール惁E��を取征E
    const profile = await getLineProfile(tokenResponse.access_token)

    console.log('LINE Profile:', profile)

    // Supabase でユーザーを作成/取得してセッションを確立
    const { user, isNewUser, sessionToken } = await findOrCreateSupabaseUser(profile, tokenResponse, requestUrl)

    console.log('User created/found:', user.id, 'isNewUser:', isNewUser)

    const friendshipStatus = await getLineFriendshipStatus(tokenResponse.access_token)

    await persistLineConnection({
      supabaseUserId: user.id,
      lineUserId: profile.userId,
      tokenResponse,
      friendshipStatus
    })

    const redirectPath = await determinePostLoginRedirect(user.id, isNewUser)
    const supabase = createServerSupabaseClient()

    if (sessionToken && sessionToken.hashed_token) {
      // トークンハッシュを使ってセッションを検証
      const { error: verifyError } = await supabase.auth.verifyOtp({
        token_hash: sessionToken.hashed_token,
        type: 'magiclink'
      })

      if (verifyError) {
        console.error('Failed to verify token:', verifyError)
      } else {
        console.log('Session verified successfully')
      }
    }

    const baseRedirect = returnPath ?? redirectPath
    const nextPath = friendshipStatus.friendFlag
      ? baseRedirect
      : buildNeedFriendRedirect(baseRedirect)

    const response = NextResponse.redirect(new URL(nextPath, requestUrl.origin))

    return response

  } catch (err) {
    console.error('LINE callback error:', err)
    console.error('Error details:', {
      message: err instanceof Error ? err.message : 'Unknown error',
      stack: err instanceof Error ? err.stack : undefined,
      code: requestUrl.searchParams.get('code'),
      state: requestUrl.searchParams.get('state')
    })

    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.redirect(
      new URL('/login?error=callback_failed&error_description=' + encodeURIComponent(errorMessage), requestUrl.origin)
    )
  }
}

async function exchangeCodeForToken(code: string, requestUrl: URL): Promise<LineTokenResponse> {
  const channelId = process.env.NEXT_PUBLIC_LINE_LOGIN_CHANNEL_ID!
  const channelSecret = process.env.LINE_LOGIN_CHANNEL_SECRET!

  // リクエスチERLからベ�EスURLを取征E
  const baseUrl = process.env.NEXTAUTH_URL || `${requestUrl.protocol}//${requestUrl.host}`
  const redirectUri = `${baseUrl}/api/auth/line/callback`

  console.log('Token Exchange - Channel ID:', channelId)
  console.log('Token Exchange - Channel Secret exists:', !!channelSecret)
  console.log('Token Exchange - Channel Secret length:', channelSecret?.length)
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

async function getLineFriendshipStatus(accessToken: string): Promise<LineFriendshipStatus> {
  const response = await fetch('https://api.line.me/friendship/v1/status', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  })

  if (!response.ok) {
    const errorData = await response.text()
    console.error('Failed to get LINE friendship status:', errorData)
    return { friendFlag: false }
  }

  const data = await response.json()
  return {
    friendFlag: Boolean(data?.friendFlag)
  }
}

async function persistLineConnection({
  supabaseUserId,
  lineUserId,
  tokenResponse,
  friendshipStatus
}: {
  supabaseUserId: string
  lineUserId: string
  tokenResponse: LineTokenResponse
  friendshipStatus: LineFriendshipStatus
}) {
  const serviceSupabase = createServiceSupabaseClient()

  const updatePayload: Record<string, unknown> = {
    line_user_id: lineUserId,
    line_access_token: tokenResponse.access_token,
    line_friend_flag: friendshipStatus.friendFlag,
    line_friend_checked_at: new Date().toISOString(),
    line_linked_at: new Date().toISOString()
  }

  if (tokenResponse.refresh_token) {
    updatePayload.line_refresh_token = tokenResponse.refresh_token
  }
  if (tokenResponse.expires_in) {
    updatePayload.line_access_token_expires_at = new Date(Date.now() + tokenResponse.expires_in * 1000).toISOString()
  }

  const { error } = await serviceSupabase
    .from('users')
    .update(updatePayload)
    .eq('id', supabaseUserId)

  if (error) {
    console.error('Failed to persist LINE connection info:', error)
  }
}

function sanitizeReturnPath(returnPath: string | null | undefined): string | null {
  if (!returnPath) return null

  try {
    const decoded = decodeURIComponent(returnPath)
    if (decoded.startsWith('/')) {
      return decoded
    }
    return null
  } catch {
    return null
  }
}

function buildNeedFriendRedirect(returnTo: string): string {
  const params = new URLSearchParams()
  params.set('returnTo', returnTo)
  return `/need-add-friend?${params.toString()}`
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
    // 既存ユーザーの場合、one-time tokenを生戁E
    console.log('Existing user found, generating token...')

    // Admin APIを使ってone-time tokenを生戁E
    const { data: tokenData, error: tokenError } = await serviceSupabase.auth.admin.generateLink({
      type: 'magiclink',
      email: existingUser.email,
      options: {
        redirectTo: requestUrl.origin
      }
    })

    if (tokenError || !tokenData) {
      console.error('Failed to generate token:', tokenError)
      throw new Error('Failed to create token')
    }

    // ハッシュ化されたトークンを取得
    const actionLink = tokenData.properties?.action_link
    const hashedToken =
      (tokenData.properties as Record<string, string | undefined>)?.hashed_token ||
      (tokenData.properties as Record<string, string | undefined>)?.token_hash ||
      (actionLink
        ? (() => {
            const params = new URL(actionLink).searchParams
            return params.get('token_hash') || params.get('token')
          })()
        : null)

    if (!hashedToken) {
      console.error('No token_hash found in action link')
      throw new Error('Failed to extract token')
    }

    return {
      user: existingUser,
      isNewUser: false,
      sessionToken: {
        hashed_token: hashedToken,
        type: 'magiclink'
      }
    }
  }

  // 新規ユーザーを作�E
  console.log('Creating new user...')

  // ランダムなパスワードを生�E�E�EINEログインなので使用しなぁE��E
  const randomPassword = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')

  // Supabase Auth にユーザーを作�E
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

  // users チE�Eブルに追加
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
    // ユーザーは作�EされてぁE��のでエラーにしなぁE
  }

  // 新規ユーザー用のone-time tokenを生戁E
  const { data: tokenData, error: tokenError } = await serviceSupabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: {
      redirectTo: requestUrl.origin
    }
  })

  if (tokenError || !tokenData) {
    console.error('Failed to generate token for new user:', tokenError)
    throw new Error('Failed to create token')
  }

  // ハッシュ化されたトークンを取得
  const actionLink = tokenData.properties?.action_link
  const hashedToken =
    (tokenData.properties as Record<string, string | undefined>)?.hashed_token ||
    (tokenData.properties as Record<string, string | undefined>)?.token_hash ||
    (actionLink
      ? (() => {
          const params = new URL(actionLink).searchParams
          return params.get('token_hash') || params.get('token')
        })()
      : null)

  if (!hashedToken) {
    console.error('No token_hash found in action link for new user')
    throw new Error('Failed to extract token')
  }

  return {
    user: authData.user,
    isNewUser: true,
    sessionToken: {
      hashed_token: hashedToken,
      type: 'magiclink'
    }
  }
}

async function determinePostLoginRedirect(userId: string, isNewUser: boolean): Promise<string> {
  try {
    // 新規ユーザーは忁E��プロフィール作�Eへ
    if (isNewUser) {
      console.log('New user, redirecting to profile creation')
      return '/profile/create?source=line'
    }

    // 既存ユーザーはプロフィール完�E状態をチェチE��
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
