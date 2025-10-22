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
    const { invitationCode } = body

    if (!invitationCode) {
      return NextResponse.json({ error: 'Invitation code is required' }, { status: 400 })
    }

    // 招待コードを検証
    const { data: invitation, error: invitationError } = await supabase
      .from('invitation_codes')
      .select(`
        id,
        code,
        event_id,
        organizer_id,
        max_uses,
        current_uses,
        expires_at,
        status,
        events (
          id,
          event_date,
          event_time,
          area_id,
          participation_type,
          status
        )
      `)
      .eq('code', invitationCode.toUpperCase())
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: '招待コードが見つかりません' }, { status: 404 })
    }

    // 招待コードの状態チェック
    if (invitation.status !== 'active') {
      return NextResponse.json({ error: 'この招待コードは無効です' }, { status: 400 })
    }

    // 有効期限チェック
    if (new Date(invitation.expires_at) < new Date()) {
      // 期限切れのステータスを更新
      await supabase
        .from('invitation_codes')
        .update({ status: 'expired' })
        .eq('id', invitation.id)

      return NextResponse.json({ error: '招待コードの有効期限が切れています' }, { status: 400 })
    }

    // 利用回数チェック
    if (invitation.current_uses >= invitation.max_uses) {
      // 満員のステータスを更新
      await supabase
        .from('invitation_codes')
        .update({ status: 'full' })
        .eq('id', invitation.id)

      return NextResponse.json({ error: '招待コードの利用上限に達しています' }, { status: 400 })
    }

    // 主催者自身は参加できない
    if (invitation.organizer_id === user.id) {
      return NextResponse.json({ error: '自分の招待コードは使用できません' }, { status: 400 })
    }

    // イベント情報の取得
    const event = Array.isArray(invitation.events) ? invitation.events[0] : invitation.events

    if (!event) {
      return NextResponse.json({ error: 'イベント情報が見つかりません' }, { status: 404 })
    }

    // 既に参加しているかチェック
    const { data: existingParticipant, error: checkError } = await supabase
      .from('event_participants')
      .select('id')
      .eq('event_id', event.id)
      .eq('user_id', user.id)
      .single()

    if (existingParticipant) {
      return NextResponse.json({ error: 'すでにこのイベントに参加しています' }, { status: 400 })
    }

    // イベント参加者として追加
    const { error: participantError } = await supabase
      .from('event_participants')
      .insert({
        event_id: event.id,
        user_id: user.id,
        role: 'participant',
        status: 'accepted',
        invitation_code_id: invitation.id
      })

    if (participantError) {
      throw participantError
    }

    // 招待コードの利用回数を更新
    const newUsesCount = invitation.current_uses + 1
    const newStatus = newUsesCount >= invitation.max_uses ? 'full' : 'active'

    const { error: updateError } = await supabase
      .from('invitation_codes')
      .update({
        current_uses: newUsesCount,
        status: newStatus
      })
      .eq('id', invitation.id)

    if (updateError) {
      console.error('Error updating invitation code:', updateError)
    }

    return NextResponse.json({
      success: true,
      message: 'イベントに参加しました',
      event: {
        id: event.id,
        date: event.event_date,
        time: event.event_time,
        areaId: event.area_id
      }
    })

  } catch (error: any) {
    console.error('Error joining with invitation code:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// 招待コード検証（参加はしない）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')

    if (!code) {
      return NextResponse.json({ error: 'Invitation code is required' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()

    // 招待コードを検証
    const { data: invitation, error: invitationError } = await supabase
      .from('invitation_codes')
      .select(`
        id,
        code,
        max_uses,
        current_uses,
        expires_at,
        status,
        events (
          id,
          event_date,
          event_time,
          area_id,
          participation_type
        ),
        organizer:organizer_id (
          profiles (
            nickname
          )
        )
      `)
      .eq('code', code.toUpperCase())
      .single()

    if (invitationError || !invitation) {
      return NextResponse.json({ error: '招待コードが見つかりません', valid: false }, { status: 404 })
    }

    const event = Array.isArray(invitation.events) ? invitation.events[0] : invitation.events
    const organizer = Array.isArray(invitation.organizer) ? invitation.organizer[0] : invitation.organizer

    // バリデーション
    const isExpired = new Date(invitation.expires_at) < new Date()
    const isFull = invitation.current_uses >= invitation.max_uses
    const isValid = invitation.status === 'active' && !isExpired && !isFull

    return NextResponse.json({
      valid: isValid,
      invitation: {
        code: invitation.code,
        availableSlots: invitation.max_uses - invitation.current_uses,
        expiresAt: invitation.expires_at,
        status: invitation.status,
        event: event ? {
          date: event.event_date,
          time: event.event_time,
          areaId: event.area_id
        } : null,
        organizer: organizer?.profiles ? {
          nickname: organizer.profiles.nickname
        } : null
      }
    })

  } catch (error: any) {
    console.error('Error validating invitation code:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error', valid: false },
      { status: 500 }
    )
  }
}
