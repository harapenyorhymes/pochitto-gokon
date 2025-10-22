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
    const { eventId, maxUses = 5 } = body

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 })
    }

    // イベントの存在確認と所有者チェック
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id, user_id, participation_type')
      .eq('id', eventId)
      .single()

    if (eventError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    }

    if (event.user_id !== user.id) {
      return NextResponse.json({ error: 'Not authorized to create invitation for this event' }, { status: 403 })
    }

    if (event.participation_type !== 'group') {
      return NextResponse.json({ error: 'Invitations are only for group participation' }, { status: 400 })
    }

    // 既存の招待コードをチェック
    const { data: existingCodes, error: checkError } = await supabase
      .from('invitation_codes')
      .select('id, code, current_uses, max_uses, status')
      .eq('event_id', eventId)
      .eq('status', 'active')
      .gt('expires_at', new Date().toISOString())

    if (checkError) {
      throw checkError
    }

    // 有効な招待コードが既に存在する場合はそれを返す
    if (existingCodes && existingCodes.length > 0) {
      const activeCode = existingCodes[0]
      return NextResponse.json({
        success: true,
        invitationCode: {
          id: activeCode.id,
          code: activeCode.code,
          currentUses: activeCode.current_uses,
          maxUses: activeCode.max_uses,
          status: activeCode.status
        },
        message: 'Using existing invitation code'
      })
    }

    // 新しい招待コードを生成
    const { data: newCode, error: codeError } = await supabase.rpc('generate_invitation_code')

    if (codeError || !newCode) {
      throw new Error('Failed to generate invitation code')
    }

    // 招待コードをデータベースに保存
    const { data: invitationCode, error: insertError } = await supabase
      .from('invitation_codes')
      .insert({
        code: newCode,
        event_id: eventId,
        organizer_id: user.id,
        max_uses: maxUses,
        current_uses: 0,
        status: 'active'
      })
      .select()
      .single()

    if (insertError) {
      throw insertError
    }

    return NextResponse.json({
      success: true,
      invitationCode: {
        id: invitationCode.id,
        code: invitationCode.code,
        currentUses: invitationCode.current_uses,
        maxUses: invitationCode.max_uses,
        status: invitationCode.status
      },
      message: 'Invitation code created successfully'
    })

  } catch (error: any) {
    console.error('Error creating invitation code:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
