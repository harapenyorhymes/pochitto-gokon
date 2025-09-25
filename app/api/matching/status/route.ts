import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ユーザーの現在のマッチング状況を取得
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })

    if (eventsError) {
      throw eventsError
    }

    // ユーザーが参加しているグループを取得
    const { data: groups, error: groupsError } = await supabase
      .from('groups')
      .select(`
        *,
        group_members!inner (
          user_id,
          joined_at
        )
      `)
      .eq('group_members.user_id', user.id)
      .gte('event_date', new Date().toISOString().split('T')[0])
      .order('event_date', { ascending: true })

    if (groupsError) {
      throw groupsError
    }

    // 各グループの詳細情報を取得
    const groupDetails = await Promise.all(
      groups.map(async (group) => {
        const { data: members, error: membersError } = await supabase
          .from('group_members')
          .select(`
            user_id,
            profiles (
              nickname,
              age,
              gender
            )
          `)
          .eq('group_id', group.id)

        if (membersError) {
          console.error('Error fetching group members:', membersError)
          return { ...group, members: [] }
        }

        return {
          ...group,
          members: members || []
        }
      })
    )

    // 統計情報を計算
    const pendingEvents = events.filter(e => e.status === 'pending')
    const matchedEvents = events.filter(e => e.status === 'matched')
    const completedEvents = events.filter(e => e.status === 'completed')

    const stats = {
      totalEvents: events.length,
      pendingEvents: pendingEvents.length,
      matchedEvents: matchedEvents.length,
      completedEvents: completedEvents.length,
      totalGroups: groupDetails.length,
      upcomingGroups: groupDetails.filter(g => g.status === 'formed' || g.status === 'active').length
    }

    return NextResponse.json({
      events,
      groups: groupDetails,
      stats
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}