import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ユーザーが登録したイベントを取得
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select(`
        id,
        event_date,
        event_time,
        participation_type,
        status,
        area_id,
        created_at
      `)
      .eq('user_id', user.id)
      .order('event_date', { ascending: true })

    if (eventsError) {
      console.error('Error fetching user events:', eventsError)
      return NextResponse.json(
        { error: 'Failed to fetch events' },
        { status: 500 }
      )
    }

    return NextResponse.json({ events: events || [] })
  } catch (error: any) {
    console.error('Error in my-events API:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
