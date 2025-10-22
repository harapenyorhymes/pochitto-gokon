import { createServerSupabaseClient, createServiceSupabaseClient } from '@/lib/supabase-server'
import { User } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const provider = requestUrl.searchParams.get('provider')
  const redirectParam = sanitizeRedirectPath(requestUrl.searchParams.get('redirect'))
  const supabase = createServerSupabaseClient()

  if (!code) {
    return NextResponse.redirect(new URL('/login?error=missing_code', requestUrl.origin))
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

  if (exchangeError) {
    console.error('Failed to exchange auth code for session:', exchangeError)
    return NextResponse.redirect(new URL('/login?error=exchange_failed', requestUrl.origin))
  }

  if (provider === 'line') {
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      console.error('LINE login: failed to fetch authenticated user', userError)
      return NextResponse.redirect(new URL('/login?error=line_user_not_found', requestUrl.origin))
    }

    await syncLineUser(user)

    const redirectPath = await determinePostLoginRedirect(user.id, redirectParam)
    return NextResponse.redirect(new URL(redirectPath, requestUrl.origin))
  }

  return NextResponse.redirect(new URL(redirectParam ?? '/', requestUrl.origin))
}

function sanitizeRedirectPath(path: string | null) {
  if (!path) return null
  if (!path.startsWith('/')) return null
  return path
}

async function syncLineUser(user: User) {
  try {
    const serviceSupabase = createServiceSupabaseClient()
    const lineUserId = extractLineUserId(user)

    const upsertPayload: Record<string, unknown> = {
      id: user.id,
      email: user.email,
      is_active: true,
      updated_at: new Date().toISOString()
    }

    if (lineUserId) {
      upsertPayload.line_user_id = lineUserId
    }

    const { error } = await serviceSupabase
      .from('users')
      .upsert(upsertPayload, { onConflict: 'id' })

    if (error) {
      console.error('LINE login: failed to upsert users record', error)
    }
  } catch (error) {
    console.error('LINE login: unexpected error while syncing user', error)
  }
}

async function determinePostLoginRedirect(userId: string, fallbackPath: string | null) {
  try {
    const serviceSupabase = createServiceSupabaseClient()
    const { data: profile, error } = await serviceSupabase
      .from('profiles')
      .select('is_complete')
      .eq('id', userId)
      .maybeSingle()

    if (error && error.code !== 'PGRST116') {
      console.error('LINE login: failed to fetch profile status', error)
      return fallbackPath ?? '/'
    }

    if (!profile || profile.is_complete === false) {
      return '/profile/create?source=line'
    }

    return fallbackPath ?? '/'
  } catch (error) {
    console.error('LINE login: unexpected error checking profile', error)
    return fallbackPath ?? '/'
  }
}

function extractLineUserId(user: User) {
  const metadata = user?.user_metadata as Record<string, unknown> | undefined
  if (metadata) {
    if (typeof metadata.sub === 'string') {
      return metadata.sub
    }
    if (typeof metadata.line_user_id === 'string') {
      return metadata.line_user_id
    }
  }

  const lineIdentity = user?.identities?.find((identity) => identity.provider === 'line')
  const identityData = lineIdentity?.identity_data as Record<string, unknown> | undefined
  if (identityData && typeof identityData.sub === 'string') {
    return identityData.sub
  }

  return null
}
