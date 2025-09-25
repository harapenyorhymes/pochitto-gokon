import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { lineUserId } = body

    if (!lineUserId) {
      return NextResponse.json({ error: 'LINE User ID is required' }, { status: 400 })
    }

    // ユーザーのLINE情報を更新
    const { error: updateError } = await supabase
      .from('users')
      .update({ line_user_id: lineUserId })
      .eq('id', user.id)

    if (updateError) {
      throw updateError
    }

    // 通知設定でLINE連携をONにする
    const { error: settingsError } = await supabase
      .from('notification_settings')
      .upsert({
        user_id: user.id,
        line_connected: true,
        match_notifications: true,
        chat_notifications: true,
        reminder_notifications: true
      })

    if (settingsError) {
      throw settingsError
    }

    return NextResponse.json({
      success: true,
      message: 'LINE連携が完了しました'
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // ユーザーのLINE連携状態を取得
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('line_user_id')
      .eq('id', user.id)
      .single()

    if (userError) {
      throw userError
    }

    const { data: settingsData, error: settingsError } = await supabase
      .from('notification_settings')
      .select('line_connected')
      .eq('user_id', user.id)
      .single()

    if (settingsError && settingsError.code !== 'PGRST116') {
      throw settingsError
    }

    const isConnected = !!(userData.line_user_id && settingsData?.line_connected)

    return NextResponse.json({
      connected: isConnected,
      lineUserId: userData.line_user_id
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}