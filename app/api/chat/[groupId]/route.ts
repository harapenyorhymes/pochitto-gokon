import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { checkGroupMembership, createChatRoomForGroup } from '@/lib/chat'

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

    // グループメンバーかどうかチェック
    const isMember = await checkGroupMembership(groupId, user.id)
    if (!isMember) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // チャットルームを取得または作成
    let { data: chatRoom, error: chatError } = await supabase
      .from('group_chats')
      .select('*')
      .eq('group_id', groupId)
      .single()

    if (chatError || !chatRoom) {
      // チャットルームが存在しない場合は作成
      chatRoom = await createChatRoomForGroup(groupId)
      if (!chatRoom) {
        return NextResponse.json({ error: 'Failed to create chat room' }, { status: 500 })
      }
    }

    // グループ情報も取得
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select(`
        *,
        group_members (
          user_id,
          profiles (
            nickname,
            gender
          )
        )
      `)
      .eq('id', groupId)
      .single()

    if (groupError) {
      throw groupError
    }

    return NextResponse.json({
      chatRoom,
      group,
      members: group.group_members
    })

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}