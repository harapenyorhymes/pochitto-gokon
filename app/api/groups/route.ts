import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ユーザーが参加しているグループを取得
    const { data: groups, error } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner (
          user_id,
          joined_at
        ),
        profiles:group_members(
          profiles (
            nickname,
            age,
            gender,
            bio
          )
        )
      `)
      .eq('group_members.user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    return NextResponse.json({ groups })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()

    const body = await request.json()
    const { event_date, event_time, area_id, member_user_ids } = body

    if (!event_date || !event_time || !area_id || !Array.isArray(member_user_ids)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // グループを作成
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        event_date,
        event_time,
        area_id,
        status: 'formed'
      })
      .select()
      .single()

    if (groupError) {
      throw groupError
    }

    // グループメンバーを追加
    const groupMembers = member_user_ids.map((user_id: string) => ({
      group_id: group.id,
      user_id
    }))

    const { error: membersError } = await supabase
      .from('group_members')
      .insert(groupMembers)

    if (membersError) {
      // グループ作成をロールバック
      await supabase.from('groups').delete().eq('id', group.id)
      throw membersError
    }

    // 対応するイベントのステータスを更新
    const { error: eventUpdateError } = await supabase
      .from('events')
      .update({ status: 'matched' })
      .in('user_id', member_user_ids)
      .eq('event_date', event_date)
      .eq('event_time', event_time)
      .eq('area_id', area_id)
      .eq('status', 'pending')

    if (eventUpdateError) {
      console.error('Error updating event status:', eventUpdateError)
    }

    return NextResponse.json({ group })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}