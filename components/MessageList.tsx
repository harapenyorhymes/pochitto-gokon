'use client'

import { useEffect, useRef } from 'react'
import { format } from 'date-fns'

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

interface MessageListProps {
  messages: Message[]
  currentUserId: string
  isLoading?: boolean
}

export default function MessageList({ messages, currentUserId, isLoading }: MessageListProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)

    if (diffInHours < 24) {
      return format(date, 'HH:mm')
    } else {
      return format(date, 'M/d HH:mm')
    }
  }

  const getMessageBubbleClass = (isOwnMessage: boolean, messageType: string) => {
    if (messageType === 'system') {
      return 'bg-gray-100 text-gray-600 text-center mx-auto max-w-xs'
    }

    if (isOwnMessage) {
      return 'bg-blue-500 text-white ml-auto'
    } else {
      return 'bg-white text-gray-900 border border-gray-200'
    }
  }

  const getUserIcon = (gender: 'male' | 'female') => {
    return gender === 'male' ? '👤' : '👤'
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="mt-2 text-sm text-gray-500">メッセージを読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.length === 0 ? (
        <div className="text-center text-gray-500 mt-8">
          <p>まだメッセージがありません</p>
          <p className="text-sm">最初のメッセージを送信してみましょう！</p>
        </div>
      ) : (
        messages.map((message) => {
          const isOwnMessage = message.user_id === currentUserId
          const isSystemMessage = message.message_type === 'system'

          return (
            <div
              key={message.id}
              className={`flex ${isSystemMessage ? 'justify-center' : isOwnMessage ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-xs lg:max-w-md ${isSystemMessage ? 'w-auto' : 'w-full'}`}>
                {!isSystemMessage && !isOwnMessage && (
                  <div className="flex items-center mb-1">
                    <span className="text-lg mr-2">
                      {message.profiles ? getUserIcon(message.profiles.gender) : '👤'}
                    </span>
                    <span className="text-sm font-medium text-gray-700">
                      {message.profiles?.nickname || 'ゲスト'}
                    </span>
                  </div>
                )}

                <div
                  className={`px-4 py-2 rounded-lg ${getMessageBubbleClass(isOwnMessage, message.message_type)}`}
                >
                  <p className={`text-sm ${isSystemMessage ? 'text-xs' : ''}`}>
                    {message.content}
                  </p>

                  {!isSystemMessage && (
                    <p className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatMessageTime(message.created_at)}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )
        })
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}