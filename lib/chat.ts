import { createServerSupabaseClient } from '@/lib/supabase'

export interface ChatRoom {
  id: string
  group_id: string
  created_at: string
  expires_at: string
}

export interface Message {
  id: string
  chat_id: string
  user_id: string
  content: string
  message_type: 'text' | 'system'
  created_at: string
  updated_at: string
  deleted_at: string | null
  profiles?: {
    nickname: string
    gender: 'male' | 'female'
  }
}

/**
 * グループのチャットルームを自動作成
 */
export async function createChatRoomForGroup(groupId: string): Promise<ChatRoom | null> {
  const supabase = createServerSupabaseClient()

  try {
    // 既存のチャットルームをチェック
    const { data: existingChat } = await supabase
      .from('group_chats')
      .select('*')
      .eq('group_id', groupId)
      .single()

    if (existingChat) {
      return existingChat
    }

    // 新しいチャットルームを作成（有効期限は30日後）
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { data: newChat, error } = await supabase
      .from('group_chats')
      .insert({
        group_id: groupId,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating chat room:', error)
      return null
    }

    // システムメッセージを追加
    await supabase
      .from('messages')
      .insert({
        chat_id: newChat.id,
        user_id: null, // システムメッセージ
        content: 'グループチャットが開始されました！合コンの詳細について話し合いましょう。',
        message_type: 'system'
      })

    return newChat

  } catch (error) {
    console.error('Error in createChatRoomForGroup:', error)
    return null
  }
}

/**
 * ユーザーがグループメンバーかどうかチェック
 */
export async function checkGroupMembership(groupId: string, userId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('user_id')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .single()

    return !error && data !== null

  } catch (error) {
    return false
  }
}

/**
 * チャットルームの有効期限をチェック
 */
export async function isChatRoomActive(chatId: string): Promise<boolean> {
  const supabase = createServerSupabaseClient()

  try {
    const { data, error } = await supabase
      .from('group_chats')
      .select('expires_at')
      .eq('id', chatId)
      .single()

    if (error || !data) {
      return false
    }

    const now = new Date()
    const expiresAt = new Date(data.expires_at)

    return now < expiresAt

  } catch (error) {
    return false
  }
}

/**
 * メッセージを既読にする
 */
export async function markMessagesAsRead(chatId: string, userId: string, messageIds: string[]): Promise<boolean> {
  const supabase = createServerSupabaseClient()

  try {
    const readRecords = messageIds.map(messageId => ({
      message_id: messageId,
      user_id: userId,
      read_at: new Date().toISOString()
    }))

    // 既存の既読レコードを削除してから新しく挿入
    await supabase
      .from('message_reads')
      .delete()
      .eq('user_id', userId)
      .in('message_id', messageIds)

    const { error } = await supabase
      .from('message_reads')
      .insert(readRecords)

    return !error

  } catch (error) {
    console.error('Error marking messages as read:', error)
    return false
  }
}

/**
 * 未読メッセージ数を取得
 */
export async function getUnreadMessageCount(chatId: string, userId: string): Promise<number> {
  const supabase = createServerSupabaseClient()

  try {
    // チャット内の全メッセージ数を取得
    const { count: totalMessages } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
      .eq('chat_id', chatId)
      .neq('user_id', userId) // 自分のメッセージは除外
      .is('deleted_at', null)

    // 既読メッセージ数を取得
    const { count: readMessages } = await supabase
      .from('message_reads')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .in('message_id',
        await supabase
          .from('messages')
          .select('id')
          .eq('chat_id', chatId)
          .neq('user_id', userId)
          .is('deleted_at', null)
          .then(({ data }) => data?.map(m => m.id) || [])
      )

    return (totalMessages || 0) - (readMessages || 0)

  } catch (error) {
    console.error('Error getting unread message count:', error)
    return 0
  }
}