'use client'

import { useEffect, useState } from 'react'
import { AuthGuard } from '@/components/AuthGuard'
import { signInWithLine } from '@/lib/auth'

const DEFAULT_RETURN_TO = '/events'
const RAW_FRIEND_ADD_URL = process.env.NEXT_PUBLIC_LINE_FRIEND_ADD_URL
const FRIEND_ADD_URL =
  RAW_FRIEND_ADD_URL && !RAW_FRIEND_ADD_URL.includes('YOUR_OFFICIAL_ACCOUNT_ID')
    ? RAW_FRIEND_ADD_URL
    : null

export default function NeedAddFriendPage() {
  const [returnTo, setReturnTo] = useState<string>(DEFAULT_RETURN_TO)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const next = params.get('returnTo')

    if (next && next.startsWith('/')) {
      setReturnTo(next)
    }
  }, [])

  const handleOpenFriendPage = () => {
    if (!FRIEND_ADD_URL) {
      alert('LINE友だち追加用のURLが設定されていません。管理者にお問い合わせください。')
      return
    }
    window.open(FRIEND_ADD_URL, '_blank', 'noreferrer')
  }

  const handleRecheck = () => {
    signInWithLine(returnTo)
  }

  return (
    <AuthGuard requireAuth>
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-purple-50 flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl p-8 space-y-6">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 text-2xl">
              🌟
            </div>
            <h1 className="text-2xl font-bold text-gray-900">友だち追加を確認してください</h1>
            <p className="text-sm text-gray-600 leading-relaxed">
              公式アカウントを友だち追加すると、マッチ通知をLINEでも受け取れます。追加後に「友だち追加済みを確認する」から再チェックしてください。
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={handleOpenFriendPage}
              className="w-full rounded-xl bg-[#06C755] px-4 py-3 text-white font-semibold shadow hover:bg-[#05b04f] transition disabled:opacity-60"
              disabled={!FRIEND_ADD_URL}
            >
              友だち追加ページを開く
            </button>
            {!FRIEND_ADD_URL && (
              <p className="text-xs text-red-500">
                友だち追加URLが設定されていません。管理者にお問い合わせください。
              </p>
            )}
            <button
              type="button"
              onClick={handleRecheck}
              className="w-full rounded-xl border border-pink-500 px-4 py-3 text-pink-500 font-semibold hover:bg-pink-50 transition"
            >
              友だち追加済みを確認する
            </button>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-2">
            <p>・友だち追加後にブラウザへ戻り、「確認する」ボタンで再チェックしてください。</p>
            <p>・うまく遷移しない場合はブラウザを再読み込みしてください。</p>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
