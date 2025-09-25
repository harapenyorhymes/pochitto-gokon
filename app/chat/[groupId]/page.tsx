'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { AuthGuard } from '@/components/AuthGuard'
import MessageList from '@/components/MessageList'
import MessageInput from '@/components/MessageInput'
import { useAuth } from '@/contexts/AuthContext'
import { createClient } from '@/lib/supabase'
import { ArrowLeftIcon, UserGroupIcon } from '@heroicons/react/24/outline'

interface Message {
  id: string
  chat_id: string
  user_id: string | null
  content: string
  message_type: 'text' | 'system'
  created_at: string
  profiles?: {
    nickname: string
    gender: 'male' | 'female'
  }
}

interface ChatRoom {
  id: string
  group_id: string
  created_at: string
  expires_at: string
}

interface GroupMember {
  user_id: string
  profiles: {
    nickname: string
    gender: 'male' | 'female'
  }
}

interface Group {
  id: string
  event_date: string
  event_time: string
  status: string
  group_members: GroupMember[]
}

export default function ChatRoomPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const groupId = params.groupId as string

  const [messages, setMessages] = useState<Message[]>([])
  const [chatRoom, setChatRoom] = useState<ChatRoom | null>(null)
  const [group, setGroup] = useState<Group | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  // チャットルーム情報を取得
  const fetchChatRoom = async () => {
    try {
      const response = await fetch(`/api/chat/${groupId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch chat room')
      }

      const data = await response.json()
      setChatRoom(data.chatRoom)
      setGroup(data.group)
      setMembers(data.members)
    } catch (err: any) {
      setError(err.message)
    }
  }

  // メッセージを取得
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/chat/${groupId}/messages`)
      if (!response.ok) {
        throw new Error('Failed to fetch messages')
      }

      const data = await response.json()
      setMessages(data.messages)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // メッセージを送信
  const sendMessage = async (content: string) => {
    try {
      const response = await fetch(`/api/chat/${groupId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, message_type: 'text' }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      setMessages(prev => [...prev, data.message])
    } catch (err: any) {
      console.error('Error sending message:', err)
      throw err
    }
  }

  // リアルタイム更新の設定
  useEffect(() => {
    if (!chatRoom) return

    const channel = supabase
      .channel(`chat_${chatRoom.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatRoom.id}`,
        },
        async (payload) => {
          // 新しいメッセージの詳細情報を取得
          const { data: newMessage } = await supabase
            .from('messages')
            .select(`
              *,
              profiles (
                nickname,
                gender
              )
            `)
            .eq('id', payload.new.id)
            .single()

          if (newMessage && newMessage.user_id !== user?.id) {
            setMessages(prev => {
              // 重複チェック
              if (prev.find(msg => msg.id === newMessage.id)) {
                return prev
              }
              return [...prev, newMessage]
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [chatRoom, user?.id])

  // 初期データ取得
  useEffect(() => {
    if (groupId && user) {
      fetchChatRoom()
    }
  }, [groupId, user])

  useEffect(() => {
    if (chatRoom) {
      fetchMessages()
    }
  }, [chatRoom])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short'
    })
  }

  if (error) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Link
              href="/groups"
              className="text-blue-600 hover:text-blue-800"
            >
              ← グループ一覧に戻る
            </Link>
          </div>
        </div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard requireAuth={true}>
      <div className="h-screen bg-gray-50 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link
                  href="/groups"
                  className="text-gray-400 hover:text-gray-600 mr-4"
                >
                  <ArrowLeftIcon className="h-6 w-6" />
                </Link>
                <div>
                  <h1 className="text-lg font-medium text-gray-900">
                    {group ? `${formatDate(group.event_date)} ${group.event_time}` : 'チャットルーム'}
                  </h1>
                  <p className="text-sm text-gray-500">
                    名古屋栄エリア
                  </p>
                </div>
              </div>
              <div className="flex items-center">
                <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-600">{members.length}名</span>
              </div>
            </div>
          </div>
        </header>

        {/* Chat Content */}
        <div className="flex-1 max-w-4xl mx-auto w-full bg-white shadow-sm flex flex-col">
          {/* Messages */}
          <MessageList
            messages={messages}
            currentUserId={user?.id || ''}
            isLoading={isLoading}
          />

          {/* Message Input */}
          <MessageInput
            onSendMessage={sendMessage}
            disabled={!chatRoom || group?.status === 'completed'}
            placeholder={
              group?.status === 'completed'
                ? '合コンが終了しました'
                : 'メッセージを入力...'
            }
          />
        </div>

        {/* Members Panel (Mobile: Bottom sheet, Desktop: Right sidebar) */}
        <div className="bg-gray-50 border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-sm font-medium text-gray-700 mb-3">参加メンバー</h3>
            <div className="flex space-x-4 overflow-x-auto">
              {members.map((member) => (
                <div key={member.user_id} className="flex-shrink-0 text-center">
                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mb-1">
                    <span className="text-lg">
                      {member.profiles.gender === 'male' ? '👤' : '👤'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 truncate w-16">
                    {member.profiles.nickname}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}