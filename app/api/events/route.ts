import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: events, error } = await supabase
      .from('events')
      .select(`
        *,
        event_participants (
          id,
          user_id,
          role,
          status
        )
      `)
      .eq('user_id', user.id)
      .order('event_date', { ascending: true })

    if (error) {
      throw error
    }

    return NextResponse.json({ events })

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
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { events: eventData } = body

    if (!Array.isArray(eventData) || eventData.length === 0) {
      return NextResponse.json(
        { error: 'Invalid events data' },
        { status: 400 }
      )
    }

    // 既存の未マッチングイベントを削除
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (deleteError) {
      throw deleteError
    }

    // 新しいイベントデータを挿入
    const eventsWithUserId = eventData.map(event => ({
      ...event,
      user_id: user.id
    }))

    const { data: newEvents, error: insertError } = await supabase
      .from('events')
      .insert(eventsWithUserId)
      .select()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({ events: newEvents })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('id')

    if (!eventId) {
      return NextResponse.json(
        { error: 'Event ID is required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('user_id', user.id)
      .eq('status', 'pending') // マッチング済みのイベントは削除不可

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}