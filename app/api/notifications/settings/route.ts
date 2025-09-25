import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 通知設定を取得
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    // 設定が存在しない場合はデフォルト設定を作成
    if (!settings) {
      const defaultSettings = {
        user_id: user.id,
        match_notifications: true,
        chat_notifications: true,
        reminder_notifications: true,
        line_connected: false
      }

      const { data: newSettings, error: createError } = await supabase
        .from('notification_settings')
        .insert(defaultSettings)
        .select()
        .single()

      if (createError) {
        throw createError
      }

      return NextResponse.json({ settings: newSettings })
    }

    return NextResponse.json({ settings })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      match_notifications,
      chat_notifications,
      reminder_notifications,
      line_connected
    } = body

    // バリデーション
    if (
      typeof match_notifications !== 'boolean' ||
      typeof chat_notifications !== 'boolean' ||
      typeof reminder_notifications !== 'boolean' ||
      typeof line_connected !== 'boolean'
    ) {
      return NextResponse.json(
        { error: 'Invalid settings format' },
        { status: 400 }
      )
    }

    // 設定を更新
    const { data: settings, error } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        match_notifications,
        chat_notifications,
        reminder_notifications,
        line_connected
      })
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ settings })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}