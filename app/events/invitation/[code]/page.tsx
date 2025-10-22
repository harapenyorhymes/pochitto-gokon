'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { AuthGuard } from '@/components/AuthGuard'
import InvitationCodeDisplay from '@/components/InvitationCodeDisplay'
import BottomNavigation from '@/components/BottomNavigation'

export default function InvitationDisplayPage() {
  const params = useParams()
  const router = useRouter()
  const [eventInfo, setEventInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const code = params?.code as string

  useEffect(() => {
    if (code) {
      fetchEventInfo()
    }
  }, [code])

  const fetchEventInfo = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/invitations/join?code=${code}`)
      const data = await response.json()

      if (!response.ok || !data.valid) {
        setError(data.error || '招待コードが見つかりませんでした')
        return
      }

      setEventInfo(data.invitation)
    } catch (err) {
      console.error('Error fetching event info:', err)
      setError('イベント情報の取得に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </AuthGuard>
    )
  }

  if (error || !eventInfo) {
    return (
      <AuthGuard requireAuth={true}>
        <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">エラー</h1>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={() => router.push('/events')}
              className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all"
            >
              イベント一覧に戻る
            </button>
          </div>
        </div>
      </AuthGuard>
    )
  }

  const eventDate = new Date(eventInfo.event.date).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short'
  })

  return (
    <AuthGuard requireAuth={true}>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 pb-24">
        {/* Header */}
        <header className="bg-white/90 backdrop-blur-xl border-b border-white/20 shadow-sm sticky top-0 z-40">
          <div className="max-w-sm mx-auto px-4">
            <div className="flex items-center justify-between h-14">
              <button
                onClick={() => router.push('/events')}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 className="text-lg font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                友達を招待
              </h1>
              <div className="w-10"></div>
            </div>
          </div>
        </header>

        <div className="max-w-sm mx-auto px-4 py-6">
          {/* 成功メッセージ */}
          <div className="mb-6 bg-green-50/80 backdrop-blur-sm border border-green-200/50 text-green-700 px-4 py-4 rounded-2xl">
            <div className="flex items-start">
              <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3 mt-0.5 flex-shrink-0">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="font-bold mb-1">日程登録が完了しました！</p>
                <p className="text-sm">招待コードを友達に送って、一緒に合コンに参加しましょう。</p>
              </div>
            </div>
          </div>

          {/* 招待コード表示 */}
          <InvitationCodeDisplay
            code={code}
            eventId={eventInfo.event.id || ''}
            eventDate={eventDate}
            eventTime={eventInfo.event.time}
          />

          {/* 次のステップ */}
          <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">次のステップ</h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-pink-600 font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">友達に招待コードを送る</p>
                  <p className="text-sm text-gray-600">LINEやメッセージで招待コードを共有しましょう</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-purple-600 font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">友達の登録を待つ</p>
                  <p className="text-sm text-gray-600">友達がアカウントを作成して招待コードを入力します</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                  <span className="text-blue-600 font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">マッチングを待つ</p>
                  <p className="text-sm text-gray-600">グループが揃ったらマッチング通知が届きます</p>
                </div>
              </div>
            </div>
          </div>

          {/* アクションボタン */}
          <div className="mt-6 space-y-3">
            <button
              onClick={() => router.push('/events')}
              className="w-full py-3 bg-gradient-to-r from-pink-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-lg transition-all active:scale-98"
            >
              イベント一覧に戻る
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-3 bg-white border-2 border-gray-200 text-gray-700 rounded-xl font-bold hover:bg-gray-50 transition-all active:scale-98"
            >
              ホームに戻る
            </button>
          </div>
        </div>

        {/* ボトムナビゲーション */}
        <BottomNavigation />
      </div>
    </AuthGuard>
  )
}
