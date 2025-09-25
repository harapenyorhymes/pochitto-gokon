import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkGroupMembership, isChatRoomActive } from '@/lib/chat'

export async function GET(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.groupId
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // グループメンバーかどうかチェック
    const isMember = await checkGroupMembership(groupId, user.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // チャットルームを取得
    const { data: chatRoom, error: chatError } = await supabase
      .from('group_chats')
      .select('*')
      .eq('group_id', groupId)
      .single()

    if (chatError || !chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 })
    }

    // メッセージを取得
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select(`
        *,
        profiles (
          nickname,
          gender
        )
      `)
      .eq('chat_id', chatRoom.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (messagesError) {
      throw messagesError
    }

    return NextResponse.json({
      messages: messages || [],
      chatRoom,
      hasMore: (messages?.length || 0) === limit
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { groupId: string } }
) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const groupId = params.groupId
    const body = await request.json()
    const { content, message_type = 'text' } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 })
    }

    if (content.length > 1000) {
      return NextResponse.json({ error: 'Message too long' }, { status: 400 })
    }

    // グループメンバーかどうかチェック
    const isMember = await checkGroupMembership(groupId, user.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // チャットルームを取得
    const { data: chatRoom, error: chatError } = await supabase
      .from('group_chats')
      .select('*')
      .eq('group_id', groupId)
      .single()

    if (chatError || !chatRoom) {
      return NextResponse.json({ error: 'Chat room not found' }, { status: 404 })
    }

    // チャットルームが有効かチェック
    const isActive = await isChatRoomActive(chatRoom.id)
    if (!isActive) {
      return NextResponse.json({ error: 'Chat room has expired' }, { status: 410 })
    }

    // メッセージを保存
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .insert({
        chat_id: chatRoom.id,
        user_id: user.id,
        content: content.trim(),
        message_type
      })
      .select(`
        *,
        profiles (
          nickname,
          gender
        )
      `)
      .single()

    if (messageError) {
      throw messageError
    }

    return NextResponse.json({ message })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}