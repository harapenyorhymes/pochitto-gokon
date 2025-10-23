import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient()

  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('users')
    .select('line_user_id, line_friend_flag, line_friend_checked_at, line_linked_at')
    .eq('id', user.id)
    .maybeSingle()

  if (error) {
    console.error('Failed to fetch LINE status:', error)
    return NextResponse.json({ error: 'Failed to fetch LINE status' }, { status: 500 })
  }

  return NextResponse.json({
    lineUserId: data?.line_user_id ?? null,
    friendFlag: Boolean(data?.line_friend_flag),
    lineFriendCheckedAt: data?.line_friend_checked_at ?? null,
    lineLinkedAt: data?.line_linked_at ?? null
  })
}
