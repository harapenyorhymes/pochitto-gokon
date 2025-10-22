'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'

interface InvitationInfo {
  valid: boolean
  invitation?: {
    code: string
    availableSlots: number
    expiresAt: string
    status: string
    event: {
      date: string
      time: string
      areaId: string
    }
    organizer: {
      nickname: string
    }
  }
  error?: string
}

export default function InvitePage() {
  const params = useParams()
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [invitationInfo, setInvitationInfo] = useState<InvitationInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const code = params?.code as string

  useEffect(() => {
    if (code) {
      fetchInvitationInfo()
    }
  }, [code])

  const fetchInvitationInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invitations/join?code=${code}`)
      const data = await response.json()

      if (!response.ok) {
        setInvitationInfo({ valid: false, error: data.error || '招待コードが無効です' })
      } else {
        setInvitationInfo(data)
      }
    } catch (err) {
      console.error('Error fetching invitation:', err)
      setInvitationInfo({ valid: false, error: '招待情報の取得に失敗しました' })
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async () => {
    if (!user) {
      // 未ログインの場合は招待コードをlocalStorageに保存してサインアップページへ
      localStorage.setItem('pendingInvitationCode', code)
      router.push(`/signup?inviteCode=${code}`)
      return
    }

    try {
      setJoining(true)
      setError(null)

      const response = await fetch('/api/invitations/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invitationCode: code }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'イベントへの参加に失敗しました')
      }

      // 成功したらイベント一覧ページへ
      router.push('/events?joined=true')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setJoining(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  if (!invitationInfo || !invitationInfo.valid) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            招待コードが無効です
          </h1>
          <p className="text-gray-600 mb-6">
            {invitationInfo?.error || 'この招待コードは使用できません'}
          </p>
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
          >
            ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  const { invitation } = invitationInfo
  const eventDate = new Date(invitation!.event.date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        {/* メインカード */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* アイコン */}
          <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>

          {/* タイトル */}
          <h1 className="text-2xl font-bold text-center mb-2">
            合コンへの招待
          </h1>
          <p className="text-center text-gray-600 mb-6">
            <span className="font-bold text-pink-600">{invitation!.organizer.nickname}</span>さんから招待されています
          </p>

          {/* イベント情報 */}
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6 mb-6 space-y-3">
            <div className="flex items-center">
              <span className="text-2xl mr-3">📅</span>
              <div>
                <p className="text-xs text-gray-600">日程</p>
                <p className="font-bold text-gray-900">{eventDate}</p>
                <p className="text-sm text-gray-700">{invitation!.event.time}</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">📍</span>
              <div>
                <p className="text-xs text-gray-600">場所</p>
                <p className="font-bold text-gray-900">名古屋栄エリア</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-2xl mr-3">👥</span>
              <div>
                <p className="text-xs text-gray-600">残り参加枠</p>
                <p className="font-bold text-gray-900">{invitation!.availableSlots}人</p>
              </div>
            </div>
          </div>

          {/* 招待コード */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-center">
            <p className="text-xs text-gray-600 mb-1">招待コード</p>
            <p className="text-2xl font-bold tracking-wider bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {invitation!.code}
            </p>
          </div>

          {/* エラー表示 */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {error}
            </div>
          )}

          {/* 参加ボタン */}
          <button
            onClick={handleJoin}
            disabled={joining}
            className="w-full py-4 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-98"
          >
            {joining ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                参加処理中...
              </div>
            ) : user ? (
              '参加する'
            ) : (
              'サインアップして参加'
            )}
          </button>

          {!user && (
            <p className="text-xs text-center text-gray-500 mt-3">
              アカウントをお持ちの方は
              <Link href={`/login?inviteCode=${code}`} className="text-pink-600 hover:underline ml-1">
                ログイン
              </Link>
            </p>
          )}
        </div>

        {/* 注意事項 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-xl p-4">
          <p className="text-xs text-gray-600 leading-relaxed">
            この招待コードを使用すると、自動的に同じグループに参加します。参加後はグループチャットでメンバーと交流できます。
          </p>
        </div>
      </div>
    </div>
  )
}
